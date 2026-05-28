// src/services/razorpayService.js
// Frontend service layer for Razorpay payment integration

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

/**
 * Dynamically loads the Razorpay Checkout script if not already loaded
 * @returns {Promise<boolean>} - true if script loaded successfully
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Creates a Razorpay subscription for autopay (Pro or Pinnacle plan)
 * @param {string} planName - 'Pro' or 'Pinnacle'
 * @param {string} userId - Firebase user ID
 * @param {string} userEmail - User's email address
 * @returns {Promise<{subscriptionId: string, key: string}>}
 */
export async function createSubscription(planName, userId, userEmail) {
  const response = await fetch("/api/create-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planName, userId, userEmail }),
  });

  if (response.status === 503) {
    throw new Error("Payment service is temporarily unavailable. Please try again in a few moments.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned status ${response.status}. Please try again later.`);
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to create subscription");
  }

  return data;
}

/**
 * Verifies the Razorpay payment signature on the backend
 * @param {Object} paymentData - Payment data from Razorpay Checkout callback
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyPayment(paymentData) {
  const response = await fetch("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Payment verification failed");
  }

  return data;
}

/**
 * Opens the Razorpay Checkout modal for subscription payment
 * @param {Object} options
 * @param {string} options.subscriptionId - Razorpay subscription ID
 * @param {string} options.planName - 'Pro' or 'Pinnacle'
 * @param {string} options.userName - User's display name
 * @param {string} options.userEmail - User's email
 * @param {string} options.userPhone - User's phone (optional)
 * @param {Function} options.onSuccess - Callback on successful payment
 * @param {Function} options.onFailure - Callback on failed payment
 * @param {Function} options.onDismiss - Callback when modal is dismissed
 * @returns {Promise<void>}
 */
export async function openCheckout({
  subscriptionId,
  planName,
  userName,
  userEmail,
  userPhone = "",
  onSuccess,
  onFailure,
  onDismiss,
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
  }

  const amount = planName === "Pro" ? "₹99" : "₹299";

  const options = {
    key: RAZORPAY_KEY,
    subscription_id: subscriptionId,
    name: "Studier",
    description: `${planName} Plan — ${amount}/month autopay`,
    image: "/logo.png",
    prefill: {
      name: userName || "",
      email: userEmail || "",
      contact: userPhone,
    },
    theme: {
      color: "#06b6d4", // brand-500 cyan
      backdrop_color: "rgba(15, 23, 42, 0.85)",
    },
    modal: {
      ondismiss: () => {
        if (onDismiss) onDismiss();
      },
      confirm_close: true,
      escape: true,
      animation: true,
    },
    handler: (response) => {
      // Called on successful payment
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
    notes: {
      planName,
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", (response) => {
    if (onFailure) {
      onFailure({
        code: response.error.code,
        description: response.error.description,
        source: response.error.source,
        step: response.error.step,
        reason: response.error.reason,
        orderId: response.error.metadata?.order_id,
        paymentId: response.error.metadata?.payment_id,
      });
    }
  });

  rzp.open();
}
