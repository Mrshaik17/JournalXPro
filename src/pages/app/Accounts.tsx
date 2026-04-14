import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  AlertTriangle,
  Share2,
  Filter,
  TrendingDown,
  Award,
  Shield,
  Zap,
  Search,
  LayoutGrid,
  Rows3,
  Wallet,
  BadgeDollarSign,
  RefreshCcw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type AccountRow = {
  id: string;
  firebase_uid: string | null;
  user_id?: string | null;
  name: string;
  broker: string | null;
  account_type: string | null;
  starting_balance: number | null;
  current_balance: number | null;
  daily_drawdown: number | null;
  max_drawdown: number | null;
  status: string | null;
  created_at: string;
  updated_at?: string | null;
  share_token?: string | null;
};

type TradeRow = {
  id: string;
  firebase_uid: string | null;
  user_id?: string | null;
  account_id: string | null;
  pair?: string | null;
  result?: string | null;
  pnl_amount?: number | string | null;
  lot_size?: number | string | null;
  entry_price?: number | string | null;
  stop_loss?: number | string | null;
  take_profit?: number | string | null;
  follow_plan?: boolean | null;
  created_at: string;
};

type ViewMode = "grid" | "table";
type FilterMode = "all" | "broker" | "propfirm" | "atrisk" | "profitable";

const currency = (value: number) => `$${value.toFixed(2)}`;

const shortCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const percent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const Accounts = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get("view");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [accountCategory, setAccountCategory] = useState<"broker" | "propfirm">(
    "broker"
  );
  const [dailyDrawdown, setDailyDrawdown] = useState("");
  const [maxDrawdown, setMaxDrawdown] = useState("");
  const [hasConsistency, setHasConsistency] = useState(false);
  const [consistencyValue, setConsistencyValue] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<
    "balance" | "pnl" | "winRate" | "trades" | "recent"
  >("recent");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { user, loading } = useAuth();

  const parseNumber = (value: number | string | null | undefined) =>
    Number(value || 0);

  const getAccountBaseType = (accountType?: string | null) => {
    if (!accountType) return "Broker";
    return accountType.startsWith("Prop Firm") ? "Prop Firm" : "Broker";
  };

  const getDDValues = (account: AccountRow) => {
    const ddMatch = account.account_type?.match(/DD:([\d.]+)%/);
    const maxDDMatch = account.account_type?.match(/MaxDD:([\d.]+)%/);
    const csMatch = account.account_type?.match(/CS:([\d.]+)%/);

    return {
      dailyDD: ddMatch ? parseFloat(ddMatch[1]) : Number(account.daily_drawdown || 0) || null,
      maxDD: maxDDMatch ? parseFloat(maxDDMatch[1]) : Number(account.max_drawdown || 0) || null,
      consistency: csMatch ? parseFloat(csMatch[1]) : null,
    };
  };

  const getHealthMeta = ({
    dailyRiskPct,
    maxRiskPct,
    breachedDaily,
    breachedMax,
  }: {
    dailyRiskPct: number;
    maxRiskPct: number;
    breachedDaily: boolean;
    breachedMax: boolean;
  }) => {
    const usedPct = Math.max(dailyRiskPct, maxRiskPct);
    const leadingMetric =
      dailyRiskPct >= maxRiskPct
        ? `Daily DD ${Math.min(dailyRiskPct, 999).toFixed(0)}% used`
        : `Max DD ${Math.min(maxRiskPct, 999).toFixed(0)}% used`;

    if (breachedDaily && breachedMax) {
      return {
        status: "breached",
        label: "Breached",
        badgeClass: "border-red-500/30 bg-red-500/15 text-red-400",
        cardClass:
          "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_0_30px_rgba(239,68,68,0.06)]",
        barClass: "bg-red-500",
        reason: "Daily and max drawdown exceeded",
      };
    }

    if (breachedDaily) {
      return {
        status: "breached",
        label: "Breached",
        badgeClass: "border-red-500/30 bg-red-500/15 text-red-400",
        cardClass:
          "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_0_30px_rgba(239,68,68,0.06)]",
        barClass: "bg-red-500",
        reason: "Daily drawdown exceeded",
      };
    }

    if (breachedMax) {
      return {
        status: "breached",
        label: "Breached",
        badgeClass: "border-red-500/30 bg-red-500/15 text-red-400",
        cardClass:
          "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_0_30px_rgba(239,68,68,0.06)]",
        barClass: "bg-red-500",
        reason: "Maximum drawdown exceeded",
      };
    }

    if (usedPct >= 80) {
      return {
        status: "danger",
        label: "Danger",
        badgeClass: "border-red-500/20 bg-red-500/10 text-red-400",
        cardClass: "border-red-500/20 bg-red-500/[0.02]",
        barClass: "bg-red-500",
        reason: leadingMetric,
      };
    }

    if (usedPct >= 50) {
      return {
        status: "warning",
        label: "Warning",
        badgeClass: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
        cardClass: "border-yellow-500/20 bg-yellow-500/[0.02]",
        barClass: "bg-yellow-500",
        reason: leadingMetric,
      };
    }

    return {
      status: "healthy",
      label: "Healthy",
      badgeClass: "border-green-500/20 bg-green-500/10 text-green-400",
      cardClass: "border-green-500/10 bg-green-500/[0.015]",
      barClass: "bg-green-500",
      reason: leadingMetric,
    };
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="p-10 text-center">Please login</div>;
  }

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<AccountRow[]>({
    queryKey: ["accounts", user?.id],
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

  const { data: trades = [] } = useQuery<TradeRow[]>({
    queryKey: ["trades", user?.id],
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

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!name.trim()) throw new Error("Account name is required");

      const bal = parseFloat(initialBalance) || 0;

      const typeStr =
        accountCategory === "propfirm"
          ? `Prop Firm${dailyDrawdown ? ` | DD:${dailyDrawdown}%` : ""}${
              maxDrawdown ? ` | MaxDD:${maxDrawdown}%` : ""
            }${
              hasConsistency && consistencyValue
                ? ` | CS:${consistencyValue}%`
                : ""
            }`
          : "Broker";

      const brokerValue = accountCategory === "propfirm" ? "Prop Firm" : "Broker";

      const { error } = await supabase.from("accounts").insert({
        firebase_uid: user.id,
        name: name.trim(),
        broker: brokerValue,
        account_type: typeStr,
        starting_balance: bal,
        current_balance: bal,
        daily_drawdown: parseFloat(dailyDrawdown) || 0,
        max_drawdown: parseFloat(maxDrawdown) || 0,
        status: "active",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created successfully");

      setName("");
      setInitialBalance("");
      setAccountCategory("broker");
      setDailyDrawdown("");
      setMaxDrawdown("");
      setHasConsistency(false);
      setConsistencyValue("");
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to create account"),
  });

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === viewId);
  }, [accounts, viewId]);

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },

    onSuccess: async (deletedId) => {
      if (selectedAccount?.id === deletedId) {
        setSearchParams({});
      }

      setSearchParams({});
      setDeleteDialogOpen(false);
      setAccountToDelete(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["trades"] }),
      ]);

      toast.success("Account deleted permanently");
    },

    onError: (err: any) => {
      toast.error(err.message || "Failed to delete account");
    },
  });

  const handleDeleteAccount = (id: string, name: string) => {
    setAccountToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    if (!accountToDelete) return;
    deleteAccount.mutate(accountToDelete.id);
  };

  const enhancedAccounts = useMemo(() => {
    return accounts.map((acc) => {
      const accTrades = trades
        .filter((t) => t.account_id === acc.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const initialBalanceValue = Number(acc.starting_balance || 0);
      const currentBalanceValue = Number(acc.current_balance || 0);
      const pnl = currentBalanceValue - initialBalanceValue;
      const pnlPercent =
        initialBalanceValue > 0 ? (pnl / initialBalanceValue) * 100 : 0;

      const wins = accTrades.filter((t) => t.result === "win").length;
      const losses = accTrades.filter((t) => t.result === "loss").length;
      const breakeven = accTrades.filter((t) => t.result === "breakeven").length;
      const winRate = accTrades.length > 0 ? (wins / accTrades.length) * 100 : 0;

      const totalLots = accTrades.reduce(
        (sum, t) => sum + parseNumber(t.lot_size),
        0
      );

      const profitTrades = accTrades.filter((t) => parseNumber(t.pnl_amount) > 0);
      const lossTrades = accTrades.filter((t) => parseNumber(t.pnl_amount) < 0);

      const avgProfit =
        profitTrades.length > 0
          ? profitTrades.reduce((sum, t) => sum + parseNumber(t.pnl_amount), 0) /
            profitTrades.length
          : 0;

      const avgLoss =
        lossTrades.length > 0
          ? Math.abs(
              lossTrades.reduce((sum, t) => sum + parseNumber(t.pnl_amount), 0) /
                lossTrades.length
            )
          : 0;

      const tradesWithRR = accTrades.filter(
        (t) => t.entry_price && t.stop_loss && t.take_profit
      );

      const avgRR =
        tradesWithRR.length > 0
          ? tradesWithRR.reduce((sum, t) => {
              const risk = Math.abs(
                parseNumber(t.entry_price) - parseNumber(t.stop_loss)
              );
              const reward = Math.abs(
                parseNumber(t.take_profit) - parseNumber(t.entry_price)
              );
              return sum + (risk > 0 ? reward / risk : 0);
            }, 0) / tradesWithRR.length
          : 0;

      const lastTrade = accTrades[0] || null;

      const recentPnls = [...accTrades]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .slice(-8)
        .map((t, index) => ({
          index,
          value: parseNumber(t.pnl_amount),
        }));

      let runningEquity = initialBalanceValue;
      const equitySeries = [...accTrades]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((t) => {
          runningEquity += parseNumber(t.pnl_amount);
          return {
            date: format(new Date(t.created_at), "MMM dd"),
            equity: runningEquity,
          };
        });

      const { dailyDD, maxDD, consistency } = getDDValues(acc);

      const todayTrades = accTrades.filter(
        (t) =>
          new Date(t.created_at).toDateString() === new Date().toDateString()
      );

      const todayLoss = Math.abs(
        todayTrades
          .filter((t) => parseNumber(t.pnl_amount) < 0)
          .reduce((sum, t) => sum + parseNumber(t.pnl_amount), 0)
      );

      const totalLoss = Math.abs(
        lossTrades.reduce((sum, t) => sum + parseNumber(t.pnl_amount), 0)
      );

      const dailyLimit = dailyDD ? initialBalanceValue * (dailyDD / 100) : 0;
      const maxLimit = maxDD ? initialBalanceValue * (maxDD / 100) : 0;

      const dailyRiskPct = dailyLimit > 0 ? (todayLoss / dailyLimit) * 100 : 0;
      const maxRiskPct = maxLimit > 0 ? (totalLoss / maxLimit) * 100 : 0;
      const riskPct = Math.max(dailyRiskPct, maxRiskPct);

      const breachedDaily = dailyLimit > 0 && todayLoss >= dailyLimit;
      const breachedMax = maxLimit > 0 && totalLoss >= maxLimit;
      const isBreached = breachedDaily || breachedMax;

      const isProp = acc.account_type?.startsWith("Prop Firm");
      const isAtRisk = isProp && riskPct >= 50 && riskPct < 100;

      const health = getHealthMeta({
        dailyRiskPct,
        maxRiskPct,
        breachedDaily,
        breachedMax,
      });

      return {
        ...acc,
        accTrades,
        initialBalanceValue,
        currentBalanceValue,
        pnl,
        pnlPercent,
        wins,
        losses,
        breakeven,
        winRate,
        totalLots,
        avgProfit,
        avgLoss,
        avgRR,
        lastTrade,
        recentPnls,
        equitySeries,
        isProp,
        dailyDD,
        maxDD,
        consistency,
        dailyLimit,
        maxLimit,
        todayLoss,
        totalLoss,
        dailyRiskPct,
        maxRiskPct,
        riskPct,
        isAtRisk,
        breachedDaily,
        breachedMax,
        isBreached,
        health,
      };
    });
  }, [accounts, trades]);

  const totalBalance = enhancedAccounts.reduce(
    (sum, acc) => sum + acc.currentBalanceValue,
    0
  );

  const totalStartingBalance = enhancedAccounts.reduce(
    (sum, acc) => sum + acc.initialBalanceValue,
    0
  );

  const totalPnl = totalBalance - totalStartingBalance;
  const totalPnlPercent =
    totalStartingBalance > 0 ? (totalPnl / totalStartingBalance) * 100 : 0;

  const profitableAccounts = enhancedAccounts.filter((acc) => acc.pnl >= 0).length;
  const atRiskAccounts = enhancedAccounts.filter(
    (acc) => acc.health.status === "warning" || acc.health.status === "danger"
  ).length;
  const breachedAccounts = enhancedAccounts.filter(
    (acc) => acc.health.status === "breached"
  ).length;
  const propAccounts = enhancedAccounts.filter((acc) => acc.isProp).length;
  const brokerAccounts = enhancedAccounts.filter((acc) => !acc.isProp).length;

  const bestAccount =
    enhancedAccounts.length > 0
      ? [...enhancedAccounts].sort((a, b) => b.pnlPercent - a.pnlPercent)[0]
      : null;

  const mostActiveAccount =
    enhancedAccounts.length > 0
      ? [...enhancedAccounts].sort((a, b) => b.accTrades.length - a.accTrades.length)[0]
      : null;

  const selectedEnhancedAccount = enhancedAccounts.find((a) => a.id === viewId);

  const filteredAccounts = useMemo(() => {
    let result = [...enhancedAccounts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (acc) =>
          acc.name.toLowerCase().includes(q) ||
          (acc.broker || "").toLowerCase().includes(q) ||
          (acc.account_type || "").toLowerCase().includes(q)
      );
    }

    if (filterMode === "broker") {
      result = result.filter((acc) => !acc.isProp);
    }

    if (filterMode === "propfirm") {
      result = result.filter((acc) => acc.isProp);
    }

    if (filterMode === "atrisk") {
      result = result.filter(
        (acc) => acc.health.status === "warning" || acc.health.status === "danger"
      );
    }

    if (filterMode === "profitable") {
      result = result.filter((acc) => acc.pnl >= 0);
    }

    result.sort((a, b) => {
      if (sortBy === "balance") return b.currentBalanceValue - a.currentBalanceValue;
      if (sortBy === "pnl") return b.pnlPercent - a.pnlPercent;
      if (sortBy === "winRate") return b.winRate - a.winRate;
      if (sortBy === "trades") return b.accTrades.length - a.accTrades.length;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [enhancedAccounts, search, filterMode, sortBy]);

  const overviewChartData = filteredAccounts.map((acc) => ({
    name: acc.name.length > 12 ? `${acc.name.slice(0, 12)}...` : acc.name,
    pnl: Number(acc.pnlPercent.toFixed(1)),
    balance: Number(acc.currentBalanceValue.toFixed(2)),
  }));

  const hasActiveFilters = search.trim() || filterMode !== "all";

  if (selectedEnhancedAccount) {
    const handleShareAccount = () => {
      if (selectedEnhancedAccount.share_token) {
        const url = `${window.location.origin}/shared/account/${selectedEnhancedAccount.share_token}`;
        navigator.clipboard.writeText(url);
        toast.success("Share link copied");
      } else {
        toast.info("Account sharing can be added in the next step");
      }
    };

    return (
      <>
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSearchParams({})}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {selectedEnhancedAccount.name}
                </h1>

                <span
                  className={`text-[10px] px-2 py-1 rounded-full border ${
                    selectedEnhancedAccount.isProp
                      ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/10"
                      : "border-primary/20 text-primary bg-primary/10"
                  }`}
                >
                  {getAccountBaseType(selectedEnhancedAccount.account_type)}
                </span>

                <span
                  className={`text-[10px] px-2 py-1 rounded-full border font-medium ${selectedEnhancedAccount.health.badgeClass}`}
                >
                  {selectedEnhancedAccount.health.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span>{selectedEnhancedAccount.broker || "—"}</span>
                <span>
                  Created {format(new Date(selectedEnhancedAccount.created_at), "MMM dd, yyyy")}
                </span>
                <span>
                  {selectedEnhancedAccount.lastTrade
                    ? `Last trade ${format(
                        new Date(selectedEnhancedAccount.lastTrade.created_at),
                        "MMM dd, HH:mm"
                      )}`
                    : "No trades yet"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleShareAccount}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDeleteAccount(selectedEnhancedAccount.id, selectedEnhancedAccount.name)
                }
                disabled={deleteAccount.isPending}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteAccount.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          {selectedEnhancedAccount.health.status === "breached" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Account breached
                </p>
                <p className="text-xs text-red-200/80 mt-1">
                  {selectedEnhancedAccount.health.reason}. This account has exceeded its
                  allowed risk parameters.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              {
                label: "Current Balance",
                value: currency(selectedEnhancedAccount.currentBalanceValue),
                icon: Wallet,
                color: "text-primary",
              },
              {
                label: "Net P&L",
                value: percent(selectedEnhancedAccount.pnlPercent),
                icon:
                  selectedEnhancedAccount.pnl >= 0 ? TrendingUp : TrendingDown,
                color: selectedEnhancedAccount.pnl >= 0 ? "text-green-500" : "text-red-500",
              },
              {
                label: "Win Rate",
                value: `${selectedEnhancedAccount.winRate.toFixed(0)}%`,
                icon: Target,
                color: "text-primary",
              },
              {
                label: "Trades",
                value: String(selectedEnhancedAccount.accTrades.length),
                icon: BarChart3,
                color: "text-muted-foreground",
              },
              {
                label: "Total Lots",
                value: selectedEnhancedAccount.totalLots.toFixed(2),
                icon: Activity,
                color: "text-primary",
              },
              {
                label: "Avg RR",
                value:
                  selectedEnhancedAccount.avgRR > 0
                    ? selectedEnhancedAccount.avgRR.toFixed(2)
                    : "—",
                icon: BadgeDollarSign,
                color: "text-primary",
              },
              {
                label: "Avg Profit",
                value: currency(selectedEnhancedAccount.avgProfit),
                icon: ArrowUpRight,
                color: "text-green-500",
              },
              {
                label: "Avg Loss",
                value: currency(selectedEnhancedAccount.avgLoss),
                icon: ArrowDownRight,
                color: "text-red-500",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-4 card-glow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="font-mono text-base sm:text-lg font-bold">
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 card-glow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">Equity Curve</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Growth path for this account
                  </p>
                </div>
                <div
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium ${selectedEnhancedAccount.health.badgeClass}`}
                >
                  {selectedEnhancedAccount.health.label}
                </div>
              </div>

              <div className="h-64">
                {selectedEnhancedAccount.equitySeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedEnhancedAccount.equitySeries}>
                      <defs>
                        <linearGradient id="accountEquityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="hsl(var(--primary))"
                        fill="url(#accountEquityFill)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                    No equity curve yet. Add trades to visualize account growth.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 card-glow">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Risk Snapshot</h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-background/50 border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Initial Balance</span>
                    <span className="text-sm font-mono">
                      {currency(selectedEnhancedAccount.initialBalanceValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current Balance</span>
                    <span className="text-sm font-mono">
                      {currency(selectedEnhancedAccount.currentBalanceValue)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-background/50 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Account Health</p>
                  <p
                    className={`text-sm font-semibold ${
                      selectedEnhancedAccount.health.status === "healthy"
                        ? "text-green-400"
                        : selectedEnhancedAccount.health.status === "warning"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedEnhancedAccount.health.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {selectedEnhancedAccount.health.reason}
                  </p>
                </div>

                {selectedEnhancedAccount.isProp &&
                  (selectedEnhancedAccount.dailyDD || selectedEnhancedAccount.maxDD) && (
                    <>
                      {selectedEnhancedAccount.dailyDD ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Daily DD Used</span>
                            <span className="font-mono">
                              {currency(selectedEnhancedAccount.todayLoss)} /{" "}
                              {currency(selectedEnhancedAccount.dailyLimit)}
                            </span>
                          </div>
                          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                selectedEnhancedAccount.breachedDaily
                                  ? "bg-red-500"
                                  : selectedEnhancedAccount.dailyRiskPct >= 80
                                  ? "bg-red-500"
                                  : selectedEnhancedAccount.dailyRiskPct >= 50
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(selectedEnhancedAccount.dailyRiskPct, 100)}%`,
                              }}
                            />
                          </div>
                          {selectedEnhancedAccount.breachedDaily && (
                            <p className="text-[11px] text-red-400 mt-1 font-medium">
                              Daily drawdown breached
                            </p>
                          )}
                        </div>
                      ) : null}

                      {selectedEnhancedAccount.maxDD ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Max DD Used</span>
                            <span className="font-mono">
                              {currency(selectedEnhancedAccount.totalLoss)} /{" "}
                              {currency(selectedEnhancedAccount.maxLimit)}
                            </span>
                          </div>
                          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                selectedEnhancedAccount.breachedMax
                                  ? "bg-red-500"
                                  : selectedEnhancedAccount.maxRiskPct >= 80
                                  ? "bg-red-500"
                                  : selectedEnhancedAccount.maxRiskPct >= 50
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(selectedEnhancedAccount.maxRiskPct, 100)}%`,
                              }}
                            />
                          </div>
                          {selectedEnhancedAccount.breachedMax && (
                            <p className="text-[11px] text-red-400 mt-1 font-medium">
                              Maximum drawdown breached
                            </p>
                          )}
                        </div>
                      ) : null}

                      {selectedEnhancedAccount.consistency ? (
                        <div className="rounded-lg bg-background/50 border border-border p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Consistency Rule
                            </span>
                            <span className="text-sm font-mono">
                              {selectedEnhancedAccount.consistency}%
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}

                {!selectedEnhancedAccount.isProp && (
                  <div className="rounded-lg bg-background/50 border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Account Type</p>
                    <p className="text-sm font-medium">
                      Broker account with standard tracking
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-background/50 border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Performance Mix</p>
                  <p className="text-sm font-medium">
                    {selectedEnhancedAccount.wins}W / {selectedEnhancedAccount.losses}L /{" "}
                    {selectedEnhancedAccount.breakeven} BE
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 card-glow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Trade History</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Recent trades for this account
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedEnhancedAccount.accTrades.length} total trade
                {selectedEnhancedAccount.accTrades.length === 1 ? "" : "s"}
              </div>
            </div>

            {selectedEnhancedAccount.accTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                      <th className="text-left py-3 pr-3">Date</th>
                      <th className="text-left py-3 pr-3">Pair</th>
                      <th className="text-left py-3 pr-3">Result</th>
                      <th className="text-right py-3 pr-3">P&L</th>
                      <th className="text-right py-3 pr-3">Lot</th>
                      <th className="text-center py-3">Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEnhancedAccount.accTrades.map((trade) => {
                      const pnlValue = parseNumber(trade.pnl_amount);
                      return (
                        <tr
                          key={trade.id}
                          className="border-b border-border/70 last:border-0 hover:bg-muted/5 transition-colors"
                        >
                          <td className="py-3 pr-3 font-mono text-xs">
                            {format(new Date(trade.created_at), "MMM dd, HH:mm")}
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs">
                            {trade.pair || "—"}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                trade.result === "win"
                                  ? "bg-green-500/10 text-green-500"
                                  : trade.result === "loss"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {trade.result || "—"}
                            </span>
                          </td>
                          <td
                            className={`py-3 pr-3 text-right font-mono ${
                              pnlValue >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {pnlValue >= 0 ? "+" : ""}
                            {currency(pnlValue)}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono">
                            {parseNumber(trade.lot_size).toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            {trade.follow_plan ? "✓" : "✗"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No trades for this account yet.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-left">Delete account?</DialogTitle>
              <DialogDescription className="text-left text-sm text-muted-foreground pt-2">
                {accountToDelete ? (
                  <>
                    You are about to permanently delete{" "}
                    <span className="font-semibold text-foreground">
                      "{accountToDelete.name}"
                    </span>
                    . This action cannot be undone. Once deleted, this account will
                    not come back again and there is no backup or recovery available.
                  </>
                ) : (
                  "This action cannot be undone."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-300">
              Warning: deleted account data is permanent.
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setAccountToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAccount}
                disabled={deleteAccount.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleteAccount.isPending ? "Deleting..." : "Yes, delete permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your trading workspaces, monitor risk, and track account performance
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["accounts"] });
                queryClient.invalidateQueries({ queryKey: ["trades"] });
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Account
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-card border-border max-w-sm max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Account</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Account Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Trading Account"
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Initial Balance ($)
                    </label>
                    <Input
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      placeholder="1000"
                      className="bg-background border-border font-mono"
                      type="number"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Account Type *
                    </label>
                    <Select
                      value={accountCategory}
                      onValueChange={(v: "broker" | "propfirm") => setAccountCategory(v)}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="propfirm">Prop Firm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <AnimatePresence>
                    {accountCategory === "propfirm" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Daily Drawdown %
                            </label>
                            <Input
                              value={dailyDrawdown}
                              onChange={(e) => setDailyDrawdown(e.target.value)}
                              placeholder="5"
                              className="bg-background border-border font-mono"
                              type="number"
                              step="0.1"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Max Drawdown %
                            </label>
                            <Input
                              value={maxDrawdown}
                              onChange={(e) => setMaxDrawdown(e.target.value)}
                              placeholder="10"
                              className="bg-background border-border font-mono"
                              type="number"
                              step="0.1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={hasConsistency}
                            onCheckedChange={(checked) =>
                              setHasConsistency(checked === true)
                            }
                            id="consistency"
                          />
                          <label
                            htmlFor="consistency"
                            className="text-xs text-muted-foreground"
                          >
                            Has consistency rule?
                          </label>
                        </div>

                        {hasConsistency && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Consistency Score Limit %
                            </label>
                            <Input
                              value={consistencyValue}
                              onChange={(e) => setConsistencyValue(e.target.value)}
                              placeholder="25"
                              className="bg-background border-border font-mono"
                              type="number"
                              step="1"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={() => createAccount.mutate()}
                    disabled={!user || createAccount.isPending}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {createAccount.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {accountsLoading ? (
          <div className="rounded-xl border border-border bg-card p-8 card-glow text-center">
            <p className="text-muted-foreground text-sm">Loading accounts...</p>
          </div>
        ) : accounts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Total Accounts
                  </span>
                  <Filter className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="font-mono text-xl font-bold">{accounts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {brokerAccounts} broker / {propAccounts} prop
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Total Balance
                  </span>
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="font-mono text-xl font-bold">
                  {shortCurrency(totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all accounts
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Net P&L
                  </span>
                  {totalPnl >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
                <div
                  className={`font-mono text-xl font-bold ${
                    totalPnl >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {percent(totalPnlPercent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currency(totalPnl)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Profitable
                  </span>
                  <Award className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="font-mono text-xl font-bold">{profitableAccounts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Positive P&L accounts
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    At Risk
                  </span>
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <div className="font-mono text-xl font-bold">{atRiskAccounts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Warning / danger
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Breached
                  </span>
                  <Shield className="h-3.5 w-3.5 text-red-500" />
                </div>
                <div className="font-mono text-xl font-bold">{breachedAccounts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk violated
                </p>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className="pl-9 bg-card border-border"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterMode} onValueChange={(v: FilterMode) => setFilterMode(v)}>
                  <SelectTrigger className="w-[140px] bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="propfirm">Prop Firm</SelectItem>
                    <SelectItem value="atrisk">At Risk</SelectItem>
                    <SelectItem value="profitable">Profitable</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(v: "balance" | "pnl" | "winRate" | "trades" | "recent") =>
                    setSortBy(v)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="pnl">P&L</SelectItem>
                    <SelectItem value="winRate">Win Rate</SelectItem>
                    <SelectItem value="trades">Trades</SelectItem>
                  </SelectContent>
                </Select>

                <div className="inline-flex rounded-lg border border-border bg-card p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 rounded-md transition ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-2 rounded-md transition ${
                      viewMode === "table"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Rows3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAccounts.length} of {accounts.length} account
                {accounts.length === 1 ? "" : "s"}
              </p>

              {(bestAccount || mostActiveAccount) && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {bestAccount && (
                    <span className="rounded-full border border-border px-3 py-1 bg-card">
                      Best: {bestAccount.name}
                    </span>
                  )}
                  {mostActiveAccount && (
                    <span className="rounded-full border border-border px-3 py-1 bg-card">
                      Most active: {mostActiveAccount.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <div className="mx-auto max-w-md">
                  <Search className="h-10 w-10 mx-auto text-primary mb-4" />
                  <h2 className="text-lg font-semibold">No matching accounts</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    No accounts match your current search or filter settings.
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearch("");
                        setFilterMode("all");
                        setSortBy("recent");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredAccounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 transition cursor-pointer group min-h-[250px] ${account.health.cardClass}`}
                    onClick={() => setSearchParams({ view: account.id })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold truncate">
                          {account.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {account.broker || "—"} • {getAccountBaseType(account.account_type)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${account.health.badgeClass}`}
                        >
                          {account.health.label}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account.id, account.name);
                          }}
                          className="rounded-lg border border-red-500/30 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition opacity-80 hover:opacity-100"
                          title="Delete account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
                        {currency(account.currentBalanceValue)}
                      </div>
                      <p
                        className={`mt-1.5 text-base font-medium ${
                          account.pnl >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {percent(account.pnlPercent)}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mt-5 text-xs">
                      <div>
                        <p className="text-muted-foreground">Initial</p>
                        <p className="font-mono font-medium mt-1">
                          {shortCurrency(account.initialBalanceValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className="font-mono font-medium mt-1">
                          {account.winRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trades</p>
                        <p className="font-mono font-medium mt-1">
                          {account.accTrades.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lots</p>
                        <p className="font-mono font-medium mt-1">
                          {account.totalLots.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {(account.dailyDD || account.maxDD) && (
                      <div className="mt-4 space-y-2.5">
                        {account.dailyDD ? (
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">Daily DD</span>
                              <span className="font-mono">
                                {Math.min(account.dailyRiskPct, 999).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full ${account.health.barClass}`}
                                style={{ width: `${Math.min(account.dailyRiskPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}

                        {account.maxDD ? (
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">Max DD</span>
                              <span className="font-mono">
                                {Math.min(account.maxRiskPct, 999).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  account.breachedMax
                                    ? "bg-red-500"
                                    : account.maxRiskPct >= 80
                                    ? "bg-red-500"
                                    : account.maxRiskPct >= 50
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(account.maxRiskPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        {account.lastTrade
                          ? `Last trade ${format(
                              new Date(account.lastTrade.created_at),
                              "MMM dd, HH:mm"
                            )}`
                          : "No trades yet"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Open</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                        <th className="text-left py-4 px-4">Account</th>
                        <th className="text-left py-4 px-4">Type</th>
                        <th className="text-right py-4 px-4">Balance</th>
                        <th className="text-right py-4 px-4">P&L</th>
                        <th className="text-right py-4 px-4">Win Rate</th>
                        <th className="text-right py-4 px-4">Trades</th>
                        <th className="text-left py-4 px-4">Health</th>
                        <th className="text-right py-4 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className="border-b border-border/70 last:border-0 hover:bg-muted/5 transition"
                        >
                          <td
                            className="py-4 px-4 cursor-pointer"
                            onClick={() => setSearchParams({ view: account.id })}
                          >
                            <div>
                              <p className="font-semibold">{account.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {account.broker || "—"}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getAccountBaseType(account.account_type)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono">
                            {currency(account.currentBalanceValue)}
                          </td>
                          <td
                            className={`py-4 px-4 text-right font-mono ${
                              account.pnl >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {percent(account.pnlPercent)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono">
                            {account.winRate.toFixed(0)}%
                          </td>
                          <td className="py-4 px-4 text-right font-mono">
                            {account.accTrades.length}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${account.health.badgeClass}`}
                            >
                              {account.health.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchParams({ view: account.id })}
                              >
                                Open
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAccount(account.id, account.name)}
                                disabled={deleteAccount.isPending}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {overviewChartData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 card-glow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Account Overview</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance and P&L distribution
                    </p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="pnl"
                        radius={[8, 8, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto max-w-md">
              <Zap className="h-10 w-10 mx-auto text-primary mb-4" />
              <h2 className="text-lg font-semibold">No accounts yet</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first broker or prop firm account to start tracking performance.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">Delete account?</DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground pt-2">
              {accountToDelete ? (
                <>
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    "{accountToDelete.name}"
                  </span>
                  . This action cannot be undone. Once deleted, this account will
                  not come back again and there is no backup or recovery available.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-300">
            Warning: deleted account data is permanent.
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAccountToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              disabled={deleteAccount.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteAccount.isPending ? "Deleting..." : "Yes, delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Accounts;