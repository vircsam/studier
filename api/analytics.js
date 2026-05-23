// api/analytics.js

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
    const { sessions = [], flashcards = [] } = req.body;

    // 1. Total Focus Time (sum durationMinutes for 'focus' type)
    const totalFocusMinutes = sessions
      .filter(s => s.type === "focus" || !s.type)
      .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

    const totalHours = Number((totalFocusMinutes / 60).toFixed(1));

    // 2. Focus distribution by subject
    const subjectMinutes = {};
    sessions.forEach(s => {
      if (s.type === "focus" || !s.type) {
        const sub = s.subject || "General";
        subjectMinutes[sub] = (subjectMinutes[sub] || 0) + (Number(s.durationMinutes) || 0);
      }
    });

    const subjectDistribution = Object.keys(subjectMinutes).map(subject => ({
      subject,
      minutes: subjectMinutes[subject],
      hours: Number((subjectMinutes[subject] / 60).toFixed(1))
    }));

    // 3. Flashcard Mastery
    const totalFC = flashcards.length;
    const masteredFC = flashcards.filter(f => f.isMastered).length;
    const starredFC = flashcards.filter(f => f.isStarred).length;
    const masteryRate = totalFC > 0 ? Math.round((masteredFC / totalFC) * 100) : 0;

    // 4. Daily study patterns for charts
    const dailyStudy = {};
    // Last 7 days template
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dailyStudy[d] = 0;
    }

    sessions.forEach(s => {
      if (s.date && dailyStudy[s.date] !== undefined) {
        dailyStudy[s.date] += (Number(s.durationMinutes) || 0);
      }
    });

    const dailyChartData = Object.keys(dailyStudy).map(date => {
      // Format date for readable display (e.g. "May 22")
      const dObj = new Date(date + "T00:00:00");
      const label = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date,
        label,
        minutes: dailyStudy[date],
        hours: Number((dailyStudy[date] / 60).toFixed(1))
      };
    });

    // 5. Streaks check
    const uniqueDates = [...new Set(sessions.map(s => s.date))].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let currentStreak = 0;
    let activeDate = uniqueDates.includes(today) ? today : (uniqueDates.includes(yesterday) ? yesterday : null);

    if (activeDate) {
      let tempDate = new Date(activeDate);
      while (true) {
        const dateStr = tempDate.toISOString().split("T")[0];
        if (uniqueDates.includes(dateStr)) {
          currentStreak++;
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 6. Productivity Score logic
    const avgDailyFocus = totalFocusMinutes / 7;
    const focusScore = Math.min((avgDailyFocus / 45) * 50, 50); // 45 mins target
    const cardsScore = totalFC > 0 ? (masteredFC / totalFC) * 30 : 15;
    const streakBonus = Math.min(currentStreak * 4, 20);
    const productivityScore = Math.min(100, Math.round(focusScore + cardsScore + streakBonus));

    // 7. General insights
    const insights = [];
    if (currentStreak >= 3) {
      insights.push(`Amazing! You are on a ${currentStreak}-day study streak. Keep the momentum going!`);
    } else {
      insights.push("Try completing a 25-minute Pomodoro study block today to start your streak!");
    }

    if (masteryRate > 60) {
      insights.push("Excellent retention! More than 60% of your flashcards are mastered. Keep reviewing!");
    } else if (totalFC > 0) {
      insights.push("Tip: Review cards marked 'Hard' daily to move them into long-term memory.");
    }

    const weakSubject = subjectDistribution.length > 0 
      ? [...subjectDistribution].sort((a,b) => a.minutes - b.minutes)[0].subject 
      : null;
    if (weakSubject) {
      insights.push(`You spent the least time on ${weakSubject} this week. Consider scheduling extra sessions.`);
    }

    return res.status(200).json({
      success: true,
      metrics: {
        totalHours,
        totalFocusMinutes,
        masteryRate,
        totalFlashcards: totalFC,
        masteredFlashcards: masteredFC,
        starredFlashcards: starredFC,
        streak: currentStreak,
        productivityScore
      },
      subjectDistribution,
      dailyChartData,
      insights
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to compile analytics: " + error.message });
  }
}
