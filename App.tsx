import React, { useState, useEffect } from "react";
import { 
  Brain, 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  Calendar, 
  Lock, 
  Sparkles,
  Award,
  CheckCircle2,
  Bookmark
} from "lucide-react";
import { 
  DocumentSummary, 
  QuizQuestion, 
  Flashcard, 
  StudyPlanDay, 
  ChatMessage 
} from "./types";
import DashboardView from "./components/DashboardView";
import ChatView from "./components/ChatView";
import FlashcardsView from "./components/FlashcardsView";
import QuizView from "./components/QuizView";
import PlannerView from "./components/PlannerView";

type TabId = "dashboard" | "chat" | "flashcards" | "quiz" | "planner";

const LOCAL_STORAGE_KEY = "ai_study_mentor_session_v1";

interface LocalState {
  documentText: string;
  documentName: string;
  summary: DocumentSummary | null;
  quiz: QuizQuestion[] | null;
  flashcards: Flashcard[] | null;
  studyPlan: StudyPlanDay[] | null;
  chatHistory: ChatMessage[];
  completedDays: number[];
  learnedFlashcards: string[];
}

const DEFAULT_STATE: LocalState = {
  documentText: "",
  documentName: "",
  summary: null,
  quiz: null,
  flashcards: null,
  studyPlan: null,
  chatHistory: [],
  completedDays: [],
  learnedFlashcards: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [state, setState] = useState<LocalState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        setState(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Failed to load study state from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to local storage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to cache study state to localStorage:", e);
    }
  }, [state, isLoaded]);

  const handleSetDocument = (text: string, name: string) => {
    setState((prev) => ({
      ...prev,
      documentText: text,
      documentName: name,
      // Clear out previous details
      summary: null,
      quiz: null,
      flashcards: null,
      studyPlan: null,
      chatHistory: [],
      completedDays: [],
      learnedFlashcards: []
    }));
  };

  const handleSetSummary = (summary: DocumentSummary) => {
    setState((prev) => ({
      ...prev,
      summary
    }));
  };

  const handleSetQuiz = (quiz: QuizQuestion[]) => {
    setState((prev) => ({
      ...prev,
      quiz
    }));
  };

  const handleSetFlashcards = (flashcards: Flashcard[]) => {
    setState((prev) => ({
      ...prev,
      flashcards
    }));
  };

  const handleSetStudyPlan = (studyPlan: StudyPlanDay[]) => {
    setState((prev) => ({
      ...prev,
      studyPlan
    }));
  };

  const handleAddChatMessage = (message: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, message]
    }));
  };

  const handleClearChatHistory = () => {
    setState((prev) => ({
      ...prev,
      chatHistory: []
    }));
  };

  const handleToggleDayCompleted = (dayNum: number) => {
    setState((prev) => {
      const completed = prev.completedDays.includes(dayNum)
        ? prev.completedDays.filter((d) => d !== dayNum)
        : [...prev.completedDays, dayNum];
      return { ...prev, completedDays: completed };
    });
  };

  const handleResetPlanner = () => {
    setState((prev) => ({
      ...prev,
      studyPlan: null,
      completedDays: []
    }));
  };

  const handleToggleFlashcardLearned = (cardId: string) => {
    setState((prev) => {
      const learned = prev.learnedFlashcards.includes(cardId)
        ? prev.learnedFlashcards.filter((id) => id !== cardId)
        : [...prev.learnedFlashcards, cardId];
      return { ...prev, learnedFlashcards: learned };
    });
  };

  const handleResetFlashcardLearned = () => {
    setState((prev) => ({
      ...prev,
      learnedFlashcards: []
    }));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your uploaded document and reset all study modules?")) {
      setState(DEFAULT_STATE);
      setActiveTab("dashboard");
    }
  };

  const isDocUploaded = !!state.documentText;

  // Sidebar navigation options
  const navItems = [
    { id: "dashboard", label: "Study Source", icon: BookOpen, requiresDoc: false },
    { id: "chat", label: "Mentor Chat", icon: MessageSquare, requiresDoc: true },
    { id: "flashcards", label: "Active Recall Cards", icon: Bookmark, requiresDoc: true },
    { id: "quiz", label: "Mock Assessments", icon: HelpCircle, requiresDoc: true },
    { id: "planner", label: "Study Calendar", icon: Calendar, requiresDoc: true }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900" id="ai-study-mentor-app">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 sticky top-0 z-40 flex items-center justify-between" id="top-branding-bar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 border-2 border-white rounded-xs"></div>
          </div>
          <div>
            <span className="font-display font-bold text-lg text-slate-800 tracking-tight">
              Lumina Study AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDocUploaded && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 max-w-xs">
              <span className="text-xs font-semibold text-slate-600 truncate">
                📖 {state.documentName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Gemini Active
          </div>
        </div>
      </header>

      {/* Main Framework Stage */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid md:grid-cols-12 gap-6" id="framework-stage">
        {/* Left Navigation Rails */}
        <aside className="md:col-span-3 space-y-4" id="navigation-aside">
          <nav className="bg-white rounded-3xl border border-slate-200 p-4 space-y-1 shadow-sm" id="main-navigation-panel">
            {navItems.map((item) => {
              const Icon = item.icon;
              const disabled = item.requiresDoc && !isDocUploaded;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  disabled={disabled}
                  onClick={() => setActiveTab(item.id as TabId)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : disabled
                      ? "text-slate-300 cursor-not-allowed opacity-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                      active ? "text-blue-700" : disabled ? "text-slate-200" : "text-slate-400 group-hover:text-slate-600"
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {disabled && (
                    <Lock className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats sidebar banner */}
          {isDocUploaded && state.summary && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4 hidden md:block">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                <h4 className="font-display font-bold text-sm text-white">Daily Progress</h4>
              </div>

              <div className="space-y-3 text-xs">
                {/* Stat 1 */}
                <div className="flex justify-between items-end">
                  <span className="text-slate-400">Flashcards Mastered</span>
                  <span className="font-mono font-bold text-white">
                    {state.learnedFlashcards.length} / {state.flashcards?.length || 0}
                  </span>
                </div>

                {/* Stat 2 */}
                <div className="flex justify-between items-end">
                  <span className="text-slate-400">Milestone Days</span>
                  <span className="font-mono font-bold text-white">
                    {state.completedDays.length} / {state.studyPlan?.length || 0}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.round(
                          (((state.learnedFlashcards.length + state.completedDays.length) / 
                            ((state.flashcards?.length || 1) + (state.studyPlan?.length || 1))) * 100)
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Active Workspace Panel */}
        <main className="md:col-span-9 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm min-h-[450px]" id="active-workspace-panel">
          {activeTab === "dashboard" && (
            <DashboardView
              documentText={state.documentText}
              documentName={state.documentName}
              summary={state.summary}
              onSetDocument={handleSetDocument}
              onSetSummary={handleSetSummary}
              onClear={handleClearAll}
            />
          )}

          {activeTab === "chat" && isDocUploaded && (
            <ChatView
              documentText={state.documentText}
              chatHistory={state.chatHistory}
              onAddMessage={handleAddChatMessage}
              onClearHistory={handleClearChatHistory}
            />
          )}

          {activeTab === "flashcards" && isDocUploaded && (
            <FlashcardsView
              documentText={state.documentText}
              flashcards={state.flashcards}
              learnedIds={state.learnedFlashcards}
              onSetFlashcards={handleSetFlashcards}
              onToggleLearned={handleToggleFlashcardLearned}
              onResetLearned={handleResetFlashcardLearned}
            />
          )}

          {activeTab === "quiz" && isDocUploaded && (
            <QuizView
              documentText={state.documentText}
              quiz={state.quiz}
              onSetQuiz={handleSetQuiz}
            />
          )}

          {activeTab === "planner" && isDocUploaded && (
            <PlannerView
              documentText={state.documentText}
              studyPlan={state.studyPlan}
              completedDays={state.completedDays}
              onSetStudyPlan={handleSetStudyPlan}
              onToggleDayCompleted={handleToggleDayCompleted}
              onResetPlanner={handleResetPlanner}
            />
          )}
        </main>
      </div>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-blue-50 py-6 text-center text-slate-400 text-xs font-medium" id="application-footer">
        <p>© 2026 AI Study Mentor. Securely structured server-side with Gemini 3.5 Flash.</p>
      </footer>
    </div>
  );
}
