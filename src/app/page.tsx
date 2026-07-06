"use client";

import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Trophy, Swords, BarChart3, Rocket,
  ChevronLeft, ChevronRight,
} from "lucide-react";

/* ============================================================
   ANIMATION CONFIG — tweak these to change the feel.
   duration: how long the cube rotation takes (ms)
   easing: the CSS cubic-bezier curve. (0.25, 1, 0.5, 1) = quick
           start, long smooth deceleration ("premium" feel).
           Try (0.34, 1.56, 0.64, 1) for a springy overshoot,
           or (0.65, 0, 0.35, 1) for a mechanical, even pace.
   dragThreshold: % of screen width you must drag before it
                  commits to the next/prev slide on release.
   autoAdvanceMs: how long each slide stays before auto-advancing.
   ============================================================ */
type AnimConfig = {
  duration: number;
  easing: string;
  dragThreshold: number;
  autoAdvanceMs: number;
};

const ANIM: AnimConfig = {
  duration: 700,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  dragThreshold: 0.22,
  autoAdvanceMs: 5000,
};

/* Per-slide override example — leave empty {} to use ANIM defaults.
   Uncomment/edit to give a specific slide its own timing:
   const SLIDE_ANIM_OVERRIDES: Record<string, Partial<AnimConfig>> = {
     rank: { duration: 900, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
   };
*/
const SLIDE_ANIM_OVERRIDES: Record<string, Partial<AnimConfig>> = {};

function getAnimFor(slideId: string): AnimConfig {
  return { ...ANIM, ...(SLIDE_ANIM_OVERRIDES[slideId] || {}) };
}

/* ============================================================
   SLIDE CONTENT — each slide is its own component below.
   To add a new slide: write a component (copy one of the
   existing ones), then add it to the SLIDES array with a
   unique id.
   ============================================================ */

function DashboardSlide() {
  return (
    <SlideShell
      icon={LayoutDashboard}
      title="Dynamic Dashboard"
      desc="Stay organized with a smooth, responsive dashboard that keeps your progress, practice history, and performance in one place."
    >
      <div className="art-card">
        <div className="art-row">
          <div className="art-avatar" />
          <div className="art-lines">
            <div className="art-line w60" />
            <div className="art-line w40" />
          </div>
        </div>
        <div className="art-stat-grid">
          <div className="art-stat"><div className="art-stat-num">1,240</div><div className="art-stat-label">XP</div></div>
          <div className="art-stat"><div className="art-stat-num">14</div><div className="art-stat-label">Streak</div></div>
          <div className="art-stat"><div className="art-stat-num">86%</div><div className="art-stat-label">Accuracy</div></div>
        </div>
      </div>
    </SlideShell>
  );
}

