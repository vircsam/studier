import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Zap,
  Sparkles,
  Shield,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useToast } from "../context/ToastContext";
import PaymentStatus from "../components/PaymentStatus";
import {
  createSubscription,
  verifyPayment,
  openCheckout,
  loadRazorpayScript,
} from "../services/razorpayService";

// Plan configurations
const PLANS = {
  Free: {
    name: "Free",
    price: 0,
    period: "/mo",
    tagline: "Essential tools to get started",
    icon: Zap,
    gradient: "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
    border: "border-slate-200 dark:border-slate-700",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-500",
    buttonStyle:
      "border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700",
    buttonText: "Current Plan",
    features: [
      { text: "Up to 10 Flashcards", included: true },
      { text: "Up to 5 Notes", included: true },
      { text: "Basic Pomodoro Timer", included: true },
      { text: "Standard Dashboard", included: true },
      { text: "Advanced Analytics", included: false },
      { text: "Streaks & Focus Tracking", included: false },
    ],
  },
  Pro: {
    name: "Pro",
    price: 99,
    period: "/mo",
    tagline: "For serious academic performance",
    badge: "Most Popular",
    icon: Crown,
    gradient: "from-brand-500 via-brand-600 to-indigo-600",
    border: "border-brand-400/50",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    featured: true,
    buttonStyle:
      "bg-white text-brand-600 hover:bg-brand-50 shadow-xl shadow-brand-900/20 hover:scale-105 active:scale-95",
    buttonText: "Upgrade to Pro",
    features: [
      { text: "Up to 50 Flashcards", included: true },
      { text: "Up to 50 Notes", included: true },
      { text: "Auto Timetable Generation", included: true },
      { text: "Streaks & Focus Tracking", included: true },
      { text: "Basic Analytics", included: true },
    ],
  },
  Pinnacle: {
    name: "Pinnacle",
    price: 299,
    period: "/mo",
    tagline: "God-mode tools for absolute mastery",
    icon: Sparkles,
    gradient: "from-slate-800 via-slate-900 to-slate-950",
    border: "border-slate-700",
    iconBg: "bg-white/10",
    iconColor: "text-brand-400",
    buttonStyle:
      "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 active:scale-95",
    buttonText: "Go Pinnacle",
    features: [
      { text: "More Flashcards", included: true },
      { text: "More Notes", included: true },
      { text: "Everything in Pro", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Instant Updates", included: true },
    ],
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useStore((s) => s.user);
  const upgradePlan = useStore((s) => s.upgradePlan);

  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing' | 'success' | 'failed' | null
  const [paymentError, setPaymentError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(null); // which plan button is loading

  const currentPlan = user?.plan || "Free";

  // Determine if user can upgrade to a given plan
  const canUpgrade = useCallback(
    (planName) => {
      const planOrder = { Free: 0, Pro: 1, Pinnacle: 2 };
      return planOrder[planName] > planOrder[currentPlan];
    },
    [currentPlan]
  );

  // Main payment handler
  const handleUpgrade = useCallback(
    async (planName) => {
      if (!user) {
        navigate("/login");
        return;
      }

      if (!canUpgrade(planName)) return;

      setIsLoading(planName);
      setSelectedPlan(planName);

      try {
        // 1. Preload Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load payment gateway. Please check your internet connection.");
        }

        // 2. Create subscription on backend
        const { subscriptionId } = await createSubscription(
          planName,
          user.uid,
          user.email
        );

        // 3. Open Razorpay Checkout
        await openCheckout({
          subscriptionId,
          planName,
          userName: user.displayName || user.name,
          userEmail: user.email,
          onSuccess: async (response) => {
            // 4. Verify payment on backend
            setPaymentStatus("processing");
            try {
              await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
                planName,
              });

              // 5. Update local state
              await upgradePlan(planName);
              setPaymentStatus("success");
              showToast(`🎉 Welcome to ${planName}! Your plan is now active.`, "success");
            } catch (verifyErr) {
              console.error("Payment verification failed:", verifyErr);
              setPaymentStatus("failed");
              setPaymentError(
                verifyErr.message || "Payment verification failed. Please contact support."
              );
            }
          },
          onFailure: (err) => {
            console.error("Payment failed:", err);
            setPaymentStatus("failed");
            setPaymentError(err.description || "Payment was declined. Please try again.");
          },
          onDismiss: () => {
            setIsLoading(null);
            setSelectedPlan(null);
          },
        });
      } catch (err) {
        console.error("Payment initiation failed:", err);
        setPaymentStatus("failed");
        setPaymentError(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsLoading(null);
      }
    },
    [user, canUpgrade, navigate, upgradePlan, showToast]
  );

  // Retry handler
  const handleRetry = useCallback(() => {
    setPaymentStatus(null);
    setPaymentError(null);
    if (selectedPlan) {
      handleUpgrade(selectedPlan);
    }
  }, [selectedPlan, handleUpgrade]);

  // Close status modal
  const handleCloseStatus = useCallback(() => {
    setPaymentStatus(null);
    setPaymentError(null);
    setSelectedPlan(null);
    if (paymentStatus === "success") {
      navigate("/dashboard");
    }
  }, [paymentStatus, navigate]);

  // Get button text based on context
  const getButtonText = (planName) => {
    if (planName === currentPlan) return "Current Plan";
    if (!canUpgrade(planName)) return "Included";
    if (isLoading === planName) return "Processing...";
    return PLANS[planName].buttonText;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans bg-white dark:bg-slate-950">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-300/20 blur-[150px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-300/20 blur-[150px]" />
        <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-purple-200/15 blur-[120px]" />
      </div>

      {/* Back button */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* Header */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 px-6 pt-8 pb-6 max-w-7xl mx-auto text-center"
      >
        <motion.div variants={itemVariants} className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800">
            <Shield className="w-4 h-4" />
            Secure Payments via Razorpay
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800 dark:text-white">
            Invest in your grades.
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            Unlock the full power of the Studier ecosystem. Cancel anytime.
          </p>
        </motion.div>

        {/* Payment methods strip */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-6 mt-8 text-slate-400"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" /> Cards
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-4 h-4" /> UPI
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Net Banking
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4" /> Wallets
          </div>
        </motion.div>
      </motion.section>

      {/* Pricing Cards */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 px-6 pb-24 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.values(PLANS).map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.name === currentPlan;
            const isUpgrade = canUpgrade(plan.name);
            const loading = isLoading === plan.name;

            return (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                whileHover={isUpgrade ? { y: -8, scale: 1.02 } : {}}
                className={`relative rounded-[2.5rem] overflow-hidden transition-all ${
                  plan.featured ? "md:-translate-y-6" : ""
                } ${isCurrent ? "ring-2 ring-brand-400/50 ring-offset-4 ring-offset-white dark:ring-offset-slate-950" : ""}`}
              >
                {/* Featured badge */}
                {plan.badge && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-lg">
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Current plan indicator */}
                {isCurrent && (
                  <div className="absolute top-5 right-5 z-20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-bold">
                      <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      Active
                    </div>
                  </div>
                )}

                {/* Card content */}
                <div
                  className={`h-full p-8 md:p-10 flex flex-col bg-gradient-to-b ${plan.gradient} border ${plan.border} shadow-xl`}
                >
                  {/* Plan icon + name */}
                  <div className="mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl ${plan.iconBg} flex items-center justify-center mb-5`}
                    >
                      <Icon className={`w-7 h-7 ${plan.iconColor}`} />
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-1 ${
                        plan.featured || plan.name === "Pinnacle"
                          ? "text-white"
                          : "text-slate-800 dark:text-white"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm font-medium ${
                        plan.featured
                          ? "text-brand-100"
                          : plan.name === "Pinnacle"
                          ? "text-slate-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <span
                      className={`text-5xl font-black ${
                        plan.featured || plan.name === "Pinnacle"
                          ? "text-white"
                          : "text-slate-800 dark:text-white"
                      }`}
                    >
                      ₹{plan.price}
                    </span>
                    <span
                      className={`text-xl font-bold ml-1 ${
                        plan.featured
                          ? "text-brand-200"
                          : plan.name === "Pinnacle"
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {plan.period}
                    </span>
                    {plan.price > 0 && (
                      <p
                        className={`text-xs mt-2 font-medium ${
                          plan.featured
                            ? "text-brand-200/70"
                            : plan.name === "Pinnacle"
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        Autopay • Cancel anytime
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-3 font-medium ${
                          !feature.included
                            ? plan.featured || plan.name === "Pinnacle"
                              ? "text-white/30"
                              : "text-slate-300 dark:text-slate-600"
                            : plan.featured || plan.name === "Pinnacle"
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            !feature.included
                              ? plan.featured
                                ? "text-white/20"
                                : "text-slate-200"
                              : plan.featured
                              ? "text-green-400"
                              : plan.name === "Pinnacle"
                              ? "text-brand-400"
                              : "text-slate-400"
                          }`}
                        />
                        <span className="text-sm">{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => isUpgrade && handleUpgrade(plan.name)}
                    disabled={!isUpgrade || loading}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-center transition-all ${
                      plan.buttonStyle
                    } ${
                      !isUpgrade || loading
                        ? "opacity-60 cursor-not-allowed !scale-100 !translate-y-0"
                        : ""
                    }`}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      getButtonText(plan.name)
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust signals */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Shield className="w-4 h-4 text-green-500" />
              256-bit SSL Encrypted
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              PCI DSS Compliant
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Zap className="w-4 h-4 text-green-500" />
              Instant Activation
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Cancel your subscription anytime. No Refunds.
          </p>
        </motion.div>
      </motion.section>

      {/* Payment Status Modal */}
      <PaymentStatus
        status={paymentStatus}
        planName={selectedPlan}
        error={paymentError}
        onRetry={handleRetry}
        onClose={handleCloseStatus}
      />
    </div>
  );
}
