import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, TrendingUp, Target, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const Accounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [accountType, setAccountType] = useState("");

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
      const { error } = await supabase.from("accounts").insert({
        user_id: user.id, name, initial_balance: bal, current_balance: bal, account_type: accountType || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created.");
      setName(""); setInitialBalance(""); setAccountType(""); setOpen(false);
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

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchParams({})} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
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
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4 card-glow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <div className="font-mono text-lg font-bold">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Trade History</h2>
          {accountTrades.length > 0 ? (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Pair</th>
                    <th className="text-left p-3">Result</th>
                    <th className="text-right p-3">P&L</th>
                    <th className="text-center p-3">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {accountTrades.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="p-3 font-mono text-xs">{format(new Date(t.created_at), "MMM dd, HH:mm")}</td>
                      <td className="p-3 font-mono text-xs">{t.pair || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.result === "win" ? "bg-success/10 text-success" : t.result === "loss" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{t.result}</span>
                      </td>
                      <td className={`p-3 text-right font-mono ${Number(t.pnl_amount) >= 0 ? "text-success" : "text-destructive"}`}>
                        {Number(t.pnl_amount) >= 0 ? "+" : ""}${Number(t.pnl_amount).toFixed(2)}
                      </td>
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
              <div><label className="text-xs text-muted-foreground mb-1 block">Account Type (optional)</label><Input value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="Live, Demo, Prop..." className="bg-background border-border" /></div>
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
                    {acc.account_type && <span className="text-xs text-muted-foreground">{acc.account_type}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteAccount.mutate(acc.id); }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="font-mono text-2xl font-bold mb-2">${Number(acc.current_balance).toFixed(2)}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground block">Initial</span><span className="font-mono">${Number(acc.initial_balance).toFixed(0)}</span></div>
                  <div><span className="text-muted-foreground block">P&L</span><span className={`font-mono ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{pnl >= 0 ? "+" : ""}{pnlPercent}%</span></div>
                  <div><span className="text-muted-foreground block">Win Rate</span><span className="font-mono">{wr}%</span></div>
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
