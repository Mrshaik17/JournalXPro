import { supabase } from "@/integrations/supabase/client";
import { Zap, Check, X } from "lucide-react";
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
import { motion } from "framer-motion";


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

  // ✅ AUTO GET REFERRAL FROM URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const pwRules = useMemo(() => ({
    minLength: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }), [password]);

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
  // 🔥 CREATE USER (FIREBASE ONLY)
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // 🔥 CLEAN REFERRAL CODE
  const cleanReferralCode = referralCode.trim().toUpperCase();

// 🔥 STORE REFERRAL TEMPORARILY
if (cleanReferralCode) {
  localStorage.setItem("referral_code", cleanReferralCode);
}

// 🔥 FIND referral ID
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

// 🔥 SAVE PROFILE IMMEDIATELY
await supabase.from("profiles").upsert(
  {
    id: userCredential.user.uid,
    firebase_uid: userCredential.user.uid,
    email: userCredential.user.email,

    referral_code: cleanReferralCode || null,
    referred_by: referredBy,
    referral_id: referredBy, // 🔥 legacy field for easier querying

    updated_at: new Date().toISOString(),
  },
  { onConflict: "firebase_uid" }
);

toast.success("Account created successfully!");
navigate("/app");
}
else {
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
        referral_id: referredBy, // 🔥 legacy field for easier querying

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
    <div className={`text-xs ${ok ? "text-green-500" : "text-gray-400"}`}>
      {ok ? "✔" : "✖"} {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JournalXPro</span>
          </Link>
          <h1 className="text-xl font-semibold">
            {isSignUp ? "Create account" : "Welcome back"}
          </h1>
        </div>

        <Button variant="outline" onClick={handleGoogleLogin}>
          Continue with Google
        </Button>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {isSignUp && (
            <>
              <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              
              <Input
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              />

              <div>
                <PwRule ok={pwRules.minLength} text="6+ characters" />
                <PwRule ok={pwRules.hasUpper} text="Uppercase letter" />
                <PwRule ok={pwRules.hasLower} text="Lowercase letter" />
                <PwRule ok={pwRules.hasNumber} text="Number" />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm">
          {isSignUp ? "Already have account?" : "Don't have account?"}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary ml-1">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;