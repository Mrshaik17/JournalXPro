import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check hash
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) { toast.error("Min 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! Redirecting...");
      setTimeout(() => navigate("/app"), 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JournalXPro</span>
          </div>
          <h1 className="text-xl font-semibold mb-1">Set New Password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>
        {ready ? (
          <div className="space-y-3">
            <Input placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-card border-border" minLength={6} />
            <Input placeholder="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-card border-border" />
            <Button onClick={handleReset} disabled={loading} className="w-full bg-primary text-primary-foreground">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Processing reset link... If this doesn't work, request a new reset link.</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
