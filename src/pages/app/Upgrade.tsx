import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Crown, Zap, Upload, Copy, Star } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    features: ["100 trades/month", "5 Accounts", "Divine Score", "Tag Insights", "Export to Excel"],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    icon: Crown,
    features: ["Unlimited trades", "Unlimited Accounts", "Priority Support", "Market News Feed", "Psychology Tracking"],
  },
  {
    id: "elite",
    name: "Elite",
    icon: Star,
    features: ["Everything in Pro+", "AI Trade Analysis", "Custom Fields", "Dedicated Support", "Early Access Features"],
  },
];

const Upgrade = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const getSetting = (key: string): any => {
    const s = siteSettings.find((s: any) => s.key === key);
    return s?.value || {};
  };

  const pricing = getSetting("pricing");
  const paymentSettings = getSetting("payment_settings");
  const inrRate = getSetting("inr_rate")?.rate || 83.5;

  const getPrice = (planId: string) => {
    if (planId === "pro") return pricing.pro || 5;
    if (planId === "pro_plus") return pricing.pro_plus || 10;
    return pricing.elite || 14;
  };

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("Select a plan");
      if (!transactionId) throw new Error("Enter transaction ID");

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

      const { error } = await supabase.from("payments").insert({
        user_id: user!.id,
        amount: getPrice(selectedPlan),
        method: paymentMethod,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      toast.success("Payment submitted! Awaiting approval.");
      setSelectedPlan(null); setTransactionId(""); setScreenshotFile(null);
    },
    onError: (err: any) => { setUploading(false); toast.error(err.message); },
  });

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };
  const hasPendingPayment = myPayments.some((p) => p.status === "pending");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Upgrade Plan</h1>
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
              className={`text-left rounded-lg border p-5 transition-all ${
                isSelected ? "border-primary divine-glow bg-primary/5" :
                isCurrent ? "border-primary/30 bg-primary/5 opacity-60" :
                "border-border bg-card hover:border-muted-foreground/30"
              }`}
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
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" />{f}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      {selectedPlan && !hasPendingPayment && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Complete Payment</h2>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Payment Method</label>
            <div className="flex gap-2">
              {["upi", "gpay", "crypto"].map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${paymentMethod === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"}`}>
                  {m === "upi" ? "UPI" : m === "gpay" ? "GPay/PhonePe" : "Crypto"}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-background p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Send <span className="text-primary font-mono font-bold">${getPrice(selectedPlan)} (≈₹{Math.round(getPrice(selectedPlan) * inrRate)})</span> to:</p>
            {paymentMethod === "upi" && paymentSettings.upi_id && (
              <div className="flex items-center justify-between"><span className="font-mono text-sm">{paymentSettings.upi_id}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.upi_id)}><Copy className="h-3.5 w-3.5" /></Button></div>
            )}
            {paymentMethod === "gpay" && paymentSettings.phone_number && (
              <div className="flex items-center justify-between"><span className="font-mono text-sm">{paymentSettings.phone_number}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.phone_number)}><Copy className="h-3.5 w-3.5" /></Button></div>
            )}
            {paymentMethod === "crypto" && paymentSettings.crypto_wallet && (
              <div className="flex items-center justify-between"><span className="font-mono text-sm text-xs break-all">{paymentSettings.crypto_wallet}</span><Button size="sm" variant="ghost" onClick={() => copyToClipboard(paymentSettings.crypto_wallet)}><Copy className="h-3.5 w-3.5" /></Button></div>
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
              <span className="text-sm text-muted-foreground">{screenshotFile ? screenshotFile.name : "Click to upload"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <Button onClick={() => submitPayment.mutate()} disabled={submitPayment.isPending || uploading || !transactionId} className="w-full bg-primary text-primary-foreground font-semibold">
            {submitPayment.isPending || uploading ? "Submitting..." : `Submit Payment for ${selectedPlan === "pro" ? "Pro" : selectedPlan === "pro_plus" ? "Pro+" : "Elite"}`}
          </Button>
        </motion.div>
      )}

      {myPayments.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Payment History</h3>
          <div className="space-y-2">
            {myPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded border border-border bg-background">
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
    </div>
  );
};

export default Upgrade;
