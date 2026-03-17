import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

const stats = [
  { label: "Total Trades", value: "0", icon: BarChart3, color: "text-primary" },
  { label: "Win Rate", value: "0%", icon: Target, color: "text-primary" },
  { label: "Total P&L", value: "$0.00", icon: TrendingUp, color: "text-success" },
  { label: "Divine Score", value: "—", icon: Target, color: "text-primary" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your trading overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg border border-border bg-card p-5 card-glow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="font-mono text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
        <p className="text-muted-foreground text-sm">No trades found. The best trade is sometimes no trade.</p>
      </div>
    </div>
  );
};

export default Dashboard;
