import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../hooks/useAuth";
import { useFirestore } from "../../hooks/useFirestore";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  CalendarDays,
  FileText, 
  Timer, 
  BarChart3, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  Award,
  Sparkles,
  CreditCard,
  Crown,
  Zap
} from "lucide-react";

const PLAN_META = {
  Free:     { label: "Free",     icon: Zap,    color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-800",    border: "border-slate-200 dark:border-slate-700" },
  Pro:      { label: "Pro",      icon: Crown,  color: "text-brand-600",  bg: "bg-brand-50 dark:bg-brand-950/40",  border: "border-brand-200 dark:border-brand-800" },
  Pinnacle: { label: "Pinnacle", icon: Sparkles,color: "text-purple-600",bg: "bg-purple-50 dark:bg-purple-950/40",border: "border-purple-200 dark:border-purple-800" },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { streak } = useFirestore();
  const { theme, toggleTheme } = useStore();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Flashcards", path: "/flashcards", icon: BookOpen },
    { name: "Timetable", path: "/timetable", icon: Calendar },
    { name: "Timeline", path: "/timeline", icon: CalendarDays },
    { name: "Notes", path: "/notes", icon: FileText },
    { name: "Focus Timer", path: "/pomodoro", icon: Timer },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
  ];

  const activeClass = "bg-gradient-to-r from-brand-50 to-green-50/50 text-brand-600 dark:bg-slate-800 dark:text-brand-400 font-bold shadow-sm border border-brand-100/50 dark:border-slate-700/50";
  const inactiveClass = "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all font-medium border border-transparent";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[20px_0_40px_rgba(0,0,0,0.02)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-brand-100 shadow-sm overflow-hidden">
              <img
                src="/logo.png"
                alt="Studier logo"
                className="w-8 h-8 object-cover rounded-full"
              />
            </div>
            <span className="amita-bold text-2xl tracking-tight text-brand-600 dark:text-brand-400">
              Studier
            </span>
          </Link>
          <button 
            onClick={onClose}
            className="p-2 rounded-full lg:hidden text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak indicator */}
        {user && (
          <div className="mx-4 mt-6 p-4 rounded-[1.25rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-amber-900/50 flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4 text-amber-500 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 dark:text-amber-500/70">Streak</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{streak} Days</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-sm ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <Sparkles className="w-3 h-3 ml-auto text-brand-400" />
                )}
              </Link>
            );
          })}

          {/* Plan badge + upgrade CTA */}
          {user && (() => {
            const plan = user.plan || "Free";
            const meta = PLAN_META[plan] || PLAN_META.Free;
            const PlanIcon = meta.icon;
            return (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${meta.bg} border ${meta.border} mb-2`}>
                  <PlanIcon className={`w-4 h-4 ${meta.color}`} />
                  <span className={`text-xs font-bold ${meta.color}`}>{meta.label} Plan</span>
                </div>
                {plan !== "Pinnacle" && (
                  <Link
                    to="/pricing"
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-sm shadow-brand-500/20 transition-all hover:-translate-y-0.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    Upgrade Plan
                  </Link>
                )}
              </div>
            );
          })()}
        </nav>

        {/* User Info / Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:border-brand-200 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
          >
            <span className="flex items-center gap-3">
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-brand-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </span>
          </button>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-green-400 text-white font-bold text-sm uppercase shadow-sm">
                    {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">
                    {user.displayName || "Student"}
                  </p>
                  <p className="text-[11px] truncate text-slate-500 font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 rounded-2xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-2xl shadow-md shadow-brand-500/20 transition-all"
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
