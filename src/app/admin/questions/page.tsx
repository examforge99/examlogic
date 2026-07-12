// app/admin/questions/page.tsx

"use client";

import { useState, useEffect } from "react";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#D8E0E8",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#7D8A9A",
  marginBottom: "6px",
  display: "block",
};

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: "16px",
};

const BTN_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #25d6a2, #1aab82)",
  border: "none",
  color: "#071426",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: "8px",
};

const DISABLED_BTN: React.CSSProperties = {
  ...BTN_STYLE,
  background: "rgba(37,214,162,0.2)",
  color: "rgba(255,255,255,0.3)",
  cursor: "not-allowed",
};

const subjects = [
  { id: "96201fc7-9dd9-453d-918f-536d3a831534", name: "English Language" },
  { id: "286efeec-e17e-4695-a2a2-36d5e3e37204", name: "Mathematics" },
  { id: "f25a1b8e-39a0-47b1-b51a-0d0a1881b9e7", name: "Physics" },
  { id: "993c35c9-ab05-480d-b764-25de96fb5dbd", name: "Chemistry" },
  { id: "9fefdb9c-2bbe-4696-85bb-448815be6055", name: "Biology" },
  { id: "b466f464-7e68-40d2-9752-a8415f988cee", name: "Government" },
  { id: "f3778426-a92a-48a0-9b52-7eed8eb935df", name: "Economics" },
  { id: "100948eb-8476-4b77-a7b9-e0de53e7b955", name: "Literature" },
];

const difficulties = [1, 2, 3, 4, 5];

interface Option {
  text: string;
  isCorrect: boolean;
}

interface FormState {
  subject_id: string;
  topic_id: string;
  difficulty_level: number;
  question_text: string;
  explanation: string;
}

export default function AdminQuestions() {
  const [form, setForm] = useState<FormState>({
    subject_id: "",
    topic_id: "",
    difficulty_level: 3,
    question_text: "",
    explanation: "",
  });

  const [options, setOptions] = useState<Option[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const [topics, setTopics] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (!form.subject_id) {
      setTopics([]);
      return;
    }
    fetch(`/api/admin/topics?subject_id=${form.subject_id}`)
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []))
      .catch(() => setTopics([]));
  }, [form.subject_id]);

  const updateForm = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const updateOptionText = (index: number, text: string) => {
    setOptions((prev) => prev.map((o, i) => i === index ? { ...o, text } : o));
    setResult(null);
  };

  const selectCorrect = (index: number) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
    setResult(null);
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...prev,
      question_text: "",
      explanation: "",
    }));
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  };

  const isValid =
    form.subject_id &&
    form.topic_id &&
    form.question_text.trim() &&
    options.every((o) => o.text.trim()) &&
    options.some((o) => o.isCorrect);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: form.subject_id,
          topic_id: form.topic_id,
          difficulty_level: form.difficulty_level,
          question_text: form.question_text,
          options,
          explanation: form.explanation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error ?? "Failed to add question" });
      } else {
        setResult({ success: true });
        resetForm();
      }
    } catch {
      setResult({ error: "Network error. Check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>
        Add Question
      </div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>
        Insert questions into the bank
      </div>

      {/* Subject */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Subject</label>
        <select
          value={form.subject_id}
          onChange={(e) => {
            updateForm("subject_id", e.target.value);
            updateForm("topic_id", "");
          }}
          style={INPUT_STYLE}
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Topic */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Topic</label>
        <select
          value={form.topic_id}
          onChange={(e) => updateForm("topic_id", e.target.value)}
          style={{
            ...INPUT_STYLE,
            opacity: !form.subject_id || topics.length === 0 ? 0.4 : 1,
          }}
          disabled={!form.subject_id || topics.length === 0}
        >
          <option value="">
            {!form.subject_id
              ? "Select a subject first"
              : topics.length === 0
              ? "No topics found"
              : "Select topic"}
          </option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Difficulty */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Difficulty Level</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {difficulties.map((d) => (
            <div
              key={d}
              onClick={() => updateForm("difficulty_level", d)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: `1.5px solid ${form.difficulty_level === d ? "#3FB7FF" : "rgba(255,255,255,0.08)"}`,
                background: form.difficulty_level === d ? "rgba(63,183,255,0.1)" : "rgba(255,255,255,0.02)",
                color: form.difficulty_level === d ? "#3FB7FF" : "#7D8A9A",
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "center" as const,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Question</label>
        <textarea
          value={form.question_text}
          onChange={(e) => updateForm("question_text", e.target.value)}
          placeholder="Enter question text..."
          rows={4}
          style={{ ...INPUT_STYLE, resize: "vertical" as const, lineHeight: "1.6" }}
        />
      </div>

      {/* Options */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Options — tap the circle to mark correct answer</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map((opt, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              {/* Correct selector */}
              <div
                onClick={() => selectCorrect(i)}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: `2px solid ${opt.isCorrect ? "#25d6a2" : "rgba(255,255,255,0.15)"}`,
                  background: opt.isCorrect ? "rgba(37,214,162,0.15)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {opt.isCorrect && (
                  <div style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: "#25d6a2",
                  }} />
                )}
              </div>

              {/* Option input */}
              <input
                value={opt.text}
                onChange={(e) => updateOptionText(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                style={{ ...INPUT_STYLE, marginBottom: 0 }}
              />
            </div>
          ))}
        </div>

        {/* Correct answer hint */}
        {options.some((o) => o.isCorrect) && (
          <div style={{ fontSize: "11px", color: "#25d6a2", marginTop: "8px" }}>
            ✓ Option {options.findIndex((o) => o.isCorrect) + 1} marked as correct
          </div>
        )}
      </div>

      {/* Explanation */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Explanation (optional)</label>
        <textarea
          value={form.explanation}
          onChange={(e) => updateForm("explanation", e.target.value)}
          placeholder="Why is this the correct answer?"
          rows={3}
          style={{ ...INPUT_STYLE, resize: "vertical" as const, lineHeight: "1.6" }}
        />
      </div>

      {/* Result */}
      {result?.success && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(37,214,162,0.08)",
          border: "1px solid rgba(37,214,162,0.3)",
          marginBottom: "12px",
        }}>
          <div style={{ fontSize: "13px", color: "#25d6a2", fontWeight: 600 }}>
            ✓ Question added successfully
          </div>
          <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "3px" }}>
            Subject and topic kept — ready for next question
          </div>
        </div>
      )}

      {result?.error && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          marginBottom: "12px",
        }}>
          <div style={{ fontSize: "13px", color: "#F87171" }}>{result.error}</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        style={!isValid || submitting ? DISABLED_BTN : BTN_STYLE}
      >
        {submitting ? "Adding..." : "Add Question →"}
      </button>
    </div>
  );
}
