import { useMemo, useState } from "react";
import {
  Trash2,
  Megaphone,
  Search,
  Gift,
  Rocket,
  Wrench,
  BellRing,
  Sparkles,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnnouncementsSection({
  announcements,
  announcementTitle,
  setAnnouncementTitle,
  announcementContent,
  setAnnouncementContent,
  announcementType,
  setAnnouncementType,
  createAnnouncement,
  deleteAnnouncement,
}: any) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredAnnouncements = useMemo(() => {
    const q = search.trim().toLowerCase();

    return announcements.filter((item: any) => {
      const matchesSearch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.content || "").toLowerCase().includes(q);

      const matchesType =
        filterType === "all" ||
        (item.type || "update").toLowerCase() === filterType;

      return matchesSearch && matchesType;
    });
  }, [announcements, search, filterType]);

  const stats = useMemo(() => {
    return {
      total: announcements.length,
      giveaways: announcements.filter((a: any) => a.type === "giveaway").length,
      launches: announcements.filter((a: any) => a.type === "launch").length,
      comingSoon: announcements.filter((a: any) => a.type === "coming_soon").length,
    };
  }, [announcements]);

  const getTypeUI = (type: string) => {
    switch (type) {
      case "giveaway":
        return {
          badge: "bg-amber-500/10 text-amber-400",
          icon: <Gift className="h-4 w-4 text-amber-400" />,
          label: "Giveaway",
        };
      case "launch":
        return {
          badge: "bg-emerald-500/10 text-emerald-400",
          icon: <Rocket className="h-4 w-4 text-emerald-400" />,
          label: "Launch",
        };
      case "coming_soon":
        return {
          badge: "bg-violet-500/10 text-violet-400",
          icon: <Sparkles className="h-4 w-4 text-violet-400" />,
          label: "Coming Soon",
        };
      case "maintenance":
        return {
          badge: "bg-orange-500/10 text-orange-400",
          icon: <Wrench className="h-4 w-4 text-orange-400" />,
          label: "Maintenance",
        };
      case "alert":
        return {
          badge: "bg-destructive/10 text-destructive",
          icon: <BellRing className="h-4 w-4 text-destructive" />,
          label: "Alert",
        };
      default:
        return {
          badge: "bg-primary/10 text-primary",
          icon: <Building2 className="h-4 w-4 text-primary" />,
          label: "Update",
        };
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Announcements
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Giveaways
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.giveaways}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Launches
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.launches}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Coming Soon
          </p>
          <p className="mt-2 text-xl font-semibold text-violet-400 tabular-nums">
            {stats.comingSoon}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Company Announcement</h3>
            <p className="text-xs text-muted-foreground">
              Publish giveaways, launches, updates, alerts, and teaser posts.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Announcement title"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />

          <Textarea
            placeholder="Write the company announcement here..."
            value={announcementContent}
            onChange={(e) => setAnnouncementContent(e.target.value)}
            className="min-h-[150px] rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={announcementType} onValueChange={setAnnouncementType}>
              <SelectTrigger className="h-11 w-full sm:w-52 rounded-xl border-0 bg-background/70 shadow-none">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="giveaway">Giveaway</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => createAnnouncement.mutate()}
              className="h-11 rounded-xl px-5"
            >
              Publish Announcement
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 shadow-sm">
        <div className="p-4 pb-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Company Feed</h3>
              <p className="text-xs text-muted-foreground">
                Manage public company updates and internal release messaging.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title or content"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border-0 bg-background/70 shadow-none">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="giveaway">Giveaway</SelectItem>
                  <SelectItem value="launch">Launch</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4">
          {filteredAnnouncements.map((item: any) => {
            const ui = getTypeUI(item.type || "update");

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-background/40 p-4 transition-colors hover:bg-background/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {ui.icon}
                        <h4 className="text-sm font-semibold text-foreground">
                          {item.title}
                        </h4>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${ui.badge}`}
                      >
                        {ui.label}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {item.content}
                    </p>

                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(item.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteAnnouncement.mutate(item.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAnnouncements.length === 0 && (
            <div className="rounded-2xl bg-background/40 px-6 py-12 text-center text-sm text-muted-foreground">
              {search || filterType !== "all"
                ? "No announcements match your filters."
                : "No company announcements yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}