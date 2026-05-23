// api/mock-ai.js

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { mode, payload } = req.body;

    if (!mode) {
      return res.status(400).json({ error: "Missing 'mode' parameter." });
    }

    if (mode === "generate_flashcards") {
      const topic = payload?.topic || "General";
      const text = payload?.text || "";

      // Simulated AI generation of flashcards
      const generatedCards = [
        {
          question: `What is the core concept of ${topic}?`,
          answer: `The core concept revolves around optimizing efficiency, managing structure, and improving comprehension in relation to ${topic}.`,
          subject: topic
        },
        {
          question: `List two primary elements of ${topic}.`,
          answer: `1. Analytical breakdown of materials.\n2. Iterative reviews of core properties.`,
          subject: topic
        },
        {
          question: `What is a common pitfall when studying ${topic}?`,
          answer: `Passive reading without retrieval practice. Active recall and testing are key to master ${topic}.`,
          subject: topic
        }
      ];

      return res.status(200).json({
        success: true,
        source: "AI Mock Generator",
        flashcards: generatedCards
      });
    }

    if (mode === "generate_quiz") {
      const topic = payload?.topic || "General Study";

      const quiz = [
        {
          id: 1,
          question: `Which method is considered most effective for long-term retention of ${topic}?`,
          options: [
            "Highlighting text repeatedly",
            "Active recall combined with spaced repetition",
            "Cramming the night before an exam",
            "Passive reading and listening to lectures"
          ],
          answer: 1 // index of correct answer
        },
        {
          id: 2,
          question: `What is the primary purpose of a Pomodoro break after study?`,
          options: [
            "To distract from learning",
            "To allow memory consolidation and prevent mental fatigue",
            "To check social media notifications",
            "To increase stress hormones"
          ],
          answer: 1
        },
        {
          id: 3,
          question: `When scheduling revision, how should you treat your identified 'weak' subjects?`,
          options: [
            "Ignore them and focus on strengths",
            "Prioritize them with higher weighting and more frequent study blocks",
            "Study them only on weekends",
            "De-prioritize them until exams are 1 day away"
          ],
          answer: 1
        }
      ];

      return res.status(200).json({
        success: true,
        source: "AI Mock Generator",
        quiz
      });
    }

    if (mode === "summarize_notes") {
      const content = payload?.content || "";

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "No content provided to summarize." });
      }

      // Generate a mock summary
      const summary = `### AI Summary
- **Primary Topic**: Key concepts extracted from notes.
- **Summary**: This document outlines fundamental mechanics, highlighting structural hierarchies and active learning steps.
- **Key Takeaways**:
  1. Spacing out study blocks dramatically decreases forgetfulness.
  2. Actively questioning information ensures deep encoding.

### Action Items
- [ ] Review related flashcards.
- [ ] Create a checklist of sub-topics to verify understanding.`;

      return res.status(200).json({
        success: true,
        source: "AI Mock Generator",
        summary
      });
    }

    if (mode === "recommend_study") {
      const weaknesses = payload?.weaknesses || ["None specified"];
      const examDates = payload?.examDates || {};

      const recommendations = [
        `Double focus sessions for **${weaknesses.join(", ")}** this week to build core concepts.`,
        "Create at least 5 new flashcards for subjects with exams in the next 7 days.",
        "Take a 10-minute walk during Pomodoro breaks to increase cognitive energy.",
        "Utilize active recall on starred flashcards before sleeping to enhance memory consolidation."
      ];

      return res.status(200).json({
        success: true,
        source: "AI Mock Generator",
        recommendations
      });
    }

    return res.status(400).json({ error: `Mode '${mode}' not supported.` });
  } catch (error) {
    return res.status(500).json({ error: "AI Engine error: " + error.message });
  }
}
