import { useMemo, useState } from "react";
import {
  Mail,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: string;
  created_at: string;
  updated_at?: string;
};

type ContactInboxSectionProps = {
  contactMessages: ContactMessage[];
  updateContactStatus: (payload: { id: string; status: string }) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  viewContactMessage?: (message: ContactMessage) => void;
};

export default function ContactInboxSection({
  contactMessages = [],
  updateContactStatus,
  deleteContactMessage,
  viewContactMessage,
}: ContactInboxSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const normalizedMessages = useMemo(() => {
    return contactMessages.map((msg) => ({
      ...msg,
      status: (msg.status || "unread").toLowerCase(),
    }));
  }, [contactMessages]);

  const searchedMessages = useMemo(() => {
    const q = search.trim().toLowerCase();

    return normalizedMessages.filter((msg) => {
      const matchesSearch =
        !q ||
        (msg.name || "").toLowerCase().includes(q) ||
        (msg.email || "").toLowerCase().includes(q) ||
        (msg.subject || "").toLowerCase().includes(q) ||
        (msg.message || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ? true : msg.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedMessages, search, statusFilter]);

  const stats = useMemo(() => {
    const total = normalizedMessages.length;
    const unread = normalizedMessages.filter((m) => m.status === "unread").length;
    const resolved = normalizedMessages.filter((m) => m.status === "resolved").length;
    const archived = normalizedMessages.filter((m) => m.status === "archived").length;

    return { total, unread, resolved, archived };
  }, [normalizedMessages]);

  const getStatusUI = (status: string) => {
    switch ((status || "unread").toLowerCase()) {
      case "resolved":
        return {
          badge: "bg-emerald-500/10 text-emerald-400",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: "Resolved",
        };
      case "archived":
        return {
          badge: "bg-muted/50 text-muted-foreground",
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Archived",
        };
      default:
        return {
          badge: "bg-amber-500/10 text-amber-400",
          icon: <Mail className="h-3.5 w-3.5" />,
          label: "Unread",
        };
    }
  };

  const handleViewMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    viewContactMessage?.(msg);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setActionLoadingId(id);
      await updateContactStatus({ id, status });
      setSelectedMessage((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (msg: ContactMessage) => {
    if (!confirm(`Delete message from ${msg.name}?`)) return;

    try {
      setActionLoadingId(msg.id);
      await deleteContactMessage(msg.id);

      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(null);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderRow = (msg: ContactMessage) => {
    const statusUI = getStatusUI(msg.status || "unread");
    const isBusy = actionLoadingId === msg.id;

    return (
      <div key={msg.id} className="group hover:bg-secondary/30 transition-all p-4">
        <div className="hidden xl:grid grid-cols-[180px_220px_200px_300px_auto_120px_160px] gap-4 items-start py-3">
          <div className="font-medium text-foreground text-sm break-words">
            {msg.name}
          </div>

          <div className="font-mono text-sm text-muted-foreground truncate">
            {msg.email}
          </div>

          <div className="font-medium text-foreground line-clamp-1">
            {msg.subject}
          </div>

          <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {msg.message}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {statusUI.icon}
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusUI.badge}`}
            >
              {statusUI.label}
            </span>
          </div>

          <div className="text-sm text-muted-foreground font-mono tabular-nums pt-1">
            {new Date(msg.created_at).toLocaleDateString("en-IN")}
          </div>

          <div className="flex items-center gap-2 justify-center pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-primary group-hover:scale-105 transition-all"
              onClick={() => handleViewMessage(msg)}
              disabled={isBusy}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {msg.status !== "resolved" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-all"
                onClick={() => handleStatusUpdate(msg.id, "resolved")}
                disabled={isBusy}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}

            {msg.status !== "archived" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-muted text-muted-foreground group-hover:scale-105 transition-all"
                onClick={() => handleStatusUpdate(msg.id, "archived")}
                disabled={isBusy}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 text-destructive group-hover:scale-105 transition-all"
              onClick={() => handleDelete(msg)}
              disabled={isBusy}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="xl:hidden space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground text-sm">{msg.name}</p>
              <p className="text-xs text-muted-foreground break-all">{msg.email}</p>
            </div>

            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusUI.badge}`}
            >
              {statusUI.label}
            </span>
          </div>

          <div>
            <p className="font-medium text-foreground line-clamp-1">{msg.subject}</p>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mt-1">
              {msg.message}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground font-mono tabular-nums">
              {new Date(msg.created_at).toLocaleDateString("en-IN")}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-primary"
                onClick={() => handleViewMessage(msg)}
                disabled={isBusy}
              >
                <Eye className="h-4 w-4" />
              </Button>

              {msg.status !== "resolved" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-500/10 text-emerald-500"
                  onClick={() => handleStatusUpdate(msg.id, "resolved")}
                  disabled={isBusy}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}

              {msg.status !== "archived" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl hover:bg-muted text-muted-foreground"
                  onClick={() => handleStatusUpdate(msg.id, "archived")}
                  disabled={isBusy}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 text-destructive"
                onClick={() => handleDelete(msg)}
                disabled={isBusy}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Messages
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Unread
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.unread}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Resolved
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.resolved}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Archived
          </p>
          <p className="mt-2 text-xl font-semibold text-muted-foreground tabular-nums">
            {stats.archived}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/75 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, subject, or message"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl bg-background/70 shadow-sm pl-10 focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl bg-background/70 shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl px-3 text-xs bg-background/70 shadow-sm hover:bg-background/90"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {searchedMessages.length > 0 ? (
        <div className="rounded-2xl bg-card/70 shadow-sm overflow-hidden">
          <div className="bg-card/80 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                Contact Messages
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {searchedMessages.length}
              </span>
            </div>
          </div>

          <div className="hidden xl:block bg-card/60 px-6 py-3">
            <div className="grid grid-cols-[180px_220px_200px_300px_auto_120px_160px] gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
              <span>Name</span>
              <span>Email</span>
              <span>Subject</span>
              <span>Preview</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-center">Actions</span>
            </div>
          </div>

          <div className="divide-y divide-border/20">
            {searchedMessages.map(renderRow)}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card/70 shadow-sm">
          <div className="py-20 text-center">
            <Mail className="mx-auto h-16 w-16 mb-6 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "No messages match your filters"
                  : "No contact messages yet"}
              </p>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                Contact form submissions from your website will appear here when users reach out.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-5 border-b border-border/50">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold break-words">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 break-all">
                  {selectedMessage.name} • {selectedMessage.email}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {new Date(selectedMessage.created_at).toLocaleString("en-IN")}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl ml-3 shrink-0"
                onClick={() => setSelectedMessage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm leading-7 whitespace-pre-wrap break-words text-foreground">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-border/50">
              {selectedMessage.status !== "resolved" && (
                <Button
                  type="button"
                  onClick={async () => {
                    await handleStatusUpdate(selectedMessage.id, "resolved");
                  }}
                >
                  Mark Resolved
                </Button>
              )}

              {selectedMessage.status !== "archived" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    await handleStatusUpdate(selectedMessage.id, "archived");
                  }}
                >
                  Archive
                </Button>
              )}

              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  await handleDelete(selectedMessage);
                }}
              >
                Delete
              </Button>

              <Button type="button" variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}