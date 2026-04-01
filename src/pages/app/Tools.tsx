import { Calculator, TrendingUp, Target, Scale } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const COMMON_PAIRS = ["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCHF","USDCAD","EURJPY","GBPJPY","XAUUSD","BTCUSD","ETHUSD","NAS100","US30","EURGBP","NZDUSD"];

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
  return 10;
};

const Tools = () => {
  // === Pips Calculator ===
  const [pipPair, setPipPair] = useState("");
  const [pipEntry, setPipEntry] = useState("");
  const [pipExit, setPipExit] = useState("");
  const [pipType, setPipType] = useState("buy");
  const [pipResult, setPipResult] = useState<{ pips: number; status: string } | null>(null);

  const calculatePips = () => {
    const entry = parseFloat(pipEntry);
    const exit = parseFloat(pipExit);
    if (!pipPair || isNaN(entry) || isNaN(exit)) return;
    const pipSize = getPipSize(pipPair);
    const pips = pipType === "buy" ? (exit - entry) / pipSize : (entry - exit) / pipSize;
    const rounded = Math.round(pips * 10) / 10;
    setPipResult({ pips: rounded, status: rounded >= 0 ? "Profit" : "Loss" });
  };

  // === Lot Size Calculator ===
  const [lotBalance, setLotBalance] = useState("");
  const [lotRisk, setLotRisk] = useState("");
  const [lotSL, setLotSL] = useState("");
  const [lotPair, setLotPair] = useState("");
  const [lotResult, setLotResult] = useState<{ lotSize: number; riskAmount: number } | null>(null);

  const calculateLot = () => {
    const b = parseFloat(lotBalance);
    const r = parseFloat(lotRisk);
    const sl = parseFloat(lotSL);
    if (!lotPair || isNaN(b) || isNaN(r) || isNaN(sl) || sl === 0) return;
    const riskAmount = b * (r / 100);
    const pipValue = getPipValuePerLot(lotPair);
    let lotSize = riskAmount / (sl * pipValue);
    lotSize = Math.max(0.01, Math.round(lotSize * 100) / 100);
    setLotResult({ lotSize, riskAmount: Math.round(riskAmount * 100) / 100 });
  };

  // === Risk Calculator ===
  const [riskBalance, setRiskBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [riskPair, setRiskPair] = useState("");
  const [riskEntry, setRiskEntry] = useState("");
  const [riskSL, setRiskSL] = useState("");
  const [riskResult, setRiskResult] = useState<{ riskAmount: number; slPips: number; lotSize: number } | null>(null);

  const calculateRisk = () => {
    const b = parseFloat(riskBalance);
    const r = parseFloat(riskPercent);
    const entry = parseFloat(riskEntry);
    const sl = parseFloat(riskSL);
    if (!riskPair || isNaN(b) || isNaN(r) || isNaN(entry) || isNaN(sl)) return;
    const riskAmount = b * (r / 100);
    const pipSize = getPipSize(riskPair);
    const slPips = Math.round(Math.abs(entry - sl) / pipSize * 10) / 10;
    if (slPips === 0) return;
    const pipValue = getPipValuePerLot(riskPair);
    let lotSize = riskAmount / (slPips * pipValue);
    lotSize = Math.max(0.01, Math.round(lotSize * 100) / 100);
    setRiskResult({ riskAmount: Math.round(riskAmount * 100) / 100, slPips, lotSize });
  };

  // === Consistency Score Calculator ===
  const [csAccountSize, setCsAccountSize] = useState("");
  const [csProfitTarget, setCsProfitTarget] = useState("");
  const [csBestDay, setCsBestDay] = useState("");
  const [csLimit, setCsLimit] = useState("25");
  const [csResult, setCsResult] = useState<{ score: number; status: string; maxBestDay: number; profitNeeded: number; totalTarget: number } | null>(null);

  const calculateConsistency = () => {
    const size = parseFloat(csAccountSize);
    const target = parseFloat(csProfitTarget);
    const bestDay = parseFloat(csBestDay);
    const limit = parseFloat(csLimit) || 25;
    if (isNaN(size) || isNaN(target) || isNaN(bestDay) || size === 0) return;
    const totalTarget = size * (target / 100);
    if (totalTarget === 0) return;
    const score = Math.round((bestDay / totalTarget) * 100 * 10) / 10;
    const maxBestDay = Math.round((limit / 100) * totalTarget * 100) / 100;
    const profitNeeded = Math.round(bestDay / (limit / 100) * 100) / 100;
    const status = bestDay <= maxBestDay ? "PASS" : "FAIL";
    setCsResult({ score, status, maxBestDay, profitNeeded, totalTarget: Math.round(totalTarget * 100) / 100 });
  };

  const PairSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background border-border font-mono"><SelectValue placeholder="Select pair" /></SelectTrigger>
      <SelectContent className="bg-card border-border max-h-60">
        {COMMON_PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Universal trading calculators</p>
      </div>

      <Tabs defaultValue="pips" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="pips"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Pips</TabsTrigger>
          <TabsTrigger value="lot"><Scale className="h-3.5 w-3.5 mr-1.5" />Lot Size</TabsTrigger>
          <TabsTrigger value="risk"><Calculator className="h-3.5 w-3.5 mr-1.5" />Risk</TabsTrigger>
          <TabsTrigger value="consistency"><Target className="h-3.5 w-3.5 mr-1.5" />Consistency</TabsTrigger>
        </TabsList>

        {/* PIPS CALCULATOR */}
        <TabsContent value="pips">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Pip Calculator</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Calculate pips for any pair — Forex, Gold, Crypto, Indices</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Trading Pair</label><PairSelect value={pipPair} onChange={setPipPair} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Entry Price</label><Input value={pipEntry} onChange={(e) => setPipEntry(e.target.value)} placeholder="1.1000" className="bg-background border-border font-mono" type="number" step="any" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Exit Price</label><Input value={pipExit} onChange={(e) => setPipExit(e.target.value)} placeholder="1.1050" className="bg-background border-border font-mono" type="number" step="any" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Trade Type</label>
                <div className="flex gap-2">
                  {["buy","sell"].map(t => (
                    <button key={t} onClick={() => setPipType(t)} className={`flex-1 py-2 rounded-md text-sm font-medium border transition-all ${pipType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"}`}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <Button onClick={calculatePips} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Pips</Button>
              {pipResult && (
                <div className={`font-mono text-center p-4 rounded border ${pipResult.pips >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className={`text-3xl font-bold ${pipResult.pips >= 0 ? "text-success" : "text-destructive"}`}>{pipResult.pips >= 0 ? "+" : ""}{pipResult.pips} pips</div>
                  <div className={`text-sm mt-1 ${pipResult.pips >= 0 ? "text-success" : "text-destructive"}`}>{pipResult.status}</div>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* LOT SIZE CALCULATOR */}
        <TabsContent value="lot">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Lot Size Calculator</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Calculate optimal lot size based on risk management</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label><Input value={lotBalance} onChange={(e) => setLotBalance(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label><Input value={lotRisk} onChange={(e) => setLotRisk(e.target.value)} placeholder="1" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Stop Loss (pips)</label><Input value={lotSL} onChange={(e) => setLotSL(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Trading Pair</label><PairSelect value={lotPair} onChange={setLotPair} /></div>
              <Button onClick={calculateLot} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Lot Size</Button>
              {lotResult && (
                <div className="font-mono text-center p-4 rounded border border-primary/20 bg-primary/5 space-y-1">
                  <div className="text-3xl font-bold text-primary">{lotResult.lotSize.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Lot Size</div>
                  <div className="text-sm text-foreground mt-2">Risk: <span className="text-primary">${lotResult.riskAmount}</span></div>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* RISK CALCULATOR */}
        <TabsContent value="risk">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Risk Calculator</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Calculate risk amount, SL pips, and lot size from entry & SL price</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label><Input value={riskBalance} onChange={(e) => setRiskBalance(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label><Input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} placeholder="1" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Trading Pair</label><PairSelect value={riskPair} onChange={setRiskPair} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-muted-foreground mb-1 block">Entry Price</label><Input value={riskEntry} onChange={(e) => setRiskEntry(e.target.value)} placeholder="1.1000" className="bg-background border-border font-mono" type="number" step="any" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Stop Loss Price</label><Input value={riskSL} onChange={(e) => setRiskSL(e.target.value)} placeholder="1.0990" className="bg-background border-border font-mono" type="number" step="any" /></div>
              </div>
              <Button onClick={calculateRisk} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Risk</Button>
              {riskResult && (
                <div className="font-mono p-4 rounded border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">Risk Amount</span><span className="text-primary font-bold">${riskResult.riskAmount}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">Stop Loss</span><span className="font-bold">{riskResult.slPips} pips</span></div>
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">Lot Size</span><span className="text-primary font-bold">{riskResult.lotSize.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">Pair</span><span>{riskPair}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-muted-foreground">Risk %</span><span>{riskPercent}%</span></div>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* CONSISTENCY SCORE CALCULATOR */}
        <TabsContent value="consistency">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Prop Firm Consistency Score</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Essential for prop firm traders — check if your best day exceeds the consistency limit</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Size ($)</label><Input value={csAccountSize} onChange={(e) => setCsAccountSize(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Profit Target (%)</label><Input value={csProfitTarget} onChange={(e) => setCsProfitTarget(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Best Day Profit ($)</label><Input value={csBestDay} onChange={(e) => setCsBestDay(e.target.value)} placeholder="400" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Consistency Limit (%) — default 25%</label><Input value={csLimit} onChange={(e) => setCsLimit(e.target.value)} placeholder="25" className="bg-background border-border font-mono" type="number" /></div>
              <Button onClick={calculateConsistency} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Score</Button>
              {csResult && (
                <div className="p-4 rounded border border-border bg-background space-y-3">
                  <div className="text-center">
                    <div className={`text-4xl font-bold font-mono ${csResult.status === "PASS" ? "text-success" : "text-destructive"}`}>{csResult.score}%</div>
                    <div className={`text-sm font-bold mt-1 px-3 py-1 rounded-full inline-block ${csResult.status === "PASS" ? "bg-green-500/10 text-success" : "bg-red-500/10 text-destructive"}`}>{csResult.status}</div>
                  </div>
                  <div className="space-y-1.5 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Total Profit Target</span><span>${csResult.totalTarget}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Max Best Day Allowed</span><span className="text-primary">${csResult.maxBestDay}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground text-xs">Profit Needed to Pass</span><span>${csResult.profitNeeded}</span></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;
