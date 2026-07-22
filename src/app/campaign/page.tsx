// app/campaign/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Layers,
  Sliders,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Minus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  name: string;
  slug: string;
  questionCount: number; // available questions in DB
}

interface Subject {
  id: string;
  name: string;
  slug: string;
  topics: Topic[];
  calibratedBand: number | null; // null = not yet calibrated
}

interface TopicConfig {
  topicId: string;
  questionCount: number;
}

interface SubjectConfig {
  subjectId: string;
  topics: TopicConfig[];
  difficultyOverride: number | null; // null = use calibrated band
}

type Step = "subjects" | "topics" | "difficulty" | "review";

// ─── Mock data (replace with API fetch) ──────────────────────────────────────

const MOCK_SUBJECTS: Subject[] = [
  {
    id: "s1",
    name: "English Language",
    slug: "english",
    calibratedBand: 3,
    topics: [
      { id: "t1", name: "Comprehension", slug: "comprehension", questionCount: 120 },
      { id: "t2", name: "Lexis & Structure", slug: "lexis", questionCount: 95 },
      { id: "t3", name: "Oral English", slug: "oral", questionCount: 60 },
      { id: "t4", name: "Summary Writing", slug: "summary", questionCount: 45 },
    ],
  },
  {
    id: "s2",
    name: "Mathematics",
    slug: "mathematics",
    calibratedBand: 4,
    topics: [
      { id: "t5", name: "Algebra", slug: "algebra", questionCount: 110 },
      { id: "t6", name: "Trigonometry", slug: "trigonometry", questionCount: 75 },
      { id: "t7", name: "Statistics", slug: "statistics", questionCount: 55 },
      { id: "t8", name: "Calculus", slug: "calculus", questionCount: 80 },
    ],
  },
  {
    id: "s3",
    name: "Physics",
    slug: "physics",
    calibratedBand: 2,
    topics: [
      { id: "t9", name: "Mechanics", slug: "mechanics", questionCount: 90 },
      { id: "t10", name: "Waves & Sound", slug: "waves", questionCount: 65 },
      { id: "t11", name: "Electromagnetism", slug: "electromagnetism", questionCount: 70 },
      { id: "t12", name: "Modern Physics", slug: "modern", questionCount: 40 },
    ],
  },
  {
    id: "s4",
    name: "Chemistry",
    slug: "chemistry",
    calibratedBand: null,
    topics: [
      { id: "t13", name: "Organic Chemistry", slug: "organic", questionCount: 100 },
      { id: "t14", name: "Inorganic Chemistry", slug: "inorganic", questionCount: 85 },
      { id: "t15", name: "Physical Chemistry", slug: "physical", questionCount: 70 },
      { id: "t16", name: "Stoichiometry", slug: "stoichiometry", questionCount: 50 },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PER_TOPIC = 30;
const MAX_PER_SUBJECT = 50;
const MAX_TOTAL = 200;

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Basic",
  3: "Moderate",
  4: "Challenging",
  5: "Advanced",
  6: "Expert",
  7: "Elite",
};

const STEPS: { key: Step; label: string }[] = [
  { key: "subjects", label: "Subjects" },
  { key: "topics", label: "Topics" },
  { key: "difficulty", label: "Difficulty" },
  { key: "review", label: "Review" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  background: done
                    ? "#25d6a2"
                    : active
                    ? "linear-gradient(135deg, #6366F1, #3FB7FF)"
                    : "rgba(255,255,255,0.08)",
                  color: done || active ? "#fff" : "rgba(255,255,255,0.3)",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active
                    ? "#fff"
                    : done
                    ? "#25d6a2"
                    : "rgba(255,255,255,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 32,
                  height: 1,
                  background: i < currentIndex
                    ? "#25d6a2"
                    : "rgba(255,255,255,0.1)",
                  margin: "0 8px",
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SessionSummaryBar({
  configs,
  subjects,
  totalQuestions,
}: {
  configs: SubjectConfig[];
  subjects: Subject[];
  totalQuestions: number;
}) {
  const topicsCount = configs.reduce((acc, c) => acc + c.topics.length, 0);
  const pct = Math.round((totalQuestions / MAX_TOTAL) * 100);

  return (
    <div
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BookOpen size={15} color="#6366F1" />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {configs.length} subject{configs.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Layers size={15} color="#6366F1" />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {topicsCount} topic{topicsCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Target size={15} color="#6366F1" />
        <span style={{ fontSize: 13, color: totalQuestions > 0 ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: totalQuestions > 0 ? 600 : 400 }}>
          {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
        </span>
      </div>

      {totalQuestions > 0 && (
        <div style={{ flex: 1, minWidth: 120 }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(pct, 100)}%`,
                borderRadius: 2,
                background:
                  pct >= 90
                    ? "linear-gradient(90deg, #6366F1, #F97316)"
                    : "linear-gradient(90deg, #6366F1, #3FB7FF)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" }}>
            {totalQuestions} / {MAX_TOTAL} max
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step: Subject Selection ─────────────────────────────────────────────────

function SubjectStep({
  subjects,
  selected,
  onToggle,
}: {
  subjects: Subject[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
        Choose which subjects to include. You'll pick specific topics next.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {subjects.map((subject) => {
          const isSelected = selected.includes(subject.id);
          return (
            <button
              key={subject.id}
              onClick={() => onToggle(subject.id)}
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(63,183,255,0.1))"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${isSelected ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s ease",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? "#6366F1" : "rgba(255,255,255,0.2)"}`,
                    background: isSelected ? "#6366F1" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSelected && <Check size={11} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                    {subject.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {subject.topics.length} topics available
                    {subject.calibratedBand
                      ? ` · Band ${subject.calibratedBand}`
                      : " · Not calibrated"}
                  </div>
                </div>
              </div>
              {subject.calibratedBand && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 20,
                    background: "rgba(99,102,241,0.15)",
                    color: "#6366F1",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
                  {DIFFICULTY_LABELS[subject.calibratedBand]}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step: Topic Selection ───────────────────────────────────────────────────

function TopicStep({
  subjects,
  configs,
  onTopicToggle,
  onQuestionCountChange,
  totalQuestions,
}: {
  subjects: Subject[];
  configs: SubjectConfig[];
  onTopicToggle: (subjectId: string, topicId: string) => void;
  onQuestionCountChange: (subjectId: string, topicId: string, count: number) => void;
  totalQuestions: number;
}) {
  const selectedSubjects = subjects.filter((s) =>
    configs.some((c) => c.subjectId === s.id)
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
        Select topics and set question counts. Max {MAX_PER_TOPIC} per topic, {MAX_PER_SUBJECT} per subject.
      </p>

      {selectedSubjects.map((subject) => {
        const config = configs.find((c) => c.subjectId === subject.id)!;
        const subjectTotal = config.topics.reduce((acc, t) => acc + t.questionCount, 0);
        const subjectAtMax = subjectTotal >= MAX_PER_SUBJECT;

        return (
          <div
            key={subject.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {/* Subject header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(99,102,241,0.06)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {subject.name}
              </div>
              <div style={{ fontSize: 12, color: subjectAtMax ? "#F97316" : "rgba(255,255,255,0.4)" }}>
                {subjectTotal} / {MAX_PER_SUBJECT} questions
              </div>
            </div>

            {/* Topics */}
            <div style={{ padding: "8px 0" }}>
              {subject.topics.map((topic) => {
                const topicConfig = config.topics.find((t) => t.topicId === topic.id);
                const isSelected = !!topicConfig;
                const count = topicConfig?.questionCount ?? 10;
                const remaining = MAX_TOTAL - totalQuestions;
                const canAdd = !subjectAtMax && remaining > 0;

                return (
                  <div
                    key={topic.id}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <button
                      onClick={() => onTopicToggle(subject.id, topic.id)}
                      disabled={!isSelected && !canAdd}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `2px solid ${isSelected ? "#6366F1" : "rgba(255,255,255,0.15)"}`,
                        background: isSelected ? "#6366F1" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        cursor: !isSelected && !canAdd ? "not-allowed" : "pointer",
                        opacity: !isSelected && !canAdd ? 0.4 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSelected && <Check size={10} color="#fff" />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isSelected ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: isSelected ? 500 : 400 }}>
                        {topic.name}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                        {topic.questionCount} available
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() =>
                            onQuestionCountChange(subject.id, topic.id, Math.max(1, count - 1))
                          }
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: count <= 1 ? "not-allowed" : "pointer",
                            opacity: count <= 1 ? 0.3 : 1,
                          }}
                        >
                          <Minus size={11} />
                        </button>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: count >= MAX_PER_TOPIC ? "#F97316" : "#fff",
                            minWidth: 20,
                            textAlign: "center",
                          }}
                        >
                          {count}
                        </span>
                        <button
                          onClick={() => {
                            const newCount = count + 1;
                            const newSubjectTotal = subjectTotal - count + newCount;
                            if (
                              newCount <= MAX_PER_TOPIC &&
                              newSubjectTotal <= MAX_PER_SUBJECT &&
                              remaining > 0
                            ) {
                              onQuestionCountChange(subject.id, topic.id, newCount);
                            }
                          }}
                          disabled={
                            count >= MAX_PER_TOPIC ||
                            subjectAtMax ||
                            remaining <= 0
                          }
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor:
                              count >= MAX_PER_TOPIC || subjectAtMax || remaining <= 0
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              count >= MAX_PER_TOPIC || subjectAtMax || remaining <= 0
                                ? 0.3
                                : 1,
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step: Difficulty ────────────────────────────────────────────────────────

function DifficultyStep({
  subjects,
  configs,
  onDifficultyChange,
}: {
  subjects: Subject[];
  configs: SubjectConfig[];
  onDifficultyChange: (subjectId: string, level: number | null) => void;
}) {
  const selectedSubjects = subjects.filter((s) =>
    configs.some((c) => c.subjectId === s.id)
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
        Set difficulty per subject, or leave it on your calibrated band.
      </p>

       {selectedSubjects.map((subject) => {
        const config = configs.find((c) => c.subjectId === subject.id)!;
        const active = config.difficultyOverride ?? subject.calibratedBand ?? 3;
        const isOverriding = config.difficultyOverride !== null;

        return (
          <div
            key={subject.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {subject.name}
              </div>
              {isOverriding && (
                <button
                  onClick={() => onDifficultyChange(subject.id, null)}
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <X size={11} />
                  Reset to calibrated
                </button>
              )}
            </div>

            {/* Level buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((level) => {
                const isCurrent = active === level;
                const isCalibrated = subject.calibratedBand === level && !isOverriding;

                return (
                  <button
                    key={level}
                    onClick={() =>
                      onDifficultyChange(
                        subject.id,
                        level === subject.calibratedBand ? null : level
                      )
                    }
                    title={DIFFICULTY_LABELS[level]}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 8,
                      border: `1px solid ${
                        isCurrent
                          ? "rgba(99,102,241,0.6)"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      background: isCurrent
                        ? "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(63,183,255,0.2))"
                        : isCalibrated
                        ? "rgba(37,214,162,0.08)"
                        : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isCurrent ? 700 : 400,
                        color: isCurrent ? "#fff" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {level}
                    </span>
                    {isCalibrated && (
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#25d6a2",
                          position: "absolute",
                          bottom: 4,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  color: "#6366F1",
                  fontWeight: 600,
                }}
              >
                {DIFFICULTY_LABELS[active]}
              </span>
              {!isOverriding && subject.calibratedBand && (
                <span style={{ color: "#25d6a2" }}>· your calibrated band</span>
              )}
              {isOverriding && (
                <span>· overriding calibrated band {subject.calibratedBand ?? "—"}</span>
              )}
              {!subject.calibratedBand && !isOverriding && (
                <span>· defaulting to Moderate (not calibrated)</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step: Review ─────────────────────────────────────────────────────────────

function ReviewStep({
  subjects,
  configs,
  totalQuestions,
  availabilityError,
}: {
  subjects: Subject[];
  configs: SubjectConfig[];
  totalQuestions: number;
  availabilityError: string | null;
}) {
  const selectedSubjects = subjects.filter((s) =>
    configs.some((c) => c.subjectId === s.id)
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
        Review your session before starting.
      </p>

      {availabilityError && (
        <div
          style={{
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={16} color="#F97316" />
          <span style={{ fontSize: 13, color: "#F97316" }}>{availabilityError}</span>
        </div>
      )}

      {selectedSubjects.map((subject) => {
        const config = configs.find((c) => c.subjectId === subject.id)!;
        const subjectTotal = config.topics.reduce((acc, t) => acc + t.questionCount, 0);
        const diffLabel =
          DIFFICULTY_LABELS[config.difficultyOverride ?? subject.calibratedBand ?? 3];

        return (
          <div
            key={subject.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(99,102,241,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {subject.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "rgba(99,102,241,0.15)",
                    color: "#6366F1",
                    border: "1px solid rgba(99,102,241,0.3)",
                    fontWeight: 600,
                  }}
                >
                  {diffLabel}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {subjectTotal}q
                </span>
              </div>
            </div>

            <div style={{ padding: "6px 0" }}>
              {config.topics.map((topicConfig) => {
                const topic = subject.topics.find((t) => t.id === topicConfig.topicId)!;
                return (
                  <div
                    key={topicConfig.topicId}
                    style={{
                      padding: "7px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      {topic?.name}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                      {topicConfig.questionCount} questions
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(63,183,255,0.06))",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {totalQuestions}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
            total questions · no time limit
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            textAlign: "right",
          }}
        >
          <div>Hints enabled</div>
          <div style={{ color: "#25d6a2", marginTop: 2, fontWeight: 600 }}>
            Self-paced
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignPreflight() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("subjects");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [configs, setConfigs] = useState<SubjectConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalQuestions = useMemo(
    () =>
      configs.reduce(
        (acc, config) =>
          acc + config.topics.reduce((sum, t) => sum + t.questionCount, 0),
        0
      ),
    [configs]
  );

  const canAdvance = useMemo(() => {
    if (step === "subjects") return selectedSubjectIds.length > 0;
    if (step === "topics")
      return configs.every((c) => c.topics.length > 0) && totalQuestions > 0;
    if (step === "difficulty") return true;
    if (step === "review") return totalQuestions > 0 && !availabilityError;
    return false;
  }, [step, selectedSubjectIds, configs, totalQuestions, availabilityError]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      // Sync configs: add new, remove deselected
      setConfigs((prevConfigs) => {
        const existing = prevConfigs.filter((c) => next.includes(c.subjectId));
        const toAdd = next
          .filter((sid) => !prevConfigs.some((c) => c.subjectId === sid))
          .map((sid) => ({ subjectId: sid, topics: [], difficultyOverride: null }));
        return [...existing, ...toAdd];
      });
      return next;
    });
  }

  function toggleTopic(subjectId: string, topicId: string) {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.subjectId !== subjectId) return c;
        const exists = c.topics.some((t) => t.topicId === topicId);
        if (exists) {
          return { ...c, topics: c.topics.filter((t) => t.topicId !== topicId) };
        } else {
          const newCount = Math.min(10, MAX_PER_TOPIC);
          return { ...c, topics: [...c.topics, { topicId, questionCount: newCount }] };
        }
      })
    );
  }

  function changeQuestionCount(subjectId: string, topicId: string, count: number) {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.subjectId !== subjectId) return c;
        return {
          ...c,
          topics: c.topics.map((t) =>
            t.topicId === topicId ? { ...t, questionCount: count } : t
          ),
        };
      })
    );
  }

  function changeDifficulty(subjectId: string, level: number | null) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.subjectId === subjectId ? { ...c, difficultyOverride: level } : c
      )
    );
  }

  function goBack() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  async function goNext() {
    const idx = STEPS.findIndex((s) => s.key === step);

    if (step === "difficulty") {
      // Check availability before review
      setIsLoading(true);
      setAvailabilityError(null);
      try {
        const res = await fetch("/api/campaign/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ configs }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setAvailabilityError(data.error ?? "Some topics don't have enough questions.");
          setStep("review");
          setIsLoading(false);
          return;
        }
      } catch {
        setAvailabilityError("Couldn't verify availability. Check your connection.");
        setStep("review");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    if (step === "review") {
      // Start session
      setIsLoading(true);
      try {
        const res = await fetch("/api/sessions/campaign/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ configs }),
        });
        const data = await res.json();
        if (!res.ok || !data.sessionId) {
          setAvailabilityError(data.error ?? "Couldn't start session. Try again.");
          setIsLoading(false);
          return;
        }
        router.push(`/campaign/${data.sessionId}/practice`);
      } catch {
        setAvailabilityError("Couldn't start session. Check your connection.");
        setIsLoading(false);
      }
      return;
    }

    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071426",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 120px",
      }}
    >
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366F1, #3FB7FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              Campaign
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
              Deliberate practice, your way
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: 24 }}>
          <StepIndicator current={step} />
        </div>

        {/* Session summary bar */}
        {totalQuestions > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SessionSummaryBar
              configs={configs}
              subjects={MOCK_SUBJECTS}
              totalQuestions={totalQuestions}
            />
          </div>
        )}

        {/* Step content card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 16px",
            }}
          >
            {step === "subjects" && "Choose subjects"}
            {step === "topics" && "Pick topics"}
            {step === "difficulty" && "Set difficulty"}
            {step === "review" && "Review session"}
          </h2>

          {step === "subjects" && (
            <SubjectStep
              subjects={MOCK_SUBJECTS}
              selected={selectedSubjectIds}
              onToggle={toggleSubject}
            />
          )}
          {step === "topics" && (
            <TopicStep
              subjects={MOCK_SUBJECTS}
              configs={configs}
              onTopicToggle={toggleTopic}
              onQuestionCountChange={changeQuestionCount}
              totalQuestions={totalQuestions}
            />
          )}
          {step === "difficulty" && (
            <DifficultyStep
              subjects={MOCK_SUBJECTS}
              configs={configs}
              onDifficultyChange={changeDifficulty}
            />
          )}
          {step === "review" && (
            <ReviewStep
              subjects={MOCK_SUBJECTS}
              configs={configs}
              totalQuestions={totalQuestions}
              availabilityError={availabilityError}
            />
          )}
        </div>
    {/* Navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          {stepIndex > 0 && (
            <button
              onClick={goBack}
              disabled={isLoading}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isLoading ? "not-allowed" : "pointer",
                flexShrink: 0,
                opacity: isLoading ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <button
            onClick={goNext}
            disabled={!canAdvance || isLoading}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              border: "none",
              background:
                canAdvance && !isLoading
                  ? "linear-gradient(135deg, #3FB7FF, #6366F1)"
                  : "rgba(255,255,255,0.06)",
              color: canAdvance && !isLoading ? "#fff" : "rgba(255,255,255,0.2)",
              fontSize: 15,
              fontWeight: 700,
              cursor: !canAdvance || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {step === "difficulty" ? "Checking availability…" : "Starting session…"}
              </>
            ) : step === "review" ? (
              <>
                Start Campaign
                <Target size={16} />
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
          }

 
