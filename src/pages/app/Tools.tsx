import {
  Calculator,
  TrendingUp,
  Target,
  Scale,
  ArrowRightLeft,
  ShieldAlert,
  CandlestickChart,
  Crown,
  Lock,
  Sparkles,
  Wallet,
  Shield,
  Gauge,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPlanAccess } from "@/lib/planAccess";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const COMMON_PAIRS = [
  "XAUUSD",
"XAGUSD",
"EURUSD",
"GBPUSD",
"USDJPY",
"AUDUSD",
"NZDUSD",
"USDCAD",
"USDCHF",
"EURJPY",
"GBPJPY",
"EURGBP",
"AUDJPY",
"NZDJPY",
"USDSGD",
"USDHKD",
"USDNOK",
"USDSEK",
"USDCNY",
"USDCNH",
"USDCZK",
"USDPLN",
"USDHUF",
"USDTHB",
"USDCOP",
"USDBRL",
"USDZAR",
"USDTRY",
"USDINR",
"USDILS",
"USDKRW",
"USDTWD",
"USDMXN",
"USDSAR",
"USDQAR",
"USDCLP",
"USDHKD",

"BTCUSD",
"ETHUSD",
"XRPUSD",
"LTCUSD",
"LINKUSD",
"ADAUSD",
"DOTUSD",
"SOLUSD",
"AVAXUSD",
"UNIUSD",
"ATOMUSD",
"DOGEUSD",
"SHIBUSD",
"MATICUSD",
"FTMUSD",
"ALGOUSD",
"VETUSD",
"NEOUSD",
"EOSUSD",
"TRXUSD",
"XLMUSD",
"XTZUSD",
"ICPUSD",
"THETAUSD",
"AXSUSD",
"MANAUSD",
"ENJUSD",
"SNXUSD",
"CRVUSD",
"AAVEUSD",
"COMPUSD",
"MKRUSD",
"ADAETH",
"LINKETH",
"UNIETH",
"DOTETH",

"NAS100",
"US30",
"SPX500",
"US2000",
"UK100",
"GER30",
"FRA40",
"ESP35",
"IT40",
"NL25",
"JP225",
"AUS200",
"EURCAD",
"EURCHF",
"EURSEK",
"EURPLN",
"EURHUF",
"EURAUD",
"EURNZD",
"EUROIL",
"USDCAD",
"USDCHF",
"USDNOK",
"USDSEK",
"USDILS",
"USDPLN",
"USDHUF",
"USDCZK",
"USDRON",
"USDBGN",
"USDILS",
"USDPLN",
"USDSEK",
"USDNOK",
"USDHUF",
"USDCZK",

"GBPUSD",
"GBPJPY",
"GBPAUD",
"GBPCAD",
"GBPCHF",
"GBPNZD",
"GBPSGD",
"GBPSEK",
"GBPNOK",
"GBPDKK",
"GBPZAR",
"GBPHKD",
"GBPCNY",
"GBPINR",
"GBPILS",

"AUDUSD",
"AUDJPY",
"AUDNZD",
"AUDCAD",
"AUDCHF",
"AUDSGD",
"AUDHKD",
"AUDNOK",
"AUDSEK",

"NZDUSD",
"NZDCAD",
"NZDCHF",
"NZDJPY",
"NZDHKD",
"NZDSGD",
"NZDNOK",
"NZDSEK",

"XAUAUD",
"XAUCHF",
"XAUHKD",
"XAUSGD",
"XAUNZD",
"XAGAUD",
"XAGEUR",
"XAGGBP",
"XAGNZD",
"XAGHKD",
"XAGSGD"
];

const spring = { type: "spring", damping: 26, stiffness: 210 } as const;

const getPipSize = (pair: string) => {
  const p = pair.toUpperCase();
  if (p.includes("JPY")) return 0.01;
  if (p.includes("XAU") || p.includes("GOLD")) return 0.1;
  if (p.includes("BTC") || p.includes("ETH") || p.includes("CRYPTO")) return 1;
  return 0.0001;
};

