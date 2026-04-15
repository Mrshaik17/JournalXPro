import { supabase } from "@/integrations/supabase/client";
import { Zap, Check, X, Sparkles, ShieldCheck, ArrowRight, Mail, Lock, UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const pwRules = useMemo(
    () => ({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    }),
    [password]
  );

  const allPwValid =
    pwRules.minLength && pwRules.hasUpper && pwRules.hasLower && pwRules.hasNumber;

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      if (!allPwValid) {
        toast.error("Password doesn't meet requirements");
        return;
      }
      if (!passwordsMatch) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const cleanReferralCode = referralCode.trim().toUpperCase();

        if (cleanReferralCode) {
          localStorage.setItem("referral_code", cleanReferralCode);
        }

        let referredBy: string | null = null;

        if (cleanReferralCode) {
          const { data: referral } = await supabase
            .from("referrals")
            .select("id")
            .ilike("code", cleanReferralCode)
            .maybeSingle();

          if (referral) {
            referredBy = referral.id;
          }
        }

        await supabase.from("profiles").upsert(
          {
            id: userCredential.user.uid,
            firebase_uid: userCredential.user.uid,
            email: userCredential.user.email,
            referral_code: cleanReferralCode || null,
            referred_by: referredBy,
            referral_id: referredBy,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "firebase_uid" }
        );

        toast.success("Account created successfully!");
        navigate("/app");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/app");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const cleanReferralCode = referralCode.trim().toUpperCase();

      let referredBy: string | null = null;

      if (cleanReferralCode) {
        const { data: referral } = await supabase
          .from("referrals")
          .select("id")
          .ilike("code", cleanReferralCode)
          .maybeSingle();

        if (referral) {
          referredBy = referral.id;
        }
      }

      await supabase.from("profiles").upsert(
        {
          id: user.uid,
          firebase_uid: user.uid,
          email: user.email,
          referral_code: cleanReferralCode || null,
          referred_by: referredBy,
          referral_id: referredBy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firebase_uid" }
      );

      navigate("/app");
    } catch (err) {
      toast.error("Google sign-in failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Enter your email");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent!");
      setForgotOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  const PwRule = ({ ok, text }: { ok: boolean; text: string }) => (
    <motion.div
      layout
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border transition-all duration-300 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-white/10 bg-white/5 text-muted-foreground"
      }`}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      <span>{text}</span>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.20),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="relative hidden min-h-[720px] overflow-hidden border-r border-white/10 lg:block">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.22),rgba(16,185,129,0.10),rgba(255,255,255,0.03))]" />
              <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute bottom-16 right-10 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between p-10">
                <div>
                  <Link to="/" className="inline-flex items-center gap-3 group">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold tracking-wide">JournalXPro</p>
                      <p className="text-xs text-muted-foreground">Premium writing workspace</p>
                    </div>
                  </Link>
                </div>

                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="space-y-5"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs text-white/80 backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Smarter journaling experience
                    </div>

                    <h2 className="max-w-md text-4xl font-bold leading-tight">
                      Write, reflect, and grow with a more premium experience.
                    </h2>

                    <p className="max-w-md text-sm leading-7 text-muted-foreground">
                      Secure authentication, smooth onboarding, and a cleaner interface that
                      feels modern from the first interaction.
                    </p>
                  </motion.div>

                  <div className="grid gap-4">
                    {[
                      {
                        icon: ShieldCheck,
                        title: "Secure access",
                        desc: "Protected sign in with email and Google authentication.",
                      },
                      {
                        icon: Sparkles,
                        title: "Premium feel",
                        desc: "Smooth transitions, layered glass UI, and polished interactions.",
                      },
                      {
                        icon: ArrowRight,
                        title: "Fast onboarding",
                        desc: "Sign up, apply referral, and jump straight into the app.",
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.45 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/10 hover:shadow-xl hover:shadow-primary/5"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 border border-primary/15">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Designed to feel clean, fast, and trustworthy.
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[720px] items-center justify-center p-4 sm:p-8 lg:p-10">
              <div className="w-full max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mb-6 lg:hidden"
                >
                  <Link to="/" className="inline-flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold">JournalXPro</span>
                  </Link>
                </motion.div>

                <div className="rounded-[26px] border border-white/10 bg-background/60 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                  <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                        !isSignUp ? "text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {!isSignUp && (
                        <motion.div
                          layoutId="auth-switch"
                          className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                        isSignUp ? "text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isSignUp && (
                        <motion.div
                          layoutId="auth-switch"
                          className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Sign Up</span>
                    </button>
                  </div>

                  <div className="mb-6">
                    <motion.h1
                      key={isSignUp ? "signup-title" : "signin-title"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-2xl font-bold tracking-tight"
                    >
                      {isSignUp ? "Create your account" : "Welcome back"}
                    </motion.h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isSignUp
                        ? "Start your premium journaling journey in a few seconds."
                        : "Sign in to continue to your workspace."}
                    </p>
                  </div>

                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }}>
                    <Button
                      variant="outline"
                      onClick={handleGoogleLogin}
                      className="group mb-5 h-12 w-full rounded-xl border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-white/10 hover:shadow-lg"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M21.805 10.023h-9.81v3.955h5.627c-.242 1.27-.967 2.347-2.06 3.07v2.547h3.33c1.95-1.797 3.073-4.447 3.073-7.595c0-.659-.06-1.293-.16-1.977Z"
                        />
                        <path
                          fill="currentColor"
                          d="M11.995 22c2.79 0 5.13-.924 6.84-2.505l-3.33-2.547c-.923.62-2.104.987-3.51.987c-2.697 0-4.98-1.82-5.796-4.267H2.757v2.626A10.32 10.32 0 0 0 11.995 22Z"
                        />
                        <path
                          fill="currentColor"
                          d="M6.2 13.668A6.203 6.203 0 0 1 5.875 11.7c0-.684.118-1.347.325-1.968V7.106H2.757A10.305 10.305 0 0 0 1.68 11.7c0 1.648.395 3.208 1.077 4.594L6.2 13.668Z"
                        />
                        <path
                          fill="currentColor"
                          d="M11.995 5.465c1.52 0 2.885.523 3.96 1.548l2.972-2.972C17.12 2.36 14.78 1.4 11.995 1.4A10.32 10.32 0 0 0 2.757 7.106L6.2 9.732c.815-2.448 3.099-4.267 5.795-4.267Z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </motion.div>

                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <span className="bg-background/80 px-3">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Email
                      </label>
                      <div className="group relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
                        <Input
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 backdrop-blur-sm transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Password
                        </label>

                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmail(email);
                              setForgotOpen(true);
                            }}
                            className="text-xs text-primary transition-colors hover:text-primary/80"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>

                      <div className="group relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 backdrop-blur-sm transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isSignUp && (
                        <motion.div
                          key="signup-fields"
                          initial={{ opacity: 0, height: 0, y: 8 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -8 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Confirm password
                            </label>
                            <div className="group relative">
                              <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
                              <Input
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 backdrop-blur-sm transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Referral code
                            </label>
                            <div className="group relative">
                              <UserPlus className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
                              <Input
                                placeholder="Referral code (optional)"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 backdrop-blur-sm transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <PwRule ok={pwRules.minLength} text="6+ characters" />
                            <PwRule ok={pwRules.hasUpper} text="Uppercase letter" />
                            <PwRule ok={pwRules.hasLower} text="Lowercase letter" />
                            <PwRule ok={pwRules.hasNumber} text="Number" />
                          </div>

                          {confirmPassword.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-xl border px-4 py-3 text-sm ${
                                passwordsMatch
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="group h-12 w-full rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
                      >
                        {loading ? (
                          "Loading..."
                        ) : isSignUp ? (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don’t have an account?"}
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="ml-2 font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Reset password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email address and we’ll send you a password reset link.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
                <Input
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-11"
                />
              </div>
            </div>

            <Button
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="h-12 w-full rounded-xl bg-primary text-white hover:bg-primary/90"
            >
              {resetLoading ? "Sending..." : "Send reset email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;