import { motion } from "framer-motion";
import {
  BookOpen, Wallet, Target, BarChart3, Calculator,
  Building2, History, Coins
} from "lucide-react";

const features = [
  { icon: BookOpen, title: "Trade Journaling", desc: "Log trades in under 10 seconds. PnL, result, plan adherence — all tracked.", badge: null },
  { icon: Wallet, title: "Account Tracking", desc: "Multiple accounts with real-time balance updates. Every trade counts.", badge: null },
  { icon: Target, title: "Divine Score", desc: "Measure discipline, not just profit. Your plan adherence score.", badge: null },
  { icon: BarChart3, title: "Analytics", desc: "Win rate, P&L curves, tag-based insights. Filter by account or time.", badge: null },
  { icon: Calculator, title: "Risk Calculator", desc: "Position sizing and risk management tools built in.", badge: null },
  { icon: Building2, title: "Prop Firms", desc: "Quick access to top prop firm programs and requirements.", badge: null },
  { icon: History, title: "Backtesting Tool", desc: "Test strategies against historical data.", badge: "Coming Soon" },
  { icon: Coins, title: "Crypto Payments", desc: "Pay with cryptocurrency for your subscription.", badge: "Coming Soon" },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for traders who value precision and discipline above all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-lg border border-border bg-card p-6 card-glow hover:divine-border transition-all duration-300"
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {feature.badge}
                </span>
              )}
              <feature.icon className="h-5 w-5 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
