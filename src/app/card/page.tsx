import React from 'react';

export default function RecommendedNextStep() {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#6366f1]/30 to-[#1e1b4b]/20 p-[1px] shadow-2xl shadow-black/90 drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]">
      <div className="w-full rounded-[15px] bg-[#0a0f24]/60 backdrop-blur-md p-6 flex flex-row items-center justify-between gap-6">
        
        {/* Left Side: Icon box and text content stacked vertically */}
        <div className="flex flex-col gap-4 items-start">
          {/* Icon Container */}
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
            {/* Golden Bullseye Target Icon */}
            <svg 
              className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>

          {/* Text Content Stacked Vertically */}
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono">
              Recommended Next Step
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Focus on Trigonometry
            </h3>
            <p className="text-sm text-indigo-300 font-medium drop-shadow-[0_0_10px_rgba(165,180,252,0.15)]">
              10-15 minute practice • 15 questions
            </p>
          </div>
        </div>

        {/* Right Side: Action Button */}
        <button className="group relative flex items-center justify-center gap-1 px-5 py-2.5 bg-transparent border border-slate-500 text-slate-100 font-medium text-sm rounded-xl transition-all duration-200 hover:bg-white/5 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] whitespace-nowrap cursor-pointer select-none">
          <span>Start Practice</span>
          <span className="inline-block transform transition-transform duration-200 group-hover:translate-x-1 font-mono">
            &gt;
          </span>
        </button>

      </div>
    </div>
  );
}

