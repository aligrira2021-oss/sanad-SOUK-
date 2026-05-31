import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware to support mobile apps (APK / Capacitor)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // AI Assistant Route
  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
          res.status(500).json({ error: "خادم الذكاء الاصطناعي غير متوفر حالياً (API Key missing)." });
          return;
      }
      const aiClient = new GoogleGenAI({ apiKey });
      const { prompt } = req.body;
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت مساعد ذكي لسوق سند (منصة إعلانات في تونس). أجب بلهجة تونسية محترمة أو عربية فصحى. يجب أن تكون إجابتك نصاً واضحاً، مباشراً، وبسيطاً. يمنع منعاً باتاً استخدام الإيموجي (السمايلات) أو النجوم (*) أو أي تنسيق معقد. فقط نص عادي مقروء: ${prompt}`
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      res.status(500).json({ error: `حدث خطأ في الاتصال الداخلي: ${e.message || 'Unknown error'}` });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
