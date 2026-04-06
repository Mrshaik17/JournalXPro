import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
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
} from "date-fns";

const Calendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    queryKey: ["trades-calendar", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("firebase_uid", user.uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.uid,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }, () => null).concat(
    days as any[]
  );

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

  const selectedNews = selectedDate ? getNewsForDate(selectedDate) : [];
  const selectedDayTrades = selectedDate ? getTradesForDate(selectedDate) : [];
  const selectedDayPnl = selectedDate ? getDayPnl(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily P&amp;L overview &amp; market news
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-muted-foreground font-semibold uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;

              const dayNews = getNewsForDate(day);
              const dayPnl = getDayPnl(day);
              const isSelected = selectedDate
                ? isSameDay(day, selectedDate)
                : false;
              const isToday = isSameDay(day, new Date());
              const dayTrades = getTradesForDate(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative p-2 rounded-md text-sm transition-all min-h-[72px] flex flex-col items-center justify-start ${
                    isSelected
                      ? "bg-primary/20 border border-primary"
                      : isToday
                      ? "bg-primary/5 border border-primary/30"
                      : "hover:bg-secondary border border-transparent"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isToday ? "text-primary font-bold" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {dayPnl !== null && (
                    <span
                      className={`text-[9px] font-mono mt-1 ${
                        dayPnl >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}
                    </span>
                  )}

                  {dayTrades.length > 0 && (
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {dayTrades.length}T
                    </span>
                  )}

                  {dayNews.length > 0 && (
                    <div className="flex gap-0.5 mt-auto pt-1">
                      {dayNews.slice(0, 3).map((_: any, j: number) => (
                        <span
                          key={j}
                          className="h-1 w-1 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">
            {selectedDate
              ? format(selectedDate, "MMMM d, yyyy")
              : "Select a date"}
          </h3>

          {selectedDate && selectedDayPnl !== null && (
            <div
              className={`mb-4 p-3 rounded border ${
                selectedDayPnl >= 0
                  ? "border-success/20 bg-success/5"
                  : "border-destructive/20 bg-destructive/5"
              }`}
            >
              <div className="text-xs text-muted-foreground">Day P&amp;L</div>
              <div
                className={`font-mono text-lg font-bold ${
                  selectedDayPnl >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {selectedDayPnl >= 0 ? "+" : ""}${selectedDayPnl.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedDayTrades.length} trade
                {selectedDayTrades.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {selectedDate && selectedDayTrades.length > 0 && (
            <div className="mb-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Trades
              </h4>

              {selectedDayTrades.map((trade: any) => (
                <div
                  key={trade.id}
                  className="p-3 rounded border border-border bg-background"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">
                        {trade.pair || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {trade.direction || "—"} • {trade.result || "—"}
                      </div>
                    </div>

                    <div
                      className={`font-mono text-sm font-semibold ${
                        Number(trade.pnl_amount) >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {Number(trade.pnl_amount) >= 0 ? "+" : ""}$
                      {Number(trade.pnl_amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate?.toISOString() || "none"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {selectedNews.length > 0 ? (
                selectedNews.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded border border-border bg-background"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {n.category}
                      </span>

                      {n.asset_name && (
                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {n.asset_name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.content}
                    </p>

                    {n.source && (
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        Source: {n.source}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {selectedDate
                      ? "No news for this date"
                      : "Click a date to view news"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Calendar;