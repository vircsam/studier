import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../store/useStore";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout({ children, title }) {
  const { user, isAuthLoading, initializeStore } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Run initialization
    initializeStore();
  }, []);

  useEffect(() => {
    // Protected routes redirection
    if (!isAuthLoading) {
      const publicPaths = ["/", "/login"];
      if (!user && !publicPaths.includes(location.pathname)) {
        navigate("/login");
      } else if (user && (location.pathname === "/login" || location.pathname === "/")) {
        navigate("/dashboard");
      }
    }
  }, [user, isAuthLoading, location.pathname, navigate]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute w-full h-full border-4 border-brand-500/20 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Loading Studier...
        </p>
      </div>
    );
  }

  // Render children directly if in public path and no user logged in
  const isPublic = ["/", "/login"].includes(location.pathname);
  if (isPublic && !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar Nav */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} pageTitle={title} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
