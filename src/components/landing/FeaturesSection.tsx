import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  PlayCircle,
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
    badge: "Coming Soon",
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

const tutorialSteps = [
  {
    title: "Create Your Account Or Login",
    desc: "Sign up in seconds and get instant access to your trading dashboard.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/1_tcdnp0.png",
  },
  {
    title: "Add Your Trading Account",
    desc: "Connect your broker or prop firm account to start tracking performance.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/2_aqqcrw.png",
  },
  {
    title: "Log Your First Trade",
    desc: "Enter your trade details manually with setup, entry, stop loss, and result.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/3_k3cbdw.png",
  },
  {
    title: "Upload Trade Screenshots",
    desc: "Attach before and after screenshots to review execution quality later.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/4_tjxjox.png",
  },
  {
    title: "Track Discipline Score",
    desc: "See how well you follow your rules using your JournalX discipline score.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/5_jukfpw.png",
  },
  {
    title: "View Analytics",
    desc: "Understand your win rate, risk patterns, drawdown, and consistency.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197031/6_j8hfqk.png",
  },
  {
    title: "Use Trading Tools",
    desc: "Calculate risk, lot size, pips, and position values with built-in tools.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197030/7_udxvgr.png",
  },
  {
    title: "Monitor Payouts",
    desc: "Keep track of funded profits, withdrawals, and payout history clearly.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197030/8_uqs3ug.png",
  },
  {
    title: "Share With Mentor",
    desc: "Give selected access to your mentor or team for better review and feedback.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197030/9_n2efmr.png",
  },
  {
    title: "Improve With Insights",
    desc: "Use patterns and insights to refine discipline and performance over time.",
    image: "https://res.cloudinary.com/dmaeiz7zo/image/upload/v1777197030/10_thyqns.png",
  },
];

export const FeaturesSection = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % tutorialSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + tutorialSteps.length) % tutorialSteps.length);
  };

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for traders who value precision, discipline, and growth above all.
          </p>
        </motion.div>

        {/* Tutorial Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-mono uppercase tracking-wider text-primary mb-4">
              <PlayCircle className="h-4 w-4 mr-2" />
              Tutorial
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">How To Start</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click through the steps and learn how to use JournalXPro from the start.
            </p>
          </div>

          <div className="w-full">
            <div className="w-full rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
                <div className="relative bg-black/40 flex items-center justify-center">
  <AnimatePresence mode="wait">
    <motion.img
      key={tutorialSteps[currentStep].image}
      src={tutorialSteps[currentStep].image}
      alt={tutorialSteps[currentStep].title}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="h-full w-full object-contain"
    />
  </AnimatePresence>

  <div className="absolute top-4 left-4">
    <span className="inline-flex items-center rounded-full bg-black/60 text-white px-3 py-1 text-xs font-mono uppercase tracking-wider backdrop-blur-sm">
      Step {currentStep + 1} / {tutorialSteps.length}
    </span>
  </div>
</div>

                <div className="flex flex-col justify-between p-6 md:p-8 lg:p-10">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary mb-5">
                      Tutorial Step {currentStep + 1}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tutorialSteps[currentStep].title}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <h4 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                          {tutorialSteps[currentStep].title}
                        </h4>
                        <p className="text-muted-foreground leading-7 text-sm md:text-base max-w-lg">
                          {tutorialSteps[currentStep].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-10">
                    <div className="flex items-center gap-2 flex-wrap mb-6">
                      {tutorialSteps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`h-9 min-w-[36px] px-3 rounded-full text-xs font-semibold transition-all duration-200 border ${
                            currentStep === index
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                          }`}
                          aria-label={`Go to tutorial step ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={prevStep}
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-[0.98]"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </button>

                      <button
                        onClick={nextStep}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
                {/* Core Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
          {coreFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative rounded-2xl border border-border bg-card p-6 card-glow hover:divine-border transition-all duration-300"
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {feature.badge}
                </span>
              )}

              <feature.icon className="h-5 w-5 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
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
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute top-0 right-0 h-28 w-28 bg-primary/10 blur-3xl rounded-full" />

                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary mb-5">
                  {feature.badge}
                </span>

                <feature.icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-7">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coming Soon Suspense Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Why Choose Us?
          </h3>
          <p className="text-center text-muted-foreground mb-8">
            Starting at just <span className="text-primary font-bold">₹400/$4</span>/month
            vs others charging{" "}
            <span className="text-destructive line-through font-bold">₹2000+</span>
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
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
                  <td className="p-4 text-center font-bold text-primary">₹400</td>
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

        