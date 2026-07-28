'use client'

import { useState } from 'react'

// ─── Types ───────────────────────────────────────────────
interface SignalVector {
  signal_type:          string
  signal_category:      string
  urgency:              number
  severity:             number
  motivation:           number
  empathy:              number
  directness:           number
  positivity:           number
  neglect_factor:       number
  fatigue_tier:         number
  phase:                string
  subject_name:         string
  topic_name:           string
  consecutive_ignores:  number
  recent_accuracy:      number
  days_to_exam:         number
  score_gap:            number
}

interface MessageResult {
  success:          boolean
  message:          string
  structure_used:   string
  situation_type:   string
  dominant_emotion: string
  sentence_1:       string
  sentence_2:       string
  sentence_3:       string
  phase:            string
  error?:           string
}

// ─── Constants ───────────────────────────────────────────
const SIGNAL_TYPES = [
  'subject_avoidance',
  'subject_neglect_streak',
  'topic_decay_risk',
  'false_confidence',
  'calculation_avoidance',
  'simulation_overreliance',
  'plateau',
  'difficulty_ceiling',
  'hard_rest_needed',
]

const SIGNAL_CATEGORIES = [
  'subject_balance',
  'topic_gap',
  'question_type',
  'mode',
  'performance_trend',
  'decay',
  'target_distance',
  'time',
  'behavioural',
  'wellbeing',
]

const PHASES = ['onboarding', 'building', 'committed']

const EMOTION_COLORS: Record<string, string> = {
  urgency:    '#ef4444',
  motivation: '#25d6a2',
  empathy:    '#3FB7FF',
  directness: '#f59e0b',
  positivity: '#a78bfa',
}

const DEFAULTS: SignalVector = {
  signal_type:         'subject_avoidance',
  signal_category:     'subject_balance',
  urgency:             0.7,
  severity:            0.6,
  motivation:          0.5,
  empathy:             0.5,
  directness:          0.6,
  positivity:          0.4,
  neglect_factor:      1.0,
  fatigue_tier:        0,
  phase:               'building',
  subject_name:        'Chemistry',
  topic_name:          '',
  consecutive_ignores: 0,
  recent_accuracy:     0.0,
  days_to_exam:        30,
  score_gap:           49,
}

// ─── Slider Component ─────────────────────────────────────
function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
  color = '#25d6a2',
}: {
  label:    string
  value:    number
  min?:     number
  max?:     number
  step?:    number
  onChange: (v: number) => void
  color?:   string
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '6px',
      }}>
        <span style={{
          fontSize:    '11px',
          fontWeight:  600,
          color:       '#94a3b8',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{
          fontSize:   '13px',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          minWidth:   '36px',
          textAlign:  'right',
        }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px' }}>
        {/* Track background */}
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '3px',
          background:   '#1e293b',
        }} />
        {/* Filled portion */}
        <div style={{
          position:     'absolute',
          left:         0,
          top:          0,
          bottom:       0,
          width:        `${pct}%`,
          borderRadius: '3px',
          background:   color,
          transition:   'width 0.1s ease',
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position:  'absolute',
            inset:     0,
            width:     '100%',
            opacity:   0,
            cursor:    'pointer',
            height:    '100%',
          }}
        />
      </div>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize:      '10px',
      fontWeight:    700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color:         '#475569',
      marginBottom:  '12px',
      marginTop:     '20px',
      paddingBottom: '6px',
      borderBottom:  '1px solid #1e293b',
    }}>
      {children}
    </div>
  )
}

// ─── Select Input ─────────────────────────────────────────
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label:    string
  value:    string
  options:  string[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        fontSize:      '11px',
        fontWeight:    600,
        color:         '#94a3b8',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom:  '6px',
      }}>
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:           '100%',
          background:      '#0f1e35',
          border:          '1px solid #1e3a5f',
          borderRadius:    '8px',
          color:           '#e2e8f0',
          fontSize:        '13px',
          padding:         '8px 12px',
          outline:         'none',
          cursor:          'pointer',
          appearance:      'none',
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Text Input ───────────────────────────────────────────
function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label:       string
  value:       string
  placeholder: string
  onChange:    (v: string) => void
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        fontSize:      '11px',
        fontWeight:    600,
        color:         '#94a3b8',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom:  '6px',
      }}>
        {label}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width:        '100%',
          background:   '#0f1e35',
          border:       '1px solid #1e3a5f',
          borderRadius: '8px',
          color:        '#e2e8f0',
          fontSize:     '13px',
          padding:      '8px 12px',
          outline:      'none',
          boxSizing:    'border-box',
        }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
