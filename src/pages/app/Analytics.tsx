import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  Lock,
  AlertTriangle,
  Brain,
  Shield,
  Sparkles,
  CalendarDays,
  Clock3,
  Swords,
  Trophy,
} from "lucide-react";

type TradeRow = {
  id: string;
  user_id?: string | null;
  firebase_uid?: string | null;
  account_id?: string | null;
  pair?: string | null;
  result?: string | null;
  pnl_amount?: number | string | null;
  lot_size?: number | string | null;
  entry_price?: number | string | null;
  stop_loss?: number | string | null;
  take_profit?: number | string | null;
  follow_plan?: boolean | null;
  entry_time?: string | null;
  created_at: string;
  tags?: string[] | null;
};

type ProfileRow = {
  id?: string;
  firebase_uid?: string | null;
  plan_name?: string | null;
};

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  primarySoft: "hsl(var(--primary) / 0.12)",
  success: "hsl(var(--chart-2))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  card: "hsl(var(--card))",
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "12px",
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value || 0);

const formatCurrency = (value: number, signed = false) => {
  const amount = `$${Math.abs(value).toFixed(2)}`;
  if (!signed) return `${value < 0 ? "-" : ""}${amount}`;
  return `${value >= 0 ? "+" : "-"}${amount}`;
};

const formatPercent = (value: number, digits = 1, signed = false) => {
  const formatted = `${Math.abs(value).toFixed(digits)}%`;
  if (!signed) return `${value < 0 ? "-" : ""}${formatted}`;
  return `${value >= 0 ? "+" : "-"}${formatted}`;
};

const safeDivide = (a: number, b: number) => (b > 0 ? a / b : 0);

const getResultTone = (result?: string | null) => {
  if (result === "win") return "text-success";
  if (result === "loss") return "text-destructive";
  return "text-muted-foreground";
};

const getResultBadge = (result?: string | null) => {
  if (result === "win") return "bg-green-500/10 text-green-500";
  if (result === "loss") return "bg-red-500/10 text-red-500";
  return "bg-muted text-muted-foreground";
};

const LockedOverlay = ({ tier }: { tier: string }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
    <div className="mb-3 rounded-full border border-border bg-card p-3">
      <Lock className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="text-sm font-semibold text-foreground">Upgrade to {tier}</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Unlock this advanced insight panel
    </p>
    <a href="/app/upgrade" className="mt-3 text-xs text-primary underline">
      View Plans →
    </a>
  </div>
);

const SectionCard = ({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) => (
  <div
    className={`rounded-xl border border-border bg-card p-5 card-glow ${className}`}
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon: any;
  tone?: "default" | "success" | "danger";
  hint?: string;
}) => {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
      ? "text-destructive"
      : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 card-glow"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <div className="font-mono text-lg font-bold">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </motion.div>
  );
};

const MiniInsight = ({
  icon: Icon,
  label,
  value,
  toneClass = "text-foreground",
}: {
  icon: any;
  label: string;
  value: string;
  toneClass?: string;
}) => (
  <div className="rounded-lg border border-border bg-background/40 p-3">
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
    <p className={`text-sm font-medium ${toneClass}`}>{value}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-center">
    <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
  </div>
);

const Analytics = () => {
  const { user } = useAuth();

  const { data: trades = [] } = useQuery<TradeRow[]>({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: profile = null } = useQuery<ProfileRow | null>({
  queryKey: ["profile", user?.id],
  queryFn: async () => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id) // ✅ FIXED HERE
      .maybeSingle();

    if (error) throw error;

    console.log("USER PLAN FROM DB:", data);
    return data;
  },
  enabled: !!user?.id,
});

  const plan = (profile?.plan || profile?.plan_name || "free")?.toLowerCase();
  console.log("USER PLAN FROM DB:", profile);
  console.log("FINAL PLAN:", plan);
  const isFree = plan === "free";

// basic plan
const isBasic = plan === "pro";

