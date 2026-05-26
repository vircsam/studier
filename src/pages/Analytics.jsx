import React, { useState, useEffect, useMemo } from "react";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { 
  BarChart3, Award, TrendingUp, Sparkles, BookOpen, Clock, 
  HelpCircle, ArrowUpRight, BarChart, CheckCircle2 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, Legend 
} from "recharts";

export default function Analytics() {
  const { studySessions, flashcards, streak, productivityScore } = useFirestore();
  const { showToast } = useToast();


  const metrics = useMemo(() => {
    const totalFocusMinutes = studySessions
      .filter(s => s.type === "focus" || !s.type)
      .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

    const totalHours = Number((totalFocusMinutes / 60).toFixed(1));

    const totalFC = flashcards.length;
    const masteredFC = flashcards.filter(f => f.isMastered).length;
    const masteryRate = totalFC > 0 ? Math.round((masteredFC / totalFC) * 100) : 0;

    return {
      totalHours,
      totalFocusMinutes,
      masteryRate,
      totalFlashcards: totalFC,
      masteredFlashcards: masteredFC,
      streak: streak,
      productivityScore: productivityScore
    };
  }, [studySessions, flashcards, streak, productivityScore]);

  const subjectData = useMemo(() => {
    const subjectMinutes = {};
    studySessions.forEach(s => {
      if (s.type === "focus" || !s.type) {
        const sub = s.subject || "General";
        subjectMinutes[sub] = (subjectMinutes[sub] || 0) + (Number(s.durationMinutes) || 0);
      }
    });

    return Object.keys(subjectMinutes).map(subject => ({
      subject,
      hours: Number((subjectMinutes[subject] / 60).toFixed(1))
    }));
  }, [studySessions]);

  const dailyChartData = useMemo(() => {
    const dailyStudy = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dailyStudy[d] = 0;
    }
    studySessions.forEach(s => {
      if (s.date && dailyStudy[s.date] !== undefined) {
        dailyStudy[s.date] += (Number(s.durationMinutes) || 0);
      }
    });

    return Object.keys(dailyStudy).map(date => {
      const dObj = new Date(date + "T00:00:00");
      const label = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date,
        label,
        hours: Number((dailyStudy[date] / 60).toFixed(1))
      };
    });
  }, [studySessions]);

  const insights = useMemo(() => {
    const hints = [];
    if (metrics.totalHours < 2) {
      hints.push("Try completing a 25-minute Pomodoro study block today to build momentum!");
    } else {
      hints.push("Great job! You have logged consistent study hours.");
    }
    
    if (metrics.masteryRate < 50) {
      hints.push("Tip: Review cards marked 'Hard' daily to move them into long-term memory.");
    } else {
      hints.push("Excellent retention! You've mastered a large portion of your flashcards.");
    }
    return hints;
  }, [metrics]);



  // Color options for Pie Charts
  const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899", "#f59e0b"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-500" />
          Analytics Dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Deep-dive performance evaluations, strengths breakdowns, and productivity tracking
        </p>
      </div>

      <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total study hours */}
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Focus Time</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.totalHours} hrs</p>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-500" />
                  Cumulative study blocks
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Streak card */}
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Streak</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.streak} Days</p>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  Consecutive days active
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>

            {/* Mastery rate card */}
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mastered Decks</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.masteryRate}%</p>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {metrics.masteredFlashcards} of {metrics.totalFlashcards} cards mastered
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            {/* Productivity Score card */}
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Productivity Score</span>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.productivityScore}%</p>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Efficiency Index
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Daily study hours bar chart */}
            <div className="glass-card p-6 rounded-2xl min-w-0">
              <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Study Distribution History</h3>
                <p className="text-xs text-slate-400">Hours spent studying daily</p>
              </div>
              <div className="h-64 w-full min-w-0 mt-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
                  <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHoursChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(15, 23, 42, 0.9)", 
                        borderRadius: "12px", 
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "#fff"
                      }} 
                    />
                    <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorHoursChart)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject allocation pie chart */}
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-between min-w-0">
              <div className="pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Focus Split by Subject</h3>
                <p className="text-xs text-slate-400">Share of total study time</p>
              </div>

              {subjectData.length > 0 ? (
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 mt-6 min-h-[200px] min-w-0">
                  <div className="w-40 h-40 min-w-0 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                      <PieChart>
                        <Pie
                          data={subjectData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey={subjectData[0]?.hours !== undefined ? "hours" : "minutes"}
                        >
                          {subjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="space-y-2">
                    {subjectData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-500 truncate max-w-[120px]">{item.subject}</span>
                        <span className="text-slate-800 dark:text-slate-200">
                          ({item.hours !== undefined ? `${item.hours}h` : `${item.minutes}m`})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <BarChart className="w-8 h-8 opacity-35 mb-2 animate-pulse" />
                  <p className="text-xs font-medium">Log study focus hours to build details</p>
                </div>
              )}
            </div>

          </div>

          {/* AI recommendations panel */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-200/50 dark:border-slate-800/40 mb-4 text-sm">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              AI Recommendations & Study Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl border border-brand-500/10 bg-brand-500/5 flex items-start gap-3 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </>
    </div>
  );
}