function RankSlide() {
  const RANKS = [
    { name: "Recruit", color: "#8AA0B8" },
    { name: "Specialist", color: "#3FB7FF" },
    { name: "Vanguard", color: "#4FD1C5" },
    { name: "Legend", color: "#D9A63F" },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % RANKS.length), 850);
    return () => clearInterval(t);
  }, []);

  return (
    <SlideShell
      icon={Trophy}
      title="Rank Up Your Skills"
      desc="Earn ranks as your knowledge and proficiency improve. Track your growth and see how far you've come."
    >
      <div className="art-card art-center">
        <div className="rank-badges">
          {RANKS.map((r, i) => (
            <div
              key={r.name}
              className={`rank-badge ${i === active ? "rank-badge-on" : ""}`}
              style={{
                borderColor: r.color,
                boxShadow: i === active ? `0 0 24px ${r.color}55` : "none",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 48 48">
                <polygon
                  points="24,2 44,14 44,34 24,46 4,34 4,14"
                  fill={i === active ? r.color : "transparent"}
                  stroke={r.color}
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          ))}
        </div>
        <div className="rank-label" style={{ color: RANKS[active].color }}>
          {RANKS[active].name}
        </div>
      </div>
    </SlideShell>
  );
}

function ModesSlide() {
  const modes = ["Quick Fire", "Campaign", "Simulation", "Sudden Death"];
  return (
    <SlideShell
      icon={Swords}
      title="Practice Your Way"
      desc="Choose from topic-based practice, timed quizzes, past questions, and full JAMB simulation exams to prepare with confidence."
    >
      <div className="art-card">
        <div className="mode-grid-art">
          {modes.map((m) => (
            <div key={m} className="mode-chip-art">{m}</div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function LeaderboardSlide() {
  const rows = [
    { name: "Adaeze O.", score: 312, self: false },
    { name: "You", score: 276, self: true },
    { name: "Fatima B.", score: 264, self: false },
  ];
  return (
    <SlideShell
      icon={BarChart3}
      title="Compete on the Leaderboard"
      desc="Compare your performance with other ExamLogic learners and see where you stand nationwide."
    >
      <div className="art-card">
        {rows.map((r, i) => (
          <div key={r.name} className={`lb-row-art ${r.self ? "lb-row-self" : ""}`}>
            <span className="lb-rank-art">{i + 1}</span>
            <span className="lb-name-art">{r.name}</span>
            <span className="lb-score-art">{r.score}</span>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function AuthSlide() {
  return (
    <SlideShell
      icon={Rocket}
      title="Ready to Begin?"
      desc="Start practicing today, challenge yourself, and let ExamLogic help you work toward your target score."
    >
      <div className="art-card art-center">
        <div className="auth-badge">🚀</div>
      </div>
    </SlideShell>
  );
}

/* Shared layout wrapper so every slide has the same icon/title/desc
   structure without repeating markup. */
type SlideShellProps = {
  icon: LucideIcon;
  title: string;
  desc: string;
  children: React.ReactNode;
};

function SlideShell({ icon: Icon, title, desc, children }: SlideShellProps) {
  return (
    <div className="slide-body">
      <div className="icon-badge"><Icon size={24} strokeWidth={2} /></div>
      <div className="slide-card">{children}</div>
      <h1 className="slide-title">{title}</h1>
      <p className="slide-desc">{desc}</p>
    </div>
  );
}

type SlideDef = {
  id: string;
  Component: React.ComponentType;
};

const SLIDES: SlideDef[] = [
  { id: "dashboard", Component: DashboardSlide },
  { id: "rank", Component: RankSlide },
  { id: "modes", Component: ModesSlide },
  { id: "leaderboard", Component: LeaderboardSlide },
  { id: "auth", Component: AuthSlide },
];

/* ============================================================
   ONBOARDING SHELL — cube mechanics, drag handling, nav.
   ============================================================ */
export default function OnboardingFlow() {
  const [index, setIndex] = useState(0);
  const [userActed, setUserActed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [buttonAngle, setButtonAngle] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const stageWidth = useRef(360);
  const isLast = index === SLIDES.length - 1;
  const anim = getAnimFor(SLIDES[index].id);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (clamped === index || dragging) return;
    setUserActed(true);
    // Going forward (Next) → incoming slide should enter from the RIGHT,
    // so the cube rotates NEGATIVE to bring the right-side face forward.
    // Going backward (Previous) → incoming slide enters from the LEFT,
    // cube rotates POSITIVE.
    const dir = clamped > index ? -1 : 1;
    setSettling(true);
    setButtonAngle(dir * 90);
    setTimeout(() => {
      setSettling(false);
      setIndex(clamped);
      setButtonAngle(0);
    }, anim.duration);
  };

  useEffect(() => {
    if (userActed || isLast || dragging) return;
    const t = setInterval(() => {
      setSettling(true);
      setButtonAngle(-90); // auto-advance always moves forward → enters from right
      setTimeout(() => {
        setSettling(false);
        setIndex((i) => (i < SLIDES.length - 1 ? i + 1 : i));
        setButtonAngle(0);
      }, anim.duration);
    }, anim.autoAdvanceMs);
    return () => clearInterval(t);
  }, [userActed, isLast, dragging, anim.duration, anim.autoAdvanceMs]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    stageWidth.current = e.currentTarget.getBoundingClientRect().width || 360;
    setDragging(true);
    setSettling(false);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    let dx = e.touches[0].clientX - touchStartX.current;
    if ((index === 0 && dx > 0) || (index === SLIDES.length - 1 && dx < 0)) dx *= 0.35;
    setDragX(dx);
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null) return;
    const threshold = stageWidth.current * anim.dragThreshold;
    setDragging(false);
    setSettling(true);
    if (dragX <= -threshold && index < SLIDES.length - 1) {
      setUserActed(true);
      setIndex((i) => i + 1);
    } else if (dragX >= threshold && index > 0) {
      setUserActed(true);
      setIndex((i) => i - 1);
    }
    setDragX(0);
    touchStartX.current = null;
    setTimeout(() => setSettling(false), anim.duration);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    touchStartX.current = e.clientX;
    stageWidth.current = e.currentTarget.getBoundingClientRect().width || 360;
    setDragging(true);
    setSettling(false);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || !dragging) return;
    let dx = e.clientX - touchStartX.current;
    if ((index === 0 && dx > 0) || (index === SLIDES.length - 1 && dx < 0)) dx *= 0.35;
    setDragX(dx);
  };

  const onMouseUp = () => {
    if (touchStartX.current !== null) onTouchEnd();
  };

  // Dragging LEFT (dx negative, going to next) rotates the cube NEGATIVE,
  // matching the button logic above — same rule, same direction.
  const dragRatio = Math.max(-1, Math.min(1, dragX / stageWidth.current));
  const dragAngle = dragRatio * 90;

  const renderSlide = (i: number) => {
    const { Component } = SLIDES[i];
    return <Component />;
  };

  return (
    <div className="onboarding">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .onboarding {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, #12306E 0%, #081940 60%, #051230 100%);
          font-family: 'Inter', sans-serif;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 20px 24px;
          overflow: hidden;
          position: relative;
        }

        .progress-row {
          width: 100%;
          max-width: 420px;
          margin-bottom: 36px;
          height: 3px;
          border-radius: 3px;
          background: rgba(255,255,255,0.16);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3FB7FF, #4FD1C5);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .page-stage {
          flex: 1;
          width: 100%;
          max-width: 420px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: pan-y;
          perspective: 900px;
        }

        .cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .cube.settling {
          transition: transform ${ANIM.duration}ms ${ANIM.easing};
        }

        .cube-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          backface-visibility: hidden;
        }
        /* next slide sits on the RIGHT-hand face of the cube */
        .cube-face-next { transform: rotateY(-90deg) translateZ(160px); }
        /* previous slide sits on the LEFT-hand face of the cube */
        .cube-face-prev { transform: rotateY(90deg) translateZ(160px); }
        .cube-face-current { transform: translateZ(160px); }

        .slide-body {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .cube.settling { transition: none; }
        }

        .icon-badge {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 26px;
          color: #4FD1C5;
        }

        .slide-card {
          width: 100%;
          background: #E4E9EE;
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 30px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.5);
          color: #0A2472;
          min-height: 168px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .art-card { width: 100%; }
        .art-center { display: flex; flex-direction: column; align-items: center; }
        .art-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .art-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #3FB7FF, #2B6FD9); flex-shrink: 0; }
        .art-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .art-line { height: 6px; border-radius: 3px; background: #B9C4D2; }
        .w60 { width: 60%; } .w40 { width: 40%; }
        .art-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .art-stat { background: white; border-radius: 10px; padding: 10px 4px; text-align: center; }
        .art-stat-num { font-family: 'Fraunces', serif; font-weight: 700; font-size: 15px; color: #0A2472; }
        .art-stat-label { font-size: 9.5px; color: #5A7290; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }

        .rank-badges { display: flex; gap: 8px; margin-bottom: 12px; }
        .rank-badge {
          width: 44px; height: 44px; border-radius: 10px; border: 1.5px solid;
          display: flex; align-items: center; justify-content: center;
          opacity: 0.35; transform: scale(0.88); transition: all 0.3s ease;
        }
        .rank-badge-on { opacity: 1; transform: scale(1.05); }
        .rank-label { font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; }

        .mode-grid-art { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .mode-chip-art {
          background: white; border-radius: 10px; padding: 12px 8px;
          text-align: center; font-size: 12px; font-weight: 600; color: #14306B;
        }

        .lb-row-art { display: flex; align-items: center; gap: 10px; background: white; border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; font-size: 12.5px; }
        .lb-row-self { background: #DCEBFF; border: 1px solid #3FB7FF66; }
        .lb-rank-art { font-weight: 700; color: #5A7290; width: 14px; }
        .lb-name-art { flex: 1; text-align: left; font-weight: 500; color: #14306B; }
        .lb-score-art { font-weight: 700; color: #0A2472; }

        .auth-badge { font-size: 40px; }

        .slide-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 24px;
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }
        .slide-desc {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(255,255,255,0.65);
          max-width: 340px;
          margin: 0;
        }

        .nav-row {
          width: 100%;
          max-width: 420px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
        }
        .nav-btn-prev {
          background: #3A4A6B;
          color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.08);
          font-weight: 500; font-size: 13.5px;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .nav-btn-prev:disabled { opacity: 0.35; cursor: not-allowed; }

        .nav-btn-next {
          background: linear-gradient(120deg, #0A2472 0%, #0A2472 70%, #4FD1C5 100%);
          color: white;
          border: none;
          font-weight: 700; font-size: 13.5px;
          padding: 12px 22px;
          border-radius: 12px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 8px 22px rgba(10,36,114,0.4);
        }

        .auth-nav-row {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 20px;
        }
        .auth-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .create-account-btn {
          background: linear-gradient(120deg, #B8863F 0%, #D9A63F 55%, #F0C563 100%);
          color: #2B1B04;
          border: none;
          font-weight: 700; font-size: 13.5px;
          padding: 12px 22px;
          border-radius: 12px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 8px 22px rgba(217,166,63,0.35);
        }
        .auth-bottom-row { display: flex; justify-content: center; }
        .sign-in-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.75);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .sign-in-link strong { color: #4FD1C5; font-weight: 600; }
      `}</style>

      <div className="progress-row">
        <div className="progress-fill" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
      </div>

      <div
        className="page-stage"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className={`cube ${settling ? "settling" : ""}`}
          style={{ transform: `translateZ(-160px) rotateY(${dragAngle + buttonAngle}deg)` }}
        >
          {index > 0 && <div className="cube-face cube-face-prev">{renderSlide(index - 1)}</div>}
          <div className="cube-face cube-face-current">{renderSlide(index)}</div>
          {index < SLIDES.length - 1 && <div className="cube-face cube-face-next">{renderSlide(index + 1)}</div>}
        </div>
      </div>

      {!isLast ? (
        <div className="nav-row">
          <button className="nav-btn-prev" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <ChevronLeft size={15} /> Previous
          </button>
          <button className="nav-btn-next" onClick={() => goTo(index + 1)}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      ) : (
        <div className="auth-nav-row">
          <div className="auth-top-row">
            <button className="nav-btn-prev" onClick={() => goTo(index - 1)}>
              <ChevronLeft size={15} /> Previous
            </button>
            <button className="create-account-btn">Create Account</button>
          </div>
          <div className="auth-bottom-row">
            <button className="sign-in-link">
              Already have an account? <strong>Sign In</strong>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
