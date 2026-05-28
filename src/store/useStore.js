import { create } from "zustand";
import { auth, db } from "../firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import {
  createUserProfile,
  dbAddFlashcard,
  dbUpdateFlashcard,
  dbDeleteFlashcard,
  dbAddNote,
  dbUpdateNote,
  dbDeleteNote,
  dbLogStudySession,
  dbSaveTimetable,
  dbToggleTimelineCompletion,
  dbAddCalendarEvent,
  dbToggleCalendarEvent,
  dbUpdateUserPlan
} from "../services/db";
import {
  createSubscription,
  verifyPayment,
  openCheckout,
  loadRazorpayScript
} from "../services/razorpayService";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Module-level array to hold Firestore active onSnapshot unsubscribe functions
let unsubscribers = [];

export const useStore = create((set, get) => ({
  // State
  user: null,
  isAuthLoading: true,
  isInitialized: false,
  flashcards: [],
  notes: [],
  studySessions: [],
  timetables: [],
  timelineCompletions: {},
  calendarEvents: {},
  theme: localStorage.getItem("studier_theme") || "dark",
  isMockMode: false,
  streak: 1,
  productivityScore: 60,

  // Payment State
  paymentStatus: null, // null | 'processing' | 'success' | 'failed'
  paymentError: null,
  selectedPlan: null,

  // Timer State
  focusMode: "focus",
  focusTimeLeft: 25 * 60,
  focusIsRunning: false,
  focusTargetEndTime: null,
  focusSelectedSubject: "General",
  focusDurationSetting: 25 * 60,
  setFocusState: (updates) => set((state) => ({ ...state, ...updates })),

  // Plan Limits checking
  hasReachedLimit: (type) => {
    const { user, flashcards, notes } = get();
    if (!user) return true; // Block if not logged in
    
    const plan = user.plan || "Free";
    if (plan === "Pinnacle") return false;

    if (type === "flashcards") {
      const limit = plan === "Pro" ? 50 : 10;
      return flashcards.length >= limit;
    }
    if (type === "notes") {
      const limit = plan === "Pro" ? 50 : 5;
      return notes.length >= limit;
    }
    return false;
  },

  upgradePlan: async (newPlan) => {
    const { user } = get();
    if (!user) return;
    await dbUpdateUserPlan(user.uid, newPlan);
    set({ user: { ...user, plan: newPlan } });
  },

  // Payment Actions
  clearPaymentStatus: () => set({ paymentStatus: null, paymentError: null, selectedPlan: null }),

  initiatePayment: async (planName) => {
    const { user } = get();
    if (!user) return;

    set({ selectedPlan: planName, paymentStatus: null, paymentError: null });

    try {
      // 1. Preload Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway.");

      // 2. Create subscription on backend
      const { subscriptionId } = await createSubscription(planName, user.uid, user.email);

      // 3. Open Razorpay Checkout
      await openCheckout({
        subscriptionId,
        planName,
        userName: user.displayName || user.name,
        userEmail: user.email,
        onSuccess: async (response) => {
          set({ paymentStatus: "processing" });
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.uid,
              planName,
            });
            await dbUpdateUserPlan(user.uid, planName);
            set({
              user: { ...get().user, plan: planName },
              paymentStatus: "success",
            });
          } catch (err) {
            set({ paymentStatus: "failed", paymentError: err.message });
          }
        },
        onFailure: (err) => {
          set({ paymentStatus: "failed", paymentError: err.description || "Payment failed" });
        },
        onDismiss: () => {
          set({ selectedPlan: null });
        },
      });
    } catch (err) {
      set({ paymentStatus: "failed", paymentError: err.message });
    }
  },

  // Theme Actions
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("studier_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: nextTheme });
  },

  // Auth Actions
  signInEmail: async (email, password) => {
    set({ isAuthLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      if (!fbUser.emailVerified) {
        await signOut(auth);
        set({ isAuthLoading: false });
        const verificationError = new Error("Please verify your email before signing in.");
        verificationError.code = "auth/email-not-verified";
        throw verificationError;
      }

      const userData = await createUserProfile(fbUser.uid, fbUser);
      set({ user: userData });
      return userData;
    } catch (error) {
      set({ isAuthLoading: false });
      throw error;
    }
  },

  signUpEmail: async (email, password, displayName) => {
    set({ isAuthLoading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      await sendEmailVerification(fbUser);
      const userData = await createUserProfile(fbUser.uid, {
        email: fbUser.email,
        displayName: displayName || fbUser.displayName
      });
      await signOut(auth);
      set({ user: null, isAuthLoading: false });
      return { ...userData, verificationEmailSent: true };
    } catch (error) {
      set({ isAuthLoading: false });
      throw error;
    }
  },

  signInGoogle: async () => {
    set({ isAuthLoading: true });
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const userData = await createUserProfile(fbUser.uid, fbUser);
      set({ user: userData });
      return userData;
    } catch (error) {
      set({ isAuthLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // Clear Firestore snapshots first
    unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch (err) {
        console.error("Error unsubscribing:", err);
      }
    });
    unsubscribers = [];

    await signOut(auth);
    set({ 
      user: null, 
      flashcards: [], 
      notes: [], 
      studySessions: [], 
      timetables: [],
      timelineCompletions: {},
      calendarEvents: {},
      streak: 1,
      productivityScore: 60,
      isAuthLoading: false 
    });
  },

  initializeStore: () => {
    // Apply theme
    if (get().theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (get().isInitialized) {
      return;
    }

    set({ isInitialized: true, isAuthLoading: true });

    onAuthStateChanged(auth, async (fbUser) => {
      // Clear previous snapshots
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (err) {
          console.error("Error unsubscribing:", err);
        }
      });
      unsubscribers = [];

      if (fbUser) {
        try {
          // Initialize/update user profile doc
          const userData = await createUserProfile(fbUser.uid, fbUser);
          set({ 
            user: userData,
            timelineCompletions: userData.timelineCompletions || {},
            calendarEvents: userData.calendarEvents || {}
          });

          // 1. Sync Flashcards
          const fcQuery = query(collection(db, "flashcards"), where("userId", "==", fbUser.uid));
          const fcUnsub = onSnapshot(fcQuery, (snapshot) => {
            const flashcards = [];
            snapshot.forEach(docSnap => {
              flashcards.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by createdAt descending
            flashcards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            set({ flashcards });
            get().recalculateMetrics();
          }, (err) => {
            console.error("Flashcards subscription failed:", err);
          });
          unsubscribers.push(fcUnsub);

          // 2. Sync Notes
          const notesQuery = query(collection(db, "notes"), where("userId", "==", fbUser.uid));
          const notesUnsub = onSnapshot(notesQuery, (snapshot) => {
            const notes = [];
            snapshot.forEach(docSnap => {
              notes.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by updatedAt descending
            notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            set({ notes });
            get().recalculateMetrics();
          }, (err) => {
            console.error("Notes subscription failed:", err);
          });
          unsubscribers.push(notesUnsub);

          // 3. Sync Study Sessions
          const sessionsQuery = query(collection(db, "studySessions"), where("userId", "==", fbUser.uid));
          const sessionsUnsub = onSnapshot(sessionsQuery, (snapshot) => {
            const studySessions = [];
            snapshot.forEach(docSnap => {
              studySessions.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by createdAt descending
            studySessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            set({ studySessions });
            get().recalculateMetrics();
          }, (err) => {
            console.error("Sessions subscription failed:", err);
          });
          unsubscribers.push(sessionsUnsub);

          // 4. Sync Timetables
          const ttQuery = query(collection(db, "timetables"), where("userId", "==", fbUser.uid));
          const ttUnsub = onSnapshot(ttQuery, (snapshot) => {
            const timetables = [];
            snapshot.forEach(docSnap => {
              timetables.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by updatedAt descending
            timetables.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            set({ timetables });
            get().recalculateMetrics();
          }, (err) => {
            console.error("Timetables subscription failed:", err);
          });
          unsubscribers.push(ttUnsub);



        } catch (e) {
          console.error("Failed to load user session data from Firestore:", e);
        } finally {
          set({ isAuthLoading: false });
        }
      } else {
        set({ 
          user: null, 
          flashcards: [], 
          notes: [], 
          studySessions: [], 
          timetables: [], 
          timelineCompletions: {},
          calendarEvents: {},
          streak: 1, 
          productivityScore: 60, 
          isAuthLoading: false 
        });
      }
    });
  },

  // Recalculates dashboard numbers
  recalculateMetrics: () => {
    const { flashcards, studySessions, user } = get();
    if (!user) return;

    // 1. Mastery Percentage
    const totalFC = flashcards.length;
    const masteredFC = flashcards.filter(f => f.isMastered).length;

    // 2. Streaks
    const today = new Date().toISOString().split("T")[0];
    const uniqueDates = [...new Set(studySessions.map(s => s.date))];
    uniqueDates.sort((a, b) => new Date(b) - new Date(a)); // Descending order
    
    let calcStreak = 0;
    let hasActivityToday = uniqueDates.includes(today);
    let currentCheckStr = today;
    
    if (!hasActivityToday) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (uniqueDates.includes(yesterday)) {
        currentCheckStr = yesterday;
      } else {
        currentCheckStr = null;
      }
    }

    if (currentCheckStr) {
      calcStreak = 0;
      let target = new Date(currentCheckStr);
      while (true) {
        const targetStr = target.toISOString().split("T")[0];
        if (uniqueDates.includes(targetStr)) {
          calcStreak++;
          target.setDate(target.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      calcStreak = 0;
    }

    const finalStreak = Math.max(calcStreak, user.streak || 1);

    // 3. Productivity Score
    const thisWeek = new Date(Date.now() - 7 * 86400000).getTime();
    const recentSessions = studySessions.filter(s => new Date(s.createdAt).getTime() > thisWeek);
    const weeklyFocusMins = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const avgDailyFocus = weeklyFocusMins / 7;
    
    const focusScore = Math.min((avgDailyFocus / 45) * 50, 50); // Target 45 min focus avg daily
    const cardsScore = totalFC > 0 ? (masteredFC / totalFC) * 30 : 15;
    const notesBonus = Math.min(get().notes.length * 4, 20);
    
    const prodScore = Math.min(100, Math.round(focusScore + cardsScore + notesBonus));

    // Update streak locally
    set({ 
      streak: finalStreak,
      productivityScore: prodScore || 60
    });
  },

  // Flashcards CRUD
  addFlashcard: async (card) => {
    const { user } = get();
    if (!user) return;

    const newCard = {
      id: generateId(),
      userId: user.uid,
      question: card.question,
      answer: card.answer,
      subject: card.subject || "General",
      topic: card.topic || "General",
      type: card.type || "Concept",
      difficulty: card.difficulty || "Medium",
      efactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewedAt: null,
      nextReviewDate: new Date().toISOString(),
      isStarred: false,
      isMastered: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbAddFlashcard(newCard);
  },

  updateFlashcard: async (id, updates) => {
    await dbUpdateFlashcard(id, updates);
  },

  deleteFlashcard: async (id) => {
    await dbDeleteFlashcard(id);
  },

  reviewFlashcard: async (id, rating) => {
    const { flashcards } = get();
    const card = flashcards.find(c => c.id === id);
    if (!card) return;

    let { efactor, interval, repetitions } = card;

    if (rating === "Hard") {
      repetitions = 0;
      interval = 1;
      efactor = Math.max(1.3, efactor - 0.2);
    } else if (rating === "Medium") {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 3;
      else interval = Math.round(interval * efactor);
    } else { // Easy
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * efactor * 1.3);
      efactor = Math.min(3.0, efactor + 0.15);
    }

    const nextReviewDate = new Date(Date.now() + interval * 86400000).toISOString();
    const isMastered = repetitions >= 3;

    const updates = {
      repetitions,
      interval,
      efactor,
      nextReviewDate,
      isMastered,
      lastReviewedAt: new Date().toISOString()
    };

    await dbUpdateFlashcard(id, updates);
  },

  // Notes CRUD
  addNote: async (note) => {
    const { user } = get();
    if (!user) return;

    const newNote = {
      id: generateId(),
      userId: user.uid,
      title: note.title || "Untitled Note",
      content: note.content || "",
      tags: note.tags || [],
      subject: note.subject || "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbAddNote(newNote);
  },

  updateNote: async (id, updates) => {
    await dbUpdateNote(id, updates);
  },

  deleteNote: async (id) => {
    await dbDeleteNote(id);
  },

  // Pomodoro timer logs
  logStudySession: async (sessionData) => {
    const { user } = get();
    if (!user) return;

    const newSession = {
      id: generateId(),
      userId: user.uid,
      subject: sessionData.subject || "General",
      durationMinutes: sessionData.durationMinutes,
      type: sessionData.type || "focus",
      score: sessionData.score || 85,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    await dbLogStudySession(newSession);
  },

  // Timetable
  saveTimetable: async (timetableData) => {
    const { user } = get();
    if (!user) return;

    const newTimetable = {
      id: timetableData.id || generateId(),
      userId: user.uid,
      subjects: timetableData.subjects,
      examDates: timetableData.examDates,
      dailyHours: timetableData.dailyHours,
      schedule: timetableData.schedule,
      createdAt: timetableData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbSaveTimetable(newTimetable);
  },

  // Timeline completions
  toggleTimelineCompletion: async (dateStr, slotIndex) => {
    const { user, timelineCompletions } = get();
    if (!user) return;
    
    // Optimistic UI update
    const currentCompletions = timelineCompletions[dateStr] || [];
    let newIndices;
    if (currentCompletions.includes(slotIndex)) {
      newIndices = currentCompletions.filter(i => i !== slotIndex);
    } else {
      newIndices = [...currentCompletions, slotIndex];
    }
    
    set({
      timelineCompletions: {
        ...timelineCompletions,
        [dateStr]: newIndices
      }
    });

    try {
      await dbToggleTimelineCompletion(user.uid, dateStr, slotIndex);
    } catch (err) {
      // Revert on error
      set({ timelineCompletions });
      throw err;
    }
  },

  // One-off Calendar Events
  addCalendarEvent: async (dateStr, eventData) => {
    const { user, calendarEvents } = get();
    if (!user) return;
    
    const newEvent = { ...eventData, id: generateId(), completed: false };
    const dateEvents = calendarEvents[dateStr] || [];
    
    set({
      calendarEvents: {
        ...calendarEvents,
        [dateStr]: [...dateEvents, newEvent]
      }
    });

    try {
      await dbAddCalendarEvent(user.uid, dateStr, newEvent);
    } catch (err) {
      set({ calendarEvents });
      throw err;
    }
  },

  toggleCalendarEvent: async (dateStr, eventId) => {
    const { user, calendarEvents } = get();
    if (!user) return;
    
    const dateEvents = calendarEvents[dateStr] || [];
    const updatedEvents = dateEvents.map(ev => 
      ev.id === eventId ? { ...ev, completed: !ev.completed } : ev
    );
    
    set({
      calendarEvents: {
        ...calendarEvents,
        [dateStr]: updatedEvents
      }
    });

    try {
      await dbToggleCalendarEvent(user.uid, dateStr, eventId);
    } catch (err) {
      set({ calendarEvents });
      throw err;
    }
  }
}));
