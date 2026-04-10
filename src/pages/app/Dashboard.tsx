import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  Wallet,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hideProfit, setHideProfit] = useState(false);
  const [hideAccounts, setHideAccounts] = useState(false);

  const { data: trades = [] } = useQuery({
    queryKey: ["dashboard-trades", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["dashboard-accounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("firebase_uid", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";
  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl_amount || 0), 0);
  const followPlanTrades = trades.filter((t) => t.follow_plan).length;
  const divineScore = totalTrades > 0 ? ((followPlanTrades / totalTrades) * 100).toFixed(0) : "—";

  const profitTrades = trades.filter((t) => Number(t.pnl_amount) > 0);
  const avgProfit =
    profitTrades.length > 0
      ? profitTrades.reduce((s, t) => s + Number(t.pnl_amount || 0), 0) / profitTrades.length
      : 0;
  const maxProfit =
    profitTrades.length > 0
      ? Math.max(...profitTrades.map((t) => Number(t.pnl_amount || 0)))
      : 0;
  const lossTrades = trades.filter((t) => Number(t.pnl_amount) < 0);
  const maxLoss =
    lossTrades.length > 0
      ? Math.min(...lossTrades.map((t) => Number(t.pnl_amount || 0)))
      : 0;
  const avgTrade = totalTrades > 0 ? totalPnl / totalTrades : 0;

  const stats = [
    {
      label: "Total Trades",
      value: String(totalTrades),
      icon: BarChart3,
      color: "text-primary",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Total P&L",
      value: hideProfit ? "•••••" : `$${totalPnl.toFixed(2)}`,
      icon: TrendingUp,
      color: totalPnl >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Divine Score",
      value: divineScore === "—" ? "—" : `${divineScore}%`,
      icon: Activity,
      color:
        divineScore === "—"
          ? "text-muted-foreground"
          : Number(divineScore) >= 90
          ? "text-primary"
          : Number(divineScore) < 50
          ? "text-destructive"
          : "text-muted-foreground",
    },
    {
      label: "Avg Profit",
      value: hideProfit ? "•••••" : `$${avgProfit.toFixed(2)}`,
      icon: ArrowUpRight,
      color: "text-success",
    },
    {
      label: "Max Profit",
      value: hideProfit ? "•••••" : `$${maxProfit.toFixed(2)}`,
      icon: ArrowUpRight,
      color: "text-success",
    },
    {
      label: "Max Loss",
      value: hideProfit ? "•••••" : `$${maxLoss.toFixed(2)}`,
      icon: ArrowDownRight,
      color: "text-destructive",
    },
    {
      label: "Avg Trade",
      value: hideProfit ? "•••••" : `$${avgTrade.toFixed(2)}`,
      icon: Wallet,
      color: avgTrade >= 0 ? "text-primary" : "text-destructive",
    },
    {
      label: "Total Accounts",
      value: hideAccounts ? "•••" : String(accounts.length),
      icon: Wallet,
      color: "text-primary",
    },
  ];

  const recentTrades = trades.slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your trading overview</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideProfit(!hideProfit)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-card"
            title="Toggle profit visibility"
          >
            {hideProfit ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setHideAccounts(!hideAccounts)}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-card"
            title="Toggle accounts visibility"
          >
            <Wallet className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-lg border border-border bg-card p-4 card-glow hover:divine-border transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </div>
            <div className="font-mono text-lg font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {!hideAccounts && accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Accounts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc, i) => {
                const initialBalance = Number(acc.initial_balance || 0);
                const currentBalance = Number(acc.current_balance || 0);
                const pnl = currentBalance - initialBalance;
                const pnlPercent =
                  initialBalance > 0 ? ((pnl / initialBalance) * 100).toFixed(1) : "0";

                return (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/accounts?view=${acc.id}`)}
                    className="rounded-lg border border-border bg-card p-5 card-glow cursor-pointer hover:divine-border transition-all duration-300 group"
                  >
                    <div className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                      {acc.name}
                    </div>

                    <div className="font-mono text-xl font-bold">
                      {hideProfit ? "•••••" : `$${currentBalance.toFixed(2)}`}
                    </div>

                    <div
                      className={`font-mono text-sm mt-1 ${
                        pnl >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {hideProfit
                        ? "•••"
                        : `${pnl >= 0 ? "+" : ""}${pnlPercent}% ($${pnl.toFixed(2)})`}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Trades</h2>

        {recentTrades.length > 0 ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Pair</th>
                  <th className="text-left p-3">Result</th>
                  <th className="text-right p-3">P&L</th>
                  <th className="text-center p-3">Plan</th>
                </tr>
              </thead>

              <tbody>
                {recentTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs">
                      {format(new Date(trade.created_at), "MMM dd, HH:mm")}
                    </td>

                    <td className="p-3 font-mono text-xs">{trade.pair || "—"}</td>

                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trade.result === "win"
                            ? "bg-success/10 text-success"
                            : trade.result === "loss"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trade.result}
                      </span>
                    </td>

                    <td
                      className={`p-3 text-right font-mono ${
                        hideProfit
                          ? ""
                          : Number(trade.pnl_amount) >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {hideProfit
                        ? "•••"
                        : `${Number(trade.pnl_amount) >= 0 ? "+" : ""}$${Number(
                            trade.pnl_amount || 0
                          ).toFixed(2)}`}
                    </td>

                    <td className="p-3 text-center">{trade.follow_plan ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
            <p className="text-muted-foreground text-sm">
              No trades found. The best trade is sometimes no trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;