import { Calculator, Newspaper, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
    const pv = parseFloat(pipValue) || 10; // default pip value for forex
    const pips = parseFloat(pipsCount);
    if (lot && pips) {
      const profit = lot * pv * pips;
      setPipsResult(`P&L: $${profit.toFixed(2)} | Pip Value: $${(lot * pv).toFixed(2)}/pip`);
    }
  };

  // News
  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">Calculators & market news</p>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="risk"><Calculator className="h-3.5 w-3.5 mr-1.5" />Risk Calculator</TabsTrigger>
          <TabsTrigger value="pips"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Pips Calculator</TabsTrigger>
          <TabsTrigger value="news"><Newspaper className="h-3.5 w-3.5 mr-1.5" />News</TabsTrigger>
        </TabsList>

        <TabsContent value="risk">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 card-glow max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Risk Calculator</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label>
                <Input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="10000" className="bg-background border-border font-mono" type="number" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Risk (%)</label>
                <Input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} placeholder="1" className="bg-background border-border font-mono" type="number" step="0.1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stop Loss (points/$)</label>
                <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="50" className="bg-background border-border font-mono" type="number" />
              </div>
              <Button onClick={calculateRisk} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
              {riskResult && (
                <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">{riskResult}</div>
              )}
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lot Size</label>
                <Input value={pipLotSize} onChange={(e) => setPipLotSize(e.target.value)} placeholder="1.0" className="bg-background border-border font-mono" type="number" step="0.01" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pip Value ($) — default 10 for forex</label>
                <Input value={pipValue} onChange={(e) => setPipValue(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" step="0.01" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pips (+/-)</label>
                <Input value={pipsCount} onChange={(e) => setPipsCount(e.target.value)} placeholder="30" className="bg-background border-border font-mono" type="number" />
              </div>
              <Button onClick={calculatePips} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
              {pipsResult && (
                <div className="font-mono text-sm text-primary bg-primary/5 rounded p-3 border border-primary/10">{pipsResult}</div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="news">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {news.length > 0 ? (
              news.map((n: any, i: number) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{n.category}</span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-auto">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{n.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.content}</p>
                  {n.source && <p className="text-xs text-muted-foreground mt-2 font-mono">Source: {n.source}</p>}
                </motion.div>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
                <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No news yet. Check back later for market updates.</p>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;
