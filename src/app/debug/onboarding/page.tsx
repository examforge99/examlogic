'use client';

import { useEffect, useMemo, useState } from 'react';

type Subject = { id: string; name: string; slug: string };
type Options = {
  subjects: Subject[];
  constraints: {
    required_subject_count: number;
    required_subject_slug: string;
    minimum_study_days: number;
    maximum_study_days: number;
  };
  current: {
    exam_date: string | null;
    study_days: string[] | null;
    daily_hours: number | null;
    subject_ids: string[] | null;
    timetable_created: boolean;
  } | null;
};

const DAYS = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
] as const;

export default function OnboardingPrototype() {
  const [options, setOptions] = useState<Options | null>(null);
  const [examDate, setExamDate] = useState('');
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [dailyHours, setDailyHours] = useState('2');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/onboarding')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Unable to load onboarding.');
        setOptions(data);
        if (data.current) {
          setExamDate(data.current.exam_date ?? '');
          setStudyDays(data.current.study_days ?? []);
          setSubjectIds(data.current.subject_ids ?? []);
          setDailyHours(data.current.daily_hours ? String(data.current.daily_hours) : '2');
        }
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);

  const english = options?.subjects.find((s) => s.slug === 'use-of-english');
  const remainingSubjects = useMemo(
    () => options?.subjects.filter((s) => s.slug !== 'use-of-english') ?? [],
    [options],
  );

  function toggleDay(day: string) {
    setStudyDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

  function toggleSubject(id: string) {
    if (id === english?.id) return;
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < 3 ? [...current, id] : current,
    );
  }

  async function submit() {
    setMessage('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/onboarding/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_date: examDate,
          study_days: studyDays,
          daily_hours: Number(dailyHours),
          subject_ids: english ? [english.id, ...subjectIds] : subjectIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Onboarding failed.');
      setMessage('Setup complete. Your timetable has been created.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main style={styles.page}><div style={styles.shell}>Loading onboarding…</div></main>;

  const selectedCount = (english ? 1 : 0) + subjectIds.length;
  const valid =
    Boolean(examDate) &&
    studyDays.length >= 5 &&
    selectedCount === 4 &&
    Number(dailyHours) > 0 &&
    Boolean(english);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.eyebrow}>EXAMLOGIC · PROTOTYPE</div>
        <h1 style={styles.title}>Set your study rhythm.</h1>
        <p style={styles.sub}>
          Tell ExamLogic when you are writing JAMB and how you want to study. We’ll handle the schedule.
        </p>

        {message && <div style={styles.message}>{message}</div>}

        <section style={styles.section}>
          <label style={styles.label}>Exam date</label>
          <input style={styles.input} type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </section>

        <section style={styles.section}>
          <div style={styles.rowBetween}>
            <label style={styles.label}>Study days</label>
            <span style={styles.counter}>{studyDays.length}/7 · minimum 5</span>
          </div>
          <div style={styles.grid}>
            {DAYS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => toggleDay(value)}
                style={{ ...styles.day, ...(studyDays.includes(value) ? styles.selected : {}) }}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.rowBetween}>
            <label style={styles.label}>JAMB subjects</label>
            <span style={styles.counter}>{selectedCount}/4</span>
          </div>

          {english && (
            <div style={{ ...styles.subject, ...styles.required }}>
              <span>{english.name}</span>
              <span style={styles.badge}>Required</span>
            </div>
          )}

          <div style={styles.subjectGrid}>
            {remainingSubjects.map((subject) => {
              const selected = subjectIds.includes(subject.id);
              return (
                <button key={subject.id} type="button" onClick={() => toggleSubject(subject.id)}
                  style={{ ...styles.subject, ...(selected ? styles.selectedSubject : {}) }}>
                  <span>{subject.name}</span>
                  <span>{selected ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={styles.section}>
          <label style={styles.label}>Daily study time</label>
          <div style={styles.hours}>
            {['1', '1.5', '2', '3', '4'].map((hours) => (
              <button key={hours} type="button" onClick={() => setDailyHours(hours)}
                style={{ ...styles.hour, ...(dailyHours === hours ? styles.selected : {}) }}>
                {hours}h
              </button>
            ))}
          </div>
        </section>

        <button type="button" disabled={!valid || submitting} onClick={submit}
          style={{ ...styles.submit, opacity: !valid || submitting ? 0.45 : 1 }}>
          {submitting ? 'Building your timetable…' : 'Build my timetable →'}
        </button>

        <p style={styles.note}>
          Prototype only. Your choices are sent to the authenticated onboarding API.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0D1117', color: '#F3F4F6', fontFamily: 'Inter, sans-serif', padding: '28px 18px' },
  shell: { width: '100%', maxWidth: 620, margin: '0 auto' },
  eyebrow: { color: '#4FD1C5', fontSize: 12, letterSpacing: 1.6, fontWeight: 700 },
  title: { fontSize: 34, lineHeight: 1.08, margin: '10px 0 10px' },
  sub: { color: '#9CA3AF', lineHeight: 1.6, margin: '0 0 28px' },
  section: { marginTop: 24 },
  label: { display: 'block', fontWeight: 700, marginBottom: 10 },
  rowBetween: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  counter: { color: '#7F8A98', fontSize: 13 },
  input: { width: '100%', boxSizing: 'border-box', padding: '14px 12px', borderRadius: 10, border: '1px solid #2A3440', background: '#151B23', color: '#F3F4F6', fontSize: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 },
  day: { border: '1px solid #2A3440', background: '#151B23', color: '#AAB4C0', padding: '12px 4px', borderRadius: 9, fontWeight: 700 },
  selected: { background: '#4FD1C5', borderColor: '#4FD1C5', color: '#07110F' },
  subjectGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 },
  subject: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2A3440', background: '#151B23', color: '#E5E7EB', padding: '14px 12px', borderRadius: 10, fontWeight: 600 },
  required: { borderColor: '#4FD1C5', color: '#F3F4F6' },
  selectedSubject: { borderColor: '#4FD1C5', background: '#162629' },
  badge: { fontSize: 11, color: '#4FD1C5', textTransform: 'uppercase', letterSpacing: .7 },
  hours: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  hour: { border: '1px solid #2A3440', background: '#151B23', color: '#AAB4C0', padding: '11px 16px', borderRadius: 9, fontWeight: 700 },
  submit: { width: '100%', marginTop: 32, border: 0, borderRadius: 11, padding: '16px', background: '#4FD1C5', color: '#07110F', fontSize: 16, fontWeight: 800 },
  message: { padding: 14, borderRadius: 10, background: '#151B23', border: '1px solid #2A3440', color: '#D1D5DB', marginBottom: 18, lineHeight: 1.5 },
  note: { textAlign: 'center', color: '#66717F', fontSize: 12, marginTop: 14 },
};
