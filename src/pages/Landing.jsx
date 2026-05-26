import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { Brain, Clock, Calendar, BarChart3, ChevronRight, GraduationCap, CheckCircle2, Star } from "lucide-react";

export default function Landing() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [0.08, 0]);
  const orbY1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

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

  // Marquee duplicates for infinite scroll
  const reviews = [
    { name: "Aisha K.", role: "Medical Student", text: "Studier entirely changed my prep for midterms. The timetable generator alone saved me hours of planning!", initial: "A", color: "bg-brand-100 text-brand-600" },
    { name: "Rahul M.", role: "Computer Science", text: "The Pomodoro integration with my notes is flawless. I get so much more done in a day now.", initial: "R", color: "bg-green-100 text-green-600" },
    { name: "Sarah J.", role: "High School Senior", text: "Spaced repetition built right into my dashboard. Pinnacle plan is 100% worth it for exam season.", initial: "S", color: "bg-sky-100 text-sky-600" },
    { name: "David T.", role: "Law Student", text: "The bento box UI is gorgeous, and the flashcards algorithm is magic for retaining case laws.", initial: "D", color: "bg-amber-100 text-amber-600" },
    { name: "Emma W.", role: "Engineering", text: "I love the detailed analytics. Seeing my daily streak keeps me so motivated to study every single day.", initial: "E", color: "bg-purple-100 text-purple-600" }
  ];
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-slate-800 selection:bg-brand-500 selection:text-white bg-white flex flex-col">
      {/* Decorative Fixed Orbs with Parallax - Light Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div style={{ y: orbY1 }} className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-300/30 blur-[150px]" />
        <motion.div style={{ y: orbY2 }} className="absolute bottom-[-5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-300/30 blur-[150px]" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-sky-300/20 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent" />
      </div>

      {/* Abstract Productivity Floating Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ rotate: 360, y: [0, 20, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] left-[5%] w-24 h-24 border-[12px] border-brand-100 rounded-[2rem] opacity-40"
        />
        <motion.div 
          animate={{ rotate: -360, x: [0, 30, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[60%] right-[8%] w-16 h-16 border-8 border-green-200 rounded-full opacity-50"
        />
        <motion.div 
          animate={{ y: [0, -40, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[10%] w-32 h-32 bg-amber-100 rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl opacity-30"
        />
      </div>

      <div className="flex-1 relative z-10" ref={targetRef}>

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

        {/* Big Parallax Animated Word */}
        <motion.div 
          style={{ y: textY, opacity: opacityText }}
          className="absolute top-32 left-0 right-0 text-center pointer-events-none overflow-hidden flex justify-center z-0"
        >
          <span className="text-[12rem] sm:text-[20rem] md:text-[28rem] font-black text-brand-600 tracking-tighter leading-none select-none uppercase">
            LEARN
          </span>
        </motion.div>

        {/* Hero Section */}
        <section className="relative px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 max-w-7xl mx-auto flex flex-col items-center justify-center text-center z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-4xl relative"
          >
            {/* Animated Premium Background behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)] blur-[40px] -z-10 pointer-events-none" />
            
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white text-brand-600 border border-brand-200 shadow-sm shadow-brand-500/10"
            >
              <GraduationCap className="w-5 h-5" />
              <span>AI-Powered Study Ecosystem</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm"
            >
              Master your exams. <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 via-brand-400 to-green-500">
                Without the burnout.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto bg-white/50 backdrop-blur-sm rounded-2xl p-2"
            >
              Studier seamlessly fuses spaced repetition flashcards, smart exam timetables, dynamic notes, and focus timers into one stunning, productivity-boosting dashboard.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            >
              <Link
                to="/login"
                className="flex items-center gap-2 w-full sm:w-auto justify-center px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-brand-400 via-brand-500 to-green-500 hover:from-brand-500 hover:to-green-600 rounded-2xl shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                Start Studying Free
                <ChevronRight className="w-6 h-6" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating Dashboard Preview Card */}
          <motion.div
            variants={floatAnimation}
            animate="animate"
            className="mt-20 w-full max-w-5xl rounded-[2.5rem] overflow-hidden border border-white/40 bg-white/40 backdrop-blur-2xl p-3 shadow-[0_30px_80px_rgba(6,182,212,0.15)] will-change-transform"
          >
            <div className="rounded-[2rem] overflow-hidden bg-white/90 border border-white/60 shadow-inner">
              <div className="flex items-center gap-2 py-3 px-4 border-b border-brand-50/50 bg-slate-50/50">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-sm" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-400 shadow-sm" />
                <span className="text-xs text-slate-400 ml-2 font-mono truncate font-sans font-medium">studier.app/dashboard</span>
              </div>
              <div className="aspect-auto md:aspect-[16/9] py-6 md:py-0 bg-gradient-to-br from-brand-50/30 via-white to-green-50/30 flex items-center justify-center p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full max-w-4xl text-left">
                  <div className="col-span-1 md:col-span-2 rounded-3xl bg-white border border-slate-100 p-6 shadow-sm shadow-slate-200/50 space-y-6">
                    <div className="h-8 w-1/2 rounded-xl bg-slate-100/70" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-400 p-4 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-wider">Streak</span>
                        <span className="text-lg sm:text-2xl font-black text-white truncate">12 Days</span>
                      </div>
                      <div className="h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 border border-brand-500 p-4 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-wider">Due Cards</span>
                        <span className="text-lg sm:text-2xl font-black text-white truncate">45 Cards</span>
                      </div>
                      <div className="h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 border border-green-400 p-4 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-wider">Score</span>
                        <span className="text-lg sm:text-2xl font-black text-white truncate">98%</span>
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-white border border-slate-100 p-5 flex flex-col justify-between shadow-sm">
                      <span className="text-base font-bold text-slate-700">Today's Focus</span>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1 h-12 rounded-xl bg-brand-100/50" />
                        <div className="flex-1 h-12 rounded-xl bg-green-100/50" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white border border-slate-100 p-6 space-y-5 flex flex-col shadow-sm shadow-slate-200/50">
                    <span className="text-lg font-bold text-slate-800 block border-b border-slate-100 pb-3">Agenda</span>
                    <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-white border border-brand-100 shadow-sm">
                        <span className="font-bold text-brand-700 block">09:00 AM</span>
                        <span className="text-sm text-brand-500 font-medium">Databases Spaced Rep</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-100 shadow-sm">
                        <span className="font-bold text-amber-700 block">10:30 AM</span>
                        <span className="text-sm text-amber-600/70 font-medium">Deep Work Focus</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-white border border-green-100 shadow-sm">
                        <span className="font-bold text-green-700 block">01:00 PM</span>
                        <span className="text-sm text-green-600/70 font-medium">Web Dev Revision</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Uneven Bento Box Grid for Features */}
        <section id="features" className="px-6 py-24 max-w-7xl mx-auto z-10 relative">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-800">Unfair Advantage.</h2>
            <p className="text-xl text-slate-500 font-medium">Stop grinding. Start optimizing. The science of high-performance learning packed into one beautiful interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[300px]">
            {/* Box 1: Spaced Repetition (Spans 2 cols, 2 rows) */}
            <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 text-white shadow-2xl hover:shadow-brand-500/30 transition-all flex flex-col justify-between group overflow-hidden relative border border-white/10">
              <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-10 right-10 text-white/20 group-hover:text-white/40 transition-colors">
                <Brain className="w-32 h-32" />
              </div>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="relative z-10 mt-20 md:mt-0">
                <h3 className="text-3xl font-black mb-4">Neural Spaced Repetition</h3>
                <p className="text-brand-100 text-lg font-medium leading-relaxed max-w-md">Our SM-2 based algorithm calculates exactly when you're about to forget a concept, and tests you right before you do. Cut study time by 50% and retain 80% more.</p>
              </div>
            </div>

            {/* Box 2: Pomodoro Timer (1 col, 1 row) */}
            <div className="col-span-1 row-span-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl hover:shadow-amber-500/30 transition-all flex flex-col group overflow-hidden relative border border-white/10">
              <div className="absolute -right-5 -top-5 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 z-10">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="relative z-10 mt-auto">
                <h3 className="text-2xl font-bold mb-2">Deep Focus Timer</h3>
                <p className="text-amber-50 font-medium">Enter flow state with integrated Pomodoro tracking. Automatically logs to your analytics.</p>
              </div>
            </div>

            {/* Box 3: Timetable (1 col, 1 row) */}
            <div className="col-span-1 row-span-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-xl hover:shadow-green-500/30 transition-all flex flex-col group overflow-hidden relative border border-white/10">
              <div className="absolute -left-5 -bottom-5 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 z-10">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="relative z-10 mt-auto">
                <h3 className="text-2xl font-bold mb-2">Smart Timetables</h3>
                <p className="text-green-50 font-medium">Input your subjects and deadlines. We generate an optimized, realistic daily routine.</p>
              </div>
            </div>
            
            {/* Box 4: Analytics (Spans 3 cols, 1 row) */}
            <div className="col-span-1 md:col-span-3 row-span-1 p-8 md:p-12 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl hover:shadow-slate-500/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between group overflow-hidden relative border border-slate-800">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.1)_0%,transparent_60%)] group-hover:opacity-100 opacity-50 transition-opacity" />
              <div className="relative z-10 max-w-lg mb-8 md:mb-0">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-3xl font-black mb-4">God-Mode Analytics</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">Stop guessing if you're improving. Track daily streaks, retention rates, focus hours, and subject mastery with pinpoint accuracy.</p>
              </div>
              <div className="relative z-10 flex gap-4 w-full md:w-auto overflow-hidden">
                <div className="flex-1 md:w-32 h-40 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex flex-col items-center justify-end p-4">
                  <div className="w-full bg-brand-500 rounded-t-lg h-[60%]"></div>
                  <span className="text-slate-400 font-bold mt-3">Mon</span>
                </div>
                <div className="flex-1 md:w-32 h-40 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex flex-col items-center justify-end p-4">
                  <div className="w-full bg-green-400 rounded-t-lg h-[85%]"></div>
                  <span className="text-slate-400 font-bold mt-3">Tue</span>
                </div>
                <div className="flex-1 md:w-32 h-40 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex flex-col items-center justify-end p-4">
                  <div className="w-full bg-amber-400 rounded-t-lg h-[40%]"></div>
                  <span className="text-slate-400 font-bold mt-3">Wed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Infinite Scrolling Reviews Marquee */}
        <section className="py-24 bg-slate-50/50 border-y border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-slate-50/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-slate-50/50 to-transparent z-10 pointer-events-none" />
          
          <div className="text-center max-w-3xl mx-auto mb-16 px-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-800">Loved by 10,000+ Students</h2>
            <p className="text-lg text-slate-500 font-medium mt-4">Don't just take our word for it. Join the top 1%.</p>
          </div>

          <div className="flex w-fit relative">
            <motion.div 
              animate={{ x: ["0%", "-33.33%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-6 px-3"
            >
              {duplicatedReviews.map((review, i) => (
                <div key={i} className="w-[350px] shrink-0 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-6 text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-slate-700 font-medium text-lg leading-relaxed mb-8 flex-1">"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${review.color}`}>
                      {review.initial}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{review.name}</div>
                      <div className="text-sm text-slate-500 font-medium">{review.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Expanded Pricing Section */}
        <section className="px-6 py-32 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">Invest in your grades.</h2>
            <p className="text-xl text-slate-500 font-medium">Unlock the full power of the Studier ecosystem.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Basic</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">Essential tools to get started</p>
              <div className="text-5xl font-black text-slate-800 mb-8">₹0 <span className="text-xl font-bold text-slate-400">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" /> Up to 50 Flashcards</li>
                <li className="flex items-start gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" /> Up to 10 Notes</li>
                <li className="flex items-start gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" /> Basic Pomodoro Timer</li>
                <li className="flex items-start gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-6 h-6 text-slate-400 shrink-0" /> Standard Dashboard UI</li>
                <li className="flex items-start gap-3 text-slate-400 font-medium opacity-50"><CheckCircle2 className="w-6 h-6 text-slate-200 shrink-0" /> No Advanced Analytics</li>
              </ul>
              <Link to="/login" className="w-full py-4 px-6 rounded-2xl font-bold text-center border-2 border-slate-200 text-slate-700 hover:border-slate-800 hover:text-slate-900 transition-colors">Start Free</Link>
            </div>

            {/* Hero Plan */}
            <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-b from-brand-600 to-brand-700 border border-brand-500 shadow-2xl shadow-brand-500/30 flex flex-col relative transform md:-translate-y-6">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">Most Popular</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-brand-100 text-sm mb-6 font-medium">For serious academic performance</p>
              <div className="text-5xl font-black text-white mb-8">₹99 <span className="text-xl font-bold text-brand-200">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-white font-medium"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> Unlimited Flashcards</li>
                <li className="flex items-start gap-3 text-white font-medium"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> Unlimited Notes</li>
                <li className="flex items-start gap-3 text-white font-medium"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> Auto Timetable Generation</li>
                <li className="flex items-start gap-3 text-white font-medium"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> Streaks & Focus Tracking</li>
                <li className="flex items-start gap-3 text-white font-medium"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> Priority Email Support</li>
              </ul>
              <Link to="/login" className="w-full py-4 px-6 rounded-2xl font-black text-center bg-white text-brand-600 hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-900/20">Upgrade to Pro</Link>
            </div>

            {/* Pinnacle Plan */}
            <div className="p-8 md:p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl flex flex-col hover:shadow-2xl transition-all">
              <h3 className="text-2xl font-bold text-white mb-2">Pinnacle</h3>
              <p className="text-slate-400 text-sm mb-6 font-medium">God-mode tools for absolute mastery</p>
              <div className="text-5xl font-black text-white mb-8">₹299 <span className="text-xl font-bold text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> Everything in Pro</li>
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> AI-Powered Analytics insights</li>
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> Smart Exam Defeat Scheduling</li>
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> Custom App Themes</li>
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> 24/7 Dedicated Mentorship</li>
                <li className="flex items-start gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-6 h-6 text-brand-500 shrink-0" /> CSV Data Export</li>
              </ul>
              <Link to="/login" className="w-full py-4 px-6 rounded-2xl font-bold text-center bg-brand-600 text-white hover:bg-brand-500 transition-colors">Go Pinnacle</Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-auto relative z-20">
        <Footer />
      </div>
    </div>
  );
}
