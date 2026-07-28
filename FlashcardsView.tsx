import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  RotateCcw, 
  Star, 
  Sparkles 
} from "lucide-react";
import { Flashcard } from "../types";

interface FlashcardsViewProps {
  documentText: string;
  flashcards: Flashcard[] | null;
  learnedIds: string[];
  onSetFlashcards: (cards: Flashcard[]) => void;
  onToggleLearned: (id: string) => void;
  onResetLearned: () => void;
}

export default function FlashcardsView({
  documentText,
  flashcards,
  learnedIds,
  onSetFlashcards,
  onToggleLearned,
  onResetLearned
}: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate flashcards from the backend if we don't have them yet
  const generateCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate flashcards (Status ${res.status})`);
      }

      const data = await res.json();
      onSetFlashcards(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate study flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!flashcards && documentText) {
      generateCards();
    }
  }, [flashcards, documentText]);

  // Key event listeners for keyboard shortcuts
  useEffect(() => {
    if (!flashcards || flashcards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [flashcards, currentIndex]);

  const handleNext = () => {
    if (!flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (!flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-blue-50 p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
        </div>
        <h3 className="font-display text-lg font-bold text-slate-800">Generating Memorization Deck</h3>
        <p className="text-slate-400 text-xs mt-1">Gemini is picking out the core terminology and drafting dual-sided cards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <p className="text-rose-600 text-sm mb-4">{error}</p>
        <button
          onClick={generateCards}
          className="bg-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Generating Again
        </button>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <p className="text-slate-500 text-sm">Please upload or parse a document in the dashboard first to prepare flashcards.</p>
      </div>
    );
  }

  const activeCard = flashcards[currentIndex];
  const isMastered = learnedIds.includes(activeCard?.id);
  const totalCards = flashcards.length;
  const masteredCount = flashcards.filter(c => learnedIds.includes(c.id)).length;
  const progressPercent = Math.round((masteredCount / totalCards) * 100);

  return (
    <div className="space-y-8" id="flashcards-view-container">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Interactive Terminology Deck</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click on a card to flip it. Toggle mastery to track your active recall progress.</p>
        </div>
        {masteredCount > 0 && (
          <button
            onClick={onResetLearned}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 transition-colors font-medium self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Mastery Progress
          </button>
        )}
      </div>

      {/* Progress metrics */}
      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 grid sm:grid-cols-3 gap-4 items-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Deck Progress</span>
          <span className="text-slate-800 font-bold text-lg">{masteredCount} <span className="text-slate-400 text-sm font-medium">/ {totalCards} mastered</span></span>
        </div>
        <div className="sm:col-span-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Recall Mastery Rate</span>
            <span className="font-bold text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden shadow-xs">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* The 3D Flashcard Stage */}
      <div className="flex flex-col items-center justify-center gap-6 py-4" id="flashcard-stage">
        {/* Keyboard helpers */}
        <div className="hidden md:flex items-center gap-6 text-slate-400 text-xs font-medium bg-slate-100/80 border border-slate-200 rounded-full px-5 py-2">
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-xs text-[10px]">Space</kbd> Flip</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-xs text-[10px]">←</kbd> Previous</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-xs text-[10px]">→</kbd> Next</span>
        </div>

        {/* 3D Box Container */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full max-w-xl h-80 cursor-pointer select-none group"
          style={{ perspective: "1000px" }}
          id="flashcard-flippable"
        >
          {/* Card Body */}
          <div 
            className="w-full h-full relative rounded-3xl transition-transform duration-500 shadow-lg border border-slate-200"
            style={{ 
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* Front Side */}
            <div 
              className="absolute inset-0 bg-white rounded-3xl flex flex-col justify-between p-8 backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-semibold text-blue-600">Term / Concept</span>
                <span className="bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded">Front</span>
              </div>

              <div className="text-center px-4">
                <h3 className="font-display text-2xl font-bold text-slate-800 leading-snug">
                  {activeCard.term}
                </h3>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLearned(activeCard.id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    isMastered 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-250"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${isMastered ? "fill-emerald-700 text-white" : ""}`} />
                  {isMastered ? "Mastered!" : "Mark as Mastered"}
                </button>
                <span className="text-xs text-slate-400">Click to show definition</span>
              </div>
            </div>

            {/* Back Side */}
            <div 
              className="absolute inset-0 bg-slate-900 rounded-3xl flex flex-col justify-between p-8 backface-hidden"
              style={{ 
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-semibold text-slate-400">Definition / Explanation</span>
                <span className="bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded">Back</span>
              </div>

              <div className="text-center px-4 overflow-y-auto max-h-40">
                <p className="text-slate-100 text-base leading-relaxed font-serif italic md:text-lg">
                  "{activeCard.definition}"
                </p>
              </div>

              <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLearned(activeCard.id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    isMastered 
                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800" 
                      : "bg-slate-800 hover:bg-slate-755 text-slate-300 border border-slate-700"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${isMastered ? "fill-emerald-400 text-slate-900" : ""}`} />
                  {isMastered ? "Mastered!" : "Mark as Mastered"}
                </button>
                <span className="text-slate-400">Click to show term</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Nav Controls */}
        <div className="flex items-center gap-6 mt-2">
          <button
            onClick={handlePrev}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-mono text-slate-500 font-bold text-sm">
            {currentIndex + 1} <span className="text-slate-300">/</span> {totalCards}
          </span>

          <button
            onClick={handleNext}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick deck grid overview */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-display text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          Deck Quick Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {flashcards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(i);
              }}
              className={`p-3 text-xs font-semibold text-left border rounded-xl transition-all truncate ${
                i === currentIndex
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : learnedIds.includes(card.id)
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600"
              }`}
            >
              <div className="truncate">{card.term}</div>
              <div className={`text-[10px] mt-1 ${i === currentIndex ? "text-blue-200" : "text-slate-400"}`}>
                {learnedIds.includes(card.id) ? "✓ Mastered" : "• Study"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