export default function LanguageLab() {
  const [signals, setSignals] = useState<SignalVector>(DEFAULTS)
  const [result,  setResult]  = useState<MessageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<MessageResult[]>([])

  function update<K extends keyof SignalVector>(key: K, value: SignalVector[K]) {
    setSignals(prev => ({ ...prev, [key]: value }))
  }

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/language/construct', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...signals,
          recent_accuracy: signals.recent_accuracy === 0 ? null : signals.recent_accuracy,
          topic_name:      signals.topic_name || null,
        }),
      })
      const data: MessageResult = await res.json()
      setResult(data)
      if (data.success) {
        setHistory(prev => [data, ...prev].slice(0, 5))
      }
    } catch (err) {
      setResult({
        success:          false,
        message:          '',
        structure_used:   '',
        situation_type:   '',
        dominant_emotion: '',
        sentence_1:       '',
        sentence_2:       '',
        sentence_3:       '',
        phase:            '',
        error:            'Network error',
      })
    } finally {
      setLoading(false)
    }
  }

  const emotionColor = result?.dominant_emotion
    ? EMOTION_COLORS[result.dominant_emotion] ?? '#25d6a2'
    : '#25d6a2'

  return (
    <div style={{
      minHeight:   '100vh',
      background:  '#071426',
      color:       '#e2e8f0',
      fontFamily:  'system-ui, -apple-system, sans-serif',
      display:     'flex',
      gap:         '0',
    }}>

      {/* ── LEFT PANEL: Controls ── */}
      <div style={{
        width:      '340px',
        minWidth:   '340px',
        borderRight: '1px solid #1e293b',
        overflowY:  'auto',
        padding:    '24px 20px',
        display:    'flex',
        flexDirection: 'column',
        gap:        '0',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize:    '11px',
            fontWeight:  700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:       '#25d6a2',
            marginBottom: '4px',
          }}>
            ExamLogic
          </div>
          <div style={{
            fontSize:   '18px',
            fontWeight: 700,
            color:      '#f1f5f9',
          }}>
            Language Lab
          </div>
          <div style={{
            fontSize: '12px',
            color:    '#475569',
            marginTop: '4px',
          }}>
            Dial signal values → generate message
          </div>
        </div>

        {/* Signal Identity */}
        <SectionLabel>Signal Identity</SectionLabel>

        <Select
          label="Signal Type"
          value={signals.signal_type}
          options={SIGNAL_TYPES}
          onChange={v => update('signal_type', v)}
        />

        <Select
          label="Signal Category"
          value={signals.signal_category}
          options={SIGNAL_CATEGORIES}
          onChange={v => update('signal_category', v)}
        />

        <Select
          label="Student Phase"
          value={signals.phase}
          options={PHASES}
          onChange={v => update('phase', v)}
        />

        <TextInput
          label="Subject Name"
          value={signals.subject_name}
          placeholder="e.g. Chemistry"
          onChange={v => update('subject_name', v)}
        />

        <TextInput
          label="Topic Name (optional)"
          value={signals.topic_name}
          placeholder="e.g. Organic Chemistry"
          onChange={v => update('topic_name', v)}
        />

        {/* Signal Scores */}
        <SectionLabel>Signal Vector</SectionLabel>

        <Slider label="Urgency"     value={signals.urgency}     onChange={v => update('urgency', v)}     color="#ef4444" />
        <Slider label="Severity"    value={signals.severity}    onChange={v => update('severity', v)}    color="#f97316" />
        <Slider label="Motivation"  value={signals.motivation}  onChange={v => update('motivation', v)}  color="#25d6a2" />
        <Slider label="Empathy"     value={signals.empathy}     onChange={v => update('empathy', v)}     color="#3FB7FF" />
        <Slider label="Directness"  value={signals.directness}  onChange={v => update('directness', v)}  color="#f59e0b" />
        <Slider label="Positivity"  value={signals.positivity}  onChange={v => update('positivity', v)}  color="#a78bfa" />

        {/* Context */}
        <SectionLabel>Context</SectionLabel>

        <Slider
          label="Neglect Factor"
          value={signals.neglect_factor}
          min={1.0} max={2.0} step={0.1}
          onChange={v => update('neglect_factor', v)}
          color="#f59e0b"
        />

        <Slider
          label="Consecutive Ignores"
          value={signals.consecutive_ignores}
          min={0} max={10} step={1}
          onChange={v => update('consecutive_ignores', v)}
          color="#f97316"
        />

        <Slider
          label="Fatigue Tier (0–3)"
          value={signals.fatigue_tier}
          min={0} max={3} step={1}
          onChange={v => update('fatigue_tier', v)}
          color="#ef4444"
        />

        <Slider
          label="Recent Accuracy"
          value={signals.recent_accuracy}
          onChange={v => update('recent_accuracy', v)}
          color="#25d6a2"
        />

        <Slider
          label="Days to Exam"
          value={signals.days_to_exam}
          min={1} max={90} step={1}
          onChange={v => update('days_to_exam', v)}
          color="#3FB7FF"
        />

        <Slider
          label="Score Gap"
          value={signals.score_gap}
          min={0} max={200} step={1}
          onChange={v => update('score_gap', v)}
          color="#a78bfa"
        />

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={loading}
          style={{
            marginTop:     '24px',
            width:         '100%',
            padding:       '14px',
            background:    loading ? '#0f2d1f' : '#25d6a2',
            color:         loading ? '#25d6a2' : '#071426',
            border:        'none',
            borderRadius:  '10px',
            fontSize:      '14px',
            fontWeight:    700,
            cursor:        loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
            transition:    'all 0.15s ease',
          }}
        >
          {loading ? 'Generating...' : 'Generate Message'}
        </button>

      </div>

      {/* ── RIGHT PANEL: Output ── */}
      <div style={{
        flex:      1,
        padding:   '32px',
        overflowY: 'auto',
        display:   'flex',
        flexDirection: 'column',
        gap:       '24px',
      }}>

        {/* Current Result */}
        {result ? (
          result.success ? (
            <div>
              {/* Main message card */}
              <div style={{
                background:   '#0a1929',
                border:       `1px solid ${emotionColor}33`,
                borderLeft:   `3px solid ${emotionColor}`,
                borderRadius: '12px',
                padding:      '28px',
                marginBottom: '20px',
              }}>
                <div style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '10px',
                  marginBottom:  '20px',
                }}>
                  <div style={{
                    fontSize:    '10px',
                    fontWeight:  700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:       emotionColor,
                    background:  `${emotionColor}15`,
                    padding:     '4px 10px',
                    borderRadius: '4px',
                  }}>
                    {result.situation_type}
                  </div>
                  <div style={{
                    fontSize:    '10px',
                    fontWeight:  700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:       '#475569',
                    background:  '#0f1e35',
                    padding:     '4px 10px',
                    borderRadius: '4px',
                  }}>
                    {result.structure_used}
                  </div>
                  <div style={{
                    fontSize:    '10px',
                    fontWeight:  700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color:       '#475569',
                    background:  '#0f1e35',
                    padding:     '4px 10px',
                    borderRadius: '4px',
                  }}>
                    Phase: {result.phase}
                  </div>
                </div>

                {/* The message */}
                <div style={{
                  fontSize:   '22px',
                  fontWeight: 600,
                  color:      '#f1f5f9',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}>
                  {result.message}
                </div>

                {/* Dominant emotion */}
                <div style={{
                  marginTop:  '16px',
                  fontSize:   '12px',
                  color:      '#475569',
                }}>
                  Dominant emotion:{' '}
                  <span style={{ color: emotionColor, fontWeight: 600 }}>
                    {result.dominant_emotion}
                  </span>
                </div>
              </div>

              {/* Sentence breakdown */}
              <div style={{
                background:   '#0a1929',
                border:       '1px solid #1e293b',
                borderRadius: '12px',
                padding:      '20px',
              }}>
                <div style={{
                  fontSize:      '10px',
                  fontWeight:    700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         '#475569',
                  marginBottom:  '16px',
                }}>
                  Sentence Breakdown
                </div>

                {[
                  { label: 'S1', text: result.sentence_1, color: '#3FB7FF' },
                  { label: 'S2', text: result.sentence_2, color: '#25d6a2' },
                  { label: 'S3', text: result.sentence_3, color: '#a78bfa' },
                ].filter(s => s.text).map(s => (
                  <div key={s.label} style={{
                    display:      'flex',
                    gap:          '12px',
                    marginBottom: '12px',
                    alignItems:   'flex-start',
                  }}>
                    <div style={{
                      minWidth:     '24px',
                      height:       '24px',
                      borderRadius: '4px',
                      background:   `${s.color}20`,
                      color:        s.color,
                      fontSize:     '10px',
                      fontWeight:   700,
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize:   '14px',
                      color:      '#cbd5e1',
                      lineHeight: 1.5,
                      paddingTop: '3px',
                    }}>
                      {s.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background:   '#1a0a0a',
              border:       '1px solid #ef444433',
              borderRadius: '12px',
              padding:      '24px',
              color:        '#ef4444',
              fontSize:     '14px',
            }}>
              Error: {result.error}
            </div>
          )
        ) : (
          /* Empty state */
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            color:          '#1e3a5f',
            textAlign:      'center',
            padding:        '60px 20px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e3a5f' }}>
              Dial the signals and hit Generate
            </div>
            <div style={{ fontSize: '13px', color: '#0f2d40', marginTop: '8px' }}>
              The language engine will construct a message based on your input
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div>
            <div style={{
              fontSize:      '10px',
              fontWeight:    700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:         '#475569',
              marginBottom:  '12px',
            }}>
              Previous Generations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.slice(1).map((h, i) => (
                <div key={i} style={{
                  background:   '#0a1929',
                  border:       '1px solid #1e293b',
                  borderRadius: '10px',
                  padding:      '16px',
                  opacity:      1 - (i * 0.2),
                }}>
                  <div style={{
                    fontSize:   '13px',
                    color:      '#64748b',
                    marginBottom: '6px',
                    fontSize:   '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {h.structure_used} · {h.dominant_emotion}
                  </div>
                  <div style={{
                    fontSize:   '14px',
                    color:      '#94a3b8',
                    lineHeight: 1.5,
                  }}>
                    {h.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