const getPipValuePerLot = (pair: string) => {
  const p = pair.toUpperCase();
  if (p.includes("JPY")) return 9.13;
  if (p.includes("XAU") || p.includes("GOLD")) return 10;
  if (p.includes("BTC")) return 1;
  if (p.includes("ETH")) return 1;
  if (p.includes("NAS") || p.includes("US30")) return 1;
  return 10;
};

const parseNum = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number, max = 2) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(value);

const PairSelect = ({
  value,
  onChange,
  placeholder = "Select pair",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="max-h-72 border-0 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
      {COMMON_PAIRS.map((pair) => (
        <SelectItem key={pair} value={pair} className="font-mono">
          {pair}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
    {children}
  </div>
);

const Surface = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-3xl bg-card/95 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.28)] dark:shadow-[0_14px_44px_-28px_rgba(0,0,0,0.55)] ${className}`}
  >
    {children}
  </div>
);

const SubSurface = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl bg-background/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${className}`}
  >
    {children}
  </div>
);

const StatChip = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) => (
  <SubSurface className="px-3 py-3">
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <div className="mt-2 text-sm font-semibold">{value}</div>
  </SubSurface>
);

const MiniMetric = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warning";
}) => {
  const toneClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "danger"
      ? "text-red-400"
      : tone === "warning"
      ? "text-amber-400"
      : "text-foreground";

  return (
    <SubSurface className="flex items-center justify-between px-3 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${toneClass}`}>{value}</span>
    </SubSurface>
  );
};

