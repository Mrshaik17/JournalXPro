import { Calculator } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Tools = () => {
  const [balance, setBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const b = parseFloat(balance);
    const r = parseFloat(riskPercent);
    const sl = parseFloat(stopLoss);
    if (b && r && sl) {
      const riskAmount = (b * r) / 100;
      const positionSize = riskAmount / sl;
      setResult(`Risk: $${riskAmount.toFixed(2)} | Position Size: ${positionSize.toFixed(4)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Risk management calculators</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Risk Calculator</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label>
            <Input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="10000" className="bg-background border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label>
            <Input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} placeholder="1" className="bg-background border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Stop Loss (points/$)</label>
            <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="50" className="bg-background border-border" />
          </div>
          <Button onClick={calculate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Calculate
          </Button>
          {result && (
            <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tools;
