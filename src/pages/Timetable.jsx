import React, { useState, useMemo } from "react";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { 
  Calendar, Plus, Trash2, Clock, Sparkles, AlertTriangle, 
  CalendarDays, CheckCircle2, ChevronRight, HelpCircle 
} from "lucide-react";

export default function Timetable() {
  const { timetables, saveTimetable } = useFirestore();
  const { showToast } = useToast();

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
  const [generating, setGenerating] = useState(false);

  // Active day view for output
  const [activeDayTab, setActiveDayTab] = useState("Monday");

  // Get current timetable
  const activeTimetable = useMemo(() => {
    return timetables[0] || null;
  }, [timetables]);

  // Handle adding a subject to list
  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      showToast("Subject name is required", "warning");
      return;
    }
    if (subjects.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) {
      showToast("Subject already exists", "warning");
      return;
    }

    const sub = {
      name: newSubName.trim(),
      difficulty: Number(newSubDiff),
      isWeak: newSubWeak
    };

    setSubjects([...subjects, sub]);
    setNewSubName("");
    setNewSubDiff(3);
    setNewSubWeak(false);
    showToast(`Added ${sub.name}`, "info");
  };

  // Handle removing a subject
  const handleRemoveSubject = (name) => {
    setSubjects(subjects.filter(s => s.name !== name));
    
    // Clear its exam date if present
    const updatedDates = { ...examDates };
    delete updatedDates[name];
    setExamDates(updatedDates);
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
      const response = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          examDates,
          dailyHours
        })
      });
      const data = await response.json();

      if (data.success && data.schedule) {
        await saveTimetable({
          subjects,
          examDates,
          dailyHours,
          schedule: data.schedule
        });
        showToast("Study timetable generated successfully!", "success");
        if (data.schedule.length > 0) {
          setActiveDayTab(data.schedule[0].day);
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
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </form>

            {/* List of current subjects */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {subjects.map((sub, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/30 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold truncate block">{sub.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Diff: {sub.difficulty}</span>
                      {sub.isWeak && <span className="text-rose-500 dark:text-rose-400 font-bold">Weak Subject</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveSubject(sub.name)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4">No subjects added yet</p>
              )}
            </div>
          </div>

          {/* Exam Dates scheduler */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              2. Exam Deadlines (Optional)
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

          {/* Target Hours Select */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              3. Study Hours Target
            </h3>
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

            <button
              onClick={handleGenerateTimetable}
              disabled={generating || subjects.length === 0}
              className="w-full flex items-center justify-center gap-2 mt-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all shadow-md disabled:opacity-50"
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
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Optimized by algorithm
                  </div>
                </div>

                {/* Day tabs row */}
                <div className="flex gap-1.5 overflow-x-auto py-4 scrollbar-none">
                  {activeTimetable.schedule?.map((dayObj, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDayTab(dayObj.day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeDayTab === dayObj.day
                          ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {dayObj.day}
                    </button>
                  ))}
                </div>

                {/* Slots view list */}
                <div className="space-y-3 mt-2 pr-1 max-h-[350px] overflow-y-auto">
                  {activeTimetable.schedule
                    ?.find(d => d.day === activeDayTab)
                    ?.slots.map((slot, idx) => {
                      const isBreak = slot.subject === "Break";
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all ${
                            isBreak 
                              ? "bg-slate-50/50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-850 opacity-60" 
                              : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/30 hover:border-brand-500/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isBreak 
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400" 
                                : "bg-brand-500/10 text-brand-500"
                            }`}>
                              {isBreak ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <span className={`font-bold block ${isBreak ? "text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                                {slot.subject}
                              </span>
                              <span className="text-xs text-slate-400">{slot.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                            <span className="text-xs text-slate-400 font-medium">({slot.duration} Mins)</span>
                            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full ${
                              isBreak 
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                            }`}>
                              {slot.time}
                            </span>
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
    </div>
  );
}
