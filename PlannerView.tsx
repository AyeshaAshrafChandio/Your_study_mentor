import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sliders, 
  Award, 
  RefreshCw, 
  ChevronRight,
  BookOpen
} from "lucide-react";
import { StudyPlanDay } from "../types";

interface PlannerViewProps {
  documentText: string;
  studyPlan: StudyPlanDay[] | null;
  completedDays: number[];
  onSetStudyPlan: (plan: StudyPlanDay[]) => void;
  onToggleDayCompleted: (dayNum: number) => void;
  onResetPlanner: () => void;
}

export default function PlannerView({
  documentText,
  studyPlan,
  completedDays,
  onSetStudyPlan,
  onToggleDayCompleted,
  onResetPlanner
}: PlannerViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [daysCount, setDaysCount] = useState(7);
  const [intensity, setIntensity] = useState<"casual" | "balanced" | "exam-prep">("balanced");

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
          days: daysCount,
          intensity
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate study plan (Status ${res.status})`);
      }

      const data = await res.json();
      onSetStudyPlan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate personalized study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin"></div>
        </div>
        <h3 className="font-display text-lg font-bold text-slate-800">Drafting Personalized Schedule</h3>
        <p className="text-slate-400 text-xs mt-1 font-sans">Gemini is structuring a step-by-step sequential learning schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
        <p className="text-rose-600 text-sm mb-4">{error}</p>
        <button
          onClick={generatePlan}
          className="bg-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Generating Again
        </button>
      </div>
    );
  }

  // Configuration Screen if no plan exists
  if (!studyPlan || studyPlan.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md max-w-xl mx-auto space-y-8" id="planner-config-card">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Configure Study Schedule</h2>
            <p className="text-xs text-slate-400">Design a milestone calendar customized to your available time.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Duration choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Study Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 7, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysCount(d)}
                  className={`py-3 px-4 border rounded-xl font-medium text-sm transition-all ${
                    daysCount === d
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Daily Pacing & Intensity</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "casual", label: "Casual", desc: "15-30m / day" },
                { id: "balanced", label: "Balanced", desc: "30-60m / day" },
                { id: "exam-prep", label: "Exam-Prep", desc: "60-120m / day" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIntensity(item.id as any)}
                  className={`p-4 border rounded-xl text-left transition-all flex flex-col ${
                    intensity === item.id
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-800 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                  }`}
                >
                  <span className="font-semibold text-sm">{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatePlan}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <span>Draft Personalized Study Plan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Active Plan Display
  const totalDays = studyPlan.length;
  const progressCount = completedDays.length;
  const progressPercent = Math.round((progressCount / totalDays) * 100);
  const totalStudyMinutes = studyPlan.reduce((total, d) => total + d.timeMinutes, 0);

  return (
    <div className="space-y-8 animate-fade-in" id="planner-active-view">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Personal Study Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">Check off study days as you complete tasks. Follow daily milestone paths.</p>
        </div>
        <button
          onClick={onResetPlanner}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 transition-colors font-medium self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          Reconfigure Plan
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Plan Length</span>
            <span className="text-slate-800 font-bold text-lg">{totalDays} Days</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Intensity Style</span>
            <span className="text-slate-800 font-bold text-lg capitalize">{intensity === "exam-prep" ? "Exam-Prep" : intensity}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estimated Total Time</span>
            <span className="text-slate-800 font-bold text-lg">{(totalStudyMinutes / 60).toFixed(1)} hrs</span>
          </div>
        </div>
      </div>

      {/* Progress completion meter */}
      <div className="bg-emerald-50/50 rounded-3xl border border-emerald-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-slate-800 text-base">Your Study Journey</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-md">
            Successfully ticking off days triggers positive reinforcement and helps maintain focus. Master each day step-by-step.
          </p>
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progress Rate</span>
            <span className="text-2xl font-bold text-slate-800">{progressCount} <span className="text-slate-400 text-sm font-medium">/ {totalDays} Days</span></span>
          </div>
          
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            {/* SVG Circle meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200/60"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-300"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-emerald-700">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Study Plan Timeline */}
      <div className="space-y-6" id="study-timeline-list">
        {studyPlan.map((day) => {
          const isDone = completedDays.includes(day.dayNumber);
          return (
            <div 
              key={day.dayNumber} 
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 transition-all duration-200 ${
                isDone 
                  ? "border-emerald-200 bg-slate-50/50 opacity-90" 
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              {/* Day Badge & Checkbox */}
              <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 shrink-0 md:w-32 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                <div className="flex md:flex-col items-start md:items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Milestone</span>
                  <span className="text-xl font-display font-black text-slate-800">Day {day.dayNumber}</span>
                </div>

                <button
                  onClick={() => onToggleDayCompleted(day.dayNumber)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-200 hover:border-slate-300 text-transparent"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                </button>
              </div>

              {/* Day Contents */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-base">{day.topic}</h4>
                    <span className="text-xs text-slate-400 mt-0.5 block">{day.milestoneTitle} — {day.milestoneDetails}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 self-start sm:self-auto">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {day.timeMinutes} mins
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Study Action list</span>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                    {day.activities.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
