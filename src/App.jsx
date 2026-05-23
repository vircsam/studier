import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./components/Layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import Timetable from "./pages/Timetable";
import Notes from "./pages/Notes";
import Focus from "./pages/Focus";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <ToastProvider>
      <Router>
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
      </Router>
    </ToastProvider>
  );
}

export default App;
