import { create } from "zustand";
import { 
  auth, db, isMockMode 
} from "../firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  addDoc
} from "firebase/firestore";

// Helper to generate IDs for mock data
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock initial data
const MOCK_FLASHCARDS = [
  {
    id: "fc-1",
    userId: "mock-user",
    question: "What is the time complexity of Binary Search?",
    answer: "O(log n) time complexity. It works by repeatedly dividing the sorted search interval in half.",
    subject: "Computer Science",
    difficulty: "Medium",
    efactor: 2.5,
    interval: 1,
    repetitions: 0,
    lastReviewedAt: null,
    nextReviewDate: new Date().toISOString(),
    isStarred: true,
    isMastered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fc-2",
    userId: "mock-user",
    question: "What does HTML stand for?",
    answer: "HyperText Markup Language. It is the standard markup language for creating web pages.",
    subject: "Web Development",
    difficulty: "Easy",
    efactor: 2.7,
    interval: 3,
    repetitions: 1,
    lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() + 172800000).toISOString(),
    isStarred: false,
    isMastered: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fc-3",
    userId: "mock-user",
    question: "Explain the difference between SQL and NoSQL databases.",
    answer: "SQL databases are relational, table-based, have a predefined schema, and scale vertically. NoSQL databases are non-relational, document/key-value/graph-based, have dynamic schemas, and scale horizontally.",
    subject: "Databases",
    difficulty: "Hard",
    efactor: 2.1,
    interval: 1,
    repetitions: 0,
    lastReviewedAt: null,
    nextReviewDate: new Date().toISOString(),
    isStarred: false,
    isMastered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_NOTES = [
  {
    id: "n-1",
    userId: "mock-user",
    title: "React Hooks Cheat Sheet",
    content: "# React Hooks Summary\n\n## Rules of Hooks\n1. Only call Hooks **at the top level**. Don't call Hooks inside loops, conditions, or nested functions.\n2. Only call Hooks **from React function components** or custom Hooks.\n\n## Core Hooks\n- `useState`: For local component state.\n- `useEffect`: For side effects (fetching data, subscriptions).\n- `useContext`: For consuming Context.\n- `useRef`: For persisting mutable values without re-renders, and accessing DOM nodes.",
    tags: ["React", "JavaScript", "Frontend"],
    subject: "Web Development",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "n-2",
    userId: "mock-user",
    title: "Big O Notation Fundamentals",
    content: "# Big O Notation\nBig O describes the execution time or space used by an algorithm in the worst-case scenario relative to the input size $N$.\n\n### Common Complexities:\n- **O(1)**: Constant time (e.g., array index lookup)\n- **O(log N)**: Logarithmic time (e.g., binary search)\n- **O(N)**: Linear time (e.g., simple loop check)\n- **O(N log N)**: Linearithmic time (e.g., merge sort, quicksort average)\n- **O(N²)**: Quadratic time (e.g., nested loops, bubble sort)",
    tags: ["Algorithms", "Computer Science"],
    subject: "Computer Science",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const MOCK_SESSIONS = [
  {
    id: "s-1",
    userId: "mock-user",
    subject: "Computer Science",
    durationMinutes: 45,
    type: "focus",
    score: 90,
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "s-2",
    userId: "mock-user",
    subject: "Web Development",
    durationMinutes: 60,
    type: "focus",
    score: 85,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "s-3",
    userId: "mock-user",
    subject: "Databases",
    durationMinutes: 30,
    type: "focus",
    score: 95,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "s-4",
    userId: "mock-user",
    subject: "Computer Science",
    durationMinutes: 90,
    type: "focus",
    score: 88,
    date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "s-5",
    userId: "mock-user",
    subject: "Web Development",
    durationMinutes: 50,
    type: "focus",
    score: 92,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  }
];

const MOCK_TIMETABLE = {
  id: "t-1",
  userId: "mock-user",
  subjects: [
    { name: "Computer Science", difficulty: 4, isWeak: true },
    { name: "Web Development", difficulty: 3, isWeak: false },
    { name: "Databases", difficulty: 5, isWeak: true }
  ],
  examDates: {
    "Computer Science": new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    "Web Development": new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
    "Databases": new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
  },
  dailyHours: 4,
  schedule: [
    {
      day: "Monday",
      slots: [
        { time: "09:00 - 09:45", subject: "Databases", type: "Focus Session", duration: 45 },
        { time: "09:45 - 10:00", subject: "Break", type: "Break", duration: 15 },
        { time: "10:00 - 10:45", subject: "Databases", type: "Revision & Notes", duration: 45 },
        { time: "10:45 - 11:00", subject: "Break", type: "Break", duration: 15 },
        { time: "11:00 - 11:45", subject: "Computer Science", type: "Focus Session", duration: 45 },
        { time: "11:45 - 12:00", subject: "Break", type: "Break", duration: 15 },
        { time: "12:00 - 12:45", subject: "Web Development", type: "Practice Deck", duration: 45 }
      ]
    },
    {
      day: "Tuesday",
      slots: [
        { time: "09:00 - 09:45", subject: "Databases", type: "Focus Session", duration: 45 },
        { time: "09:45 - 10:00", subject: "Break", type: "Break", duration: 15 },
        { time: "10:00 - 10:45", subject: "Computer Science", type: "Weak Area Revision", duration: 45 },
        { time: "10:45 - 11:00", subject: "Break", type: "Break", duration: 15 },
        { time: "11:00 - 11:45", subject: "Computer Science", type: "Focus Session", duration: 45 },
        { time: "11:45 - 12:00", subject: "Break", type: "Break", duration: 15 },
        { time: "12:00 - 12:45", subject: "Web Development", type: "Revision & Notes", duration: 45 }
      ]
    },
    {
      day: "Wednesday",
      slots: [
        { time: "09:00 - 09:45", subject: "Databases", type: "Exam Prep Slot", duration: 45 },
        { time: "09:45 - 10:00", subject: "Break", type: "Break", duration: 15 },
        { time: "10:00 - 10:45", subject: "Databases", type: "Focus Session", duration: 45 },
        { time: "10:45 - 11:00", subject: "Break", type: "Break", duration: 15 },
        { time: "11:00 - 11:45", subject: "Computer Science", type: "Focus Session", duration: 45 },
        { time: "11:45 - 12:00", subject: "Break", type: "Break", duration: 15 },
        { time: "12:00 - 12:45", subject: "Web Development", type: "Focus Session", duration: 45 }
      ]
    },
    {
      day: "Thursday",
      slots: [
        { time: "09:00 - 09:45", subject: "Databases", type: "Exam Day Final Prep", duration: 45 },
        { time: "09:45 - 10:00", subject: "Break", type: "Break", duration: 15 },
        { time: "10:00 - 10:45", subject: "Computer Science", type: "Weak Area Revision", duration: 45 },
        { time: "10:45 - 11:00", subject: "Break", type: "Break", duration: 15 },
        { time: "11:00 - 11:45", subject: "Computer Science", type: "Focus Session", duration: 45 },
        { time: "11:45 - 12:00", subject: "Break", type: "Break", duration: 15 },
        { time: "12:00 - 12:45", subject: "Web Development", type: "Practice Deck", duration: 45 }
      ]
    },
    {
      day: "Friday",
      slots: [
        { time: "09:00 - 09:45", subject: "Computer Science", type: "Exam Prep Slot", duration: 45 },
        { time: "09:45 - 10:00", subject: "Break", type: "Break", duration: 15 },
        { time: "10:00 - 10:45", subject: "Computer Science", type: "Focus Session", duration: 45 },
        { time: "10:45 - 11:00", subject: "Break", type: "Break", duration: 15 },
        { time: "11:00 - 11:45", subject: "Web Development", type: "Focus Session", duration: 45 },
        { time: "11:45 - 12:00", subject: "Break", type: "Break", duration: 15 },
        { time: "12:00 - 12:45", subject: "Web Development", type: "Revision & Notes", duration: 45 }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useStore = create((set, get) => ({
  // State
  user: null,
  isAuthLoading: true,
  flashcards: [],
  notes: [],
  studySessions: [],
  timetables: [],
  theme: localStorage.getItem("studier_theme") || "dark",
  isMockMode: isMockMode,
  streak: 5,
  productivityScore: 78,

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
    if (isMockMode) {
      // Simulate API lag
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockUser = {
        uid: "mock-user",
        email: email,
        displayName: email.split("@")[0],
        streak: 5,
        productivityScore: 78,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("studier_mock_user", JSON.stringify(mockUser));
      set({ 
        user: mockUser, 
        isAuthLoading: false,
        flashcards: JSON.parse(localStorage.getItem("studier_mock_flashcards")) || MOCK_FLASHCARDS,
        notes: JSON.parse(localStorage.getItem("studier_mock_notes")) || MOCK_NOTES,
        studySessions: JSON.parse(localStorage.getItem("studier_mock_sessions")) || MOCK_SESSIONS,
        timetables: JSON.parse(localStorage.getItem("studier_mock_timetables")) || [MOCK_TIMETABLE]
      });
      get().recalculateMetrics();
      return mockUser;
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userDocRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        let userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split("@")[0],
          streak: 1,
          productivityScore: 50,
          lastActiveDate: new Date().toISOString().split("T")[0]
        };

        if (userSnap.exists()) {
          userData = { ...userData, ...userSnap.data() };
        } else {
          await setDoc(userDocRef, userData);
        }
        
        set({ user: userData });
        await get().fetchUserData(fbUser.uid);
        return userData;
      } catch (error) {
        set({ isAuthLoading: false });
        throw error;
      }
    }
  },

  signUpEmail: async (email, password, displayName) => {
    set({ isAuthLoading: true });
    if (isMockMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockUser = {
        uid: "mock-user",
        email: email,
        displayName: displayName || email.split("@")[0],
        streak: 1,
        productivityScore: 50,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("studier_mock_user", JSON.stringify(mockUser));
      set({ 
        user: mockUser, 
        isAuthLoading: false,
        flashcards: MOCK_FLASHCARDS,
        notes: MOCK_NOTES,
        studySessions: MOCK_SESSIONS,
        timetables: [MOCK_TIMETABLE]
      });
      // Save mock initial data to localstorage
      localStorage.setItem("studier_mock_flashcards", JSON.stringify(MOCK_FLASHCARDS));
      localStorage.setItem("studier_mock_notes", JSON.stringify(MOCK_NOTES));
      localStorage.setItem("studier_mock_sessions", JSON.stringify(MOCK_SESSIONS));
      localStorage.setItem("studier_mock_timetables", JSON.stringify([MOCK_TIMETABLE]));
      get().recalculateMetrics();
      return mockUser;
    } else {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userDocRef = doc(db, "users", fbUser.uid);
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName || fbUser.email.split("@")[0],
          streak: 1,
          productivityScore: 50,
          lastActiveDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, userData);
        set({ user: userData });
        await get().fetchUserData(fbUser.uid);
        return userData;
      } catch (error) {
        set({ isAuthLoading: false });
        throw error;
      }
    }
  },

  signInGoogle: async () => {
    set({ isAuthLoading: true });
    if (isMockMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockUser = {
        uid: "mock-user",
        email: "google.student@studier.edu",
        displayName: "Google Student",
        streak: 5,
        productivityScore: 82,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("studier_mock_user", JSON.stringify(mockUser));
      set({ 
        user: mockUser, 
        isAuthLoading: false,
        flashcards: JSON.parse(localStorage.getItem("studier_mock_flashcards")) || MOCK_FLASHCARDS,
        notes: JSON.parse(localStorage.getItem("studier_mock_notes")) || MOCK_NOTES,
        studySessions: JSON.parse(localStorage.getItem("studier_mock_sessions")) || MOCK_SESSIONS,
        timetables: JSON.parse(localStorage.getItem("studier_mock_timetables")) || [MOCK_TIMETABLE]
      });
      get().recalculateMetrics();
      return mockUser;
    } else {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const fbUser = userCredential.user;
        const userDocRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        let userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split("@")[0],
          streak: 1,
          productivityScore: 60,
          lastActiveDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (userSnap.exists()) {
          userData = { ...userData, ...userSnap.data() };
        } else {
          await setDoc(userDocRef, userData);
        }

        set({ user: userData });
        await get().fetchUserData(fbUser.uid);
        return userData;
      } catch (error) {
        set({ isAuthLoading: false });
        throw error;
      }
    }
  },

  logout: async () => {
    if (isMockMode) {
      localStorage.removeItem("studier_mock_user");
      set({ user: null, flashcards: [], notes: [], studySessions: [], timetables: [] });
    } else {
      await signOut(auth);
      set({ user: null, flashcards: [], notes: [], studySessions: [], timetables: [] });
    }
  },

  // Fetch real data from Firebase
  fetchUserData: async (uid) => {
    try {
      set({ isAuthLoading: true });
      
      // 1. Fetch user profile
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Update streak logic
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let currentStreak = userData.streak || 1;
        
        if (userData.lastActiveDate === yesterday) {
          // Increment streak if not logged today
          if (userData.lastActiveDate !== today) {
            currentStreak += 1;
            await updateDoc(userDocRef, { streak: currentStreak, lastActiveDate: today });
          }
        } else if (userData.lastActiveDate !== today) {
          // Streak broken
          currentStreak = 1;
          await updateDoc(userDocRef, { streak: currentStreak, lastActiveDate: today });
        }
        
        set({ user: { ...userData, streak: currentStreak } });
      }

      // 2. Fetch Flashcards
      const fcQuery = query(collection(db, "flashcards"), where("userId", "==", uid));
      const fcSnap = await getDocs(fcQuery);
      const flashcards = [];
      fcSnap.forEach(doc => {
        flashcards.push({ id: doc.id, ...doc.data() });
      });

      // 3. Fetch Notes
      const notesQuery = query(collection(db, "notes"), where("userId", "==", uid));
      const notesSnap = await getDocs(notesQuery);
      const notes = [];
      notesSnap.forEach(doc => {
        notes.push({ id: doc.id, ...doc.data() });
      });

      // 4. Fetch Study Sessions
      const sessionsQuery = query(collection(db, "studySessions"), where("userId", "==", uid));
      const sessionsSnap = await getDocs(sessionsQuery);
      const studySessions = [];
      sessionsSnap.forEach(doc => {
        studySessions.push({ id: doc.id, ...doc.data() });
      });

      // 5. Fetch Timetables
      const ttQuery = query(collection(db, "timetables"), where("userId", "==", uid));
      const ttSnap = await getDocs(ttQuery);
      const timetables = [];
      ttSnap.forEach(doc => {
        timetables.push({ id: doc.id, ...doc.data() });
      });

      set({ 
        flashcards, 
        notes, 
        studySessions, 
        timetables,
        isAuthLoading: false 
      });

      get().recalculateMetrics();
    } catch (e) {
      console.error("Error loading user data from Firebase:", e);
      set({ isAuthLoading: false });
    }
  },

  initializeStore: () => {
    // Apply theme
    if (get().theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (isMockMode) {
      const savedUser = localStorage.getItem("studier_mock_user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // Update streak logic for mock mode
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let currentStreak = parsedUser.streak || 1;
        
        if (parsedUser.lastActiveDate === yesterday) {
          currentStreak += 1;
        } else if (parsedUser.lastActiveDate !== today) {
          currentStreak = 1;
        }
        
        const updatedUser = {
          ...parsedUser,
          streak: currentStreak,
          lastActiveDate: today
        };
        localStorage.setItem("studier_mock_user", JSON.stringify(updatedUser));

        set({ 
          user: updatedUser,
          isAuthLoading: false,
          flashcards: JSON.parse(localStorage.getItem("studier_mock_flashcards")) || MOCK_FLASHCARDS,
          notes: JSON.parse(localStorage.getItem("studier_mock_notes")) || MOCK_NOTES,
          studySessions: JSON.parse(localStorage.getItem("studier_mock_sessions")) || MOCK_SESSIONS,
          timetables: JSON.parse(localStorage.getItem("studier_mock_timetables")) || [MOCK_TIMETABLE]
        });
        get().recalculateMetrics();
      } else {
        set({ isAuthLoading: false });
      }
    } else {
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          await get().fetchUserData(fbUser.uid);
        } else {
          set({ user: null, flashcards: [], notes: [], studySessions: [], timetables: [], isAuthLoading: false });
        }
      });
    }
  },

  // Recalculates dashboard numbers
  recalculateMetrics: () => {
    const { flashcards, studySessions, user } = get();
    if (!user) return;

    // 1. Mastery Percentage
    const totalFC = flashcards.length;
    const masteredFC = flashcards.filter(f => f.isMastered).length;
    const masteryPercent = totalFC > 0 ? Math.round((masteredFC / totalFC) * 100) : 0;

    // 2. Streaks
    const today = new Date().toISOString().split("T")[0];
    const uniqueDates = [...new Set(studySessions.map(s => s.date))];
    uniqueDates.sort((a, b) => new Date(b) - new Date(a)); // Descending order
    
    let calcStreak = 0;
    let checkDate = new Date();
    
    // Check consecutive days starting today or yesterday
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

    // Safeguard streak
    const finalStreak = Math.max(calcStreak, user.streak || 1);

    // 3. Productivity Score
    // Formula: (Total Focus Minutes / (Target 150 Mins)) * 50 + (Mastered Cards Ratio) * 30 + (Notes count * 5)
    const thisWeek = new Date(Date.now() - 7 * 86400000).getTime();
    const recentSessions = studySessions.filter(s => new Date(s.createdAt).getTime() > thisWeek);
    const weeklyFocusMins = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const avgDailyFocus = weeklyFocusMins / 7;
    
    const focusScore = Math.min((avgDailyFocus / 45) * 50, 50); // Target 45 min focus avg daily
    const cardsScore = totalFC > 0 ? (masteredFC / totalFC) * 30 : 15;
    const notesBonus = Math.min(get().notes.length * 4, 20);
    
    const prodScore = Math.min(100, Math.round(focusScore + cardsScore + notesBonus));

    set({ 
      streak: finalStreak,
      productivityScore: prodScore || 78
    });
  },

  // Flashcards CRUD
  addFlashcard: async (card) => {
    const { user, flashcards } = get();
    if (!user) return;

    const newCard = {
      id: generateId(),
      userId: user.uid,
      question: card.question,
      answer: card.answer,
      subject: card.subject || "General",
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

    if (isMockMode) {
      const updated = [newCard, ...flashcards];
      localStorage.setItem("studier_mock_flashcards", JSON.stringify(updated));
      set({ flashcards: updated });
      get().recalculateMetrics();
    } else {
      await setDoc(doc(db, "flashcards", newCard.id), newCard);
      set({ flashcards: [newCard, ...flashcards] });
      get().recalculateMetrics();
    }
  },

  updateFlashcard: async (id, updates) => {
    const { flashcards } = get();
    const updated = flashcards.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    
    if (isMockMode) {
      localStorage.setItem("studier_mock_flashcards", JSON.stringify(updated));
      set({ flashcards: updated });
      get().recalculateMetrics();
    } else {
      const cardRef = doc(db, "flashcards", id);
      await updateDoc(cardRef, { ...updates, updatedAt: new Date().toISOString() });
      set({ flashcards: updated });
      get().recalculateMetrics();
    }
  },

  deleteFlashcard: async (id) => {
    const { flashcards } = get();
    const updated = flashcards.filter(c => c.id !== id);

    if (isMockMode) {
      localStorage.setItem("studier_mock_flashcards", JSON.stringify(updated));
      set({ flashcards: updated });
      get().recalculateMetrics();
    } else {
      await deleteDoc(doc(db, "flashcards", id));
      set({ flashcards: updated });
      get().recalculateMetrics();
    }
  },

  reviewFlashcard: async (id, rating) => {
    const { flashcards } = get();
    const card = flashcards.find(c => c.id === id);
    if (!card) return;

    // Spaced repetition scheduler (SuperMemo SM-2 logic)
    let { efactor, interval, repetitions } = card;

    if (rating === "Hard") {
      // Repetition failed or struggled heavily
      repetitions = 0;
      interval = 1; // reset interval
      efactor = Math.max(1.3, efactor - 0.2);
    } else if (rating === "Medium") {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 3;
      else interval = Math.round(interval * efactor);
      // efactor stays same
    } else { // Easy
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * efactor * 1.3);
      efactor = Math.min(3.0, efactor + 0.15);
    }

    const nextReviewDate = new Date(Date.now() + interval * 86400000).toISOString();
    const isMastered = repetitions >= 3; // considered mastered after 3 correct repetitions

    const updates = {
      repetitions,
      interval,
      efactor,
      nextReviewDate,
      isMastered,
      lastReviewedAt: new Date().toISOString()
    };

    await get().updateFlashcard(id, updates);
  },

  // Notes CRUD
  addNote: async (note) => {
    const { user, notes } = get();
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

    if (isMockMode) {
      const updated = [newNote, ...notes];
      localStorage.setItem("studier_mock_notes", JSON.stringify(updated));
      set({ notes: updated });
      get().recalculateMetrics();
    } else {
      await setDoc(doc(db, "notes", newNote.id), newNote);
      set({ notes: [newNote, ...notes] });
      get().recalculateMetrics();
    }
  },

  updateNote: async (id, updates) => {
    const { notes } = get();
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);

    if (isMockMode) {
      localStorage.setItem("studier_mock_notes", JSON.stringify(updated));
      set({ notes: updated });
    } else {
      const noteRef = doc(db, "notes", id);
      await updateDoc(noteRef, { ...updates, updatedAt: new Date().toISOString() });
      set({ notes: updated });
    }
  },

  deleteNote: async (id) => {
    const { notes } = get();
    const updated = notes.filter(n => n.id !== id);

    if (isMockMode) {
      localStorage.setItem("studier_mock_notes", JSON.stringify(updated));
      set({ notes: updated });
    } else {
      await deleteDoc(doc(db, "notes", id));
      set({ notes: updated });
    }
  },

  // Pomodoro timer logs
  logStudySession: async (sessionData) => {
    const { user, studySessions } = get();
    if (!user) return;

    const newSession = {
      id: generateId(),
      userId: user.uid,
      subject: sessionData.subject || "General",
      durationMinutes: sessionData.durationMinutes,
      type: sessionData.type || "focus", // focus, short_break, long_break
      score: sessionData.score || 85,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      const updated = [newSession, ...studySessions];
      localStorage.setItem("studier_mock_sessions", JSON.stringify(updated));
      set({ studySessions: updated });
      get().recalculateMetrics();
    } else {
      await setDoc(doc(db, "studySessions", newSession.id), newSession);
      set({ studySessions: [newSession, ...studySessions] });
      get().recalculateMetrics();
    }
  },

  // Timetable
  saveTimetable: async (timetableData) => {
    const { user, timetables } = get();
    if (!user) return;

    const newTimetable = {
      id: generateId(),
      userId: user.uid,
      subjects: timetableData.subjects,
      examDates: timetableData.examDates,
      dailyHours: timetableData.dailyHours,
      schedule: timetableData.schedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMockMode) {
      // Overwrite existing schedules or keep a list
      const updated = [newTimetable, ...timetables.filter(t => t.id !== "t-1")];
      localStorage.setItem("studier_mock_timetables", JSON.stringify(updated));
      set({ timetables: updated });
    } else {
      await setDoc(doc(db, "timetables", newTimetable.id), newTimetable);
      set({ timetables: [newTimetable, ...timetables] });
    }
  }
}));
