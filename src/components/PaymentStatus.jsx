import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, RotateCcw, X } from "lucide-react";

/**
 * PaymentStatus Modal — shows processing, success, or failure state
 * 
 * @param {Object} props
 * @param {'processing' | 'success' | 'failed' | null} props.status
 * @param {string} props.planName - 'Pro' or 'Pinnacle'
 * @param {string|null} props.error - Error message on failure
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onClose - Close/dismiss callback
 */
export default function PaymentStatus({ status, planName, error, onRetry, onClose }) {
  if (!status) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={(e) => {
          if (status !== "processing" && e.target === e.currentTarget) onClose?.();
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* Close button (not shown during processing) */}
          {status !== "processing" && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Processing State */}
          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Verifying Payment</h3>
              <p className="text-slate-500 font-medium">
                Please wait while we confirm your payment...
              </p>
              <div className="flex gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-brand-400"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center">
              {/* Success gradient header */}
              <div className="w-full py-10 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)]" />
                
                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                  className="relative z-10 mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", damping: 10 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>

                {/* Confetti particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                    animate={{
                      opacity: 0,
                      y: [0, -60 - Math.random() * 80],
                      x: [(Math.random() - 0.5) * 120, (Math.random() - 0.5) * 200],
                      scale: [1, 0.5],
                      rotate: Math.random() * 720,
                    }}
                    transition={{ duration: 1.5, delay: 0.3 + Math.random() * 0.3, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"][i % 6],
                    }}
                  />
                ))}
              </div>

              <div className="px-8 py-8">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-slate-800 mb-2"
                >
                  Welcome to {planName}!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="text-slate-500 font-medium mb-8"
                >
                  Your {planName} plan is now active. Enjoy all the premium features!
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Start Exploring →
                </motion.button>
              </div>
            </div>
          )}

          {/* Failure State */}
          {status === "failed" && (
            <div className="flex flex-col items-center text-center">
              {/* Error gradient header */}
              <div className="w-full py-10 bg-gradient-to-br from-red-400 via-rose-500 to-pink-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="relative z-10 mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <XCircle className="w-12 h-12 text-white" />
                </motion.div>
              </div>

              <div className="px-8 py-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h3>
                <p className="text-slate-500 font-medium mb-3">
                  {error || "Something went wrong with your payment. Please try again."}
                </p>
                <p className="text-xs text-slate-400 mb-8">
                  No amount has been charged to your account.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onRetry}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
