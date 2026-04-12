import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Megaphone,
  Gift,
  Trophy,
  AlertTriangle,
  Bell,
  Sparkles,
  CalendarDays,
  Inbox,
} from "lucide-react";

const typeIcon: Record<string, any> = {
  update: Bell,
  giveaway: Gift,
  winner: Trophy,
  maintenance: AlertTriangle,
};

const typeStyles: Record<
  string,
  {
    iconColor: string;
    iconBg: string;
    badge: string;
    label: string;
  }
> = {
  update: {
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    badge: "bg-primary/10 text-primary border-primary/20",
    label: "Update",
  },
  giveaway: {
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    label: "Giveaway",
  },
  winner: {
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Winner",
  },
  maintenance: {
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Maintenance",
  },
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRelative = (date: string) => {
  const now = new Date().getTime();
  const created = new Date(date).getTime();
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

const Announcements = () => {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const latestAnnouncement = announcements[0];

  const counts = announcements.reduce(
    (acc: Record<string, number>, item: any) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-card/80 p-6 sm:p-7"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary border border-primary/15">
              <Megaphone className="h-3.5 w-3.5" />
              Team Feed
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight flex items-center gap-2">
              Announcements
            </h1>

            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Stay updated with product changes, giveaways, winner posts, and important maintenance notices.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-background/70 px-4 py-3 min-w-[120px]">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Total Posts
              </div>
              <div className="mt-1 text-lg font-bold">{announcements.length}</div>
            </div>

            <div className="rounded-2xl bg-background/70 px-4 py-3 min-w-[150px]">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Latest Update
              </div>
              <div className="mt-1 text-sm font-semibold truncate max-w-[140px]">
                {latestAnnouncement ? latestAnnouncement.title : "No updates yet"}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {announcements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Live feed
          </div>

          {Object.entries(counts).map(([type, count]) => {
            const style = typeStyles[type] || typeStyles.update;
            return (
              <div
                key={type}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${style.badge}`}
              >
                <span>{style.label}</span>
                <span className="font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card/70 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-4 w-56 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-4/5 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((a: any, i: number) => {
            const Icon = typeIcon[a.type] || Bell;
            const style = typeStyles[a.type] || typeStyles.update;

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-2xl bg-card/85 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconBg} ${style.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${style.badge}`}
                      >
                        {style.label}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(a.created_at)}
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        • {formatRelative(a.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {a.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground whitespace-pre-line">
                      {a.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-card/75 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Inbox className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-base font-semibold tracking-tight">
            No announcements yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            There are no team updates right now. New announcements, giveaway posts, winners, and maintenance notices will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Announcements;