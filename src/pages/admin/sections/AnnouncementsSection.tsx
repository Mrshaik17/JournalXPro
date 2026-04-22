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
  Pencil,
  X,
  Link as LinkIcon,
  Eye,
  EyeOff,
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
  announcements = [],
  announcementTitle,
  setAnnouncementTitle,
  announcementContent,
  setAnnouncementContent,
  announcementType,
  setAnnouncementType,
  announcementLink,
  setAnnouncementLink,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  deleteAnnouncement,
  editingAnnouncement,
  startEditAnnouncement,
  cancelEditAnnouncement,
}: any) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredAnnouncements = useMemo(() => {
    const q = search.trim().toLowerCase();

    return announcements.filter((item: any) => {
      const matchesSearch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.content || "").toLowerCase().includes(q) ||
        (item.link || "").toLowerCase().includes(q);

      const matchesType =
        filterType === "all" ||
        (item.type || "update").toLowerCase() === filterType;

      return matchesSearch && matchesType;
    });
  }, [announcements, search, filterType]);

  const stats = useMemo(() => {
    return {
      total: announcements.length,
      active: announcements.filter((a: any) => a.is_active !== false).length,
      disabled: announcements.filter((a: any) => a.is_active === false).length,
      giveaways: announcements.filter((a: any) => a.type === "giveaway").length,
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

  const handleSubmit = () => {
    if (editingAnnouncement?.id) {
      updateAnnouncement?.mutate({
        id: editingAnnouncement.id,
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
        link: announcementLink,
        is_active: editingAnnouncement.is_active !== false,
      });
      return;
    }

    createAnnouncement?.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Announcements
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Active
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Disabled
          </p>
          <p className="mt-2 text-xl font-semibold text-muted-foreground tabular-nums">
            {stats.disabled}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Giveaways
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.giveaways}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {editingAnnouncement ? "Edit Announcement" : "Company Announcement"}
            </h3>
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

          <Input
            type="url"
            placeholder="Optional link, example: https://example.com"
            value={announcementLink}
            onChange={(e) => setAnnouncementLink(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={announcementType} onValueChange={setAnnouncementType}>
              <SelectTrigger className="h-11 w-full rounded-xl border-0 bg-background/70 shadow-none sm:w-52">
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

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {editingAnnouncement && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditAnnouncement}
                  className="h-11 rounded-xl px-5"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                className="h-11 rounded-xl px-5"
                disabled={!!createAnnouncement?.isPending || !!updateAnnouncement?.isPending}
              >
                {editingAnnouncement ? "Update Announcement" : "Publish Announcement"}
              </Button>
            </div>
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title, content, or link"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-background/70 shadow-none sm:w-44">
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
            const isEditing = editingAnnouncement?.id === item.id;
            const isActive = item.is_active !== false;

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-background/40 p-4 transition-colors hover:bg-background/55 ${
                  isEditing ? "ring-1 ring-primary/40" : ""
                } ${!isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
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

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {item.content}
                    </p>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 break-all text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {item.link}
                      </a>
                    )}

                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toggleAnnouncementStatus?.mutate({
                          id: item.id,
                          is_active: !isActive,
                        })
                      }
                      className="h-9 rounded-xl px-3"
                      disabled={!!toggleAnnouncementStatus?.isPending}
                    >
                      {isActive ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>

                    <button
                      onClick={() => startEditAnnouncement?.(item)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => deleteAnnouncement?.mutate(item.id)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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