import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST request" });
  }

  try {
    const { mode, payload } = req.body;

    if (mode === "generate_flashcards") {
      const topic = payload?.topic || "General";
      const text = payload?.text || "";

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `
Generate 3 educational flashcards in JSON format.

Topic: ${topic}

Content:
${text}

Return ONLY valid JSON in this format:
[
 {
   "question": "...",
   "answer": "...",
   "subject": "${topic}"
 }
]
`;

      const result = await model.generateContent(prompt);

      const response = result.response.text();

      let flashcards = [];

      try {
        flashcards = JSON.parse(response);
      } catch (e) {
        return res.status(500).json({
          error: "AI returned invalid JSON",
          raw: response,
        });
      }

      return res.status(200).json({
        success: true,
        source: "Gemini AI",
        flashcards,
      });
    }

    return res.status(400).json({
      error: "Unsupported mode",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}