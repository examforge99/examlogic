import { motion } from "framer-motion";
import { Zap, Map, Monitor, Skull } from "lucide-react";
import PracticeCard, { PracticeMode } from "./PracticeCard";
import { COLORS } from "@/lib/colors";

const PRACTICE_MODES: PracticeMode[] = [
  {
    id: "quickfire",
    title: "Quick Fire",
    icon: Zap,
    accentColor: "#3FB7FF",
    descParts: [
      { t: "20 questions", hl: true },
      { t: " in " },
      { t: "15 minutes", hl: true },
      { t: ". Difficulty adjusts to your current rank." },
    ],
  },
  {
    id: "campaign",
    title: "Campaign",
    icon: Map,
    accentColor: "#A78BFA",
    descParts: [
      { t: "Three structured modes: " },
      { t: "Ordinary", hl: true },
      { t: ", " },
      { t: "Speed Test", hl: true },
      { t: ", and " },
      { t: "Accuracy Test", hl: true },
      { t: "." },
    ],
  },
  {
    id: "simulation",
    title: "JAMB Simulation",
    icon: Monitor,
    accentColor: "#34D399",
    descParts: [
      { t: "Full CBT experience. " },
      { t: "Four subjects", hl: true },
      { t: ", " },
      { t: "two hours", hl: true },
      { t: ". Mirrors the real exam." },
    ],
  },
  {
    id: "suddendeath",
    title: "Sudden Death",
    icon: Skull,
    accentColor: "#F87171",
    descParts: [
      { t: "Survive as long as you can. Difficulty " },
      { t: "escalates", hl: true },
      { t: ". Miss the timer and it " },
      { t: "ends", hl: true },
      { t: "." },
    ],
  },
];

interface PracticeSectionProps {
  onSelectMode?: (id: string) => void;
}

export default function PracticeSection({ onSelectMode }: PracticeSectionProps) {
  return (
    <section>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textPrimary,
          marginBottom: 13,
          letterSpacing: "-0.01em",
        }}
      >
        Practice
      </motion.h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 11 }}>
        {PRACTICE_MODES.map((mode, i) => (
          <PracticeCard key={mode.id} mode={mode} index={i} onClick={onSelectMode} />
        ))}
      </div>
    </section>
  );
      }
