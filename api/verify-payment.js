// api/verify-payment.js
// Verifies Razorpay payment signature and upgrades the user's plan in Firestore.

import crypto from 'crypto';
import admin from 'firebase-admin';

// --- Firebase Admin lazy initialization ---
function getFirestore() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
        "Add your Firebase service account JSON to .env (see .env.example)."
      );
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

// Plan amount in paise (for record-keeping)
const PLAN_AMOUNT = {
  Pro: 9900,       // ₹99/mo
  Pinnacle: 29900, // ₹299/mo
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
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      userId,
      planName,
    } = req.body;

    // --- Input validation ---
    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature ||
      !userId ||
      !planName
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: razorpay_payment_id, razorpay_subscription_id, razorpay_signature, userId, planName",
      });
    }

    if (!PLAN_AMOUNT[planName]) {
      return res.status(400).json({
        error: `Invalid planName "${planName}". Must be "Pro" or "Pinnacle".`,
      });
    }

    // --- Signature verification ---
    // For subscriptions the signed payload is: payment_id | subscription_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }

    // --- Update Firestore in a batch (atomic) ---
    const db = getFirestore();
    const batch = db.batch();

    // 1. Payment record (use payment ID as doc ID for idempotency)
    batch.set(db.collection("payments").doc(razorpay_payment_id), {
      userId,
      planName,
      razorpay_payment_id,
      razorpay_subscription_id,
      status: "captured",
      amount: PLAN_AMOUNT[planName],
      currency: "INR",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Upgrade user plan
    batch.update(db.collection("users").doc(userId), {
      plan: planName,
      subscriptionId: razorpay_subscription_id,
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Payment verified and plan upgraded",
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return res.status(500).json({
      error: "Payment verification failed: " + error.message,
    });
  }
}
