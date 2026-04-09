import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BadgeCheck,
  Crown,
  Star,
  Zap,
  Upload,
  ArrowLeft,
  Loader2,
  Percent,
  Copy,
} from "lucide-react";

type PlanId = "basic" | "standard" | "elite";
type BillingCycle = "1m" | "3m" | "6m" | "1y";
type PaymentMethod = "upi" | "bank" | "crypto";

const basePlans = [
  {
    id: "basic" as PlanId,
    name: "Basic",
    icon: Zap,
    tagline: "For beginner traders",
    monthlyUsd: 4,
    highlight: false,
    features: [
      "80 trades limit",
      "3 accounts",
      "Unlock tools + prop firms + news",
      "Analytics (last 100 trades)",
      "Auto delete after 6 months",
    ],
  },
  {
    id: "standard" as PlanId,
    name: "Standard",
    icon: Crown,
    tagline: "For serious traders",
    monthlyUsd: 7,
    highlight: true,
    features: [
      "170 trades limit",
      "7 accounts",
      "Payout tracker unlocked",
      "Advanced analytics",
      "Download enabled",
      "Auto delete after 1 year",
    ],
  },
  {
    id: "elite" as PlanId,
    name: "Elite",
    icon: Star,
    tagline: "Unlimited power",
    monthlyUsd: 10,
    highlight: false,
    features: [
      "Unlimited trades",
      "Unlimited accounts",
      "All analytics unlocked",
      "AI insights unlocked",
      "No limits",
      "Auto delete after 3 years",
    ],
  },
];

const billingMultiplier: Record<BillingCycle, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12,
};

const billingDiscount: Record<BillingCycle, number> = {
  "1m": 0,
  "3m": 5,
  "6m": 10,
  "1y": 15,
};

const inrRate = 83;

const paymentConfig = {
  upiId: import.meta.env.VITE_PAYMENT_UPI_ID || "9885522948@ybl",

  bankName: import.meta.env.VITE_PAYMENT_BANK_NAME || "State Bank of India",
  bankAccount: import.meta.env.VITE_PAYMENT_BANK_ACCOUNT || "87762653127112",
  bankIfsc: import.meta.env.VITE_PAYMENT_BANK_IFSC || "3187236dqjsghad1783",

  walletName: import.meta.env.VITE_PAYMENT_WALLET_NAME || "Trust Wallet",
  eth:
    import.meta.env.VITE_PAYMENT_CRYPTO_ETH ||
    "0x7A12bC45D98Ef1234567890AbCdEf1234567890",
  btc:
    import.meta.env.VITE_PAYMENT_CRYPTO_BTC ||
    "bc1q8x7k2n0dummyaddress4w9h2s8l0v3p5t6y7u",
  ltc:
    import.meta.env.VITE_PAYMENT_CRYPTO_LTC ||
    "ltc1q4n8dummyaddress9x2w5r7t1m3k6p8z0a2b",
  usdt:
    import.meta.env.VITE_PAYMENT_CRYPTO_USDT ||
    "TK9DummyUsdtAddressAllNetworks123456789",
};

const envCoupons = [
  {
    code: import.meta.env.VITE_COUPON_1_CODE || "",
    discount: Number(import.meta.env.VITE_COUPON_1_DISCOUNT || 0),
    active: import.meta.env.VITE_COUPON_1_ACTIVE === "true",
  },
  {
    code: import.meta.env.VITE_COUPON_2_CODE || "",
    discount: Number(import.meta.env.VITE_COUPON_2_DISCOUNT || 0),
    active: import.meta.env.VITE_COUPON_2_ACTIVE === "true",
  },
  {
    code: import.meta.env.VITE_COUPON_3_CODE || "",
    discount: Number(import.meta.env.VITE_COUPON_3_DISCOUNT || 0),
    active: import.meta.env.VITE_COUPON_3_ACTIVE === "true",
  },
].filter((coupon) => coupon.code && coupon.active);

const UpgradePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("standard");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("1m");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [transactionId, setTransactionId] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const [showCouponBox, setShowCouponBox] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const currentPlan = profile?.plan || "free";
  const pointsBalance = Number(profile?.points || 0);

  const selectedPlanData = useMemo(
    () => basePlans.find((p) => p.id === selectedPlan)!,
    [selectedPlan]
  );

  const baseAmount = selectedPlanData.monthlyUsd * billingMultiplier[billingCycle];
  const discountPercent = billingDiscount[billingCycle];

  const discountedAmountRaw = Number(
    (baseAmount - baseAmount * (discountPercent / 100)).toFixed(2)
  );

  const couponDiscountPercent =
    couponApplied && appliedCoupon ? appliedCoupon.discount : 0;

  const amountAfterCoupon = Number(
    (
      discountedAmountRaw -
      discountedAmountRaw * (couponDiscountPercent / 100)
    ).toFixed(2)
  );

  const finalAmount = Math.max(
    0,
    usePoints
      ? Number((amountAfterCoupon - pointsBalance).toFixed(2))
      : amountAfterCoupon
  );

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const uploadScreenshot = async () => {
    if (!screenshotFile) return null;

    try {
      console.log("Original file size:", screenshotFile.size / 1024, "KB");

      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(screenshotFile, options);

      console.log("Compressed size:", compressedFile.size / 1024, "KB");

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        console.error("Cloudinary error:", data);
        throw new Error(data?.error?.message || "Upload failed");
      }

      console.log("Uploaded URL:", data.secure_url);

      return data.secure_url as string;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Screenshot upload failed");
    }
  };

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not found");
      if (!selectedPlan) throw new Error("Please select a plan");

      if (!screenshotFile && finalAmount > 0) {
        throw new Error("Payment screenshot is required");
      }

      const months = billingMultiplier[billingCycle];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + months);

      let screenshotUrl: string | null = null;

      if (finalAmount > 0) {
        screenshotUrl = await uploadScreenshot();
      }

      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        amount: finalAmount,
        amount_inr: Math.round(finalAmount * inrRate),
        method: usePoints && finalAmount === 0 ? "points" : paymentMethod,
        transaction_id: transactionId || "",
        screenshot_url: screenshotUrl,
        status: finalAmount === 0 ? "approved" : "pending",
        requested_plan: selectedPlan,
        billing_cycle: billingCycle,
        expires_at: expiryDate.toISOString(),
        coupon_code: couponApplied && appliedCoupon ? appliedCoupon.code : null,
      });

      if (error) throw error;

      if (finalAmount === 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            plan: selectedPlan,
            plan_expires_at: expiryDate.toISOString(),
          })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-payments", user?.id] });
      toast.success(
        finalAmount === 0
          ? "Plan activated successfully."
          : "Payment submitted. Waiting for approval."
      );
      navigate("/app/settings");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit payment");
    },
  });

  const applyCoupon = () => {
    setCouponError(null);
    setCouponApplied(false);
    setAppliedCoupon(null);

    const entered = couponCode.trim().toUpperCase();

    if (!entered) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const matched = envCoupons.find(
      (coupon) => coupon.code.toUpperCase() === entered
    );

    if (!matched) {
      setCouponError("Invalid or inactive coupon code.");
      return;
    }

    setAppliedCoupon({
      code: matched.code,
      discount: matched.discount,
    });
    setCouponApplied(true);
    toast.success("Coupon applied");
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponCode("");
    setCouponError(null);
    setAppliedCoupon(null);
  };

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/app/settings")}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to settings
          </button>
          <h1 className="text-3xl font-bold">Upgrade Plan</h1>
          <p className="text-muted-foreground mt-1">
            Choose a plan and unlock more trading power.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="font-semibold capitalize">{currentPlan}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {basePlans.map((plan) => {
          const Icon = plan.icon;
          const active = selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`h-full cursor-pointer transition-all ${
                  active ? "border-primary shadow-md" : "border-border"
                } ${plan.highlight ? "ring-1 ring-primary/30" : ""}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {plan.highlight && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Popular
                      </span>
                    )}
                  </div>

                  <CardTitle className="mt-3">{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">${plan.monthlyUsd}</span>
                    <span className="text-sm text-muted-foreground"> / month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <BadgeCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Billing options</CardTitle>
            <CardDescription>
              Select duration, payment method, and coupon.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Duration
              </label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 month</SelectItem>
                  <SelectItem value="3m">3 months</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Payment method
              </label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="crypto">Crypto wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "upi" && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-medium">UPI payment</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground break-all">
                    {paymentConfig.upiId}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(paymentConfig.upiId, "UPI ID")}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium">Bank transfer details</p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Bank</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{paymentConfig.bankName}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.bankName, "Bank name")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>Account no.</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{paymentConfig.bankAccount}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyText(paymentConfig.bankAccount, "Account number")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>IFSC</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{paymentConfig.bankIfsc}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.bankIfsc, "IFSC")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "crypto" && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium">
                  Crypto payment details ({paymentConfig.walletName})
                </p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>ETH</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground break-all text-right">
                        {paymentConfig.eth}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.eth, "ETH address")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>BTC</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground break-all text-right">
                        {paymentConfig.btc}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.btc, "BTC address")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>LTC</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground break-all text-right">
                        {paymentConfig.ltc}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.ltc, "LTC address")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span>USDT</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground break-all text-right">
                        {paymentConfig.usdt}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(paymentConfig.usdt, "USDT address")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    USDT supports all networks for now. Replace with exact network addresses later.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Transaction ID / Reference
              </label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter payment reference"
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Payment screenshot {finalAmount > 0 && <span className="text-destructive">*</span>}
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 cursor-pointer hover:bg-accent/40 transition-colors">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {screenshotFile ? screenshotFile.name : "Upload screenshot"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
              />
              Use reward points (${pointsBalance.toFixed(2)} available)
            </label>

            <Card className="bg-muted/50 border border-border mt-4">
              <CardHeader className="p-3">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowCouponBox((b) => !b)}
                >
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Coupons
                  </span>
                </div>
              </CardHeader>

              {showCouponBox && (
                <CardContent className="p-3 pt-0 space-y-3">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />

                  <div className="flex gap-2 items-center flex-wrap">
                    {!couponApplied ? (
                      <Button size="sm" variant="outline" onClick={applyCoupon}>
                        Apply
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={removeCoupon}>
                        Remove
                      </Button>
                    )}

                    {couponError && (
                      <p className="text-xs text-destructive">{couponError}</p>
                    )}
                  </div>
                </CardContent>
              )}

              <CardFooter className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  {couponApplied && appliedCoupon
                    ? `Coupon ${appliedCoupon.code} applied (${appliedCoupon.discount}% off).`
                    : "Click to open coupon box and apply a discount code."}
                </p>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>
              Review your final amount before submitting.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected plan</span>
              <span className="font-medium">{selectedPlanData.name}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">
                {billingCycle === "1m" && "1 month"}
                {billingCycle === "3m" && "3 months"}
                {billingCycle === "6m" && "6 months"}
                {billingCycle === "1y" && "1 year"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium capitalize">{paymentMethod}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base amount</span>
              <span>${baseAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plan discount</span>
              <span>{discountPercent}%</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">After plan discount</span>
              <span>${discountedAmountRaw.toFixed(2)}</span>
            </div>

            {couponApplied && appliedCoupon && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Coupon ({appliedCoupon.code})
                  </span>
                  <span>{appliedCoupon.discount}%</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">After coupon</span>
                  <span>${amountAfterCoupon.toFixed(2)}</span>
                </div>
              </>
            )}

            {usePoints && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Points applied</span>
                <span>- ${Math.min(pointsBalance, amountAfterCoupon).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="font-semibold">Final amount</span>
              <div className="text-right">
                <p className="text-xl font-bold">${finalAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ₹{Math.round(finalAmount * inrRate)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-sm text-muted-foreground">
              {selectedPlan === "basic" && (
                <p>
                  Basic unlocks tools, prop firms, news, 80 trades, 3 accounts, and analytics up to the last 100 trades.
                </p>
              )}

              {selectedPlan === "standard" && (
                <p>
                  Standard unlocks payout tracker, downloads, advanced analytics, 170 trades, and up to 7 accounts.
                </p>
              )}

              {selectedPlan === "elite" && (
                <p>
                  Elite removes limits and unlocks unlimited accounts, unlimited trades, full analytics, payout tools, downloads, and AI insights.
                </p>
              )}
            </div>

            <Button
              onClick={() => submitPayment.mutate()}
              disabled={submitPayment.isPending}
              className="w-full bg-primary text-primary-foreground"
            >
              {submitPayment.isPending ? "Submitting..." : "Submit Upgrade Request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradePage;