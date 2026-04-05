import { motion } from "framer-motion";
import {
  BookOpen,
  Wallet,
  Target,
  BarChart3,
  Calculator,
  Building2,
  History,
  Coins,
  Link2,
  Brain,
  Check,
  X,
  Users,
  Sparkles,
  Rocket,
} from "lucide-react";

const coreFeatures = [
  {
    icon: BookOpen,
    title: "Trade Journaling",
    desc: "Log trades in under 10 seconds with photos, custom fields, and full analytics.",
    badge: null,
  },
  {
    icon: Wallet,
    title: "Account Tracking",
    desc: "Multiple accounts with real-time balance updates. Prop firm & broker support.",
    badge: null,
  },
  {
    icon: Target,
    title: "JournalX Score",
    desc: "Measure discipline, not just profit. Your plan adherence & consistency score.",
    badge: null,
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Win rate, P&L curves, drawdown metrics, AI insights. Tiered by plan.",
    badge: null,
  },
  {
    icon: Calculator,
    title: "Trading Tools",
    desc: "Universal pip, lot size, risk & consistency calculators built in.",
    badge: null,
  },
  {
    icon: Building2,
    title: "Prop Firms",
    desc: "Quick access to top prop firm programs and consistency tracking.",
    badge: null,
  },
  {
    icon: Link2,
    title: "MT5 Auto Sync",
    desc: "Connect your MT5 account and auto-sync trades instantly.",
    badge: "Pro+",
  },
  {
    icon: History,
    title: "Backtesting Tool",
    desc: "Test strategies against historical data.",
    badge: "Coming Soon",
  },
  {
    icon: Coins,
    title: "Crypto Payments",
    desc: "Pay with cryptocurrency for your subscription.",
    badge: null,
  },
];

const highlightedFeatures = [
  {
    icon: Wallet,
    title: "Payout Tracker",
    desc: "Track withdrawals, funded profits, and payout history with full clarity.",
    badge: "Premium",
  },
  {
    icon: Users,
    title: "Account Sharing",
    desc: "Share selected account access with your mentor, team, or trading partner securely.",
    badge: "Available",
  },
  {
    icon: Brain,
    title: "AI Insights",
    desc: "AI-powered analysis of best hours, streaks, discipline behavior, and performance patterns.",
    badge: "Elite",
  },
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
  { feature: "Payout Tracking", us: true, them: false },
  { feature: "Account Sharing", us: true, them: false },
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
            Built for traders who value precision, discipline, and growth above all.
          </p>
        </motion.div>

        {/* Core Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-2xl border border-border bg-card p-6 card-glow hover:divine-border transition-all duration-300"
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

        {/* Highlighted Premium Features */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Premium Highlights</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful upgrades built for traders who want deeper control, smarter insights,
              and a more professional journaling experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {highlightedFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute top-0 right-0 h-28 w-28 bg-primary/10 blur-3xl rounded-full" />
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary mb-5">
                  {feature.badge}
                </span>
                <feature.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-7">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coming Soon Suspense Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20"
        >
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-10 left-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative text-center mb-10">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-mono uppercase tracking-wider text-primary mb-4">
                Coming Soon
              </span>
              <h3 className="text-2xl md:text-4xl font-bold mb-4">
                Something Bigger Is On The Way
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-7">
                We’re building powerful systems behind the scenes to make JournalXPro far
                more than just a trading journal. The next upgrades are designed to make
                traders feel sharper, more disciplined, and more dangerous in the market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-primary/20 bg-background/60 backdrop-blur-sm p-6 md:p-8 text-center hover:border-primary/40 transition-all duration-300">
                <Sparkles className="h-7 w-7 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Secret Feature</h4>
                <p className="text-sm text-muted-foreground leading-7">
                  We can’t reveal everything yet, but this feature is being built to change
                  how traders understand their discipline and execution.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-background/60 backdrop-blur-sm p-6 md:p-8 text-center hover:border-primary/40 transition-all duration-300">
                <Rocket className="h-7 w-7 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Next-Level Trading System</h4>
                <p className="text-sm text-muted-foreground leading-7">
                  A major new system is coming that will push JournalXPro beyond ordinary
                  journaling and into a much smarter trading workflow.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-3">Why Choose Us?</h3>
          <p className="text-center text-muted-foreground mb-8">
            Starting at just <span className="text-primary font-bold">₹350/$3.5</span>/month vs Others charging{" "}
            <span className="text-destructive line-through font-bold">₹2000+</span>
          </p>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-muted-foreground uppercase text-xs tracking-wider">
                    Feature
                  </th>
                  <th className="text-center p-4 text-primary font-bold uppercase text-xs tracking-wider">
                    JournalXPro
                  </th>
                  <th className="text-center p-4 text-muted-foreground uppercase text-xs tracking-wider">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-4 text-foreground font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.us ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-destructive mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.them ? (
                        <Check className="h-4 w-4 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-destructive mx-auto" />
                      )}
                    </td>
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