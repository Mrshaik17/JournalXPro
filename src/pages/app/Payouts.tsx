import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Image, X, Share2, Lock, Filter, TrendingUp, DollarSign, Calendar, Award, Link2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { compressImage } from "@/lib/compress";

const Payouts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const plan = profile?.plan || "free";
  const canAccess = plan === "pro_plus" || plan === "elite";

  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts" as any).select("*").eq("user_id", user!.id).order("received_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && canAccess,
  });

  const companies = useMemo(() => [...new Set(payouts.map((p: any) => p.company_name))], [payouts]);

  const filtered = useMemo(() => {
    let result = [...payouts];
    if (filterMonth !== "all") result = result.filter((p: any) => format(new Date(p.received_date), "yyyy-MM") === filterMonth);
    if (filterCompany !== "all") result = result.filter((p: any) => p.company_name === filterCompany);
    if (sortBy === "amount") result.sort((a: any, b: any) => Number(b.payout_amount) - Number(a.payout_amount));
    else result.sort((a: any, b: any) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
    return result;
  }, [payouts, filterMonth, filterCompany, sortBy]);

  const totalPayouts = payouts.length;
  const totalProfit = payouts.reduce((s: number, p: any) => s + Number(p.payout_amount), 0);
  const avgMonthly = useMemo(() => {
    if (payouts.length === 0) return 0;
    const months = new Set(payouts.map((p: any) => format(new Date(p.received_date), "yyyy-MM")));
    return totalProfit / months.size;
  }, [payouts, totalProfit]);
  const yearlyProfit = useMemo(() => {
    const year = new Date().getFullYear();
    return payouts.filter((p: any) => new Date(p.received_date).getFullYear() === year).reduce((s: number, p: any) => s + Number(p.payout_amount), 0);
  }, [payouts]);
  const months = useMemo(() => [...new Set(payouts.map((p: any) => format(new Date(p.received_date), "yyyy-MM")))].sort().reverse(), [payouts]);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const savePayout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!companyName) throw new Error("Company name required");
      if (!payoutAmount) throw new Error("Payout amount required");

      let screenshotUrl: string | null = null;
      if (screenshotFile) {
        const compressed = await compressImage(screenshotFile);
        const filePath = `${user.id}/${Date.now()}-${compressed.name}`;
        const { error: uploadError } = await supabase.storage.from("payout-screenshots").upload(filePath, compressed);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("payout-screenshots").getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("payouts" as any).insert({
        user_id: user.id,
        company_name: companyName,
        payout_amount: parseFloat(payoutAmount),
        screenshot_url: screenshotUrl,
        received_date: receivedDate,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Payout recorded!");
      setCompanyName(""); setPayoutAmount(""); setScreenshotFile(null); setScreenshotPreview(null);
      setReceivedDate(format(new Date(), "yyyy-MM-dd")); setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePayout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payouts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payouts"] }); toast.success("Deleted."); },
  });

  const handleShareAll = () => {
    const text = `💰 My JournalXPro Payouts\n\nTotal Payouts: ${totalPayouts}\nTotal Profit: $${totalProfit.toFixed(2)}\nYearly: $${yearlyProfit.toFixed(2)}\nAvg Monthly: $${avgMonthly.toFixed(2)}\n\n${filtered.slice(0, 5).map((p: any) => `${p.company_name}: $${Number(p.payout_amount).toFixed(2)} (${format(new Date(p.received_date), "MMM dd, yyyy")})`).join("\n")}\n\n— JournalXPro`;
    navigator.clipboard.writeText(text);
    toast.success("Payout summary copied to clipboard!");
  };

  const handleShareSingle = (p: any) => {
    if (p.share_token) {
      const url = `${window.location.origin}/shared/payout/${p.share_token}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied! Anyone can view this payout.");
    } else {
      const text = `💰 ${p.company_name}: +$${Number(p.payout_amount).toFixed(2)} (${format(new Date(p.received_date), "MMM dd, yyyy")})\n— JournalXPro`;
      navigator.clipboard.writeText(text);
      toast.success("Payout info copied!");
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Payout Tracker</h1><p className="text-sm text-muted-foreground mt-1">Track all your trading payouts</p></div>
        <div className="rounded-lg border border-border bg-card p-12 card-glow text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold text-muted-foreground">Pro+ or Elite Plan Required</p>
            <p className="text-sm text-muted-foreground mt-1">Upgrade to track your payouts and share with anyone.</p>
            <a href="/app/upgrade" className="text-primary text-sm mt-3 underline">View Plans →</a>
          </div>
          <div className="blur-md pointer-events-none">
            <div className="grid grid-cols-4 gap-4 mb-8">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-lg bg-muted" />)}</div>
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Payout Tracker</h1><p className="text-sm text-muted-foreground mt-1">Track and share your trading payouts</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShareAll}><Share2 className="h-4 w-4 mr-1" /> Share All</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Add Payout</Button></DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader><DialogTitle>Record Payout</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Company Name *</label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="FTMO, Funding Pips..." className="bg-background border-border" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Payout Amount ($) *</label><Input value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="500.00" className="bg-background border-border font-mono" type="number" step="0.01" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Date Received *</label><Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="bg-background border-border" /></div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Payout Certificate / Screenshot</label>
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border bg-background cursor-pointer hover:border-muted-foreground/30 transition-colors">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{screenshotFile ? screenshotFile.name : "Upload certificate"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                  </label>
                  {screenshotPreview && (
                    <div className="mt-2 relative">
                      <img src={screenshotPreview} alt="Preview" className="rounded-md max-h-32 object-cover border border-border w-full" />
                      <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
                <Button onClick={() => savePayout.mutate()} disabled={savePayout.isPending} className="w-full bg-primary text-primary-foreground">
                  {savePayout.isPending ? "Saving..." : "Save Payout"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Payouts", value: String(totalPayouts), icon: Award, color: "text-primary" },
          { label: "Total Profit", value: `$${totalProfit.toFixed(2)}`, icon: DollarSign, color: "text-success" },
          { label: "Avg Monthly", value: `$${avgMonthly.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
          { label: `${new Date().getFullYear()} Profit`, value: `$${yearlyProfit.toFixed(2)}`, icon: Calendar, color: "text-success" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4 card-glow hover:divine-border transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <div className="font-mono text-lg font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36 h-8 text-xs bg-background border-border"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Months</SelectItem>
            {months.map(m => <SelectItem key={m} value={m}>{format(new Date(m + "-01"), "MMM yyyy")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-36 h-8 text-xs bg-background border-border"><SelectValue placeholder="Company" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: "date" | "amount") => setSortBy(v)}>
          <SelectTrigger className="w-32 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="amount">By Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payout Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-lg border border-border bg-card p-4 card-glow group hover:divine-border transition-all duration-300 relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{p.company_name}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{format(new Date(p.received_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleShareSingle(p)} className="text-muted-foreground hover:text-primary"><Link2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deletePayout.mutate(p.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-success mb-3">+${Number(p.payout_amount).toFixed(2)}</div>
              {p.screenshot_url && (
                <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={p.screenshot_url} alt="Certificate" className="rounded-md border border-border w-full h-32 object-cover hover:opacity-80 transition-opacity" />
                </a>
              )}
              {/* Watermark */}
              <div className="absolute bottom-2 right-3 text-[9px] text-muted-foreground/30 font-semibold">JournalXPro</div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">No payouts recorded yet. Add your first payout to start tracking!</p>
        </div>
      )}
    </div>
  );
};

export default Payouts;
