import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { 
  Award, 
  BookOpen, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  FileText,
  AlertCircle,
  Play
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";

export default function Dashboard() {
  const { 
    user, 
    flashcards, 
    notes, 
    studySessions, 
    timetables,
    streak,
    productivityScore
  } = useStore();

  // 1. Calculate cards due today
  const dueCards = useMemo(() => {
    const now = Date.now();
    return flashcards.filter(c => !c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= now);
  }, [flashcards]);

  // 2. Identify upcoming exams
  const upcomingExams = useMemo(() => {
    if (!timetables || timetables.length === 0) return [];
    const activeTt = timetables[0];
    if (!activeTt.examDates) return [];

    const today = new Date();
    today.setHours(0,0,0,0);

    return Object.entries(activeTt.examDates)
      .map(([subject, dateStr]) => {
        const examDate = new Date(dateStr + "T00:00:00");
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { subject, dateStr, diffDays };
      })
      .filter(item => item.diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 3);
  }, [timetables]);

  // 3. Fetch today's study schedule from timetable
  const todaySchedule = useMemo(() => {
    if (!timetables || timetables.length === 0) return [];
    const activeTt = timetables[0];
    
    // Get current day string
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = DAYS[new Date().getDay()];
    
    // Find matching day in schedule
    const daySchedule = activeTt.schedule?.find(s => s.day === todayName);
    return daySchedule?.slots?.filter(s => s.subject !== "Break") || [];
  }, [timetables]);

  // 4. Construct weekly study hours chart data
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      // Find total focus minutes logged for this date
      const minutes = studySessions
        .filter(s => s.date === dateStr && (s.type === "focus" || !s.type))
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      data.push({
        name: label,
        hours: Number((minutes / 60).toFixed(1))
      });
    }
    return data;
  }, [studySessions]);

  // 5. Total focus time logged
  const totalFocusTime = useMemo(() => {
    const mins = studySessions
      .filter(s => s.type === "focus" || !s.type)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return mins > 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
  }, [studySessions]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/10">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.displayName || "Student"}!
          </h2>
          <p className="text-brand-100 font-light text-sm max-w-xl">
            You're making great progress! Ready to crush your targets? Complete today's focus block to keep your streak.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center">
            <span className="text-xs text-brand-200 font-semibold uppercase tracking-wider">Streak</span>
            <span className="text-xl font-bold flex items-center gap-1.5 text-amber-300">
              <Award className="w-5 h-5" />
              {streak} Days
            </span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center">
            <span className="text-xs text-brand-200 font-semibold uppercase tracking-wider">Prod Score</span>
            <span className="text-xl font-bold text-emerald-300">
              {productivityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/flashcards" className="glass-card p-6 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Flashcards</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {dueCards.length}
            </p>
            <p className="text-xs text-slate-400">Review cards scheduled for today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
        </Link>

        <Link to="/pomodoro" className="glass-card p-6 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Focus Time</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {totalFocusTime}
            </p>
            <p className="text-xs text-slate-400">Total duration studied this week</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        <Link to="/notes" className="glass-card p-6 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes Library</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {notes.length}
            </p>
            <p className="text-xs text-slate-400">Study guides and notes stored</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
        </Link>

        <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mastery Rate</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {flashcards.length > 0 
                ? `${Math.round((flashcards.filter(f => f.isMastered).length / flashcards.length) * 100)}%`
                : "0%"
              }
            </p>
            <p className="text-xs text-slate-400">Flashcards with high mastery score</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Chart & Schedule Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Weekly Progress</h3>
              <p className="text-xs text-slate-400">Hours spent studying daily</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">Last 7 Days</span>
          </div>

          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderRadius: "12px", 
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: "#fff"
                  }} 
                />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timetable Schedule Widget */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Today's Study Plan</h3>
            <p className="text-xs text-slate-400">Timetable slots for today</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[220px] mt-4 pr-1 space-y-3">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((slot, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">{slot.subject}</span>
                    <span className="text-xs text-slate-400">{slot.type}</span>
                  </div>
                  <div className="text-right space-y-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {slot.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Calendar className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No study blocks scheduled today</p>
                <Link to="/timetable" className="text-xs font-bold text-brand-500 hover:text-brand-600 mt-2 block">
                  Generate Timetable →
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center text-xs">
            <span className="text-slate-400">Active Study Session</span>
            <Link to="/pomodoro" className="flex items-center gap-1 text-brand-500 dark:text-brand-400 font-bold hover:underline">
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Clock
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Exams Widget */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-200/50 dark:border-slate-800/40 mb-4">
          Upcoming Exams
        </h3>
        {upcomingExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingExams.map((exam, i) => (
              <div 
                key={i}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  exam.diffDays <= 3 
                    ? "bg-rose-500/5 border-rose-500/20" 
                    : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{exam.subject}</span>
                  {exam.diffDays <= 3 && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-mono">{exam.dateStr}</span>
                  <span className={`text-sm font-bold ${exam.diffDays <= 3 ? "text-rose-500" : "text-brand-500 dark:text-brand-400"}`}>
                    {exam.diffDays === 0 ? "Today" : `${exam.diffDays} days left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500/60 mb-2" />
            <p className="text-sm font-medium">All caught up! No upcoming exams set.</p>
            <Link to="/timetable" className="text-xs font-bold text-brand-500 hover:text-brand-600 mt-1 block">
              Manage Exam Dates
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
