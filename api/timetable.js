// api/timetable.js

export default function handler(req, res) {
  // Support CORS
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
    const { subjects, examDates, dailyHours, daysToSchedule = 7 } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "Missing or invalid subjects parameter." });
    }

    const hours = Number(dailyHours) || 3;
    const today = new Date();

    // 1. Calculate weights for each subject
    const subjectWeights = subjects.map(sub => {
      let weight = 1.0;
      
      // Difficulty modifier: range 1-5 (adds 0.5 to 2.5)
      const diff = Number(sub.difficulty) || 3;
      weight += diff * 0.5;

      // Weak subject modifier
      if (sub.isWeak) {
        weight += 2.0;
      }

      // Exam proximity modifier
      const examDateStr = examDates && examDates[sub.name];
      if (examDateStr) {
        const examDate = new Date(examDateStr);
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          // Closer exams get higher weights
          weight += 12 / (diffDays + 0.5); 
          if (diffDays <= 3) {
            weight += 6.0; // Urgent exam bump
          }
        } else if (diffDays === 0) {
          weight += 15.0; // Exam today!
        }
      }

      return {
        name: sub.name,
        weight
      };
    });

    const totalWeight = subjectWeights.reduce((sum, item) => sum + item.weight, 0);

    // 2. Determine slot distribution based on weights
    // We break the day into slots. Each slot is a 45 min focus + 15 min break.
    // So 1 slot = 1 hour of allocated study time.
    const slotsPerDay = Math.min(8, Math.max(1, Math.round(hours)));
    const totalSlots = slotsPerDay * daysToSchedule;

    // Allocate total slots to subjects proportional to weight
    const allocations = subjectWeights.map(sw => {
      let allocatedSlots = Math.round((sw.weight / totalWeight) * totalSlots);
      return {
        name: sw.name,
        slots: Math.max(1, allocatedSlots) // Ensure every subject gets at least 1 slot
      };
    });

    // Flatten slots pool
    let slotPool = [];
    allocations.forEach(alloc => {
      for (let i = 0; i < alloc.slots; i++) {
        slotPool.push(alloc.name);
      }
    });

    // Shuffle slot pool using simple seedless shuffle
    slotPool.sort(() => Math.random() - 0.5);

    // 3. Generate schedule days
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const schedule = [];

    const startHour = 9; // study starts at 9:00 AM

    for (let d = 0; d < Math.min(daysToSchedule, 7); d++) {
      const dayName = DAYS[d];
      const slots = [];
      let currentHour = startHour;

      for (let s = 0; s < slotsPerDay; s++) {
        // Pull subject from pool
        let subject = slotPool.pop();
        
        // If pool is empty, recycle from allocations based on weights
        if (!subject) {
          const randIdx = Math.floor(Math.random() * subjects.length);
          subject = subjects[randIdx].name;
        }

        const formatTime = (h, m) => {
          const hh = Math.floor(h).toString().padStart(2, "0");
          const mm = m.toString().padStart(2, "0");
          return `${hh}:${mm}`;
        };

        // Study session slot
        const startStr = formatTime(currentHour, 0);
        const endStr = formatTime(currentHour, 45);
        
        // Determine type of study based on subject properties
        const subConfig = subjects.find(sub => sub.name === subject) || {};
        let type = "Focus Session";
        if (subConfig.isWeak) type = "Weak Area Review";
        
        const examDateStr = examDates && examDates[subject];
        if (examDateStr) {
          const examDate = new Date(examDateStr);
          const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 3) {
            type = "Exam Revision Blitz";
          }
        }

        slots.push({
          time: `${startStr} - ${endStr}`,
          subject,
          type,
          duration: 45,
          completed: false
        });

        // Break slot
        const breakStartStr = formatTime(currentHour, 45);
        currentHour += 1;
        const breakEndStr = formatTime(currentHour, 0);

        slots.push({
          time: `${breakStartStr} - ${breakEndStr}`,
          subject: "Break",
          type: "Rest Break",
          duration: 15,
          completed: false
        });
      }

      schedule.push({
        day: dayName,
        slots
      });
    }

    return res.status(200).json({
      success: true,
      dailyHours: hours,
      allocations,
      schedule
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate timetable: " + error.message });
  }
}
