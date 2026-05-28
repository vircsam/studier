// api/create-subscription.js
// Creates a Razorpay subscription for Pro or Pinnacle autopay plans.

import Razorpay from 'razorpay';

const VALID_PLANS = ["Pro", "Pinnacle"];

const PLAN_MAP = {
  Pro: process.env.RAZORPAY_PRO_PLAN_ID,
  Pinnacle: process.env.RAZORPAY_PINNACLE_PLAN_ID,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { planName, userId, userEmail } = req.body;

    // --- Input validation ---
    if (!planName || !userId || !userEmail) {
      return res.status(400).json({
        error: "Missing required fields: planName, userId, userEmail",
      });
    }

    if (!VALID_PLANS.includes(planName)) {
      return res.status(400).json({
        error: `Invalid planName "${planName}". Must be one of: ${VALID_PLANS.join(", ")}.`,
      });
    }

    const planId = PLAN_MAP[planName];
    if (!planId) {
      console.error(`Environment variable for plan "${planName}" is not set. Check RAZORPAY_${planName.toUpperCase()}_PLAN_ID.`);
      return res.status(500).json({
        error: `Server configuration error: plan "${planName}" is not configured. Please contact support.`,
      });
    }

    // --- Create Razorpay subscription ---
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 monthly billing cycles
      notes: { userId, userEmail, planName },
    });

    return res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("create-subscription error:", error);
    return res.status(500).json({
      error: "Failed to create subscription: " + error.message,
    });
  }
}
