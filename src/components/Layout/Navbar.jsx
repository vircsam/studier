import React from "react";
import { useStore } from "../../store/useStore";
import { Menu, Database, Sparkles } from "lucide-react";

export default function Navbar({ onOpenSidebar, pageTitle }) {
  const { isMockMode } = useStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-sky-100/70 dark:border-sky-900/20 bg-white/55 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:shadow-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-sky-100/80 dark:border-sky-900/30 shadow-[0_10px_24px_rgba(56,189,248,0.08)]">
          <img src="/logo.png" alt="Studier logo" className="w-7 h-7 object-contain" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock Mode Alert Banner */}
        {isMockMode ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/25 animate-pulse-slow">
            <Database className="w-3.5 h-3.5" />
            <span>Local Mock Mode</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cloud Database Sync Active</span>
          </div>
        )}
      </div>
    </header>
  );
}
