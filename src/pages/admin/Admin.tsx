import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, CreditCard, Link2, Settings, BarChart3, Newspaper, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";

const Admin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["admin-trades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const getSetting = (key: string): any => {
    const s = siteSettings.find((s: any) => s.key === key);
    return s?.value || {};
  };

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const existing = siteSettings.find((s: any) => s.key === key);
      if (existing) {
        const { error } = await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, userId, plan }: { id: string; status: string; userId: string; plan?: string }) => {
      const { error } = await supabase.from("payments").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved" && plan) {
        await supabase.from("profiles").update({ plan }).eq("id", userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Payment updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateUserPlan = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const { error } = await supabase.from("profiles").update({ plan }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("User plan updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Referral management
  const [refName, setRefName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCommission, setRefCommission] = useState("");

  const createReferral = useMutation({
    mutationFn: async () => {
      if (!refName || !refCode) throw new Error("Name and code required");
      const { error } = await supabase.from("referrals").insert({
        name: refName,
        code: refCode,
        commission_percent: parseFloat(refCommission) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast.success("Referral code created.");
      setRefName(""); setRefCode(""); setRefCommission("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // News management
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [newsCategory, setNewsCategory] = useState("forex");

  const createNews = useMutation({
    mutationFn: async () => {
      if (!newsTitle || !newsContent) throw new Error("Title and content required");
      const { error } = await supabase.from("news").insert({
        title: newsTitle,
        content: newsContent,
        source: newsSource || null,
        category: newsCategory,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("News published!");
      setNewsTitle(""); setNewsContent(""); setNewsSource("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("News deleted.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Settings state
  const [upiId, setUpiId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cryptoWallet, setCryptoWallet] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [pricePro, setPricePro] = useState("5");
  const [priceProPlus, setPriceProPlus] = useState("10");
  const [priceElite, setPriceElite] = useState("14");
  const [inrRate, setInrRate] = useState("83.5");

  useEffect(() => {
    if (siteSettings.length > 0) {
      const ps = getSetting("payment_settings");
      setUpiId(ps.upi_id || "");
      setPhoneNumber(ps.phone_number || "");
      setCryptoWallet(ps.crypto_wallet || "");

      const social = getSetting("social_links");
      setInstagram(social.instagram || "");
      setTwitter(social.twitter || "");
      setTelegram(social.telegram || "");
      setDiscord(social.discord || "");

      const pricing = getSetting("pricing");
      setPricePro(pricing.pro?.toString() || "5");
      setPriceProPlus(pricing.pro_plus?.toString() || "10");
      setPriceElite(pricing.elite?.toString() || "14");

      const rate = getSetting("inr_rate");
      setInrRate(rate.rate?.toString() || "83.5");
    }
  }, [siteSettings]);

  if (loading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const totalUsers = profiles.length;
  const paidUsers = profiles.filter((p) => p.plan !== "free").length;
  const totalTrades = trades.length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const totalRevenue = payments.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <span className="text-xs text-muted-foreground ml-auto">Trader's Divine</span>
      </div>

      <div className="container max-w-6xl px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Users", value: totalUsers, icon: Users },
            { label: "Paid Users", value: paidUsers, icon: CreditCard },
            { label: "Total Trades", value: totalTrades, icon: BarChart3 },
            { label: "Pending", value: pendingPayments, icon: Settings },
            { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: CreditCard },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-left p-3">Referral</th>
                    <th className="text-left p-3">Joined</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-xs">{p.email}</td>
                      <td className="p-3 text-xs">{p.full_name || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.plan === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{p.plan}</span>
                      </td>
                      <td className="p-3 text-xs">{p.referral_code_used || "—"}</td>
                      <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <Select onValueChange={(v) => updateUserPlan.mutate({ userId: p.id, plan: v })}>
                          <SelectTrigger className="h-7 text-xs w-24 bg-background border-border">
                            <SelectValue placeholder="Set plan" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="pro_plus">Pro+</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                    <th className="text-left p-3">User</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">TXN ID</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Screenshot</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const profile = profiles.find((pr) => pr.id === p.user_id);
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="p-3 text-xs">{profile?.email || p.user_id}</td>
                        <td className="p-3 text-right font-mono">${Number(p.amount).toFixed(2)}</td>
                        <td className="p-3 text-xs">{p.method || "—"}</td>
                        <td className="p-3 text-xs font-mono">{p.transaction_id || "—"}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "approved" ? "bg-success/10 text-success" :
                            p.status === "rejected" ? "bg-destructive/10 text-destructive" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-xs">
                          {p.screenshot_url ? <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a> : "—"}
                        </td>
                        <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          {p.status === "pending" && (
                            <div className="flex gap-1 justify-center">
                              <Select onValueChange={(plan) => updatePaymentStatus.mutate({ id: p.id, status: "approved", userId: p.user_id, plan })}>
                                <SelectTrigger className="h-6 text-xs w-20 bg-background border-success/30 text-success">
                                  <SelectValue placeholder="Approve" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  <SelectItem value="pro">Pro</SelectItem>
                                  <SelectItem value="pro_plus">Pro+</SelectItem>
                                  <SelectItem value="elite">Elite</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="outline" className="h-6 text-xs text-destructive border-destructive/30" onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "rejected", userId: p.user_id })}>Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {payments.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">No payments yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Create Referral Code</h3>
                <div className="space-y-3">
                  <Input value={refName} onChange={(e) => setRefName(e.target.value)} placeholder="Referrer name" className="bg-background border-border" />
                  <Input value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="Code (e.g. JOHN20)" className="bg-background border-border font-mono" />
                  <Input value={refCommission} onChange={(e) => setRefCommission(e.target.value)} placeholder="Commission %" className="bg-background border-border font-mono" type="number" />
                  <Button onClick={() => createReferral.mutate()} disabled={createReferral.isPending} className="w-full bg-primary text-primary-foreground">
                    {createReferral.isPending ? "Creating..." : "Create Code"}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Existing Codes</h3>
                {referrals.length > 0 ? (
                  <div className="space-y-2">
                    {referrals.map((r) => {
                      const signups = profiles.filter((p) => p.referral_code_used === r.code).length;
                      const paidSignups = profiles.filter((p) => p.referral_code_used === r.code && p.plan !== "free").length;
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded border border-border bg-background">
                          <div>
                            <span className="font-mono text-sm text-primary">{r.code}</span>
                            <span className="text-xs text-muted-foreground ml-2">{r.name} · {r.commission_percent}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{signups} signups · {paidSignups} paid</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No referral codes yet.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Post News</h3>
                <div className="space-y-3">
                  <Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="News headline" className="bg-background border-border" />
                  <Textarea value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="News content..." className="bg-background border-border" rows={4} />
                  <Input value={newsSource} onChange={(e) => setNewsSource(e.target.value)} placeholder="Source (e.g. Forex Factory)" className="bg-background border-border" />
                  <Select value={newsCategory} onValueChange={setNewsCategory}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => createNews.mutate()} disabled={createNews.isPending} className="w-full bg-primary text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />{createNews.isPending ? "Publishing..." : "Publish News"}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Recent News ({newsList.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {newsList.map((n: any) => (
                    <div key={n.id} className="p-3 rounded border border-border bg-background group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-primary font-mono uppercase">{n.category}</span>
                          <h4 className="text-sm font-semibold mt-0.5">{n.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => deleteNews.mutate(n.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {newsList.length === 0 && <p className="text-sm text-muted-foreground">No news posted yet.</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Payment Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">UPI ID</label>
                    <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="bg-background border-border font-mono" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Phone Number (GPay/PhonePe)</label>
                    <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91..." className="bg-background border-border font-mono" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Crypto Wallet</label>
                    <Input value={cryptoWallet} onChange={(e) => setCryptoWallet(e.target.value)} placeholder="0x..." className="bg-background border-border font-mono" />
                  </div>
                  <Button onClick={() => upsertSetting.mutate({ key: "payment_settings", value: { upi_id: upiId, phone_number: phoneNumber, crypto_wallet: cryptoWallet } })} className="w-full bg-primary text-primary-foreground">Save Payment Settings</Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Social Media Links</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Instagram</label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="bg-background border-border" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Twitter / X</label><Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." className="bg-background border-border" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Telegram</label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/..." className="bg-background border-border" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Discord</label><Input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.gg/..." className="bg-background border-border" /></div>
                  <Button onClick={() => upsertSetting.mutate({ key: "social_links", value: { instagram, twitter, telegram, discord } })} className="w-full bg-primary text-primary-foreground">Save Social Links</Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Pricing Control (USD)</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Pro Plan ($)</label><Input value={pricePro} onChange={(e) => setPricePro(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Pro+ Plan ($)</label><Input value={priceProPlus} onChange={(e) => setPriceProPlus(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Elite Plan ($)</label><Input value={priceElite} onChange={(e) => setPriceElite(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
                  <Button onClick={() => upsertSetting.mutate({ key: "pricing", value: { free: 0, pro: parseFloat(pricePro), pro_plus: parseFloat(priceProPlus), elite: parseFloat(priceElite) } })} className="w-full bg-primary text-primary-foreground">Save Pricing</Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">INR Conversion Rate</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">1 USD = ₹</label><Input value={inrRate} onChange={(e) => setInrRate(e.target.value)} className="bg-background border-border font-mono" type="number" step="0.1" /></div>
                  <Button onClick={() => upsertSetting.mutate({ key: "inr_rate", value: { rate: parseFloat(inrRate) } })} className="w-full bg-primary text-primary-foreground">Save Rate</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
