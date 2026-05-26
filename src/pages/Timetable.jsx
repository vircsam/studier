import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { useStore } from "../store/useStore";
import { 
  Calendar, Plus, Trash2, Clock, Sparkles, AlertTriangle, 
  CalendarDays, CheckCircle2, ChevronRight, HelpCircle, Edit2 
} from "lucide-react";
import { format } from "../utils/calendar";

export default function Timetable() {
  const navigate = useNavigate();
  const { timetables, saveTimetable } = useFirestore();
  const { showToast } = useToast();
  const { calendarEvents, toggleCalendarEvent } = useStore();

  // Subjects input state
  const [subjects, setSubjects] = useState([
    { name: "Computer Science", difficulty: 4, isWeak: true },
    { name: "Web Development", difficulty: 3, isWeak: false }
  ]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDiff, setNewSubDiff] = useState(3);
  const [newSubWeak, setNewSubWeak] = useState(false);

  // Exam Dates input state
  const [examDates, setExamDates] = useState({
    "Computer Science": new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    "Web Development": new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  });

  // Daily hours state
  const [dailyHours, setDailyHours] = useState(4);
  const [selectedGenerateDay, setSelectedGenerateDay] = useState("Today Only");
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);

  // Active day view for output (defaults dynamically to today's day of the week)
  const [activeDayTab, setActiveDayTab] = useState(() => {
    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return DAYS_OF_WEEK[new Date().getDay()];
  });

  // Calculate calendar dates for the week rolling from today
  const weekDates = useMemo(() => {
    const current = new Date();
    const dates = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(current);
      dayDate.setDate(current.getDate() + i);
      const dateNum = dayDate.getDate();
      const month = monthNames[dayDate.getMonth()];
      dates[DAYS_OF_WEEK[dayDate.getDay()]] = `${month} ${dateNum}`;
    }
    return dates;
  }, []);

  // Compute rolling days order starting from today
  const rollingDaysOrder = useMemo(() => {
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

  // Edit subject index state
  const [editingSubjectIdx, setEditingSubjectIdx] = useState(null);
  const [lastInitializedId, setLastInitializedId] = useState(null);

  // Get current timetable
  const activeTimetable = useMemo(() => {
    return timetables[0] || null;
  }, [timetables]);

  // Sort schedule in rolling order starting from today
  const sortedSchedule = useMemo(() => {
    if (!activeTimetable || !activeTimetable.schedule) return [];
    
    const filtered = activeTimetable.schedule.filter(d => {
       const isGenericDay = rollingDaysOrder.includes(d.day);
       if (isGenericDay && (!d.slots || d.slots.length === 0)) return false;
       return true;
    });

    return filtered.sort((a, b) => {
      const idxA = rollingDaysOrder.indexOf(a.day);
      const idxB = rollingDaysOrder.indexOf(b.day);
      if (idxA === -1 && idxB === -1) return new Date(a.day) - new Date(b.day);
      if (idxA === -1) return -1;
      if (idxB === -1) return 1;
      return idxA - idxB;
    });
  }, [activeTimetable, rollingDaysOrder]);

  const displaySlots = useMemo(() => {
    if (!activeTimetable?.schedule) return [];
    
    let templateSlots = activeTimetable.schedule.find(d => d.day === activeDayTab)?.slots || [];
    templateSlots = templateSlots.map((s, i) => ({ ...s, originalIdx: i, isOneOff: false }));
    
    let targetDateStr = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(activeDayTab)) {
      targetDateStr = activeDayTab;
    } else {
      const current = new Date();
      const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(current);
        dayDate.setDate(current.getDate() + i);
        if (DAYS_OF_WEEK[dayDate.getDay()] === activeDayTab) {
           targetDateStr = format(dayDate, 'yyyy-MM-dd');
           break;
        }
      }
    }
    
    let oneOffs = [];
    if (targetDateStr && calendarEvents && calendarEvents[targetDateStr]) {
      oneOffs = calendarEvents[targetDateStr].map(s => ({ ...s, isOneOff: true, targetDateStr }));
    }
    
    const combined = [...templateSlots, ...oneOffs];
    
    combined.sort((a, b) => {
      const parseTime = (timeStr) => {
         if (!timeStr) return 0;
         const [h, m] = timeStr.split('-');
         const [hh, mm] = (h || "00:00").split(':');
         return parseInt(hh)*60 + parseInt(mm || "0");
      };
      return parseTime(a.time) - parseTime(b.time);
    });
    
    return combined;
  }, [activeTimetable, activeDayTab, calendarEvents]);

  // Ensure activeDayTab is valid for the current schedule
  useEffect(() => {
    if (sortedSchedule.length > 0) {
      const tabExists = sortedSchedule.some(d => d.day === activeDayTab);
      if (!tabExists) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayName = DAYS_OF_WEEK[new Date().getDay()];
        
        const matchingTab = sortedSchedule.find(d => d.day === todayStr || d.day === todayName);
        if (matchingTab) {
          setActiveDayTab(matchingTab.day);
        } else {
          setActiveDayTab(sortedSchedule[0].day);
        }
      }
    }
  }, [sortedSchedule, activeDayTab]);

  // Sync inputs with active timetable when loaded
  useEffect(() => {
    if (activeTimetable && activeTimetable.id !== lastInitializedId) {
      if (activeTimetable.subjects) {
        setSubjects(activeTimetable.subjects);
      }
      if (activeTimetable.examDates) {
        setExamDates(activeTimetable.examDates);
      }
      if (activeTimetable.dailyHours) {
        setDailyHours(activeTimetable.dailyHours);
      }
      setLastInitializedId(activeTimetable.id);
    }
  }, [activeTimetable, lastInitializedId]);

  // Edit & Custom Slot States
  const [editingSlot, setEditingSlot] = useState(null); // { day, index, subject, type, duration, time }
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotSubject, setNewSlotSubject] = useState("");
  const [newSlotType, setNewSlotType] = useState("Focus Session");
  const [newSlotDuration, setNewSlotDuration] = useState(45);
  const [newSlotStartTime, setNewSlotStartTime] = useState("09:00");

  // Handle editing a slot
  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    if (!editingSlot.subject.trim()) {
      showToast("Subject is required", "warning");
      return;
    }

    try {
      const updatedSchedule = activeTimetable.schedule.map(dayObj => {
        if (dayObj.day === editingSlot.day) {
          const updatedSlots = dayObj.slots.map((s, idx) => {
            if (idx === editingSlot.index) {
              return {
                subject: editingSlot.subject.trim(),
                type: editingSlot.type.trim() || "Study Slot",
                duration: Number(editingSlot.duration) || 45,
                time: editingSlot.time.trim() || s.time,
                completed: s.completed || false
              };
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

      showToast("Slot updated successfully", "success");
      setEditingSlot(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to update slot", "error");
    }
  };

  // Handle adding a custom slot
  const handleAddCustomSlot = async (e) => {
    e.preventDefault();
    if (!newSlotSubject.trim()) {
      showToast("Subject is required", "warning");
      return;
    }

    try {
      // Calculate start and end time interval using time picker values
      const startTimeVal = newSlotStartTime || "09:00";
      const [startHour, startMin] = startTimeVal.split(":").map(Number);
      const totalMin = startHour * 60 + startMin + Number(newSlotDuration);
      const endHour = Math.floor(totalMin / 60) % 24;
      const endMin = totalMin % 60;
      const formattedStartTime = `${startHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`;
      const formattedEndTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
      const computedTimeInterval = `${formattedStartTime} - ${formattedEndTime}`;

      const updatedSchedule = activeTimetable.schedule.map(dayObj => {
        if (dayObj.day === activeDayTab) {
          const newSlot = {
            subject: newSlotSubject.trim(),
            type: newSlotType.trim() || "Custom Slot",
            duration: Number(newSlotDuration) || 45,
            time: computedTimeInterval,
            completed: false
          };
          return { ...dayObj, slots: [...dayObj.slots, newSlot] };
        }
        return dayObj;
      });

      await saveTimetable({
        ...activeTimetable,
        schedule: updatedSchedule
      });

      showToast("Slot added successfully", "success");
      setShowAddSlotModal(false);
      setNewSlotSubject("");
      setNewSlotType("Focus Session");
      setNewSlotDuration(45);
      setNewSlotStartTime("09:00");
    } catch (err) {
      console.error(err);
      showToast("Failed to add slot", "error");
    }
  };

  // Handle deleting a slot
  const handleDeleteSlot = async (day, index) => {
    if (!confirm("Are you sure you want to remove this slot from your timetable?")) return;

    try {
      const updatedSchedule = activeTimetable.schedule.map(dayObj => {
        if (dayObj.day === day) {
          const updatedSlots = dayObj.slots.filter((_, idx) => idx !== index);
          return { ...dayObj, slots: updatedSlots };
        }
        return dayObj;
      });

      await saveTimetable({
        ...activeTimetable,
        schedule: updatedSchedule
      });

      showToast("Slot removed from timetable", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete slot", "error");
    }
  };

  // Handle clearing all tasks/slots for a specific day
  const handleClearDayTasks = async (day) => {
    if (!activeTimetable) return;
    if (!confirm(`Are you sure you want to remove all study slots and tasks for ${day}?`)) return;

    try {
      const updatedSchedule = activeTimetable.schedule.map(dayObj => {
        if (dayObj.day === day) {
          return { ...dayObj, slots: [] };
        }
        return dayObj;
      });

      await saveTimetable({
        ...activeTimetable,
        schedule: updatedSchedule
      });

      showToast(`Cleared all tasks for ${day}`, "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to clear tasks for the day", "error");
    }
  };

  // Helper to extract HH:MM start time from time interval (e.g. "09:00 - 09:45")
  const getStartTimeFromInterval = (timeIntervalStr) => {
    if (!timeIntervalStr) return "09:00";
    const parts = timeIntervalStr.split("-");
    if (parts.length > 0) {
      const match = parts[0].trim().match(/(\d{2}):(\d{2})/);
      if (match) return `${match[1]}:${match[2]}`;
    }
    return "09:00";
  };

  // Helper to dynamically update duration and time range when editing start time or duration
  const handleUpdateEditingSlotTime = (startTime, duration) => {
    if (!editingSlot) return;
    const [startHour, startMin] = startTime.split(":").map(Number);
    const totalMin = startHour * 60 + startMin + Number(duration);
    const endHour = Math.floor(totalMin / 60) % 24;
    const endMin = totalMin % 60;
    const formattedStartTime = `${startHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`;
    const formattedEndTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
    setEditingSlot({
      ...editingSlot,
      duration: Number(duration),
      time: `${formattedStartTime} - ${formattedEndTime}`
    });
  };

  // Handle toggling slot completion
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

  // Handle adding or updating a subject in the list
  const handleAddSubject = (e) => {
    e.preventDefault();
    const nameTrimmed = newSubName.trim();
    if (!nameTrimmed) {
      showToast("Subject name is required", "warning");
      return;
    }

    if (editingSubjectIdx !== null) {
      // Edit Mode
      const isDuplicate = subjects.some(
        (s, idx) => idx !== editingSubjectIdx && s.name.toLowerCase() === nameTrimmed.toLowerCase()
      );
      if (isDuplicate) {
        showToast("Subject already exists", "warning");
        return;
      }

      const oldName = subjects[editingSubjectIdx].name;
      const updatedSubjects = [...subjects];
      updatedSubjects[editingSubjectIdx] = {
        name: nameTrimmed,
        difficulty: Number(newSubDiff),
        isWeak: newSubWeak
      };

      // Also update key in examDates if the name changed
      if (oldName !== nameTrimmed) {
        const updatedDates = { ...examDates };
        if (updatedDates[oldName]) {
          updatedDates[nameTrimmed] = updatedDates[oldName];
          delete updatedDates[oldName];
        }
        setExamDates(updatedDates);
      }

      setSubjects(updatedSubjects);
      setEditingSubjectIdx(null);
      setNewSubName("");
      setNewSubDiff(3);
      setNewSubWeak(false);
      showToast(`Updated ${nameTrimmed}`, "info");
    } else {
      // Add Mode
      if (subjects.some(s => s.name.toLowerCase() === nameTrimmed.toLowerCase())) {
        showToast("Subject already exists", "warning");
        return;
      }

      const sub = {
        name: nameTrimmed,
        difficulty: Number(newSubDiff),
        isWeak: newSubWeak
      };

      setSubjects([...subjects, sub]);
      setNewSubName("");
      setNewSubDiff(3);
      setNewSubWeak(false);
      showToast(`Added ${sub.name}`, "info");
    }
  };

  // Handle removing a subject
  const handleRemoveSubject = (name) => {
    setSubjects(subjects.filter(s => s.name !== name));
    
    // Clear its exam date if present
    const updatedDates = { ...examDates };
    delete updatedDates[name];
    setExamDates(updatedDates);

    // Cancel editing if this subject was selected
    if (editingSubjectIdx !== null && subjects[editingSubjectIdx]?.name === name) {
      setEditingSubjectIdx(null);
      setNewSubName("");
      setNewSubDiff(3);
      setNewSubWeak(false);
    }
  };

  // Handle setting a subject to edit mode
  const handleStartEditSubject = (index) => {
    const sub = subjects[index];
    if (!sub) return;
    setEditingSubjectIdx(index);
    setNewSubName(sub.name);
    setNewSubDiff(sub.difficulty);
    setNewSubWeak(sub.isWeak);
  };

  // Handle canceling edit subject mode
  const handleCancelEditSubject = () => {
    setEditingSubjectIdx(null);
    setNewSubName("");
    setNewSubDiff(3);
    setNewSubWeak(false);
  };

  // Handle exam date input changes
  const handleExamDateChange = (subName, dateStr) => {
    setExamDates({
      ...examDates,
      [subName]: dateStr
    });
  };

  // Trigger serverless API timetable generation
  const handleGenerateTimetable = async () => {
    if (subjects.length === 0) {
      showToast("Please add at least one subject", "warning");
      return;
    }

    setGenerating(true);
    try {
      const targetDayVal = selectedGenerateDay === "Today Only" 
        ? new Date().toISOString().split("T")[0] 
        : selectedGenerateDay === "Specific Date"
          ? specificDate
          : selectedGenerateDay;

      const response = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          examDates,
          dailyHours,
          targetDay: targetDayVal
        })
      });
      const data = await response.json();

      if (data.success && data.schedule) {
        let updatedSchedule = [];
        const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        if (selectedGenerateDay && selectedGenerateDay !== "All Days") {
          // If we have an active timetable, merge with it
          if (activeTimetable && activeTimetable.schedule) {
            updatedSchedule = activeTimetable.schedule.filter(d => d.day !== targetDayVal);
            updatedSchedule.push(data.schedule.find(d => d.day === targetDayVal) || data.schedule[0]);
          } else {
            // Otherwise create a weekly structure where only targetDay is populated, others are empty
            updatedSchedule = DAYS.map(dayName => {
              if (dayName === targetDayVal) return data.schedule[0];
              return { day: dayName, slots: [] };
            });
            if (selectedGenerateDay === "Today Only" || selectedGenerateDay === "Specific Date") {
              updatedSchedule.unshift(data.schedule[0]);
            }
          }
        } else {
          // "All Days" generates the full schedule
          updatedSchedule = data.schedule;
        }

        await saveTimetable({
          id: activeTimetable?.id,
          createdAt: activeTimetable?.createdAt,
          subjects,
          examDates,
          dailyHours,
          schedule: updatedSchedule
        });
        showToast(`Study timetable generated successfully for ${selectedGenerateDay}!`, "success");
        if (selectedGenerateDay && selectedGenerateDay !== "All Days") {
          setActiveDayTab(targetDayVal);
        } else if (updatedSchedule.length > 0) {
          setActiveDayTab(updatedSchedule[0].day);
        }
      } else {
        throw new Error(data.error || "Generation failure");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to generate timetable. Check server status.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-brand-500" />
          Smart Timetable Generator
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Generate an optimized exam revision routine prioritizing closer deadlines and weak subjects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Parameters Management Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Subjects Manager */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              1. Add Study Subjects
            </h3>
            
            <form onSubmit={handleAddSubject} className="space-y-3">
              <input
                type="text"
                placeholder="e.g., Biochemistry, Calculus"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-brand-500"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">Difficulty:</span>
                  <select
                    value={newSubDiff}
                    onChange={(e) => setNewSubDiff(Number(e.target.value))}
                    className="bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-lg px-2 py-1 text-xs outline-none focus:border-brand-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} (Scale 1-5)</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newSubWeak}
                    onChange={(e) => setNewSubWeak(e.target.checked)}
                    className="rounded text-brand-600 border-slate-300 dark:border-slate-800"
                  />
                  <span className="text-rose-500 dark:text-rose-400">Weak Area</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer ${
                    editingSubjectIdx !== null ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-600 hover:bg-brand-700"
                  }`}
                >
                  {editingSubjectIdx !== null ? (
                    <>
                      <Edit2 className="w-3.5 h-3.5" /> Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Add Subject
                    </>
                  )}
                </button>
                {editingSubjectIdx !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEditSubject}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* List of current subjects */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {subjects.map((sub, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    editingSubjectIdx === i 
                      ? "bg-amber-500/10 border-amber-500/40" 
                      : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/30"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold truncate block">{sub.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Diff: {sub.difficulty}</span>
                      {sub.isWeak && <span className="text-rose-500 dark:text-rose-400 font-bold">Weak Subject</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => handleStartEditSubject(i)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        editingSubjectIdx === i 
                          ? "text-amber-500 hover:bg-amber-500/10" 
                          : "text-slate-400 hover:text-amber-500 hover:bg-slate-200/30"
                      }`}
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleRemoveSubject(sub.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/30 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">No subjects added yet</p>
              )}
            </div>
          </div>

          {/* Target Hours Select */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              2. Study Hours & Day Option
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Daily focus study goal:</span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{dailyHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>1 Hour</span>
                  <span>4 Hours</span>
                  <span>8 Hours</span>
                </div>
              </div>

              {/* Target Day Selector */}
              <div className="space-y-2 pt-3.5 border-t border-slate-200/40 dark:border-slate-800/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Generate for:</label>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {selectedGenerateDay === "Specific Date" ? specificDate : selectedGenerateDay}
                  </span>
                </div>
                <select
                  value={selectedGenerateDay}
                  onChange={(e) => setSelectedGenerateDay(e.target.value)}
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 cursor-pointer font-medium dark:text-slate-200"
                >
                  <option value="Today Only" className="dark:bg-slate-900">Today Only</option>
                  <option value="Specific Date" className="dark:bg-slate-900">Specific Date...</option>
                  <option value="All Days" className="dark:bg-slate-900">All Days (Full Week)</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <option key={day} value={day} className="dark:bg-slate-900">{day}</option>
                  ))}
                </select>
                {selectedGenerateDay === "Specific Date" && (
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full mt-2 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Exam Dates scheduler */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              3. Exam Deadlines (Optional)
            </h3>
            {subjects.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {subjects.map((sub, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 block">{sub.name}</label>
                    <input
                      type="date"
                      value={examDates[sub.name] || ""}
                      onChange={(e) => handleExamDateChange(sub.name, e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-brand-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 py-4">Add study subjects first</p>
            )}
          </div>

          <button
            onClick={handleGenerateTimetable}
            disabled={generating || subjects.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing weights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Schedule</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Generated Routine Output view */}
        <div className="lg:col-span-2 space-y-6">
          {activeTimetable ? (
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-full min-h-[450px]">
              <div>
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/40">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Study Routine</h3>
                    <p className="text-xs text-slate-400">Targeting {activeTimetable.dailyHours} study hours daily</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setNewSlotSubject("");
                        setNewSlotType("Focus Session");
                        setNewSlotDuration(45);
                        setNewSlotStartTime("09:00");
                        setShowAddSlotModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slot</span>
                    </button>
                    <button
                      onClick={() => handleClearDayTasks(activeDayTab)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-455 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Day</span>
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Optimized by algorithm
                    </div>
                  </div>
                </div>

                {/* Day tabs row */}
                <div className="flex gap-1.5 overflow-x-auto py-4 scrollbar-none">
                  {sortedSchedule?.map((dayObj, i) => {
                    const isSpecificDate = /^\d{4}-\d{2}-\d{2}$/.test(dayObj.day);
                    let topText = dayObj.day;
                    let bottomText = weekDates[dayObj.day];
                    
                    if (isSpecificDate) {
                       const [yyyy, mm, dd] = dayObj.day.split('-');
                       const localDate = new Date(yyyy, mm - 1, dd);
                       topText = localDate.toLocaleDateString('en-US', { weekday: 'long' });
                       bottomText = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setActiveDayTab(dayObj.day)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex flex-col items-center cursor-pointer ${
                          activeDayTab === dayObj.day
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className="leading-tight">{topText}</span>
                        {bottomText && (
                          <span className={`text-[10px] font-semibold mt-0.5 leading-none ${
                            activeDayTab === dayObj.day ? "text-brand-100/90" : "text-slate-400 dark:text-slate-500"
                          }`}>
                            {bottomText}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Slots view list */}
                <div className="space-y-3 mt-2 pr-1 max-h-[350px] overflow-y-auto">
                  {displaySlots.map((slot, idx) => {
                      const isBreak = slot.subject === "Break";
                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            if (!isBreak) {
                              navigate("/pomodoro", { state: { duration: slot.duration, subject: slot.subject } });
                            }
                          }}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all ${
                            isBreak 
                              ? "bg-slate-50/50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-850 opacity-60" 
                              : `bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/30 cursor-pointer hover:border-brand-500/40 hover:bg-slate-200/20 dark:hover:bg-slate-900/60 ${
                                  slot.completed ? "opacity-80 border-emerald-500/20" : ""
                                }`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {!isBreak && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.isOneOff) {
                                    toggleCalendarEvent(slot.targetDateStr, slot.id);
                                  } else {
                                    handleToggleCompleteSlot(activeDayTab, slot.originalIdx);
                                  }
                                }}
                                className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                                  slot.completed 
                                    ? "text-emerald-500 hover:text-slate-400" 
                                    : "text-slate-350 hover:text-emerald-500"
                                }`}
                                title={slot.completed ? "Mark Incomplete" : "Mark Completed"}
                              >
                                <CheckCircle2 className={`w-5 h-5 ${slot.completed ? "fill-emerald-500/10" : ""}`} />
                              </button>
                            )}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isBreak 
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400" 
                                : slot.completed
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-brand-500/10 text-brand-500"
                            }`}>
                              {isBreak ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <span className={`font-bold block truncate ${
                                isBreak 
                                  ? "text-slate-500" 
                                  : slot.completed
                                    ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50"
                                    : "text-slate-800 dark:text-slate-200"
                              }`}>
                                {slot.subject}
                              </span>
                              <span className="text-xs text-slate-400 truncate block">{slot.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                            <span className="text-xs text-slate-400 font-medium">({slot.duration} Mins)</span>
                            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                              isBreak 
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                : slot.completed
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                            }`}>
                              {slot.time}
                            </span>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/40 dark:border-slate-800/60">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.isOneOff) {
                                    showToast("Edit timeline events from the Timeline page.", "warning");
                                  } else {
                                    setEditingSlot({
                                      day: activeDayTab,
                                      index: slot.originalIdx,
                                      subject: slot.subject,
                                      type: slot.type,
                                      duration: slot.duration,
                                      time: slot.time
                                    });
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Edit Slot"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.isOneOff) {
                                    showToast("Delete timeline events from the Timeline page.", "warning");
                                  } else {
                                    handleRemoveSlot(activeDayTab, slot.originalIdx);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Bottom weighting explanations */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex items-start gap-2.5 text-xs text-slate-400">
                <AlertTriangle className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <p>
                  * Timetable is generated with weighted prioritization: subjects with exams in &lt; 3 days receive 12x higher weights; subjects marked as 'Weak Area' get a 2.0x weight boost. Break intervals are distributed to enhance focus memory retention.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold">No Study Timetable Active</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Adjust your study subjects on the left panel, add deadlines, and hit generate to construct an optimized revision program.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Edit Timetable Slot</h3>
            <form onSubmit={handleUpdateSlot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Subject</label>
                <input
                  type="text"
                  value={editingSlot.subject}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  placeholder="e.g. Databases"
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Session Type / Task</label>
                <input
                  type="text"
                  value={editingSlot.type}
                  onChange={(e) => setEditingSlot({ ...editingSlot, type: e.target.value })}
                  placeholder="e.g. Focus Session, Weak Area Review"
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingSlot.duration}
                    onChange={(e) => handleUpdateEditingSlotTime(getStartTimeFromInterval(editingSlot.time), Number(e.target.value))}
                    placeholder="45"
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Start Time</label>
                  <input
                    type="time"
                    value={getStartTimeFromInterval(editingSlot.time)}
                    onChange={(e) => handleUpdateEditingSlotTime(e.target.value, editingSlot.duration)}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold text-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SLOT MODAL */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Add Custom Slot to {activeDayTab}</h3>
            <form onSubmit={handleAddCustomSlot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Subject</label>
                <input
                  type="text"
                  value={newSlotSubject}
                  onChange={(e) => setNewSlotSubject(e.target.value)}
                  placeholder="e.g. Math Revision"
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Session Type / Task</label>
                <input
                  type="text"
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value)}
                  placeholder="e.g. Focus Session, Practice Deck"
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newSlotDuration}
                    onChange={(e) => setNewSlotDuration(Number(e.target.value))}
                    placeholder="45"
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Start Time</label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:text-slate-250 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold text-sm transition-all"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
