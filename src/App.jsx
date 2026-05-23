import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./components/Layout/AppLayout";

// Lazy load pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Timetable = lazy(() => import("./pages/Timetable"));
const Notes = lazy(() => import("./pages/Notes"));
const Focus = lazy(() => import("./pages/Focus"));
const Analytics = lazy(() => import("./pages/Analytics"));

// Compact, beautiful loader for lazy loaded pages
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-transparent">
    <div className="relative flex items-center justify-center w-12 h-12">
      <div className="absolute w-full h-full border-4 border-brand-500/20 rounded-full animate-pulse"></div>
      <div className="absolute w-full h-full border-4 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
              path="/" 
              element={
                <AppLayout>
                  <Landing />
                </AppLayout>
              } 
            />
            <Route 
              path="/login" 
              element={
                <AppLayout>
                  <Login />
                </AppLayout>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <AppLayout title="Dashboard Overview">
                  <Dashboard />
                </AppLayout>
              } 
            />
            <Route 
              path="/flashcards" 
              element={
                <AppLayout title="Flashcard Decks">
                  <Flashcards />
                </AppLayout>
              } 
            />
            <Route 
              path="/timetable" 
              element={
                <AppLayout title="Timetable Routine">
                  <Timetable />
                </AppLayout>
              } 
            />
            <Route 
              path="/notes" 
              element={
                <AppLayout title="Notes Workspace">
                  <Notes />
                </AppLayout>
              } 
            />
            <Route 
              path="/pomodoro" 
              element={
                <AppLayout title="Pomodoro Focus Timer">
                  <Focus />
                </AppLayout>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <AppLayout title="Study Analytics">
                  <Analytics />
                </AppLayout>
              } 
            />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

export default App;
