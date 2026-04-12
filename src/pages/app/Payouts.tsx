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
import {
  Plus,
  Image,
  X,
  Lock,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  Link2,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const plan = profile?.plan || "elite";
  const canAccess = plan === "pro_plus" || plan === "elite";

  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("received_date", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && canAccess,
  });

  const companies = useMemo(
    () => [...new Set(payouts.map((p: any) => p.company_name))],
    [payouts]
  );

  const filtered = useMemo(() => {
    let result = [...payouts];

    if (filterMonth !== "all") {
      result = result.filter(
        (p: any) => format(new Date(p.received_date), "yyyy-MM") === filterMonth
      );
    }

    if (filterCompany !== "all") {
      result = result.filter((p: any) => p.company_name === filterCompany);
    }

    if (sortBy === "amount") {
      result.sort(
        (a: any, b: any) => Number(b.payout_amount) - Number(a.payout_amount)
      );
    } else {
      result.sort(
        (a: any, b: any) =>
          new Date(b.received_date).getTime() -
          new Date(a.received_date).getTime()
      );
    }

    return result;
  }, [payouts, filterMonth, filterCompany, sortBy]);

  const totalPayouts = payouts.length;

  const totalProfit = payouts.reduce(
    (s: number, p: any) => s + Number(p.payout_amount),
    0
  );

  const avgMonthly = useMemo(() => {
    if (payouts.length === 0) return 0;
    const months = new Set(
      payouts.map((p: any) => format(new Date(p.received_date), "yyyy-MM"))
    );
    return totalProfit / months.size;
  }, [payouts, totalProfit]);

  const yearlyProfit = useMemo(() => {
    const year = new Date().getFullYear();
    return payouts
      .filter(
        (p: any) => new Date(p.received_date).getFullYear() === year
      )
      .reduce((s: number, p: any) => s + Number(p.payout_amount), 0);
  }, [payouts]);

  const months = useMemo(
    () =>
      [
        ...new Set(
          payouts.map((p: any) =>
            format(new Date(p.received_date), "yyyy-MM")
          )
        ),
      ].sort().reverse(),
    [payouts]
  );

  const biggestPayout = useMemo(() => {
    if (payouts.length === 0) return null;
    return [...payouts].sort(
      (a: any, b: any) => Number(b.payout_amount) - Number(a.payout_amount)
    )[0];
  }, [payouts]);

  const latestPayout = payouts[0] || null;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const shareAll = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let token = localStorage.getItem("share_all_token");

    if (!token) {
      token = crypto.randomUUID();

      await supabase
        .from("profiles")
        .update({ payouts_share_token: token })
        .eq("id", user.id);

      localStorage.setItem("share_all_token", token);
    }

    const link = `${window.location.origin}/shared/payouts/all_${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
  };

  const savePayout = useMutation({
    mutationFn: async () => {
      if (!user || !user.id) {
        toast.error("User not logged in");
        throw new Error("User not logged in");
      }

      if (!companyName || !payoutAmount) {
        throw new Error("Fill all fields");
      }

      let screenshotUrl = null;

      if (screenshotFile) {
        const compressed = await compressImage(screenshotFile);
        screenshotUrl = await uploadToCloudinary(compressed);
      }

      const { error } = await supabase.from("payouts").insert({
        user_id: user.id,
        company_name: companyName,
        payout_amount: parseFloat(payoutAmount),
        screenshot_url: screenshotUrl,
        received_date: receivedDate,
      });

      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Payout recorded!");

      setCompanyName("");
      setPayoutAmount("");
      setReceivedDate(format(new Date(), "yyyy-MM-dd"));
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setOpen(false);
    },

    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deletePayout = useMutation({
    mutationFn: async (payout: any) => {
      if (payout.screenshot_url) {
        const url = payout.screenshot_url;
        const afterUpload = url.split("/upload/")[1];
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        const public_id = withoutVersion.split(".")[0];

        await fetch(
          "https://abahpzkgajuofbduhrus.supabase.co/functions/v1/delete-image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ public_id }),
          }
        );
      }

      const { error } = await supabase
        .from("payouts")
        .delete()
        .eq("id", payout.id);

      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Deleted!");
    },

    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleShareSingle = (p: any) => {
    if (p.share_token) {
      const url = `${window.location.origin}/shared/payout/${p.share_token}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied! Anyone can view this payout.");
    } else {
      const text = `💰 ${p.company_name}: +$${Number(p.payout_amount).toFixed(
        2
      )} (${format(new Date(p.received_date), "MMM dd, yyyy")})\n— JournalXPro`;
      navigator.clipboard.writeText(text);
      toast.success("Payout info copied!");
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all your trading payouts
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card/70 p-10">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm text-center px-6">
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold">Pro+ or Elite Plan Required</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Upgrade to track your payouts, store payout proof, and share results with anyone.
            </p>
            <a href="/app/upgrade" className="text-primary text-sm mt-4 underline">
              View Plans →
            </a>
          </div>

          <div className="blur-md pointer-events-none space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, review, and share your funded trading payouts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={shareAll}>
            <Link2 className="h-4 w-4 mr-2" />
            Share All
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Add Payout
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Record Payout</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Company Name *
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="FTMO, Funding Pips..."
                    className="bg-background border-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Payout Amount ($) *
                  </label>
                  <Input
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="500.00"
                    className="bg-background border-border rounded-xl font-mono"
                    type="number"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Date Received *
                  </label>
                  <Input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="bg-background border-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Payout Certificate / Screenshot
                  </label>

                  <label className="flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border bg-background cursor-pointer hover:border-muted-foreground/30 transition-colors">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {screenshotFile ? screenshotFile.name : "Upload certificate"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshot}
                    />
                  </label>

                  {screenshotPreview && (
                    <div className="mt-3 relative overflow-hidden rounded-xl">
                      <img
                        src={screenshotPreview}
                        alt="Preview"
                        className="max-h-40 w-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setScreenshotFile(null);
                          setScreenshotPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-background/90 rounded-full p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => savePayout.mutate()}
                  disabled={!user || savePayout.isPending}
                  className="w-full rounded-xl"
                >
                  {savePayout.isPending ? "Saving..." : "Save Payout"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 rounded-3xl bg-emerald-500/6 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Total Profit
            </span>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-3 text-3xl sm:text-4xl font-bold font-mono tracking-tight text-emerald-500">
            ${totalProfit.toFixed(2)}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background/60 px-3 py-1">
              {totalPayouts} payout{totalPayouts !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-background/60 px-3 py-1">
              {new Date().getFullYear()} profit: ${yearlyProfit.toFixed(2)}
            </span>
          </div>
        </motion.div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Avg Monthly",
              value: `$${avgMonthly.toFixed(2)}`,
              icon: TrendingUp,
              color: "text-primary",
            },
            {
              label: "Biggest Payout",
              value: biggestPayout
                ? `$${Number(biggestPayout.payout_amount).toFixed(2)}`
                : "$0.00",
              icon: Sparkles,
              color: "text-emerald-500",
            },
            {
              label: "Latest Payout",
              value: latestPayout
                ? format(new Date(latestPayout.received_date), "MMM dd")
                : "—",
              icon: Calendar,
              color: "text-primary",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card/80 p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                  {s.label}
                </span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="font-mono text-xl font-bold tracking-tight">
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 pr-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Filters
            </span>
          </div>

          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background border-border rounded-xl">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {format(new Date(`${m}-01`), "MMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-background border-border rounded-xl">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v: "date" | "amount") => setSortBy(v)}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background border-border rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="amount">By Amount</SelectItem>
            </SelectContent>
          </Select>

          {(filterMonth !== "all" || filterCompany !== "all" || sortBy !== "date") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterMonth("all");
                setFilterCompany("all");
                setSortBy("date");
              }}
              className="h-9 rounded-xl"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative overflow-hidden rounded-2xl bg-card/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                    {p.company_name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(new Date(p.received_date), "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleShareSingle(p)}
                    className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-background/70 transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePayout.mutate(p);
                    }}
                    className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-background/70 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Payout Amount
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-500">
                  +${Number(p.payout_amount).toFixed(2)}
                </div>
              </div>

              {p.screenshot_url ? (
                <a
                  href={p.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="overflow-hidden rounded-2xl bg-background/60">
                    <img
                      src={p.screenshot_url}
                      alt="Payout certificate"
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                </a>
              ) : (
                <div className="rounded-2xl bg-background/50 h-32 flex items-center justify-center text-center px-4">
                  <p className="text-xs text-muted-foreground">
                    No certificate uploaded
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1">
                  <Award className="h-3 w-3" />
                  Recorded payout
                </span>
                <span className="font-semibold text-muted-foreground/60">
                  JournalXPro
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-card/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DollarSign className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-base font-semibold tracking-tight">
            No payouts recorded yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Add your first payout to start tracking your funded trading performance and payout history.
          </p>

          <Button
            onClick={() => setOpen(true)}
            className="mt-5 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Payout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Payouts;