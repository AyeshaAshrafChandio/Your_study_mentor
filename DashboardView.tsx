import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { DocumentSummary } from "../types";
import { extractTextFromPDF } from "./PDFExtractor";

interface DashboardViewProps {
  documentText: string;
  documentName: string;
  summary: DocumentSummary | null;
  onSetDocument: (text: string, name: string) => void;
  onSetSummary: (summary: DocumentSummary) => void;
  onClear: () => void;
}

export default function DashboardView({
  documentText,
  documentName,
  summary,
  onSetDocument,
  onSetSummary,
  onClear
}: DashboardViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [parseProgress, setParseProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setLoadingStatus(`Reading ${file.name}...`);
    setParseProgress(0);

    try {
      let extractedText = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(file, (pct) => {
          setParseProgress(pct);
          setLoadingStatus(`Extracting PDF text (${pct}%)...`);
        });
      } else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });
      } else {
        throw new Error("Unsupported file format. Please upload a PDF, TXT, or MD file.");
      }

      if (!extractedText.trim() || extractedText.length < 50) {
        throw new Error("The file contains too little text (minimum 50 characters required). Please check your file.");
      }

      onSetDocument(extractedText, file.name);
      await generateAISummary(extractedText, file.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while processing the file.");
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setError(null);
    setLoading(true);
    setLoadingStatus("Processing pasted material...");

    try {
      if (pasteText.trim().length < 50) {
        throw new Error("Please paste at least 50 characters of study material.");
      }
      const title = `Pasted Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      onSetDocument(pasteText.trim(), title);
      await generateAISummary(pasteText.trim(), title);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing the text.");
      setLoading(false);
    }
  };

  const generateAISummary = async (text: string, title: string) => {
    setLoadingStatus("AI is summarizing and analyzing key concepts...");
    try {
      const res = await fetch("/api/study/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: text }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      onSetSummary(data);
    } catch (err: any) {
      console.error("AI summarization failed:", err);
      setError(`AI analysis encountered an issue: ${err.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="dashboard-view-container">
      {/* Upper Brand / Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6" id="dashboard-header">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Lumina Study AI
          </h1>
          <p className="text-slate-500 mt-1 font-sans text-sm">
            Upload your study material, let Gemini extract the core value, and guide you with dynamic tools.
          </p>
        </div>
        {documentText && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl font-medium text-sm transition-colors border border-rose-100 self-start md:self-auto"
            id="clear-material-button"
          >
            <Trash2 className="w-4 h-4" />
            Clear Material
          </button>
        )}
      </div>

      {/* Main Upload Zone or Summary Display */}
      {!documentText ? (
        <div className="grid md:grid-cols-12 gap-6" id="dashboard-uploader-grid">
          {/* File Upload card */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900">Upload Study Files</h2>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Supports standard PDF files, Text documents (.txt), or Markdown files (.md). We extract content client-side to keep your study notes responsive.
              </p>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                dragActive 
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99]" 
                  : "border-slate-200 hover:border-blue-500 hover:bg-slate-50/30"
              }`}
              id="file-drop-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="p-4 bg-slate-50 rounded-full text-slate-500 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-800 font-medium text-center">
                Drag and drop your file here, or <span className="text-blue-600 hover:underline font-semibold">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">PDF, TXT, or MD up to 15MB</p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2 text-sm" id="upload-error-banner">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Text Paste Card */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Paste Study Notes</h2>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                No file ready? Copy key chapters, website articles, or personal notes and paste them directly below to analyze.
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <textarea
                placeholder="Paste your study material text here (minimum 50 characters)..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full flex-1 min-h-[160px] p-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-sans resize-none"
                id="raw-paste-textarea"
              />
              <button
                disabled={pasteText.trim().length < 50}
                onClick={handlePasteSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-slate-150 disabled:text-slate-400 disabled:cursor-not-allowed"
                id="submit-paste-button"
              >
                <span>Analyze Paste Material</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        /* Dynamic Loading State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]" id="dashboard-loading-card">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{loadingStatus}</h3>
          <p className="text-slate-400 text-sm max-w-md text-center">
            Gemini is working behind the scenes to synthesize information, extract core concepts, and draft active recall assets.
          </p>
          {parseProgress > 0 && parseProgress < 100 && (
            <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${parseProgress}%` }}></div>
            </div>
          )}
        </div>
      ) : (
        /* Summary & Overview Dashboard */
        <div className="grid lg:grid-cols-12 gap-6" id="dashboard-results-container">
          {/* Document Stats & Summary Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Doc Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-base">{documentName}</h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    Character Count: {documentText.length.toLocaleString()} | Status: Ready
                  </p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Analyzed by Gemini
              </span>
            </div>

            {/* AI Summary Panel */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col shadow-sm">
              <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">AI-Generated Summary</h4>
                {summary ? (
                  <div className="prose prose-sm text-slate-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                    {summary.summary}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Summary metadata could not be formatted. Try re-analyzing.</p>
                )}
              </div>
            </div>

            {/* Suggested Timeline milestones */}
            {summary?.timeline && summary.timeline.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Study Plan: Mastery Path</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {summary.timeline.map((step, index) => {
                    const stepColors = [
                      { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" },
                      { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600" },
                      { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600" }
                    ];
                    const color = stepColors[index % stepColors.length];

                    return (
                      <div key={step.stepNumber} className={`p-4 rounded-2xl ${color.bg} border ${color.border} flex flex-col justify-between`}>
                        <div>
                          <span className={`block text-[10px] font-bold ${color.text} uppercase mb-1`}>
                            Phase {step.stepNumber}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 mb-1">{step.title}</h4>
                          <p className="text-slate-500 text-xs leading-relaxed mb-3">{step.description}</p>
                        </div>
                        <div className="border-t border-slate-200/50 pt-2 mt-auto">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Objective</span>
                          <p className="text-slate-600 text-xs font-medium">{step.objective}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Key Vocab/Concepts Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Brain className="w-5 h-5 text-blue-600" />
                Key Vocabulary
              </h3>

              {summary?.keyConcepts && summary.keyConcepts.length > 0 ? (
                <div className="space-y-4">
                  {summary.keyConcepts.map((concept, index) => (
                    <div key={index} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <h4 className="font-display font-bold text-blue-600 text-sm mb-1">{concept.concept}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{concept.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No vocabulary detected.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
