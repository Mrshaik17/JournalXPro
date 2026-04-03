import { motion } from "framer-motion";
import {
  BookOpen, Wallet, Target, BarChart3, Calculator,
  Building2, History, Coins, Link2, Brain, Check, X
} from "lucide-react";

const features = [
  { icon: BookOpen, title: "Trade Journaling", desc: "Log trades in under 10 seconds with photos, custom fields, and full analytics.", badge: null },
  { icon: Wallet, title: "Account Tracking", desc: "Multiple accounts with real-time balance updates. Prop firm & broker support.", badge: null },
  { icon: Target, title: "JournalX Score", desc: "Measure discipline, not just profit. Your plan adherence & consistency score.", badge: null },
  { icon: BarChart3, title: "Analytics", desc: "Win rate, P&L curves, drawdown metrics, AI insights. Tiered by plan.", badge: null },
  { icon: Calculator, title: "Trading Tools", desc: "Universal pip, lot size, risk & consistency calculators built in.", badge: null },
  { icon: Building2, title: "Prop Firms", desc: "Quick access to top prop firm programs and consistency tracking.", badge: null },
  { icon: Link2, title: "MT5 Auto Sync", desc: "Connect your MT5 account and auto-sync trades instantly.", badge: "Pro+" },
  { icon: Brain, title: "AI Insights", desc: "AI-powered analysis: best hours, streak detection, discipline scoring.", badge: "Elite" },
  { icon: History, title: "Backtesting Tool", desc: "Test strategies against historical data.", badge: "Coming Soon" },
  { icon: Coins, title: "Crypto Payments", desc: "Pay with cryptocurrency for your subscription.", badge: null },
];

const comparisonRows = [
  { feature: "Trade Journaling", us: true, them: true },
  { feature: "Multiple Accounts", us: true, them: true },
  { feature: "JournalX Score (Discipline)", us: true, them: false },
  { feature: "Custom Fields", us: true, them: false },
  { feature: "MT5 Auto Sync", us: true, them: true },
  { feature: "AI Trade Analysis", us: true, them: true },
  { feature: "Screenshot Uploads (2/trade)", us: true, them: false },
  { feature: "Indian Payment (UPI)", us: true, them: false },
  { feature: "Affordable Pricing", us: true, them: false },
  { feature: "Priority Support", us: true, them: false },
  { feature: "Prop Firm Drawdown Tracker", us: true, them: false },
  { feature: "Referral Rewards System", us: true, them: false },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-3">Why Choose Us?</h3>
          <p className="text-center text-muted-foreground mb-8">
            Starting at just <span className="text-primary font-bold">₹350/$3.5</span>/month vs Others charging <span className="text-destructive line-through font-bold">₹2000+</span>
          </p>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-muted-foreground uppercase text-xs tracking-wider">Feature</th>
                <th className="text-center p-4 text-primary font-bold uppercase text-xs tracking-wider">JournalXPro</th>
                <th className="text-center p-4 text-muted-foreground uppercase text-xs tracking-wider">Others</th>
              </tr></thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-foreground font-medium">{row.feature}</td>
                    <td className="p-4 text-center">{row.us ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-destructive mx-auto" />}</td>
                    <td className="p-4 text-center">{row.them ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : <X className="h-4 w-4 text-destructive mx-auto" />}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5">
                  <td className="p-4 font-bold text-foreground">Monthly Price</td>
                  <td className="p-4 text-center font-bold text-primary">₹350</td>
                  <td className="p-4 text-center text-muted-foreground">₹2000+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
