import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFirestore } from "../hooks/useFirestore";
import { useToast } from "../context/ToastContext";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Database } from "lucide-react";

const SIGN_IN_RATE_LIMIT_KEY = "studier_signin_rate_limit";
const MAX_SIGN_IN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_LOCK_MS = 5 * 60 * 1000;

function getRateLimitState() {
  try {
    const rawValue = localStorage.getItem(SIGN_IN_RATE_LIMIT_KEY);
    if (!rawValue) {
      return { attempts: [] };
    }

    const parsedValue = JSON.parse(rawValue);
    return {
      attempts: Array.isArray(parsedValue.attempts) ? parsedValue.attempts : [],
      lockedUntil: typeof parsedValue.lockedUntil === "number" ? parsedValue.lockedUntil : null,
    };
  } catch {
    return { attempts: [] };
  }
}

function saveRateLimitState(state) {
  localStorage.setItem(SIGN_IN_RATE_LIMIT_KEY, JSON.stringify(state));
}

function getRemainingLockTime(lockedUntil) {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export default function Login() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const { isMockMode } = useFirestore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(() => getRateLimitState().lockedUntil || null);

  useEffect(() => {
    setIsSignUp(searchParams.get("signup") === "true");
  }, [searchParams]);

  useEffect(() => {
    if (!lockedUntil) {
      return;
    }

    const timerId = window.setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        saveRateLimitState({ attempts: [] });
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [lockedUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && (!displayName || !confirmPassword))) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showToast("Password and confirm password must match", "warning");
      return;
    }

    if (!isSignUp) {
      const rateLimitState = getRateLimitState();
      if (rateLimitState.lockedUntil && Date.now() < rateLimitState.lockedUntil) {
        const secondsRemaining = getRemainingLockTime(rateLimitState.lockedUntil);
        setLockedUntil(rateLimitState.lockedUntil);
        showToast(`Too many sign-in attempts. Try again in ${secondsRemaining}s.`, "error");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpEmail(email, password, displayName);
        setConfirmPassword("");
        showToast("Verification email sent. Please verify your email before signing in.", "success");
        setIsSignUp(false);
      } else {
        await signInEmail(email, password);
        saveRateLimitState({ attempts: [] });
        setLockedUntil(null);
        showToast("Logged in successfully!", "success");
      }
      if (!isSignUp) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      if (!isSignUp) {
        const now = Date.now();
        const currentState = getRateLimitState();
        const recentAttempts = (currentState.attempts || []).filter(
          (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
        );
        const updatedAttempts = [...recentAttempts, now];
        const nextState = { attempts: updatedAttempts };

        if (updatedAttempts.length >= MAX_SIGN_IN_ATTEMPTS) {
          nextState.lockedUntil = now + RATE_LIMIT_LOCK_MS;
          setLockedUntil(nextState.lockedUntil);
          saveRateLimitState(nextState);
          showToast("Too many failed sign-in attempts. Please wait 5 minutes.", "error");
        } else {
          saveRateLimitState(nextState);
          showToast(
            `Authentication failed. ${MAX_SIGN_IN_ATTEMPTS - updatedAttempts.length} sign-in attempts remaining before cooldown.`,
            "error"
          );
        }
      } else {
        showToast(error.message || "Authentication failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInGoogle();
      showToast("Logged in with Google successfully!", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Google sign-in failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.2),_transparent_24%),radial-gradient(circle_at_85%_15%,_rgba(96,165,250,0.18),_transparent_20%),linear-gradient(180deg,_#081120_0%,_#0c1728_48%,_#102036_100%)] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-black/80 border border-sky-100/70 shadow-[0_24px_50px_rgba(34,211,238,0.18)] mb-4 backdrop-blur-md">
            <img src="/logo.png" alt="Studier logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {isSignUp ? "Start learning smarter today with Studier" : "Log in to resume your study streaks"}
          </p>
        </div>

        {/* Local storage warning indicator */}
        {isMockMode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Database className="w-4 h-4" />
              <span>Running in offline Mock Mode</span>
            </div>
            <p className="text-slate-400">
              Firebase credentials are not set. You can log in or register with **any** credentials. Data will be saved locally to your browser.
            </p>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-slate-950/38 backdrop-blur-xl border border-sky-100/10 p-8 rounded-3xl shadow-[0_30px_90px_rgba(2,6,23,0.5)] space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {!isSignUp && lockedUntil && Date.now() < lockedUntil && (
              <p className="text-xs text-amber-400 font-medium">
                Sign-in is temporarily locked. Try again in {getRemainingLockTime(lockedUntil)}s.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (!isSignUp && !!lockedUntil && Date.now() < lockedUntil)}
              className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-2xl shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <span className="relative bg-slate-900/60 px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
          </div>

          {/* Social Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-white/10 hover:bg-white/5 active:scale-95 rounded-2xl font-semibold text-sm text-slate-300 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google Workspace</span>
          </button>

          {/* Toggle link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setConfirmPassword("");
              }}
              className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
