'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NBAOutput } from '@/lib/nba/types';

type ReadSessionState =
  | 'loading'
  | 'reading'
  | 'submitting'
  | 'transitioning'
  | 'subject-switch'
  | 'complete';

interface ReadSessionProps {
  schedule: NBAOutput[];
  subjectNames: Record<string, string>;
  topicNames: Record<string, string>;
}

const styles = {
  shell: {
    minHeight: '100vh', width: '100%', boxSizing: 'border-box' as const,
    background: '#071426', color: '#D8E0E8', fontFamily: 'var(--font-inter), Inter, sans-serif',
    display: 'flex', flexDirection: 'column' as const,
  },
  topBar: {
    width: '100%', boxSizing: 'border-box' as const, display: 'grid',
    gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, padding: '18px 20px',
  },
  subjectLabel: {
    minWidth: 0, color: '#7D8A9A', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  dots: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: '50%', flex: '0 0 auto' },
  minuteBadge: { justifySelf: 'end', color: '#7D8A9A', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' as const },
  contentWrap: {
    width: '100%', maxWidth: 680, boxSizing: 'border-box' as const,
    margin: '0 auto', padding: '48px 20px 32px', flex: 1,
    display: 'flex', flexDirection: 'column' as const,
  },
  topic: {
    color: '#3FB7FF', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const, marginBottom: 8,
  },
  heading: { color: '#D8E0E8', fontSize: 22, fontWeight: 600, lineHeight: 1.3, margin: 0 },
  card: {
    marginTop: 24, background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  description: { padding: 24, color: '#A8B2C1', fontSize: 15, fontWeight: 400, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const },
  skeleton: { padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 12 },
  skeletonLine: { height: 13, borderRadius: 7, background: 'rgba(255,255,255,0.06)' },
  actionArea: { marginTop: 24 },
  button: {
    width: '100%', height: 52, border: 'none', borderRadius: 12,
    background: '#3FB7FF', color: '#071426', fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
  error: { marginTop: 10, color: '#F97316', fontSize: 13, lineHeight: 1.5 },
  interstitial: {
    minHeight: '100vh', width: '100%', background: '#0F1535',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#3FB7FF', fontSize: 18, fontWeight: 600,
  },
  complete: {
    minHeight: '100vh', width: '100%', background: '#071426',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column' as const, gap: 10, textAlign: 'center' as const,
    padding: 24, boxSizing: 'border-box' as const,
  },
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#25d6a2" strokeWidth="2" />
      <path d="M14 24.5L21 31L34.5 17" stroke="#25d6a2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReadSession({ schedule, subjectNames, topicNames }: ReadSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());
  const [uiState, setUiState] = useState<ReadSessionState>(schedule.length ? 'loading' : 'complete');
  const [error, setError] = useState<string | null>(null);
  const [interstitialSubject, setInterstitialSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!schedule.length) {
      setUiState('complete');
      return;
    }
    setUiState('reading');
  }, [schedule.length]);

  const current = schedule[currentIndex];

  const currentSubjectItems = useMemo(() => {
    if (!current) return [];
    return schedule.filter((item) => item.subject_id === current.subject_id);
  }, [current, schedule]);

  const currentSubjectIndex = useMemo(() => {
    if (!current) return -1;
    return currentSubjectItems.findIndex((item) => item.concept_window_id === current.concept_window_id);
  }, [current, currentSubjectItems]);

  if (uiState === 'complete' || !current) {
    return (
      <>
        <style>{`
          @keyframes readSessionSlideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <main style={{ ...styles.complete, animation: 'readSessionSlideUp 300ms ease-out' }}>
          <CheckIcon />
          <div style={{ color: '#D8E0E8', fontSize: 20, fontWeight: 600 }}>Today's session complete</div>
          <div style={{ color: '#7D8A9A', fontSize: 14 }}>
            You studied {completedIds.size || schedule.length} {schedule.length === 1 ? 'concept' : 'concepts'} today
          </div>
        </main>
      </>
    );
  }

  const isLoading = uiState === 'loading';
  const isSubmitting = uiState === 'submitting';
  const isTransitioning = uiState === 'transitioning';

  async function completeCurrent() {
    if (!current || isSubmitting || isTransitioning || isLoading) return;

    setError(null);
    setUiState('submitting');

    try {
      const response = await fetch('/api/nba/read-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_window_id: current.concept_window_id,
          action_type: current.action_type,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || body?.error || 'Could not save your progress. Try again.');
      }

      setCompletedIds((previous) => {
        const next = new Set(previous);
        next.add(current.concept_window_id);
        return next;
      });

      const nextIndex = currentIndex + 1;

      if (nextIndex >= schedule.length) {
        setUiState('transitioning');
        window.setTimeout(() => setUiState('complete'), 300);
        return;
      }

      const nextItem = schedule[nextIndex];
      const subjectChanged = nextItem.subject_id !== current.subject_id;

      setUiState('transitioning');

      window.setTimeout(() => {
        if (!subjectChanged) {
          setCurrentIndex(nextIndex);
          setUiState('reading');
          return;
        }

        setInterstitialSubject(subjectNames[nextItem.subject_id] || 'Next subject');
        setUiState('subject-switch');

        window.setTimeout(() => {
          setCurrentIndex(nextIndex);
          setInterstitialSubject(null);
          setUiState('reading');
        }, 1200);
      }, 300);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save your progress. Try again.');
      setUiState('reading');
    }
  }

  return (
    <>
      <style>{`
        @keyframes readSessionPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes readSessionShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes readSessionSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes readSessionFadeInOut {
          0% { opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes readSessionSubmitPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.38; }
        }
      `}</style>

      {uiState === 'subject-switch' ? (
        <main style={styles.interstitial}>
          <div style={{ animation: 'readSessionFadeInOut 1200ms ease-in-out both', textAlign: 'center' }}>
            {interstitialSubject}
          </div>
        </main>
      ) : (
        <main style={styles.shell}>
          <header style={styles.topBar}>
            <div style={styles.subjectLabel}>{subjectNames[current.subject_id] || 'Subject'}</div>

            <div
              style={styles.dots}
              aria-label={'Concept ' + (currentSubjectIndex + 1) + ' of ' + currentSubjectItems.length}
            >
              {currentSubjectItems.map((item, index) => {
                const isCompleted = completedIds.has(item.concept_window_id);
                const isCurrent = index === currentSubjectIndex;

                return (
                  <span
                    key={item.concept_window_id}
                    style={{
                      ...styles.dot,
                      background: isCompleted ? '#3FB7FF' : 'rgba(255,255,255,0.15)',
                      animation: isCurrent && !isCompleted ? 'readSessionPulse 1200ms ease-in-out infinite' : 'none',
                    }}
                  />
                );
              })}
            </div>

            <div style={styles.minuteBadge}>~{current.estimated_minutes} min</div>
          </header>

          <div
                        style={{
              ...styles.contentWrap,
              animation: uiState === 'reading' || uiState === 'loading' ? 'readSessionSlideUp 300ms ease-out' : undefined,
              transform: isTransitioning ? 'translateY(-20px)' : undefined,
              opacity: isTransitioning ? 0 : 1,
              transition: isTransitioning ? 'transform 300ms ease-in, opacity 300ms ease-in' : undefined,
              pointerEvents: isTransitioning ? 'none' : 'auto',
            }}
          >
            <div style={styles.topic}>{topicNames[current.topic_id] || 'Topic'}</div>
            <h1 style={styles.heading}>{current.concept_name || 'Concept'}</h1>

            <article style={styles.card}>
              {isLoading || !current.concept_description ? (
                <div style={styles.skeleton} aria-label="Loading concept">
                  {['100%', '80%', '60%'].map((width, index) => (
                    <div
                      key={index}
                      style={{ ...styles.skeletonLine, width, overflow: 'hidden', position: 'relative' }}
                    >
                      <span
                        style={{
                          position: 'absolute', inset: 0, width: '45%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                          animation: 'readSessionShimmer 1400ms ease-in-out infinite',
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.description}>{current.concept_description}</div>
              )}
            </article>

            <div style={styles.actionArea}>
              <button
                type="button"
                onClick={completeCurrent}
                disabled={isLoading || isSubmitting || isTransitioning}
                style={{
                  ...styles.button,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isLoading || isSubmitting || isTransitioning ? 'not-allowed' : 'pointer',
                  animation: isSubmitting ? 'readSessionSubmitPulse 1000ms ease-in-out infinite' : undefined,
                }}
              >
                {isSubmitting ? 'Saving…' : 'Done Reading'}
              </button>

              {error && <div style={styles.error}>{error}</div>}
            </div>
          </div>
        </main>
      )}
    </>
  );
}
