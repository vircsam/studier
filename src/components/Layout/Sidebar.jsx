import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../hooks/useAuth";
import { useFirestore } from "../../hooks/useFirestore";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  FileText, 
  Timer, 
  BarChart3, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  Award,
  Sparkles
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { streak, isMockMode } = useFirestore();
  const { theme, toggleTheme } = useStore();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Flashcards", path: "/flashcards", icon: BookOpen },
    { name: "Timetable", path: "/timetable", icon: Calendar },
    { name: "Notes", path: "/notes", icon: FileText },
    { name: "Focus Timer", path: "/pomodoro", icon: Timer },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ];

  const activeClass = "bg-gradient-to-r from-sky-500/12 to-brand-500/10 text-brand-700 dark:text-sky-200 font-medium border-l-4 border-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
  const inactiveClass = "text-slate-600 dark:text-slate-400 hover:bg-sky-50/70 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white transition-all";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-sky-100/70 dark:border-sky-900/20 bg-white/72 dark:bg-slate-950/72 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/50 dark:border-slate-800/40">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-brand-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-brand-500 to-indigo-500 dark:from-sky-300 dark:via-brand-300 dark:to-indigo-300">
              Studier
            </span>
          </Link>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak indicator */}
        {user && (
          <div className="mx-4 my-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/12 to-sky-500/10 border border-amber-400/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Streak: {streak} days</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">🔥 Active</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info / Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/40 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            <span className="flex items-center gap-3">
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </span>
          </button>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2 py-1">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-9 h-9 rounded-full object-cover border border-slate-200/50 dark:border-slate-800/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-500 text-white font-bold text-sm uppercase">
                    {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                    {user.displayName || "Student"}
                  </p>
                  <p className="text-xs truncate text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
