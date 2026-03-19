import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for generating presentation content
  app.post("/api/generate", async (req, res) => {
    const { topic, template } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    try {
      const model = "gemini-3-flash-preview";

      const prompt = `Generate a presentation about "${topic}" using a ${template || 'modern'} style. 
      The content should be professional and well-structured.`;

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert presentation designer. Create structured content for a slide deck. Return ONLY JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The main title of the presentation",
              },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: {
                      type: Type.STRING,
                      description: "The heading for this slide",
                    },
                    points: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Bullet points for the slide content",
                    },
                    speakerNotes: {
                      type: Type.STRING,
                      description: "Notes for the presenter to say during this slide",
                    },
                  },
                  required: ["heading", "points", "speakerNotes"],
                },
              },
            },
            required: ["title", "slides"],
          },
        },
      });

      const content = JSON.parse(response.text || "{}");
      res.json(content);
    } catch (error: any) {
      console.error("Generation error:", error);
      res.status(500).json({
        error: "Failed to generate presentation content",
        details: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
