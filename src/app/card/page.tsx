import React from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  FileText, 
  Search, 
  BarChart3, 
  Trophy, 
  Users, 
  MoreHorizontal, 
  Crown, 
  Flame, 
  Bell, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  TrendingUp, 
  ChevronRight, 
  Target, 
  AlertTriangle, 
  XOctagon, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function DashboardRecreation() {
  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 font-sans flex flex-row">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#070c20]/80 border-r border-slate-800/50 p-6 flex flex-col justify-between hidden md:flex backdrop-blur-xl">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-sm rotate-45" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Exam<span className="text-emerald-400">Logic</span></span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <SidebarLink icon={<Dumbbell size={18} />} label="Practice" active />
            <SidebarLink icon={<FileText size={18} />} label="Tests" />
            <SidebarLink icon={<Search size={18} />} label="Review" />
            <SidebarLink icon={<BarChart3 size={18} />} label="Progress" />
            <SidebarLink icon={<Trophy size={18} />} label="Rankings" />
            <SidebarLink icon={<Users size={18} />} label="Community" />
            <SidebarLink icon={<MoreHorizontal size={18} />} label="More" />
          </nav>
        </div>

        {/* Premium Upgrade Button */}
        <button className="w-full mt-auto p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 flex items-center justify-between group hover:border-amber-400/50 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <Crown size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Upgrade to</p>
              <p className="text-sm font-bold text-white">Premium</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* 2. TOP HEADER BAR */}
        <header className="flex items-center justify-between mb-8">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Test Results</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="text-sm font-semibold text-orange-400">12 Day Streak</span>
            </div>
            {/* Notifications */}
            <button className="p-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors cursor-pointer text-slate-300">
              <Bell size={18} />
            </button>
            {/* Profile Avatar */}
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* 3. TEST SUMMARY INFO */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">JAMB Practice Test</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Mathematics
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">May 19, 2026</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">45 Questions</span>
          </div>
        </section>

        {/* 4. DASHBOARD METRICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* Main Ring Score Card */}
          <div className="lg:col-span-8 bg-[#090e24]/60 border border-slate-800/60 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 justify-around backdrop-blur-md shadow-2xl">
            {/* Breakdowns Left */}
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <ScoreBreakdownBox icon={<CheckCircle2 size={16} className="text-emerald-400" />} title="Correct" count="35" percent="78%" color="text-emerald-400" />
              <ScoreBreakdownBox icon={<XCircle size={16} className="text-rose-400" />} title="Incorrect" count="10" percent="22%" color="text-rose-400" />
              <ScoreBreakdownBox icon={<MinusCircle size={16} className="text-slate-400" />} title="Unattempted" count="0" percent="0%" color="text-slate-400" />
            </div>

            {/* Futuristic Orbit Scoring Ring */}
            <div className="relative flex flex-col items-center justify-center p-4">
              <div className="w-48 h-48 rounded-full border-8 border-dashed border-slate-800 flex items-center justify-center relative">
                {/* Glowing Outer Edge Aura Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 opacity-80 blur-[2px]" />
                
                {/* Main Score Metrics inside Ring */}
                <div className="text-center z-10">
                  <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">Your Score</p>
                  <p className="text-5xl font-black text-white my-1 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">78%</p>
                  <div className="w-12 h-[1px] bg-slate-700 mx-auto my-1" />
                  <p className="text-sm font-semibold text-slate-300">35 / 45</p>
                </div>
              </div>
              
              {/* Decorative Sci-Fi Orbit Rings */}
              <div className="absolute w-56 h-20 border border-indigo-500/20 rounded-[100%] rotate-[-15deg] pointer-events-none" />
              <div className="absolute w-56 h-20 border border-emerald-500/20 rounded-[100%] rotate-[35deg] pointer-events-none" />

              <div className="text-center mt-6">
                <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5 text-base">
                  Good Job! <Sparkles size={16} className="fill-emerald-400" />
                </p>
                <p className="text-xs text-slate-400 mt-1">You scored higher than 68% of ExamLogic users</p>
              </div>
            </div>
          </div>

          {/* Sidebar Metadata Right Stats */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#090e24]/60 border border-slate-800/60 rounded-2xl p-5 flex-1 flex flex-col justify-between gap-4 backdrop-blur-md">
              <StatRow label="Accuracy" value="78%" valColor="text-emerald-400" />
              <StatRow label="Time Taken" value="38m 24s" />
              <StatRow label="Avg. Time / Q" value="51s" />
              <StatRow label="Total Marks" value="175 / 400" />
            </div>

            {/* Performance Mini Chart Widget */}
            <div className="bg-[#090e24]/60 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Performance Trend</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <TrendingUp size={12} /> +18% <span className="text-[10px] text-slate-400 font-normal">Improvement</span>
                </span>
              </div>
              {/* Mini Sparkline Mock */}
              <div className="h-16 flex items-end justify-between gap-2 px-1 pt-4">
                <div className="w-full h-[30%] bg-slate-800/60 rounded-t-sm relative group"><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">Apr 10</div></div>
                <div className="w-full h-[55%] bg-slate-800/60 rounded-t-sm relative group"></div>
                <div className="w-full h-[45%] bg-indigo-500/30 border-t-2 border-indigo-500 rounded-t-sm relative group"></div>
                <div className="w-full h-[80%] bg-emerald-500/30 border-t-2 border-emerald-400 rounded-t-sm relative group"></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 px-1 mt-2 font-mono">
                <span>Apr 10</span>
                <span>Apr 24</span>
                <span>May 08</span>
                <span>May 19</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Spectrum Progress Slider Indicator */}
        <div className="w-full bg-[#090e24]/60 border border-slate-800/60 rounded-xl p-4 mb-6 flex flex-col gap-2">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-emerald-500 to-emerald-400 relative">
            <div className="absolute top-1/2 left-[78%] -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1 uppercase tracking-wider">
            <span className="text-red-400/80">Needs Improvement</span>
            <span className="text-yellow-400/80">Average</span>
            <span className="text-emerald-400/80">Good</span>
            <span className="text-emerald-300">Excellent</span>
          </div>
        </div>

        {/* 5. BOTTOM TWIN INSIGHTS SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Left Block: Topic Breakdown Analysis */}
          <div className="bg-[#090e24]/60 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800/60 pb-2">Topic Breakdown</h3>
              <div className="flex flex-col gap-4">
                <TopicProgressRow name="Algebra" score="15 / 20" accuracy="75%" color="bg-emerald-500" width="w-[75%]" />
                <TopicProgressRow name="Trigonometry" score="9 / 15" accuracy="60%" color="bg-amber-500" width="w-[60%]" />
                <TopicProgressRow name="Geometry" score="7 / 10" accuracy="70%" color="bg-emerald-500" width="w-[70%]" />
                <TopicProgressRow name="Number System" score="2 / 10" accuracy="20%" color="bg-red-500" width="w-[20%]" />
                <TopicProgressRow name="Statistics" score="2 / 5" accuracy="40%" color="bg-orange-500" width="w-[40%]" />
              </div>
            </div>
            <button className="w-full mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors group cursor-pointer">
              <span>View Full Analysis</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Right Block: Smart Insights Analysis */}
          <div className="bg-[#090e24]/60 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800/60 pb-2">Smart Insights</h3>
              <div className="flex flex-col gap-4">
                <InsightRow 
                  icon={<CheckCircle2 size={16} className="text-emerald-400" />} 
                  bg="bg-emerald-500/10 border-emerald-500/20"
                  text={<>You're doing great in <span className="text-white font-semibold">Algebra</span>! Keep practicing to strengthen it even more.</>} 
                />
                <InsightRow 
                  icon={<AlertTriangle size={16} className="text-amber-400" />} 
                  bg="bg-amber-500/10 border-amber-500/20"
                  text={<><span className="text-amber-400 font-semibold underline decoration-amber-400/40">Trigonometry</span> needs more attention. Focus on basic identities and formulas.</>} 
                />
                <InsightRow 
                  icon={<XOctagon size={16} className="text-red-400" />} 
                  bg="bg-red-500/10 border-red-500/20"
                  text={<><span className="text-red-400 font-semibold">Number System</span> is your weakest area. We recommend focused practice.</>} 
                />
              </div>
            </div>
            <button className="w-full mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors group cursor-pointer">
              <span>View All Insights</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 6. RECOMMENDED ACTION BANNER BAR FOOTERS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recommended Action Card */}
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#6366f1]/30 to-[#1e1b4b]/20 p-[1px] shadow-2xl drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <div className="w-full h-full rounded-[15px] bg-[#0a0f24]/80 backdrop-blur-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner shrink-0">
                  <Target className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Recommended Next Step</span>
                  <h4 className="text-base font-bold text-white tracking-wide mt-0.5">Focus on Trigonometry</h4>
                  <p className="text-xs text-indigo-300 mt-0.5">10-15 minute practice • 15 questions</p>
                </div>
              </div>
              <button className="group flex items-center justify-center gap-1 px-4 py-2 bg-transparent border border-slate-600 hover:border-white text-slate-100 font-medium text-xs rounded-xl transition-all duration-200 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] whitespace-nowrap cursor-pointer">
                <span>Start Practice</span>
                <ChevronRight size={14} className="transform transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Review Mistakes Card */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0a0f24]/60 border border-slate-800/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Review Your Mistakes</h4>
                <p className="text-xs text-slate-400 mt-0.5">Go through the 10 questions you got wrong.</p>
              </div>
            </div>
            <button className="flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer whitespace-nowrap">
              <span>Review Now</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}

