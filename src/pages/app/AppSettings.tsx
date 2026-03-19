import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Palette, LogOut, Crown, Shield } from "lucide-react";

const AppSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myPayments = [] } = useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Profile editing state
  const [fullName, setFullName] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  useEffect(() => {
    const saved = localStorage.getItem("td-theme") || "dark";
    setTheme(saved);
  }, []);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePassword = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password updated!"),
    onError: (err: any) => toast.error(err.message),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    updatePassword.mutate(newPassword);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("td-theme", newTheme);
    // For now only dark mode is supported - could extend later
    toast.success(`Theme preference saved: ${newTheme}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const planBadge = (plan: string) => {
    if (plan === "pro_plus") return { label: "Pro+", color: "bg-yellow-500/10 text-yellow-400" };
    if (plan === "pro") return { label: "Pro", color: "bg-primary/10 text-primary" };
    return { label: "Free", color: "bg-muted text-muted-foreground" };
  };

  const badge = planBadge(profile?.plan || "free");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Billing</TabsTrigger>
          <TabsTrigger value="preferences"><Palette className="h-3.5 w-3.5 mr-1.5" />Preferences</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email</label>
              <p className="font-mono text-sm text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="bg-background border-border max-w-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Plan</label>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Member Since</label>
              <p className="text-sm font-mono">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="bg-primary text-primary-foreground"
            >
              {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You're on the <span className={`font-medium ${badge.color} px-1.5 py-0.5 rounded`}>{badge.label}</span> plan
                  </p>
                </div>
                {profile?.plan === "free" && (
                  <Button onClick={() => navigate("/app/upgrade")} className="bg-primary text-primary-foreground">
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade
                  </Button>
                )}
              </div>

              {profile?.plan === "free" && (
                <div className="text-xs text-muted-foreground border-t border-border pt-3">
                  Free plan includes 20 trades/month. Upgrade for more.
                </div>
              )}
            </div>

            {myPayments.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Payment History</h3>
                <div className="space-y-2">
                  {myPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <div>
                        <span className="font-mono text-sm">${Number(p.amount).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.method || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "approved" ? "bg-success/10 text-success" :
                          p.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-yellow-500/10 text-yellow-500"
                        }`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-3">Theme</h3>
              <div className="flex gap-3">
                {[
                  { id: "dark", label: "Dark", desc: "Easy on the eyes" },
                  { id: "midnight", label: "Midnight", desc: "Deep dark mode" },
                  { id: "divine", label: "Divine", desc: "Cyan accent glow" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                      theme === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-sm font-medium block">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Notifications</h3>
              <div className="space-y-3">
                {["Trade reminders", "Plan expiry alerts", "New features"].map((item) => (
                  <label key={item} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                    <span className="text-sm">{item}</span>
                    <input type="checkbox" defaultChecked className="accent-primary" />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold">Change Password</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-background border-border max-w-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="bg-background border-border max-w-sm"
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={updatePassword.isPending} className="bg-primary text-primary-foreground">
                {updatePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSettings;
