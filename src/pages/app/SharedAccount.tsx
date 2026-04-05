import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { TrendingUp, Target, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

const SharedAccount = () => {
  const { token } = useParams<{ token: string }>();

  const { data: account, isLoading } = useQuery({
    queryKey: ["shared-account", token],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("share_token", token!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["shared-account-trades", account?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").eq("account_id", account!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!account,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><p>Loading...</p></div>;
  if (!account) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><p className="text-muted-foreground">Account not found or link expired.</p></div>;

  const pnl = Number(account.current_balance) - Number(account.initial_balance);
  const pnlPercent = Number(account.initial_balance) > 0 ? ((pnl / Number(account.initial_balance)) * 100).toFixed(1) : "0";
  const wins = trades.filter(t => t.result === "win").length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : "0";
  const totalLots = trades.reduce((s, t) => s + (Number(t.lot_size) || 0), 0);
  const profitTrades = trades.filter(t => Number(t.pnl_amount) > 0);
  const lossTrades = trades.filter(t => Number(t.pnl_amount) < 0);
  const avgProfit = profitTrades.length > 0 ? profitTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / profitTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / lossTrades.length) : 0;

  let eq = Number(account.initial_balance);
  const sortedTrades = [...trades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const eqData = sortedTrades.map(t => { eq += Number(t.pnl_amount); return { date: format(new Date(t.created_at), "MMM dd"), equity: eq }; });

  const stats = [
    { label: "Balance", value: `$${Number(account.current_balance).toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "P&L", value: `${pnl >= 0 ? "+" : ""}${pnlPercent}%`, icon: BarChart3, color: pnl >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-primary" },
    { label: "Trades", value: String(trades.length), icon: BarChart3, color: "text-muted-foreground" },
    { label: "Total Lots", value: totalLots.toFixed(2), icon: Activity, color: "text-primary" },
    { label: "Avg Profit", value: `$${avgProfit.toFixed(2)}`, icon: TrendingUp, color: "text-green-400" },
    { label: "Avg Loss", value: `$${avgLoss.toFixed(2)}`, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-sm text-muted-foreground">Shared Account — Read Only</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">JournalXPro</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <div className="font-mono text-lg font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {eqData.length > 1 && (
        <div className="rounded-lg border border-border bg-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eqData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Trade History</h2>
        {trades.length > 0 ? (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-3">Date</th><th className="text-left p-3">Pair</th><th className="text-left p-3">Result</th><th className="text-right p-3">P&L</th><th className="text-center p-3">Plan</th>
              </tr></thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{format(new Date(t.created_at), "MMM dd, HH:mm")}</td>
                    <td className="p-3 font-mono text-xs">{t.pair || "—"}</td>
                    <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.result === "win" ? "bg-green-500/10 text-green-400" : t.result === "loss" ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"}`}>{t.result}</span></td>
                    <td className={`p-3 text-right font-mono ${Number(t.pnl_amount) >= 0 ? "text-green-400" : "text-red-400"}`}>{Number(t.pnl_amount) >= 0 ? "+" : ""}${Number(t.pnl_amount).toFixed(2)}</td>
                    <td className="p-3 text-center">{t.follow_plan ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No trades for this account.</p>
          </div>
        )}
      </div>

      <div className="text-center mt-8 text-xs text-muted-foreground">
        Powered by <span className="text-primary font-semibold">JournalXPro</span>
      </div>
    </div>
  );
};

export default SharedAccount;
