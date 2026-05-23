import React, { useState, useMemo } from "react";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Star, Plus, Trash2, Search, Sparkles, 
  ArrowRight, ArrowLeft, RefreshCcw, Check, BrainCircuit, Edit2
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
  const [newTopic, setNewTopic] = useState("");
  const [newType, setNewType] = useState("Concept");
  const [newDifficulty, setNewDifficulty] = useState("Medium");

  // Edit State
  const [editingCard, setEditingCard] = useState(null);

  // Study Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
        c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.topic || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "All" || (c.subject || "General") === selectedSubject;
      const matchesStarred = !filterStarred || c.isStarred;
      const matchesDue = !filterDueOnly || (!c.nextReviewDate || new Date(c.nextReviewDate).getTime() <= now);
      
      return matchesSearch && matchesSubject && matchesStarred && matchesDue;
    });
  }, [flashcards, searchQuery, selectedSubject, filterStarred, filterDueOnly]);

  // 3. Group filtered flashcards by topic
  const groupedCards = useMemo(() => {
    const groups = {};
    filteredCards.forEach(card => {
      const topic = card.topic || "General";
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(card);
    });
    return groups;
  }, [filteredCards]);

  // 4. Handle card manual add
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      showToast("Question and Answer are required", "warning");
      return;
    }
    try {
      await addFlashcard({
        question: newQuestion,
        answer: newAnswer,
        subject: newSubject.trim() || "General",
        topic: newTopic.trim() || "General",
        type: newType,
        difficulty: newDifficulty
      });
      showToast("Flashcard created successfully", "success");
      setNewQuestion("");
      setNewAnswer("");
      setNewSubject("");
      setNewTopic("");
      setNewType("Concept");
      setNewDifficulty("Medium");
      setShowAddModal(false);
    } catch (err) {
      showToast("Failed to create flashcard", "error");
    }
  };

  // 5. Handle card edit save
  const handleUpdateCard = async (e) => {
    e.preventDefault();
    if (!editingCard) return;
    if (!editingCard.question.trim() || !editingCard.answer.trim()) {
      showToast("Question and Answer are required", "warning");
      return;
    }
    try {
      await updateFlashcard(editingCard.id, {
        question: editingCard.question,
        answer: editingCard.answer,
        subject: editingCard.subject.trim() || "General",
        topic: editingCard.topic.trim() || "General",
        type: editingCard.type || "Concept",
        difficulty: editingCard.difficulty || "Medium"
      });
      showToast("Flashcard updated successfully", "success");
      setEditingCard(null);
    } catch (err) {
      showToast("Failed to update flashcard", "error");
    }
  };

  // 6. Handle Spaced Repetition Grading
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

  const currentCard = filteredCards[currentCardIndex];

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
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
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
              className="text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
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
            className="w-full h-96 perspective-1000 cursor-pointer"
          >
            <div className={`w-full h-full duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full">
                    {currentCard?.subject || "General"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-md">
                    {currentCard?.type || "Concept"} Card
                  </span>
                </div>
                <div className="text-center space-y-3 my-auto w-full overflow-y-auto max-h-56 pr-1">
                  {currentCard?.type === "Code" || currentCard?.type === "Pattern" ? (
                    <pre className="text-left font-mono bg-slate-950 text-emerald-450 p-6 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto border border-slate-900 shadow-inner">
                      <code>{currentCard?.question}</code>
                    </pre>
                  ) : (
                    <div className="font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-200">
                      {currentCard?.question}
                    </div>
                  )}
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
                <div className="text-center space-y-3 my-auto overflow-y-auto max-h-64 w-full pr-1">
                  {currentCard?.type === "Code" || currentCard?.type === "Pattern" ? (
                    <pre className="text-left font-mono bg-slate-950 text-slate-200 p-6 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto border border-slate-900 shadow-inner">
                      <code>{currentCard?.answer}</code>
                    </pre>
                  ) : (
                    <div className="text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                      {currentCard?.answer}
                    </div>
                  )}
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
                className="px-4 py-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-450 font-bold hover:bg-rose-500/20 text-sm transition-all cursor-pointer"
              >
                🔴 Hard
              </button>
              <button 
                onClick={() => handleGradeCard("Medium")}
                className="px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-450 font-bold hover:bg-amber-500/20 text-sm transition-all cursor-pointer"
              >
                🟡 Medium
              </button>
              <button 
                onClick={() => handleGradeCard("Easy")}
                className="px-4 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-bold hover:bg-emerald-500/20 text-sm transition-all cursor-pointer"
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
                placeholder="Search by topic, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/50 dark:bg-slate-950/40 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 transition-all dark:text-slate-200"
              />
            </div>

            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-100/50 dark:bg-slate-950/40 border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer dark:text-slate-200"
            >
              {subjectsList.map((sub, i) => (
                <option key={i} value={sub} className="dark:bg-slate-900">{sub}</option>
              ))}
            </select>

            {/* Toggle Starred & Due filters */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={filterStarred}
                  onChange={(e) => setFilterStarred(e.target.checked)}
                  className="rounded text-brand-600 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <span>Starred only</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={filterDueOnly}
                  onChange={(e) => setFilterDueOnly(e.target.checked)}
                  className="rounded text-brand-600 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <span>Due today</span>
              </label>
            </div>

            {/* Action study button */}
            <button 
              onClick={startStudySession}
              disabled={filteredCards.length === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Study ({filteredCards.length} cards)</span>
            </button>
          </div>

          {/* Cards Grouped by Topic */}
          {Object.keys(groupedCards).length > 0 ? (
            <div className="space-y-10">
              {Object.entries(groupedCards).map(([topic, cards]) => (
                <div key={topic} className="space-y-4">
                  {/* Topic Group Header */}
                  <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-2">
                    <span className="w-2.5 h-2.5 rounded bg-brand-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                      Topic: {topic} ({cards.length} cards)
                    </h3>
                  </div>

                  {/* Cards Grid inside Topic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => {
                      const isDue = !card.nextReviewDate || new Date(card.nextReviewDate).getTime() <= Date.now();
                      return (
                        <div 
                          key={card.id}
                          className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-lg relative overflow-hidden text-left"
                        >
                          {/* Subject badge and favorite/edit icons */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {card.subject || "General"}
                              </span>
                              <span className="text-[9px] font-semibold tracking-wider uppercase text-indigo-550 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                {card.type || "Concept"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setEditingCard(card)}
                                className="p-1.5 rounded-lg text-slate-450 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Edit Card"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => updateFlashcard(card.id, { isStarred: !card.isStarred })}
                                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer ${
                                  card.isStarred ? "text-amber-500" : "text-slate-400"
                                }`}
                                title={card.isStarred ? "Unstar Card" : "Star Card"}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this flashcard?")) {
                                    deleteFlashcard(card.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Delete Card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Question and Answer Content */}
                          <div className="flex-1 space-y-3 text-left">
                            {card.type === "Code" || card.type === "Pattern" ? (
                              <div className="space-y-2">
                                <pre className="font-mono bg-slate-950/80 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-24 whitespace-pre-wrap text-left border border-slate-850">
                                  <code>{card.question}</code>
                                </pre>
                                <pre className="font-mono bg-slate-950/40 text-slate-350 p-2.5 rounded-lg overflow-x-auto text-[10px] leading-relaxed max-h-20 whitespace-pre-wrap text-left border border-slate-900/30">
                                  <code>{card.answer}</code>
                                </pre>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-3">
                                  {card.question}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                                  {card.answer}
                                </p>
                              </div>
                            )}
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
                              <span className="font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px]">
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
                </div>
              ))}
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
                className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg transition-all cursor-pointer"
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
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Create New Flashcard</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Card Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 cursor-pointer dark:text-slate-205"
                  >
                    <option value="Concept" className="dark:bg-slate-900">Concept / Term</option>
                    <option value="Code" className="dark:bg-slate-900">Code Snippet</option>
                    <option value="Pattern" className="dark:bg-slate-900">Algorithm Pattern</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 cursor-pointer dark:text-slate-205"
                  >
                    <option value="Easy" className="dark:bg-slate-900">Easy</option>
                    <option value="Medium" className="dark:bg-slate-900">Medium</option>
                    <option value="Hard" className="dark:bg-slate-900">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Web Dev, CS, etc."
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Topic / Category</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. React Hooks, SM2 Alg"
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-500">Question / Coding Prompt</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder={newType === "Code" ? "Paste question code here..." : "Enter study query/question"}
                  rows={4}
                  className={`w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200 ${
                    newType === "Code" || newType === "Pattern" ? "font-mono text-emerald-450 bg-slate-950/60" : ""
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-500">Answer / Concept Solution</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder={newType === "Code" ? "Paste solution code here..." : "Enter detailed concept explanation"}
                  rows={6}
                  className={`w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200 ${
                    newType === "Code" || newType === "Pattern" ? "font-mono text-slate-200 bg-slate-950/60" : ""
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold text-sm transition-all cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT CARD MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Edit Flashcard</h3>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Card Type</label>
                  <select
                    value={editingCard.type || "Concept"}
                    onChange={(e) => setEditingCard({ ...editingCard, type: e.target.value })}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 cursor-pointer dark:text-slate-205"
                  >
                    <option value="Concept" className="dark:bg-slate-900">Concept / Term</option>
                    <option value="Code" className="dark:bg-slate-900">Code Snippet</option>
                    <option value="Pattern" className="dark:bg-slate-900">Algorithm Pattern</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Difficulty</label>
                  <select
                    value={editingCard.difficulty || "Medium"}
                    onChange={(e) => setEditingCard({ ...editingCard, difficulty: e.target.value })}
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 cursor-pointer dark:text-slate-205"
                  >
                    <option value="Easy" className="dark:bg-slate-900">Easy</option>
                    <option value="Medium" className="dark:bg-slate-900">Medium</option>
                    <option value="Hard" className="dark:bg-slate-900">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={editingCard.subject || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, subject: e.target.value })}
                    placeholder="Web Dev, CS, etc."
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-500">Topic / Category</label>
                  <input
                    type="text"
                    value={editingCard.topic || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, topic: e.target.value })}
                    placeholder="e.g. React Hooks, SM2 Alg"
                    className="w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-500">Question / Coding Prompt</label>
                <textarea
                  value={editingCard.question || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                  placeholder="Enter study query/question"
                  rows={4}
                  className={`w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200 ${
                    editingCard.type === "Code" || editingCard.type === "Pattern" ? "font-mono text-emerald-450 bg-slate-950/60" : ""
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-500">Answer / Concept Solution</label>
                <textarea
                  value={editingCard.answer || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, answer: e.target.value })}
                  placeholder="Enter detailed concept explanation"
                  rows={6}
                  className={`w-full bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand-500 dark:text-slate-200 ${
                    editingCard.type === "Code" || editingCard.type === "Pattern" ? "font-mono text-slate-200 bg-slate-950/60" : ""
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white bg-brand-600 hover:bg-brand-700 font-semibold text-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
