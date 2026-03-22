import { Calculator, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Tools = () => {
  // Risk Calculator
  const [balance, setBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [riskResult, setRiskResult] = useState<string | null>(null);

  const calculateRisk = () => {
    const b = parseFloat(balance);
    const r = parseFloat(riskPercent);
    const sl = parseFloat(stopLoss);
    if (b && r && sl) {
      const riskAmount = (b * r) / 100;
      const positionSize = riskAmount / sl;
      setRiskResult(`Risk: $${riskAmount.toFixed(2)} | Position Size: ${positionSize.toFixed(4)}`);
    }
  };

  // Pips Calculator
  const [pipLotSize, setPipLotSize] = useState("");
  const [pipValue, setPipValue] = useState("");
  const [pipsCount, setPipsCount] = useState("");
  const [pipsResult, setPipsResult] = useState<string | null>(null);

  const calculatePips = () => {
    const lot = parseFloat(pipLotSize);
    const pv = parseFloat(pipValue) || 10;
    const pips = parseFloat(pipsCount);
    if (lot && pips) {
      const profit = lot * pv * pips;
      setPipsResult(`P&L: $${profit.toFixed(2)} | Pip Value: $${(lot * pv).toFixed(2)}/pip`);
    }
  };

  // Lot Calculator
  const [lotBalance, setLotBalance] = useState("");
  const [lotRisk, setLotRisk] = useState("");
  const [lotSL, setLotSL] = useState("");
  const [lotPipVal, setLotPipVal] = useState("10");
  const [lotResult, setLotResult] = useState<string | null>(null);

  const calculateLot = () => {
    const b = parseFloat(lotBalance);
    const r = parseFloat(lotRisk);
    const sl = parseFloat(lotSL);
    const pv = parseFloat(lotPipVal) || 10;
    if (b && r && sl && pv) {
      const riskAmt = (b * r) / 100;
      const lotSize = riskAmt / (sl * pv);
      setLotResult(`Lot Size: ${lotSize.toFixed(4)} | Risk: $${riskAmt.toFixed(2)} | ${sl} pips SL`);
    }
  };

  // Consistency Score Calculator
  const [csWins, setCsWins] = useState("");
  const [csTotalTrades, setCsTotalTrades] = useState("");
  const [csPlanFollowed, setCsPlanFollowed] = useState("");
  const [csAvgRR, setCsAvgRR] = useState("");
  const [csResult, setCsResult] = useState<{ score: number; label: string; color: string } | null>(null);

  const calculateConsistency = () => {
    const wins = parseFloat(csWins);
    const total = parseFloat(csTotalTrades);
    const plan = parseFloat(csPlanFollowed);
    const rr = parseFloat(csAvgRR);
    if (total > 0 && !isNaN(wins) && !isNaN(plan)) {
      const winRate = (wins / total) * 100;
      const planRate = (plan / total) * 100;
      const rrBonus = Math.min((rr || 1) * 10, 20);
      const score = Math.min(Math.round(winRate * 0.35 + planRate * 0.45 + rrBonus), 100);
      const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Work";
      const color = score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-yellow-400" : "text-destructive";
      setCsResult({ score, label, color });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Trading calculators</p>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="risk"><Calculator className="h-3.5 w-3.5 mr-1.5" />Risk</TabsTrigger>
          <TabsTrigger value="pips"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Pips</TabsTrigger>
          <TabsTrigger value="lot"><Calculator className="h-3.5 w-3.5 mr-1.5" />Lot Size</TabsTrigger>
          <TabsTrigger value="consistency"><Target className="h-3.5 w-3.5 mr-1.5" />Consistency</TabsTrigger>
        </TabsList>

        <TabsContent value="risk">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Risk Calculator</h2>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label><Input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label><Input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} placeholder="1" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Stop Loss (points/$)</label><Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="50" className="bg-background border-border font-mono" type="number" /></div>
              <Button onClick={calculateRisk} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
              {riskResult && <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">{riskResult}</div>}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="pips">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Pips Calculator</h2>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Lot Size</label><Input value={pipLotSize} onChange={(e) => setPipLotSize(e.target.value)} placeholder="1.0" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Pip Value ($) — default 10</label><Input value={pipValue} onChange={(e) => setPipValue(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Pips (+/-)</label><Input value={pipsCount} onChange={(e) => setPipsCount(e.target.value)} placeholder="30" className="bg-background border-border font-mono" type="number" /></div>
              <Button onClick={calculatePips} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
              {pipsResult && <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">{pipsResult}</div>}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="lot">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Lot Size Calculator</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Calculate optimal lot size based on your risk management</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label><Input value={lotBalance} onChange={(e) => setLotBalance(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label><Input value={lotRisk} onChange={(e) => setLotRisk(e.target.value)} placeholder="1" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Stop Loss (pips)</label><Input value={lotSL} onChange={(e) => setLotSL(e.target.value)} placeholder="50" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Pip Value ($) — default 10</label><Input value={lotPipVal} onChange={(e) => setLotPipVal(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
              <Button onClick={calculateLot} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
              {lotResult && <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">{lotResult}</div>}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="consistency">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Consistency Score Calculator</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Essential for prop firm traders — calculate your consistency score</p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Winning Trades</label><Input value={csWins} onChange={(e) => setCsWins(e.target.value)} placeholder="15" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Total Trades</label><Input value={csTotalTrades} onChange={(e) => setCsTotalTrades(e.target.value)} placeholder="20" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Trades Following Plan</label><Input value={csPlanFollowed} onChange={(e) => setCsPlanFollowed(e.target.value)} placeholder="18" className="bg-background border-border font-mono" type="number" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Avg Risk:Reward Ratio</label><Input value={csAvgRR} onChange={(e) => setCsAvgRR(e.target.value)} placeholder="2.0" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
              <Button onClick={calculateConsistency} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Score</Button>
              {csResult && (
                <div className="text-center p-4 rounded border border-border bg-background">
                  <div className={`text-4xl font-bold font-mono ${csResult.color}`}>{csResult.score}</div>
                  <div className={`text-sm font-semibold mt-1 ${csResult.color}`}>{csResult.label}</div>
                  <p className="text-xs text-muted-foreground mt-2">Based on win rate (35%), plan discipline (45%), and R:R (20%)</p>
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
