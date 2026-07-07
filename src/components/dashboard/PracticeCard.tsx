import { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { COLORS } from "@/lib/colors";

export interface DescPart {
  t: string;
  hl?: boolean;
}

export interface PracticeMode {
  id: string;
  title: string;
  icon: LucideIcon;
  accentColor: string;
  descParts: DescPart[];
}

interface PracticeCardProps {
  mode: PracticeMode;
  index: number;
  onClick?: (id: string) => void;
}

export default function PracticeCard({ mode, index, onClick }: PracticeCardProps) {
  const Icon = mode.icon;
  const [pressed, setPressed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.965 }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => onClick?.(mode.id)}
      style={{
        background: COLORS.surface,
        border: `1px solid ${pressed ? mode.accentColor + "44" : COLORS.border}`,
        borderRadius: 20,
        padding: "18px 16px",
        cursor: "pointer",
        boxShadow: pressed
          ? `0 0 0 1px ${mode.accentColor}33, 0 8px 32px rgba(0,0,0,0.3), 0 0 40px -10px ${mode.accentColor}66`
          : `0 4px 24px rgba(0,0,0,0.25), 0 0 32px -12px ${mode.accentColor}40`,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -28,
          right: -28,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `${mode.accentColor}0C`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: `${mode.accentColor}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={mode.accentColor} strokeWidth={1.8} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>
          {mode.title}
        </span>
        <span style={{ fontSize: 11.5, color: COLORS.textSecondary, lineHeight: 1.55 }}>
          {mode.descParts.map((part, idx) => (
            <span key={idx} style={part.hl ? { color: mode.accentColor, fontWeight: 600 } : undefined}>
              {part.t}
            </span>
          ))}
        </span>
      </div>
    </motion.div>
  );
          }
