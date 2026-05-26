import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFirestore } from "../hooks/useFirestore";
import { 
  Award, 
  BookOpen, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  FileText,
  AlertCircle,
  Play,
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    flashcards, 
    notes, 
    studySessions, 
    timetables,
    streak,
    productivityScore,
    saveTimetable
  } = useFirestore();

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
      .slice(0, 4);
  }, [timetables]);

  // 3. Fetch today's study schedule from timetable
  const todaySchedule = useMemo(() => {
    if (!timetables || timetables.length === 0) return [];
    const activeTt = timetables[0];
    
    // Get current day string
    const today = new Date();
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = DAYS[today.getDay()];
    const utcDateStr = today.toISOString().split("T")[0];
    
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const localDateStr = `${yyyy}-${mm}-${dd}`;
    
    // Find matching day in schedule
    const daySchedule = activeTt.schedule?.find(s => 
      s.day === todayName || 
      s.day === utcDateStr || 
      s.day === localDateStr
    );
    return daySchedule?.slots?.filter(s => s.subject !== "Break") || [];
  }, [timetables]);

  const handleCompleteExam = async (subject) => {
    if (!timetables || timetables.length === 0) return;
    const activeTt = timetables[0];
    const newExamDates = { ...activeTt.examDates };
    delete newExamDates[subject];
    
    await saveTimetable({
      ...activeTt,
      examDates: newExamDates
    });
  };

  // 4. Total focus time logged
  const totalFocusTime = useMemo(() => {
    const mins = studySessions
      .filter(s => s.type === "focus" || !s.type)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return mins > 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
  }, [studySessions]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner - Premium Light/Dark */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 sm:p-10 rounded-[2rem] border border-brand-200/50 dark:border-brand-900/40 bg-gradient-to-br from-brand-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 shadow-xl shadow-brand-100/50 dark:shadow-none">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-300 rounded-full blur-[80px] opacity-20 dark:opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-green-300 rounded-full blur-[80px] opacity-30 dark:opacity-10 pointer-events-none"></div>

        <div className="space-y-3 z-10">
          <div className="flex items-center gap-2 text-brand-500 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Dashboard</span>
          </div>
          <h2 className="amita-bold text-3xl sm:text-4xl tracking-tight text-slate-800 dark:text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-green-500">{user?.displayName || "Scholar"}</span>
          </h2>
          <p className="amita-regular text-slate-600 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
            Your premium learning journey continues. Ready to focus and achieve your goals today?
          </p>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0 z-10">
          <div className="px-6 py-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/80 dark:border-slate-700 flex flex-col items-center shadow-lg shadow-brand-500/5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Streak</span>
            <span className="amita-bold text-xl flex items-center gap-2 text-amber-500">
              <Award className="w-6 h-6" />
              {streak} Days
            </span>
          </div>
          <div className="px-6 py-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/80 dark:border-slate-700 flex flex-col items-center shadow-lg shadow-green-500/5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">Productivity</span>
            <span className="amita-bold text-xl text-brand-600 dark:text-brand-400">
              {productivityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/flashcards" className="glass-card p-8 rounded-[2rem] flex flex-col justify-between group h-48 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="w-24 h-24 text-brand-500" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full">Due Flashcards</span>
          </div>
          <div className="z-10 space-y-1">
            <p className="amita-bold text-4xl text-slate-800 dark:text-slate-100">
              {dueCards.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ready for review</p>
          </div>
        </Link>

        <Link to="/pomodoro" className="glass-card p-8 rounded-[2rem] flex flex-col justify-between group h-48 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24 text-amber-500" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">Focus Time</span>
          </div>
          <div className="z-10 space-y-1">
            <p className="amita-bold text-4xl text-slate-800 dark:text-slate-100">
              {totalFocusTime}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Logged this week</p>
          </div>
        </Link>

        <Link to="/notes" className="glass-card p-8 rounded-[2rem] flex flex-col justify-between group h-48 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-24 h-24 text-sky-500" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest bg-sky-50 dark:bg-sky-500/10 px-3 py-1 rounded-full">Notes Library</span>
          </div>
          <div className="z-10 space-y-1">
            <p className="amita-bold text-4xl text-slate-800 dark:text-slate-100">
              {notes.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saved documents</p>
          </div>
        </Link>

        <div className="glass-card p-8 rounded-[2rem] flex flex-col justify-between h-48 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10">
            <TrendingUp className="w-24 h-24 text-green-500" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full">Mastery Rate</span>
          </div>
          <div className="z-10 space-y-1">
            <p className="amita-bold text-4xl text-slate-800 dark:text-slate-100">
              {flashcards.length > 0 
                ? `${Math.round((flashcards.filter(f => f.isMastered).length / flashcards.length) * 100)}%`
                : "0%"
              }
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">High retention cards</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Study Plan Widget */}
        <div className="glass-card p-8 rounded-[2rem] flex flex-col h-[400px]">
          <div className="pb-6 border-b border-brand-100 dark:border-slate-800 flex justify-between items-end">
            <div>
              <h3 className="amita-bold text-xl text-slate-800 dark:text-slate-100">Today's Agenda</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your curated study timetable</p>
            </div>
            <Calendar className="w-6 h-6 text-brand-500" />
          </div>

          <div className="flex-1 overflow-y-auto mt-6 pr-2 space-y-4">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((slot, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate("/pomodoro", { state: { duration: slot.duration || 45, subject: slot.subject } })}
                  className="p-5 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-brand-50 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:border-brand-300 transition-all hover:bg-brand-50/50 dark:hover:bg-slate-800/60 shadow-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-200 truncate block">{slot.subject}</span>
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400 block">{slot.type}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {slot.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-brand-400" />
                </div>
                <p className="text-slate-500 font-medium mb-4">No sessions scheduled today.</p>
                <Link to="/timetable" className="px-6 py-2.5 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20">
                  Create Timetable
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Exams Widget */}
        <div className="glass-card p-8 rounded-[2rem] flex flex-col h-[400px]">
          <div className="pb-6 border-b border-brand-100 dark:border-slate-800 flex justify-between items-end">
             <div>
              <h3 className="amita-bold text-xl text-slate-800 dark:text-slate-100">Milestones</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upcoming exams and deadlines</p>
            </div>
            <Award className="w-6 h-6 text-amber-500" />
          </div>

          <div className="flex-1 overflow-y-auto mt-6 pr-2 space-y-4">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam, i) => (
                <div 
                  key={i}
                  className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
                    exam.diffDays <= 3 
                      ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50" 
                      : "bg-white/50 dark:bg-slate-900/40 border-brand-50 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{exam.subject}</span>
                      {exam.diffDays <= 3 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                          <AlertCircle className="w-3 h-3" />
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 block">{new Date(exam.dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                     <span className={`amita-bold text-lg ${exam.diffDays <= 3 ? "text-rose-500" : "text-brand-500 dark:text-brand-400"}`}>
                      {exam.diffDays === 0 ? "Today" : `${exam.diffDays}d`}
                    </span>
                    <button onClick={() => handleCompleteExam(exam.subject)} className="text-[10px] flex items-center gap-1 font-semibold text-slate-400 hover:text-emerald-500 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Mark Done
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-slate-500 font-medium mb-4">All caught up! No upcoming exams.</p>
                <Link to="/timetable" className="px-6 py-2.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-100 transition-colors">
                  Add Milestone
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