// standard / pro+
const isStandard =
  plan === "pro+" ||
  plan === "standard" ||
  plan === "pro_plus"; // ✅ ADD THIS

// elite
const isElite = plan === "elite";

// combined access
const canAccessPerformance = isBasic || isStandard || isElite;
const canAccessDiscipline = isStandard || isElite;
const canAccessAI = isElite;

  const analytics = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.result === "win").length;
    const losses = trades.filter((t) => t.result === "loss").length;
    const breakeven = trades.filter((t) => t.result === "breakeven").length;

    const totalPnl = trades.reduce((sum, t) => sum + toNumber(t.pnl_amount), 0);
    const winRate = safeDivide(wins, totalTrades) * 100;

    const profitTrades = trades.filter((t) => toNumber(t.pnl_amount) > 0);
    const lossTrades = trades.filter((t) => toNumber(t.pnl_amount) < 0);

    const bestTrade =
      profitTrades.length > 0
        ? Math.max(...profitTrades.map((t) => toNumber(t.pnl_amount)))
        : 0;

    const worstTrade =
      lossTrades.length > 0
        ? Math.min(...lossTrades.map((t) => toNumber(t.pnl_amount)))
        : 0;

    const avgWin =
      profitTrades.length > 0
        ? profitTrades.reduce((s, t) => s + toNumber(t.pnl_amount), 0) /
          profitTrades.length
        : 0;

    const avgLoss =
      lossTrades.length > 0
        ? Math.abs(
            lossTrades.reduce((s, t) => s + toNumber(t.pnl_amount), 0) /
              lossTrades.length
          )
        : 0;

    const tradesWithRR = trades.filter(
      (t) => t.entry_price && t.stop_loss && t.take_profit
    );

    const avgRR =
      tradesWithRR.length > 0
        ? tradesWithRR.reduce((s, t) => {
            const risk = Math.abs(
              toNumber(t.entry_price) - toNumber(t.stop_loss)
            );
            const reward = Math.abs(
              toNumber(t.take_profit) - toNumber(t.entry_price)
            );
            return s + (risk > 0 ? reward / risk : 0);
          }, 0) / tradesWithRR.length
        : null;

    let currentStreak = 0;
    let streakType = "";
    for (let i = trades.length - 1; i >= 0; i--) {
      const r = trades[i].result || "";
      if (i === trades.length - 1) {
        streakType = r;
        currentStreak = 1;
      } else if (r === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    let peak = 0;
    let maxDrawdown = 0;
    let cumPnl = 0;
    const drawdowns: number[] = [];

    trades.forEach((t) => {
      cumPnl += toNumber(t.pnl_amount);
      if (cumPnl > peak) peak = cumPnl;
      const dd = peak - cumPnl;
      if (dd > 0) drawdowns.push(dd);
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    const avgDrawdown =
      drawdowns.length > 0
        ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
        : 0;

    const pieData = [
      { name: "Wins", value: wins, color: "hsl(var(--chart-2))" },
      { name: "Losses", value: losses, color: "hsl(var(--destructive))" },
      { name: "BE", value: breakeven, color: "hsl(var(--muted-foreground))" },
    ].filter((d) => d.value > 0);

    const pnlByDay: Record<string, number> = {};
    trades.forEach((t) => {
      const day = new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      pnlByDay[day] = (pnlByDay[day] || 0) + toNumber(t.pnl_amount);
    });

    const barData = Object.entries(pnlByDay).map(([day, pnl]) => ({
      day,
      pnl,
    }));

    let equity = 0;
    const equityData = trades.map((t) => {
      equity += toNumber(t.pnl_amount);
      return {
        date: new Date(t.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        equity,
      };
    });

    const pairPerf: Record<
      string,
      { wins: number; total: number; pnl: number }
    > = {};
    trades.forEach((t) => {
      const pair = t.pair || "Unknown";
      if (!pairPerf[pair]) pairPerf[pair] = { wins: 0, total: 0, pnl: 0 };
      pairPerf[pair].total++;
      if (t.result === "win") pairPerf[pair].wins++;
      pairPerf[pair].pnl += toNumber(t.pnl_amount);
    });

    const sortedPairPerf = Object.entries(pairPerf).sort(
      (a, b) => b[1].pnl - a[1].pnl
    );

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getTradeDate = (t: TradeRow) => {
  const raw = t.entry_time || t.created_at;
  if (!raw) return null;

  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
};

const dayPerf: Record<
  string,
  { wins: number; losses: number; total: number; pnl: number }
> = {};

trades.forEach((t) => {
  const date = getTradeDate(t);
  if (!date) return;

  const d = dayNames[date.getDay()];

  if (!dayPerf[d]) {
    dayPerf[d] = { wins: 0, losses: 0, total: 0, pnl: 0 };
  }

  const pnl = Number(t.pnl_amount ?? 0);

  dayPerf[d].total += 1;
  if (t.result === "win") dayPerf[d].wins += 1;
  if (t.result === "loss") dayPerf[d].losses += 1;
  dayPerf[d].pnl += pnl;
});
console.log("DAY PERF DEBUG:", dayPerf);
trades.forEach((t) => {
  const created = t.created_at;
  const entry = t.entry_time;
  const pnl = Number(t.pnl_amount ?? 0);

  const createdDay = created ? dayNames[new Date(created).getDay()] : "NA";
  const entryDay = entry ? dayNames[new Date(entry).getDay()] : "NA";

  console.log("TRADE DEBUG", {
    pnl,
    created,
    createdDay,
    entry,
    entryDay,
  });
});
    const dayData = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => ({
  day: d,
  pnl: dayPerf[d]?.pnl || 0,
  wins: dayPerf[d]?.wins || 0,
  losses: dayPerf[d]?.losses || 0,
  trades: dayPerf[d]?.total || 0,
}));
let bestDay = null;
let worstDay = null;

Object.entries(dayPerf).forEach(([day, data]) => {
  if (!bestDay || data.pnl > bestDay.pnl) {
    bestDay = { day, ...data };
  }

  if (!worstDay || data.pnl < worstDay.pnl) {
    worstDay = { day, ...data };
  }
});

    const sessionPerf: Record<
      string,
      { wins: number; total: number; pnl: number }
    > = {
      London: { wins: 0, total: 0, pnl: 0 },
      "New York": { wins: 0, total: 0, pnl: 0 },
      Asia: { wins: 0, total: 0, pnl: 0 },
    };

    trades.forEach((t) => {
  if (!t.entry_time) return;

  // ✅ extract hour manually (NO Date conversion)
  const hour = parseInt(t.entry_time.split("T")[1].slice(0, 2));

  let session = "Asia";

  // ✅ Asia: 4 AM – 11 AM
  if (hour >= 4 && hour < 11) {
    session = "Asia";
  }

  // ✅ London: 12 PM – 5 PM
  else if (hour >= 12 && hour < 17) {
    session = "London";
  }

  // ✅ New York: 5:30 PM – 12 AM
  else if (hour >= 17) {
    session = "New York";
  }

  sessionPerf[session].total++;

  if (t.result === "win") {
    sessionPerf[session].wins++;
  }

  sessionPerf[session].pnl += Number(t.pnl_amount || 0);
});

    const hourPerf: Record<number, { pnl: number; total: number }> = {};
    trades.forEach((t) => {
      if (!t.entry_time) return;
      const hour = parseInt(t.entry_time.split("T")[1].slice(0, 2));
      if (!hourPerf[hour]) hourPerf[hour] = { pnl: 0, total: 0 };
      hourPerf[hour].pnl += toNumber(t.pnl_amount);
      hourPerf[hour].total++;
    });

    const hourEntries = Object.entries(hourPerf);

// ✅ filter profit hours
const profitHours = hourEntries.filter(([_, v]) => v.pnl > 0);

// ✅ filter loss hours
const lossHours = hourEntries.filter(([_, v]) => v.pnl < 0);

// ✅ BEST = highest profit
const bestHour =
  profitHours.length > 0
    ? profitHours.sort((a, b) => b[1].pnl - a[1].pnl)[0]
    : null;

// ✅ WORST = biggest loss
const worstHour =
  lossHours.length > 0
    ? lossHours.sort((a, b) => a[1].pnl - b[1].pnl)[0]
    : null;

    const tagPerf: Record<string, { wins: number; total: number; pnl: number }> =
      {};
    trades.forEach((t) => {
      (t.tags || []).forEach((tag: string) => {
        if (!tagPerf[tag]) tagPerf[tag] = { wins: 0, total: 0, pnl: 0 };
        tagPerf[tag].total++;
        if (t.result === "win") tagPerf[tag].wins++;
        tagPerf[tag].pnl += toNumber(t.pnl_amount);
      });
    });

    const sortedTagPerf = Object.entries(tagPerf).sort(
      (a, b) => b[1].pnl - a[1].pnl
    );

    const followPlanCount = trades.filter((t) => t.follow_plan).length;
    const followPlanRate = safeDivide(followPlanCount, totalTrades) * 100;
    const rrScore = avgRR !== null ? Math.min(avgRR * 25, 30) : 0;
    const consistencyScore = Math.min(
      followPlanRate * 0.4 + rrScore + (winRate > 40 ? 20 : winRate * 0.5),
      100
    );

    const expectancy =
      totalTrades > 0
        ? (wins / totalTrades) * avgWin - (losses / totalTrades) * avgLoss
        : 0;

    const monthly: Record<string, { wins: number; total: number; pnl: number }> =
      {};
    trades.forEach((t) => {
      const m = new Date(t.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (!monthly[m]) monthly[m] = { wins: 0, total: 0, pnl: 0 };
      monthly[m].total++;
      if (t.result === "win") monthly[m].wins++;
      monthly[m].pnl += toNumber(t.pnl_amount);
    });

    const monthlyRows = Object.entries(monthly).reverse();

    return {
      totalTrades,
      wins,
      losses,
      breakeven,
      totalPnl,
      winRate,
      bestTrade,
      worstTrade,
      avgWin,
      avgLoss,
      avgRR,
      currentStreak,
      streakType,
      maxDrawdown,
      avgDrawdown,
      pieData,
      barData,
      equityData,
      pairPerf,
      sortedPairPerf,
      dayData,
      sessionPerf,
      bestHour,
      worstHour,
      tagPerf,
      sortedTagPerf,
      followPlanCount,
      followPlanRate,
      consistencyScore,
      expectancy,
      monthlyRows,
      bestDay,
      worstDay,
    };
  }, [trades]);

  const aiInsights = useMemo(() => {
    const insights: string[] = [];

    if (analytics.bestHour) {
      insights.push(
        `You perform best around ${analytics.bestHour[0]}:00 — consider prioritizing your A+ setups there.`
      );
    }

    if (analytics.worstHour) {
      insights.push(
        `Your weakest hour is ${analytics.worstHour[0]}:00 — reduce size or avoid lower-quality entries in that window.`
      );
    }

    if (analytics.currentStreak > 2 && analytics.streakType === "loss") {
      insights.push(
        `You are on a ${analytics.currentStreak}-trade losing streak. A short reset may protect discipline.`
      );
    }

    if (analytics.currentStreak > 3 && analytics.streakType === "win") {
      insights.push(
        `You are on a ${analytics.currentStreak}-trade win streak. Stay selective and avoid overconfidence.`
      );
    }

    if (analytics.followPlanRate < 60) {
      insights.push(
        `Your plan-following rate is ${analytics.followPlanRate.toFixed(
          0
        )}%. Better execution discipline may improve consistency faster than new strategies.`
      );
    }

    const bestPair = analytics.sortedPairPerf[0];
    const worstPair = [...analytics.sortedPairPerf].sort(
      (a, b) => a[1].pnl - b[1].pnl
    )[0];

    if (bestPair) {
      insights.push(
        `Best-performing pair: ${bestPair[0]} with ${formatCurrency(
          bestPair[1].pnl,
          true
        )}.`
      );
    }

    if (worstPair && worstPair[1].pnl < 0) {
      insights.push(
        `Weakest pair: ${worstPair[0]} at ${formatCurrency(
          worstPair[1].pnl
        )}. Review whether it fits your edge.`
      );
    }

    if (analytics.avgRR !== null && analytics.avgRR < 1.5) {
      insights.push(
        `Average RR is ${analytics.avgRR.toFixed(
          2
        )}. Improving reward-to-risk selection could lift expectancy.`
      );
    }

    if (
      analytics.maxDrawdown > analytics.totalPnl * 0.5 &&
      analytics.totalPnl > 0
    ) {
      insights.push(
        `Max drawdown is high relative to total profits. Tighter risk control may smooth your equity curve.`
      );
    }

    if (insights.length === 0) {
      insights.push(
        "Keep logging trades consistently. More data will unlock better behavioral patterns and stronger insights."
      );
    }

    return insights;
  }, [analytics]);

  if (analytics.totalTrades === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance insights
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-10 text-center card-glow">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold">No analytics yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Add a few trades first. Once your journal has data, this page will
            show win rate, drawdown, equity curve, discipline stats, and AI
            insights.
          </p>
        </div>
      </div>
    );
  }

  const topStats = [
    {
      label: "Win Rate",
      value: `${analytics.winRate.toFixed(1)}%`,
      icon: Target,
      tone: "default" as const,
      hint: `${analytics.wins} wins out of ${analytics.totalTrades} trades`,
    },
    {
      label: "Total P&L",
      value: formatCurrency(analytics.totalPnl, true),
      icon: analytics.totalPnl >= 0 ? TrendingUp : TrendingDown,
      tone: analytics.totalPnl >= 0 ? ("success" as const) : ("danger" as const),
      hint: "Net performance across all logged trades",
    },
    {
      label: "Avg RR",
      value: analytics.avgRR !== null ? analytics.avgRR.toFixed(2) : "—",
      icon: BarChart3,
      tone: "default" as const,
      hint: "Average reward-to-risk from valid setups",
    },
    {
      label: "Max Drawdown",
      value: formatCurrency(analytics.maxDrawdown),
      icon: AlertTriangle,
      tone: "danger" as const,
      hint: "Deepest fall from an equity peak",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 card-glow">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                Trading Intelligence
              </span>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Plan: {plan}
              </span>
            </div>

            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Deep performance breakdown across results, behavior, timing,
              strategy tags, and discipline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniInsight
              icon={Swords}
              label="Trades"
              value={String(analytics.totalTrades)}
            />
            <MiniInsight
              icon={Trophy}
              label="Best Trade"
              value={formatCurrency(analytics.bestTrade, true)}
              toneClass="text-success"
            />
            <MiniInsight
              icon={CalendarDays}
              label="Streak"
              value={`${analytics.currentStreak} ${
                analytics.streakType || "trade"
              }`}
            />
            <MiniInsight
              icon={Shield}
              label="Plan Follow"
              value={`${analytics.followPlanRate.toFixed(0)}%`}
              toneClass="text-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {topStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 border border-border bg-card p-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>

{isFree ? (
  <TabsTrigger value="performance" disabled className="opacity-50">
    Performance 🔒
  </TabsTrigger>
) : (
  <TabsTrigger value="performance">Performance</TabsTrigger>
)}

{canAccessDiscipline ? (
  <TabsTrigger value="discipline">Discipline</TabsTrigger>
) : (
  <TabsTrigger value="discipline" disabled className="opacity-50">
    Discipline 🔒
  </TabsTrigger>
)}

{isElite ? (
  <TabsTrigger value="ai">AI Insights</TabsTrigger>
) : (
  <TabsTrigger value="ai" disabled className="opacity-50">
    AI Insights 🔒
  </TabsTrigger>
)}
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Trades", value: String(analytics.totalTrades), locked: false },
              {
                label: "Best Trade",
                value: formatCurrency(analytics.bestTrade, true),
                locked: isFree,
              },
              {
                label: "Worst Trade",
                value: formatCurrency(analytics.worstTrade),
                locked: isFree,
              },
              {
                label:
                  analytics.streakType === "win"
                    ? "Win Streak"
                    : analytics.streakType === "loss"
                    ? "Loss Streak"
                    : "Current Streak",
                value: String(analytics.currentStreak),
                locked: isFree,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`relative overflow-hidden rounded-xl border border-border bg-card p-4 card-glow`}
              >
                {item.locked ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      Upgrade
                    </span>
                  </div>
                ) : null}

                <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </span>
                <div className="font-mono text-sm font-bold">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="Win Distribution"
              subtitle="Breakdown of wins, losses, and breakeven trades"
            >
              <div className="h-56">
                {analytics.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {analytics.pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="No distribution data available yet." />
                )}
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
                {analytics.pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Daily P&L"
              subtitle="Profit and loss grouped by trading day"
            >
              <div className="h-56">
                {analytics.barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.barData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART_COLORS.border}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar
                        dataKey="pnl"
                        fill={CHART_COLORS.primary}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="Daily P&L will appear after you log more trades." />
                )}
              </div>
            </SectionCard>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 card-glow">
            {isFree ? <LockedOverlay tier="Pro" /> : null}

            <div className={isFree ? "pointer-events-none blur-sm" : ""}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Equity Curve</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Running cumulative P&L over time
                  </p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
                  Premium
                </div>
              </div>

              <div className="h-60">
                {analytics.equityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.equityData}>
                      <defs>
                        <linearGradient
                          id="equityFillMain"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART_COLORS.border}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke={CHART_COLORS.primary}
                        fill="url(#equityFillMain)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="Equity curve will appear once cumulative trade history exists." />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-5 space-y-6">
          <div className="relative">
            {!canAccessPerformance ? <LockedOverlay tier="Pro" /> : null}

            <div className={!canAccessPerformance ? "pointer-events-none blur-sm" : ""}>
              <SectionCard
                title="Pair Performance"
                subtitle="Which markets are helping or hurting your edge"
              >
                {analytics.sortedPairPerf.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <th className="p-2 text-left">Pair</th>
                          <th className="p-2 text-right">Trades</th>
                          <th className="p-2 text-right">Win Rate</th>
                          <th className="p-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.sortedPairPerf.map(([pair, data]) => (
                          <tr
                            key={pair}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-2 font-mono text-xs">{pair}</td>
                            <td className="p-2 text-right font-mono text-xs">
                              {data.total}
                            </td>
                            <td className="p-2 text-right font-mono text-xs">
                              {((data.wins / data.total) * 100).toFixed(0)}%
                            </td>
                            <td
                              className={`p-2 text-right font-mono text-xs ${
                                data.pnl >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {formatCurrency(data.pnl, true)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="No pair-level performance yet." />
                )}
              </SectionCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
  title="Day Performance"
  subtitle="See which weekdays produce your best outcomes"
>
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-border bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Best Day
        </p>
        <p className="mt-1 text-sm font-semibold text-success">
          {analytics.bestDay ? analytics.bestDay.day : "—"}
        </p>
        <p className="mt-1 font-mono text-xs text-success">
          {analytics.bestDay ? formatCurrency(analytics.bestDay.pnl, true) : "—"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Worst Day
        </p>
        <p className="mt-1 text-sm font-semibold text-destructive">
          {analytics.worstDay ? analytics.worstDay.day : "—"}
        </p>
        <p className="mt-1 font-mono text-xs text-destructive">
          {analytics.worstDay ? formatCurrency(analytics.worstDay.pnl, true) : "—"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Active Days
        </p>
        <p className="mt-1 text-sm font-semibold">
          {analytics.dayData.filter((d) => d.trades > 0).length}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          weekdays traded
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {analytics.dayData.map((d) => (
        <div
          key={d.day}
          className="rounded-xl border border-border bg-background/50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{d.day}</span>
            <span className="text-[10px] text-muted-foreground">
              {d.trades} trades
            </span>
          </div>

          <p
            className={`mt-3 font-mono text-base font-bold ${
              d.pnl > 0
                ? "text-success"
                : d.pnl < 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {formatCurrency(d.pnl, true)}
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${
                d.pnl > 0
                  ? "bg-green-500"
                  : d.pnl < 0
                  ? "bg-red-500"
                  : "bg-muted"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.abs(d.pnl) /
                    Math.max(...analytics.dayData.map((x) => Math.abs(x.pnl) || 1)) *
                    100
                )}%`,
              }}
            />
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            {d.wins}W / {d.losses}L
          </p>
        </div>
      ))}
    </div>
  </div>
</SectionCard>

                <SectionCard
                  title="Session Analysis"
                  subtitle="Performance split by Asia, London, and New York"
                >
                  <div className="space-y-3">
                    {Object.entries(analytics.sessionPerf).map(([session, data]) => (
                      <div
                        key={session}
                        className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                      >
                        <span className="text-sm font-medium">{session}</span>
                        <div className="flex gap-4 text-xs font-mono">
                          <span>{data.total} trades</span>
                          <span>
                            {data.total > 0
                              ? ((data.wins / data.total) * 100).toFixed(0)
                              : 0}
                            % WR
                          </span>
                          <span
                            className={
                              data.pnl >= 0 ? "text-success" : "text-destructive"
                            }
                          >
                            {formatCurrency(data.pnl, true)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Time Insights"
                  subtitle="Best and worst trading hours based on outcome"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <span className="text-sm">Best Hour</span>
                      <span className="font-mono text-xs text-success">
                        {analytics.bestHour
                          ? `${analytics.bestHour[0]}:00 (${formatCurrency(
                              analytics.bestHour[1].pnl,
                              true
                            )})`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <span className="text-sm">Worst Hour</span>
                      <span className="font-mono text-xs text-destructive">
                        {analytics.worstHour
                          ? `${analytics.worstHour[0]}:00 (${formatCurrency(
                              analytics.worstHour[1].pnl
                            )})`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Drawdown Metrics"
                  subtitle="How deep losses run during rough patches"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <span className="text-sm">Max Drawdown</span>
                      <span className="font-mono text-xs text-destructive">
                        {formatCurrency(analytics.maxDrawdown)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <span className="text-sm">Avg Drawdown</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(analytics.avgDrawdown)}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Strategy / Tag Performance"
                subtitle="Review which setups and labels drive results"
              >
                {analytics.sortedTagPerf.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <th className="p-2 text-left">Tag</th>
                          <th className="p-2 text-right">Trades</th>
                          <th className="p-2 text-right">Win Rate</th>
                          <th className="p-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.sortedTagPerf.map(([tag, data]) => (
                          <tr
                            key={tag}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-2 text-xs">{tag}</td>
                            <td className="p-2 text-right font-mono text-xs">
                              {data.total}
                            </td>
                            <td className="p-2 text-right font-mono text-xs">
                              {((data.wins / data.total) * 100).toFixed(0)}%
                            </td>
                            <td
                              className={`p-2 text-right font-mono text-xs ${
                                data.pnl >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {formatCurrency(data.pnl, true)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="No tag performance data found. Add tags to your trades to unlock this section." />
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discipline" className="mt-5 space-y-6">
          <div className="relative">
            {!canAccessDiscipline ? <LockedOverlay tier="Pro+" /> : null}

            <div className={!canAccessDiscipline ? "pointer-events-none blur-sm" : ""}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Follow Plan Rate"
                  subtitle="How often your execution matched your intended setup"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-4xl font-bold text-primary">
                        {analytics.followPlanRate.toFixed(0)}%
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {analytics.followPlanCount} / {analytics.totalTrades} trades
                        followed the plan
                      </p>
                    </div>
                    <Shield className="h-5 w-5 text-primary" />
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${analytics.followPlanRate}%` }}
                    />
                  </div>
                </SectionCard>

                <div className="relative">
                  {!canAccessDiscipline ? <LockedOverlay tier="Pro+" /> : null}

                  <div className={!canAccessDiscipline ? "blur-sm" : ""}>
                    <SectionCard
                      title="JournalX Score"
                      subtitle="Consistency score based on rule-following, RR, and results"
                    >
                      <div
                        className={`font-mono text-4xl font-bold ${
                          analytics.consistencyScore >= 80
                            ? "text-success"
                            : analytics.consistencyScore >= 50
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        {analytics.consistencyScore.toFixed(0)}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Built from discipline + setup quality + execution outcome
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg border border-border bg-background p-3">
                          <span className="block text-muted-foreground">Plan</span>
                          <span className="font-mono">
                            {analytics.followPlanRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-3">
                          <span className="block text-muted-foreground">RR</span>
                          <span className="font-mono">
                            {analytics.avgRR !== null
                              ? analytics.avgRR.toFixed(2)
                              : "—"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-3">
                          <span className="block text-muted-foreground">Win Rate</span>
                          <span className="font-mono">
                            {analytics.winRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </div>

              <div className="relative mt-6">
                {!canAccessDiscipline ? <LockedOverlay tier="Pro+" /> : null}

                <div className={!canAccessDiscipline ? "blur-sm" : ""}>
                  <SectionCard
                    title="Expectancy & Core Stats"
                    subtitle="Your edge per trade based on win probability and payoff"
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Expectancy
                        </span>
                        <span
                          className={`font-mono text-lg font-bold ${
                            analytics.expectancy >= 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatCurrency(analytics.expectancy, true)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Avg Win
                        </span>
                        <span className="font-mono text-lg font-bold text-success">
                          {formatCurrency(analytics.avgWin)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Avg Loss
                        </span>
                        <span className="font-mono text-lg font-bold text-destructive">
                          {formatCurrency(analytics.avgLoss)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Profit Factor
                        </span>
                        <span className="font-mono text-lg font-bold">
                          {analytics.avgLoss > 0
                            ? (analytics.avgWin / analytics.avgLoss).toFixed(2)
                            : "∞"}
                        </span>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-5 space-y-6">
          <div className="relative">
            {!isElite ? <LockedOverlay tier="Elite" /> : null}

            <div className={!isElite ? "pointer-events-none blur-sm" : ""}>
              <SectionCard
                title="AI Trading Insights"
                subtitle="Pattern-based guidance from your trade behavior"
                action={
                  <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
                    Elite
                  </div>
                }
              >
                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full border border-primary/20 bg-primary/10 p-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm leading-6">{insight}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Monthly Summary"
                subtitle="Month-by-month trading output and hit rate"
                className="mt-6"
              >
                {analytics.monthlyRows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <th className="p-2 text-left">Month</th>
                          <th className="p-2 text-right">Trades</th>
                          <th className="p-2 text-right">Win Rate</th>
                          <th className="p-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.monthlyRows.map(([month, data]) => (
                          <tr
                            key={month}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-2 text-xs">{month}</td>
                            <td className="p-2 text-right font-mono text-xs">
                              {data.total}
                            </td>
                            <td className="p-2 text-right font-mono text-xs">
                              {((data.wins / data.total) * 100).toFixed(0)}%
                            </td>
                            <td
                              className={`p-2 text-right font-mono text-xs ${
                                data.pnl >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {formatCurrency(data.pnl, true)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="Monthly summary will appear after enough dated trade history is available." />
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;