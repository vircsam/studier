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
    <div className="relative min-h-screen overflow-hidden font-sans text-slate-800 selection:bg-brand-500 selection:text-white bg-white">
      {/* Decorative Orbs - Light Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-200/40 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-green-200/50 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-sky-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent pointer-events-none" />

      {/* Floating Navbar */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto flex items-center justify-between w-full max-w-5xl h-16 px-6 backdrop-blur-xl bg-white/70 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-full">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-brand-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Studier logo"
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">
              Studier
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-all whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              to="/login?signup=true"
              className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-brand-600 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-24 sm:py-32 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-4xl"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-brand-50 text-brand-600 border border-brand-200 shadow-[0_0_0_1px_rgba(6,182,212,0.1)]"
          >
            <GraduationCap className="w-5 h-5" />
            <span>AI-Powered Study Assistant</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Learn smarter, retain longer, and{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 via-brand-400 to-green-500">
              study effectively
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto"
          >
            Studier combines scientifically-proven spaced repetition flashcards, smart exam timetable generation, notes, and Pomodoro focus timers into one gorgeous dashboard.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <Link
              to="/login"
              className="flex items-center gap-2 w-full sm:w-auto justify-center px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-brand-400 via-brand-500 to-green-500 hover:from-brand-500 hover:to-green-600 rounded-2xl shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              Start Studying Now
              <ChevronRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Dashboard Preview Card - Light Theme */}
        <motion.div
          variants={floatAnimation}
          animate="animate"
          className="mt-20 w-full max-w-5xl rounded-[2.5rem] overflow-hidden border border-brand-100 bg-white/70 backdrop-blur-2xl p-4 shadow-[0_30px_80px_rgba(6,182,212,0.15)] will-change-transform"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-brand-50 px-3">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-400" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
            <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
            <span className="text-xs text-slate-400 ml-2 font-mono truncate font-sans">studier.app/dashboard</span>
          </div>
          <div className="aspect-auto md:aspect-[16/9] py-6 md:py-0 bg-gradient-to-br from-brand-50/50 via-white to-green-50/50 flex items-center justify-center p-4 sm:p-8 rounded-b-[2rem]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full max-w-4xl text-left">
              <div className="col-span-1 md:col-span-2 rounded-3xl bg-white border border-brand-100 p-6 shadow-sm space-y-6">
                <div className="h-8 w-1/2 rounded-xl bg-brand-50" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-20 sm:h-24 rounded-2xl bg-amber-50 border border-amber-100 p-4 flex flex-col justify-between">
                    <span className="text-xs text-amber-600/70 font-bold uppercase tracking-wider">Streak</span>
                    <span className="text-lg sm:text-2xl font-bold text-amber-600 truncate">5 Days</span>
                  </div>
                  <div className="h-20 sm:h-24 rounded-2xl bg-brand-50 border border-brand-100 p-4 flex flex-col justify-between">
                    <span className="text-xs text-brand-600/70 font-bold uppercase tracking-wider">Due Cards</span>
                    <span className="text-lg sm:text-2xl font-bold text-brand-600 truncate">12 Cards</span>
                  </div>
                  <div className="h-20 sm:h-24 rounded-2xl bg-green-50 border border-green-100 p-4 flex flex-col justify-between">
                    <span className="text-xs text-green-600/70 font-bold uppercase tracking-wider">Productivity</span>
                    <span className="text-lg sm:text-2xl font-bold text-green-600 truncate">92%</span>
                  </div>
                </div>
                <div className="flex-1 rounded-2xl bg-white border border-slate-100 p-5 flex flex-col justify-between">
                  <span className="text-base font-bold text-slate-700">Today's Focus</span>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 h-12 rounded-xl bg-brand-100/50" />
                    <div className="flex-1 h-12 rounded-xl bg-green-100/50" />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-white border border-brand-100 p-6 space-y-5 flex flex-col shadow-sm">
                <span className="text-lg font-bold text-slate-800 block border-b border-slate-100 pb-3">Agenda</span>
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-100">
                    <span className="font-bold text-brand-700 block">09:00 AM - Databases</span>
                    <span className="text-sm text-brand-500 font-medium">Spaced repetition</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100">
                    <span className="font-bold text-amber-700 block">10:00 AM - CS</span>
                    <span className="text-sm text-amber-600/70 font-medium">Focus session</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-50/80 border border-green-100">
                    <span className="font-bold text-green-700 block">11:00 AM - Web Dev</span>
                    <span className="text-sm text-green-600/70 font-medium">Notes & revision</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid - Light Theme */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">Scientifically Built For High Performance</h2>
          <p className="text-xl text-slate-500 font-medium">Everything you need to streamline learning and excel in exams without cognitive overload.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-[2rem] bg-white border border-brand-100 hover:border-brand-300 transition-all space-y-5 group shadow-lg shadow-brand-500/5 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Spaced Repetition</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Our SM-2 based flashcard algorithm spaces reviews dynamically. Retain 80% more details in half the study time.</p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-[2rem] bg-white border border-green-100 hover:border-green-300 transition-all space-y-5 group shadow-lg shadow-green-500/5 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Timetable Generator</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Input your subjects, exam schedules, and weaknesses. Generate an optimized daily routine automatically.</p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-[2rem] bg-white border border-amber-100 hover:border-amber-300 transition-all space-y-5 group shadow-lg shadow-amber-500/5 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Pomodoro Timer</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Stay locked in with structured intervals. Logs study duration directly to analytics to monitor productivity.</p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-[2rem] bg-white border border-sky-100 hover:border-sky-300 transition-all space-y-5 group shadow-lg shadow-sky-500/5 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Detailed Analytics</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Track streaks, weekly progress, subject distribution, and your calculated daily productivity score.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-white border-t border-brand-50">
        <Footer />
      </div>
    </div>
  );
}
