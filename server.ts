import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit for sending study documents
app.use(express.json({ limit: "15mb" }));

// Helper for lazy Gemini SDK initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please set it in your Secrets / Environment Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Summarize Document
app.post("/api/study/summarize", async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText || typeof documentText !== "string") {
      return res.status(400).json({ error: "Missing document text to summarize" });
    }

    const ai = getGeminiClient();
    const prompt = `Analyze the following study material. Provide a comprehensive summary, 5-8 key concepts with clear explanations/definitions, and a recommended 3-step timeline milestone approach to master this topic.\n\nMaterial:\n${documentText.slice(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A comprehensive, professionally formatted summary of the study material.",
            },
            keyConcepts: {
              type: Type.ARRAY,
              description: "A list of 5-8 major key concepts found in the document.",
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: "The concept name, term, or heading." },
                  explanation: { type: Type.STRING, description: "A thorough definition or explanation." },
                },
                required: ["concept", "explanation"],
              },
            },
            timeline: {
              type: Type.ARRAY,
              description: "A 3-step structured timeline sequence to study this material.",
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER, description: "Step sequential index (1, 2, or 3)." },
                  title: { type: Type.STRING, description: "Descriptive step title." },
                  description: { type: Type.STRING, description: "Actions or concepts to master during this step." },
                  objective: { type: Type.STRING, description: "Learning goal for this step." },
                },
                required: ["stepNumber", "title", "description", "objective"],
              },
            },
          },
          required: ["summary", "keyConcepts", "timeline"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No text content returned from the model.");
    }

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    console.error("Summarization error:", err);
    res.status(500).json({ error: err.message || "Failed to generate summary" });
  }
});

// 2. API: Generate Quiz Questions
app.post("/api/study/quiz", async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText || typeof documentText !== "string") {
      return res.status(400).json({ error: "Missing document text for quiz generation" });
    }

    const ai = getGeminiClient();
    const prompt = `Generate a quiz containing exactly 5-6 multiple-choice questions based on the following study material. Each question should have exactly 4 plausible options, a 0-indexed correct answer index, and an educational explanation for the correct answer.\n\nMaterial:\n${documentText.slice(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of multiple-choice questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique sequential ID, e.g. q1, q2, etc." },
              question: { type: Type.STRING, description: "The multiple choice question itself." },
              options: {
                type: Type.ARRAY,
                description: "Exactly 4 options.",
                items: { type: Type.STRING },
              },
              answerIndex: { type: Type.INTEGER, description: "The index of the correct answer in the options array (0 to 3)." },
              explanation: { type: Type.STRING, description: "The detailed rationale behind the correct answer." },
            },
            required: ["id", "question", "options", "answerIndex", "explanation"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No text content returned from the model.");
    }

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
});

// 3. API: Generate Flashcards
app.post("/api/study/flashcards", async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText || typeof documentText !== "string") {
      return res.status(400).json({ error: "Missing document text for flashcards" });
    }

    const ai = getGeminiClient();
    const prompt = `Generate 8-10 high-quality flashcards to memorize the material. Each flashcard must consist of a key term/concept (front) and its definition/explanation (back).\n\nMaterial:\n${documentText.slice(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of flashcards.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique sequential ID." },
              term: { type: Type.STRING, description: "Key word or prompt to study (front side)." },
              definition: { type: Type.STRING, description: "Detailed explanation or definition (back side)." },
            },
            required: ["id", "term", "definition"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No text content returned from the model.");
    }

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    console.error("Flashcard generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate flashcards" });
  }
});

// 4. API: Generate Study Plan
app.post("/api/study/plan", async (req, res) => {
  try {
    const { documentText, days, intensity } = req.body;
    if (!documentText || typeof documentText !== "string") {
      return res.status(400).json({ error: "Missing document text for study plan" });
    }
    const planDays = Math.min(Math.max(Number(days) || 5, 3), 30);
    const studyIntensity = intensity || "balanced";

    const ai = getGeminiClient();
    const prompt = `Create a personalized sequential study plan spanning exactly ${planDays} days with a study intensity level of '${studyIntensity}' based on the provided material. Divide the material into digestible daily topics, specific objectives, actionable activities, and estimated study times in minutes.\n\nMaterial:\n${documentText.slice(0, 50000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of scheduled days in the study plan.",
          items: {
            type: Type.OBJECT,
            properties: {
              dayNumber: { type: Type.INTEGER, description: "The day number in the plan (1 up to the total days)." },
              topic: { type: Type.STRING, description: "The primary study focus or chapter for this day." },
              milestoneTitle: { type: Type.STRING, description: "A high-level milestone name." },
              milestoneDetails: { type: Type.STRING, description: "Brief background or specific focus." },
              activities: {
                type: Type.ARRAY,
                description: "Step-by-step concrete activities to perform.",
                items: { type: Type.STRING },
              },
              timeMinutes: { type: Type.INTEGER, description: "Recommended study length in minutes." },
            },
            required: ["dayNumber", "topic", "milestoneTitle", "milestoneDetails", "activities", "timeMinutes"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No text content returned from the model.");
    }

    res.json(JSON.parse(response.text));
  } catch (err: any) {
    console.error("Study plan generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate study plan" });
  }
});

// 5. API: Chatbot Q&A
app.post("/api/study/chat", async (req, res) => {
  try {
    const { documentText, messages } = req.body;
    if (!documentText || typeof documentText !== "string") {
      return res.status(400).json({ error: "Missing document text for context" });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages history" });
    }

    const ai = getGeminiClient();

    // Map messages history into Google GenAI format (role: 'user' | 'model', parts: [{ text: '...' }])
    const contents = messages.map((m: any) => {
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role,
        parts: [{ text: m.content }],
      };
    });

    const systemInstruction = `You are a friendly, expert AI Study Mentor. The student has uploaded a study document. 
Your goal is to explain concepts, answer questions, and test their understanding of the document.
Always base your responses on the document content first. If the information is not in the document, use your broad historical and technical knowledge to help them, but briefly specify that it extends beyond the provided material.
Keep your answers educational, clear, using bullet points or markdown where appropriate. Be supportive and encouraging!

Document content reference:
-----------------
${documentText.slice(0, 60000)}
-----------------`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text || "I was unable to formulate an answer. Could you please rephrase?" });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Failed to generate chat reply" });
  }
});

// Setup Vite Dev server or Serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
