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
  ChevronRight,
  LineChart,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hideProfit, setHideProfit] = useState(false);
  const [hideAccounts, setHideAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

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
      icon: Briefcase,
      color: "text-primary",
    },
  ];

  const recentTrades = trades.slice(0, 15);

  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const selectedAccountTrades = useMemo(() => {
    if (!selectedAccountId) return [];
    return trades.filter((t: any) => t.account_id === selectedAccountId);
  }, [trades, selectedAccountId]);

  const accountMetrics = useMemo(() => {
    const accountTrades = selectedAccountTrades;
    const total = accountTrades.length;
    const wins = accountTrades.filter((t: any) => t.result === "win").length;
    const losses = accountTrades.filter((t: any) => t.result === "loss").length;
    const pnl = accountTrades.reduce((sum: number, t: any) => sum + Number(t.pnl_amount || 0), 0);
    const avg = total > 0 ? pnl / total : 0;

    const bestTrade =
      total > 0
        ? Math.max(...accountTrades.map((t: any) => Number(t.pnl_amount || 0)))
        : 0;

    const worstTrade =
      total > 0
        ? Math.min(...accountTrades.map((t: any) => Number(t.pnl_amount || 0)))
        : 0;

    const followPlan = accountTrades.filter((t: any) => t.follow_plan).length;
    const followPlanRate = total > 0 ? ((followPlan / total) * 100).toFixed(0) : "0";
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";

    const latestFive = accountTrades.slice(0, 5);
    const latestPnl = latestFive.reduce(
      (sum: number, t: any) => sum + Number(t.pnl_amount || 0),
      0
    );

    return {
      total,
      wins,
      losses,
      pnl,
      avg,
      bestTrade,
      worstTrade,
      followPlanRate,
      winRate,
      latestPnl,
    };
  }, [selectedAccountTrades]);

  const selectedRecentTrades = selectedAccountTrades.slice(0, 5);

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
            className="rounded-lg bg-card p-4 card-glow transition-all duration-300 hover:bg-card/80"
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
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Accounts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc, i) => {
                const initialBalance = Number(acc.initial_balance || 0);
                const currentBalance = Number(acc.current_balance || 0);
                const pnl = currentBalance - initialBalance;
                const pnlPercent =
                  initialBalance > 0 ? ((pnl / initialBalance) * 100).toFixed(1) : "0";

                const isSelected = selectedAccountId === acc.id;

                return (
                  <motion.div
                    key={acc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`rounded-lg bg-card p-5 cursor-pointer transition-all duration-300 group ${
                      isSelected
                        ? "ring-1 ring-primary bg-card/90"
                        : "hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        {acc.name}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] uppercase tracking-wider text-primary">
                          Selected
                        </span>
                      )}
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

            {selectedAccount && (
              <div className="rounded-lg bg-card p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Account Report</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAccount.name} performance snapshot
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/app/analytics?account=${selectedAccount.id}`)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
                  >
                    <LineChart className="h-4 w-4" />
                    View Full Analytics
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Trades
                    </div>
                    <div className="mt-2 text-lg font-mono font-bold">
                      {accountMetrics.total}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Win Rate
                    </div>
                    <div className="mt-2 text-lg font-mono font-bold">
                      {accountMetrics.winRate}%
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Net P&L
                    </div>
                    <div
                      className={`mt-2 text-lg font-mono font-bold ${
                        accountMetrics.pnl >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {hideProfit ? "•••••" : `$${accountMetrics.pnl.toFixed(2)}`}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Discipline
                    </div>
                    <div className="mt-2 text-lg font-mono font-bold">
                      {accountMetrics.followPlanRate}%
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Best Trade
                    </div>
                    <div className="mt-2 text-lg font-mono font-bold text-success">
                      {hideProfit ? "•••••" : `$${accountMetrics.bestTrade.toFixed(2)}`}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Worst Trade
                    </div>
                    <div className="mt-2 text-lg font-mono font-bold text-destructive">
                      {hideProfit ? "•••••" : `$${accountMetrics.worstTrade.toFixed(2)}`}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Avg Trade
                    </div>
                    <div
                      className={`mt-2 text-lg font-mono font-bold ${
                        accountMetrics.avg >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {hideProfit ? "•••••" : `$${accountMetrics.avg.toFixed(2)}`}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Last 5 Trades
                    </div>
                    <div
                      className={`mt-2 text-lg font-mono font-bold ${
                        accountMetrics.latestPnl >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {hideProfit ? "•••••" : `$${accountMetrics.latestPnl.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-background overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-4">
                    <h4 className="text-sm font-semibold">Recent Trades for Account</h4>
                    <span className="text-xs text-muted-foreground">
                      {selectedRecentTrades.length} shown
                    </span>
                  </div>

                  {selectedRecentTrades.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3">Date</th>
                          <th className="text-left px-4 py-3">Pair</th>
                          <th className="text-left px-4 py-3">Result</th>
                          <th className="text-right px-4 py-3">P&L</th>
                          <th className="text-center px-4 py-3">Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecentTrades.map((trade: any) => (
                          <tr
                            key={trade.id}
                            className="hover:bg-muted/5 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs">
                              {format(new Date(trade.created_at), "MMM dd, HH:mm")}
                            </td>

                            <td className="px-4 py-3 font-mono text-xs">
                              {trade.pair || "—"}
                            </td>

                            <td className="px-4 py-3">
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
                              className={`px-4 py-3 text-right font-mono ${
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

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-xs font-medium ${
                                  trade.follow_plan
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {trade.follow_plan ? "✓" : "✗"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      No trades found for this account.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Trades</h2>

        {recentTrades.length > 0 ? (
          <div className="rounded-lg bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-4">Date</th>
                  <th className="text-left px-4 py-4">Pair</th>
                  <th className="text-left px-4 py-4">Result</th>
                  <th className="text-right px-4 py-4">P&L</th>
                  <th className="text-center px-4 py-4">Plan</th>
                </tr>
              </thead>

              <tbody>
                {recentTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono text-xs">
                      {format(new Date(trade.created_at), "MMM dd, HH:mm")}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs">
                      {trade.pair || "—"}
                    </td>

                    <td className="px-4 py-4">
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
                      className={`px-4 py-4 text-right font-mono ${
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

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-xs font-medium ${
                          trade.follow_plan
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trade.follow_plan ? "✓" : "✗"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg bg-card p-8 card-glow text-center">
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