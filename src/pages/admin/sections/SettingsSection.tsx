import { useEffect, useMemo, useState } from "react";
import {
  Save,
  DollarSign,
  ToggleRight,
  Settings,
  Bot,
  BarChart3,
  Users,
  Newspaper,
  Building2,
  Mail,
  Wrench,
  UserPlus,
  Send,
  MessageSquare,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type PlanKey = "free" | "pro" | "pro_plus" | "elite";

type PlanValue = {
  price_1m: string;
  price_3m: string;
  price_6m: string;
  price_1y: string;
  maxAccounts: string;
  maxTrades: string;
};

type PlansState = Record<PlanKey, PlanValue>;

type FeaturesState = {
  ai_enabled: boolean;
  mt5_enabled: boolean;
  referral_enabled: boolean;
  news_enabled: boolean;
  prop_firms_enabled: boolean;
  contact_enabled: boolean;
};

type PlatformState = {
  support_email: string;
  telegram_link: string;
  discord_link: string;
  youtube_link: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
};

type SiteSettingRow = {
  id?: string;
  key: string;
  value: any;
};

type Props = {
  siteSettings: SiteSettingRow[];
  upsertSetting: {
    mutate: (payload: { key: string; value: any }) => void;
    isPending?: boolean;
    isLoading?: boolean;
  };
};

const defaultPlans: PlansState = {
  free: {
    price_1m: "",
    price_3m: "",
    price_6m: "",
    price_1y: "",
    maxAccounts: "",
    maxTrades: "",
  },
  pro: {
    price_1m: "",
    price_3m: "",
    price_6m: "",
    price_1y: "",
    maxAccounts: "",
    maxTrades: "",
  },
  pro_plus: {
    price_1m: "",
    price_3m: "",
    price_6m: "",
    price_1y: "",
    maxAccounts: "",
    maxTrades: "",
  },
  elite: {
    price_1m: "",
    price_3m: "",
    price_6m: "",
    price_1y: "",
    maxAccounts: "",
    maxTrades: "",
  },
};

const defaultFeatures: FeaturesState = {
  ai_enabled: false,
  mt5_enabled: false,
  referral_enabled: true,
  news_enabled: true,
  prop_firms_enabled: true,
  contact_enabled: true,
};

const defaultPlatform: PlatformState = {
  support_email: "",
  telegram_link: "",
  discord_link: "",
  youtube_link: "",
  maintenance_mode: false,
  registration_enabled: true,
};

export default function SettingsSection({
  siteSettings = [],
  upsertSetting,
}: Props) {
  const [plans, setPlans] = useState<PlansState>(defaultPlans);
  const [features, setFeatures] = useState<FeaturesState>(defaultFeatures);
  const [platform, setPlatform] = useState<PlatformState>(defaultPlatform);

  const settingsMap = useMemo(() => {
    return (siteSettings || []).reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);
  }, [siteSettings]);

  useEffect(() => {
    const pricing = settingsMap.pricing || {};
    const featureFlags = settingsMap.feature_flags || {};
    const platformSettings = settingsMap.platform_settings || {};

    setPlans({
      free: {
        price_1m: pricing?.free?.price_1m ?? "",
        price_3m: pricing?.free?.price_3m ?? "",
        price_6m: pricing?.free?.price_6m ?? "",
        price_1y: pricing?.free?.price_1y ?? "",
        maxAccounts: pricing?.free?.maxAccounts ?? "",
        maxTrades: pricing?.free?.maxTrades ?? "",
      },
      pro: {
        price_1m: pricing?.pro?.price_1m ?? "",
        price_3m: pricing?.pro?.price_3m ?? "",
        price_6m: pricing?.pro?.price_6m ?? "",
        price_1y: pricing?.pro?.price_1y ?? "",
        maxAccounts: pricing?.pro?.maxAccounts ?? "",
        maxTrades: pricing?.pro?.maxTrades ?? "",
      },
      pro_plus: {
        price_1m: pricing?.pro_plus?.price_1m ?? "",
        price_3m: pricing?.pro_plus?.price_3m ?? "",
        price_6m: pricing?.pro_plus?.price_6m ?? "",
        price_1y: pricing?.pro_plus?.price_1y ?? "",
        maxAccounts: pricing?.pro_plus?.maxAccounts ?? "",
        maxTrades: pricing?.pro_plus?.maxTrades ?? "",
      },
      elite: {
        price_1m: pricing?.elite?.price_1m ?? "",
        price_3m: pricing?.elite?.price_3m ?? "",
        price_6m: pricing?.elite?.price_6m ?? "",
        price_1y: pricing?.elite?.price_1y ?? "",
        maxAccounts: pricing?.elite?.maxAccounts ?? "",
        maxTrades: pricing?.elite?.maxTrades ?? "",
      },
    });

    setFeatures({
      ai_enabled: featureFlags?.ai_enabled ?? false,
      mt5_enabled: featureFlags?.mt5_enabled ?? false,
      referral_enabled: featureFlags?.referral_enabled ?? true,
      news_enabled: featureFlags?.news_enabled ?? true,
      prop_firms_enabled: featureFlags?.prop_firms_enabled ?? true,
      contact_enabled: featureFlags?.contact_enabled ?? true,
    });

    setPlatform({
      support_email: platformSettings?.support_email ?? "",
      telegram_link: platformSettings?.telegram_link ?? "",
      discord_link: platformSettings?.discord_link ?? "",
      youtube_link: platformSettings?.youtube_link ?? "",
      maintenance_mode: platformSettings?.maintenance_mode ?? false,
      registration_enabled: platformSettings?.registration_enabled ?? true,
    });
  }, [settingsMap]);

  const handlePlanChange = (
    planKey: PlanKey,
    field: keyof PlanValue,
    value: string
  ) => {
    setPlans((prev) => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: value,
      },
    }));
  };

  const savePricing = () => {
    upsertSetting.mutate({
      key: "pricing",
      value: plans,
    });
  };

  const saveFeatures = () => {
    upsertSetting.mutate({
      key: "feature_flags",
      value: features,
    });
  };

  const savePlatform = () => {
    upsertSetting.mutate({
      key: "platform_settings",
      value: platform,
    });
  };

  const getPlanTheme = (planKey: string) => {
    switch (planKey) {
      case "free":
        return {
          badge: "bg-zinc-500/10 text-zinc-300",
          dot: "bg-zinc-400",
          ring: "focus-visible:ring-zinc-400/30",
        };
      case "pro":
        return {
          badge: "bg-emerald-500/10 text-emerald-400",
          dot: "bg-emerald-400",
          ring: "focus-visible:ring-emerald-500/30",
        };
      case "pro_plus":
        return {
          badge: "bg-sky-500/10 text-sky-400",
          dot: "bg-sky-400",
          ring: "focus-visible:ring-sky-500/30",
        };
      case "elite":
        return {
          badge: "bg-violet-500/10 text-violet-400",
          dot: "bg-violet-400",
          ring: "focus-visible:ring-violet-500/30",
        };
      default:
        return {
          badge: "bg-primary/10 text-primary",
          dot: "bg-primary",
          ring: "focus-visible:ring-primary/30",
        };
    }
  };

  const pricingPeriods = [
    { key: "price_1m", label: "1 Month", short: "1M" },
    { key: "price_3m", label: "3 Months", short: "3M" },
    { key: "price_6m", label: "6 Months", short: "6M" },
    { key: "price_1y", label: "1 Year", short: "1Y" },
  ] as const;

  const featureItems = [
    { key: "ai_enabled", label: "AI Enabled", icon: Bot },
    { key: "mt5_enabled", label: "MT5 Enabled", icon: BarChart3 },
    { key: "referral_enabled", label: "Referral System", icon: Users },
    { key: "news_enabled", label: "News Module", icon: Newspaper },
    { key: "prop_firms_enabled", label: "Prop Firms Module", icon: Building2 },
    { key: "contact_enabled", label: "Contact Page", icon: Mail },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card/70 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Plan Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Manage plan limits and subscription durations
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(plans).map(([planKey, planValue]) => {
            const theme = getPlanTheme(planKey);

            return (
              <div
                key={planKey}
                className="rounded-2xl bg-background/40 p-5 shadow-sm transition-all hover:bg-background/50 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">
                      {planKey.replace("_", " ")}
                    </h4>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${theme.badge}`}
                  >
                    Plan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {pricingPeriods.map((period) => (
                    <div key={period.key} className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {period.label}
                      </label>
                      <Input
                        placeholder={period.short}
                        value={planValue[period.key]}
                        onChange={(e) =>
                          handlePlanChange(
                            planKey as PlanKey,
                            period.key,
                            e.target.value
                          )
                        }
                        className={`h-11 rounded-xl border-0 bg-card/60 shadow-sm font-mono tabular-nums ${theme.ring}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Max Accounts
                    </label>
                    <Input
                      placeholder="Max accounts"
                      value={planValue.maxAccounts}
                      onChange={(e) =>
                        handlePlanChange(
                          planKey as PlanKey,
                          "maxAccounts",
                          e.target.value
                        )
                      }
                      className={`h-11 rounded-xl border-0 bg-card/60 shadow-sm font-mono tabular-nums ${theme.ring}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Max Trades
                    </label>
                    <Input
                      placeholder="Max trades"
                      value={planValue.maxTrades}
                      onChange={(e) =>
                        handlePlanChange(
                          planKey as PlanKey,
                          "maxTrades",
                          e.target.value
                        )
                      }
                      className={`h-11 rounded-xl border-0 bg-card/60 shadow-sm font-mono tabular-nums ${theme.ring}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button onClick={savePricing} className="h-11 rounded-xl px-6">
            <Save className="mr-2 h-4 w-4" />
            Save Pricing
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10">
            <ToggleRight className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Feature Flags</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable platform modules
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {featureItems.map((item) => {
            const Icon = item.icon;
            const enabled = features[item.key];

            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-2xl bg-background/40 px-4 py-4 shadow-sm transition-all hover:bg-background/50 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      enabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>

                <Switch
                  checked={features[item.key]}
                  onCheckedChange={(checked) =>
                    setFeatures((prev) => ({
                      ...prev,
                      [item.key]: checked,
                    }))
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button onClick={saveFeatures} className="h-11 rounded-xl px-6">
            <Save className="mr-2 h-4 w-4" />
            Save Features
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
            <Settings className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Platform Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure support and platform controls
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Support Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="support@example.com"
                value={platform.support_email}
                onChange={(e) =>
                  setPlatform((prev) => ({
                    ...prev,
                    support_email: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border-0 bg-background/50 pl-10 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Telegram Link
            </label>
            <div className="relative">
              <Send className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://t.me/yourchannel"
                value={platform.telegram_link}
                onChange={(e) =>
                  setPlatform((prev) => ({
                    ...prev,
                    telegram_link: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border-0 bg-background/50 pl-10 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Discord Link
            </label>
            <div className="relative">
              <MessageSquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://discord.gg/..."
                value={platform.discord_link}
                onChange={(e) =>
                  setPlatform((prev) => ({
                    ...prev,
                    discord_link: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border-0 bg-background/50 pl-10 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              YouTube Link
            </label>
            <div className="relative">
              <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://youtube.com/@channel"
                value={platform.youtube_link}
                onChange={(e) =>
                  setPlatform((prev) => ({
                    ...prev,
                    youtube_link: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border-0 bg-background/50 pl-10 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/30"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl bg-background/40 px-4 py-4 shadow-sm hover:bg-background/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable platform access
                </p>
              </div>
            </div>

            <Switch
              checked={platform.maintenance_mode}
              onCheckedChange={(checked) =>
                setPlatform((prev) => ({
                  ...prev,
                  maintenance_mode: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-background/40 px-4 py-4 shadow-sm hover:bg-background/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Registration Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Allow new users to sign up
                </p>
              </div>
            </div>

            <Switch
              checked={platform.registration_enabled}
              onCheckedChange={(checked) =>
                setPlatform((prev) => ({
                  ...prev,
                  registration_enabled: checked,
                }))
              }
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={savePlatform} className="h-11 rounded-xl px-6">
            <Save className="mr-2 h-4 w-4" />
            Save Platform Settings
          </Button>
        </div>
      </div>
    </div>
  );
}