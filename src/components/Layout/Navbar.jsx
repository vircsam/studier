import React from "react";
import { useStore } from "../../store/useStore";
import { Menu, Database, Sparkles } from "lucide-react";

export default function Navbar({ onOpenSidebar, pageTitle }) {
  const { isMockMode } = useStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="amita-bold text-2xl tracking-tight text-slate-800 dark:text-slate-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock Mode Alert Banner */}
        {isMockMode ? (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20 shadow-sm animate-pulse-slow">
            <Database className="w-4 h-4" />
            <span>Local Mock Mode</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-400/20 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Cloud Sync Active</span>
          </div>
        )}
      </div>
    </header>
  );
}
