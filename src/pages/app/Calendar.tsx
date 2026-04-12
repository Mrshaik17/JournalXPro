import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";

const Calendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const { data: news = [] } = useQuery({
    queryKey: ["news-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: trades = [] } = useQuery({
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }, () => null).concat(days as any[]);

  const getTradeDate = (trade: any) => {
    return new Date(trade.trade_date || trade.created_at);
  };

  const getNewsForDate = (date: Date) =>
    news.filter((n: any) => isSameDay(new Date(n.created_at), date));

  const getTradesForDate = (date: Date) =>
    trades.filter((t: any) => isSameDay(getTradeDate(t), date));

  const getDayPnl = (date: Date) => {
    const dayTrades = getTradesForDate(date);
    if (dayTrades.length === 0) return null;

    return dayTrades.reduce(
      (sum: number, trade: any) => sum + Number(trade.pnl_amount || 0),
      0
    );
  };

  const monthTrades = useMemo(() => {
    return trades.filter((t: any) => isSameMonth(getTradeDate(t), currentMonth));
  }, [trades, currentMonth]);

  const tradingDaysInMonth = useMemo(() => {
    const uniqueDays = new Set(
      monthTrades.map((trade: any) =>
        format(getTradeDate(trade), "yyyy-MM-dd")
      )
    );
    return uniqueDays.size;
  }, [monthTrades]);

  const monthPnl = useMemo(() => {
    return monthTrades.reduce(
      (sum: number, trade: any) => sum + Number(trade.pnl_amount || 0),
      0
    );
  }, [monthTrades]);

  const dailyPnlMap = useMemo(() => {
    const map = new Map<string, number>();

    monthTrades.forEach((trade: any) => {
      const key = format(getTradeDate(trade), "yyyy-MM-dd");
      map.set(key, (map.get(key) || 0) + Number(trade.pnl_amount || 0));
    });

    return map;
  }, [monthTrades]);

  const bestDay = useMemo(() => {
    if (dailyPnlMap.size === 0) return null;

    let best: { date: string; pnl: number } | null = null;
    dailyPnlMap.forEach((pnl, date) => {
      if (!best || pnl > best.pnl) best = { date, pnl };
    });
    return best;
  }, [dailyPnlMap]);

  const profitableDays = useMemo(() => {
    let count = 0;
    dailyPnlMap.forEach((pnl) => {
      if (pnl > 0) count += 1;
    });
    return count;
  }, [dailyPnlMap]);

  const currentStreak = useMemo(() => {
    const sortedEntries = Array.from(dailyPnlMap.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );

    let streak = 0;
    for (const [, pnl] of sortedEntries) {
      if (pnl > 0) streak += 1;
      else break;
    }
    return streak;
  }, [dailyPnlMap]);

  const monthNewsCount = useMemo(() => {
    return news.filter((n: any) =>
      isSameMonth(new Date(n.created_at), currentMonth)
    ).length;
  }, [news, currentMonth]);

  const selectedDayTrades = selectedDate ? getTradesForDate(selectedDate) : [];
  const selectedDayPnl = selectedDate ? getDayPnl(selectedDate) : null;
  const selectedDayNewsCount = selectedDate ? getNewsForDate(selectedDate).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily P&amp;L overview, trades, and market context
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentMonth(new Date());
            setSelectedDate(new Date());
          }}
          className="w-fit"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Month P&amp;L</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold tracking-tight ${
              monthPnl >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Trading Days</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {tradingDaysInMonth}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {monthTrades.length} trade{monthTrades.length !== 1 ? "s" : ""} logged
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Top Profit Day</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight">
            {bestDay ? format(new Date(bestDay.date), "MMM d") : "—"}
          </div>
          <p className="mt-1 text-xs text-emerald-500 font-mono">
            {bestDay ? `+$${bestDay.pnl.toFixed(2)}` : "No profitable day yet"}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Streak</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {currentStreak}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            profitable day{currentStreak !== 1 ? "s" : ""} in a row
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Track daily performance and market activity
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-xl"
              >
                Current Month
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <motion.div
            key={format(currentMonth, "yyyy-MM")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-7 gap-2"
          >
            {paddedDays.map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[94px] rounded-2xl"
                  />
                );
              }

              const dayNews = getNewsForDate(day);
              const dayPnl = getDayPnl(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, new Date());
              const dayTrades = getTradesForDate(day);

              const pnlTone =
                dayPnl === null
                  ? "bg-background/40"
                  : dayPnl >= 0
                  ? "bg-emerald-500/5"
                  : "bg-red-500/5";

              const selectedTone = isSelected
                ? "ring-2 ring-primary/40 bg-primary/10 shadow-sm"
                : isToday
                ? "ring-1 ring-primary/30"
                : "hover:bg-background/70";

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`group relative min-h-[94px] rounded-2xl p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${pnlTone} ${selectedTone}`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/70 text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {dayNews.length > 0 && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                        {dayNews.length}N
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    {dayPnl !== null ? (
                      <div
                        className={`text-[11px] font-mono font-semibold ${
                          dayPnl >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">No P&amp;L</div>
                    )}

                    <div className="text-[10px] text-muted-foreground">
                      {dayTrades.length > 0
                        ? `${dayTrades.length} trade${dayTrades.length !== 1 ? "s" : ""}`
                        : "No trades"}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-1">
                      {dayNews.slice(0, 3).map((_: any, j: number) => (
                        <span
                          key={j}
                          className="h-1.5 w-1.5 rounded-full bg-primary/80"
                        />
                      ))}
                    </div>

                    {dayPnl !== null && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          dayPnl >= 0 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>

          <div className="mt-5 rounded-2xl bg-background/40 p-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Profitable day
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Losing day
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                News available
              </div>
              <div className="ml-auto flex flex-wrap gap-3">
                <span>{tradingDaysInMonth} active days</span>
                <span>{profitableDays} green days</span>
                <span>{monthNewsCount} news</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a date"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Review day performance and activity
            </p>
          </div>

          {!selectedDate ? (
            <div className="py-12 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Click a date to view trades
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="pt-4 space-y-4"
              >
                <div
                  className={`rounded-2xl p-4 ${
                    selectedDayPnl === null
                      ? "bg-background/50"
                      : selectedDayPnl >= 0
                      ? "bg-emerald-500/5"
                      : "bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Day P&amp;L</span>
                    <TrendingUp
                      className={`h-4 w-4 ${
                        selectedDayPnl !== null && selectedDayPnl >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    />
                  </div>

                  <div
                    className={`mt-2 text-2xl font-bold tracking-tight ${
                      selectedDayPnl === null
                        ? "text-foreground"
                        : selectedDayPnl >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {selectedDayPnl === null
                      ? "No trades"
                      : `${selectedDayPnl >= 0 ? "+" : ""}$${selectedDayPnl.toFixed(2)}`}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedDayTrades.length} trade
                    {selectedDayTrades.length !== 1 ? "s" : ""}
                    {selectedDayNewsCount > 0 ? ` • ${selectedDayNewsCount} news` : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Trades
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedDayTrades.length} total
                    </span>
                  </div>

                  {selectedDayTrades.length > 0 ? (
                    selectedDayTrades.map((trade: any) => (
                      <div
                        key={trade.id}
                        className="rounded-2xl bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              {trade.pair || "—"}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                              {trade.direction || "—"} • {trade.result || "—"}
                            </div>
                          </div>

                          <div
                            className={`text-sm font-semibold font-mono ${
                              Number(trade.pnl_amount) >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {Number(trade.pnl_amount) >= 0 ? "+" : ""}$
                            {Number(trade.pnl_amount || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-background/40 p-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        No trades recorded for this date
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;