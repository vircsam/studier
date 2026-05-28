// api/razorpay-webhook.js
// Handles Razorpay webhook events for subscription lifecycle management.
//
// NOTE: Signature verification uses JSON.stringify(req.body) because Vercel
// auto-parses the request body. This works reliably for Razorpay webhooks as
// JSON.stringify produces deterministic output for their payloads. If you
// encounter signature mismatches, switch to raw body handling by exporting
// `config = { api: { bodyParser: false } }` and reading the stream manually.

import crypto from 'crypto';
import admin from 'firebase-admin';

// --- Firebase Admin lazy initialization ---
function getFirestore() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

// Plan amount in paise
const PLAN_AMOUNT = {
  Pro: 9900,
  Pinnacle: 29900,
};

export default async function handler(req, res) {
  // CORS headers (webhooks won't preflight, but set for consistency)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // --- Webhook signature verification ---
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
      return res.status(400).json({ error: "Missing x-razorpay-signature header" });
    }

    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );

    if (!isValid) {
      console.error("Webhook signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // --- Parse event ---
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event.event;

    console.log(`Razorpay webhook received: ${eventType}`);

    const db = getFirestore();

    switch (eventType) {
      // -------------------------------------------------------
      // Subscription activated (first successful charge)
      // -------------------------------------------------------
      case "subscription.activated": {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;
        const planName = subscription.notes?.planName;

        if (!userId) {
          console.error("subscription.activated: missing userId in notes");
          break;
        }

        await db.collection("users").doc(userId).update({
          plan: planName || "Pro",
          subscriptionId: subscription.id,
          subscriptionStatus: "active",
          planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${userId} plan activated: ${planName}`);
        break;
      }

      // -------------------------------------------------------
      // Recurring charge succeeded
      // -------------------------------------------------------
      case "subscription.charged": {
        const payment = event.payload.payment.entity;
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId || payment.notes?.userId;
        const planName = subscription.notes?.planName || payment.notes?.planName;

        if (!userId) {
          console.error("subscription.charged: missing userId in notes");
          break;
        }

        // Log payment (idempotent via payment ID as doc ID)
        await db.collection("payments").doc(payment.id).set({
          userId,
          planName: planName || "Unknown",
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: subscription.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "webhook",
        });

        console.log(`Payment ${payment.id} recorded for user ${userId}`);
        break;
      }

      // -------------------------------------------------------
      // Subscription cancelled by user or merchant
      // -------------------------------------------------------
      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;

        if (!userId) {
          console.error("subscription.cancelled: missing userId in notes");
          break;
        }

        await db.collection("users").doc(userId).update({
          plan: "Free",
          subscriptionStatus: "cancelled",
          planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${userId} subscription cancelled — downgraded to Free`);
        break;
      }

      // -------------------------------------------------------
      // Subscription halted (repeated payment failures)
      // -------------------------------------------------------
      case "subscription.halted": {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;

        if (!userId) {
          console.error("subscription.halted: missing userId in notes");
          break;
        }

        await db.collection("users").doc(userId).update({
          plan: "Free",
          subscriptionStatus: "halted",
          planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${userId} subscription halted — downgraded to Free`);
        break;
      }

      // -------------------------------------------------------
      // Individual payment failed
      // -------------------------------------------------------
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const userId = payment.notes?.userId;

        // Log the failure even if userId is missing (for debugging)
        await db.collection("payments").doc(payment.id).set({
          userId: userId || "unknown",
          razorpay_payment_id: payment.id,
          status: "failed",
          amount: payment.amount,
          currency: payment.currency,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "webhook",
        });

        console.log(`Payment failed: ${payment.id} (user: ${userId || "unknown"})`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt — Razorpay retries on non-2xx
    return res.status(200).json({ success: true, event: eventType });
  } catch (error) {
    // Log the error but still return 200 to prevent Razorpay retry storms.
    // Persistent failures should be caught via monitoring/alerting.
    console.error("Webhook processing error:", error);
    return res.status(200).json({ success: true, note: "Acknowledged with processing error" });
  }
}
