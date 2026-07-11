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
const options = ["option_a", "option_b", "option_c", "option_d"];

export default function AdminQuestions() {
  const [topics, setTopics] = useState<any[]>([]);
  const [form, setForm] = useState({
    subject_id: "",
    topic_id: "",
    difficulty_level: 3,
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option_id: "",
    explanation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!form.subject_id) return;
    fetch(`/api/admin/topics?subject_id=${form.subject_id}`)
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []))
      .catch(() => setTopics([]));
  }, [form.subject_id]);

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const isValid =
    form.subject_id &&
    form.topic_id &&
    form.question_text.trim() &&
    form.option_a.trim() &&
    form.option_b.trim() &&
    form.option_c.trim() &&
    form.option_d.trim() &&
    form.correct_option_id;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error ?? "Failed to add question" });
      } else {
        setResult({ success: true });
        // Reset form but keep subject/topic
        setForm((prev) => ({
          ...prev,
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_option_id: "",
          explanation: "",
        }));
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>Add Question</div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>Insert questions into the bank</div>

      {/* Subject */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Subject</label>
        <select
          value={form.subject_id}
          onChange={(e) => { update("subject_id", e.target.value); update("topic_id", ""); }}
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
          onChange={(e) => update("topic_id", e.target.value)}
          style={INPUT_STYLE}
          disabled={!form.subject_id || topics.length === 0}
        >
          <option value="">Select topic</option>
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
              onClick={() => update("difficulty_level", d)}
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
          onChange={(e) => update("question_text", e.target.value)}
          placeholder="Enter question text..."
          rows={4}
          style={{ ...INPUT_STYLE, resize: "vertical" as const, lineHeight: "1.5" }}
        />
      </div>

      {/* Options */}
      {["option_a", "option_b", "option_c", "option_d"].map((opt, i) => (
        <div key={opt} style={SECTION_STYLE}>
          <label style={LABEL_STYLE}>Option {String.fromCharCode(65 + i)}</label>
          <input
            value={form[opt as keyof typeof form] as string}
            onChange={(e) => update(opt, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            style={INPUT_STYLE}
          />
        </div>
      ))}

      {/* Correct option */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Correct Answer</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {options.map((opt, i) => (
            <div
              key={opt}
              onClick={() => update("correct_option_id", opt)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: `1.5px solid ${form.correct_option_id === opt ? "#25d6a2" : "rgba(255,255,255,0.08)"}`,
                background: form.correct_option_id === opt ? "rgba(37,214,162,0.1)" : "rgba(255,255,255,0.02)",
                color: form.correct_option_id === opt ? "#25d6a2" : "#7D8A9A",
                fontSize: "13px",
                fontWeight: 700,
                textAlign: "center" as const,
                cursor: "pointer",
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div style={SECTION_STYLE}>
        <label style={LABEL_STYLE}>Explanation (optional)</label>
        <textarea
          value={form.explanation}
          onChange={(e) => update("explanation", e.target.value)}
          placeholder="Why is this the correct answer?"
          rows={3}
          style={{ ...INPUT_STYLE, resize: "vertical" as const, lineHeight: "1.5" }}
        />
      </div>

      {/* Result */}
      {result?.success && (
        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(37,214,162,0.08)", border: "1px solid rgba(37,214,162,0.3)", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", color: "#25d6a2", fontWeight: 600 }}>✓ Question added successfully</div>
        </div>
      )}
      {result?.error && (
        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", color: "#F87171" }}>{result.error}</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        style={!isValid || submitting ? DISABLED_BTN : BTN_STYLE}
      >
        {submitting ? "Adding..." : "Add Question"}
      </button>
    </div>
  );
    }
