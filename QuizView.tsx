import React, { useState, useEffect } from "react";
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  HelpCircle, 
  BookOpen,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { QuizQuestion } from "../types";

interface QuizViewProps {
  documentText: string;
  quiz: QuizQuestion[] | null;
  onSetQuiz: (quiz: QuizQuestion[]) => void;
}

export default function QuizView({
  documentText,
  quiz,
  onSetQuiz
}: QuizViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]); // indexes of user selected options
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate quiz (Status ${res.status})`);
      }

      const data = await res.json();
      onSetQuiz(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate active study quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quiz && documentText) {
      generateQuiz();
    }
  }, [quiz, documentText]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setUserAnswers([]);
    setShowExplanation(false);
    setQuizFinished(false);
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOptionIndex !== null) return; // already answered
    setSelectedOptionIndex(index);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (quiz === null || selectedOptionIndex === null) return;

    // Save answer
    const updatedAnswers = [...userAnswers, selectedOptionIndex];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex + 1 < quiz.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setUserAnswers([]);
    setShowExplanation(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-blue-50 p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
        </div>
        <h3 className="font-display text-lg font-bold text-slate-800">Generating Active Recall Quiz</h3>
        <p className="text-slate-400 text-xs mt-1">Gemini is formulating multiple-choice questions, incorrect distractors, and rationales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <p className="text-rose-600 text-sm mb-4">{error}</p>
        <button
          onClick={generateQuiz}
          className="bg-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Generating Again
        </button>
      </div>
    );
  }

  if (!quiz || quiz.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <p className="text-slate-500 text-sm">Please upload or paste a document in the dashboard first to prepare quiz questions.</p>
      </div>
    );
  }

  // Calculate scores
  const score = userAnswers.reduce((total, ans, idx) => {
    return ans === quiz[idx]?.answerIndex ? total + 1 : total;
  }, 0);
  const totalQuestions = quiz.length;
  const scorePercentage = Math.round((score / totalQuestions) * 100);

  // Grade badge naming
  let scoreBadge = "Novice Scholar";
  let scoreColor = "text-amber-600 bg-amber-50 border-amber-100";
  if (scorePercentage >= 90) {
    scoreBadge = "Summa Cum Laude";
    scoreColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
  } else if (scorePercentage >= 75) {
    scoreBadge = "Master Practitioner";
    scoreColor = "text-blue-700 bg-blue-50 border-blue-100";
  } else if (scorePercentage >= 50) {
    scoreBadge = "Capable Learner";
    scoreColor = "text-indigo-700 bg-indigo-50 border-indigo-100";
  }

  return (
    <div className="space-y-8" id="quiz-view-container">
      {/* 1. QUIZ HAS FINISHED */}
      {quizFinished ? (
        <div className="space-y-8 animate-fade-in">
          {/* Main Scorecard card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
              <Award className="w-12 h-12" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Quiz Completed!</h2>
            
            <div className="mt-4 flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${scoreColor}`}>
                {scoreBadge}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-8 border-y border-slate-200 py-6 w-full max-w-sm">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Score</span>
                <span className="text-3xl font-display font-bold text-slate-800">{score} <span className="text-slate-400 text-sm">/ {totalQuestions}</span></span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Accuracy Rate</span>
                <span className="text-3xl font-display font-bold text-blue-600">{scorePercentage}%</span>
              </div>
            </div>

            <button
              onClick={handleResetQuiz}
              className="mt-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Retake This Quiz
            </button>
          </div>

          {/* Question Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-200 pb-4">
              Retro Review & Detailed Explanations
            </h3>
            
            <div className="space-y-6">
              {quiz.map((q, idx) => {
                const isCorrect = userAnswers[idx] === q.answerIndex;
                return (
                  <div key={q.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-2">
                        <span className="font-mono font-bold text-slate-400 mt-0.5">Q{idx + 1}.</span>
                        <h4 className="font-display font-bold text-slate-800 text-sm">{q.question}</h4>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${
                        isCorrect 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pl-6">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                        <span className="text-slate-400 block font-normal mb-1">Your Answer:</span>
                        <span className={isCorrect ? "text-emerald-700" : "text-rose-700 font-semibold"}>
                          {q.options[userAnswers[idx] ?? 0] || "No answer"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                          <span className="text-slate-400 block font-normal mb-1">Correct Answer:</span>
                          <span className="text-emerald-700 font-semibold">{q.options[q.answerIndex]}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/80 p-3.5 rounded-lg border border-slate-150 pl-6 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <BookOpen className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">Mentor Rationale:</span>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : quizStarted ? (
        /* 2. ACTIVE QUESTION PANEL */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          {/* Quiz State Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden shadow-xs">
              <div 
                className="bg-blue-600 h-full transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question content */}
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-slate-900 leading-snug">
              {quiz[currentQuestionIndex].question}
            </h3>

            {/* List options */}
            <div className="grid gap-3">
              {quiz[currentQuestionIndex].options.map((opt, optIdx) => {
                const isSelected = selectedOptionIndex === optIdx;
                const isAnswer = quiz[currentQuestionIndex].answerIndex === optIdx;
                const answered = selectedOptionIndex !== null;

                // Color classes based on states
                let borderClass = "border-slate-200 hover:border-blue-500 hover:bg-slate-50/20";
                let bgClass = "bg-white text-slate-700";
                let badgeEl = null;

                if (answered) {
                  if (isSelected && isAnswer) {
                    borderClass = "border-emerald-500 bg-emerald-50";
                    bgClass = "text-emerald-800 font-semibold";
                    badgeEl = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                  } else if (isSelected && !isAnswer) {
                    borderClass = "border-rose-500 bg-rose-50";
                    bgClass = "text-rose-800 font-semibold";
                    badgeEl = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
                  } else if (isAnswer) {
                    borderClass = "border-emerald-300 bg-emerald-50/50";
                    bgClass = "text-emerald-800 font-semibold";
                    badgeEl = <CheckCircle2 className="w-5 h-5 text-emerald-600/60 shrink-0" />;
                  } else {
                    borderClass = "border-slate-150 opacity-60";
                    bgClass = "text-slate-400";
                  }
                } else if (isSelected) {
                  borderClass = "border-blue-500 bg-blue-50/30";
                }

                return (
                  <button
                    key={optIdx}
                    disabled={answered}
                    onClick={() => handleOptionSelect(optIdx)}
                    className={`p-4 border rounded-2xl text-left text-sm font-medium transition-all duration-150 flex items-center justify-between gap-4 ${borderClass} ${bgClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                        isSelected 
                          ? "bg-blue-600 text-white border-blue-600"
                          : answered 
                          ? "bg-slate-150 text-slate-400 border-slate-200"
                          : "bg-slate-50 text-slate-500 border-slate-250"
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="mt-0.5 leading-snug">{opt}</span>
                    </div>
                    {badgeEl}
                  </button>
                );
              })}
            </div>

            {/* Explanation section */}
            {showExplanation && (
              <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 text-sm leading-relaxed text-slate-700 animate-slide-up">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h4>Master Rationale:</h4>
                </div>
                {quiz[currentQuestionIndex].explanation}
              </div>
            )}

            {/* Quiz Navigation Action */}
            {selectedOptionIndex !== null && (
              <button
                onClick={handleNext}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-xs"
              >
                <span>
                  {currentQuestionIndex + 1 === totalQuestions ? "Review Scorecard" : "Proceed to Next Question"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 3. QUIZ START BANNER */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-md text-center max-w-xl mx-auto space-y-6" id="quiz-intro-card">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Are You Ready to Test Yourself?</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              We generated a custom multiple choice assessment with exactly {quiz.length} high-fidelity questions targeting your document notes. 
              Review rationales instantly to address comprehension gaps.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-3 gap-4 text-xs font-medium text-slate-600">
            <div>
              <span className="text-slate-400 block mb-0.5">Format</span>
              <span className="text-slate-800 font-bold">MCQ 4-Option</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Length</span>
              <span className="text-slate-800 font-bold">{quiz.length} Questions</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Grade Feedback</span>
              <span className="text-slate-800 font-bold">Instant Explanation</span>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <span>Begin Active Recall Quiz</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
