import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { TrendingUp, Target, BarChart3, Activity, Lock, AlertTriangle, Brain, Shield } from "lucide-react";
import { useState } from "react";

const Analytics = () => {
  const { user } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const plan = profile?.plan || "free";
  const isPro = plan === "pro" || plan === "pro_plus" || plan === "elite";
  const isElite = plan === "elite";

  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const breakeven = trades.filter((t) => t.result === "breakeven").length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";
  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl_amount), 0);

  // Basic metrics
  const profitTrades = trades.filter((t) => Number(t.pnl_amount) > 0);
  const lossTrades = trades.filter((t) => Number(t.pnl_amount) < 0);
  const bestTrade = profitTrades.length > 0 ? Math.max(...profitTrades.map((t) => Number(t.pnl_amount))) : 0;
  const worstTrade = lossTrades.length > 0 ? Math.min(...lossTrades.map((t) => Number(t.pnl_amount))) : 0;

  // Avg RR
  const tradesWithRR = trades.filter((t) => t.entry_price && t.stop_loss && t.take_profit);
  const avgRR = tradesWithRR.length > 0
    ? (tradesWithRR.reduce((s, t) => {
        const risk = Math.abs(Number(t.entry_price) - Number(t.stop_loss));
        const reward = Math.abs(Number(t.take_profit) - Number(t.entry_price));
        return s + (risk > 0 ? reward / risk : 0);
      }, 0) / tradesWithRR.length).toFixed(2)
    : "—";

  // Win/Loss streak
  let currentStreak = 0;
  let streakType = "";
  for (let i = trades.length - 1; i >= 0; i--) {
    const r = trades[i].result;
    if (i === trades.length - 1) { streakType = r || ""; currentStreak = 1; }
    else if (r === streakType) currentStreak++;
    else break;
  }

  // Drawdown
  let peak = 0, maxDrawdown = 0, drawdowns: number[] = [];
  let cumPnl = 0;
  trades.forEach((t) => {
    cumPnl += Number(t.pnl_amount);
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > 0) drawdowns.push(dd);
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  const avgDrawdown = drawdowns.length > 0 ? (drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length).toFixed(2) : "0";

  // Pie data
  const pieData = [
    { name: "Wins", value: wins, color: "hsl(var(--chart-2))" },
    { name: "Losses", value: losses, color: "hsl(var(--destructive))" },
    { name: "BE", value: breakeven, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  // PnL by day
  const pnlByDay: Record<string, number> = {};
  trades.forEach((t) => {
    const day = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    pnlByDay[day] = (pnlByDay[day] || 0) + Number(t.pnl_amount);
  });
  const barData = Object.entries(pnlByDay).map(([day, pnl]) => ({ day, pnl }));

  // Equity curve
  let equity = 0;
  const equityData = trades.map((t) => {
    equity += Number(t.pnl_amount);
    return { date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), equity };
  });

  // PRO: Pair performance
  const pairPerf: Record<string, { wins: number; total: number; pnl: number }> = {};
  trades.forEach((t) => {
    const pair = t.pair || "Unknown";
    if (!pairPerf[pair]) pairPerf[pair] = { wins: 0, total: 0, pnl: 0 };
    pairPerf[pair].total++;
    if (t.result === "win") pairPerf[pair].wins++;
    pairPerf[pair].pnl += Number(t.pnl_amount);
  });

  // PRO: Day performance
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayPerf: Record<string, { wins: number; total: number; pnl: number }> = {};
  trades.forEach((t) => {
    const d = dayNames[new Date(t.created_at).getDay()];
    if (!dayPerf[d]) dayPerf[d] = { wins: 0, total: 0, pnl: 0 };
    dayPerf[d].total++;
    if (t.result === "win") dayPerf[d].wins++;
    dayPerf[d].pnl += Number(t.pnl_amount);
  });
  const dayData = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => ({
    day: d,
    pnl: dayPerf[d]?.pnl || 0,
    winRate: dayPerf[d] ? ((dayPerf[d].wins / dayPerf[d].total) * 100).toFixed(0) : "0",
    trades: dayPerf[d]?.total || 0,
  }));

  // PRO: Session analysis
  const sessionPerf: Record<string, { wins: number; total: number; pnl: number }> = { London: { wins: 0, total: 0, pnl: 0 }, "New York": { wins: 0, total: 0, pnl: 0 }, Asia: { wins: 0, total: 0, pnl: 0 } };
  trades.forEach((t) => {
    if (!t.entry_time) return;
    const hour = new Date(t.entry_time).getUTCHours();
    let session = "Asia";
    if (hour >= 7 && hour < 12) session = "London";
    else if (hour >= 12 && hour < 21) session = "New York";
    sessionPerf[session].total++;
    if (t.result === "win") sessionPerf[session].wins++;
    sessionPerf[session].pnl += Number(t.pnl_amount);
  });

  // PRO: Best/worst hour
  const hourPerf: Record<number, { pnl: number; total: number }> = {};
  trades.forEach((t) => {
    if (!t.entry_time) return;
    const h = new Date(t.entry_time).getHours();
    if (!hourPerf[h]) hourPerf[h] = { pnl: 0, total: 0 };
    hourPerf[h].pnl += Number(t.pnl_amount);
    hourPerf[h].total++;
  });
  const bestHour = Object.entries(hourPerf).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstHour = Object.entries(hourPerf).sort((a, b) => a[1].pnl - b[1].pnl)[0];

  // PRO: Tag/Strategy performance
  const tagPerf: Record<string, { wins: number; total: number; pnl: number }> = {};
  trades.forEach((t) => {
    (t.tags || []).forEach((tag: string) => {
      if (!tagPerf[tag]) tagPerf[tag] = { wins: 0, total: 0, pnl: 0 };
      tagPerf[tag].total++;
      if (t.result === "win") tagPerf[tag].wins++;
      tagPerf[tag].pnl += Number(t.pnl_amount);
    });
  });

  // ELITE: Discipline score
  const followPlanRate = totalTrades > 0 ? (trades.filter((t) => t.follow_plan).length / totalTrades) * 100 : 0;
  const rrScore = avgRR !== "—" ? Math.min(Number(avgRR) * 25, 30) : 0;
  const consistencyScore = Math.min(followPlanRate * 0.4 + rrScore + (Number(winRate) > 40 ? 20 : Number(winRate) * 0.5), 100);

  // ELITE: Expectancy
  const avgWin = profitTrades.length > 0 ? profitTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / profitTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / lossTrades.length) : 0;
  const expectancy = totalTrades > 0 ? ((wins / totalTrades) * avgWin - (losses / totalTrades) * avgLoss).toFixed(2) : "0";

  const LockedOverlay = ({ tier }: { tier: string }) => (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-muted-foreground">Upgrade to {tier} to unlock</p>
      <a href="/app/upgrade" className="text-xs text-primary mt-1 underline">View Plans →</a>
    </div>
  );

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground mt-1">Performance insights</p></div>
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">Add trades to see your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground mt-1">Performance insights</p></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-primary" },
          { label: "Total P&L", value: `$${totalPnl.toFixed(2)}`, icon: TrendingUp, color: totalPnl >= 0 ? "text-success" : "text-destructive" },
          { label: "Avg RR", value: avgRR, icon: BarChart3, color: "text-primary" },
          { label: "Max Drawdown", value: `$${maxDrawdown.toFixed(2)}`, icon: AlertTriangle, color: "text-destructive" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4 card-glow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <div className="font-mono text-lg font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        {/* ========= OVERVIEW (BASIC) ========= */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Trades", value: String(totalTrades) },
              { label: "Best Trade", value: `$${bestTrade.toFixed(2)}` },
              { label: "Worst Trade", value: `$${worstTrade.toFixed(2)}` },
              { label: `${streakType === "win" ? "Win" : "Loss"} Streak`, value: String(currentStreak) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-3 card-glow">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{s.label}</span>
                <div className="font-mono text-sm font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-5 card-glow">
              <h3 className="text-sm font-semibold mb-4">Win Rate Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}: {d.value}</div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 card-glow">
              <h3 className="text-sm font-semibold mb-4">Daily P&L</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="pnl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="rounded-lg border border-border bg-card p-5 card-glow">
            <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ========= PERFORMANCE (PRO) ========= */}
        <TabsContent value="performance" className="space-y-6 mt-4">
          <div className="relative">
            {!isPro && <LockedOverlay tier="Pro" />}
            <div className={!isPro ? "blur-sm pointer-events-none" : ""}>
              {/* Pair Performance */}
              <div className="rounded-lg border border-border bg-card p-5 card-glow mb-6">
                <h3 className="text-sm font-semibold mb-4">Pair Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left p-2">Pair</th><th className="text-right p-2">Trades</th><th className="text-right p-2">Win Rate</th><th className="text-right p-2">P&L</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(pairPerf).sort((a, b) => b[1].pnl - a[1].pnl).map(([pair, data]) => (
                        <tr key={pair} className="border-b border-border last:border-0">
                          <td className="p-2 font-mono text-xs">{pair}</td>
                          <td className="p-2 text-right font-mono text-xs">{data.total}</td>
                          <td className="p-2 text-right font-mono text-xs">{((data.wins / data.total) * 100).toFixed(0)}%</td>
                          <td className={`p-2 text-right font-mono text-xs ${data.pnl >= 0 ? "text-success" : "text-destructive"}`}>{data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Day Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4">Day Performance</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="pnl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4">Session Analysis</h3>
                  <div className="space-y-3">
                    {Object.entries(sessionPerf).map(([session, data]) => (
                      <div key={session} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                        <span className="text-sm font-medium">{session}</span>
                        <div className="flex gap-4 text-xs font-mono">
                          <span>{data.total} trades</span>
                          <span>{data.total > 0 ? ((data.wins / data.total) * 100).toFixed(0) : 0}% WR</span>
                          <span className={data.pnl >= 0 ? "text-success" : "text-destructive"}>${data.pnl.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time insights + Drawdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4">Time Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <span className="text-sm">Best Hour</span>
                      <span className="font-mono text-xs text-success">{bestHour ? `${bestHour[0]}:00 ($${bestHour[1].pnl.toFixed(2)})` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <span className="text-sm">Worst Hour</span>
                      <span className="font-mono text-xs text-destructive">{worstHour ? `${worstHour[0]}:00 ($${worstHour[1].pnl.toFixed(2)})` : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4">Drawdown Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <span className="text-sm">Max Drawdown</span>
                      <span className="font-mono text-xs text-destructive">${maxDrawdown.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded border border-border bg-background">
                      <span className="text-sm">Avg Drawdown</span>
                      <span className="font-mono text-xs text-muted-foreground">${avgDrawdown}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag/Strategy Performance */}
              {Object.keys(tagPerf).length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4">Strategy / Tag Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left p-2">Tag</th><th className="text-right p-2">Trades</th><th className="text-right p-2">Win Rate</th><th className="text-right p-2">P&L</th>
                      </tr></thead>
                      <tbody>
                        {Object.entries(tagPerf).sort((a, b) => b[1].pnl - a[1].pnl).map(([tag, data]) => (
                          <tr key={tag} className="border-b border-border last:border-0">
                            <td className="p-2 text-xs">{tag}</td>
                            <td className="p-2 text-right font-mono text-xs">{data.total}</td>
                            <td className="p-2 text-right font-mono text-xs">{((data.wins / data.total) * 100).toFixed(0)}%</td>
                            <td className={`p-2 text-right font-mono text-xs ${data.pnl >= 0 ? "text-success" : "text-destructive"}`}>{data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ========= DISCIPLINE (PRO) ========= */}
        <TabsContent value="discipline" className="space-y-6 mt-4">
          <div className="relative">
            {!isPro && <LockedOverlay tier="Pro" />}
            <div className={!isPro ? "blur-sm pointer-events-none" : ""}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-card p-5 card-glow">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Follow Plan Rate</h3>
                  <div className="text-4xl font-bold font-mono text-primary">{followPlanRate.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{trades.filter((t) => t.follow_plan).length} / {totalTrades} trades followed the plan</p>
                  <div className="mt-4 h-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${followPlanRate}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5 card-glow relative">
                  {!isElite && <LockedOverlay tier="Elite" />}
                  <div className={!isElite ? "blur-sm" : ""}>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> JournalX Score</h3>
                    <div className={`text-4xl font-bold font-mono ${consistencyScore >= 80 ? "text-success" : consistencyScore >= 50 ? "text-primary" : "text-destructive"}`}>{consistencyScore.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Based on consistency, RR, and rule-following</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground block">Plan</span><span className="font-mono">{followPlanRate.toFixed(0)}%</span></div>
                      <div><span className="text-muted-foreground block">RR</span><span className="font-mono">{avgRR}</span></div>
                      <div><span className="text-muted-foreground block">Win Rate</span><span className="font-mono">{winRate}%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expectancy */}
              <div className="rounded-lg border border-border bg-card p-5 card-glow relative mt-6">
                {!isElite && <LockedOverlay tier="Elite" />}
                <div className={!isElite ? "blur-sm" : ""}>
                  <h3 className="text-sm font-semibold mb-4">Expectancy & Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Expectancy</span><span className={`font-mono text-lg font-bold ${Number(expectancy) >= 0 ? "text-success" : "text-destructive"}`}>${expectancy}</span></div>
                    <div><span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Avg Win</span><span className="font-mono text-lg font-bold text-success">${avgWin.toFixed(2)}</span></div>
                    <div><span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Avg Loss</span><span className="font-mono text-lg font-bold text-destructive">${avgLoss.toFixed(2)}</span></div>
                    <div><span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Profit Factor</span><span className="font-mono text-lg font-bold">{avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========= AI INSIGHTS (ELITE) ========= */}
        <TabsContent value="ai" className="space-y-6 mt-4">
          <div className="relative">
            {!isElite && <LockedOverlay tier="Elite" />}
            <div className={!isElite ? "blur-sm pointer-events-none" : ""}>
              <div className="rounded-lg border border-border bg-card p-5 card-glow">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Trading Insights</h3>
                <div className="space-y-3">
                  {(() => {
                    const insights: string[] = [];
                    if (bestHour) insights.push(`📈 You perform best around ${bestHour[0]}:00 — consider focusing trades here.`);
                    if (worstHour) insights.push(`📉 Avoid trading around ${worstHour[0]}:00 — your worst performance is at this time.`);
                    if (currentStreak > 2 && streakType === "loss") insights.push(`⚠️ You're on a ${currentStreak}-trade losing streak. Consider taking a break.`);
                    if (currentStreak > 3 && streakType === "win") insights.push(`🔥 ${currentStreak}-trade win streak! Stay disciplined, don't overtrade.`);
                    if (followPlanRate < 60) insights.push(`🎯 Your plan-following rate is ${followPlanRate.toFixed(0)}%. Focus on discipline — it's your edge.`);
                    const bestPair = Object.entries(pairPerf).sort((a, b) => b[1].pnl - a[1].pnl)[0];
                    const worstPair = Object.entries(pairPerf).sort((a, b) => a[1].pnl - b[1].pnl)[0];
                    if (bestPair) insights.push(`💎 Best performing pair: ${bestPair[0]} (+$${bestPair[1].pnl.toFixed(2)})`);
                    if (worstPair && worstPair[1].pnl < 0) insights.push(`💀 Worst pair: ${worstPair[0]} ($${worstPair[1].pnl.toFixed(2)}) — consider reducing size.`);
                    if (Number(avgRR) < 1.5 && avgRR !== "—") insights.push(`📊 Your avg RR is ${avgRR}. Aim for 1.5+ for long-term profitability.`);
                    if (maxDrawdown > totalPnl * 0.5 && totalPnl > 0) insights.push(`⚡ Your max drawdown ($${maxDrawdown.toFixed(2)}) is high relative to total profit. Tighten risk.`);
                    if (insights.length === 0) insights.push("✅ Keep trading consistently — more data = better insights!");
                    return insights.map((insight, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-3 rounded-lg border border-border bg-background text-sm">{insight}</motion.div>
                    ));
                  })()}
                </div>
              </div>

              {/* Monthly summary */}
              <div className="rounded-lg border border-border bg-card p-5 card-glow mt-6">
                <h3 className="text-sm font-semibold mb-4">Monthly Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left p-2">Month</th><th className="text-right p-2">Trades</th><th className="text-right p-2">Win Rate</th><th className="text-right p-2">P&L</th>
                    </tr></thead>
                    <tbody>
                      {(() => {
                        const monthly: Record<string, { wins: number; total: number; pnl: number }> = {};
                        trades.forEach((t) => {
                          const m = new Date(t.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });
                          if (!monthly[m]) monthly[m] = { wins: 0, total: 0, pnl: 0 };
                          monthly[m].total++;
                          if (t.result === "win") monthly[m].wins++;
                          monthly[m].pnl += Number(t.pnl_amount);
                        });
                        return Object.entries(monthly).reverse().map(([month, data]) => (
                          <tr key={month} className="border-b border-border last:border-0">
                            <td className="p-2 text-xs">{month}</td>
                            <td className="p-2 text-right font-mono text-xs">{data.total}</td>
                            <td className="p-2 text-right font-mono text-xs">{((data.wins / data.total) * 100).toFixed(0)}%</td>
                            <td className={`p-2 text-right font-mono text-xs ${data.pnl >= 0 ? "text-success" : "text-destructive"}`}>{data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
