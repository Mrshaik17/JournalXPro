import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ArrowLeft, TrendingUp, Target, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

const Accounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [accountCategory, setAccountCategory] = useState<"broker" | "propfirm">("broker");
  const [dailyDrawdown, setDailyDrawdown] = useState("");
  const [maxDrawdown, setMaxDrawdown] = useState("");
  const [hasConsistency, setHasConsistency] = useState(false);
  const [consistencyValue, setConsistencyValue] = useState("");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!name) throw new Error("Name required");
      const bal = parseFloat(initialBalance) || 0;
      const typeStr = accountCategory === "propfirm"
        ? `Prop Firm${dailyDrawdown ? ` | DD:${dailyDrawdown}%` : ""}${maxDrawdown ? ` | MaxDD:${maxDrawdown}%` : ""}${hasConsistency && consistencyValue ? ` | CS:${consistencyValue}%` : ""}`
        : "Broker";
      const { error } = await supabase.from("accounts").insert({
        user_id: user.id, name, initial_balance: bal, current_balance: bal, account_type: typeStr,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created.");
      setName(""); setInitialBalance(""); setAccountCategory("broker"); setDailyDrawdown(""); setMaxDrawdown(""); setHasConsistency(false); setConsistencyValue(""); setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Account deleted.");
      setSearchParams({});
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Account detail view
  const selectedAccount = accounts.find((a) => a.id === viewId);
  const accountTrades = trades.filter((t) => t.account_id === viewId);

  if (selectedAccount) {
    const pnl = Number(selectedAccount.current_balance) - Number(selectedAccount.initial_balance);
    const pnlPercent = Number(selectedAccount.initial_balance) > 0 ? ((pnl / Number(selectedAccount.initial_balance)) * 100).toFixed(1) : "0";
    const wins = accountTrades.filter((t) => t.result === "win").length;
    const winRate = accountTrades.length > 0 ? ((wins / accountTrades.length) * 100).toFixed(0) : "0";
    const totalLots = accountTrades.reduce((s, t) => s + (Number(t.lot_size) || 0), 0);
    const profitTrades = accountTrades.filter((t) => Number(t.pnl_amount) > 0);
    const lossTrades = accountTrades.filter((t) => Number(t.pnl_amount) < 0);
    const avgProfit = profitTrades.length > 0 ? profitTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / profitTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + Number(t.pnl_amount), 0) / lossTrades.length) : 0;
    const tradesWithRR = accountTrades.filter((t) => t.entry_price && t.stop_loss && t.take_profit);
    const avgRR = tradesWithRR.length > 0
      ? (tradesWithRR.reduce((s, t) => { const r = Math.abs(Number(t.entry_price) - Number(t.stop_loss)); const rw = Math.abs(Number(t.take_profit) - Number(t.entry_price)); return s + (r > 0 ? rw / r : 0); }, 0) / tradesWithRR.length).toFixed(2)
      : "—";

    // Equity curve for this account
    let eq = Number(selectedAccount.initial_balance);
    const sortedTrades = [...accountTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const eqData = sortedTrades.map((t) => {
      eq += Number(t.pnl_amount);
      return { date: format(new Date(t.created_at), "MMM dd"), equity: eq };
    });

    // Parse prop firm info
    const isPropFirm = selectedAccount.account_type?.startsWith("Prop Firm");
    const ddMatch = selectedAccount.account_type?.match(/DD:([\d.]+)%/);
    const maxDDMatch = selectedAccount.account_type?.match(/MaxDD:([\d.]+)%/);
    const accDailyDD = ddMatch ? parseFloat(ddMatch[1]) : null;
    const accMaxDD = maxDDMatch ? parseFloat(maxDDMatch[1]) : null;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchParams({})} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold">{selectedAccount.name}</h1>
            {selectedAccount.account_type && <p className="text-sm text-muted-foreground">{selectedAccount.account_type}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Balance", value: `$${Number(selectedAccount.current_balance).toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
            { label: "P&L", value: `${pnl >= 0 ? "+" : ""}${pnlPercent}%`, icon: BarChart3, color: pnl >= 0 ? "text-success" : "text-destructive" },
            { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-primary" },
            { label: "Trades", value: String(accountTrades.length), icon: BarChart3, color: "text-muted-foreground" },
            { label: "Total Lots", value: totalLots.toFixed(2), icon: Activity, color: "text-primary" },
            { label: "Avg RR", value: avgRR, icon: Target, color: "text-primary" },
            { label: "Avg Profit", value: `$${avgProfit.toFixed(2)}`, icon: TrendingUp, color: "text-success" },
            { label: "Avg Loss", value: `$${avgLoss.toFixed(2)}`, icon: AlertTriangle, color: "text-destructive" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-card p-4 card-glow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <div className="font-mono text-lg font-bold">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Prop Firm Tracker */}
        {isPropFirm && (accDailyDD || accMaxDD) && (
          <div className="rounded-lg border border-border bg-card p-5 card-glow">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Prop Firm Limits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accDailyDD && (() => {
                const dailyLimit = Number(selectedAccount.initial_balance) * (accDailyDD / 100);
                const todayTrades = accountTrades.filter((t) => new Date(t.created_at).toDateString() === new Date().toDateString());
                const todayLoss = Math.abs(todayTrades.filter((t) => Number(t.pnl_amount) < 0).reduce((s, t) => s + Number(t.pnl_amount), 0));
                const pct = (todayLoss / dailyLimit) * 100;
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Daily DD Used</span><span className="font-mono">${todayLoss.toFixed(2)} / ${dailyLimit.toFixed(2)}</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-yellow-500" : "bg-success"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  </div>
                );
              })()}
              {accMaxDD && (() => {
                const maxLimit = Number(selectedAccount.initial_balance) * (accMaxDD / 100);
                const totalLoss = Math.abs(lossTrades.reduce((s, t) => s + Number(t.pnl_amount), 0));
                const pct = (totalLoss / maxLimit) * 100;
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Max DD Used</span><span className="font-mono">${totalLoss.toFixed(2)} / ${maxLimit.toFixed(2)}</span></div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-yellow-500" : "bg-success"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Equity Curve */}
        {eqData.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-5 card-glow">
            <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">Trade History</h2>
          {accountTrades.length > 0 ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3">Date</th><th className="text-left p-3">Pair</th><th className="text-left p-3">Result</th><th className="text-right p-3">P&L</th><th className="text-center p-3">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {accountTrades.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="p-3 font-mono text-xs">{format(new Date(t.created_at), "MMM dd, HH:mm")}</td>
                      <td className="p-3 font-mono text-xs">{t.pair || "—"}</td>
                      <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.result === "win" ? "bg-success/10 text-success" : t.result === "loss" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{t.result}</span></td>
                      <td className={`p-3 text-right font-mono ${Number(t.pnl_amount) >= 0 ? "text-success" : "text-destructive"}`}>{Number(t.pnl_amount) >= 0 ? "+" : ""}${Number(t.pnl_amount).toFixed(2)}</td>
                      <td className="p-3 text-center">{t.follow_plan ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
              <p className="text-muted-foreground text-sm">No trades for this account yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your trading accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> New Account</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Name *</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Trading Account" className="bg-background border-border" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Initial Balance ($)</label><Input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="1000" className="bg-background border-border font-mono" type="number" step="0.01" /></div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Type *</label>
                <Select value={accountCategory} onValueChange={(v: "broker" | "propfirm") => setAccountCategory(v)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="propfirm">Prop Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {accountCategory === "propfirm" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-muted-foreground mb-1 block">Daily Drawdown %</label><Input value={dailyDrawdown} onChange={(e) => setDailyDrawdown(e.target.value)} placeholder="5" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
                      <div><label className="text-xs text-muted-foreground mb-1 block">Max Drawdown %</label><Input value={maxDrawdown} onChange={(e) => setMaxDrawdown(e.target.value)} placeholder="10" className="bg-background border-border font-mono" type="number" step="0.1" /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={hasConsistency} onCheckedChange={(c) => setHasConsistency(c === true)} id="consistency" />
                      <label htmlFor="consistency" className="text-xs text-muted-foreground">Has consistency rule?</label>
                    </div>
                    {hasConsistency && (
                      <div><label className="text-xs text-muted-foreground mb-1 block">Consistency Score Limit %</label><Input value={consistencyValue} onChange={(e) => setConsistencyValue(e.target.value)} placeholder="25" className="bg-background border-border font-mono" type="number" step="1" /></div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={() => createAccount.mutate()} disabled={createAccount.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {createAccount.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc, i) => {
            const accTrades = trades.filter((t) => t.account_id === acc.id);
            const pnl = Number(acc.current_balance) - Number(acc.initial_balance);
            const pnlPercent = Number(acc.initial_balance) > 0 ? ((pnl / Number(acc.initial_balance)) * 100).toFixed(1) : "0";
            const w = accTrades.filter((t) => t.result === "win").length;
            const wr = accTrades.length > 0 ? ((w / accTrades.length) * 100).toFixed(0) : "0";
            const totalLots = accTrades.reduce((s, t) => s + (Number(t.lot_size) || 0), 0);
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSearchParams({ view: acc.id })}
                className="rounded-lg border border-border bg-card p-5 card-glow group hover:divine-border transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{acc.name}</h3>
                    {acc.account_type && <span className="text-xs text-muted-foreground">{acc.account_type?.split("|")[0]?.trim()}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteAccount.mutate(acc.id); }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="font-mono text-2xl font-bold mb-2">${Number(acc.current_balance).toFixed(2)}</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><span className="text-muted-foreground block">Initial</span><span className="font-mono">${Number(acc.initial_balance).toFixed(0)}</span></div>
                  <div><span className="text-muted-foreground block">P&L</span><span className={`font-mono ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{pnl >= 0 ? "+" : ""}{pnlPercent}%</span></div>
                  <div><span className="text-muted-foreground block">Win Rate</span><span className="font-mono">{wr}%</span></div>
                  <div><span className="text-muted-foreground block">Lots</span><span className="font-mono">{totalLots.toFixed(2)}</span></div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{accTrades.length} trades</div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">No accounts yet. Create your first trading account to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Accounts;
