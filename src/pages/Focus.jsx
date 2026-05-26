import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { 
  Play, Pause, RotateCcw, Timer, Award, Coffee, BookOpen, 
  ListTodo, CheckCircle2, Volume2, VolumeX 
} from "lucide-react";

export default function Focus() {
  const location = useLocation();
  const { flashcards, logStudySession, studySessions, timetables } = useFirestore();
  const { showToast } = useToast();

  const [mode, setMode] = useState("focus"); // focus, short_break, long_break
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("General");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef(null);
  const targetEndTimeRef = useRef(null);

  const [focusDuration, setFocusDuration] = useState(25 * 60);

  // Mode durations in seconds
  const DURATIONS = useMemo(() => ({
    focus: focusDuration,
    short_break: 5 * 60,
    long_break: 15 * 60
  }), [focusDuration]);

  // Sync unique subjects from both flashcards and timetables to populate focus selector
  const subjectsList = useMemo(() => {
    const subs = new Set(["General"]);
    flashcards.forEach(c => { if (c.subject) subs.add(c.subject); });
    if (timetables && timetables.length > 0) {
      const activeTt = timetables[0];
      if (activeTt.subjects) {
        activeTt.subjects.forEach(s => { if (s.name) subs.add(s.name); });
      }
      activeTt.schedule?.forEach(day => {
        day.slots?.forEach(slot => {
          if (slot.subject && slot.subject !== "Break") {
            subs.add(slot.subject);
          }
        });
      });
    }
    return Array.from(subs);
  }, [flashcards, timetables]);

  // Set default duration on mode change
  useEffect(() => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode]);
  }, [mode, DURATIONS]);

  // Read navigation state parameters on load
  useEffect(() => {
    if (location.state?.duration) {
      const durationSeconds = Number(location.state.duration) * 60;
      setFocusDuration(durationSeconds);
      setTimeLeft(durationSeconds);
      setMode("focus");
    }
    if (location.state?.subject) {
      setSelectedSubject(location.state.subject);
    }
  }, [location.state]);

  // Timer countdown engine
  useEffect(() => {
    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      }
      timerRef.current = setInterval(() => {
        const remaining = Math.round((targetEndTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimeLeft(0);
          setIsRunning(false);
          targetEndTimeRef.current = null;
          handleTimerComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      targetEndTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedSubject]);

  // Synthesize alarm sound using Web Audio API
  const playAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      // Chime sequence
      const playTone = (freq, startTime, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.2); // C5
      playTone(659.25, now + 0.15, 0.2); // E5
      playTone(783.99, now + 0.3, 0.4); // G5
    } catch (e) {
      console.warn("Could not play synthesized audio alarm chime:", e);
    }
  };

  // Triggered on timer completion
  const handleTimerComplete = async () => {
    setIsRunning(false);
    playAlarmSound();

    if (mode === "focus") {
      const minutesCompleted = Math.round(DURATIONS.focus / 60);
      try {
        await logStudySession({
          subject: selectedSubject,
          durationMinutes: minutesCompleted,
          type: "focus",
          score: 90
        });
        showToast(`Congratulations! You completed a ${minutesCompleted}-minute focus block on ${selectedSubject}.`, "success");
      } catch (err) {
        showToast("Session completed, but failed to log progress to cloud.", "warning");
      }
      setMode("short_break"); // automatic swap to break
    } else {
      showToast("Break over! Time to focus and learn.", "info");
      setMode("focus");
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTimeLeft(DURATIONS[mode]);
    showToast("Timer reset", "info");
  };

  // Timer format display helper
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calculate circular stroke progress
  const progressPercent = useMemo(() => {
    const total = DURATIONS[mode];
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, mode]);

  // Recents sessions logged today
  const todaysSessions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return studySessions.filter(s => s.date === todayStr && (!s.type || s.type === "focus"));
  }, [studySessions]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Timer className="w-6 h-6 text-brand-500" />
            Pomodoro Focus Timer
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Maintain high concentrations using structural focus intervals and restful breaks
          </p>
        </div>
        
        {/* Sound toggle controls */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-550/20"
              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>Audio Alerts</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Interactive Pomodoro Engine */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center glass-panel p-8 sm:p-12 rounded-3xl space-y-8 min-h-[450px]">
          
          {/* Mode Swapper buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-850 w-full max-w-sm">
            <button
              onClick={() => setMode("focus")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === "focus" 
                  ? "bg-brand-600 text-white shadow-md" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Focus
            </button>
            <button
              onClick={() => setMode("short_break")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === "short_break" 
                  ? "bg-brand-600 text-white shadow-md" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Short Break
            </button>
            <button
              onClick={() => setMode("long_break")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === "long_break" 
                  ? "bg-brand-600 text-white shadow-md" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Long Break
            </button>
          </div>

          {/* SVG Circular countdown dial */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="114"
                className="stroke-slate-200 dark:stroke-slate-900 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="128"
                cy="128"
                r="114"
                className="stroke-brand-500 dark:stroke-brand-500 fill-none transition-all duration-300"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 114}
                strokeDashoffset={2 * Math.PI * 114 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center space-y-1">
              <span className="text-5xl font-mono font-extrabold tracking-tighter text-slate-800 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {mode === "focus" ? "Study Mode" : "Break Mode"}
              </span>
            </div>
          </div>

          {/* Subject target select */}
          {mode === "focus" && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Target subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={isRunning}
                className="bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-1.5 text-xs outline-none cursor-pointer disabled:opacity-50"
              >
                {subjectsList.map((sub, i) => (
                  <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Control play stop buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-500"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Columns: Focus History Dashboard */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-full min-h-[450px]">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2 text-sm">
              <ListTodo className="w-4 h-4 text-brand-500" />
              Focus Blocks Completed Today
            </h3>

            {/* List log items */}
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[300px] pr-1">
              {todaysSessions.length > 0 ? (
                todaysSessions.map((sess, i) => (
                  <div 
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between text-xs font-semibold"
                  >
                    <div className="space-y-0.5">
                      <span className="text-slate-800 dark:text-slate-200 block font-bold">{sess.subject}</span>
                      <span className="text-[10px] text-slate-400">Duration: {sess.durationMinutes} minutes</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-16 space-y-2">
                  <Timer className="w-8 h-8 mx-auto opacity-30" />
                  <p>No study sessions saved today yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Goal Progress bar summary */}
          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/40 space-y-2.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Daily Study Target:</span>
              <span className="text-slate-800 dark:text-slate-200">
                {todaysSessions.reduce((acc, s) => acc + s.durationMinutes, 0)} / 120 mins
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (todaysSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 120) * 100)}%` 
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
