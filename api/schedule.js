// api/schedule.js

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
    const { interval = 1, efactor = 2.5, repetitions = 0, rating } = req.body;

    if (!rating || !["Easy", "Medium", "Hard"].includes(rating)) {
      return res.status(400).json({ error: "Missing or invalid rating parameter. Must be Easy, Medium, or Hard." });
    }

    let nextInterval = Number(interval);
    let nextEfactor = Number(efactor);
    let nextRepetitions = Number(repetitions);

    if (rating === "Hard") {
      nextRepetitions = 0;
      nextInterval = 1;
      nextEfactor = Math.max(1.3, nextEfactor - 0.2);
    } else if (rating === "Medium") {
      nextRepetitions += 1;
      if (nextRepetitions === 1) {
        nextInterval = 1;
      } else if (nextRepetitions === 2) {
        nextInterval = 3;
      } else {
        nextInterval = Math.round(nextInterval * nextEfactor);
      }
      // efactor stays unchanged
    } else { // Easy
      nextRepetitions += 1;
      if (nextRepetitions === 1) {
        nextInterval = 1;
      } else if (nextRepetitions === 2) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(nextInterval * nextEfactor * 1.3);
      }
      nextEfactor = Math.min(3.0, nextEfactor + 0.15);
    }

    const nextReviewDate = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000).toISOString();
    const isMastered = nextRepetitions >= 3;

    return res.status(200).json({
      success: true,
      interval: nextInterval,
      efactor: nextEfactor,
      repetitions: nextRepetitions,
      nextReviewDate,
      isMastered
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to schedule flashcard: " + error.message });
  }
}
