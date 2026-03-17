import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Target, BarChart3, Activity } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === "win").length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";
  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl_amount), 0);
  const followPlanTrades = trades.filter((t) => t.follow_plan).length;
  const divineScore = totalTrades > 0 ? ((followPlanTrades / totalTrades) * 100).toFixed(0) : "—";

  const stats = [
    { label: "Total Trades", value: String(totalTrades), icon: BarChart3, color: "text-primary" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-primary" },
    { label: "Total P&L", value: `$${totalPnl.toFixed(2)}`, icon: TrendingUp, color: totalPnl >= 0 ? "text-success" : "text-destructive" },
    { label: "Divine Score", value: divineScore === "—" ? "—" : `${divineScore}%`, icon: Activity, color: Number(divineScore) >= 90 ? "text-primary" : Number(divineScore) < 50 ? "text-destructive" : "text-muted-foreground" },
  ];

  const recentTrades = trades.slice(0, 5);

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

      {/* Account Cards */}
      {accounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const pnl = Number(acc.current_balance) - Number(acc.initial_balance);
              const pnlPercent = Number(acc.initial_balance) > 0 ? ((pnl / Number(acc.initial_balance)) * 100).toFixed(1) : "0";
              return (
                <div key={acc.id} className="rounded-lg border border-border bg-card p-5 card-glow">
                  <div className="text-sm text-muted-foreground mb-1">{acc.name}</div>
                  <div className="font-mono text-xl font-bold">${Number(acc.current_balance).toFixed(2)}</div>
                  <div className={`font-mono text-sm mt-1 ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {pnl >= 0 ? "+" : ""}{pnlPercent}% (${pnl.toFixed(2)})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Trades</h2>
        {recentTrades.length > 0 ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Result</th>
                  <th className="text-right p-3">P&L</th>
                  <th className="text-center p-3">Plan</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{format(new Date(trade.created_at), "MMM dd, HH:mm")}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        trade.result === "win" ? "bg-success/10 text-success" :
                        trade.result === "loss" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{trade.result}</span>
                    </td>
                    <td className={`p-3 text-right font-mono ${Number(trade.pnl_amount) >= 0 ? "text-success" : "text-destructive"}`}>
                      {Number(trade.pnl_amount) >= 0 ? "+" : ""}${Number(trade.pnl_amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">{trade.follow_plan ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
            <p className="text-muted-foreground text-sm">No trades found. The best trade is sometimes no trade.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
