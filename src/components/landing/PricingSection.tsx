import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type BillingKey = "1m" | "3m" | "6m" | "12m";

const billingOptions: {
  key: BillingKey;
  label: string;
  months: number;
  discount: number;
  badge?: string;
}[] = [
  { key: "1m", label: "1 Month", months: 1, discount: 0 },
  { key: "3m", label: "3 Months", months: 3, discount: 5 },
  { key: "6m", label: "6 Months", months: 6, discount: 10 },
  { key: "12m", label: "12 Months", months: 12, discount: 20, badge: "Best Value" },
];

export const PricingSection = () => {
  const [billing, setBilling] = useState<BillingKey>("1m");

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getSetting = (key: string): any => {
    const s = siteSettings.find((s: any) => s.key === key);
    return s?.value || {};
  };

  const pricing = getSetting("pricing");
  const inrRate = getSetting("inr_rate")?.rate || 83.5;

  const selectedBilling = billingOptions.find((b) => b.key === billing) || billingOptions[0];

  const calculatePrice = (monthlyUsd: number) => {
    const grossUsd = monthlyUsd * selectedBilling.months;
    const finalUsd = grossUsd * (1 - selectedBilling.discount / 100);
    const finalInr = Math.round(finalUsd * inrRate);

    return {
      usd: Number(finalUsd.toFixed(2)),
      inr: finalInr,
      originalUsd: Number(grossUsd.toFixed(2)),
      originalInr: Math.round(grossUsd * inrRate),
    };
  };

  const plans = useMemo(() => {
    const basicMonthlyUsd = pricing.pro || 4;
    const standardMonthlyUsd = pricing.pro_plus || 7;
    const eliteMonthlyUsd = pricing.elite || 10;

    const basicPrice = calculatePrice(basicMonthlyUsd);
    const standardPrice = calculatePrice(standardMonthlyUsd);
    const elitePrice = calculatePrice(eliteMonthlyUsd);

    const periodLabel =
      selectedBilling.months === 1
        ? "/month"
        : `/${selectedBilling.months} months`;

    return [
      {
        name: "Free",
        priceInr: 0,
        priceUsd: 0,
        originalInr: 0,
        originalUsd: 0,
        period: "forever",
        trades: "15 trades/month",
        features: [
          "1 Account",
          "Basic Analytics",
          "Risk Calculator",
          "30-day data retention",
        ],
        cta: "Start Free",
        highlight: false,
        subtext: "Perfect to get started",
      },
      {
        name: "Basic",
        priceInr: basicPrice.inr,
        priceUsd: basicPrice.usd,
        originalInr: basicPrice.originalInr,
        originalUsd: basicPrice.originalUsd,
        period: periodLabel,
        trades: "70 trades/month",
        features: [
          "3 Accounts",
          "JournalX Score",
          "Tag Insights",
          "Export to Excel",
          "Download enabled",
          "1-year data retention",
        ],
        cta: "Get Started",
        highlight: false,
        subtext: "For consistent traders",
      },
      {
        name: "Standard",
        priceInr: standardPrice.inr,
        priceUsd: standardPrice.usd,
        originalInr: standardPrice.originalInr,
        originalUsd: standardPrice.originalUsd,
        period: periodLabel,
        trades: "150 trades + MT5 Sync",
        features: [
          "7 Accounts",
          "Everything in Basic",
          "MT5 Auto Sync (50)",
          "AI Insights",
          "Payout Tracker",
          "Priority Support",
        ],
        cta: "Upgrade Now",
        highlight: true,
        subtext: "Most popular for serious traders",
      },
      {
        name: "Elite",
        priceInr: elitePrice.inr,
        priceUsd: elitePrice.usd,
        originalInr: elitePrice.originalInr,
        originalUsd: elitePrice.originalUsd,
        period: periodLabel,
        trades: "Unlimited + AI",
        features: [
          "10 Accounts",
          "Everything in Standard",
          "Unlimited MT5 Sync",
          "AI Trade Analysis",
          "Prop Firm Tracker",
          "Monthly Reports",
        ],
        cta: "Go Elite",
        highlight: false,
        subtext: "Built for advanced traders",
      },
    ];
  }, [pricing, inrRate, selectedBilling]);

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Pricing</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the billing cycle that fits you best. Pay in USD or INR and save more on longer plans.
          </p>
        </motion.div>

        {/* Billing Selector */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg">
            {billingOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setBilling(option.key)}
                className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  billing === option.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {option.label}
                {option.badge && (
                  <span className="ml-2 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {selectedBilling.discount > 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-sm text-primary font-medium mb-10"
          >
            Save {selectedBilling.discount}% with the {selectedBilling.label} plan
          </motion.p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-primary/30 bg-card divine-glow shadow-xl"
                  : "border-border bg-card card-glow"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{plan.subtext}</p>

              <div className="mb-1">
                {plan.priceInr > 0 ? (
                  <>
                    <span className="font-mono text-3xl font-bold">₹{plan.priceInr}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-3xl font-bold">Free</span>
                    <span className="text-sm text-muted-foreground"> {plan.period}</span>
                  </>
                )}
              </div>

              {plan.priceUsd > 0 && (
                <p className="text-xs text-muted-foreground font-mono mb-1">
                  ≈ ${plan.priceUsd}
                  {plan.period}
                </p>
              )}

              {plan.priceUsd > 0 && selectedBilling.discount > 0 && (
                <p className="text-xs text-muted-foreground font-mono line-through mb-1">
                  ₹{plan.originalInr} / ${plan.originalUsd}
                </p>
              )}

              <p className="text-sm text-primary font-mono mb-5">{plan.trades}</p>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link to="/login">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};