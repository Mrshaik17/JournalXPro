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
  const [receivedDate, setReceivedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
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
        .from("user_payout_requests" as any)
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
      result.sort((a: any, b: any) => Number(b.amount) - Number(a.amount));
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
    (s: number, p: any) => s + Number(p.amount),
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
      .filter((p: any) => new Date(p.received_date).getFullYear() === year)
      .reduce((s: number, p: any) => s + Number(p.amount), 0);
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
      (a: any, b: any) => Number(b.amount) - Number(a.amount)
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

      const { error } = await supabase.from("user_payout_requests").insert([
        {
          user_id: user.id,
          company_name: companyName,
          amount: parseFloat(payoutAmount),
          screenshot_url: screenshotUrl,
          received_date: receivedDate,
        },
      ]);

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
        .from("user_payout_requests")
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

  const handleShareSingle = async (p: any) => {
    let token = p.share_token;

    if (!token) {
      token = crypto.randomUUID();

      const { error } = await supabase
        .from("user_payout_requests")
        .update({ share_token: token })
        .eq("id", p.id);

      if (error) {
        toast.error("Failed to generate share link");
        return;
      }
    }

    const url = `${window.location.origin}/shared/payout/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  if (!canAccess) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/85 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                JournalXPro
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Payout Tracker
              </h1>

              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                Track, review, and share your funded trading payouts.
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-5 sm:p-7 shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.06),transparent_28%)]" />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/75 backdrop-blur-md text-center px-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 shadow-sm mb-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-lg font-semibold tracking-tight">
              Pro+ or Elite Plan Required
            </p>

            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Upgrade to track payouts, store proof, and share trading results.
            </p>

            <a
              href="/app/upgrade"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
            >
              View Plans →
            </a>

            <div className="mt-3 text-xs text-muted-foreground">
              Built for serious traders •{" "}
              <span className="text-primary font-semibold">JournalXPro</span>
            </div>
          </div>

          <div className="blur-md pointer-events-none space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-background/50" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-background/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-card via-card/95 to-card/85 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              JournalXPro
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Payout Tracker
            </h1>

            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Track, review, and share your funded trading payouts with clean proof and premium reporting.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-primary" />
              {totalPayouts} payout{totalPayouts !== 1 ? "s" : ""} recorded
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-10 px-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payout
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-2xl bg-card/95 backdrop-blur-xl shadow-xl border-0">
                <DialogHeader>
                  <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground mb-2 w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    JournalXPro
                  </div>
                  <DialogTitle className="text-lg tracking-tight">
                    Record Payout
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Company Name *
                    </label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="FTMO, Funding Pips..."
                      className="bg-background rounded-xl h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                      className="bg-background rounded-xl font-mono h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                      className="bg-background rounded-xl h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Payout Certificate / Screenshot
                    </label>

                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background cursor-pointer hover:bg-background/90 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
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
                      <div className="mt-3 relative overflow-hidden rounded-xl bg-background">
                        <img
                          src={screenshotPreview}
                          alt="Preview"
                          className="max-h-36 w-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => savePayout.mutate()}
                    disabled={!user || savePayout.isPending}
                    className="w-full rounded-xl h-10"
                  >
                    {savePayout.isPending ? "Saving..." : "Save Payout"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card p-5 sm:p-6 shadow-sm"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
              Total Profit
            </div>

            <div className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-500">
              ${totalProfit.toFixed(2)}
            </div>

            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Your full recorded payout performance across all trading firms.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              {totalPayouts} payout{totalPayouts !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              {new Date().getFullYear()} profit: ${yearlyProfit.toFixed(2)}
            </span>
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
              Shared via JournalXPro
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
              ? `$${Number(biggestPayout.amount).toFixed(2)}`
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
            className="rounded-2xl bg-gradient-to-b from-card/95 to-card/80 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                {s.label}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/60">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>

            <div className="font-mono text-lg sm:text-xl font-bold tracking-tight">
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-card/70 p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/70">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">Filters</div>
              <div className="text-[11px] text-muted-foreground">
                Narrow down payouts quickly
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs bg-background rounded-xl border-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-card border-0">
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {format(new Date(`${m}-01`), "MMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-background rounded-xl border-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent className="bg-card border-0">
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
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs bg-background rounded-xl border-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-0">
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="amount">By Amount</SelectItem>
              </SelectContent>
            </Select>

            {(filterMonth !== "all" ||
              filterCompany !== "all" ||
              sortBy !== "date") && (
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
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {filtered.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-card/95 to-card/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.07),transparent_28%)]" />

              <div className="relative flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-2 py-1 text-[10px] text-muted-foreground mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    JournalXPro
                  </div>

                  <h3 className="font-semibold text-sm sm:text-[15px] truncate group-hover:text-primary transition-colors">
                    {p.company_name}
                  </h3>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    {format(new Date(p.received_date), "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleShareSingle(p)}
                    className="rounded-full bg-background/70 p-2 text-muted-foreground hover:text-primary hover:bg-background transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePayout.mutate(p);
                    }}
                    className="rounded-full bg-background/70 p-2 text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative mb-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Payout Amount
                </div>

                <div className="font-mono text-2xl sm:text-[28px] font-bold tracking-tight text-emerald-500">
                  +${Number(p.amount).toFixed(2)}
                </div>

                <div className="mt-2 inline-flex items-center gap-2 text-[10px] bg-background/70 px-2.5 py-1 rounded-full text-muted-foreground">
                  🚀 Shared-ready proof
                </div>
              </div>

              {p.screenshot_url ? (
                <a
                  href={p.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="overflow-hidden rounded-xl bg-background/60">
                    <img
                      src={p.screenshot_url}
                      alt="Payout certificate"
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                </a>
              ) : (
                <div className="rounded-xl bg-background/50 h-32 flex items-center justify-center text-center px-4">
                  <div>
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-card mb-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      No certificate uploaded
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1">
                  <Award className="h-3 w-3" />
                  Recorded payout
                </span>

                <span className="font-semibold text-primary/80">
                  JournalXPro
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-card/95 to-card/80 p-7 sm:p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DollarSign className="h-6 w-6" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground mt-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            JournalXPro
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight">
            No payouts recorded yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Add your first payout to start building your payout history with proof and tracking.
          </p>

          <Button
            onClick={() => setOpen(true)}
            className="mt-5 rounded-xl h-10 px-5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Payout
          </Button>

          <div className="mt-4 text-xs text-muted-foreground">
            Built for serious traders •{" "}
            <span className="text-primary font-semibold">JournalXPro</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payouts;