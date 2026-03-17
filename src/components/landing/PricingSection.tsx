import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    trades: "20 trades",
    features: ["Trade Journaling", "1 Account", "Basic Analytics", "Risk Calculator"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    trades: "100 trades",
    features: ["Everything in Free", "5 Accounts", "Divine Score", "Tag Insights", "Weekly Summary", "Export to Excel"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Pro+",
    price: "₹999",
    period: "/month",
    trades: "Unlimited trades",
    features: ["Everything in Pro", "Unlimited Accounts", "Priority Support", "AI Insights (Soon)", "Psychology Tracking (Soon)"],
    cta: "Go Pro+",
    highlight: false,
  },
];

export const PricingSection = () => {
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
          <p className="text-muted-foreground text-lg">No hidden fees. Upgrade when you're ready.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
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
              <div className="mb-1">
                <span className="font-mono text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm text-primary font-mono mb-6">{plan.trades}</p>
              <ul className="space-y-3 mb-8">
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
