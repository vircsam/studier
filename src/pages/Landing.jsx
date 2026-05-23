import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Brain, Clock, Calendar, BarChart3, ChevronRight, GraduationCap } from "lucide-react";

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
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* Navbar Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-6 max-w-7xl mx-auto backdrop-blur-md border-b border-white/5 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-indigo-400">
            Studier
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/login?signup=true"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Get Started Free
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20"
          >
            <GraduationCap className="w-4 h-4" />
            <span>AI-Powered Study Assistant</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Learn smarter, retain longer, and{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-indigo-400 to-blue-400">
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
              className="flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              Start Studying Now
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-center px-8 py-4 text-base font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-2xl transition-all"
            >
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        {/* Floating Dashboard Preview Card */}
        <motion.div
          variants={floatAnimation}
          animate="animate"
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 bg-slate-950/60 p-4 shadow-2xl"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 px-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500/60" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/60" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">https://studier.vercel.app/dashboard</span>
          </div>
          <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-8">
            <div className="grid grid-cols-3 gap-4 w-full h-full max-w-4xl text-left">
              <div className="col-span-2 rounded-2xl bg-white/5 border border-white/5 p-5 space-y-4">
                <div className="h-6 w-1/3 rounded-lg bg-white/10" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                    <span className="text-xs text-slate-500">Streak</span>
                    <span className="text-xl font-bold text-amber-500">5 Days 🔥</span>
                  </div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                    <span className="text-xs text-slate-500">Due Flashcards</span>
                    <span className="text-xl font-bold text-brand-400">12 Cards 📚</span>
                  </div>
                  <div className="h-20 rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                    <span className="text-xs text-slate-500">Study Score</span>
                    <span className="text-xl font-bold text-emerald-400">92/100 🎯</span>
                  </div>
                </div>
                <div className="h-32 rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                  <span className="text-sm font-semibold">Weekly Study Progress</span>
                  <div className="h-20 w-full flex items-end gap-3 justify-between pb-1">
                    {[35, 60, 45, 90, 50, 75, 40].map((h, i) => (
                      <div
                        key={i}
                        className="bg-brand-500 rounded-t-md w-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/5 p-5 space-y-4 flex flex-col justify-between">
                <span className="text-sm font-semibold block border-b border-white/5 pb-2">Upcoming Timetable</span>
                <div className="space-y-3 flex-1 pt-1">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                    <span className="font-semibold text-indigo-400 block">09:00 AM - Databases</span>
                    <span className="text-slate-400">Spaced repetition deck</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs">
                    <span className="font-semibold text-brand-400 block">10:00 AM - Computer Science</span>
                    <span className="text-slate-400">Focus pomodoro session</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <span className="font-semibold text-emerald-400 block">11:00 AM - Web Dev</span>
                    <span className="text-slate-400">Practice questions & notes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Scientifically Built For High Performance</h2>
          <p className="text-slate-400">Everything you need to streamline learning and excel in exams without cognitive overload.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Spaced Repetition</h3>
            <p className="text-sm text-slate-400">Our SM-2 based flashcard algorithm spaces reviews dynamically. Retain 80% more details in half the study time.</p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Timetable Generator</h3>
            <p className="text-sm text-slate-400">Input your subjects, exam schedules, and weaknesses. Generate an optimized daily routine automatically.</p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Pomodoro Timer</h3>
            <p className="text-sm text-slate-400">Stay locked in with structured intervals. Logs study duration directly to analytics to monitor productivity.</p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Detailed Analytics</h3>
            <p className="text-sm text-slate-400">Track streaks, weekly progress, subject distribution, and your calculated daily productivity score.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <span>© 2026 Studier App. Built for students who want to excel.</span>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-300 cursor-pointer">Contact Support</span>
        </div>
      </footer>
    </div>
  );
}
