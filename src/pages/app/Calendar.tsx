import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: news = [] } = useQuery({
    queryKey: ["news-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month
  const startDay = monthStart.getDay();
  const paddedDays = Array.from({ length: startDay }, (_, i) => null).concat(days as any[]);

  const getNewsForDate = (date: Date) => news.filter((n: any) => isSameDay(new Date(n.created_at), date));
  const selectedNews = selectedDate ? getNewsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Market news by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-semibold uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dayNews = getNewsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative p-2 rounded-md text-sm transition-all min-h-[48px] ${
                    isSelected ? "bg-primary/20 border border-primary" :
                    isToday ? "bg-primary/5 border border-primary/30" :
                    "hover:bg-secondary border border-transparent"
                  }`}
                >
                  <span className={`text-xs ${isToday ? "text-primary font-bold" : ""}`}>{format(day, "d")}</span>
                  {dayNews.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayNews.slice(0, 3).map((_, j) => (
                        <span key={j} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date News */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </h3>
          <AnimatePresence mode="wait">
            <motion.div key={selectedDate?.toISOString() || "none"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {selectedNews.length > 0 ? selectedNews.map((n: any) => (
                <div key={n.id} className="p-3 rounded border border-border bg-background">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">{n.category}</span>
                    {(n as any).asset_name && <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{(n as any).asset_name}</span>}
                  </div>
                  <h4 className="text-sm font-semibold">{n.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.content}</p>
                  {n.source && <p className="text-[10px] text-muted-foreground mt-1 font-mono">Source: {n.source}</p>}
                </div>
              )) : (
                <div className="text-center py-8">
                  <Newspaper className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{selectedDate ? "No news for this date" : "Click a date to view news"}</p>
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
