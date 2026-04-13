import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Palette,
  LogOut,
  Crown,
  Shield,
  Trash2,
  AlertTriangle,
  MapPin,
  Clock,
  Rocket,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const AppSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("firebase_uid", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("profile-update")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `firebase_uid=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const { data: myPayments = [] } = useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("firebase_uid", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("firebase_uid", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingDistrict, setBillingDistrict] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingPincode, setBillingPincode] = useState("");

  useEffect(() => {
    if (!profile) return;

    setFullName(profile.full_name || "");
    setBillingName(profile.billing_name || "");
    setBillingEmail(profile.billing_email || "");
    setBillingPhone(profile.billing_phone || "");
    setBillingStreet(profile.billing_street || "");
    setBillingCity(profile.billing_city || "");
    setBillingDistrict(profile.billing_district || "");
    setBillingState(profile.billing_state || "");
    setBillingCountry(profile.billing_country || "");
    setBillingPincode(profile.billing_pincode || "");
    setTimezone(profile.timezone || "UTC");
  }, [profile]);

  const updateProfile = useMutation({
  mutationFn: async () => {
    if (!user?.id) throw new Error("User not found");

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,              // ✅🔥 ADD THIS (VERY IMPORTANT)
          firebase_uid: user.id,
          email: user.email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firebase_uid" }
      );

    if (error) throw error;
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    toast.success("Profile updated successfully.");
  },

  onError: (err: any) => {
    toast.error(err.message || "Failed to update profile.");
  },
});

  const updatePassword = useMutation({
    mutationFn: async (pw: string) => {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: tradesErr } = await supabase
        .from("trades")
        .delete()
        .eq("account_id", id);
      if (tradesErr) throw tradesErr;

      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Account and all its trades permanently deleted.");
      setDeleteAccountId("");
      setDeleteConfirm(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePasswordChange = () => {
    if (newPassword.length < 6) {
      toast.error("Min 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    updatePassword.mutate(newPassword);
  };
  const storedReferralCode = localStorage.getItem("referral_code");
const cleanReferralCode = storedReferralCode?.trim().toUpperCase() || null;

  const saveBilling = async () => {
  if (!user?.id) {
    toast.error("User not found.");
    return;
  }

  if (
    !billingName.trim() ||
    !billingEmail.trim() ||
    !billingPhone.trim() ||
    !billingStreet.trim() ||
    !billingCity.trim() ||
    !billingState.trim() ||
    !billingCountry.trim() ||
    !billingPincode.trim()
  ) {
    toast.error("All billing fields are required.");
    return;
  }

  try {
    // 🔥 GET REFERRAL FROM LOCAL STORAGE
    

let referredBy: string | null = null;

// 🔥 FIND referral id
if (cleanReferralCode) {
  const { data: referral } = await supabase
  .from("referrals")
  .select("id, code")
  .ilike("code", cleanReferralCode) // 🔥 case-insensitive
  .maybeSingle();

console.log("Entered Code:", cleanReferralCode);
console.log("Matched Referral:", referral);

  if (referral) {
    referredBy = referral.id;
  }
}

// 🔥 UPDATE PROFILE WITH REFERRAL + BILLING
const { error } = await supabase
  .from("profiles")
  .upsert(
    {
      id: user.id,
      firebase_uid: user.id,
      email: user.email,

      billing_name: billingName.trim(),
      billing_email: billingEmail.trim(),
      billing_phone: billingPhone.trim(),
      billing_street: billingStreet.trim(),
      billing_city: billingCity.trim(),
      billing_district: billingDistrict.trim(),
      billing_state: billingState.trim(),
      billing_country: billingCountry.trim(),
      billing_pincode: billingPincode.trim(),

      referral_code: cleanReferralCode,
      referred_by: referredBy,

      updated_at: new Date().toISOString(),
    },
    { onConflict: "firebase_uid" }
  );

if (error) throw error;

// 🔥 CLEAR AFTER USE
if (cleanReferralCode) {
  localStorage.removeItem("referral_code");
}

    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

    toast.success("Billing + referral saved successfully!");
  } catch (err: any) {
    console.error("Billing save error:", err);
    toast.error(err.message || "Failed to save billing.");
  }
};

  const saveTimezone = async () => {
    if (!user?.id) {
      toast.error("User not found.");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("firebase_uid", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Timezone saved.");
    } catch (err: any) {
      console.error("Timezone save error:", err);
      toast.error(err.message || "Failed to save timezone.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const exportUserData = (format: "pdf" | "excel") => {
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("My Trading Data", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      autoTable(doc, {
        startY: 36,
        head: [["Account", "Balance", "P&L"]],
        body: accounts.map((a: any) => [
          a.name,
          `$${Number(a.current_balance).toFixed(2)}`,
          `$${(Number(a.current_balance) - Number(a.initial_balance)).toFixed(
            2
          )}`,
        ]),
      });

      const fy = (doc as any).lastAutoTable?.finalY || 50;

      autoTable(doc, {
        startY: fy + 10,
        head: [["Date", "Pair", "Result", "P&L"]],
        body: trades.slice(0, 100).map((t: any) => [
          new Date(t.created_at).toLocaleDateString(),
          t.pair || "—",
          t.result || "—",
          `$${Number(t.pnl_amount).toFixed(2)}`,
        ]),
      });

      doc.save("my-trading-data.pdf");
      toast.success("PDF exported!");
    } else {
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          accounts.map((a: any) => ({
            Account: a.name,
            Type: a.account_type,
            Balance: a.current_balance,
            Initial: a.initial_balance,
          }))
        ),
        "Accounts"
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          trades.map((t: any) => ({
            Date: new Date(t.created_at).toLocaleDateString(),
            Pair: t.pair,
            Direction: t.direction,
            Result: t.result,
            PnL: t.pnl_amount,
            Pips: t.pips,
          }))
        ),
        "Trades"
      );

      XLSX.writeFile(wb, "my-trading-data.xlsx");
      toast.success("Excel exported!");
    }
  };

  const planBadge = (plan: string) => {
    if (plan === "elite") {
      return {
        label: "Elite",
        color: "bg-yellow-500/10 text-yellow-400",
      };
    }
    if (plan === "pro_plus") {
      return {
        label: "Pro+",
        color: "bg-primary/10 text-primary",
      };
    }
    if (plan === "pro") {
      return {
        label: "Pro",
        color: "bg-primary/10 text-primary",
      };
    }
    return {
      label: "Free",
      color: "bg-muted text-muted-foreground",
    };
  };

  const badge = planBadge(profile?.plan || "free");

  const hasBilling =
    billingName &&
    billingEmail &&
    billingPhone &&
    billingStreet &&
    billingCity &&
    billingState &&
    billingCountry &&
    billingPincode;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {!hasBilling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground font-medium">
              Complete your billing address
            </p>
            <p className="text-xs text-muted-foreground">
              Billing details are required for subscription payments. Go to the
              Billing tab to save your details.
            </p>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-card border border-border flex-wrap">
          <TabsTrigger value="profile">
            <User className="h-3.5 w-3.5 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="h-3.5 w-3.5 mr-1.5" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Rocket className="h-3.5 w-3.5 mr-1.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-card p-6 space-y-5"
          >
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Email
              </label>
              <p className="font-mono text-sm text-foreground">
                {user?.email || "—"}
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="bg-background border-border max-w-sm"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Plan
              </label>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}
              >
                {badge.label}
              </span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Member Since
              </label>
              <p className="text-sm font-mono">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending || profileLoading}
              className="bg-primary text-primary-foreground"
            >
              {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card p-6 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Billing Address
              </h3>
              <p className="text-xs text-muted-foreground">
                Required for subscription payments. All fields are mandatory.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Full Name *
                  </label>
                  <Input
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Email *
                  </label>
                  <Input
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-background border-border"
                    type="email"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Phone Number *
                  </label>
                  <Input
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    placeholder="+91..."
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    PIN Code *
                  </label>
                  <Input
                    value={billingPincode}
                    onChange={(e) => setBillingPincode(e.target.value)}
                    placeholder="500001"
                    className="bg-background border-border font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Street Address *
                </label>
                <Input
                  value={billingStreet}
                  onChange={(e) => setBillingStreet(e.target.value)}
                  placeholder="123 Main Street"
                  className="bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    City *
                  </label>
                  <Input
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                    placeholder="Hyderabad"
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    District
                  </label>
                  <Input
                    value={billingDistrict}
                    onChange={(e) => setBillingDistrict(e.target.value)}
                    placeholder="Rangareddy"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    State *
                  </label>
                  <Input
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    placeholder="Telangana"
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Country *
                  </label>
                  <Input
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    placeholder="India"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <Button
                onClick={saveBilling}
                className="bg-primary text-primary-foreground"
              >
                Save Billing Details
              </Button>
            </motion.div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You're on the{" "}
                    <span
                      className={`font-medium ${badge.color} px-1.5 py-0.5 rounded`}
                    >
                      {badge.label}
                    </span>{" "}
                    plan
                  </p>
                </div>

                {profile?.plan === "free" && (
                  <Button
                    onClick={() => navigate("/app/upgrade")}
                    className="bg-primary text-primary-foreground"
                  >
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>

            {myPayments.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Payment History</h3>
                <div className="space-y-2">
                  {myPayments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded border border-border bg-background"
                    >
                      <div>
                        <span className="font-mono text-sm">
                          ${Number(p.amount).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {p.method || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "approved"
                              ? "bg-success/10 text-success"
                              : p.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              <div>
                <h3 className="font-semibold mb-3">Theme</h3>
                <div className="flex gap-3">
                  {[
                    {
                      id: "dark" as const,
                      label: "Dark",
                      desc: "Default dark theme",
                    },
                    {
                      id: "light" as const,
                      label: "Light",
                      desc: "Clean light mode",
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                        theme === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-sm font-medium block">
                        {t.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Timezone
              </h3>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-background border-border max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={saveTimezone}
                className="bg-primary text-primary-foreground"
              >
                Save Timezone
              </Button>
            </div>

            {trades.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  Export My Data
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportUserData("pdf")}
                  >
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportUserData("excel")}
                  >
                    Export Excel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold">Change Password</h3>

              <div className="relative">
                <label className="text-xs text-muted-foreground block mb-1">
                  New Password
                </label>
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-background border-border max-w-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="bg-background border-border max-w-sm"
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={updatePassword.isPending}
                className="bg-primary text-primary-foreground"
              >
                {updatePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold text-destructive">
                  Delete Account Data
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Permanently delete a trading account and all its trades. This
                cannot be undone.
              </p>

              {accounts.length > 0 ? (
                <div className="space-y-3">
                  <Select
                    value={deleteAccountId}
                    onValueChange={setDeleteAccountId}
                  >
                    <SelectTrigger className="bg-background border-border max-w-sm">
                      <SelectValue placeholder="Select account to delete" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {accounts.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} (${Number(a.current_balance).toFixed(0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {deleteAccountId && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.checked)}
                          className="accent-destructive"
                        />
                        <span className="text-xs text-destructive">
                          I understand this is permanent and irreversible
                        </span>
                      </label>

                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          deleteAccountMutation.mutate(deleteAccountId)
                        }
                        disabled={
                          !deleteConfirm || deleteAccountMutation.isPending
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {deleteAccountMutation.isPending
                          ? "Deleting..."
                          : "Delete Account Permanently"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No accounts to delete.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Sign Out</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your account on this device.
              </p>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {[
              {
                title: "API Integrations",
                desc: "Connect your broker APIs for automatic trade sync",
              },
              {
                title: "Broker Sync",
                desc: "Sync trades directly from your broker platform",
              },
              {
                title: "Advanced Analytics",
                desc: "Deep performance analytics with AI-powered insights",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-6 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-primary" />
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppSettings;