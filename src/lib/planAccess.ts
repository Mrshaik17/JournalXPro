export type UserPlan = "free" | "basic" | "standard" | "elite";

export const PLAN_ACCESS = {
  free: {
    maxAccounts: 1,
    maxTrades: 50,
    analyticsTradesLimit: 50,
    payouts: false,
    analytics: {
      overview: true,
      performance: true,
      discipline: false,
      aiInsights: false,
    },
    autoDeleteMonths: 6,
  },
  basic: {
    maxAccounts: 4,
    maxTrades: 100,
    analyticsTradesLimit: 100,
    payouts: false,
    analytics: {
      overview: true,
      performance: true,
      discipline: false,
      aiInsights: false,
    },
    autoDeleteMonths: 6,
  },
  standard: {
    maxAccounts: 9,
    maxTrades: 170,
    analyticsTradesLimit: 170,
    payouts: true,
    analytics: {
      overview: true,
      performance: true,
      discipline: true,
      aiInsights: false,
    },
    autoDeleteMonths: 12,
  },
  elite: {
    maxAccounts: Number.MAX_SAFE_INTEGER,
    maxTrades: Number.MAX_SAFE_INTEGER,
    analyticsTradesLimit: Number.MAX_SAFE_INTEGER,
    payouts: true,
    analytics: {
      overview: true,
      performance: true,
      discipline: true,
      aiInsights: true,
    },
    autoDeleteMonths: 36,
  },
} as const;

export const normalizeUserPlan = (plan?: string | null): UserPlan => {
  if (!plan) return "free";

  const p = plan.toLowerCase().trim();

  // 🔥 MAP YOUR OLD PLANS → NEW PLANS
  if (p === "pro_plus") return "standard";
  if (p === "pro") return "basic";

  // existing plans
  if (p === "basic") return "basic";
  if (p === "standard") return "standard";
  if (p === "elite") return "elite";
  if (p === "free") return "free";

  return "free";
};

export const getPlanAccess = (plan?: string) => {
  const normalized = normalizeUserPlan(plan);
  return PLAN_ACCESS[normalized];
};