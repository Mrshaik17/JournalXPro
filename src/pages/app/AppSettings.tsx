import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Chart from "chart.js/auto";
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
        .single()

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  },
  enabled: !!user?.id,
});
const currentPlan = profile?.plan || "free";
const normalizedPlan = currentPlan?.toLowerCase();

const canExport = ["standard", "pro+", "pro plus", "elite"].includes(normalizedPlan);

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
      return data || [];
    },
    enabled: !!user?.id,
  });

  const [fullName, setFullName] = useState("");
  const [deleteAccountId, setDeleteAccountId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

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
            id: user.id,
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
      let referredBy: string | null = null;

      if (cleanReferralCode) {
        const { data: referral } = await supabase
          .from("referrals")
          .select("id, code")
          .ilike("code", cleanReferralCode)
          .maybeSingle();

        console.log("Entered Code:", cleanReferralCode);
        console.log("Matched Referral:", referral);

        if (referral) {
          referredBy = referral.id;
        }
      }

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

  const generatePnLChart = (trades: any[]) => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 300;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      const sorted = [...trades].sort(
        (a, b) =>
          new Date(a.trade_date || a.created_at).getTime() -
          new Date(b.trade_date || b.created_at).getTime()
      );

      let cumulative = 0;
      const labels: string[] = [];
      const data: number[] = [];

      sorted.forEach((t) => {
        cumulative += Number(t.pnl_amount || 0);
        labels.push(
          new Date(t.trade_date || t.created_at).toLocaleDateString()
        );
        data.push(cumulative);
      });

      new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "PnL",
              data,
              borderWidth: 2,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: false,
          plugins: { legend: { display: false } },
        },
      });

      setTimeout(() => {
        resolve(canvas.toDataURL("image/png"));
      }, 500);
    });
  };

  const normalizeTrade = (t: any) => ({
    id: t.id || "",
    accountId: t.account_id || t.accountId || "",
    pair: t.pair || "",
    direction: t.direction || "",
    went: t.went || "",
    lotSize: t.lot_size ?? t.lotSize ?? "",
    bias: t.bias || "",
    pips: t.pips ?? "",
    entryPrice: t.entry_price ?? t.entryPrice ?? "",
    stopLoss: t.stop_loss ?? t.stopLoss ?? "",
    takeProfit: t.take_profit ?? t.takeProfit ?? "",
    result: t.result || "",
    pnlAmount: Number(t.pnl_amount || t.pnlAmount || 0),
    tradeDate: t.trade_date || t.tradeDate || t.created_at || "",
    entryTime: t.entry_time || t.entryTime || "",
    exitTime: t.exit_time || t.exitTime || "",
    followPlan:
      typeof t.follow_plan === "boolean"
        ? t.follow_plan
        : typeof t.followPlan === "boolean"
        ? t.followPlan
        : "",
    notes: t.note || t.notes || "",
    tags: Array.isArray(t.tags) ? t.tags.join(", ") : t.tags || "",
    customFields: Array.isArray(t.custom_fields)
      ? JSON.stringify(t.custom_fields)
      : Array.isArray(t.customFields)
      ? JSON.stringify(t.customFields)
      : t.custom_fields || t.customFields || "",
    screenshotUrl: t.screenshot_url || "",
    createdAt: t.created_at || "",
  });

  const getTradeStats = (tradeList: any[]) => {
    const normalized = tradeList.map(normalizeTrade);

    const totalTrades = normalized.length;
    const totalPnL = normalized.reduce((sum, t) => sum + Number(t.pnlAmount || 0), 0);

    const wins = normalized.filter(
      (t) =>
        Number(t.pnlAmount) > 0 ||
        String(t.result).toLowerCase() === "win"
    ).length;

    const losses = normalized.filter(
      (t) =>
        Number(t.pnlAmount) < 0 ||
        String(t.result).toLowerCase() === "loss"
    ).length;

    const breakeven = normalized.filter(
      (t) =>
        Number(t.pnlAmount) === 0 ||
        String(t.result).toLowerCase() === "breakeven"
    ).length;

    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";

    return {
      normalized,
      totalTrades,
      totalPnL,
      wins,
      losses,
      breakeven,
      winRate,
    };
  };

  const exportUserData = async (format: "pdf" | "excel") => {
  if (!user?.id) {
    toast.error("User not found.");
    return;
  }

  const filteredAccounts =
    selectedAccountId === "all"
      ? accounts
      : accounts.filter((a: any) => a.id === selectedAccountId);

  if (!filteredAccounts.length) {
    toast.error("No accounts found for export.");
    return;
  }

  const accountIds = filteredAccounts.map((a: any) => a.id);

  const { data: latestTrades, error } = await supabase
    .from("trades")
    .select("*")
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Trade export fetch error:", error);
    toast.error(error.message || "Failed to fetch latest trades");
    return;
  }

  const normalizedTrades = (latestTrades || []).map((t: any) => ({
    id: t.id || "",
    accountId: t.account_id || "",
    pair: t.pair || "",
    direction: t.direction || "",
    went: t.went || "",
    lotSize: t.lot_size ?? "",
    bias: t.bias || "",
    pips: t.pips ?? "",
    entryPrice: t.entry_price ?? "",
    stopLoss: t.stop_loss ?? "",
    takeProfit: t.take_profit ?? "",
    result: t.result || "",
    pnlAmount: Number(t.pnl_amount || 0),
    tradeDate: t.trade_date || t.created_at || "",
    entryTime: t.entry_time || "",
    exitTime: t.exit_time || "",
    followPlan:
      typeof t.follow_plan === "boolean" ? t.follow_plan : "",
    notes: t.note || t.notes || "",
    tags: Array.isArray(t.tags) ? t.tags.join(", ") : t.tags || "",
    customFields: Array.isArray(t.custom_fields)
      ? JSON.stringify(t.custom_fields)
      : t.custom_fields || "",
    screenshotUrl: t.screenshot_url || "",
    createdAt: t.created_at || "",
  }));

  const totalTrades = normalizedTrades.length;

  const wins = normalizedTrades.filter(
    (t: any) =>
      Number(t.pnlAmount) > 0 || String(t.result).toLowerCase() === "win"
  ).length;

  const losses = normalizedTrades.filter(
    (t: any) =>
      Number(t.pnlAmount) < 0 || String(t.result).toLowerCase() === "loss"
  ).length;

  const breakeven = normalizedTrades.filter(
    (t: any) =>
      Number(t.pnlAmount) === 0 ||
      String(t.result).toLowerCase() === "breakeven"
  ).length;

  const totalPnL = normalizedTrades.reduce(
    (sum: number, t: any) => sum + Number(t.pnlAmount || 0),
    0
  );

  const winRate =
    totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";

  if (format === "pdf") {
    const chartImage = await generatePnLChart(latestTrades || []);
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("JournalXPro Trading Report", 14, 15);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);

    doc.setTextColor(0, 0, 0);

    let currentY = 32;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(14, currentY, 269, 28, 3, 3, "F");

    doc.setFontSize(11);
    doc.text(`Total Trades: ${totalTrades}`, 18, currentY + 8);
    doc.text(`Accuracy: ${winRate}%`, 18, currentY + 16);
    doc.text(`Breakeven: ${breakeven}`, 18, currentY + 24);

    doc.text(`Total PnL: $${totalPnL.toFixed(2)}`, 120, currentY + 8);
    doc.text(`Wins: ${wins}`, 120, currentY + 16);
    doc.text(`Losses: ${losses}`, 120, currentY + 24);

    doc.text(
      `Scope: ${
        selectedAccountId === "all"
          ? "All Accounts"
          : filteredAccounts[0]?.name || "Selected Account"
      }`,
      210,
      currentY + 8
    );
    doc.text(`Accounts: ${filteredAccounts.length}`, 210, currentY + 16);
    doc.text(`Rows Exported: ${normalizedTrades.length}`, 210, currentY + 24);

    currentY += 38;

    if (chartImage && normalizedTrades.length > 0) {
      doc.setFontSize(13);
      doc.text("Cumulative PnL", 14, currentY);
      currentY += 4;
      doc.addImage(chartImage, "PNG", 14, currentY, 120, 50);
      currentY += 60;
    }

    doc.setFontSize(14);
    doc.text("Accounts Summary", 14, currentY);
    currentY += 6;

    filteredAccounts.forEach((acc: any) => {
      const accountTrades = normalizedTrades.filter(
        (t: any) => t.accountId === acc.id
      );

      const accountPnL = accountTrades.reduce(
        (sum: number, t: any) => sum + Number(t.pnlAmount || 0),
        0
      );

      doc.setFontSize(10);
      doc.text(`Account: ${acc.name}`, 14, currentY);
      currentY += 5;

      doc.text(
        `Initial: $${Number(acc.starting_balance || 0).toFixed(
          2
        )} | Current: $${Number(acc.current_balance || 0).toFixed(
          2
        )} | Trades: ${accountTrades.length} | PnL: $${accountPnL.toFixed(2)}`,
        14,
        currentY
      );

      currentY += 8;
    });

    for (const acc of filteredAccounts) {
      const accTrades = normalizedTrades.filter((t: any) => t.accountId === acc.id);

      if (accTrades.length === 0) continue;

      doc.addPage();
      doc.setFontSize(14);
      doc.text(`Account: ${acc.name}`, 14, 15);

      const tableData = accTrades.map((t: any) => [
        t.tradeDate ? new Date(t.tradeDate).toLocaleDateString() : "-",
        t.pair || "-",
        t.direction || "-",
        t.went || "-",
        t.lotSize || "-",
        t.bias || "-",
        t.pips || "-",
        t.entryPrice || "-",
        t.stopLoss || "-",
        t.takeProfit || "-",
        t.result || "-",
        t.pnlAmount ?? "-",
        t.entryTime || "-",
        t.exitTime || "-",
        t.followPlan === "" ? "-" : t.followPlan ? "Yes" : "No",
        t.notes || "-",
        t.tags || "-",
        t.customFields || "-",
      ]);

      autoTable(doc, {
        startY: 22,
        head: [[
          "Date",
          "Pair",
          "Direction",
          "Went",
          "Lot Size",
          "Bias",
          "Pips",
          "Entry",
          "SL",
          "TP",
          "Result",
          "PnL",
          "Entry Time",
          "Exit Time",
          "Follow Plan",
          "Notes",
          "Tags",
          "Custom Fields",
        ]],
        body: tableData,
        styles: { fontSize: 6.5, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42] },
        margin: { left: 8, right: 8 },
        tableWidth: "auto",
      });
    }

    doc.save("JournalXPro_Report.pdf");
    toast.success("PDF exported successfully!");
  } else {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    {
      Metric: "Scope",
      Value:
        selectedAccountId === "all"
          ? "All Accounts"
          : filteredAccounts[0]?.name || "-",
    },
    { Metric: "Accounts", Value: filteredAccounts.length },
    { Metric: "Total Trades", Value: totalTrades },
    { Metric: "Accuracy %", Value: Number(winRate) },
    { Metric: "Wins", Value: wins },
    { Metric: "Losses", Value: losses },
    { Metric: "Breakeven", Value: breakeven },
    { Metric: "Total PnL", Value: totalPnL.toFixed(2) },
  ];

  const accountData = filteredAccounts.map((acc: any) => {
    const accountTrades = normalizedTrades.filter(
      (t: any) => t.accountId === acc.id
    );

    const accountPnL = accountTrades.reduce(
      (sum: number, t: any) => sum + Number(t.pnlAmount || 0),
      0
    );

    return {
      "Account Name": acc.name || "-",
      "Initial Balance": Number(acc.starting_balance || 0),
      "Current Balance": Number(acc.current_balance || 0),
      "Trades": accountTrades.length,
      "PnL": accountPnL,
      "Created At": acc.created_at
        ? new Date(acc.created_at).toLocaleString()
        : "-",
    };
  });

  const tradeData = normalizedTrades.map((t: any) => ({
    "Account Name":
      accounts.find((a: any) => a.id === t.accountId)?.name || "-",
    "Date": t.tradeDate ? new Date(t.tradeDate).toLocaleDateString() : "-",
    "Pair": t.pair || "-",
    "Direction": t.direction || "-",
    "Went": t.went || "-",
    "Lot Size": t.lotSize || "-",
    "Bias": t.bias || "-",
    "Pips": t.pips || "-",
    "Entry": t.entryPrice || "-",
    "SL": t.stopLoss || "-",
    "TP": t.takeProfit || "-",
    "Result": t.result || "-",
    "PnL": t.pnlAmount ?? "-",
    "Entry Time": t.entryTime || "-",
    "Exit Time": t.exitTime || "-",
    "Follow Plan": t.followPlan === "" ? "-" : t.followPlan ? "Yes" : "No",
    "Notes": t.notes || "-",
    "Tags": t.tags || "-",
    "Custom Fields": t.customFields || "-",
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  const accountSheet = XLSX.utils.json_to_sheet(accountData);

  const tradeHeaders = [
    "Account Name",
    "Date",
    "Pair",
    "Direction",
    "Went",
    "Lot Size",
    "Bias",
    "Pips",
    "Entry",
    "SL",
    "TP",
    "Result",
    "PnL",
    "Entry Time",
    "Exit Time",
    "Follow Plan",
    "Notes",
    "Tags",
    "Custom Fields",
  ];

  const tradeSheet = XLSX.utils.json_to_sheet(tradeData, {
    header: tradeHeaders,
  });

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, accountSheet, "Accounts");
  XLSX.utils.book_append_sheet(wb, tradeSheet, "Trades");

  XLSX.writeFile(wb, "JournalXPro_Report.xlsx");
  toast.success("Excel exported successfully!");
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

                <div className="p-3 rounded-lg border border-primary bg-primary/5">
                  <span className="text-sm font-medium block">Dark Mode</span>
                  <span className="text-xs text-muted-foreground">
                    Default theme (only available mode)
                  </span>
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

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Export My Data
              </h3>

              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="bg-background border-border max-w-sm">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>

                  {accounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
  onClick={() => {
    if (!canExport) {
      toast.error("Upgrade to Standard or Elite to unlock export");
      return;
    }
    exportUserData("pdf");
  }}
  disabled={!canExport}
  className={!canExport ? "opacity-50 cursor-not-allowed" : ""}
>
  {canExport ? "Download PDF" : "🔒 Locked (Upgrade Required)"}
</Button>

                <Button
  onClick={() => {
    if (!canExport) {
      toast.error("Upgrade to Standard or Elite to unlock export");
      return;
    }
    exportUserData("excel");
  }}
  disabled={!canExport}
  className={!canExport ? "opacity-50 cursor-not-allowed" : ""}
>
  {canExport ? "Download Excel" : "🔒 Locked (Upgrade Required)"}
</Button>
{!canExport && (
  <p className="text-xs text-muted-foreground mt-2">
    Upgrade to Standard or Elite to unlock data export feature.
  </p>
)}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4"></div>

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