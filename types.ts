export interface KeyConcept {
  concept: string;
  explanation: string;
}

export interface TimelineStep {
  stepNumber: number;
  title: string;
  description: string;
  objective: string;
}

export interface DocumentSummary {
  summary: string;
  keyConcepts: KeyConcept[];
  timeline: TimelineStep[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  topic: string;
  milestoneTitle: string;
  milestoneDetails: string;
  activities: string[];
  timeMinutes: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface StudySessionState {
  documentText: string;
  documentName: string;
  summary: DocumentSummary | null;
  quiz: QuizQuestion[] | null;
  flashcards: Flashcard[] | null;
  studyPlan: StudyPlanDay[] | null;
  chatHistory: ChatMessage[];
  completedDays: number[]; // day numbers
  learnedFlashcards: string[]; // flashcard IDs
}
