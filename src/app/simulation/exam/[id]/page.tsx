// app/simulation/exam/[id]/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  option_text: string;
  position: number;
}

interface Question {
  question_id: string;
  position: number;
  subject_id: string;
  topic_id: string;
  difficulty_level: number;
  questions: {
    id: string;
    question_text: string;
  };
  question_options: Option[];
  selected_answer: string | null;
  time_spent_seconds: number;
}

interface Session {
  id: string;
  status: string;
  started_at: string;
  expires_at: string;
  total_questions: number;
}

interface SubjectGroup {
  subject_id: string;
  label: string;
  questions: Question[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const BUFFER_DELAY = 300; // ms after navigation before buffer fires

// ─── Styles ───────────────────────────────────────────────────────────────────

const PAGE_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  background: "#FDF6EC",
  display: "flex",
  flexDirection: "column",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const TOPBAR_STYLE: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "#FDF6EC",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const TIMER_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#1a1a1a",
  whiteSpace: "nowrap" as const,
  letterSpacing: "0.5px",
  flexShrink: 0,
};

const TABS_STYLE: React.CSSProperties = {
  display: "flex",
  flex: 1,
  gap: "4px",
  overflow: "hidden",
};

const SUBMIT_BTN_STYLE: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  background: "#DC2626",
  border: "none",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
  whiteSpace: "nowrap" as const,
};

const CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  padding: "20px 16px",
  maxWidth: "600px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box" as const,
};

const QUESTION_CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  padding: "20px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  marginBottom: "16px",
  border: "1px solid rgba(0,0,0,0.06)",
};