const ResultHero = ({
  eyebrow,
  hero,
  subtext,
  tone = "primary",
  rows = [],
}: {
  eyebrow: string;
  hero: React.ReactNode;
  subtext?: React.ReactNode;
  tone?: "primary" | "success" | "danger" | "warning";
  rows?: { label: string; value: React.ReactNode; tone?: "default" | "success" | "danger" | "warning" }[];
}) => {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/[0.05]"
      : tone === "danger"
      ? "bg-red-500/[0.05]"
      : tone === "warning"
      ? "bg-amber-500/[0.05]"
      : "bg-primary/[0.05]";

  return (
    <Surface className={`p-6 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div>
      <div className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="font-mono">{hero}</span>
      </div>
      {subtext ? <div className="mt-3 text-sm text-muted-foreground">{subtext}</div> : null}
      {rows.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <MiniMetric key={row.label} label={row.label} value={row.value} tone={row.tone} />
          ))}
        </div>
      ) : null}
    </Surface>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) => (
  <Surface className="h-full min-h-[360px] bg-card/80 p-8">
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background/70 shadow-sm">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  </Surface>
);

const ToolLockedOverlay = () => (
  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-background/80 backdrop-blur-md">
    <div className="mx-4 max-w-sm rounded-3xl bg-card px-6 py-7 text-center shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
        <Lock className="h-5 w-5" />
      </div>
      <div className="mt-4 text-base font-semibold">Available on Pro</div>
      <p className="mt-2 text-sm text-muted-foreground">
        Unlock advanced calculators like pips, trade risk planning, and consistency analysis.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
        <Crown className="h-3.5 w-3.5" />
        Upgrade to access this tool
      </div>
    </div>
  </div>
);

const InsightCard = ({
  title,
  text,
  tone = "default",
}: {
  title: string;
  text: string;
  tone?: "default" | "success" | "danger" | "warning";
}) => {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/[0.05]"
      : tone === "danger"
      ? "bg-red-500/[0.05]"
      : tone === "warning"
      ? "bg-amber-500/[0.05]"
      : "bg-background/45";

  return (
    <SubSurface className={`p-4 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <p className="mt-2 text-sm text-foreground/90">{text}</p>
    </SubSurface>
  );
};

const QuickButton = ({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-10 rounded-2xl px-3 text-sm font-medium transition-all ${
      active
        ? "bg-primary/12 text-primary shadow-sm"
        : "bg-muted/45 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const Tools = () => {
  const { user } = useAuth();

  const [userPlanRaw, setUserPlanRaw] = useState<string>("free");
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lot");

  const [pipPair, setPipPair] = useState("");
  const [pipEntry, setPipEntry] = useState("");
  const [pipExit, setPipExit] = useState("");
  const [pipType, setPipType] = useState("buy");

  const [lotBalance, setLotBalance] = useState("");
  const [lotRisk, setLotRisk] = useState("");
  const [lotSL, setLotSL] = useState("");
  const [lotPair, setLotPair] = useState("");

  const [riskBalance, setRiskBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [riskPair, setRiskPair] = useState("");
  const [riskEntry, setRiskEntry] = useState("");
  const [riskSL, setRiskSL] = useState("");

  const [csAccountSize, setCsAccountSize] = useState("");
  const [csProfitTarget, setCsProfitTarget] = useState("");
  const [csBestDay, setCsBestDay] = useState("");
  const [csLimit, setCsLimit] = useState("25");

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_expiry")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Plan fetch error 👉", error);
        return;
      }

      if (data) {
        setUserPlanRaw(data.plan || "free");
        setPlanExpiry(data.plan_expiry || null);
      }
    };

    fetchPlan();
  }, [user]);

  const plan = userPlanRaw;
  const access = getPlanAccess(plan);
  const isFree = plan === "free";
  const canUseAllTools = !isFree;

  const pipResult = useMemo(() => {
    const entry = parseNum(pipEntry);
    const exit = parseNum(pipExit);
    if (!pipPair || entry === null || exit === null) return null;

    const pipSize = getPipSize(pipPair);
    const pips = pipType === "buy" ? (exit - entry) / pipSize : (entry - exit) / pipSize;
    const rounded = Math.round(pips * 10) / 10;

    return {
      pips: rounded,
      status: rounded >= 0 ? "Profit" : "Loss",
      instrument: pipPair,
      pipSize,
      entry,
      exit,
    };
  }, [pipPair, pipEntry, pipExit, pipType]);

  const lotResult = useMemo(() => {
    const b = parseNum(lotBalance);
    const r = parseNum(lotRisk);
    const sl = parseNum(lotSL);

    if (!lotPair || b === null || r === null || sl === null || sl === 0) return null;

    const riskAmount = b * (r / 100);
    const pipValue = getPipValuePerLot(lotPair);
    const lotSize = Math.max(0.01, Math.round((riskAmount / (sl * pipValue)) * 100) / 100);

    return {
      lotSize,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipValue,
      stopLossPips: sl,
      pair: lotPair,
      riskPercent: r,
      balance: b,
    };
  }, [lotBalance, lotRisk, lotSL, lotPair]);

  const riskResult = useMemo(() => {
    const b = parseNum(riskBalance);
    const r = parseNum(riskPercent);
    const entry = parseNum(riskEntry);
    const sl = parseNum(riskSL);

    if (!riskPair || b === null || r === null || entry === null || sl === null) return null;

    const riskAmount = b * (r / 100);
    const pipSize = getPipSize(riskPair);
    const slPips = Math.round((Math.abs(entry - sl) / pipSize) * 10) / 10;
    if (slPips === 0) return null;

    const pipValue = getPipValuePerLot(riskPair);
    const lotSize = Math.max(0.01, Math.round((riskAmount / (slPips * pipValue)) * 100) / 100);

    return {
      riskAmount: Math.round(riskAmount * 100) / 100,
      slPips,
      lotSize,
      pair: riskPair,
      riskPercent: r,
      entry,
      stopLoss: sl,
      balance: b,
    };
  }, [riskBalance, riskPercent, riskPair, riskEntry, riskSL]);

  const csResult = useMemo(() => {
    const size = parseNum(csAccountSize);
    const target = parseNum(csProfitTarget);
    const bestDay = parseNum(csBestDay);
    const limit = parseNum(csLimit) ?? 25;

    if (size === null || target === null || bestDay === null || size === 0) return null;

    const totalTarget = size * (target / 100);
    if (totalTarget === 0) return null;

    const score = Math.round((bestDay / totalTarget) * 1000) / 10;
    const maxBestDay = Math.round((limit / 100) * totalTarget * 100) / 100;
    const profitNeeded = Math.round((bestDay / (limit / 100)) * 100) / 100;
    const status = bestDay <= maxBestDay ? "PASS" : "FAIL";

    return {
      score,
      status,
      maxBestDay,
      profitNeeded,
      totalTarget: Math.round(totalTarget * 100) / 100,
      limit,
      bestDay,
      size,
      target,
    };
  }, [csAccountSize, csProfitTarget, csBestDay, csLimit]);

  const topSummary = useMemo(() => {
    if (activeTab === "lot" && lotResult) {
      return {
        title: "Lot size ready",
        hero: `${lotResult.lotSize.toFixed(2)} lots`,
        tone: "primary" as const,
        details: `Risk ${lotResult.riskPercent}% on ${lotResult.pair}`,
      };
    }

    if (activeTab === "pips" && pipResult) {
      return {
        title: "Pip movement",
        hero: `${pipResult.pips >= 0 ? "+" : ""}${pipResult.pips} pips`,
        tone: pipResult.pips >= 0 ? ("success" as const) : ("danger" as const),
        details: `${pipType.toUpperCase()} • ${pipResult.instrument}`,
      };
    }

    if (activeTab === "risk" && riskResult) {
      return {
        title: "Risk exposure",
        hero: formatMoney(riskResult.riskAmount),
        tone: "warning" as const,
        details: `${riskResult.riskPercent}% risk on ${riskResult.pair}`,
      };
    }

    if (activeTab === "consistency" && csResult) {
      return {
        title: "Consistency score",
        hero: `${csResult.score}%`,
        tone: csResult.status === "PASS" ? ("success" as const) : ("danger" as const),
        details: `${csResult.status} • Limit ${csResult.limit}%`,
      };
    }

    return {
      title: "Trading workstation",
      hero: "4 active tools",
      tone: "primary" as const,
      details: "Position sizing, pips, risk, consistency",
    };
  }, [activeTab, lotResult, pipResult, riskResult, csResult, pipType]);

  const sidebarInsights = useMemo(() => {
    if (activeTab === "lot") {
      if (!lotResult) {
        return [
          {
            title: "Sizing rule",
            text: "Use balance, risk %, stop loss, and pair to calculate a realistic position size before execution.",
            tone: "default" as const,
          },
          {
            title: "Good workflow",
            text: "Pick the stop loss first, then let the calculator tell you the lot size instead of forcing exposure.",
            tone: "warning" as const,
          },
        ];
      }

      return [
        {
          title: "Capital at risk",
          text: `${formatMoney(lotResult.riskAmount)} is exposed if price hits the stop loss.`,
          tone: "warning" as const,
        },
        {
          title: "Execution note",
          text: `${lotResult.lotSize.toFixed(2)} lots on ${lotResult.pair} assumes ${lotResult.stopLossPips} pips stop distance.`,
          tone: "default" as const,
        },
      ];
    }

    if (activeTab === "pips") {
      if (!pipResult) {
        return [
          {
            title: "Pip check",
            text: "Use this to measure movement between entry and exit for forex, gold, indices, and selected crypto symbols.",
            tone: "default" as const,
          },
          {
            title: "Direction matters",
            text: "Buy measures exit minus entry; sell measures entry minus exit.",
            tone: "warning" as const,
          },
        ];
      }

      return [
        {
          title: pipResult.pips >= 0 ? "Positive move" : "Negative move",
          text: `${pipResult.instrument} produced ${pipResult.pips >= 0 ? "a favorable" : "an adverse"} move of ${formatNumber(
            Math.abs(pipResult.pips),
            1
          )} pips.`,
          tone: pipResult.pips >= 0 ? ("success" as const) : ("danger" as const),
        },
        {
          title: "Instrument setup",
          text: `Current pip size assumption for ${pipResult.instrument} is ${pipResult.pipSize}.`,
          tone: "default" as const,
        },
      ];
    }

    if (activeTab === "risk") {
      if (!riskResult) {
        return [
          {
            title: "Risk planning",
            text: "Convert stop loss price distance into pips, then into risk amount and suggested lot size.",
            tone: "default" as const,
          },
          {
            title: "Use case",
            text: "This is useful when you know the actual chart invalidation level but not the final lot size yet.",
            tone: "warning" as const,
          },
        ];
      }

      return [
        {
          title: "Defined loss",
          text: `At ${riskResult.riskPercent}% risk, your maximum planned loss is ${formatMoney(riskResult.riskAmount)}.`,
          tone: "warning" as const,
        },
        {
          title: "Stop distance",
          text: `Your stop is ${riskResult.slPips} pips away, which maps to ${riskResult.lotSize.toFixed(2)} lots.`,
          tone: "default" as const,
        },
      ];
    }

    if (!csResult) {
      return [
        {
          title: "Consistency rule",
          text: "Check whether one large winning day contributes too much toward the full profit target.",
          tone: "default" as const,
        },
        {
          title: "Why it matters",
          text: "Many prop firms reject payout behavior that is too dependent on a single oversized day.",
          tone: "warning" as const,
        },
      ];
    }

    return [
      {
        title: csResult.status === "PASS" ? "Within threshold" : "Threshold breached",
        text:
          csResult.status === "PASS"
            ? `Best day profit remains within the ${csResult.limit}% cap.`
            : `Best day profit is too large relative to the allowed ${csResult.limit}% cap.`,
        tone: csResult.status === "PASS" ? ("success" as const) : ("danger" as const),
      },
      {
        title: "Normalization target",
        text: `You need ${formatMoney(csResult.profitNeeded)} total profit for ${formatMoney(
          csResult.bestDay
        )} to fit a ${csResult.limit}% consistency limit.`,
        tone: "default" as const,
      },
    ];
  }, [activeTab, lotResult, pipResult, riskResult, csResult]);

  const activeToolMeta = {
    lot: {
      icon: Scale,
      title: "Lot Size",
      subtitle: "Size positions from balance, risk, and stop distance.",
    },
    pips: {
      icon: TrendingUp,
      title: "Pips",
      subtitle: "Measure movement between entry and exit price.",
    },
    risk: {
      icon: Calculator,
      title: "Risk",
      subtitle: "Turn stop loss price into exact exposure and size.",
    },
    consistency: {
      icon: Target,
      title: "Consistency",
      subtitle: "Check best-day concentration against prop limits.",
    },
  }[activeTab];

  const ActiveIcon = activeToolMeta.icon;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <Surface className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_25%)]" />
          <div className="relative grid gap-5 p-6 lg:grid-cols-[1.35fr_0.95fr] lg:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Trading workstation
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trading Tools</h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Faster calculators for position sizing, pip movement, trade risk, and prop-firm consistency.
                    The interface keeps the current tool, the live result, and the risk context visible.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatChip icon={Gauge} label="Active tool" value={activeToolMeta.title} />
                <StatChip icon={Wallet} label="Plan" value={plan?.toUpperCase() || "FREE"} />
                <StatChip icon={Shield} label="Access" value={canUseAllTools ? "All calculators" : "Lot size only"} />
                <StatChip
                  icon={Activity}
                  label="Status"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {isFree ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      {isFree ? "Limited" : "Unlocked"}
                    </span>
                  }
                />
              </div>
            </div>

            <SubSurface className="p-5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{topSummary.title}</div>
              <div
                className={`mt-3 text-4xl font-bold tracking-tight sm:text-5xl ${
                  topSummary.tone === "success"
                    ? "text-emerald-400"
                    : topSummary.tone === "danger"
                    ? "text-red-400"
                    : topSummary.tone === "warning"
                    ? "text-amber-400"
                    : "text-primary"
                }`}
              >
                <span className="font-mono">{topSummary.hero}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{topSummary.details}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniMetric label="Pairs covered" value="Forex + Gold + Indices" />
                <MiniMetric label="Mode" value="Live calculation" />
                <MiniMetric label="Best use" value="Risk-first execution" />
                <MiniMetric label="Prop support" value="Consistency check" />
              </div>
            </SubSurface>
          </div>
        </Surface>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-3xl bg-card p-1.5 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.25)]">
          <TabsTrigger value="lot" className="rounded-2xl px-4 py-3">
            <Scale className="mr-2 h-4 w-4" />
            Lot Size
          </TabsTrigger>
          <TabsTrigger value="pips" className="rounded-2xl px-4 py-3">
            <TrendingUp className="mr-2 h-4 w-4" />
            Pips
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-2xl px-4 py-3">
            <Calculator className="mr-2 h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="consistency" className="rounded-2xl px-4 py-3">
            <Target className="mr-2 h-4 w-4" />
            Consistency
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div>
            <TabsContent value="lot" className="mt-0">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
                  <Surface className="p-6">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-400">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">Lot Size Calculator</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Size your position from account balance, percentage risk, and stop loss distance.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Field label="Account Balance" hint="USD">
                        <Input
                          value={lotBalance}
                          onChange={(e) => setLotBalance(e.target.value)}
                          placeholder="10000"
                          className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                          type="number"
                        />
                      </Field>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Risk %" hint="Per trade">
                          <Input
                            value={lotRisk}
                            onChange={(e) => setLotRisk(e.target.value)}
                            placeholder="1"
                            className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                            type="number"
                            step="0.1"
                          />
                        </Field>

                        <Field label="Stop Loss" hint="Pips">
                          <Input
                            value={lotSL}
                            onChange={(e) => setLotSL(e.target.value)}
                            placeholder="10"
                            className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                            type="number"
                          />
                        </Field>
                      </div>

                      <Field label="Trading Pair">
                        <PairSelect value={lotPair} onChange={setLotPair} />
                      </Field>

                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Quick risk presets
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {["0.5", "1", "2"].map((v) => (
                            <QuickButton key={v} active={lotRisk === v} onClick={() => setLotRisk(v)}>
                              {v}%
                            </QuickButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Surface>

                  {lotResult ? (
                    <ResultHero
                      eyebrow="Position size"
                      tone="primary"
                      hero={<span className="text-primary">{lotResult.lotSize.toFixed(2)} lots</span>}
                      subtext={`Calculated from ${lotResult.riskPercent}% risk on ${lotResult.pair}`}
                      rows={[
                        { label: "Risk Amount", value: formatMoney(lotResult.riskAmount), tone: "warning" },
                        { label: "Stop Loss", value: `${lotResult.stopLossPips} pips` },
                        { label: "Pip Value / Lot", value: `$${lotResult.pipValue}` },
                        { label: "Account Balance", value: formatMoney(lotResult.balance) },
                      ]}
                    />
                  ) : (
                    <EmptyState
                      icon={Scale}
                      title="Plan size before entering"
                      text="Add balance, risk percentage, stop loss, and pair to get a clean position size instantly."
                    />
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="pips" className="mt-0">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <div className="relative">
                  {canUseAllTools ? null : <ToolLockedOverlay />}
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
                    <Surface className="p-6">
                      <div className="mb-5 flex items-start gap-3">
                        <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight">Pip Calculator</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Measure price movement for forex, gold, crypto, and index symbols.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Field label="Trading Pair" hint="Required">
                          <PairSelect value={pipPair} onChange={setPipPair} />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Entry Price">
                            <Input
                              value={pipEntry}
                              onChange={(e) => setPipEntry(e.target.value)}
                              placeholder="1.1000"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="any"
                            />
                          </Field>

                          <Field label="Exit Price">
                            <Input
                              value={pipExit}
                              onChange={(e) => setPipExit(e.target.value)}
                              placeholder="1.1050"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="any"
                            />
                          </Field>
                        </div>

                        <Field label="Trade Type">
                          <div className="grid grid-cols-2 gap-2">
                            {["buy", "sell"].map((type) => (
                              <QuickButton
                                key={type}
                                active={pipType === type}
                                onClick={() => setPipType(type)}
                              >
                                {type.toUpperCase()}
                              </QuickButton>
                            ))}
                          </div>
                        </Field>
                      </div>
                    </Surface>

                    {pipResult ? (
                      <ResultHero
                        eyebrow="Pip outcome"
                        tone={pipResult.pips >= 0 ? "success" : "danger"}
                        hero={
                          <span className={pipResult.pips >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {pipResult.pips >= 0 ? "+" : ""}
                            {pipResult.pips} pips
                          </span>
                        }
                        subtext={`${pipResult.status} on ${pipResult.instrument} • Pip size ${pipResult.pipSize}`}
                        rows={[
                          { label: "Direction", value: pipType.toUpperCase() },
                          { label: "Instrument", value: pipResult.instrument },
                          { label: "Entry", value: pipResult.entry },
                          { label: "Exit", value: pipResult.exit },
                        ]}
                      />
                    ) : (
                      <EmptyState
                        icon={ArrowRightLeft}
                        title="Enter pair and price levels"
                        text="Choose an instrument, add entry and exit prices, and the pip movement appears instantly."
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <div className="relative">
                  {canUseAllTools ? null : <ToolLockedOverlay />}
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
                    <Surface className="p-6">
                      <div className="mb-5 flex items-start gap-3">
                        <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-400">
                          <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight">Risk Calculator</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Convert account risk and stop loss price into exact exposure and lot size.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Field label="Account Balance" hint="USD">
                          <Input
                            value={riskBalance}
                            onChange={(e) => setRiskBalance(e.target.value)}
                            placeholder="10000"
                            className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                            type="number"
                          />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Risk %" hint="Per trade">
                            <Input
                              value={riskPercent}
                              onChange={(e) => setRiskPercent(e.target.value)}
                              placeholder="1"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="0.1"
                            />
                          </Field>

                          <Field label="Trading Pair">
                            <PairSelect value={riskPair} onChange={setRiskPair} />
                          </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Entry Price">
                            <Input
                              value={riskEntry}
                              onChange={(e) => setRiskEntry(e.target.value)}
                              placeholder="1.1000"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="any"
                            />
                          </Field>

                          <Field label="Stop Loss Price">
                            <Input
                              value={riskSL}
                              onChange={(e) => setRiskSL(e.target.value)}
                              placeholder="1.0990"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="any"
                            />
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Quick risk presets
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["0.5", "1", "2"].map((v) => (
                              <QuickButton key={v} active={riskPercent === v} onClick={() => setRiskPercent(v)}>
                                {v}%
                              </QuickButton>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Surface>

                    {riskResult ? (
                      <ResultHero
                        eyebrow="Trade risk"
                        tone="warning"
                        hero={<span className="text-amber-400">{formatMoney(riskResult.riskAmount)}</span>}
                        subtext={`Risked at ${riskResult.riskPercent}% on ${riskResult.pair}`}
                        rows={[
                          { label: "Stop Loss Distance", value: `${riskResult.slPips} pips` },
                          { label: "Lot Size", value: riskResult.lotSize.toFixed(2) },
                          { label: "Entry", value: riskResult.entry },
                          { label: "Stop Loss", value: riskResult.stopLoss },
                        ]}
                      />
                    ) : (
                      <EmptyState
                        icon={ShieldAlert}
                        title="Define the trade risk"
                        text="Add account balance, trade risk, pair, entry, and stop-loss price to calculate exact exposure."
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="consistency" className="mt-0">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <div className="relative">
                  {canUseAllTools ? null : <ToolLockedOverlay />}
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
                    <Surface className="p-6">
                      <div className="mb-5 flex items-start gap-3">
                        <div className="rounded-2xl bg-purple-500/10 p-2.5 text-purple-400">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight">Prop Firm Consistency Score</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Check whether your best trading day exceeds the allowed consistency threshold.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Field label="Account Size" hint="USD">
                          <Input
                            value={csAccountSize}
                            onChange={(e) => setCsAccountSize(e.target.value)}
                            placeholder="10000"
                            className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                            type="number"
                          />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Profit Target %" hint="Challenge target">
                            <Input
                              value={csProfitTarget}
                              onChange={(e) => setCsProfitTarget(e.target.value)}
                              placeholder="10"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                              step="0.1"
                            />
                          </Field>

                          <Field label="Consistency Limit %" hint="Default 25%">
                            <Input
                              value={csLimit}
                              onChange={(e) => setCsLimit(e.target.value)}
                              placeholder="25"
                              className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                              type="number"
                            />
                          </Field>
                        </div>

                        <Field label="Best Day Profit" hint="USD">
                          <Input
                            value={csBestDay}
                            onChange={(e) => setCsBestDay(e.target.value)}
                            placeholder="400"
                            className="h-12 rounded-2xl border-0 bg-muted/55 font-mono shadow-none ring-1 ring-black/5 dark:ring-white/5"
                            type="number"
                          />
                        </Field>

                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Common limits
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["20", "25", "30"].map((v) => (
                              <QuickButton key={v} active={csLimit === v} onClick={() => setCsLimit(v)}>
                                {v}%
                              </QuickButton>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Surface>

                    {csResult ? (
                      <ResultHero
                        eyebrow="Consistency result"
                        tone={csResult.status === "PASS" ? "success" : "danger"}
                        hero={
                          <span className={csResult.status === "PASS" ? "text-emerald-400" : "text-red-400"}>
                            {csResult.score}%
                          </span>
                        }
                        subtext={
                          <span className="inline-flex items-center gap-2">
                            {csResult.status === "PASS" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                            {csResult.status} • Limit {csResult.limit}%
                          </span>
                        }
                        rows={[
                          { label: "Total Profit Target", value: formatMoney(csResult.totalTarget) },
                          { label: "Max Best Day Allowed", value: formatMoney(csResult.maxBestDay) },
                          {
                            label: "Best Day Profit",
                            value: formatMoney(csResult.bestDay),
                            tone: csResult.status === "PASS" ? "success" : "danger",
                          },
                          { label: "Profit Needed to Normalize", value: formatMoney(csResult.profitNeeded) },
                        ]}
                      />
                    ) : (
                      <EmptyState
                        icon={CandlestickChart}
                        title="Check prop-firm consistency"
                        text="Enter account size, target, best day profit, and consistency limit to see if your payout profile passes."
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </div>

          <div className="space-y-5">
            <Surface className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <ActiveIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{activeToolMeta.title}</div>
                  <p className="text-xs text-muted-foreground">{activeToolMeta.subtitle}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab + "-insights"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {sidebarInsights.map((item) => (
                      <InsightCard
                        key={item.title}
                        title={item.title}
                        text={item.text}
                        tone={item.tone}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Surface>

            <Surface className="p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Tool access
              </div>
              <div className="mt-4 space-y-3">
                <MiniMetric label="Lot Size" value="Available" tone="success" />
                <MiniMetric label="Pips" value={canUseAllTools ? "Available" : "Pro only"} tone={canUseAllTools ? "success" : "warning"} />
                <MiniMetric label="Risk" value={canUseAllTools ? "Available" : "Pro only"} tone={canUseAllTools ? "success" : "warning"} />
                <MiniMetric
                  label="Consistency"
                  value={canUseAllTools ? "Available" : "Pro only"}
                  tone={canUseAllTools ? "success" : "warning"}
                />
              </div>

              {!canUseAllTools ? (
                <SubSurface className="mt-4 bg-amber-500/[0.06] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <Crown className="h-4 w-4" />
                    Pro unlocks the full suite
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Lot sizing stays open for free users, while advanced tools use a soft blur lock state.
                  </p>
                </SubSurface>
              ) : null}
            </Surface>

            <Surface className="p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Notes
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <SubSurface className="px-3 py-3">
                  Pip values here are simplified assumptions by instrument type.
                </SubSurface>
                <SubSurface className="px-3 py-3">
                  The page is optimized for immediate calculator output, with forms on the left and results on the right.
                </SubSurface>
                <SubSurface className="px-3 py-3">
                  You can connect plan expiry logic later by replacing the current plan assignment with your effective-plan helper.
                </SubSurface>
              </div>
            </Surface>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Tools;