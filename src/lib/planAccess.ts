// src/lib/planAccess.ts
export type UserPlan = "free" | "basic" | "standard" | "elite";

export const PLAN_ACCESS = {
  free: {
    maxAccounts: 1,
    maxTrades: 20,
    analyticsTrades: 10,
    tools: false,
    propFirms: false,
    news: false,
    payout: false,
    download: false,
    aiInsights: false,
  },
  basic: {
    maxAccounts: 3,
    maxTrades: 80,
    analyticsTrades: 100,
    tools: true,
    propFirms: true,
    news: true,
    payout: false,
    download: false,
    aiInsights: false,
  },
  standard: {
    maxAccounts: 7,
    maxTrades: 170,
    analyticsTrades: 250,
    tools: true,
    propFirms: true,
    news: true,
    payout: true,
    download: true,
    aiInsights: false,
  },
  elite: {
    maxAccounts: Infinity,
    maxTrades: Infinity,
    analyticsTrades: Infinity,
    tools: true,
    propFirms: true,
    news: true,
    payout: true,
    download: true,
    aiInsights: true,
  },
} as const;

export const getPlanAccess = (plan?: string) => {
  const normalized = (plan || "free") as UserPlan;
  return PLAN_ACCESS[normalized] || PLAN_ACCESS.free;
};