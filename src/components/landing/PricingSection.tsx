import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PricingSection = () => {
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

  const proPriceUsd = pricing.pro || 4;
  const proPlusPriceUsd = pricing.pro_plus || 7;
  const elitePriceUsd = pricing.elite || 10;

  const plans = [
    {
      name: "Free",
      priceInr: 0,
      priceUsd: 0,
      period: "forever",
      yearlyInr: 0,
      trades: "15 trades/month",
      features: ["1 Account", "Basic Analytics", "Risk Calculator", "30-day data retention"],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Basic",
      priceInr: Math.round(proPriceUsd * inrRate),
      priceUsd: proPriceUsd,
      period: "/month",
      yearlyInr: Math.round(proPriceUsd * inrRate * 12 * 0.80),
      trades: "70 trades/month",
      features: ["3 Accounts", "JournalX Score", "Tag Insights", "Export to Excel", "Download enabled", "1-year data retention"],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Standard",
      priceInr: Math.round(proPlusPriceUsd * inrRate),
      priceUsd: proPlusPriceUsd,
      period: "/month",
      yearlyInr: Math.round(proPlusPriceUsd * inrRate * 12 * 0.80),
      trades: "150 trades + MT5 Sync",
      features: ["7 Accounts", "Everything in Basic", "MT5 Auto Sync (50)", "AI Insights", "Payout Tracker", "Priority Support"],
      cta: "Upgrade Now",
      highlight: true,
    },
    {
      name: "Elite",
      priceInr: Math.round(elitePriceUsd * inrRate),
      priceUsd: elitePriceUsd,
      period: "/month",
      yearlyInr: Math.round(elitePriceUsd * inrRate * 12 * 0.80),
      trades: "Unlimited + AI",
      features: ["10 Accounts", "Everything in Standard", "Unlimited MT5 Sync", "AI Trade Analysis", "Prop Firm Tracker", "Monthly Reports"],
      cta: "Go Elite",
      highlight: false,
    },
  ];

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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground text-lg">No hidden fees. Pay in USD or INR. Save ~15% with yearly plans.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-lg border p-6 ${
                plan.highlight
                  ? "border-primary/30 bg-card divine-glow"
                  : "border-border bg-card card-glow"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <div className="mb-0.5">
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
                <p className="text-xs text-muted-foreground font-mono mb-0.5">≈ ${plan.priceUsd}/mo</p>
              )}
              {plan.yearlyInr > 0 && (
                <p className="text-xs text-primary font-mono mb-1">₹{plan.yearlyInr}/year</p>
              )}
              <p className="text-sm text-primary font-mono mb-5">{plan.trades}</p>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
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
