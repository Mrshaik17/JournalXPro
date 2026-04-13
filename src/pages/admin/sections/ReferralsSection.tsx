import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Plus,
  Search,
  Copy,
  Check,
  Users,
  DollarSign,
  Mail,
  Eye,
  Wallet,
  ShieldCheck,
  ShieldX,
  CircleDollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PaymentItem = {
  id?: string;
  amount?: number | string;
  status?: string;
  approved?: boolean;
  created_at?: string;
};

type ReferredUser = {
  id?: string;
  email?: string;
  name?: string;
  payments?: PaymentItem[];
};

type ReferralRow = {
  id: string;
  email?: string;
  name?: string;
  code?: string;
  commission_percent?: number | string;
  joined_users_count?: number | string;
  paid_users_count?: number | string;
  total_revenue?: number | string;
  total_paid?: number | string;
  paid_amount?: number | string;
  remaining_amount?: number | string;
  created_at?: string;
  is_active?: boolean;
  users?: ReferredUser[];

  // optional aliases from DB or old payloads
  idx?: number;
  commission?: number | string;
  total_users?: number | string;
  paid_users?: number | string;
  total_earnings?: number | string;
};

type Props = {
  referrals: ReferralRow[];
  refName: string;
  setRefName: (v: string) => void;
  refEmail: string;
  setRefEmail: (v: string) => void;
  refCode: string;
  setRefCode: (v: string) => void;
  refCommission: string | number;
  setRefCommission: (v: string) => void;
  createReferral: {
    mutate: () => void;
    isPending?: boolean;
  };
  deleteReferral: {
    mutate: (id: string) => void;
    isPending?: boolean;
  };
  updateReferral?: {
    mutate: (payload: any) => void;
    isPending?: boolean;
  };
  markReferralPaid?: {
    mutate: (payload: {
      id: string;
      paid_amount: number;
      remaining_amount: number;
    }) => void;
    isPending?: boolean;
  };
};

const toNumber = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const isApprovedPayment = (payment?: PaymentItem) => {
  if (!payment) return false;
  if (payment.approved === true) return true;
  const status = String(payment.status || "").toLowerCase();
  return status === "approved" || status === "paid" || status === "success";
};

const formatMoney = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function normalizeReferral(ref: ReferralRow): ReferralRow {
  return {
    ...ref,
    commission_percent:
      ref.commission_percent ?? ref.commission ?? 0,
    joined_users_count:
      ref.joined_users_count ?? ref.total_users ?? 0,
    paid_users_count:
      ref.paid_users_count ?? ref.paid_users ?? 0,
    total_revenue:
      ref.total_revenue ?? 0,
    total_paid:
      ref.total_paid ?? 0,
    paid_amount:
      ref.paid_amount ?? ref.total_paid ?? 0,
    remaining_amount:
      ref.remaining_amount ?? 0,
    is_active:
      typeof ref.is_active === "boolean"
        ? ref.is_active
        : String(ref.is_active) === "true",
    users: Array.isArray(ref.users) ? ref.users : [],
  };
}

function getReferralAnalytics(ref: ReferralRow) {
  const normalized = normalizeReferral(ref);
  const commission = toNumber(normalized.commission_percent);
  const users = Array.isArray(normalized.users) ? normalized.users : [];

  let totalUsers = 0;
  let paidUsers = 0;
  let totalRevenue = 0;
  let totalEarnings = 0;

  const paymentBreakdown: Array<{
    userEmail: string;
    paymentAmount: number;
    earning: number;
    createdAt?: string;
    status?: string;
  }> = [];

  for (const user of users) {
    totalUsers += 1;

    const approvedPayments = (user.payments || []).filter(isApprovedPayment);

    if (approvedPayments.length > 0) {
      paidUsers += 1;
    }

    for (const payment of approvedPayments) {
      const amount = toNumber(payment.amount);
      const earning = (amount * commission) / 100;

      totalRevenue += amount;
      totalEarnings += earning;

      paymentBreakdown.push({
        userEmail: user.email || "Unknown user",
        paymentAmount: amount,
        earning,
        createdAt: payment.created_at,
        status: payment.status,
      });
    }
  }

  const fallbackTotalUsers = toNumber(normalized.joined_users_count);
  const fallbackPaidUsers = toNumber(normalized.paid_users_count);
  const fallbackRevenue = toNumber(normalized.total_revenue);
  const fallbackEarnings = toNumber(
    (normalized as any).total_earnings ?? normalized.total_paid
  );
  const paidAmount = toNumber(normalized.paid_amount || normalized.total_paid);
  const remainingAmount = Math.max(
    toNumber(normalized.remaining_amount) ||
      (totalEarnings || fallbackEarnings) - paidAmount,
    0
  );

  return {
    totalUsers: totalUsers || fallbackTotalUsers,
    paidUsers: paidUsers || fallbackPaidUsers,
    totalRevenue: totalRevenue || fallbackRevenue,
    totalEarnings: totalEarnings || fallbackEarnings,
    paidAmount,
    remainingAmount,
    paymentBreakdown,
    users,
    commission,
  };
}

export default function ReferralsSection({
  referrals,
  refName,
  setRefName,
  refEmail,
  setRefEmail,
  refCode,
  setRefCode,
  refCommission,
  setRefCommission,
  createReferral,
  deleteReferral,
  updateReferral,
  markReferralPaid,
}: Props) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<ReferralRow | null>(null);

  // local fallback cache so table does not disappear if parent query is broken momentarily
  const [localReferrals, setLocalReferrals] = useState<ReferralRow[]>([]);

  useEffect(() => {
    if (Array.isArray(referrals) && referrals.length > 0) {
      const normalized = referrals.map(normalizeReferral);
      setLocalReferrals(normalized);
    }
  }, [referrals]);

  const displayReferrals = useMemo(() => {
    if (Array.isArray(referrals) && referrals.length > 0) {
      return referrals.map(normalizeReferral);
    }
    return localReferrals.map(normalizeReferral);
  }, [referrals, localReferrals]);

  const filteredReferrals = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayReferrals;

    return displayReferrals.filter((ref) => {
      return (
        (ref.name || "").toLowerCase().includes(q) ||
        (ref.code || "").toLowerCase().includes(q) ||
        (ref.email || "").toLowerCase().includes(q)
      );
    });
  }, [displayReferrals, search]);

  const dashboardTotals = useMemo(() => {
    return displayReferrals.reduce(
      (acc, ref) => {
        const a = getReferralAnalytics(ref);
        acc.totalReferrals += 1;
        acc.totalUsers += a.totalUsers;
        acc.totalRevenue += a.totalRevenue;
        acc.totalEarnings += a.totalEarnings;
        acc.totalPaid += a.paidAmount;
        return acc;
      },
      {
        totalReferrals: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalEarnings: 0,
        totalPaid: 0,
      }
    );
  }, [displayReferrals]);

  const copyCode = async (id: string, code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const emailTemplate = (ref: ReferralRow) => `
Subject: Your Prop Firm Referral Code - ${ref.code || "N/A"}

Hi ${ref.name || "Partner"},

Thanks for joining our referral program.

Your unique referral code: ${ref.code || "N/A"}
Commission: ${toNumber(ref.commission_percent)}%

Share this code to earn commission from approved referred payments.

Best regards,
Prop Firm Team
  `.trim();

  const handleToggleStatus = (ref: ReferralRow) => {
    if (!updateReferral) return;

    const nextActive = !(ref.is_active ?? true);

    setLocalReferrals((prev) =>
      prev.map((item) =>
        item.id === ref.id ? { ...item, is_active: nextActive } : item
      )
    );

    updateReferral.mutate({
      id: ref.id,
      is_active: nextActive,
    });
  };

  const handleMarkAsPaid = (ref: ReferralRow) => {
    const analytics = getReferralAnalytics(ref);
    const newPaidAmount = analytics.totalEarnings;
    const newRemainingAmount = 0;

    setLocalReferrals((prev) =>
      prev.map((item) =>
        item.id === ref.id
          ? {
              ...item,
              paid_amount: newPaidAmount,
              remaining_amount: newRemainingAmount,
            }
          : item
      )
    );

    if (markReferralPaid) {
      markReferralPaid.mutate({
        id: ref.id,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
      });
      return;
    }

    if (updateReferral) {
      updateReferral.mutate({
        id: ref.id,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
      });
    }
  };

  const handleCreate = () => {
    if (
      !refEmail ||
      !refCode ||
      refCommission === "" ||
      refEmail.trim() === "" ||
      refCode.trim() === ""
    ) {
      alert("Fill all fields");
      return;
    }

    createReferral.mutate();
  };

  const createDisabled =
    !!createReferral?.isPending ||
    !refEmail?.trim() ||
    !refCode?.trim() ||
    refCommission === "" ||
    Number(refCommission) <= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="group rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Referrals
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {dashboardTotals.totalReferrals}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Users
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {dashboardTotals.totalUsers}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {formatMoney(dashboardTotals.totalRevenue)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Earnings
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {formatMoney(dashboardTotals.totalEarnings)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-6 py-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Total Paid
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(dashboardTotals.totalPaid)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-card/90 to-card/50 p-6 shadow-2xl border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Create New Referral</h3>
            <p className="text-sm text-muted-foreground">
              Add email, referral name, code, and commission percentage.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
              Email
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={refEmail || ""}
              onChange={(e) => setRefEmail(e.target.value)}
              className="h-12 rounded-3xl border-0 bg-background/90 shadow-lg"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
              Referral Name
            </label>
            <Input
              placeholder="Referral name"
              value={refName || ""}
              onChange={(e) => setRefName(e.target.value)}
              className="h-12 rounded-3xl border-0 bg-background/90 shadow-lg"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
              Code
            </label>
            <Input
              placeholder="CODE123"
              value={refCode || ""}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="h-12 rounded-3xl border-0 bg-background/90 shadow-lg font-mono uppercase"
            />
          </div>

          <div className="relative">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
              Commission
            </label>
            <Input
              type="number"
              placeholder="10"
              value={refCommission || ""}
              onChange={(e) => setRefCommission(e.target.value)}
              className="h-12 rounded-3xl border-0 bg-background/90 shadow-lg pr-10"
            />
            <span className="absolute right-4 top-[42px] -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleCreate}
              disabled={createDisabled}
              className="h-12 rounded-3xl px-6 bg-primary text-white w-full"
            >
              {createReferral?.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-card/80 to-card/30 shadow-2xl border-0 overflow-hidden backdrop-blur-xl">
        <div className="p-6 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Referral Records</h3>
              <p className="text-sm text-muted-foreground">
                Search, inspect, copy, track payouts, and manage referral records.
              </p>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email, name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-3xl border-0 bg-background/80 pl-11 shadow-lg focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1450px]">
            <thead>
              <tr className="bg-background/70 backdrop-blur-sm border-0">
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Code</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Commission</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Users</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Paid Users</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Revenue</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Earnings</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Paid Out</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Remaining</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground/90">Created</th>
                <th className="text-center px-6 py-4 font-semibold text-foreground/90">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReferrals.map((ref) => {
                const analytics = getReferralAnalytics(ref);
                const active = ref.is_active ?? true;

                return (
                  <tr
                    key={ref.id}
                    className="hover:bg-secondary/40 transition-all duration-200 border-0"
                  >
                    <td className="px-6 py-5 font-medium text-foreground max-w-[220px] truncate">
                      {ref.email || "—"}
                    </td>

                    <td className="px-6 py-5 font-medium">
                      {ref.name || "—"}
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => copyCode(ref.id, ref.code)}
                        className="inline-flex items-center gap-2 rounded-3xl bg-background/80 hover:bg-background px-4 py-2.5 font-mono text-sm font-semibold text-foreground shadow-md hover:shadow-lg transition-all duration-200 border-0"
                      >
                        <span>{ref.code || "—"}</span>
                        {copiedId === ref.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground/70" />
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(ref)}
                        disabled={!updateReferral?.mutate}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                          active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {active ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <ShieldX className="h-4 w-4" />
                        )}
                        {active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm">
                        {toNumber(ref.commission_percent)}%
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-medium tabular-nums">
                      {analytics.totalUsers}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium tabular-nums">
                      {analytics.paidUsers}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium tabular-nums">
                      {formatMoney(analytics.totalRevenue)}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatMoney(analytics.totalEarnings)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatMoney(analytics.paidAmount)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-medium tabular-nums">
                      {formatMoney(
                        Math.max(analytics.totalEarnings - analytics.paidAmount, 0) ||
                          analytics.remainingAmount
                      )}
                    </td>

                    <td className="px-6 py-5 text-xs text-muted-foreground font-mono">
                      {formatDate(ref.created_at)}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog
                          open={selectedReferral?.id === ref.id}
                          onOpenChange={(open) => {
                            if (!open) setSelectedReferral(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReferral(ref)}
                              className="h-10 w-10 rounded-2xl hover:bg-primary/10 p-0 border-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="rounded-3xl max-w-5xl border-0 bg-card/95 backdrop-blur-xl">
                            <DialogHeader>
                              <DialogTitle>
                                Referral Details — {ref.name || ref.code || "Referral"}
                              </DialogTitle>
                              <DialogDescription>
                                Users, paid users, revenue, earnings, payout status, and payment breakdown.
                              </DialogDescription>
                            </DialogHeader>

                            <ReferralDetailsContent
                              referral={ref}
                              analytics={analytics}
                              onMarkAsPaid={() => handleMarkAsPaid(ref)}
                              canMarkPaid={!!markReferralPaid || !!updateReferral}
                              markLoading={
                                markReferralPaid?.isPending || updateReferral?.isPending
                              }
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={showEmailModal === ref.id}
                          onOpenChange={(open) => !open && setShowEmailModal(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 rounded-2xl hover:bg-primary/10 p-0 border-0"
                              onClick={() => setShowEmailModal(ref.id)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="rounded-3xl max-w-2xl border-0 bg-card/95 backdrop-blur-xl">
                            <DialogHeader>
                              <DialogTitle>Send Welcome Email</DialogTitle>
                              <DialogDescription>
                                Pre-filled email template for {ref.name || "this referral"}.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                              <div className="bg-muted/20 p-4 rounded-2xl font-mono text-sm border-0">
                                <pre className="whitespace-pre-wrap">
                                  {emailTemplate(ref)}
                                </pre>
                              </div>

                              <div className="flex gap-3 pt-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(emailTemplate(ref));
                                    setShowEmailModal(null);
                                  }}
                                  className="flex-1 rounded-2xl border-0"
                                >
                                  Copy Email
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowEmailModal(null)}
                                  className="flex-1 rounded-2xl border-0"
                                >
                                  Send Later
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsPaid(ref)}
                          className="h-10 w-10 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-600 p-0 border-0"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocalReferrals((prev) => prev.filter((item) => item.id !== ref.id));
                            deleteReferral.mutate(ref.id);
                          }}
                          className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive p-0 border-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredReferrals.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-16 w-16 text-muted-foreground/50" />
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-1">
                          No Referrals Yet
                        </p>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          No referral rows are reaching this component right now. If your DB already has data,
                          the parent query or RLS policy is likely returning an empty array.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredReferrals.length > 0 && (
          <div className="px-6 py-4 text-center text-xs text-muted-foreground bg-background/60 border-0">
            <span className="font-mono tabular-nums">
              Showing {filteredReferrals.length} of {displayReferrals.length} referral records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReferralDetailsContent({
  referral,
  analytics,
  onMarkAsPaid,
  canMarkPaid,
  markLoading,
}: {
  referral: ReferralRow;
  analytics: ReturnType<typeof getReferralAnalytics>;
  onMarkAsPaid: () => void;
  canMarkPaid: boolean;
  markLoading?: boolean;
}) {
  const remaining = Math.max(analytics.totalEarnings - analytics.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Total Users
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {analytics.totalUsers}
          </p>
        </div>

        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Paid Users
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {analytics.paidUsers}
          </p>
        </div>

        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Total Revenue
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(analytics.totalRevenue)}
          </p>
        </div>

        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Total Earnings
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {formatMoney(analytics.totalEarnings)}
          </p>
        </div>

        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Remaining Amount
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(remaining)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-background/50 p-5 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-semibold">Referral Summary</h4>
            <p className="text-sm text-muted-foreground">
              Code: <span className="font-mono">{referral.code || "—"}</span>, commission:{" "}
              {toNumber(referral.commission_percent)}%, status:{" "}
              {referral.is_active ?? true ? "Active" : "Inactive"}.
            </p>
          </div>

          <Button
            type="button"
            onClick={onMarkAsPaid}
            disabled={!canMarkPaid || remaining <= 0 || markLoading}
            className="rounded-2xl border-0"
          >
            {markLoading ? "Updating..." : "Mark as Paid"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-background/50 p-5 shadow-lg">
          <h4 className="font-semibold mb-3">User Emails</h4>

          {analytics.users.length > 0 ? (
  <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
    {analytics.users.map((user, index) => {
      const approvedPayment = (user.payments || []).find(isApprovedPayment);

      return (
        <div
          key={user.id || `${user.email}-${index}`}
          className="rounded-2xl bg-background/70 px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium">
            {user.email || "No email"}
          </span>

          <span className="text-xs">
  {approvedPayment ? (
    <span className="text-green-400">
      {approvedPayment.plan ? (
        <>
          <span className="capitalize">{approvedPayment.plan}</span> • ${approvedPayment.amount}
        </>
      ) : (
        <>${approvedPayment.amount}</>
      )}
    </span>
  ) : (
    <span className="text-red-400">Unpaid</span>
  )}
</span>
        </div>
      );
    })}
  </div>
) : (
  <p className="text-sm text-muted-foreground">
    No user list connected yet. This usually means referrals, profiles, and payments
    are not fully joined in the query.
  </p>
)}
        </div>

        <div className="rounded-2xl bg-background/50 p-5 shadow-lg">
          <h4 className="font-semibold mb-3">Payment Breakdown</h4>

          {analytics.paymentBreakdown.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {analytics.paymentBreakdown.map((item, index) => (
                <div
                  key={`${item.userEmail}-${item.paymentAmount}-${index}`}
                  className="rounded-2xl bg-background/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.userEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)} {item.status ? `• ${item.status}` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMoney(item.paymentAmount)}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                        Earned {formatMoney(item.earning)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No approved payment breakdown found for this referral yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}