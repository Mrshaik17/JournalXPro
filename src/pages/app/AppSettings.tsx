import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, CreditCard, Palette, LogOut, Crown, Shield, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

const AppSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

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

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteAccountId, setDeleteAccountId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => { if (profile) setFullName(profile.full_name || ""); }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile updated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePassword = useMutation({
    mutationFn: async (pw: string) => { const { error } = await supabase.auth.updateUser({ password: pw }); if (error) throw error; },
    onSuccess: () => toast.success("Password updated!"),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: tradesErr } = await supabase.from("trades").delete().eq("account_id", id);
      if (tradesErr) throw tradesErr;
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Account and all its trades permanently deleted.");
      setDeleteAccountId(""); setDeleteConfirm(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePasswordChange = () => {
    if (newPassword.length < 6) { toast.error("Min 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    updatePassword.mutate(newPassword);
    setNewPassword(""); setConfirmPassword("");
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const planBadge = (plan: string) => {
    if (plan === "elite") return { label: "Elite", color: "bg-yellow-500/10 text-yellow-400" };
    if (plan === "pro_plus") return { label: "Pro+", color: "bg-primary/10 text-primary" };
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

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div><label className="text-xs text-muted-foreground block mb-1">Email</label><p className="font-mono text-sm text-foreground">{user?.email}</p></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Full Name</label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" className="bg-background border-border max-w-sm" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Plan</label><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Member Since</label><p className="text-sm font-mono">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p></div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="bg-primary text-primary-foreground">{updateProfile.isPending ? "Saving..." : "Save Profile"}</Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">You're on the <span className={`font-medium ${badge.color} px-1.5 py-0.5 rounded`}>{badge.label}</span> plan</p>
                </div>
                {profile?.plan === "free" && <Button onClick={() => navigate("/app/upgrade")} className="bg-primary text-primary-foreground"><Crown className="h-3.5 w-3.5 mr-1.5" />Upgrade</Button>}
              </div>
            </div>
            {myPayments.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Payment History</h3>
                <div className="space-y-2">
                  {myPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <div><span className="font-mono text-sm">${Number(p.amount).toFixed(2)}</span><span className="text-xs text-muted-foreground ml-2">{p.method || "—"}</span></div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-success/10 text-success" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-3">Theme</h3>
              <div className="flex gap-3">
                {[
                  { id: "dark" as const, label: "Dark", desc: "Default dark theme" },
                  { id: "light" as const, label: "Light", desc: "Clean light mode" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 p-3 rounded-lg border text-left transition-all ${theme === t.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-muted-foreground/30"}`}>
                    <span className="text-sm font-medium block">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold">Change Password</h3>
              <div><label className="text-xs text-muted-foreground block mb-1">New Password</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="bg-background border-border max-w-sm" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Confirm Password</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="bg-background border-border max-w-sm" /></div>
              <Button onClick={handlePasswordChange} disabled={updatePassword.isPending} className="bg-primary text-primary-foreground">{updatePassword.isPending ? "Updating..." : "Update Password"}</Button>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><h3 className="font-semibold text-destructive">Delete Account Data</h3></div>
              <p className="text-sm text-muted-foreground">Permanently delete a trading account and all its trades. This cannot be undone.</p>
              {accounts.length > 0 ? (
                <div className="space-y-3">
                  <Select value={deleteAccountId} onValueChange={setDeleteAccountId}>
                    <SelectTrigger className="bg-background border-border max-w-sm"><SelectValue placeholder="Select account to delete" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} (${Number(a.current_balance).toFixed(0)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {deleteAccountId && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} className="accent-destructive" />
                        <span className="text-xs text-destructive">I understand this is permanent and irreversible</span>
                      </label>
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => deleteAccountMutation.mutate(deleteAccountId)} disabled={!deleteConfirm || deleteAccountMutation.isPending}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />{deleteAccountMutation.isPending ? "Deleting..." : "Delete Account Permanently"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : <p className="text-xs text-muted-foreground">No accounts to delete.</p>}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Sign Out</h3>
              <p className="text-sm text-muted-foreground mb-4">Sign out of your account on this device.</p>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}><LogOut className="h-3.5 w-3.5 mr-1.5" />Sign Out</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSettings;
