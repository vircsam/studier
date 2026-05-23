import React from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";
import { Brain, Clock, Calendar, BarChart3, ChevronRight, GraduationCap } from "lucide-react";

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const floatAnimation = {
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-slate-100 selection:bg-brand-500 selection:text-white bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(180deg,_#06111f_0%,_#0a1628_42%,_#0d1b2f_100%)]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-400/12 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/14 blur-[150px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent pointer-events-none" />

      {/* Navbar Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-6 max-w-7xl mx-auto backdrop-blur-xl border-b border-white/10 bg-slate-950/35">
        <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-15 h-15 rounded-full bg-black/80 border border-sky-100/80 dark:border-sky-900/30 shadow-[0_10px_24px_rgba(56,189,248,0.08)] overflow-hidden">
            <img
              src="/logo.png"
              alt="Studier logo"
              className="w-14 h-14 object-cover rounded-full"
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
          Studier
        </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/login"
            className="px-2.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            to="/login?signup=true"
            className="px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-brand-500 to-indigo-500 hover:from-sky-400 hover:via-brand-400 hover:to-indigo-400 rounded-xl shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-3xl"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-400/10 text-sky-200 border border-sky-300/15 shadow-[0_0_0_1px_rgba(125,211,252,0.06)]"
          >
            <GraduationCap className="w-4 h-4" />
            <span>AI-Powered Study Assistant</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Learn smarter, retain longer, and{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-brand-300 to-indigo-300">
              study effectively
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-400 leading-relaxed font-light"
          >
            Studier combines scientifically-proven spaced repetition flashcards, smart exam timetable generation, notes, and Pomodoro focus timers into one gorgeous dashboard.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/login"
              className="flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-sky-500 via-brand-500 to-indigo-500 hover:from-sky-400 hover:via-brand-400 hover:to-indigo-400 rounded-2xl shadow-xl shadow-sky-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              Start Studying Now
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Dashboard Preview Card */}
        <motion.div
          variants={floatAnimation}
          animate="animate"
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-sky-200/10 bg-slate-950/55 p-4 shadow-[0_24px_80px_rgba(3,8,20,0.55)] will-change-transform"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 px-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500/60" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/60" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] sm:text-xs text-slate-500 ml-2 font-mono truncate">https://studier.vercel.app/dashboard</span>
          </div>
          <div className="aspect-auto md:aspect-[16/9] py-6 md:py-0 bg-[linear-gradient(135deg,_rgba(10,25,47,0.96),_rgba(8,17,31,0.92))] flex items-center justify-center p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full max-w-4xl text-left">
              <div className="col-span-1 md:col-span-2 rounded-2xl bg-white/5 border border-white/5 p-4 sm:p-5 space-y-4">
                <div className="h-6 w-1/3 rounded-lg bg-white/10" />
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="h-16 sm:h-20 rounded-xl bg-white/5 border border-white/5 p-2 sm:p-3 flex flex-col justify-between">
                    <span className="text-[9px] sm:text-xs text-slate-500 truncate">Streak</span>
                    <span className="text-xs sm:text-xl font-bold text-amber-500 truncate">5 Days 🔥</span>
                  </div>
                  <div className="h-16 sm:h-20 rounded-xl bg-white/5 border border-white/5 p-2 sm:p-3 flex flex-col justify-between">
                    <span className="text-[9px] sm:text-xs text-slate-500 truncate">Due Cards</span>
                    <span className="text-xs sm:text-xl font-bold text-brand-400 truncate">12 Cards 📚</span>
                  </div>
                  <div className="h-16 sm:h-20 rounded-xl bg-white/5 border border-white/5 p-2 sm:p-3 flex flex-col justify-between">
                    <span className="text-[9px] sm:text-xs text-slate-500 truncate">Study Score</span>
                    <span className="text-xs sm:text-xl font-bold text-emerald-400 truncate">92/100 🎯</span>
                  </div>
                </div>
                <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                  <span className="text-sm font-semibold">Weekly Study Progress</span>
                  <div className="h-20 w-full flex items-end gap-3 justify-between pb-1">
                    {[35, 60, 45, 90, 50, 75, 40].map((h, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-brand-600 to-sky-400 rounded-t-md w-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/5 p-5 space-y-4 flex flex-col justify-between">
                <span className="text-sm font-semibold block border-b border-white/5 pb-2">Upcoming Timetable</span>
                <div className="space-y-3 flex-1 pt-1">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                    <span className="font-semibold text-sky-300 block">09:00 AM - Databases</span>
                    <span className="text-slate-400">Spaced repetition deck</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs">
                    <span className="font-semibold text-brand-300 block">10:00 AM - Computer Science</span>
                    <span className="text-slate-400">Focus pomodoro session</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-300/20 text-xs">
                    <span className="font-semibold text-cyan-200 block">11:00 AM - Web Dev</span>
                    <span className="text-slate-400">Practice questions & notes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Scientifically Built For High Performance</h2>
          <p className="text-slate-400">Everything you need to streamline learning and excel in exams without cognitive overload.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-300/20 transition-all space-y-4 group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Spaced Repetition</h3>
            <p className="text-sm text-slate-400">Our SM-2 based flashcard algorithm spaces reviews dynamically. Retain 80% more details in half the study time.</p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-300/20 transition-all space-y-4 group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Timetable Generator</h3>
            <p className="text-sm text-slate-400">Input your subjects, exam schedules, and weaknesses. Generate an optimized daily routine automatically.</p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-300/20 transition-all space-y-4 group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Pomodoro Timer</h3>
            <p className="text-sm text-slate-400">Stay locked in with structured intervals. Logs study duration directly to analytics to monitor productivity.</p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-300/20 transition-all space-y-4 group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 text-cyan-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Detailed Analytics</h3>
            <p className="text-sm text-slate-400">Track streaks, weekly progress, subject distribution, and your calculated daily productivity score.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