const BOTTOM_BAR_STYLE: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  background: "#FDF6EC",
  borderTop: "1px solid rgba(0,0,0,0.08)",
  padding: "12px 16px",
  boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SimulationExamPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId → optionId
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [heartbeatWarning, setHeartbeatWarning] = useState<string | null>(null);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});

  // Per-question timer refs
  const questionTimers = useRef<Record<string, number>>({});
  const activeQuestionId = useRef<string | null>(null);
  const timerStart = useRef<number | null>(null);

  // ── Timer helpers ──────────────────────────────────────────────────────────

  const pauseCurrentTimer = useCallback(() => {
    if (!activeQuestionId.current || !timerStart.current) return;
    const elapsed = Math.floor((Date.now() - timerStart.current) / 1000);
    const qId = activeQuestionId.current;
    questionTimers.current[qId] = (questionTimers.current[qId] ?? 0) + elapsed;
    timerStart.current = null;
  }, []);

  const startQuestionTimer = useCallback((questionId: string) => {
    pauseCurrentTimer();
    activeQuestionId.current = questionId;
    timerStart.current = Date.now();
  }, [pauseCurrentTimer]);

  const getAccumulatedTime = useCallback((questionId: string): number => {
    const stored = questionTimers.current[questionId] ?? 0;
    if (activeQuestionId.current === questionId && timerStart.current) {
      return stored + Math.floor((Date.now() - timerStart.current) / 1000);
    }
    return stored;
  }, []);

  // ── Current question ───────────────────────────────────────────────────────

  const currentGroup = subjectGroups[activeSubjectIndex];
  const currentQuestion = currentGroup?.questions[activeQuestionIndex];

  // ── Load session ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/simulation/session/${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.session) {
          router.push("/simulation");
          return;
        }

        const { session: s, questions: q } = data;
        setSession(s);

        // Compute time left from DB
        const started = new Date(s.started_at).getTime();
        const expires = new Date(s.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
        setTimeLeft(remaining);

        // Restore existing answers from DB
        const restoredAnswers: Record<string, string> = {};
        q.forEach((qRow: any) => {
          if (qRow.selected_answer) {
            restoredAnswers[qRow.question_id] = qRow.selected_answer;
          }
          // Restore accumulated time
          if (qRow.time_spent_seconds > 0) {
            questionTimers.current[qRow.question_id] = qRow.time_spent_seconds;
          }
        });
        setAnswers(restoredAnswers);

        // Group questions by subject
        const groups = buildSubjectGroups(q);
        setSubjectGroups(groups);

        // Build subject name map
        const nameMap: Record<string, string> = {};
        groups.forEach((g) => { nameMap[g.subject_id] = g.label; });
        setSubjectNames(nameMap);

      } catch {
        router.push("/simulation");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

  // ── Start question timer on mount and question change ──────────────────────

  useEffect(() => {
    if (!currentQuestion) return;
    startQuestionTimer(currentQuestion.question_id);
  }, [currentQuestion?.question_id, startQuestionTimer]);

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft <= 0 || !session) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, session]);

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/simulation/session/${sessionId}/heartbeat`, {
          method: "POST",
        });
        const data = await res.json();

        if (data.status === "terminated") {
          router.push(`/simulation/result/${sessionId}`);
          return;
        }

        if (data.status === "warning") {
          setHeartbeatWarning(data.message);
          setTimeout(() => setHeartbeatWarning(null), 8000);
        } else {
          setHeartbeatWarning(null);
        }
      } catch {
        // Network issue — heartbeat manager handles strikes
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [session, sessionId, router]);

  // ── Buffer answer on question leave ───────────────────────────────────────

  const bufferCurrentAnswer = useCallback(async (questionId: string) => {
    const selectedOptionId = answers[questionId];
    if (!selectedOptionId) return;

    const accumulatedTime = getAccumulatedTime(questionId);

    try {
      await fetch(`/api/simulation/session/${sessionId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          selected_option_id: selectedOptionId,
          time_spent_seconds: accumulatedTime,
        }),
      });
    } catch {
      // Silent — bulk submit catches any missed buffers
    }
  }, [answers, sessionId, getAccumulatedTime]);

  // ── Navigate question ──────────────────────────────────────────────────────

  const navigateToQuestion = useCallback(async (subjectIndex: number, questionIndex: number) => {
    // Buffer current question before leaving
    if (currentQuestion) {
      pauseCurrentTimer();
      await bufferCurrentAnswer(currentQuestion.question_id);
    }

    setActiveSubjectIndex(subjectIndex);
    setActiveQuestionIndex(questionIndex);
  }, [currentQuestion, pauseCurrentTimer, bufferCurrentAnswer]);

  const goNext = useCallback(async () => {
    const group = subjectGroups[activeSubjectIndex];
    if (!group) return;

    if (activeQuestionIndex < group.questions.length - 1) {
      await navigateToQuestion(activeSubjectIndex, activeQuestionIndex + 1);
    } else if (activeSubjectIndex < subjectGroups.length - 1) {
      await navigateToQuestion(activeSubjectIndex + 1, 0);
    }
  }, [activeSubjectIndex, activeQuestionIndex, subjectGroups, navigateToQuestion]);

  const goPrev = useCallback(async () => {
    if (activeQuestionIndex > 0) {
      await navigateToQuestion(activeSubjectIndex, activeQuestionIndex - 1);
    } else if (activeSubjectIndex > 0) {
      const prevGroup = subjectGroups[activeSubjectIndex - 1];
      await navigateToQuestion(activeSubjectIndex - 1, prevGroup.questions.length - 1);
    }
  }, [activeSubjectIndex, activeQuestionIndex, subjectGroups, navigateToQuestion]);

  // ── Select answer ──────────────────────────────────────────────────────────

  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    // Buffer current question first
    if (currentQuestion) {
      pauseCurrentTimer();
      await bufferCurrentAnswer(currentQuestion.question_id);
    }

    try {
      const res = await fetch(`/api/simulation/session/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        router.push(`/simulation/result/${sessionId}`);
      }
    } catch {
      setSubmitting(false);
    }
  }, [submitting, currentQuestion, pauseCurrentTimer, bufferCurrentAnswer, sessionId, answers, router]);

  const handleAutoSubmit = useCallback(async () => {
    try {
      await fetch(`/api/simulation/session/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      router.push(`/simulation/result/${sessionId}`);
    } catch {
      router.push(`/simulation/result/${sessionId}`);
    }
  }, [sessionId, answers, router]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const isTimeCritical = timeLeft < 300; // last 5 minutes

  const getAnsweredCount = (group: SubjectGroup): number => {
    return group.questions.filter((q) => answers[q.question_id]).length;
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...PAGE_STYLE, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "14px", color: "#6B7280" }}>Loading your exam...</div>
      </div>
    );
  }

  if (!session || subjectGroups.length === 0) {
    return (
      <div style={{ ...PAGE_STYLE, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "14px", color: "#6B7280" }}>Session not found</div>
      </div>
    );
  }

  const scrambledOptions = currentQuestion
    ? [...(currentQuestion.question_options ?? [])].sort(
        (a, b) => a.id.localeCompare(b.id) // deterministic scramble per session
      )
    : [];

  return (
    <div style={PAGE_STYLE}>

      {/* ── Top Bar ── */}
      <div style={TOPBAR_STYLE}>

        {/* Timer */}
        <div style={{
          ...TIMER_STYLE,
          color: isTimeCritical ? "#DC2626" : "#1a1a1a",
          minWidth: "70px",
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>

        {/* Subject tabs */}
        <div style={TABS_STYLE}>
          {subjectGroups.map((group, i) => {
            const active = i === activeSubjectIndex;
            const answered = getAnsweredCount(group);
            const total = group.questions.length;
            return (
              <div
                key={group.subject_id}
                onClick={() => navigateToQuestion(i, 0)}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  borderRadius: "8px",
                  background: active ? "#8B5CF6" : "rgba(0,0,0,0.05)",
                  color: active ? "#fff" : "#6B7280",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  textAlign: "center" as const,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  lineHeight: "1.3",
                }}
              >
                <div>{group.label}</div>
                <div style={{ fontSize: "10px", opacity: 0.8 }}>{answered}/{total}</div>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          onClick={() => setSubmitConfirm(true)}
          style={SUBMIT_BTN_STYLE}
        >
          Submit
        </button>
      </div>

      {/* ── Heartbeat warning ── */}
      {heartbeatWarning && (
        <div style={{
          background: "#FEF3C7",
          borderBottom: "1px solid #F59E0B",
          padding: "8px 16px",
          fontSize: "12px",
          color: "#92400E",
          textAlign: "center" as const,
          fontWeight: 600,
        }}>
          ⚠️ {heartbeatWarning}
        </div>
      )}

      {/* ── Main content ── */}
      <div style={CONTENT_STYLE}>

        {currentQuestion ? (
          <>
            {/* Question number */}
            <div style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#9CA3AF",
              marginBottom: "12px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}>
              Question {currentQuestion.position} of {session.total_questions}
            </div>

            {/* Question card */}
            <div style={QUESTION_CARD_STYLE}>
              <div style={{
                fontSize: "15px",
                color: "#1a1a1a",
                lineHeight: "1.7",
                fontWeight: 500,
              }}>
                {currentQuestion.questions?.question_text}
              </div>
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {scrambledOptions.map((option, i) => {
                const selected = answers[currentQuestion.question_id] === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => selectAnswer(currentQuestion.question_id, option.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: selected ? "rgba(139,92,246,0.08)" : "#fff",
                      border: `2px solid ${selected ? "#8B5CF6" : "rgba(0,0,0,0.08)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: selected ? "0 2px 8px rgba(139,92,246,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Label */}
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: selected ? "#8B5CF6" : "rgba(0,0,0,0.06)",
                      color: selected ? "#fff" : "#6B7280",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}>
                      {OPTION_LABELS[i]}
                    </div>

                    {/* Text */}
                    <div style={{
                      fontSize: "14px",
                      color: selected ? "#1a1a1a" : "#374151",
                      fontWeight: selected ? 600 : 400,
                      lineHeight: "1.5",
                      flex: 1,
                    }}>
                      {option.option_text}
                    </div>

                    {/* Selected indicator */}
                    {selected && (
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#8B5CF6",
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" as const, color: "#9CA3AF", paddingTop: "40px" }}>
            No question found
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={BOTTOM_BAR_STYLE}>

        {/* Question grid */}
        <div style={{
          display: "flex",
          flexWrap: "wrap" as const,
          gap: "5px",
          marginBottom: "12px",
          maxHeight: "80px",
          overflowY: "auto" as const,
        }}>
          {currentGroup?.questions.map((q, i) => {
            const answered = !!answers[q.question_id];
            const isCurrent = i === activeQuestionIndex;
            return (
              <div
                key={q.question_id}
                onClick={() => navigateToQuestion(activeSubjectIndex, i)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: isCurrent
                    ? "#8B5CF6"
                      : answered
                    ? "#25d6a2"
                    : "rgba(0,0,0,0.08)",
                  color: isCurrent || answered ? "#fff" : "#9CA3AF",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: isCurrent ? "2px solid #7C3AED" : "2px solid transparent",
                }}
              >
                {q.position}
              </div>
            );
          })}
        </div>

        {/* Prev / Next */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={goPrev}
            disabled={activeSubjectIndex === 0 && activeQuestionIndex === 0}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(0,0,0,0.06)",
              border: "none",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              opacity: activeSubjectIndex === 0 && activeQuestionIndex === 0 ? 0.3 : 1,
            }}
          >
            ← Prev
          </button>
          <button
            onClick={goNext}
            disabled={
              activeSubjectIndex === subjectGroups.length - 1 &&
              activeQuestionIndex === (currentGroup?.questions.length ?? 0) - 1
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              background: "#8B5CF6",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              opacity:
                activeSubjectIndex === subjectGroups.length - 1 &&
                activeQuestionIndex === (currentGroup?.questions.length ?? 0) - 1
                  ? 0.3
                  : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* ── Submit confirm modal ── */}
      {submitConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            width: "100%",
            maxWidth: "340px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>
              Submit Exam?
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px", lineHeight: "1.6" }}>
              You have answered{" "}
              <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                {Object.keys(answers).length}
              </span>{" "}
              of{" "}
              <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                {session.total_questions}
              </span>{" "}
              questions.
            </div>
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "20px" }}>
              Unanswered questions will be marked wrong. This cannot be undone.
            </div>

            {/* Per subject summary */}
            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {subjectGroups.map((g) => {
                const answered = getAnsweredCount(g);
                const total = g.questions.length;
                const allDone = answered === total;
                return (
                  <div key={g.subject_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#374151" }}>{g.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: allDone ? "#25d6a2" : "#F59E0B" }}>
                      {answered}/{total}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setSubmitConfirm(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setSubmitConfirm(false); handleSubmit(); }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  background: submitting ? "rgba(220,38,38,0.3)" : "#DC2626",
                  border: "none",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Build subject groups ─────────────────────────────────────────────────────

function buildSubjectGroups(questions: Question[]): SubjectGroup[] {
  const map = new Map<string, Question[]>();

  for (const q of questions) {
    if (!map.has(q.subject_id)) map.set(q.subject_id, []);
    map.get(q.subject_id)!.push(q);
  }

  const groups: SubjectGroup[] = [];

  for (const [subject_id, qs] of map.entries()) {
    // Derive short label from question count
    // English = 60q, others = 40q
    const isEnglish = qs.length === 60;
    groups.push({
      subject_id,
      label: isEnglish ? "Eng" : `Sub${groups.length}`, // replaced by subject name fetch
      questions: qs.sort((a, b) => a.position - b.position),
    });
  }

  // Sort — English first (largest group)
  return groups.sort((a, b) => b.questions.length - a.questions.length);
                         }
         
