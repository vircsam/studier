import React, { useState, useMemo } from "react";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Star, Plus, Trash2, Search, Sparkles, 
  ArrowRight, ArrowLeft, RefreshCcw, Check, BrainCircuit
} from "lucide-react";

export default function Flashcards() {
  const { 
    flashcards, 
    addFlashcard, 
    updateFlashcard, 
    deleteFlashcard, 
    reviewFlashcard
  } = useFirestore();
  
  const { showToast } = useToast();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Medium");

  // Study Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Mock State (Commented out)
  // const [showAiModal, setShowAiModal] = useState(false);
  // const [aiTopic, setAiTopic] = useState("");
  // const [aiLoading, setAiLoading] = useState(false);

  // 1. Get unique subjects for filtering
  const subjectsList = useMemo(() => {
    const subs = flashcards.map(c => c.subject || "General");
    return ["All", ...new Set(subs)];
  }, [flashcards]);

  // 2. Filter flashcards
  const filteredCards = useMemo(() => {
    const now = Date.now();
    return flashcards.filter(c => {
      const matchesSearch = 
        c.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "All" || (c.subject || "General") === selectedSubject;
      const matchesStarred = !filterStarred || c.isStarred;
      const matchesDue = !filterDueOnly || (!c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= now);
      
      return matchesSearch && matchesSubject && matchesStarred && matchesDue;
    });
  }, [flashcards, searchQuery, selectedSubject, filterStarred, filterDueOnly]);

  // 3. Handle card manual add
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) {
      showToast("Question and Answer are required", "warning");
      return;
    }
    try {
      await addFlashcard({
        question: newQuestion,
        answer: newAnswer,
        subject: newSubject || "General",
        difficulty: newDifficulty
      });
      showToast("Flashcard created successfully", "success");
      setNewQuestion("");
      setNewAnswer("");
      setNewSubject("");
      setShowAddModal(false);
    } catch (err) {
      showToast("Failed to create flashcard", "error");
    }
  };

  // 4. Handle Spaced Repetition Grading
  const handleGradeCard = async (rating) => {
    const card = filteredCards[currentCardIndex];
    if (!card) return;

    try {
      await reviewFlashcard(card.id, rating);
      showToast(`Logged review as ${rating}`, "info");

      // Advance to next card or exit study mode
      setIsFlipped(false);
      setTimeout(() => {
        if (currentCardIndex < filteredCards.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
        } else {
          showToast("Study session complete! Excellent work.", "success");
          setIsStudyMode(false);
          setCurrentCardIndex(0);
        }
      }, 200);
    } catch (err) {
      showToast("Failed to schedule review", "error");
    }
  };

  // 5. Trigger AI Mock Generator (Commented out)
  /*
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiTopic) {
      showToast("Please specify a study topic", "warning");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/mock-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_flashcards",
          payload: { topic: aiTopic }
        })
      });
      const data = await response.json();
      
      if (data.success && data.flashcards) {
        // Add each card
        for (const card of data.flashcards) {
          await addFlashcard(card);
        }
        showToast(`Successfully generated ${data.flashcards.length} cards using AI!`, "success");
        setAiTopic("");
        setShowAiModal(false);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      showToast("AI Generation failed. Check server status.", "error");
    } finally {
      setAiLoading(false);
    }
  };
  */

  // Start study session
  const startStudySession = () => {
    if (filteredCards.length === 0) {
      showToast("No flashcards found for study filters", "warning");
      return;
    }
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudyMode(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            Flashcard Workspace
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Create, manage, and study cards using spaced repetition intervals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* <button 
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-all shadow-sm"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Generate with AI</span>
          </button> */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Card</span>
          </button>
        </div>
      </div>

      {isStudyMode ? (
        /* STUDY INTERACTIVE VIEW */
        <div className="max-w-xl mx-auto space-y-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <button 
              onClick={() => setIsStudyMode(false)}
              className="text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Exit Session
            </button>
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Card {currentCardIndex + 1} of {filteredCards.length}
            </span>
          </div>

          {/* Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 perspective-1000 cursor-pointer"
          >
            <div className={`w-full h-full duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <span className="text-xs font-semibold text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full self-start">
                  {filteredCards[currentCardIndex]?.subject || "General"}
                </span>
                <div className="text-center space-y-3 my-auto w-full">
                  <div className="font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-200">
                    {filteredCards[currentCardIndex]?.question}
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
                  <RefreshCcw className="w-3.5 h-3.5" /> Click card to flip
                </span>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-3xl p-8 flex flex-col justify-between shadow-xl border-brand-500/20 bg-brand-50/20 dark:bg-brand-950/10">
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full self-start">
                  Answer View
                </span>
                <div className="text-center space-y-3 my-auto overflow-y-auto max-h-48 w-full">
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {filteredCards[currentCardIndex]?.answer}
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 text-center">
                  Click card to view question
                </span>
              </div>
            </div>
          </div>

          {/* Review Score Actions */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-center text-slate-500 uppercase tracking-widest">
              How did you perform?
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleGradeCard("Hard")}
                className="px-4 py-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/20 text-sm transition-all"
              >
                🔴 Hard
              </button>
              <button 
                onClick={() => handleGradeCard("Medium")}
                className="px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20 text-sm transition-all"
              >
                🟡 Medium
              </button>
              <button 
                onClick={() => handleGradeCard("Easy")}
                className="px-4 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-sm transition-all"
              >
                🟢 Easy
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MANAGE & LIST CARDS VIEW */
        <div className="space-y-6">
          {/* Search, Filter & Quick Stats Toolbar */}
          <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/50 dark:bg-slate-950/40 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>

            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-100/50 dark:bg-slate-950/40 border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              {subjectsList.map((sub, i) => (
                <option key={i} value={sub}>{sub}</option>
              ))}
            </select>

            {/* Toggle Starred & Due filters */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={filterStarred}
                  onChange={(e) => setFilterStarred(e.target.checked)}
                  className="rounded text-brand-600 border-slate-300 dark:border-slate-800"
                />
                <span>Starred only</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={filterDueOnly}
                  onChange={(e) => setFilterDueOnly(e.target.checked)}
                  className="rounded text-brand-600 border-slate-300 dark:border-slate-800"
                />
                <span>Due today</span>
              </label>
            </div>

            {/* Action study button */}
            <button 
              onClick={startStudySession}
              disabled={filteredCards.length === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Study ({filteredCards.length} cards)</span>
            </button>
          </div>

          {/* Cards Grid */}
          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => {
                const isDue = !card.nextReviewDate || new Date(card.nextReviewDate).getTime() <= Date.now();
                return (
                  <div 
                    key={card.id}
                    className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-lg relative overflow-hidden"
                  >
                    {/* Subject badge and favorite icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {card.subject || "General"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateFlashcard(card.id, { isStarred: !card.isStarred })}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ${
                            card.isStarred ? "text-amber-500" : "text-slate-400"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        <button 
                          onClick={() => deleteFlashcard(card.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 space-y-2 text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-3">
                        {card.question}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-3">
                        {card.answer}
                      </p>
                    </div>

                    {/* Bottom Status bar */}
                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          card.difficulty === "Easy" ? "bg-emerald-500" : card.difficulty === "Hard" ? "bg-rose-500" : "bg-amber-500"
                        }`} />
                        <span>{card.difficulty}</span>
                      </div>
                      
                      {isDue ? (
                        <span className="font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Due today
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-75">
                          Next: {new Date(card.nextReviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl text-center space-y-4 max-w-lg mx-auto mt-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">No Flashcards Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting filters, clearing search, or creating new flashcards manually!
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg transition-all"
              >
                Create Flashcard
              </button>
            </div>
          )}
        </div>
      )}

      {/* MANUAL CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Create New Flashcard</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Question</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter study query/question"
                  rows={2}
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Answer</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Enter detailed concept explanation"
                  rows={3}
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Web Dev, CS, etc."
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold text-sm transition-all"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATE MODAL (Commented out) */}
      {/* {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-brand-500">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h3 className="text-lg font-bold">Generate Decks with AI</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input a subject or specific topic (e.g. "Linear Algebra", "Node.js Streams") to automatically draft structured flashcard decks in seconds.
            </p>

            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Study Topic</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, JavaScript Closures"
                  className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 font-semibold text-sm disabled:opacity-70 transition-all"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
}
