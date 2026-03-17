import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Accounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
        user_id: user.id,
        name,
        initial_balance: bal,
        current_balance: bal,
        account_type: accountType || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created.");
      setName("");
      setInitialBalance("");
      setAccountType("");
      setOpen(false);
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
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your trading accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Trading Account" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Initial Balance ($)</label>
                <Input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="1000" className="bg-background border-border font-mono" type="number" step="0.01" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Type (optional)</label>
                <Input value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="Live, Demo, Prop..." className="bg-background border-border" />
              </div>
              <Button onClick={() => createAccount.mutate()} disabled={createAccount.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {createAccount.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const accTrades = trades.filter((t) => t.account_id === acc.id);
            const pnl = Number(acc.current_balance) - Number(acc.initial_balance);
            const pnlPercent = Number(acc.initial_balance) > 0 ? ((pnl / Number(acc.initial_balance)) * 100).toFixed(1) : "0";
            const wins = accTrades.filter((t) => t.result === "win").length;
            const winRate = accTrades.length > 0 ? ((wins / accTrades.length) * 100).toFixed(0) : "0";

            return (
              <div key={acc.id} className="rounded-lg border border-border bg-card p-5 card-glow group hover:divine-border transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{acc.name}</h3>
                    {acc.account_type && <span className="text-xs text-muted-foreground">{acc.account_type}</span>}
                  </div>
                  <button onClick={() => deleteAccount.mutate(acc.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="font-mono text-2xl font-bold mb-2">${Number(acc.current_balance).toFixed(2)}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Initial</span>
                    <span className="font-mono">${Number(acc.initial_balance).toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">P&L</span>
                    <span className={`font-mono ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {pnl >= 0 ? "+" : ""}{pnlPercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Win Rate</span>
                    <span className="font-mono">{winRate}%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{accTrades.length} trades</div>
              </div>
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
