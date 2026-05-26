import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { useStore } from "../store/useStore";
import { 
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, 
  HelpCircle, Calendar, Plus, Grid, LayoutList
} from "lucide-react";
import { 
  format, getWeekDays, getMonthDays, isSameMonth, 
  addMonths, subMonths, addWeeks, subWeeks, isToday
} from "../utils/calendar";

export default function Timeline() {
  const { timetables } = useFirestore();
  const { timelineCompletions, toggleTimelineCompletion } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // 'week' | 'month'

  const activeTimetable = useMemo(() => {
    return timetables[0] || null;
  }, [timetables]);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60; // px per hour in the timeline grid

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === "week" ? subWeeks(prev, 1) : subMonths(prev, 1));
  };
  const handleNext = () => {
    setCurrentDate(prev => viewMode === "week" ? addWeeks(prev, 1) : addMonths(prev, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim();
    const match = cleanStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    return hours + minutes / 60;
  };

  const calculateSlotPosition = (timeRangeStr, durationMins, isBreak = false) => {
    if (!timeRangeStr) return { isFlexible: true };
    const parts = timeRangeStr.split("-");
    if (parts.length < 1) return { isFlexible: true };
    const startDecimal = parseTimeToDecimal(parts[0]);
    if (startDecimal === null) return { isFlexible: true };
    const timelineStartHour = 0; 
    const durationHours = (Number(durationMins) || 45) / 60;
    const top = (startDecimal - timelineStartHour) * HOUR_HEIGHT;
    const height = durationHours * HOUR_HEIGHT;
    return {
      isFlexible: false,
      top: Math.max(0, top),
      height: isBreak ? height : Math.max(28, height)
    };
  };

  const handleToggleComplete = async (e, dateStr, idx) => {
    e.stopPropagation();
    try {
      await toggleTimelineCompletion(dateStr, idx);
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    }
  };

  const getDaySchedule = (date) => {
    if (!activeTimetable?.schedule) return null;
    const dayName = format(date, 'EEEE');
    return activeTimetable.schedule.find(s => s.day === dayName);
  };

  const renderSlotCard = (slot, idx, dayDate) => {
    const isBreak = slot.subject === "Break";
    const pos = calculateSlotPosition(slot.time, slot.duration, isBreak);
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    const isCompleted = timelineCompletions[dateStr]?.includes(idx);

    if (pos.isFlexible) return null;

    const cardStyle = {
      position: "absolute",
      top: `${pos.top}px`,
      height: `${pos.height}px`,
      left: "4px",
      right: "4px",
      zIndex: isBreak ? 1 : 2
    };

    return (
      <div
        key={idx}
        style={cardStyle}
        onClick={() => {
          if (!isBreak) navigate("/pomodoro", { state: { duration: slot.duration, subject: slot.subject } });
        }}
        className={`rounded-xl border p-1.5 text-left flex flex-col justify-between overflow-hidden transition-all text-[11px] ${
          isBreak
            ? "bg-slate-50/70 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50"
            : isCompleted
              ? "bg-emerald-500/10 border-emerald-500/25 opacity-80 cursor-pointer hover:bg-emerald-500/15"
              : "bg-brand-500/10 border-brand-500/20 hover:border-brand-500/40 cursor-pointer hover:bg-brand-500/15 shadow-sm"
        }`}
        title={`${slot.subject} (${slot.time})`}
      >
        <div className="flex items-start justify-between gap-1 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <span className={`font-bold block truncate leading-tight ${
              isBreak ? "text-slate-500" : isCompleted ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50" : "text-slate-800 dark:text-slate-200"
            }`}>
              {slot.subject}
            </span>
            {pos.height > 40 && <span className="text-[9px] text-slate-450 truncate block leading-none">{slot.type}</span>}
          </div>
          {!isBreak && (
            <button
              onClick={(e) => handleToggleComplete(e, dateStr, idx)}
              className={`p-0.5 rounded transition-colors cursor-pointer flex-shrink-0 ${
                isCompleted ? "text-emerald-500 hover:text-slate-400" : "text-slate-300 hover:text-emerald-500 dark:text-slate-700"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? "fill-emerald-500/10" : ""}`} />
            </button>
          )}
        </div>
        {pos.height > 50 && (
          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5 font-mono leading-none">
            <span>{slot.time.split("-")[0].trim()}</span>
            <span>{slot.duration}m</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" />
            Calendar Timeline
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Track and log your daily study sessions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-4 text-xs mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-brand-500/15 border border-brand-500/30" />
              <span className="text-slate-500 dark:text-slate-400">Study</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/30" />
              <span className="text-slate-500 dark:text-slate-400">Done</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 shadow-inner border border-slate-200 dark:border-slate-800">
            <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "week" ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              <LayoutList className="w-3.5 h-3.5" /> Week
            </button>
            <button onClick={() => setViewMode("month")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "month" ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              <Grid className="w-3.5 h-3.5" /> Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleToday} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer">
              Today
            </button>
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
              <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <div className="px-2 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[120px] text-center">
                {viewMode === "week" ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}` : format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={handleNext} className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {!activeTimetable ? (
        <div className="glass-panel flex-1 rounded-3xl flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="max-w-md text-center">
            <h3 className="text-lg font-bold">No Timetable Active</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Please go to the Timetable Generator to create your smart study routine first.
            </p>
            <Link to="/timetable" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-md">
              <Plus className="w-3.5 h-3.5" />
              Generate Routine
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col min-h-0 bg-white/50 dark:bg-slate-950/50">
          
          {/* Week View */}
          {viewMode === "week" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Days Header */}
              <div className="flex border-b border-slate-200/50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0 pr-2">
                <div className="w-16 flex-shrink-0" /> {/* Time axis padding */}
                <div className="flex-1 grid grid-cols-7">
                  {weekDays.map((day, i) => {
                    const today = isToday(day);
                    return (
                      <div key={i} className={`py-2 flex flex-col items-center justify-center border-l border-slate-200/40 dark:border-slate-800/40 ${today ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''}`}>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{format(day, 'EEE')}</span>
                        <div className={`mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${today ? 'bg-brand-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200'}`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                  
                  {/* Left Axis: Hour Labels */}
                  <div className="w-16 flex-shrink-0 border-r border-slate-200/40 dark:border-slate-800/60 flex flex-col relative z-10 bg-white/30 dark:bg-slate-950/30">
                    {HOURS.map((h, i) => (
                      <div key={i} style={{ height: `${HOUR_HEIGHT}px` }} className="text-[10px] font-bold text-slate-400 font-mono text-right pr-2 -mt-2">
                        {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                      </div>
                    ))}
                  </div>

                  {/* Grid Lines */}
                  <div className="absolute inset-0 left-16 pointer-events-none z-0">
                    {HOURS.map((_, i) => (
                      <div key={i} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-200/40 dark:border-slate-800/40" />
                    ))}
                  </div>

                  {/* Columns */}
                  <div className="flex-1 grid grid-cols-7 relative">
                    {weekDays.map((day, i) => {
                      const daySchedule = getDaySchedule(day);
                      return (
                        <div key={i} className="relative border-l border-slate-200/20 dark:border-slate-800/20">
                          {daySchedule?.slots?.map((slot, idx) => renderSlotCard(slot, idx, day))}
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {viewMode === "month" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-slate-200/50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <div key={i} className="py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-l border-slate-200/40 dark:border-slate-800/40 first:border-l-0">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {monthDays.map((day, i) => {
                  const daySchedule = getDaySchedule(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const dateStr = format(day, 'yyyy-MM-dd');

                  return (
                    <div key={i} className={`border-l border-b border-slate-200/40 dark:border-slate-800/40 p-1.5 flex flex-col transition-colors ${isCurrentMonth ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-900/10'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${today ? 'bg-brand-500 text-white' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none pr-1">
                        {daySchedule?.slots?.filter(s => s.subject !== "Break").map((slot, idx) => {
                          const isCompleted = timelineCompletions[dateStr]?.includes(idx);
                          return (
                            <div 
                              key={idx}
                              onClick={() => navigate("/pomodoro", { state: { duration: slot.duration, subject: slot.subject } })}
                              className={`text-[9px] px-1.5 py-1 rounded truncate cursor-pointer transition-colors ${
                                isCompleted 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 line-through decoration-emerald-500/50" 
                                  : "bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-500/20"
                              }`}
                              title={`${slot.subject} (${slot.time})`}
                            >
                              {slot.time.split("-")[0].trim()} {slot.subject}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
