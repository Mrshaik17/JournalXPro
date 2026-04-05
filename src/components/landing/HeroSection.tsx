import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Shield, TrendingUp } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--muted-foreground)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--muted-foreground)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Main glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(187_100%_50%/0.08),transparent_70%)]" />

      {/* Top glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Side glows */}
      <div className="absolute left-0 top-1/3 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-0 bottom-1/4 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative z-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-lg">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Built for disciplined forex, crypto & prop firm traders
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            Trade Less.
            <br />
            <span className="text-foreground">Trade Better.</span>
            <br />
            <span className="text-gradient drop-shadow-[0_0_20px_rgba(0,255,255,0.15)]">
              Master Discipline.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            JournalXPro helps traders replace messy spreadsheets and handwritten notes
            with a clean, structured system for journaling, analytics, discipline tracking,
            and long-term growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base shadow-lg shadow-primary/20"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-card px-8 h-12 text-base"
              >
                See Features
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          {[
            {
              icon: BarChart3,
              label: "Trade Journaling",
              value: "10s",
              sub: "Fast logging",
            },
            {
              icon: TrendingUp,
              label: "Real-time P&L",
              value: "Live",
              sub: "Instant tracking",
            },
            {
              icon: Shield,
              label: "JournalX Score",
              value: "100%",
              sub: "Discipline focused",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
            >
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-mono text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">{stat.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};