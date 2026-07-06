// app/page.tsx — Root onboarding page
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, BarChart3, Trophy, BookOpen, Users, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────

interface SlideData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}

// ─── Slide Data ──────────────────────────────────────────────────

const SLIDES: SlideData[] = [
  {
    id: 'dashboard',
    title: 'Dynamic Dashboard',
    description: 'Stay organized with a smooth, responsive dashboard that keeps your progress, practice history, and performance in one place.',
    icon: BarChart3,
    preview: (
      <div className="w-full h-40 bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 h-16 bg-white rounded-lg border border-border p-2">
            <div className="w-8 h-2 bg-primary-light rounded mb-2" />
            <div className="w-12 h-4 bg-primary rounded" />
          </div>
          <div className="flex-1 h-16 bg-white rounded-lg border border-border p-2">
            <div className="w-8 h-2 bg-success-light rounded mb-2" />
            <div className="w-12 h-4 bg-success rounded" />
          </div>
        </div>
        <div className="h-16 bg-white rounded-lg border border-border p-2">
          <div className="w-full h-2 bg-surface rounded-full mb-2">
            <div className="w-2/3 h-full bg-primary rounded-full" />
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-2 bg-accent rounded" />
            <div className="w-4 h-2 bg-accent rounded" />
            <div className="w-4 h-2 bg-accent rounded" />
            <div className="w-4 h-2 bg-surface rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ranks',
    title: 'Rank Up Your Skills',
    description: 'Earn ranks as your knowledge and proficiency improve. Track your growth and see how far you\'ve come.',
    icon: Trophy,
    preview: (
      <div className="w-full h-40 bg-surface rounded-xl border border-border p-4 flex items-center justify-center gap-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-warning-light rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-warning" />
          </div>
          <p className="text-xs font-semibold text-text-secondary">Novice</p>
        </div>
        <div className="w-8 h-0.5 bg-border" />
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs font-semibold text-text-secondary">Scholar</p>
        </div>
        <div className="w-8 h-0.5 bg-border" />
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-success-light rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-success" />
          </div>
          <p className="text-xs font-semibold text-text-secondary">Master</p>
        </div>
      </div>
    ),
  },
  {
    id: 'practice',
    title: 'Practice Your Way',
    description: 'Choose from topic-based practice, timed quizzes, past questions, and full JAMB simulation exams to prepare with confidence.',
    icon: BookOpen,
    preview: (
      <div className="w-full h-40 bg-surface rounded-xl border border-border p-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-border p-3">
          <div className="w-6 h-6 bg-primary-light rounded-md flex items-center justify-center mb-2">
            <BookOpen className="w-3 h-3 text-primary" />
          </div>
          <div className="w-16 h-2 bg-surface rounded" />
        </div>
        <div className="bg-white rounded-lg border border-border p-3">
          <div className="w-6 h-6 bg-success-light rounded-md flex items-center justify-center mb-2">
            <BookOpen className="w-3 h-3 text-success" />
          </div>
          <div className="w-16 h-2 bg-surface rounded" />
        </div>
        <div className="bg-white rounded-lg border border-border p-3">
          <div className="w-6 h-6 bg-warning-light rounded-md flex items-center justify-center mb-2">
            <BookOpen className="w-3 h-3 text-warning" />
          </div>
          <div className="w-16 h-2 bg-surface rounded" />
        </div>
        <div className="bg-white rounded-lg border border-border p-3">
          <div className="w-6 h-6 bg-danger-light rounded-md flex items-center justify-center mb-2">
            <BookOpen className="w-3 h-3 text-danger" />
          </div>
          <div className="w-16 h-2 bg-surface rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'leaderboard',
    title: 'Compete on the Leaderboard',
    description: 'Compare your performance with other ExamLogic learners and see where you stand nationwide.',
    icon: Users,
    preview: (
      <div className="w-full h-40 bg-surface rounded-xl border border-border p-4 space-y-2">
        {[
          { rank: 1, name: 'Adaobi M.', score: 320, color: 'bg-warning' },
          { rank: 2, name: 'Chinedu O.', score: 315, color: 'bg-border' },
          { rank: 3, name: 'Fatima A.', score: 310, color: 'bg-warning' },
          { rank: 4, name: 'You', score: 298, color: 'bg-primary', highlight: true },
        ].map((entry) => (
          <div key={entry.rank} className={`flex items-center gap-3 p-2 rounded-lg ${entry.highlight ? 'bg-primary-light border border-primary' : 'bg-white'}`}>
            <div className={`w-6 h-6 ${entry.color} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
              {entry.rank}
            </div>
            <div className="flex-1 h-2 bg-surface rounded-full">
              <div className="h-full bg-accent rounded-full" style={{ width: `${(entry.score / 400) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-text-secondary">{entry.score}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ready',
    title: 'Ready to Begin?',
    description: 'Start practicing today, challenge yourself, and let ExamLogic help you work toward your target score.',
    icon: Rocket,
    preview: (
      <div className="w-full h-40 bg-surface rounded-xl border border-border flex items-center justify-center">
        <div className="text-center space-y-3 animate-streak-pop">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-secondary">Your JAMB journey starts now</p>
        </div>
      </div>
    ),
  },
];

// ─── Auth Screen ─────────────────────────────────────────────────

const AuthScreen = ({ onSignIn, onCreateAccount }: { onSignIn: () => void; onCreateAccount: () => void }) => (
  <div className="animate-slide-up flex flex-col items-center justify-center h-full text-center space-y-8">
    <div className="space-y-3">
      <div className="w-20 h-20 bg-gradient-to-br from-warning to-warning-light rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-warning/20">
        <Rocket className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white">Join ExamLogic</h2>
      <p className="text-white/60 max-w-xs mx-auto text-sm">
        Create your account to start tracking your progress and competing with other JAMBites.
      </p>
    </div>

    <div className="w-full max-w-sm space-y-4">
      <button
        onClick={onCreateAccount}
        className="w-full py-4 rounded-[16px] font-bold text-base text-black 
                   bg-gradient-to-r from-warning via-warning-light to-warning
                   hover:brightness-110
                   active:scale-[0.98] transition-all duration-200
                   shadow-lg shadow-warning/30 hover:shadow-xl hover:shadow-warning/40"
      >
        Create Account
      </button>

      <button
        onClick={onSignIn}
        className="w-full py-3 rounded-[16px] font-medium text-sm text-white/60
                   border border-white/20 hover:border-success hover:text-success
                   transition-all duration-200"
      >
        Already have an account? Sign In
      </button>
    </div>
  </div>
);

// ─── Slide Card ──────────────────────────────────────────────────

const SlideCard = ({ slide }: { slide: SlideData }) => {
  const Icon = slide.icon;
  return (
    <div className="animate-slide-up flex flex-col h-full">
      <div className="mb-6">
        {slide.preview}
      </div>

      <div className="space-y-3 text-center">
        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">{slide.title}</h2>
        <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
          {slide.description}
        </p>
      </div>
    </div>
  );
};

// ─── Main Onboarding Page ────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const totalSlides = SLIDES.length;
  const isLastSlide = currentSlide === totalSlides - 1;

  // Auto-advance every 5 seconds until user interacts
  useEffect(() => {
    if (userInteracted || isAuth) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= totalSlides - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userInteracted, isAuth, totalSlides]);

  const handleInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [userInteracted]);

  const goNext = useCallback(() => {
    handleInteraction();
    if (isLastSlide) {
      setIsAuth(true);
    } else {
      setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
    }
  }, [isLastSlide, handleInteraction, totalSlides]);

  const goPrev = useCallback(() => {
    handleInteraction();
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, [handleInteraction]);

  const goToSlide = useCallback((index: number) => {
    handleInteraction();
    setCurrentSlide(index);
  }, [handleInteraction]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      handleInteraction();
      if (diff > 0 && !isLastSlide) goNext();
      if (diff < 0 && currentSlide > 0) goPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAuth) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, isAuth]);

  return (
    <div
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-dark rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-md">
        {!isAuth ? (
          <>
            {/* Slide Card */}
            <div className="bg-white rounded-[24px] shadow-blue-lg border border-border p-6 md:p-8 min-h-[480px] flex flex-col">
              <SlideCard slide={SLIDES[currentSlide]} />
            </div>

            {/* Slide Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-warning'
                      : index < currentSlide
                      ? 'w-2 bg-white/40'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goPrev}
                disabled={currentSlide === 0}
                className={`flex items-center gap-1 px-4 py-2 rounded-[8px] text-sm font-medium transition-all ${
                  currentSlide === 0
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={goNext}
                className="flex items-center gap-1 px-6 py-2.5 rounded-[8px] text-sm font-semibold text-white
                           bg-gradient-to-r from-primary-dark to-success
                           hover:from-primary hover:to-success-light
                           active:scale-95 transition-all duration-200 shadow-blue"
              >
                {isLastSlide ? 'Get Started' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* Auth Screen */
          <div className="min-h-[480px]">
            <AuthScreen
              onSignIn={() => router.push('/signin')}
              onCreateAccount={() => router.push('/signup')}
            />
          </div>
        )}
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-4 text-center">
        <p className="text-xs text-white/30">ExamLogic — Built for JAMBites</p>
      </div>
    </div>
  );
}
