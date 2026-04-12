import {
  Calculator,
  TrendingUp,
  Target,
  Scale,
  ArrowRightLeft,
  ShieldAlert,
  CandlestickChart,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const COMMON_PAIRS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCHF",
  "USDCAD",
  "EURJPY",
  "GBPJPY",
  "XAUUSD",
  "BTCUSD",
  "ETHUSD",
  "NAS100",
  "US30",
  "EURGBP",
  "NZDUSD",
];

const getPipSize = (pair: string) => {
  const p = pair.toUpperCase();
  if (p.includes("JPY")) return 0.01;
  if (p.includes("XAU") || p.includes("GOLD")) return 0.1;
  if (p.includes("BTC") || p.includes("ETH") || p.includes("CRYPTO")) return 1;
  return 0.0001;
};

const getPipValuePerLot = (pair: string) => {
  const p = pair.toUpperCase();
  if (p.includes("JPY")) return 9.13;
  if (p.includes("XAU") || p.includes("GOLD")) return 10;
  if (p.includes("BTC")) return 1;
  if (p.includes("ETH")) return 1;
  if (p.includes("NAS") || p.includes("US30")) return 1;
  return 10;
};

const parseNum = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const PairSelect = ({
  value,
  onChange,
  placeholder = "Select pair",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-11 bg-background/60 border-border font-mono">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="bg-card border-border max-h-72">
      {COMMON_PAIRS.map((pair) => (
        <SelectItem key={pair} value={pair} className="font-mono">
          {pair}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs font-medium text-foreground/90">{label}</label>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
    {children}
  </div>
);

const ToolShell = ({
  icon: Icon,
  title,
  description,
  accentClass,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accentClass: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]"
  >
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className={`rounded-xl border p-2.5 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  </motion.div>
);

const ResultPanel = ({
  title,
  tone = "primary",
  hero,
  subtitle,
  rows,
}: {
  title: string;
  tone?: "primary" | "success" | "danger" | "warning";
  hero: React.ReactNode;
  subtitle?: React.ReactNode;
  rows?: { label: string; value: React.ReactNode }[];
}) => {
  const toneClass =
    tone === "success"
      ? "border-green-500/20 bg-green-500/5"
      : tone === "danger"
      ? "border-red-500/20 bg-red-500/5"
      : tone === "warning"
      ? "border-yellow-500/20 bg-yellow-500/5"
      : "border-primary/20 bg-primary/5";

  return (
    <div className={`rounded-2xl border p-6 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      <div className="text-4xl sm:text-5xl font-bold tracking-tight font-mono">{hero}</div>
      {subtitle ? <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div> : null}
      {rows?.length ? (
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="font-mono text-sm font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const EmptyPreview = ({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 h-full min-h-[320px] flex items-center justify-center">
    <div className="max-w-sm text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-2xl border border-border bg-background/70 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  </div>
);

const Tools = () => {
  const [pipPair, setPipPair] = useState("");
  const [pipEntry, setPipEntry] = useState("");
  const [pipExit, setPipExit] = useState("");
  const [pipType, setPipType] = useState("buy");

  const [lotBalance, setLotBalance] = useState("");
  const [lotRisk, setLotRisk] = useState("");
  const [lotSL, setLotSL] = useState("");
  const [lotPair, setLotPair] = useState("");

  const [riskBalance, setRiskBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [riskPair, setRiskPair] = useState("");
  const [riskEntry, setRiskEntry] = useState("");
  const [riskSL, setRiskSL] = useState("");

  const [csAccountSize, setCsAccountSize] = useState("");
  const [csProfitTarget, setCsProfitTarget] = useState("");
  const [csBestDay, setCsBestDay] = useState("");
  const [csLimit, setCsLimit] = useState("25");

  const pipResult = useMemo(() => {
    const entry = parseNum(pipEntry);
    const exit = parseNum(pipExit);
    if (!pipPair || entry === null || exit === null) return null;

    const pipSize = getPipSize(pipPair);
    const pips = pipType === "buy" ? (exit - entry) / pipSize : (entry - exit) / pipSize;
    const rounded = Math.round(pips * 10) / 10;

    return {
      pips: rounded,
      status: rounded >= 0 ? "Profit" : "Loss",
      instrument: pipPair,
      pipSize,
    };
  }, [pipPair, pipEntry, pipExit, pipType]);

  const lotResult = useMemo(() => {
    const b = parseNum(lotBalance);
    const r = parseNum(lotRisk);
    const sl = parseNum(lotSL);
    if (!lotPair || b === null || r === null || sl === null || sl === 0) return null;

    const riskAmount = b * (r / 100);
    const pipValue = getPipValuePerLot(lotPair);
    const lotSize = Math.max(0.01, Math.round((riskAmount / (sl * pipValue)) * 100) / 100);

    return {
      lotSize,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipValue,
      stopLossPips: sl,
      pair: lotPair,
      riskPercent: r,
    };
  }, [lotBalance, lotRisk, lotSL, lotPair]);

  const riskResult = useMemo(() => {
    const b = parseNum(riskBalance);
    const r = parseNum(riskPercent);
    const entry = parseNum(riskEntry);
    const sl = parseNum(riskSL);

    if (!riskPair || b === null || r === null || entry === null || sl === null) return null;

    const riskAmount = b * (r / 100);
    const pipSize = getPipSize(riskPair);
    const slPips = Math.round((Math.abs(entry - sl) / pipSize) * 10) / 10;
    if (slPips === 0) return null;

    const pipValue = getPipValuePerLot(riskPair);
    const lotSize = Math.max(0.01, Math.round((riskAmount / (slPips * pipValue)) * 100) / 100);

    return {
      riskAmount: Math.round(riskAmount * 100) / 100,
      slPips,
      lotSize,
      pair: riskPair,
      riskPercent: r,
      entry,
      stopLoss: sl,
    };
  }, [riskBalance, riskPercent, riskPair, riskEntry, riskSL]);

  const csResult = useMemo(() => {
    const size = parseNum(csAccountSize);
    const target = parseNum(csProfitTarget);
    const bestDay = parseNum(csBestDay);
    const limit = parseNum(csLimit) ?? 25;

    if (size === null || target === null || bestDay === null || size === 0) return null;

    const totalTarget = size * (target / 100);
    if (totalTarget === 0) return null;

    const score = Math.round(((bestDay / totalTarget) * 100) * 10) / 10;
    const maxBestDay = Math.round(((limit / 100) * totalTarget) * 100) / 100;
    const profitNeeded = Math.round((bestDay / (limit / 100)) * 100) / 100;
    const status = bestDay <= maxBestDay ? "PASS" : "FAIL";

    return {
      score,
      status,
      maxBestDay,
      profitNeeded,
      totalTarget: Math.round(totalTarget * 100) / 100,
      limit,
      bestDay,
    };
  }, [csAccountSize, csProfitTarget, csBestDay, csLimit]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trading Tools</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fast calculators for pips, lot size, risk planning, and prop firm consistency.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-muted-foreground">Tools</div>
              <div className="font-semibold mt-1">4 active</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-muted-foreground">Coverage</div>
              <div className="font-semibold mt-1">Forex + Gold</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-muted-foreground">Risk Mode</div>
              <div className="font-semibold mt-1">Live calc</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-muted-foreground">Best For</div>
              <div className="font-semibold mt-1">Prop traders</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pips" className="space-y-5">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl border border-border bg-card p-1.5">
          <TabsTrigger value="pips" className="rounded-xl px-4 py-2.5">
            <TrendingUp className="h-4 w-4 mr-2" />
            Pips
          </TabsTrigger>
          <TabsTrigger value="lot" className="rounded-xl px-4 py-2.5">
            <Scale className="h-4 w-4 mr-2" />
            Lot Size
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-xl px-4 py-2.5">
            <Calculator className="h-4 w-4 mr-2" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="consistency" className="rounded-xl px-4 py-2.5">
            <Target className="h-4 w-4 mr-2" />
            Consistency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pips" className="mt-0">
          <ToolShell
            icon={TrendingUp}
            title="Pip Calculator"
            description="Measure price movement for forex, gold, crypto, and index pairs."
            accentClass="border-primary/20 bg-primary/10 text-primary"
          >
            <div className="space-y-4">
              <Field label="Trading Pair" hint="Required">
                <PairSelect value={pipPair} onChange={setPipPair} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Entry Price">
                  <Input
                    value={pipEntry}
                    onChange={(e) => setPipEntry(e.target.value)}
                    placeholder="1.1000"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="any"
                  />
                </Field>

                <Field label="Exit Price">
                  <Input
                    value={pipExit}
                    onChange={(e) => setPipExit(e.target.value)}
                    placeholder="1.1050"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="any"
                  />
                </Field>
              </div>

              <Field label="Trade Type">
                <div className="grid grid-cols-2 gap-2">
                  {["buy", "sell"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPipType(type)}
                      className={`h-11 rounded-xl border text-sm font-medium transition-all ${
                        pipType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </ToolShell>

          <div className="mt-5">
            {pipResult ? (
              <ResultPanel
                title="Pip Outcome"
                tone={pipResult.pips >= 0 ? "success" : "danger"}
                hero={
                  <span className={pipResult.pips >= 0 ? "text-success" : "text-destructive"}>
                    {pipResult.pips >= 0 ? "+" : ""}
                    {pipResult.pips} pips
                  </span>
                }
                subtitle={`${pipResult.status} on ${pipResult.instrument} • Pip size ${pipResult.pipSize}`}
                rows={[
                  { label: "Direction", value: pipType.toUpperCase() },
                  { label: "Instrument", value: pipPair },
                  { label: "Entry", value: pipEntry || "—" },
                  { label: "Exit", value: pipExit || "—" },
                ]}
              />
            ) : (
              <EmptyPreview
                icon={ArrowRightLeft}
                title="Enter a pair and price levels"
                text="Choose an instrument, add entry and exit prices, and the pip movement will appear instantly."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="lot" className="mt-0">
          <ToolShell
            icon={Scale}
            title="Lot Size Calculator"
            description="Size positions from account balance, risk percentage, and stop loss distance."
            accentClass="border-blue-500/20 bg-blue-500/10 text-blue-400"
          >
            <div className="space-y-4">
              <Field label="Account Balance" hint="USD">
                <Input
                  value={lotBalance}
                  onChange={(e) => setLotBalance(e.target.value)}
                  placeholder="10000"
                  className="h-11 bg-background/60 border-border font-mono"
                  type="number"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Risk %" hint="Per trade">
                  <Input
                    value={lotRisk}
                    onChange={(e) => setLotRisk(e.target.value)}
                    placeholder="1"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="0.1"
                  />
                </Field>

                <Field label="Stop Loss" hint="Pips">
                  <Input
                    value={lotSL}
                    onChange={(e) => setLotSL(e.target.value)}
                    placeholder="10"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                  />
                </Field>
              </div>

              <Field label="Trading Pair">
                <PairSelect value={lotPair} onChange={setLotPair} />
              </Field>
            </div>
          </ToolShell>

          <div className="mt-5">
            {lotResult ? (
              <ResultPanel
                title="Position Size"
                tone="primary"
                hero={<span className="text-primary">{lotResult.lotSize.toFixed(2)} lots</span>}
                subtitle={`Calculated from ${lotResult.riskPercent}% risk on ${lotResult.pair}`}
                rows={[
                  { label: "Risk Amount", value: formatMoney(lotResult.riskAmount) },
                  { label: "Stop Loss", value: `${lotResult.stopLossPips} pips` },
                  { label: "Pip Value / Lot", value: `$${lotResult.pipValue}` },
                  { label: "Pair", value: lotResult.pair },
                ]}
              />
            ) : (
              <EmptyPreview
                icon={Scale}
                title="Plan size before placing the trade"
                text="Add balance, risk percentage, stop loss, and pair to get a position size instantly."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-0">
          <ToolShell
            icon={Calculator}
            title="Risk Calculator"
            description="Convert account risk and stop-loss price into exact exposure and lot size."
            accentClass="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
          >
            <div className="space-y-4">
              <Field label="Account Balance" hint="USD">
                <Input
                  value={riskBalance}
                  onChange={(e) => setRiskBalance(e.target.value)}
                  placeholder="10000"
                  className="h-11 bg-background/60 border-border font-mono"
                  type="number"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Risk %" hint="Per trade">
                  <Input
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    placeholder="1"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="0.1"
                  />
                </Field>

                <Field label="Trading Pair">
                  <PairSelect value={riskPair} onChange={setRiskPair} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Entry Price">
                  <Input
                    value={riskEntry}
                    onChange={(e) => setRiskEntry(e.target.value)}
                    placeholder="1.1000"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="any"
                  />
                </Field>

                <Field label="Stop Loss Price">
                  <Input
                    value={riskSL}
                    onChange={(e) => setRiskSL(e.target.value)}
                    placeholder="1.0990"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="any"
                  />
                </Field>
              </div>
            </div>
          </ToolShell>

          <div className="mt-5">
            {riskResult ? (
              <ResultPanel
                title="Trade Risk"
                tone="warning"
                hero={<span className="text-yellow-400">{formatMoney(riskResult.riskAmount)}</span>}
                subtitle={`Risked at ${riskResult.riskPercent}% on ${riskResult.pair}`}
                rows={[
                  { label: "Stop Loss Distance", value: `${riskResult.slPips} pips` },
                  { label: "Lot Size", value: riskResult.lotSize.toFixed(2) },
                  { label: "Entry", value: riskResult.entry },
                  { label: "Stop Loss", value: riskResult.stopLoss },
                ]}
              />
            ) : (
              <EmptyPreview
                icon={ShieldAlert}
                title="Define your trade risk"
                text="Add account balance, trade risk, pair, entry, and stop-loss price to calculate exact exposure."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="consistency" className="mt-0">
          <ToolShell
            icon={Target}
            title="Prop Firm Consistency Score"
            description="Check whether your best trading day exceeds the allowed consistency threshold."
            accentClass="border-purple-500/20 bg-purple-500/10 text-purple-400"
          >
            <div className="space-y-4">
              <Field label="Account Size" hint="USD">
                <Input
                  value={csAccountSize}
                  onChange={(e) => setCsAccountSize(e.target.value)}
                  placeholder="10000"
                  className="h-11 bg-background/60 border-border font-mono"
                  type="number"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Profit Target %" hint="Challenge target">
                  <Input
                    value={csProfitTarget}
                    onChange={(e) => setCsProfitTarget(e.target.value)}
                    placeholder="10"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                    step="0.1"
                  />
                </Field>

                <Field label="Consistency Limit %" hint="Default 25%">
                  <Input
                    value={csLimit}
                    onChange={(e) => setCsLimit(e.target.value)}
                    placeholder="25"
                    className="h-11 bg-background/60 border-border font-mono"
                    type="number"
                  />
                </Field>
              </div>

              <Field label="Best Day Profit" hint="USD">
                <Input
                  value={csBestDay}
                  onChange={(e) => setCsBestDay(e.target.value)}
                  placeholder="400"
                  className="h-11 bg-background/60 border-border font-mono"
                  type="number"
                />
              </Field>
            </div>
          </ToolShell>

          <div className="mt-5">
            {csResult ? (
              <ResultPanel
                title="Consistency Result"
                tone={csResult.status === "PASS" ? "success" : "danger"}
                hero={
                  <span className={csResult.status === "PASS" ? "text-success" : "text-destructive"}>
                    {csResult.score}%
                  </span>
                }
                subtitle={
                  <span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        csResult.status === "PASS"
                          ? "bg-green-500/10 text-success"
                          : "bg-red-500/10 text-destructive"
                      }`}
                    >
                      {csResult.status}
                    </span>
                  </span>
                }
                rows={[
                  { label: "Total Profit Target", value: formatMoney(csResult.totalTarget) },
                  { label: "Max Best Day Allowed", value: formatMoney(csResult.maxBestDay) },
                  { label: "Best Day Profit", value: formatMoney(csResult.bestDay) },
                  { label: "Profit Needed to Normalize", value: formatMoney(csResult.profitNeeded) },
                ]}
              />
            ) : (
              <EmptyPreview
                icon={CandlestickChart}
                title="Check your prop-firm consistency"
                text="Enter account size, target, best day profit, and consistency limit to see if your payout profile passes."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;