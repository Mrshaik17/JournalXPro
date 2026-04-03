import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Crown, Zap, Upload, Copy, Star, Gift, Users } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  { id: "pro", name: "Pro", icon: Zap, features: ["70 trades/month", "3 Accounts", "Download enabled", "Tag Insights", "Export to Excel"] },
  { id: "pro_plus", name: "Pro+", icon: Crown, features: ["150 trades/month", "7 Accounts", "AI Insights", "MT5 Auto Sync (50)", "Psychology Tracking"] },
  { id: "elite", name: "Elite", icon: Star, features: ["Unlimited trades", "10 Accounts", "Unlimited MT5 Sync", "Advanced Analytics", "Dedicated Support"] },
];

// Generate a unique referral code from user email
const generateReferralCode = (email: string) => {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${rand}`;
};

const Upgrade = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
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

  // Check referral enabled
  const getSetting = (key: string): any => {
    const s = siteSettings.find((s: any) => s.key === key);
    return s?.value || {};
  };

  const referralEnabled = getSetting("referral_toggle")?.enabled !== false;

  // Generate user's unique referral code
  const userReferralCode = profile?.email ? generateReferralCode(profile.email) : "";

  // Referral data - users who used a code that starts with this user's email prefix
  const { data: referredUsers = [] } = useQuery({
    queryKey: ["my-referrals", user?.id, profile?.email],
    queryFn: async () => {
      if (!profile?.email) return [];
      // Find users who used any code that references this user
      const emailPrefix = profile.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
      const { data } = await supabase.from("profiles").select("id, email, plan, created_at, referral_code_used")
        .not("id", "eq", user!.id);
      // Filter those whose referral_code_used starts with this user's prefix
      return (data || []).filter((u: any) => u.referral_code_used && u.referral_code_used.startsWith(emailPrefix));
    },
    enabled: !!profile,
  });

  // Calculate referral points
  const referralPoints = (() => {
    let points = referredUsers.length * 10;
    referredUsers.forEach((u: any) => {
      if (u.plan === "pro") points += 20;
      else if (u.plan === "pro_plus") points += 30;
      else if (u.plan === "elite") points += 50;
    });
    return points;
  })();

  const pricing = getSetting("pricing");
  const paymentSettings = getSetting("payment_settings");
  const inrRate = getSetting("inr_rate")?.rate || 83.5;
  const referralSettings = getSetting("referral_settings");
  const pointsForFreePlan = referralSettings?.points_for_free_plan || 500;

  const getPrice = (planId: string) => {
    if (planId === "pro") return pricing.pro || 5;
    if (planId === "pro_plus") return pricing.pro_plus || 10;
    return pricing.elite || 14;
  };

  const getDiscountedPrice = (planId: string) => {
    const base = getPrice(planId);
    if (usePoints && referralPoints >= pointsForFreePlan) return 0;
    if (usePoints) {
      const discount = (referralPoints / 2) / inrRate;
      return Math.max(base - discount, 0);
    }
    return base;
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    if (!name || !domain) return "***@***.com";
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  };

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("Select a plan");
      if (!transactionId && getDiscountedPrice(selectedPlan) > 0) throw new Error("Enter transaction ID");

      let screenshotUrl: string | null = null;
      if (screenshotFile) {
        setUploading(true);
        const filePath = `${user!.id}/${Date.now()}-${screenshotFile.name}`;
        const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(filePath, screenshotFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
        setUploading(false);
      }

      const finalAmount = getDiscountedPrice(selectedPlan);
      const { error } = await supabase.from("payments").insert({
        user_id: user!.id,
        amount: finalAmount,
        amount_inr: Math.round(finalAmount * inrRate),
        method: usePoints ? "points" : paymentMethod,
        transaction_id: transactionId || (usePoints ? `POINTS-${referralPoints}` : ""),
        screenshot_url: screenshotUrl,
        status: finalAmount === 0 ? "approved" : "pending",
        requested_plan: selectedPlan,
      });
      if (error) throw error;

      if (finalAmount === 0) {
        await supabase.from("profiles").update({ plan: selectedPlan }).eq("id", user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      const finalAmount = selectedPlan ? getDiscountedPrice(selectedPlan) : 0;
      toast.success(finalAmount === 0 ? "Plan activated with points!" : "Payment submitted! Awaiting approval.");
      setSelectedPlan(null); setTransactionId(""); setScreenshotFile(null); setUsePoints(false); setCouponApplied(false);
    },
    onError: (err: any) => { setUploading(false); toast.error(err.message); },
  });

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };
  const hasPendingPayment = myPayments.some((p) => p.status === "pending");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Upgrade Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Current plan: <span className="text-primary font-semibold capitalize">{profile?.plan || "free"}</span></p>
      </div>

      {hasPendingPayment && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-400">⏳ You have a pending payment awaiting approval.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const price = getPrice(plan.id);
          const priceInr = Math.round(price * inrRate);
          const isCurrent = profile?.plan === plan.id;
          const isSelected = selectedPlan === plan.id;

          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => !isCurrent && setSelectedPlan(plan.id)}
              disabled={isCurrent}
              className={`text-left rounded-lg border p-5 transition-all ${isSelected ? "border-primary divine-glow bg-primary/5" : isCurrent ? "border-primary/30 bg-primary/5 opacity-60" : "border-border bg-card hover:border-muted-foreground/30"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <plan.icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-bold">{plan.name}</span>
                {isCurrent && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">Current</span>}
              </div>
              <div className="text-2xl font-bold font-mono">${price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <p className="text-xs text-muted-foreground font-mono mb-3">≈ ₹{priceInr}</p>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />{f}</li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      {selectedPlan && !hasPendingPayment && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-5">
          <h2 className="text-lg font-semibold">Complete Payment</h2>

          {referralPoints > 0 && (
            <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background flex-wrap">
              <Gift className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">You have <span className="text-primary font-mono">{referralPoints}</span> referral points</p>
                <p className="text-xs text-muted-foreground">{referralPoints >= pointsForFreePlan ? "Enough for a free month!" : `${pointsForFreePlan - referralPoints} more needed for free plan`}</p>
              </div>
              <Button size="sm" variant={usePoints ? "default" : "outline"} onClick={() => { setUsePoints(!usePoints); if (!usePoints) setCouponApplied(false); }} disabled={couponApplied}>
                {usePoints ? "Using Points" : "Use Points"}
              </Button>
            </div>
          )}

          {!usePoints && (
            <div>
              <button onClick={() => setShowCoupon(!showCoupon)} className="text-xs text-primary underline mb-2">Have a coupon code?</button>
              {showCoupon && (
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon" className="bg-background border-border font-mono" disabled={usePoints} />
                  <Button size="sm" variant="outline" onClick={() => { setCouponApplied(true); toast.success("Coupon applied!"); }} disabled={usePoints || !couponCode}>Apply</Button>
                </div>
              )}
            </div>
          )}

          {getDiscountedPrice(selectedPlan) > 0 && (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  {["upi", "gpay", "crypto"].map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${paymentMethod === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"}`}>
                      {m === "upi" ? "UPI" : m === "gpay" ? "GPay/PhonePe" : "Crypto"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border bg-background p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Send <span className="text-primary font-mono font-bold">${getDiscountedPrice(selectedPlan).toFixed(2)} (≈₹{Math.round(getDiscountedPrice(selectedPlan) * inrRate)})</span> to:</p>
                {paymentMethod === "upi" && paymentSettings.upi_id && (
                  <div className="flex items-center justify-between"><span className="font-mono text-sm break-all">{paymentSettings.upi_id}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.upi_id)}><Copy className="h-3.5 w-3.5" /></Button></div>
                )}
                {paymentMethod === "gpay" && paymentSettings.phone_number && (
                  <div className="flex items-center justify-between"><span className="font-mono text-sm">{paymentSettings.phone_number}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.phone_number)}><Copy className="h-3.5 w-3.5" /></Button></div>
                )}
                {paymentMethod === "crypto" && paymentSettings.crypto_wallet && (
                  <div className="flex items-center justify-between"><span className="font-mono text-xs break-all">{paymentSettings.crypto_wallet}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.crypto_wallet)}><Copy className="h-3.5 w-3.5" /></Button></div>
                )}
                {!paymentSettings.upi_id && !paymentSettings.phone_number && !paymentSettings.crypto_wallet && (
                  <p className="text-sm text-muted-foreground">Payment details not configured yet. Contact support.</p>
                )}
              </div>
              <div><label className="text-xs text-muted-foreground block mb-1">Transaction / Reference ID</label><Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter your transaction ID" className="bg-background border-border font-mono" /></div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Payment Screenshot (optional)</label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-md border border-dashed border-border bg-background cursor-pointer hover:border-muted-foreground/30 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">{screenshotFile ? screenshotFile.name : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </>
          )}

          <Button onClick={() => submitPayment.mutate()} disabled={submitPayment.isPending || uploading || (!transactionId && !usePoints)} className="w-full bg-primary text-primary-foreground font-semibold">
            {submitPayment.isPending || uploading ? "Submitting..." : usePoints && getDiscountedPrice(selectedPlan) === 0 ? "Redeem with Points" : `Submit Payment for ${selectedPlan === "pro" ? "Pro" : selectedPlan === "pro_plus" ? "Pro+" : "Elite"}`}
          </Button>
        </motion.div>
      )}

      {myPayments.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Payment History</h3>
          <div className="space-y-2">
            {myPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded border border-border bg-background flex-wrap gap-2">
                <div><span className="font-mono text-sm">${Number(p.amount).toFixed(2)}</span><span className="text-xs text-muted-foreground ml-2">{p.method}</span></div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-success/10 text-success" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Section */}
      {referralEnabled && (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Referral Program</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="text-2xl font-bold font-mono text-primary">{referredUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Referrals</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="text-2xl font-bold font-mono text-primary">{referralPoints}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Points</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="text-2xl font-bold font-mono text-success">₹{(referralPoints / 2).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Points Value (2pts = ₹1)</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 mb-4">
            <p className="text-sm mb-2"><span className="text-primary font-semibold">{pointsForFreePlan} points</span> = 1 month free plan</p>
            <p className="text-xs text-muted-foreground">Share your unique referral code with friends. Earn 10 points per signup, +20/30/50 when they upgrade!</p>
            <div className="flex items-center gap-2 mt-3">
              <Input value={userReferralCode} readOnly className="bg-card border-border font-mono text-sm" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(userReferralCode)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {referredUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Your Referrals</h4>
              <div className="space-y-1.5">
                {referredUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded border border-border bg-background text-xs flex-wrap gap-1">
                    <span className="font-mono">{maskEmail(u.email || "user@email.com")}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full ${u.plan !== "free" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{u.plan}</span>
                      <span className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upgrade;
