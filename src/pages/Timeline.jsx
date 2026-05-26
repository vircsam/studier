import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { useStore } from "../store/useStore";
import { 
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, 
  HelpCircle, Calendar, Plus, Grid, LayoutList, X, Timer, Clock
} from "lucide-react";
import { 
  format, getWeekDays, getMonthDays, isSameMonth, 
  addMonths, subMonths, addWeeks, subWeeks, isToday
} from "../utils/calendar";

export default function Timeline() {
  const { timetables } = useFirestore();
  const { timelineCompletions, toggleTimelineCompletion, calendarEvents, addCalendarEvent, toggleCalendarEvent } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // "day", "week" or "month"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeTimetable = useMemo(() => {
    return timetables[0] || null;
  }, [timetables]);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 100; // px per hour in the timeline grid

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  
  const displayDays = useMemo(() => viewMode === "day" ? [currentDate] : weekDays, [viewMode, currentDate, weekDays]);

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === "week" ? subWeeks(prev, 1) : subMonths(prev, 1));
  };
  const handleNext = () => {
    setCurrentDate(prev => viewMode === "week" ? addWeeks(prev, 1) : addMonths(prev, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
    setViewMode("day");
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
      height: isBreak ? height : Math.max(54, height)
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

  const getCombinedDaySchedule = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let slots = [];
    
    // 1. Repeating Weekly Routine
    if (activeTimetable?.schedule) {
      const dayName = format(date, 'EEEE');
      const specificDate = activeTimetable.schedule.find(s => s.day === dateStr);
      if (specificDate?.slots) {
        slots = [...specificDate.slots.map((s, idx) => ({ ...s, isRepeating: true, originalIndex: idx }))];
      } else {
        const repeating = activeTimetable.schedule.find(s => s.day === dayName);
        if (repeating?.slots) {
          const timetableDate = activeTimetable.createdAt ? new Date(activeTimetable.createdAt) : new Date();
          if (date.getMonth() === timetableDate.getMonth() && date.getFullYear() === timetableDate.getFullYear()) {
            slots = [...repeating.slots.map((s, idx) => ({ ...s, isRepeating: true, originalIndex: idx }))];
          }
        }
      }
    }
    
    // 2. One-off Events
    const oneOffs = calendarEvents[dateStr] || [];
    slots = [...slots, ...oneOffs.map(s => ({ ...s, isOneOff: true }))];
    
    // Sort by start time
    slots.sort((a, b) => {
      const aTime = parseTimeToDecimal(a.time.split("-")[0]);
      const bTime = parseTimeToDecimal(b.time.split("-")[0]);
      return (aTime || 0) - (bTime || 0);
    });
    
    // Overlap logic
    const overlappingGroups = [];
    slots.forEach(slot => {
      const start = parseTimeToDecimal(slot.time.split("-")[0]) || 0;
      const durationMins = Number(slot.duration) || 45;
      const end = start + (durationMins / 60);
      slot.start = start;
      slot.end = end;
      
      let placed = false;
      for (const group of overlappingGroups) {
        if (group.some(s => s.start < end && s.end > start)) {
           group.push(slot);
           placed = true;
           break;
        }
      }
      if (!placed) {
        overlappingGroups.push([slot]);
      }
    });

    overlappingGroups.forEach(group => {
      const columns = [];
      group.forEach(slot => {
         let colIdx = 0;
         while (columns[colIdx] && columns[colIdx].some(s => s.start < slot.end && s.end > slot.start)) {
            colIdx++;
         }
         if (!columns[colIdx]) columns[colIdx] = [];
         columns[colIdx].push(slot);
      });
      group.forEach(slot => {
         slot.colIdx = columns.findIndex(col => col.includes(slot));
         slot.totalCols = columns.length;
      });
    });

    return { slots };
  };

  const handleEventComplete = async (e, dateStr, slot) => {
    e.stopPropagation();
    try {
      if (slot.isRepeating) {
        await toggleTimelineCompletion(dateStr, slot.originalIndex);
      } else {
        await toggleCalendarEvent(dateStr, slot.id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    }
  };

  const renderSlotCard = (slot, idx, dayDate) => {
    const isBreak = slot.subject === "Break";
    const pos = calculateSlotPosition(slot.time, slot.duration, isBreak);
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    
    const isCompleted = slot.isRepeating 
      ? timelineCompletions[dateStr]?.includes(slot.originalIndex)
      : slot.completed;

    if (pos.isFlexible) return null;

    const totalCols = slot.totalCols || 1;
    const colIdx = slot.colIdx || 0;

    const cardStyle = {
      position: "absolute",
      top: `${pos.top}px`,
      height: `${pos.height}px`,
      left: `calc(${(colIdx / totalCols) * 100}% + 4px)`,
      width: `calc(${100 / totalCols}% - 8px)`,
      zIndex: isBreak ? 1 : 2
    };

    if (isBreak) {
      return (
        <div
          key={idx}
          style={cardStyle}
          className="flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/30 border-y border-dashed border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider overflow-hidden"
          title={`Break (${slot.time})`}
        >
          {pos.height >= 14 ? "Break" : ""}
        </div>
      );
    }

    return (
      <div
        key={idx}
        style={cardStyle}
        onClick={() => setSelectedEvent({ ...slot, dateStr })}
        className={`group rounded-2xl border p-2 text-left flex flex-col justify-between overflow-hidden transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 z-10 ${
          isCompleted
            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 opacity-80 cursor-pointer hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
            : "bg-gradient-to-br from-white to-brand-50/50 dark:from-slate-900 dark:to-brand-950/30 border-brand-200/60 dark:border-brand-800/60 cursor-pointer shadow-brand-500/5 hover:border-brand-400/50 dark:hover:border-brand-500/50"
        }`}
        title={`${slot.subject} (${slot.time})`}
      >
        <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <span className={`font-bold block truncate leading-tight text-sm ${
              isCompleted ? "text-emerald-700/60 dark:text-emerald-500/50 line-through decoration-emerald-500/30" : "text-slate-800 dark:text-slate-100"
            }`}>
              {slot.subject}
            </span>
            {pos.height > 50 && <span className={`text-[10px] mt-1 font-semibold truncate block leading-none ${isCompleted ? 'text-emerald-600/50' : 'text-brand-600/80 dark:text-brand-400/80'}`}>{slot.type}</span>}
          </div>
          <button
            onClick={(e) => handleEventComplete(e, dateStr, slot)}
            className={`p-1.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
              isCompleted ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/50 shadow-sm border border-slate-200 dark:border-slate-700"
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5`} />
          </button>
        </div>
        {pos.height >= 70 && (
          <div className={`flex items-center justify-between text-[10px] font-mono leading-none mt-2 font-medium ${isCompleted ? 'text-emerald-600/60' : 'text-slate-500 dark:text-slate-400'}`}>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {slot.time.split("-")[0].trim()}</span>
            <span className="bg-white/60 dark:bg-slate-950/40 px-1.5 py-0.5 rounded-md">{slot.duration}m</span>
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
            <button onClick={() => setViewMode("day")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "day" ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              <CalendarDays className="w-3.5 h-3.5" /> Day
            </button>
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
                {viewMode === "day" ? format(currentDate, 'EEEE, MMM d') : viewMode === "week" ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}` : format(currentDate, 'MMMM yyyy')}
              </div>
              <button onClick={handleNext} className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
              <button 
                onClick={() => {
                  setSelectedDate(new Date());
                  setIsAddModalOpen(true);
                }} 
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>
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
          
          {/* Day / Week View */}
          {(viewMode === "week" || viewMode === "day") && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Days Header */}
              <div className="flex border-b border-slate-200/50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0 pr-2">
                <div className="w-16 flex-shrink-0" /> {/* Time axis padding */}
                <div className={`flex-1 grid ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
                  {displayDays.map((day, i) => {
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
                  <div className={`flex-1 grid ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"} relative`}>
                    {displayDays.map((day, i) => {
                      const daySchedule = getCombinedDaySchedule(day);
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
                  const daySchedule = getCombinedDaySchedule(day);
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
                          const isCompleted = slot.isRepeating 
                            ? timelineCompletions[dateStr]?.includes(slot.originalIndex)
                            : slot.completed;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                if (slot.subject !== "Break") setSelectedEvent({ ...slot, dateStr });
                              }}
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

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Subject / Task</label>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{selectedEvent.subject}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Time</label>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedEvent.time}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Duration</label>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedEvent.duration} min</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    (selectedEvent.isRepeating ? timelineCompletions[selectedEvent.dateStr]?.includes(selectedEvent.originalIndex) : selectedEvent.completed)
                      ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                  }`}>
                    {(selectedEvent.isRepeating ? timelineCompletions[selectedEvent.dateStr]?.includes(selectedEvent.originalIndex) : selectedEvent.completed) ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  handleEventComplete(e, selectedEvent.dateStr, selectedEvent);
                  setSelectedEvent(null);
                }}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Update Status
              </button>
              <button
                onClick={() => {
                   navigate("/pomodoro", { state: { duration: selectedEvent.duration, subject: selectedEvent.subject } });
                }}
                className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Timer className="w-4 h-4" />
                Start Pomodoro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add Calendar Event</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              
              // Validate and format time
              const t = fd.get('time');
              const d = parseInt(fd.get('duration'), 10);
              
              // Calculate end time
              const match = t.match(/(\d{2}):(\d{2})/);
              if (!match) return;
              const dateObj = new Date(`2000-01-01T${t}:00`);
              dateObj.setMinutes(dateObj.getMinutes() + d);
              let h = dateObj.getHours();
              const m = dateObj.getMinutes().toString().padStart(2, '0');
              const ampm = h >= 12 ? 'PM' : 'AM';
              h = h % 12 || 12;
              const endTimeStr = `${h}:${m} ${ampm}`;
              
              // start time format
              let sh = parseInt(match[1], 10);
              const sm = match[2];
              const sampm = sh >= 12 ? 'PM' : 'AM';
              sh = sh % 12 || 12;
              const startTimeStr = `${sh}:${sm} ${sampm}`;

              const timeStr = `${startTimeStr} - ${endTimeStr}`;
              
              const newEvent = {
                subject: fd.get('subject'),
                time: timeStr,
                duration: d,
                type: fd.get('type') || "Self Study"
              };
              
              try {
                await addCalendarEvent(fd.get('date'), newEvent);
                setIsAddModalOpen(false);
                showToast("Event added!", "success");
              } catch (err) {
                console.error(err);
                showToast("Failed to add event", "error");
              }
            }} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                <input required name="date" type="date" defaultValue={format(selectedDate, 'yyyy-MM-dd')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Subject / Task</label>
                <input required name="subject" type="text" placeholder="e.g. Math Exam" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label>
                  <input required name="time" type="time" defaultValue="09:00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Duration (min)</label>
                  <input required name="duration" type="number" min="15" step="15" defaultValue="60" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
