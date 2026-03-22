import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, X, Upload, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CustomField {
  label: string;
  value: string;
}

const emptyForm = {
  accountId: "",
  pair: "",
  direction: "",
  went: "",
  lotSize: "",
  bias1d: "",
  pips: "",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  result: "",
  pnlAmount: "",
  startBalance: "",
  endBalance: "",
  entryTime: "",
  exitTime: "",
  followPlan: true,
  notes: "",
  tags: "",
  customFields: [] as CustomField[],
};

const Journal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<(File | null)[]>([null, null]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<(string | null)[]>([null, null]);

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

  const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setForm((f) => ({ ...f, customFields: [...f.customFields, { label: newFieldLabel.trim(), value: "" }] }));
    setNewFieldLabel("");
  };

  const updateCustomField = (i: number, value: string) => {
    setForm((f) => { const cf = [...f.customFields]; cf[i] = { ...cf[i], value }; return { ...f, customFields: cf }; });
  };

  const removeCustomField = (i: number) => {
    setForm((f) => ({ ...f, customFields: f.customFields.filter((_, idx) => idx !== i) }));
  };

  const handleScreenshotSelect = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...screenshotFiles]; newFiles[index] = file;
      setScreenshotFiles(newFiles);
      const reader = new FileReader();
      reader.onload = () => { const newPreviews = [...screenshotPreviews]; newPreviews[index] = reader.result as string; setScreenshotPreviews(newPreviews); };
      reader.readAsDataURL(file);
    }
  };

  const saveTrade = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.accountId) throw new Error("Select an account");
      if (!form.result) throw new Error("Select a result");
      if (!form.pnlAmount) throw new Error("Enter PnL amount");

      const pnl = form.result === "loss" ? -Math.abs(parseFloat(form.pnlAmount)) : Math.abs(parseFloat(form.pnlAmount));
      const cfObj: Record<string, string> = {};
      form.customFields.forEach((cf) => { cfObj[cf.label] = cf.value; });

      // Upload screenshot if exists
      let screenshotUrl: string | null = null;
      if (screenshotFile) {
        const filePath = `${user.id}/${Date.now()}-${screenshotFile.name}`;
        const { error: uploadError } = await supabase.storage.from("trade-screenshots").upload(filePath, screenshotFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("trade-screenshots").getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
      }

      if (editingId) {
        const updateData: any = {
          account_id: form.accountId,
          pair: form.pair || null,
          direction: form.direction || null,
          went: form.went || null,
          lot_size: form.lotSize ? parseFloat(form.lotSize) : null,
          bias_1d: form.bias1d || null,
          pips: form.pips ? parseFloat(form.pips) : null,
          entry_price: form.entryPrice ? parseFloat(form.entryPrice) : null,
          stop_loss: form.stopLoss ? parseFloat(form.stopLoss) : null,
          take_profit: form.takeProfit ? parseFloat(form.takeProfit) : null,
          result: form.result,
          pnl_amount: pnl,
          start_balance: form.startBalance ? parseFloat(form.startBalance) : null,
          end_balance: form.endBalance ? parseFloat(form.endBalance) : null,
          entry_time: form.entryTime || null,
          exit_time: form.exitTime || null,
          follow_plan: form.followPlan,
          notes: form.notes || null,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
          custom_fields: cfObj,
        };
        if (screenshotUrl) updateData.screenshot_url = screenshotUrl;
        const { error } = await supabase.from("trades").update(updateData).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("add_trade_and_update_balance", {
          p_user_id: user.id,
          p_account_id: form.accountId,
          p_pair: form.pair || null,
          p_direction: form.direction || null,
          p_went: form.went || null,
          p_lot_size: form.lotSize ? parseFloat(form.lotSize) : null,
          p_bias_1d: form.bias1d || null,
          p_pips: form.pips ? parseFloat(form.pips) : null,
          p_entry_price: form.entryPrice ? parseFloat(form.entryPrice) : null,
          p_stop_loss: form.stopLoss ? parseFloat(form.stopLoss) : null,
          p_take_profit: form.takeProfit ? parseFloat(form.takeProfit) : null,
          p_result: form.result,
          p_pnl_amount: pnl,
          p_start_balance: form.startBalance ? parseFloat(form.startBalance) : null,
          p_end_balance: form.endBalance ? parseFloat(form.endBalance) : null,
          p_entry_time: form.entryTime || null,
          p_exit_time: form.exitTime || null,
          p_follow_plan: form.followPlan,
          p_tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
          p_notes: form.notes || null,
          p_custom_fields: cfObj,
        });
        if (error) throw error;
        // Update screenshot_url separately if uploaded
        if (screenshotUrl) {
          // Get the latest trade to update
          const { data: latestTrades } = await supabase.from("trades").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
          if (latestTrades && latestTrades[0]) {
            await supabase.from("trades").update({ screenshot_url: screenshotUrl } as any).eq("id", latestTrades[0].id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(editingId ? "Trade updated." : "Trade logged. Balance updated.");
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save trade"),
  });

  const deleteTrade = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("trades").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trades"] }); queryClient.invalidateQueries({ queryKey: ["accounts"] }); toast.success("Trade deleted."); },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setNewFieldLabel(""); setScreenshotFile(null); setScreenshotPreview(null); };

  const openEdit = (trade: any) => {
    const cf = trade.custom_fields || {};
    setForm({
      accountId: trade.account_id,
      pair: trade.pair || "",
      direction: trade.direction || "",
      went: trade.went || "",
      lotSize: trade.lot_size?.toString() || "",
      bias1d: trade.bias_1d || "",
      pips: trade.pips?.toString() || "",
      entryPrice: trade.entry_price?.toString() || "",
      stopLoss: trade.stop_loss?.toString() || "",
      takeProfit: trade.take_profit?.toString() || "",
      result: trade.result || "",
      pnlAmount: Math.abs(Number(trade.pnl_amount)).toString(),
      startBalance: trade.start_balance?.toString() || "",
      endBalance: trade.end_balance?.toString() || "",
      entryTime: trade.entry_time ? format(new Date(trade.entry_time), "yyyy-MM-dd'T'HH:mm") : "",
      exitTime: trade.exit_time ? format(new Date(trade.exit_time), "yyyy-MM-dd'T'HH:mm") : "",
      followPlan: trade.follow_plan ?? true,
      notes: trade.notes || "",
      tags: (trade.tags || []).join(", "),
      customFields: Object.entries(cf).map(([label, value]) => ({ label, value: String(value) })),
    });
    setEditingId(trade.id);
    if ((trade as any).screenshot_url) setScreenshotPreview((trade as any).screenshot_url);
    setOpen(true);
  };

  const formFields = (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Account *</label>
        <Select value={form.accountId} onValueChange={(v) => setField("accountId", v)}>
          <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select account" /></SelectTrigger>
          <SelectContent className="bg-card border-border">{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Pair</label><Input value={form.pair} onChange={(e) => setField("pair", e.target.value)} placeholder="EURUSD" className="bg-background border-border font-mono" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Buy / Sell</label>
          <Select value={form.direction} onValueChange={(v) => setField("direction", v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="buy">Buy</SelectItem><SelectItem value="sell">Sell</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Went</label><Input value={form.went} onChange={(e) => setField("went", e.target.value)} placeholder="Up/Down" className="bg-background border-border" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Lot Size</label><Input value={form.lotSize} onChange={(e) => setField("lotSize", e.target.value)} placeholder="0.01" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">1D Bias</label><Input value={form.bias1d} onChange={(e) => setField("bias1d", e.target.value)} placeholder="Bullish" className="bg-background border-border" /></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Entry</label><Input value={form.entryPrice} onChange={(e) => setField("entryPrice", e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">SL</label><Input value={form.stopLoss} onChange={(e) => setField("stopLoss", e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">TP</label><Input value={form.takeProfit} onChange={(e) => setField("takeProfit", e.target.value)} placeholder="0.00" className="bg-background border-border font-mono" /></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Result *</label>
          <Select value={form.result} onValueChange={(v) => setField("result", v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Win/Loss" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="win">Win</SelectItem><SelectItem value="loss">Loss</SelectItem><SelectItem value="breakeven">Breakeven</SelectItem></SelectContent>
          </Select>
        </div>
        <div><label className="text-xs text-muted-foreground mb-1 block">PnL Amount *</label><Input value={form.pnlAmount} onChange={(e) => setField("pnlAmount", e.target.value)} placeholder="100.00" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Pips +/-</label><Input value={form.pips} onChange={(e) => setField("pips", e.target.value)} placeholder="30" className="bg-background border-border font-mono" type="number" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Start Bal</label><Input value={form.startBalance} onChange={(e) => setField("startBalance", e.target.value)} placeholder="1000" className="bg-background border-border font-mono" type="number" /></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">End Bal</label><Input value={form.endBalance} onChange={(e) => setField("endBalance", e.target.value)} placeholder="1100" className="bg-background border-border font-mono" type="number" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Tags (comma sep)</label><Input value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="scalp, forex" className="bg-background border-border" /></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground mb-1 block">Entry Time</label><Input type="datetime-local" value={form.entryTime} onChange={(e) => setField("entryTime", e.target.value)} className="bg-background border-border text-xs" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Exit Time</label><Input type="datetime-local" value={form.exitTime} onChange={(e) => setField("exitTime", e.target.value)} className="bg-background border-border text-xs" /></div>
      </div>

      {/* Trade Screenshot */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Trade Screenshot</label>
        <label className="flex items-center gap-2 px-4 py-3 rounded-md border border-dashed border-border bg-background cursor-pointer hover:border-muted-foreground/30 transition-colors">
          <Image className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{screenshotFile ? screenshotFile.name : "Upload trade photo"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotSelect} />
        </label>
        {screenshotPreview && (
          <div className="mt-2 relative">
            <img src={screenshotPreview} alt="Trade screenshot" className="rounded-md max-h-32 object-cover border border-border" />
            <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
        <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Trade notes..." className="bg-background border-border" rows={2} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={form.followPlan} onCheckedChange={(c) => setField("followPlan", c === true)} id="followPlan" />
        <label htmlFor="followPlan" className="text-sm text-muted-foreground">Followed trading plan</label>
      </div>

      {/* Custom Fields */}
      <div className="border-t border-border pt-3">
        <label className="text-xs text-muted-foreground mb-2 block font-semibold">Custom Fields</label>
        {form.customFields.map((cf, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground min-w-[80px]">{cf.label}</span>
            <Input value={cf.value} onChange={(e) => updateCustomField(i, e.target.value)} className="bg-background border-border text-xs flex-1" />
            <button onClick={() => removeCustomField(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Field name" className="bg-background border-border text-xs flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomField())} />
          <Button type="button" variant="outline" size="sm" onClick={addCustomField} className="text-xs">+ Add</Button>
        </div>
      </div>

      <Button onClick={() => saveTrade.mutate()} disabled={saveTrade.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {saveTrade.isPending ? "Saving..." : editingId ? "Update Trade" : "Save Trade"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your trade log</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add Trade</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Trade" : "Log Trade"}</DialogTitle></DialogHeader>
            {formFields}
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">Create an account first before logging trades.</p>
        </div>
      ) : trades.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Pair</th>
                <th className="text-left p-3">Dir</th>
                <th className="text-left p-3">Account</th>
                <th className="text-left p-3">Result</th>
                <th className="text-right p-3">Pips</th>
                <th className="text-right p-3">P&L</th>
                <th className="text-center p-3">Plan</th>
                <th className="text-center p-3">Photo</th>
                <th className="text-left p-3">Tags</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const account = accounts.find((a) => a.id === trade.account_id);
                return (
                  <tr key={trade.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="p-3 font-mono text-xs">{format(new Date(trade.created_at), "MMM dd, HH:mm")}</td>
                    <td className="p-3 text-xs font-mono">{(trade as any).pair || "—"}</td>
                    <td className="p-3 text-xs">{(trade as any).direction || "—"}</td>
                    <td className="p-3 text-xs">{account?.name || "—"}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trade.result === "win" ? "bg-success/10 text-success" : trade.result === "loss" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{trade.result}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs">{(trade as any).pips ?? "—"}</td>
                    <td className={`p-3 text-right font-mono ${Number(trade.pnl_amount) >= 0 ? "text-success" : "text-destructive"}`}>
                      {Number(trade.pnl_amount) >= 0 ? "+" : ""}${Number(trade.pnl_amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">{trade.follow_plan ? "✓" : "✗"}</td>
                    <td className="p-3 text-center">
                      {(trade as any).screenshot_url ? (
                        <a href={(trade as any).screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">📷</a>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{trade.tags?.join(", ") || "—"}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(trade)} className="text-muted-foreground hover:text-primary"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteTrade.mutate(trade.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
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
