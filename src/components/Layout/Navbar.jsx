import React from "react";
import { useStore } from "../../store/useStore";
import { Menu, Database, ShieldAlert, Sparkles } from "lucide-react";

export default function Navbar({ onOpenSidebar, pageTitle }) {
  const { isMockMode } = useStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-slate-800/40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock Mode Alert Banner */}
        {isMockMode ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse-slow">
            <Database className="w-3.5 h-3.5" />
            <span>Local Mock Mode</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cloud Database Sync Active</span>
          </div>
        )}
      </div>
    </header>
  );
}
