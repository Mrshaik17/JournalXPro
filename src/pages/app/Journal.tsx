import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, X, Image } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { compressImage } from "@/lib/compress";
import { FOREX_PAIRS } from "@/lib/tradingPairs";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const PairSelector = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const filtered = search
    ? FOREX_PAIRS.filter((p) => p.toLowerCase().includes(search.toLowerCase()))
    : FOREX_PAIRS;

  return (
    <div className="relative">
      <label className="text-xs text-muted-foreground mb-1 block">Pair</label>
      <Input
        value={isOpen ? search : value}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search or type pair..."
        className="bg-background border-border font-mono"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {filtered.slice(0, 30).map((pair) => (
            <button
              key={pair}
              type="button"
              onClick={() => {
                onChange(pair);
                setSearch("");
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {pair}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No match — type your own
            </div>
          )}
          {filtered.length > 30 && (
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground">
              Type to narrow down...
            </div>
          )}
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

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
  tradeDate: "",
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
  const [screenshotFiles, setScreenshotFiles] = useState<(File | null)[]>([
    null,
    null,
  ]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<
    (string | null)[]
  >([null, null]);

  const [resultFilter, setResultFilter] = useState("all");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("firebase_uid", user.id);

      if (error) throw error;

      return data || [];
    },
    enabled: !!user?.id,
  });
  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredTrades = useMemo(() => {
    if (resultFilter === "all") return trades;
    return trades.filter((trade: any) => trade.result === resultFilter);
  }, [trades, resultFilter]);

  const setField = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setForm((f) => ({
      ...f,
      customFields: [
        ...f.customFields,
        { label: newFieldLabel.trim(), value: "" },
      ],
    }));
    setNewFieldLabel("");
  };

  const updateCustomField = (i: number, value: string) => {
    setForm((f) => {
      const cf = [...f.customFields];
      cf[i] = { ...cf[i], value };
      return { ...f, customFields: cf };
    });
  };

  const removeCustomField = (i: number) => {
    setForm((f) => ({
      ...f,
      customFields: f.customFields.filter((_, idx) => idx !== i),
    }));
  };

  const handleScreenshotSelect =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const newFiles = [...screenshotFiles];
        newFiles[index] = file;
        setScreenshotFiles(newFiles);

        const reader = new FileReader();
        reader.onload = () => {
          const newPreviews = [...screenshotPreviews];
          newPreviews[index] = reader.result as string;
          setScreenshotPreviews(newPreviews);
        };
        reader.readAsDataURL(file);
      }
    };

  const uploadScreenshotsToCloudinary = async () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary env values are missing");
  }

  const uploadedUrls: string[] = [];
  const uploadedPublicIds: string[] = [];

  for (const file of screenshotFiles) {
    if (!file) continue;

    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();

    // ✅ IMPORTANT: SAVE BOTH
    uploadedUrls.push(data.secure_url);
    uploadedPublicIds.push(data.public_id);
  }

  return {
    urls: uploadedUrls.join(","),
    publicIds: uploadedPublicIds,
  };
};
const recalculateAccountBalance = async (accountId: string) => {
  if (!user?.id) return;

  // 1. get account
  const { data: account } = await supabase
    .from("accounts")
    .select("startingbalance")
    .eq("id", accountId)
    .eq("firebase_uid", user.id)
    .single();

  // 2. get all trades of this account
  const { data: trades } = await supabase
    .from("trades")
    .select("pnl_amount")
    .eq("account_id", accountId)
    .eq("user_id", user.id);

  // 3. calculate total pnl
  const totalPnl = (trades || []).reduce(
    (sum, t) => sum + Number(t.pnl_amount || 0),
    0
  );

  // 4. update account balance
  await supabase
    .from("accounts")
    .update({
      current_balance: Number(account?.startingbalance || 0) + totalPnl,
    })
    .eq("id", accountId)
    .eq("firebase_uid", user.id);
};
const deleteTrade = useMutation({
  mutationFn: async (trade: any) => {
    if (!user?.id) throw new Error("Not authenticated");

    const account = accounts.find((a: any) => a.id === trade.account_id);
    if (!account) throw new Error("Account not found");

    const deletedPnl = Number(trade.pnl_amount || 0);
    const currentBalance = Number(account.current_balance || 0);

    if (trade.screenshot_public_ids?.length > 0) {
      const { error } = await supabase.functions.invoke(
        "delete-cloudinary-images",
        {
          body: { publicIds: trade.screenshot_public_ids },
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Cloudinary image delete failed");
      }
    }

    const { error: tradeDeleteError } = await supabase
      .from("trades")
      .delete()
      .eq("id", trade.id)
      .eq("user_id", user.id);

    if (tradeDeleteError) throw tradeDeleteError;

    const { error: balanceError } = await supabase
      .from("accounts")
      .update({
        current_balance: currentBalance - deletedPnl,
      })
      .eq("id", trade.account_id);

    if (balanceError) throw balanceError;
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trades"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-trades"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    toast.success("Trade deleted.");
  },

  onError: (err: any) => {
    console.error(err);
    toast.error(err.message || "Delete failed");
  },
});

  const saveTrade = useMutation({
  mutationFn: async () => {
    if (!user) throw new Error("Not authenticated");

    const pnl =
      form.result === "loss"
        ? -Math.abs(parseFloat(form.pnlAmount))
        : form.result === "breakeven"
        ? 0
        : Math.abs(parseFloat(form.pnlAmount));

    const cfObj: Record<string, string> = {};
    form.customFields.forEach((cf) => {
      cfObj[cf.label] = cf.value;
    });
    let screenshotUrl: string | null = null;
let screenshotPublicIds: string[] | null = null;

const hasNewScreenshots = screenshotFiles.some(Boolean);

if (hasNewScreenshots) {
  const uploadResult = await uploadScreenshotsToCloudinary();
  screenshotUrl = uploadResult.urls;
  screenshotPublicIds = uploadResult.publicIds;
} else if (editingId) {
  const existingTrade = trades.find((t: any) => t.id === editingId);
  screenshotUrl = existingTrade?.screenshot_url || null;
  screenshotPublicIds = existingTrade?.screenshot_public_ids || null;
}
const tradeDateTime = form.tradeDate
  ? `${form.tradeDate}T${form.entryTime || "00:00"}:00`
  : null;

    const tradePayload: any = {
      user_id: user.id,
      account_id: form.accountId,
      pair: form.pair || null,
      direction: form.direction || null,
      lot_size: form.lotSize ? parseFloat(form.lotSize) : null,
      result: form.result,
      pnl_amount: pnl,
      follow_plan: form.followPlan,
      trade_date: tradeDateTime,
      custom_fields: cfObj,
      screenshot_url: screenshotUrl,
      screenshot_public_ids: screenshotPublicIds,
    };

    if (editingId) {
      // 🧠 GET OLD TRADE
      const oldTrade = trades.find((t: any) => t.id === editingId);
      const oldPnl = Number(oldTrade?.pnl_amount || 0);

      const { error } = await supabase
        .from("trades")
        .update(tradePayload)
        .eq("id", editingId);

      if (error) throw error;

      // 🔥 UPDATE ACCOUNT BALANCE (DIFFERENCE)
      const diff = pnl - oldPnl;

      const { error: balError } = await supabase
        .from("accounts")
        .update({
          current_balance:
            (accounts.find((a: any) => a.id === form.accountId)
              ?.current_balance || 0) + diff,
        })
        .eq("id", form.accountId);

      if (balError) throw balError;
    } else {
      const { error } = await supabase
        .from("trades")
        .insert([tradePayload]);

      if (error) throw error;

      // 🔥 UPDATE ACCOUNT BALANCE (NEW TRADE)
      const account = accounts.find((a: any) => a.id === form.accountId);

      const { error: balError } = await supabase
        .from("accounts")
        .update({
          current_balance:
            (account?.current_balance || 0) + pnl,
        })
        .eq("id", form.accountId);

      if (balError) throw balError;
    }
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    toast.success(editingId ? "Trade updated." : "Trade saved.");
    resetForm();
    setOpen(false);
  },

  onError: (err: any) => {
    console.error(err);
    toast.error(err.message || "Error saving trade");
  },
});

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNewFieldLabel("");
    setScreenshotFiles([null, null]);
    setScreenshotPreviews([null, null]);
  };

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
      tradeDate: trade.trade_date ? trade.trade_date.split("T")[0] : "",
      entryTime: trade.entry_time
        ? format(new Date(trade.entry_time), "yyyy-MM-dd'T'HH:mm")
        : "",
      exitTime: trade.exit_time
        ? format(new Date(trade.exit_time), "yyyy-MM-dd'T'HH:mm")
        : "",
      followPlan: trade.follow_plan ?? true,
      notes: trade.notes || "",
      tags: (trade.tags || []).join(", "),
      customFields: Object.entries(cf).map(([label, value]) => ({
        label,
        value: String(value),
      })),
    });
    setEditingId(trade.id);

    if (trade.screenshot_url) {
      const urls = trade.screenshot_url.split(",");
      setScreenshotPreviews([urls[0] || null, urls[1] || null]);
    } else {
      setScreenshotPreviews([null, null]);
    }

    setScreenshotFiles([null, null]);
    setOpen(true);
  };

  const formFields = (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Account *
        </label>
        <Select
          value={form.accountId}
          onValueChange={(v) => setField("accountId", v)}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {accounts.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PairSelector value={form.pair} onChange={(v) => setField("pair", v)} />

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Buy / Sell
        </label>
        <Select
          value={form.direction}
          onValueChange={(v) => setField("direction", v)}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Went
          </label>
          <Input
            value={form.went}
            onChange={(e) => setField("went", e.target.value)}
            placeholder="Up/Down"
            className="bg-background border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Lot Size
          </label>
          <Input
            value={form.lotSize}
            onChange={(e) => setField("lotSize", e.target.value)}
            placeholder="0.01"
            className="bg-background border-border font-mono"
            type="number"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            1D Bias
          </label>
          <Input
            value={form.bias1d}
            onChange={(e) => setField("bias1d", e.target.value)}
            placeholder="Bullish"
            className="bg-background border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Entry
          </label>
          <Input
            value={form.entryPrice}
            onChange={(e) => setField("entryPrice", e.target.value)}
            placeholder="0.00"
            className="bg-background border-border font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">SL</label>
          <Input
            value={form.stopLoss}
            onChange={(e) => setField("stopLoss", e.target.value)}
            placeholder="0.00"
            className="bg-background border-border font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">TP</label>
          <Input
            value={form.takeProfit}
            onChange={(e) => setField("takeProfit", e.target.value)}
            placeholder="0.00"
            className="bg-background border-border font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Result *
          </label>
          <Select
            value={form.result}
            onValueChange={(v) => setField("result", v)}
          >
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
          <label className="text-xs text-muted-foreground mb-1 block">
            PnL Amount *
          </label>
          <Input
            value={form.pnlAmount}
            onChange={(e) => setField("pnlAmount", e.target.value)}
            placeholder="100.00"
            className="bg-background border-border font-mono"
            type="number"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Pips +/-
          </label>
          <Input
            value={form.pips}
            onChange={(e) => setField("pips", e.target.value)}
            placeholder="30"
            className="bg-background border-border font-mono"
            type="number"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Start Bal
          </label>
          <Input
            value={form.startBalance}
            onChange={(e) => setField("startBalance", e.target.value)}
            placeholder="1000"
            className="bg-background border-border font-mono"
            type="number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            End Bal
          </label>
          <Input
            value={form.endBalance}
            onChange={(e) => setField("endBalance", e.target.value)}
            placeholder="1100"
            className="bg-background border-border font-mono"
            type="number"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Tags (comma sep)
          </label>
          <Input
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="scalp, forex"
            className="bg-background border-border"
          />
        </div>
      </div>
      <div>
  <label className="text-xs text-muted-foreground mb-1 block">
    Trade Date *
  </label>
  <Input
    type="date"
    value={form.tradeDate}
    onChange={(e) => setField("tradeDate", e.target.value)}
    style={{ colorScheme: "dark" }}
    className="bg-background text-white border-border px-2 py-1 rounded-md"
  />
</div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Entry Time
          </label>
          <Input
            type="time"
            value={form.entryTime}
            onChange={(e) => setField("entryTime", e.target.value)}
            className="bg-background border-border text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Exit Time
          </label>
          <Input
            type="time"
            value={form.exitTime}
            onChange={(e) => setField("exitTime", e.target.value)}
            className="bg-background border-border text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Trade Screenshots (max 2)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((idx) => (
            <div key={idx}>
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border bg-background cursor-pointer hover:border-muted-foreground/30 transition-colors">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  {screenshotFiles[idx]
                    ? screenshotFiles[idx]?.name
                    : `Photo ${idx + 1}`}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotSelect(idx)}
                />
              </label>
              {screenshotPreviews[idx] && (
                <div className="mt-1 relative">
                  <img
                    src={screenshotPreviews[idx]!}
                    alt={`Screenshot ${idx + 1}`}
                    className="rounded-md max-h-24 object-cover border border-border w-full"
                  />
                  <button
                    onClick={() => {
                      const nf = [...screenshotFiles];
                      nf[idx] = null;
                      setScreenshotFiles(nf);
                      const np = [...screenshotPreviews];
                      np[idx] = null;
                      setScreenshotPreviews(np);
                    }}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Trade notes..."
          className="bg-background border-border"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={form.followPlan}
          onCheckedChange={(c) => setField("followPlan", c === true)}
          id="followPlan"
        />
        <label
          htmlFor="followPlan"
          className="text-sm text-muted-foreground"
        >
          Followed trading plan
        </label>
      </div>

      <div className="border-t border-border pt-3">
        <label className="text-xs text-muted-foreground mb-2 block font-semibold">
          Custom Fields
        </label>
        {form.customFields.map((cf, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground min-w-[80px]">
              {cf.label}
            </span>
            <Input
              value={cf.value}
              onChange={(e) => updateCustomField(i, e.target.value)}
              className="bg-background border-border text-xs flex-1"
            />
            <button
              onClick={() => removeCustomField(i)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            placeholder="Field name"
            className="bg-background border-border text-xs flex-1"
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addCustomField())
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomField}
            className="text-xs"
          >
            + Add
          </Button>
        </div>
      </div>

      <Button
        onClick={() => saveTrade.mutate()}
        disabled={saveTrade.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saveTrade.isPending
          ? "Saving..."
          : editingId
          ? "Update Trade"
          : "Save Trade"}
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
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Trade" : "Log Trade"}</DialogTitle>
            </DialogHeader>
            {formFields}
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length > 0 && trades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={resultFilter === "all" ? "default" : "outline"}
            onClick={() => setResultFilter("all")}
            className={
              resultFilter === "all"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : ""
            }
          >
            All Trades
          </Button>

          <Button
            variant={resultFilter === "win" ? "default" : "outline"}
            onClick={() => setResultFilter("win")}
            className={
              resultFilter === "win"
                ? "bg-success text-white hover:bg-success/90"
                : ""
            }
          >
            Win
          </Button>

          <Button
            variant={resultFilter === "loss" ? "default" : "outline"}
            onClick={() => setResultFilter("loss")}
            className={
              resultFilter === "loss"
                ? "bg-destructive text-white hover:bg-destructive/90"
                : ""
            }
          >
            Loss
          </Button>

          <Button
            variant={resultFilter === "breakeven" ? "default" : "outline"}
            onClick={() => setResultFilter("breakeven")}
            className={
              resultFilter === "breakeven"
                ? "bg-muted text-foreground hover:bg-muted/90"
                : ""
            }
          >
            Breakeven
          </Button>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">
            Create an account first before logging trades.
          </p>
        </div>
      ) : filteredTrades.length > 0 ? (
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
              {filteredTrades.map((trade: any) => {
                const account = accounts.find((a: any) => a.id === trade.account_id);
                return (
                  <tr
                    key={trade.id}
                    className="border-b border-border last:border-0 hover:bg-muted/10"
                  >
                    <td className="p-3 font-mono text-xs">
                      {format(new Date(trade.trade_date || trade.created_at), "MMM dd, HH:mm")}
                    </td>
                    <td className="p-3 text-xs font-mono">{trade.pair || "—"}</td>
                    <td className="p-3 text-xs">{trade.direction || "—"}</td>
                    <td className="p-3 text-xs">{account?.name || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trade.result === "win"
                            ? "bg-success/10 text-success"
                            : trade.result === "loss"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trade.result}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs">
                      {trade.pips ?? "—"}
                    </td>
                    <td
                      className={`p-3 text-right font-mono ${
                        Number(trade.pnl_amount) >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {Number(trade.pnl_amount) >= 0 ? "+" : ""}$
                      {Number(trade.pnl_amount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {trade.follow_plan ? "✓" : "✗"}
                    </td>
                    <td className="p-3 text-center">
                      {trade.screenshot_url ? (
                        <img
                          src={trade.screenshot_url.split(",")[0]}
                          className="h-8 w-8 rounded object-cover cursor-pointer mx-auto"
                          onClick={() =>
                            window.open(trade.screenshot_url.split(",")[0])
                          }
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {trade.tags?.join(", ") || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(trade)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTrade.mutate(trade)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
          <p className="text-muted-foreground text-sm">
            {resultFilter === "all"
              ? "No trades found. The best trade is sometimes no trade."
              : `No ${resultFilter} trades found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Journal;