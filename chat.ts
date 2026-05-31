import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "خادم الذكاء الاصطناعي غير متوفر حالياً (API Key missing)." });
    }

    const aiClient = new GoogleGenAI({ apiKey });
    const parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prompt } = parsedBody;
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `أنت مساعد ذكي لسوق سند (منصة إعلانات في تونس). أجب عن هذا السؤال بلهجة تونسية محترمة أو عربية فصحى وبدقة: ${prompt}`
    });
    
    return res.status(200).json({ text: response.text });
  } catch (e: any) {
    console.error("Gemini API Error:", e);
    return res.status(500).json({ error: 'حدث خطأ في الاتصال الداخلي' });
  }
}
