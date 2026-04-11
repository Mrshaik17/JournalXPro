import { useMemo, useState } from "react";
import { Search, X, Eye, CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PaymentsSection({
  payments,
  profiles,
  updatePaymentStatus,
  exportData,
}: any) {
  const [rangeFilter, setRangeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const now = new Date();
  let since = new Date(0);

  if (rangeFilter === "week") since = new Date(now.getTime() - 7 * 86400000);
  if (rangeFilter === "month") since = new Date(now.getTime() - 30 * 86400000);
  if (rangeFilter === "3month") since = new Date(now.getTime() - 90 * 86400000);
  if (rangeFilter === "6month") since = new Date(now.getTime() - 180 * 86400000);

  const getProfile = (userId: string) =>
    profiles.find((pr: any) => pr.id === userId);

  const filtered = useMemo(() => {
    return payments.filter((p: any) => {
      const profile = getProfile(p.user_id);
      const email = profile?.email || "";
      const name = profile?.full_name || "";

      const inRange = new Date(p.created_at) >= since;
      const matchesStatus =
        statusFilter === "all" || (p.status || "").toLowerCase() === statusFilter;
      const matchesPlan =
        planFilter === "all" || (p.requested_plan || "").toLowerCase() === planFilter;
      const matchesMethod =
        methodFilter === "all" || (p.method || "").toLowerCase() === methodFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        (p.transaction_id || "").toLowerCase().includes(q) ||
        (p.method || "").toLowerCase().includes(q) ||
        (p.requested_plan || "").toLowerCase().includes(q) ||
        String(p.amount || "").toLowerCase().includes(q) ||
        String(p.amount_inr || "").toLowerCase().includes(q) ||
        (p.user_id || "").toLowerCase().includes(q);

      return inRange && matchesStatus && matchesPlan && matchesMethod && matchesSearch;
    });
  }, [payments, profiles, since, search, statusFilter, planFilter, methodFilter]);

  const approvedPayments = useMemo(() => {
    return filtered.filter((p: any) => p.status === "approved");
  }, [filtered]);

  const stats = useMemo(() => {
    const approvedUsd = approvedPayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    const approvedInr = approvedPayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount_inr || 0),
      0
    );

    const approvedCount = approvedPayments.length;
    const pendingCount = filtered.filter((p: any) => p.status === "pending").length;
    const rejectedCount = filtered.filter((p: any) => p.status === "rejected").length;

    return {
      approvedUsd,
      approvedInr,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalVisible: filtered.length,
    };
  }, [filtered, approvedPayments]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setMethodFilter("all");
    setRangeFilter("all");
  };

  const rangeTabs = ["all", "week", "month", "3month", "6month"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-card/70 border border-border/60 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Approved Revenue
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-xl font-semibold tabular-nums">
              ${stats.approvedUsd.toFixed(2)}
            </span>
            {stats.approvedInr > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ₹{stats.approvedInr.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card/70 border border-border/60 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Approved Payments
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.approvedCount}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 border border-border/60 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Pending Review
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.pendingCount}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 border border-border/60 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Rejected
          </p>
          <p className="mt-2 text-xl font-semibold text-destructive tabular-nums">
            {stats.rejectedCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {rangeTabs.map((f) => (
              <button
                key={f}
                onClick={() => setRangeFilter(f)}
                className={`h-9 rounded-xl px-3 text-xs font-medium transition-colors ${
                  rangeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "3month"
                  ? "3 months"
                  : f === "6month"
                  ? "6 months"
                  : f}
              </button>
            ))}

            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl text-xs"
                onClick={() => exportData("pdf", rangeFilter)}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl text-xs"
                onClick={() => exportData("excel", rangeFilter)}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Excel
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, name, txn id, amount, method, or plan"
                className="h-10 rounded-xl border-border/60 bg-background pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[130px] rounded-xl border-border/60 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-10 w-[130px] rounded-xl border-border/60 bg-background">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="pro_plus">Pro+</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-10 w-[130px] rounded-xl border-border/60 bg-background">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>

              {(search ||
                statusFilter !== "all" ||
                planFilter !== "all" ||
                methodFilter !== "all" ||
                rangeFilter !== "all") && (
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl px-3 text-xs"
                  onClick={clearFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/70">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <tr className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Method</th>
              <th className="text-left px-4 py-3 font-medium">TXN ID</th>
              <th className="text-left px-4 py-3 font-medium">Screenshot</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p: any) => {
              const profile = getProfile(p.user_id);

              return (
                <tr
                  key={p.id}
                  className="group hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {profile?.email || `${p.user_id.slice(0, 8)}...`}
                      </span>
                      {profile?.full_name && (
                        <span className="text-xs text-muted-foreground">
                          {profile.full_name}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="font-medium tabular-nums">
                      ${Number(p.amount || 0).toFixed(2)}
                    </div>
                    {!!p.amount_inr && (
                      <div className="text-xs text-muted-foreground tabular-nums">
                        ₹{Number(p.amount_inr).toFixed(0)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground">
                      {(p.requested_plan || "—").replace("_", "+")}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground uppercase">
                    {p.method || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[140px] truncate font-mono text-xs text-foreground/85"
                      title={p.transaction_id || "—"}
                    >
                      {p.transaction_id || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {p.screenshot_url ? (
                      <a
                        href={p.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : p.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {new Date(p.created_at).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {p.status === "pending" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Select
                          onValueChange={(plan) =>
                            updatePaymentStatus.mutate({
                              id: p.id,
                              status: "approved",
                              userId: p.user_id,
                              plan,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[110px] rounded-xl border-emerald-500/30 bg-background text-xs text-emerald-400">
                            <SelectValue placeholder="Approve" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="pro_plus">Pro+</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl border-destructive/30 px-3 text-xs text-destructive"
                          onClick={() =>
                            updatePaymentStatus.mutate({
                              id: p.id,
                              status: "rejected",
                              userId: p.user_id,
                            })
                          }
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : p.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                >
                  No payments match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="text-center text-xs text-muted-foreground tabular-nums">
          Showing {filtered.length} of {payments.length} payments
        </div>
      )}
    </div>
  );
}