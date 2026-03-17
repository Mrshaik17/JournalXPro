import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const Journal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [result, setResult] = useState<string>("");
  const [pnlAmount, setPnlAmount] = useState("");
  const [followPlan, setFollowPlan] = useState(true);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

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

  const addTrade = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!accountId) throw new Error("Select an account");
      if (!result) throw new Error("Select a result");
      if (!pnlAmount) throw new Error("Enter PnL amount");

      const pnl = result === "loss" ? -Math.abs(parseFloat(pnlAmount)) : Math.abs(parseFloat(pnlAmount));

      const { error } = await supabase.rpc("add_trade_and_update_balance", {
        p_user_id: user.id,
        p_account_id: accountId,
        p_entry_price: entryPrice ? parseFloat(entryPrice) : null,
        p_stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        p_take_profit: takeProfit ? parseFloat(takeProfit) : null,
        p_result: result,
        p_pnl_amount: pnl,
        p_follow_plan: followPlan,
        p_tags: tags ? tags.split(",").map((t) => t.trim()) : null,
        p_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Trade logged. Balance updated.");
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to add trade"),
  });

  const resetForm = () => {
    setEntryPrice("");
    setStopLoss("");
    setTakeProfit("");
    setResult("");
    setPnlAmount("");
    setFollowPlan(true);
    setNotes("");
    setTags("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your trade log</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle>Log Trade</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account *</label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Entry</label>
                  <Input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
                  <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
                  <Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Result *</label>
                  <Select value={result} onValueChange={setResult}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Win/Loss" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">PnL Amount *</label>
                  <Input value={pnlAmount} onChange={(e) => setPnlAmount(e.target.value)} placeholder="100.00" className="bg-background border-border font-mono" type="number" step="0.01" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (comma separated)</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="scalp, forex, EURUSD" className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trade notes..." className="bg-background border-border" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={followPlan} onCheckedChange={(c) => setFollowPlan(c === true)} id="followPlan" />
                <label htmlFor="followPlan" className="text-sm text-muted-foreground">Followed trading plan</label>
              </div>
              <Button onClick={() => addTrade.mutate()} disabled={addTrade.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {addTrade.isPending ? "Saving..." : "Save Trade"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">Create an account first before logging trades.</p>
        </div>
      ) : trades.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Account</th>
                <th className="text-left p-3">Result</th>
                <th className="text-right p-3">P&L</th>
                <th className="text-center p-3">Plan</th>
                <th className="text-left p-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const account = accounts.find((a) => a.id === trade.account_id);
                return (
                  <tr key={trade.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="p-3 font-mono text-xs">{format(new Date(trade.created_at), "MMM dd, HH:mm")}</td>
                    <td className="p-3 text-xs">{account?.name || "—"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        trade.result === "win" ? "bg-success/10 text-success" :
                        trade.result === "loss" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{trade.result}</span>
                    </td>
                    <td className={`p-3 text-right font-mono ${Number(trade.pnl_amount) >= 0 ? "text-success" : "text-destructive"}`}>
                      {Number(trade.pnl_amount) >= 0 ? "+" : ""}${Number(trade.pnl_amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">{trade.follow_plan ? "✓" : "✗"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{trade.tags?.join(", ") || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">No trades found. The best trade is sometimes no trade.</p>
        </div>
      )}
    </div>
  );
};

export default Journal;
