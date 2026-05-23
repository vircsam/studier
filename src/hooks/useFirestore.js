import { useStore } from "../store/useStore";

export function useFirestore() {
  const {
    flashcards,
    notes,
    studySessions,
    timetables,
    streak,
    productivityScore,
    isMockMode,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    reviewFlashcard,
    addNote,
    updateNote,
    deleteNote,
    logStudySession,
    saveTimetable
  } = useStore();

  return {
    flashcards,
    notes,
    studySessions,
    timetables,
    streak,
    productivityScore,
    isMockMode,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    reviewFlashcard,
    addNote,
    updateNote,
    deleteNote,
    logStudySession,
    saveTimetable
  };
}
