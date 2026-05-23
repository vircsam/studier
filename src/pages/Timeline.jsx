import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { 
  CalendarDays, Clock, CheckCircle2, ChevronLeft, ChevronRight, 
  HelpCircle, Calendar, Plus 
} from "lucide-react";

export default function Timeline() {
  const { timetables, saveTimetable } = useFirestore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active day view for mobile view (single day view, defaults dynamically to today)
  const [mobileActiveDay, setMobileActiveDay] = useState(() => {
    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return DAYS_OF_WEEK[new Date().getDay()];
  });

  // Get active timetable
  const activeTimetable = useMemo(() => {
    return timetables[0] || null;
  }, [timetables]);

  // Compute rolling days starting from today
  const DAYS = useMemo(() => {
    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const days = [];
    const current = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      days.push(DAYS_OF_WEEK[d.getDay()]);
    }
    return days;
  }, []);
  
  // Compute rolling dates starting from today
  const weekDates = useMemo(() => {
    const current = new Date();
    const dates = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(current);
      dayDate.setDate(current.getDate() + i);
      const dateNum = dayDate.getDate();
      const month = monthNames[dayDate.getMonth()];
      dates.push(`${month} ${dateNum}`);
    }
    return dates;
  }, []);
  const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 AM to 6:00 PM (18:00)
  const HOUR_HEIGHT = 76; // px per hour in the timeline grid

  // Helper to parse time string (e.g. "09:00", "09:45", "14:30") into float decimal hours
  const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return null;
    const cleanStr = timeStr.trim();
    // Regex matching HH:MM and optional AM/PM
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

  // Helper to calculate card styling based on slot time interval (e.g. "09:00 - 09:45")
  const calculateSlotPosition = (timeRangeStr, durationMins, isBreak = false) => {
    if (!timeRangeStr) return { isFlexible: true };
    const parts = timeRangeStr.split("-");
    if (parts.length < 1) return { isFlexible: true };
    
    const startDecimal = parseTimeToDecimal(parts[0]);
    if (startDecimal === null) return { isFlexible: true };
 
    const timelineStartHour = 8; // 8:00 AM
    const durationHours = (Number(durationMins) || 45) / 60;
 
    const top = (startDecimal - timelineStartHour) * HOUR_HEIGHT;
    const height = durationHours * HOUR_HEIGHT;
 
    return {
      isFlexible: false,
      top: Math.max(0, top),
      height: isBreak ? height : Math.max(35, height) // Minimum height of 35px only for study slots
    };
  };

  // Toggle slot completion
  const handleToggleCompleteSlot = async (day, index) => {
    try {
      const updatedSchedule = activeTimetable.schedule.map(dayObj => {
        if (dayObj.day === day) {
          const updatedSlots = dayObj.slots.map((s, idx) => {
            if (idx === index) {
              return { ...s, completed: !s.completed };
            }
            return s;
          });
          return { ...dayObj, slots: updatedSlots };
        }
        return dayObj;
      });

      await saveTimetable({
        ...activeTimetable,
        schedule: updatedSchedule
      });

      showToast("Slot completion status updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update slot status", "error");
    }
  };

  // Render a single calendar slot card
  const renderSlotCard = (slot, idx, dayName, isMobileView) => {
    const isBreak = slot.subject === "Break";
    const pos = calculateSlotPosition(slot.time, slot.duration, isBreak);
    
    if (pos.isFlexible) {
      return null; // Rendered separately or skipped
    }

    const cardStyle = {
      position: "absolute",
      top: `${pos.top}px`,
      height: `${pos.height}px`,
      left: "4px",
      right: "4px"
    };

    return (
      <div
        key={idx}
        style={cardStyle}
        onClick={() => {
          if (!isBreak) {
            navigate("/pomodoro", { state: { duration: slot.duration, subject: slot.subject } });
          }
        }}
        className={`rounded-xl border p-2 text-left flex flex-col justify-between overflow-hidden transition-all text-[11px] ${
          isBreak
            ? "bg-slate-50/70 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50"
            : slot.completed
              ? "bg-emerald-500/10 border-emerald-500/25 opacity-80 cursor-pointer hover:bg-emerald-500/15"
              : "bg-brand-500/10 border-brand-500/20 hover:border-brand-500/40 cursor-pointer hover:bg-brand-500/15 shadow-sm"
        }`}
        title={`${slot.subject} (${slot.time})`}
      >
        <div className="flex items-start justify-between gap-1 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <span className={`font-bold block truncate leading-tight ${
              isBreak 
                ? "text-slate-500" 
                : slot.completed
                  ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50"
                  : "text-slate-800 dark:text-slate-200"
            }`}>
              {slot.subject}
            </span>
            {pos.height > 45 && (
              <span className="text-[9px] text-slate-450 truncate block leading-none">{slot.type}</span>
            )}
          </div>
          
          {!isBreak && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCompleteSlot(dayName, idx);
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer flex-shrink-0 ${
                slot.completed 
                  ? "text-emerald-500 hover:text-slate-400" 
                  : "text-slate-300 hover:text-emerald-500 dark:text-slate-700"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${slot.completed ? "fill-emerald-500/10" : ""}`} />
            </button>
          )}
        </div>

        {pos.height > 55 && (
          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono leading-none">
            <span>{slot.time.split("-")[0].trim()}</span>
            <span>{slot.duration}m</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" />
            Timeline Breakdown
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Weekly routine layout. Click on study slots to log focus sessions.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-500/15 border border-brand-500/30" />
            <span className="text-slate-500 dark:text-slate-400">Study Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/30" />
            <span className="text-slate-500 dark:text-slate-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300" />
            <span className="text-slate-500 dark:text-slate-400">Break</span>
          </div>
        </div>
      </div>

      {activeTimetable ? (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl overflow-hidden flex flex-col">
          
          {/* Mobile view day select tabs */}
          <div className="flex md:hidden gap-1.5 overflow-x-auto pb-4 mb-2 scrollbar-none border-b border-slate-200/50 dark:border-slate-800/40">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => setMobileActiveDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  mobileActiveDay === day
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                {day.substring(0, 3)} ({weekDates[idx]})
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="relative flex overflow-x-auto scrollbar-none" style={{ minHeight: `${HOURS.length * HOUR_HEIGHT + 40}px` }}>
            
            {/* Left Axis: Hour Labels */}
            <div className="flex-shrink-0 w-12 sm:w-16 border-r border-slate-200/40 dark:border-slate-800/60 flex flex-col pt-10 pr-2 text-right">
              {HOURS.map((h, i) => {
                const isPM = h >= 12;
                const formattedHour = h > 12 ? h - 12 : h;
                const suffix = isPM ? "PM" : "AM";
                return (
                  <div
                    key={i}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono"
                  >
                    {formattedHour}:00 {suffix}
                  </div>
                );
              })}
            </div>

            {/* Right Side: Columns Container */}
            <div className="flex-1 min-w-[650px] md:min-w-0 grid grid-cols-1 md:grid-cols-7 relative">
              
              {/* Horizontal Gridlines (Background) */}
              <div className="absolute inset-0 pt-10 pointer-events-none z-0">
                {HOURS.map((_, i) => (
                  <div
                    key={i}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-slate-200/40 dark:border-slate-850"
                  />
                ))}
              </div>

              {/* Columns Render */}
              {DAYS.map((dayName, index) => {
                const dayObj = activeTimetable.schedule?.find(s => s.day === dayName);
                const isMobileHidden = mobileActiveDay !== dayName;

                return (
                  <div
                    key={dayName}
                    className={`relative pt-10 h-full border-r border-slate-200/20 dark:border-slate-800/20 z-10 md:block ${
                      isMobileHidden ? "hidden" : "block"
                    }`}
                  >
                    {/* Header: Day Name & Date */}
                    <div className="absolute top-0 inset-x-0 h-9 flex flex-col items-center justify-center border-b border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-350 leading-tight">{dayName}</span>
                      <span className="text-[9px] font-bold text-brand-550 dark:text-brand-400 leading-none">{weekDates[index]}</span>
                    </div>

                    {/* Slot Cards List */}
                    <div className="relative w-full h-full">
                      {dayObj?.slots?.map((slot, idx) => 
                        renderSlotCard(slot, idx, dayName, false)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Bottom tips */}
          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2 text-xs text-slate-400 justify-center">
            <HelpCircle className="w-4 h-4 text-brand-500" />
            <p>
              Timeline hours map from 08:00 AM to 06:00 PM. Slots scheduled outside this range are styled matching their start coordinates.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-4 flex flex-col items-center justify-center min-h-[450px]">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold">No Timetable Active</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Please go to the Timetable Generator to create your smart study routine first.
            </p>
            <Link 
              to="/timetable" 
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Routine
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