/* HELPER COMPONENT: SIDEBAR LINK */
function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
        active 
          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
      }`}
    >
      <span className={active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}>
        {icon}
      </span>
      <span>{label}</span>
    </a>
  );
}

/* HELPER COMPONENT: LEFT SCORE SUMMARY PILLS */
function ScoreBreakdownBox({ icon, title, count, percent, color }: { icon: React.ReactNode; title: string; count: string; percent: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-8 bg-slate-900/30 border border-slate-800/40 rounded-xl px-4 py-2 w-full md:w-44">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-400">{title}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">{count}</p>
        <p className={`text-[10px] font-semibold ${color}`}>{percent}</p>
      </div>
    </div>
  );
}

/* HELPER COMPONENT: TOP RIGHT GENERAL STATS ROWS */
function StatRow({ label, value, valColor = 'text-white' }: { label: string; value: string; valColor?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className={`text-sm font-bold ${valColor}`}>{value}</span>
    </div>
  );
}

/* HELPER COMPONENT: TOPIC LINE BREAKDOWNS */
function TopicProgressRow({ name, score, accuracy, color, width }: { name: string; score: string; accuracy: string; color: string; width: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="w-24 font-medium text-slate-300 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: accuracy }} />
      </div>
      <span className="w-12 text-right text-slate-400 font-mono">{score}</span>
      <span className={`w-8 text-right font-bold ${color.replace('bg-', 'text-')}`}>{accuracy}</span>
    </div>
  );
}

/* HELPER COMPONENT: SMART INSIGHTS ITEM BOX */
function InsightRow({ icon, bg, text }: { icon: React.ReactNode; bg: string; text: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}
