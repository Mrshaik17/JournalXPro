
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/dialog";

type PaymentItem = {
  id?: string;
  amount?: number | string;
  status?: string;
  approved?: boolean;
  created_at?: string;
  plan?: string;
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
  createReferral?: {
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
    commission_percent: ref.commission_percent ?? ref.commission ?? 0,
    joined_users_count: ref.joined_users_count ?? ref.total_users ?? 0,
    paid_users_count: ref.paid_users_count ?? ref.paid_users ?? 0,
    total_revenue: ref.total_revenue ?? 0,
    total_paid: ref.total_paid ?? 0,
    paid_amount: ref.paid_amount ?? ref.total_paid ?? 0,
    remaining_amount: ref.remaining_amount ?? 0,
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
  let calculatedEarnings = 0;

  const paymentBreakdown: Array<{
    userEmail: string;
    paymentAmount: number;
    earning: number;
    createdAt?: string;
    status?: string;
    plan?: string;
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
      calculatedEarnings += earning;

      paymentBreakdown.push({
        userEmail: user.email || "Unknown user",
        paymentAmount: amount,
        earning,
        createdAt: payment.created_at,
        status: payment.status,
        plan: payment.plan,
      });
    }
  }

  // ✅ ALWAYS TRUST DB IF EXISTS
  const totalEarnings = toNumber(normalized.total_earnings) || calculatedEarnings;
const paidAmount = toNumber(normalized.total_paid) || 0;


  const remainingAmount = Math.max(totalEarnings - paidAmount, 0);

  return {
    totalUsers: totalUsers || toNumber(normalized.joined_users_count),
    paidUsers: paidUsers || toNumber(normalized.paid_users_count),
    totalRevenue: totalRevenue || toNumber(normalized.total_revenue),
    totalEarnings,
    paidAmount,
    remainingAmount,
    paymentBreakdown,
    users,
    commission,
  };
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
  const remaining = analytics.remainingAmount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
            Total Paid
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(analytics.paidAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-background/60 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Remaining Amount
          </p>
          <p
            className={`mt-2 text-2xl font-semibold tabular-nums ${
              remaining > 0
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
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
          <h4 className="mb-3 font-semibold">Users Who Used This Referral</h4>

          {analytics.paymentBreakdown.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
              {analytics.paymentBreakdown.map((item, index) => (
                <div
                  key={`${item.userEmail}-${item.paymentAmount}-${index}`}
                  className="rounded-2xl bg-background/70 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.userEmail}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.plan ? `Plan: ${item.plan}` : "Plan: —"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.createdAt ? formatDate(item.createdAt) : "—"}
                        {item.status ? ` • ${item.status}` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(item.paymentAmount)}
                      </p>
                      <p className="text-xs tabular-nums text-amber-600 dark:text-amber-400">
                        Earned {formatMoney(item.earning)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No approved users/payments found for this referral yet.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-background/50 p-5 shadow-lg">
          <h4 className="mb-3 font-semibold">All Referred Users</h4>

          {analytics.users.length > 0 ? (
            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {analytics.users.map((user, index) => {
                const approvedPayments = (user.payments || []).filter(isApprovedPayment);
                const totalPaidByUser = approvedPayments.reduce(
                  (sum, payment) => sum + toNumber(payment.amount),
                  0
                );

                return (
                  <div
                    key={user.id || `${user.email}-${index}`}
                    className="rounded-2xl bg-background/70 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.email || "No email"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {approvedPayments.length > 0
                          ? `${approvedPayments.length} approved payment(s)`
                          : "Unpaid user"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {approvedPayments.length > 0 ? (
                        <>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatMoney(totalPaidByUser)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Paid
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-red-500">Unpaid</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No referred user list connected yet. This usually means referrals,
              profiles, and payments are not fully joined in the query.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useQueryClient } from "@tanstack/react-query";

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

  const queryClient = useQueryClient(); // ✅ CORRECT PLACE

  // rest of your code...
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<ReferralRow | null>(null);
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
    console.log("FULL REFERRALS FROM DB:", displayReferrals);
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

  const copyCode = useCallback(async (id: string, code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }, []);

  const emailTemplate = useCallback((ref: ReferralRow) => {
    return `
Subject: Your Prop Firm Referral Code - ${ref.code || "N/A"}

Hi ${ref.name || "Partner"},

Thanks for joining our referral program.

Your unique referral code: ${ref.code || "N/A"}
Commission: ${toNumber(ref.commission_percent)}%

Share this code to earn commission from approved referred payments.

Best regards,
Prop Firm Team
    `.trim();
  }, []);

  const handleToggleStatus = useCallback(
    (ref: ReferralRow) => {
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
    },
    [updateReferral]
  );

  const handleMarkAsPaid = useCallback(
  async (ref: ReferralRow) => {
    const analytics = getReferralAnalytics(ref);

    const totalEarnings = analytics.totalEarnings;
    const alreadyPaid = analytics.paidAmount;
    const remaining = totalEarnings - alreadyPaid;

    if (remaining <= 0) {
      alert("Nothing to pay");
      return;
    }

    // ✅ Insert payout record
    const { error: payoutError } = await supabase.from("payouts").insert({
      referral_id: ref.id,
      amount: remaining,
    });

    if (payoutError) {
      console.error(payoutError);
      alert("Error saving payout ❌");
      return;
    }

    // ✅ IMPORTANT FIX: increment total_paid (NOT overwrite blindly)
    const newPaidTotal = alreadyPaid + remaining;

    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        total_paid: newPaidTotal,
        total_earnings: totalEarnings, // keep consistent
      })
      .eq("id", ref.id);

    if (updateError) {
      console.error(updateError);
      alert("Error updating ❌");
      return;
    }

    // ✅ update local state properly
    setLocalReferrals((prev) =>
      prev.map((item) =>
        item.id === ref.id
          ? {
              ...item,
              total_paid: newPaidTotal,
              total_earnings: totalEarnings,
            }
          : item
      )
    );

    setSelectedReferral((prev) =>
      prev?.id === ref.id
        ? {
            ...prev,
            total_paid: newPaidTotal,
            total_earnings: totalEarnings,
          }
        : prev
    );

    alert("Paid successfully ✅");
    
  },
  []
);

  const handleCreate = useCallback(async () => {
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

    const payload: any = {
      email: refEmail.trim(),
      code: refCode.trim().toUpperCase(),
      commission_percent: Number(refCommission),
      is_active: true,
    };

    if (refName?.trim()) {
      payload.name = refName.trim();
    }

    const { data, error } = await supabase
      .from("referrals")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error creating referral ❌");
      return;
    }

    if (data) {
      const normalized = normalizeReferral(data as ReferralRow);
      setLocalReferrals((prev) => [normalized, ...prev]);
    }

    setRefName("");
    setRefEmail("");
    setRefCode("");
    setRefCommission("");

    alert("Referral created ✅");
  }, [
    refEmail,
    refCode,
    refCommission,
    refName,
    setRefCode,
    setRefCommission,
    setRefEmail,
    setRefName,
  ]);

  const createDisabled =
    !!createReferral?.isPending ||
    !refEmail?.trim() ||
    !refCode?.trim() ||
    refCommission === "" ||
    Number(refCommission) <= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Referrals
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {dashboardTotals.totalReferrals}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Users
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {dashboardTotals.totalUsers}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(dashboardTotals.totalRevenue)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-card to-card/60 px-6 py-5 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Total Earnings
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(dashboardTotals.totalEarnings)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-6 py-5 shadow-xl">
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

      <div className="rounded-3xl bg-gradient-to-br from-card/80 to-card/30 shadow-2xl border-0 overflow-hidden backdrop-blur-xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
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
              className="h-11 rounded-3xl border-0 bg-background/80 pl-11 shadow-lg"
            />
          </div>
        </div>

        {filteredReferrals.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-semibold text-foreground mb-1">No Referrals Yet</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No referral rows are reaching this component right now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredReferrals.map((ref) => {
                const analytics = getReferralAnalytics(ref);
                const active = ref.is_active ?? true;
                const conversion =
                  analytics.totalUsers > 0
                    ? Math.round((analytics.paidUsers / analytics.totalUsers) * 100)
                    : 0;

                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className="cursor-pointer rounded-3xl border border-border/40 bg-background/70 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-semibold text-foreground">
                          {ref.name || "Unnamed Referral"}
                        </h4>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {ref.email || "—"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(ref);
                        }}
                        disabled={!updateReferral?.mutate}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
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
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground shadow-sm">
                        {ref.code || "—"}
                      </span>

                      <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
                        {toNumber(ref.commission_percent)}%
                      </span>

                      <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 shadow-sm">
                        {conversion}% conversion
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Total Users
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {analytics.totalUsers}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Paid Users
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {analytics.paidUsers}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Revenue
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                          {formatMoney(analytics.totalRevenue)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Earnings
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                          {formatMoney(analytics.totalEarnings)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Paid
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatMoney(analytics.paidAmount)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Remaining
                        </p>
                        <p
                          className={`mt-1 text-sm font-semibold tabular-nums ${
                            analytics.remainingAmount > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatMoney(analytics.remainingAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Created {formatDate(ref.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(ref.id, ref.code);
                          }}
                          className="h-9 w-9 rounded-2xl p-0"
                        >
                          {copiedId === ref.id ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmailModal(ref.id);
                          }}
                          className="h-9 w-9 rounded-2xl p-0"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(ref);
                          }}
                          className="h-9 w-9 rounded-2xl p-0 hover:bg-emerald-500/10 hover:text-emerald-600"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalReferrals((prev) =>
                              prev.filter((item) => item.id !== ref.id)
                            );
                            deleteReferral.mutate(ref.id);
                          }}
                          className="h-9 w-9 rounded-2xl p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-5 text-center text-xs text-muted-foreground">
              Showing {filteredReferrals.length} of {displayReferrals.length} referral records
            </div>
          </>
        )}
      </div>

      <Dialog
        open={!!selectedReferral}
        onOpenChange={(open) => {
          if (!open) setSelectedReferral(null);
        }}
      >
        <DialogContent className="rounded-3xl max-w-6xl border-0 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>
              Referral Details — {selectedReferral?.name || selectedReferral?.code || "Referral"}
            </DialogTitle>
            <DialogDescription>
              Users, paid users, revenue, earnings, payout status, and all emails with amounts.
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <ReferralDetailsContent
              referral={selectedReferral}
              analytics={getReferralAnalytics(selectedReferral)}
              onMarkAsPaid={() => handleMarkAsPaid(selectedReferral)}
              canMarkPaid={!!markReferralPaid || !!updateReferral}
              markLoading={markReferralPaid?.isPending || updateReferral?.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!showEmailModal}
        onOpenChange={(open) => {
          if (!open) setShowEmailModal(null);
        }}
      >
        <DialogContent className="rounded-3xl max-w-2xl border-0 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Send Welcome Email</DialogTitle>
            <DialogDescription>
              Pre-filled email template for the referral partner.
            </DialogDescription>
          </DialogHeader>

          {showEmailModal && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/20 p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {emailTemplate(
                    displayReferrals.find((item) => item.id === showEmailModal) as ReferralRow
                  )}
                </pre>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    const ref = displayReferrals.find((item) => item.id === showEmailModal);
                    if (ref) {
                      navigator.clipboard.writeText(emailTemplate(ref));
                    }
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
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}