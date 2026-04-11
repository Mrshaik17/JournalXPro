import { useMemo, useState } from "react";
import {
  Mail,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
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

export default function ContactInboxSection({
  contactMessages,
  updateContactStatus,
  deleteContactMessage,
  viewContactMessage,
}: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contactMessages.filter((msg: any) => {
      const matchesSearch =
        !q ||
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || msg.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contactMessages, search, statusFilter]);

  const stats = useMemo(() => {
    const total = contactMessages.length;
    const unread = contactMessages.filter((m: any) => m.status === "unread").length;
    const replied = contactMessages.filter((m: any) => m.status === "replied").length;
    const archived = contactMessages.filter((m: any) => m.status === "archived").length;

    return { total, unread, replied, archived };
  }, [contactMessages]);

  const getStatusUI = (status: string) => {
    switch (status.toLowerCase()) {
      case "replied":
        return {
          badge: "bg-emerald-500/10 text-emerald-400",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case "archived":
        return {
          badge: "bg-muted/50 text-muted-foreground",
          icon: <Clock className="h-3.5 w-3.5" />,
        };
      default:
        return {
          badge: "bg-amber-500/10 text-amber-400",
          icon: <Mail className="h-3.5 w-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
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
            Replied
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.replied}
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

      {/* Filters & Search - NO BORDERS */}
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
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all") && (
              <Button
                variant="ghost"
                className="h-10 rounded-xl px-3 text-xs bg-background/70 shadow-sm hover:bg-background/90"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages List - NO WHITE BORDERS OR LINES */}
      <div className="rounded-2xl bg-card/70 shadow-sm overflow-hidden">
        <div className="bg-card/80 px-6 py-4 shadow-sm">
          <div className="grid grid-cols-[180px_220px_200px_300px_auto_120px_100px] gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
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
          {filteredMessages.map((msg: any) => {
            const statusUI = getStatusUI(msg.status || "unread");

            return (
              <div
                key={msg.id}
                className="group hover:bg-secondary/30 transition-all p-4"
              >
                <div className="grid grid-cols-[180px_220px_200px_300px_auto_120px_100px] gap-4 items-start py-3">
                  <div className="font-medium text-foreground text-sm">{msg.name}</div>

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
                      {msg.status || "Unread"}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground font-mono tabular-nums pt-1">
                    {new Date(msg.created_at).toLocaleDateString("en-IN")}
                  </div>

                  <div className="flex items-center gap-2 justify-center pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-primary group-hover:scale-105 transition-all"
                      onClick={() => viewContactMessage(msg.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 text-destructive group-hover:scale-105 transition-all"
                      onClick={() => {
                        if (confirm(`Delete message from ${msg.name}?`)) {
                          deleteContactMessage(msg.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMessages.length === 0 && (
            <div className="py-20 text-center">
              <Mail className="mx-auto h-16 w-16 mb-6 text-muted-foreground/50" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">
                  {search || statusFilter !== "all" 
                    ? "No messages match your filters" 
                    : "No contact messages yet"
                  }
                </p>
                <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                  Contact form submissions from your website will appear here when users reach out.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredMessages.length > 0 && filteredMessages.length !== contactMessages.length && (
        <div className="text-center text-xs text-muted-foreground tabular-nums bg-card/50 py-3 rounded-xl">
          Showing {filteredMessages.length} of {contactMessages.length} messages
        </div>
      )}
    </div>
  );
}