import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, Users, CreditCard, Link2, Settings, BarChart3, Newspaper,
  Trash2, Plus, MessageSquare, LayoutDashboard, Download, Bell,
  ChevronLeft, ChevronRight, TrendingUp, DollarSign, UserPlus, Clock,
  Building2, Zap, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type AdminSection = "dashboard" | "users" | "payments" | "referrals" | "chat" | "news" | "propfirms" | "settings";

const sidebarItems: { key: AdminSection; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "referrals", label: "Referrals", icon: Link2 },
  { key: "propfirms", label: "Prop Firms", icon: Building2 },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "news", label: "News", icon: Newspaper },
  { key: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [pendingNotif, setPendingNotif] = useState(0);
  const [chatNotif, setChatNotif] = useState(0);

  // Admin login form state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  // ---- DATA QUERIES ----
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

  const { data: propFirms = [] } = useQuery({
    queryKey: ["admin-propfirms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prop_firms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: chatUsers = [] } = useQuery({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_messages").select("user_id").order("created_at", { ascending: false });
      if (error) throw error;
      const uniqueIds = [...new Set(data.map((m: any) => m.user_id))];
      return uniqueIds as string[];
    },
    enabled: !!isAdmin,
  });

  // ---- REALTIME ----
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        setPendingNotif((n) => n + 1);
        toast.info("💰 New payment received!");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload: any) => {
        if (payload.new?.sender === "user") {
          queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });
          setChatNotif((n) => n + 1);
          toast.info("💬 New chat message!");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
        toast.info("👤 New user signed up!");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);

  // ---- HELPERS ----
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast.success("Settings saved."); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }); toast.success("User plan updated."); },
    onError: (err: any) => toast.error(err.message),
  });

  // Referral
  const [refName, setRefName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCommission, setRefCommission] = useState("");
  const createReferral = useMutation({
    mutationFn: async () => {
      if (!refName || !refCode) throw new Error("Name and code required");
      const { error } = await supabase.from("referrals").insert({ name: refName, code: refCode, commission_percent: parseFloat(refCommission) || 0 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-referrals"] }); toast.success("Referral created."); setRefName(""); setRefCode(""); setRefCommission(""); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteReferral = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("referrals").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-referrals"] }); toast.success("Deleted."); },
  });

  // News
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [newsCategory, setNewsCategory] = useState("forex");
  const [newsAsset, setNewsAsset] = useState("");
  const createNews = useMutation({
    mutationFn: async () => {
      if (!newsTitle || !newsContent) throw new Error("Title and content required");
      const { error } = await supabase.from("news").insert({ title: newsTitle, content: newsContent, source: newsSource || null, category: newsCategory, asset_name: newsAsset || null } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-news"] }); toast.success("Published!"); setNewsTitle(""); setNewsContent(""); setNewsSource(""); setNewsAsset(""); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteNews = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("news").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-news"] }); toast.success("Deleted."); },
  });

  // Prop Firms
  const [pfName, setPfName] = useState("");
  const [pfUrl, setPfUrl] = useState("");
  const [pfDesc, setPfDesc] = useState("");
  const createPropFirm = useMutation({
    mutationFn: async () => {
      if (!pfName) throw new Error("Name required");
      const { error } = await supabase.from("prop_firms").insert({ name: pfName, url: pfUrl || null, description: pfDesc || null });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-propfirms"] }); toast.success("Prop firm added!"); setPfName(""); setPfUrl(""); setPfDesc(""); },
    onError: (err: any) => toast.error(err.message),
  });
  const deletePropFirm = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("prop_firms").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-propfirms"] }); toast.success("Deleted."); },
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
      setUpiId(ps.upi_id || ""); setPhoneNumber(ps.phone_number || ""); setCryptoWallet(ps.crypto_wallet || "");
      const social = getSetting("social_links");
      setInstagram(social.instagram || ""); setTwitter(social.twitter || ""); setTelegram(social.telegram || ""); setDiscord(social.discord || "");
      const pricing = getSetting("pricing");
      setPricePro(pricing.pro?.toString() || "5"); setPriceProPlus(pricing.pro_plus?.toString() || "10"); setPriceElite(pricing.elite?.toString() || "14");
      const rate = getSetting("inr_rate");
      setInrRate(rate.rate?.toString() || "83.5");
    }
  }, [siteSettings]);

  // ---- CHAT ----
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatReply, setChatReply] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedChatUser || !isAdmin) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("support_messages").select("*").eq("user_id", selectedChatUser).order("created_at", { ascending: true });
      setChatMessages(data || []);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    fetchMessages();
    const channel = supabase.channel(`chat-${selectedChatUser}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${selectedChatUser}` }, () => fetchMessages()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChatUser, isAdmin]);

  const sendAdminReply = async () => {
    if (!chatReply.trim() || !selectedChatUser) return;
    await supabase.from("support_messages").insert({ user_id: selectedChatUser, sender: "admin", message: chatReply.trim() });
    setChatReply("");
  };

  // ---- EXPORT ----
  const exportData = (format: "pdf" | "excel", range: "week" | "month" | "all") => {
    const now = new Date();
    let since = new Date(0);
    if (range === "week") since = new Date(now.getTime() - 7 * 86400000);
    if (range === "month") since = new Date(now.getTime() - 30 * 86400000);
    const filteredPayments = payments.filter((p) => new Date(p.created_at) >= since);
    const filteredUsers = profiles.filter((p) => new Date(p.created_at) >= since);
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text("Trader's Divine - Admin Report", 14, 20);
      doc.setFontSize(10); doc.text(`Range: ${range} | Generated: ${now.toLocaleDateString()}`, 14, 28);
      autoTable(doc, { startY: 36, head: [["Email", "Plan", "Joined"]], body: filteredUsers.map((u) => [u.email || "", u.plan, new Date(u.created_at).toLocaleDateString()]) });
      const fy = (doc as any).lastAutoTable?.finalY || 50;
      autoTable(doc, { startY: fy + 10, head: [["Amount", "Method", "Status", "Date"]], body: filteredPayments.map((p) => [`$${Number(p.amount).toFixed(2)}`, p.method || "", p.status, new Date(p.created_at).toLocaleDateString()]) });
      doc.save(`admin-report-${range}.pdf`);
      toast.success("PDF downloaded!");
    } else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredUsers.map((u) => ({ Email: u.email, Name: u.full_name, Plan: u.plan, Referral: u.referral_code_used, Joined: new Date(u.created_at).toLocaleDateString() }))), "Users");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredPayments.map((p) => ({ Amount: p.amount, Method: p.method, Status: p.status, TxnID: p.transaction_id, Date: new Date(p.created_at).toLocaleDateString() }))), "Payments");
      XLSX.writeFile(wb, `admin-report-${range}.xlsx`);
      toast.success("Excel downloaded!");
    }
  };

  // ---- ADMIN LOGIN FORM ----
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
            <p className="text-sm text-muted-foreground">Sign in with admin credentials</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <Input placeholder="Admin Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-card border-border" required />
            <Input placeholder="Password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="bg-card border-border" required />
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Checking admin access...</div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <Shield className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">This account does not have admin privileges.</p>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); }}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out & Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalUsers = profiles.length;
  const paidUsers = profiles.filter((p) => p.plan !== "free").length;
  const totalTrades = trades.length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const totalRevenue = payments.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount), 0);
  const thisWeekUsers = profiles.filter((p) => new Date(p.created_at) >= new Date(Date.now() - 7 * 86400000)).length;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* SIDEBAR */}
      <motion.aside animate={{ width: collapsed ? 64 : 220 }} transition={{ duration: 0.2 }} className="fixed left-0 top-0 h-full bg-card border-r border-border z-50 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && <span className="font-bold text-sm truncate">Admin Panel</span>}
        </div>
        <nav className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.key;
            const badge = item.key === "payments" ? pendingNotif : item.key === "chat" ? chatNotif : 0;
            return (
              <button key={item.key} onClick={() => { setActiveSection(item.key); if (item.key === "payments") setPendingNotif(0); if (item.key === "chat") setChatNotif(0); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {badge > 0 && <span className="absolute right-2 top-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-2 space-y-1">
          <button onClick={async () => { await supabase.auth.signOut(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-all">
            <LogOut className="h-4 w-4 shrink-0" />{!collapsed && <span>Logout</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex justify-center py-1 text-muted-foreground hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </motion.aside>

      {/* MAIN */}
      <motion.main animate={{ marginLeft: collapsed ? 64 : 220 }} transition={{ duration: 0.2 }} className="flex-1 min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
          <h2 className="font-bold text-lg capitalize">{activeSection === "propfirms" ? "Prop Firms" : activeSection}</h2>
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Trader's Divine</span></div>
        </header>
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
              {activeSection === "dashboard" && <DashboardSection totalUsers={totalUsers} paidUsers={paidUsers} totalTrades={totalTrades} pendingPayments={pendingPayments} totalRevenue={totalRevenue} thisWeekUsers={thisWeekUsers} profiles={profiles} payments={payments} exportData={exportData} />}
              {activeSection === "users" && <UsersSection profiles={profiles} updateUserPlan={updateUserPlan} />}
              {activeSection === "payments" && <PaymentsSection payments={payments} profiles={profiles} updatePaymentStatus={updatePaymentStatus} />}
              {activeSection === "referrals" && <ReferralsSection referrals={referrals} profiles={profiles} payments={payments} refName={refName} setRefName={setRefName} refCode={refCode} setRefCode={setRefCode} refCommission={refCommission} setRefCommission={setRefCommission} createReferral={createReferral} deleteReferral={deleteReferral} />}
              {activeSection === "propfirms" && <PropFirmsSection propFirms={propFirms} pfName={pfName} setPfName={setPfName} pfUrl={pfUrl} setPfUrl={setPfUrl} pfDesc={pfDesc} setPfDesc={setPfDesc} createPropFirm={createPropFirm} deletePropFirm={deletePropFirm} />}
              {activeSection === "chat" && <ChatSection chatUsers={chatUsers} profiles={profiles} selectedChatUser={selectedChatUser} setSelectedChatUser={setSelectedChatUser} chatMessages={chatMessages} chatReply={chatReply} setChatReply={setChatReply} sendAdminReply={sendAdminReply} chatEndRef={chatEndRef} />}
              {activeSection === "news" && <NewsSection newsList={newsList} newsTitle={newsTitle} setNewsTitle={setNewsTitle} newsContent={newsContent} setNewsContent={setNewsContent} newsSource={newsSource} setNewsSource={setNewsSource} newsCategory={newsCategory} setNewsCategory={setNewsCategory} newsAsset={newsAsset} setNewsAsset={setNewsAsset} createNews={createNews} deleteNews={deleteNews} />}
              {activeSection === "settings" && <SettingsSection upiId={upiId} setUpiId={setUpiId} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} cryptoWallet={cryptoWallet} setCryptoWallet={setCryptoWallet} instagram={instagram} setInstagram={setInstagram} twitter={twitter} setTwitter={setTwitter} telegram={telegram} setTelegram={setTelegram} discord={discord} setDiscord={setDiscord} pricePro={pricePro} setPricePro={setPricePro} priceProPlus={priceProPlus} setPriceProPlus={setPriceProPlus} priceElite={priceElite} setPriceElite={setPriceElite} inrRate={inrRate} setInrRate={setInrRate} upsertSetting={upsertSetting} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
};

// ============== SUB COMPONENTS ==============

const StatCard = ({ label, value, icon: Icon, color = "text-primary" }: any) => (
  <div className="rounded-lg border border-border bg-card p-4 card-glow">
    <div className="flex items-center gap-2 mb-2"><Icon className={`h-4 w-4 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
    <div className="text-2xl font-bold font-mono">{value}</div>
  </div>
);

const DashboardSection = ({ totalUsers, paidUsers, totalTrades, pendingPayments, totalRevenue, thisWeekUsers, profiles, payments, exportData }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard label="Total Users" value={totalUsers} icon={Users} />
      <StatCard label="Paid Users" value={paidUsers} icon={CreditCard} color="text-green-400" />
      <StatCard label="Total Trades" value={totalTrades} icon={BarChart3} />
      <StatCard label="Pending" value={pendingPayments} icon={Clock} color="text-yellow-400" />
      <StatCard label="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="text-green-400" />
      <StatCard label="New (7d)" value={thisWeekUsers} icon={UserPlus} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Weekly Revenue</h3>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => {
            const weekStart = new Date(Date.now() - (3 - i) * 7 * 86400000);
            const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
            const weekRevenue = payments.filter((p: any) => p.status === "approved" && new Date(p.created_at) >= weekStart && new Date(p.created_at) < weekEnd).reduce((s: number, p: any) => s + Number(p.amount), 0);
            const maxRev = Math.max(totalRevenue, 1);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16 font-mono">{weekStart.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max((weekRevenue / maxRev) * 100, 2)}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} className="h-full bg-primary/60 rounded-full" />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">${weekRevenue.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> User Growth</h3>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => {
            const weekStart = new Date(Date.now() - (3 - i) * 7 * 86400000);
            const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
            const weekUsers = profiles.filter((p: any) => new Date(p.created_at) >= weekStart && new Date(p.created_at) < weekEnd).length;
            const maxU = Math.max(totalUsers, 1);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16 font-mono">{weekStart.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max((weekUsers / maxU) * 100, 2)}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} className="h-full bg-green-500/60 rounded-full" />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">{weekUsers}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Export Data</h3>
      <div className="flex flex-wrap gap-2">
        {(["week", "month", "all"] as const).map((range) => (
          <div key={range} className="flex gap-1.5 items-center">
            <span className="text-[10px] text-muted-foreground uppercase w-10">{range}</span>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => exportData("pdf", range)}>PDF</Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => exportData("excel", range)}>Excel</Button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const UsersSection = ({ profiles, updateUserPlan }: any) => (
  <div className="rounded-lg border border-border bg-card overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase">
        <th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Referral</th><th className="text-left p-3">Joined</th><th className="text-center p-3">Actions</th>
      </tr></thead>
      <tbody>
        {profiles.map((p: any) => (
          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
            <td className="p-3 text-xs">{p.email}</td>
            <td className="p-3 text-xs">{p.full_name || "—"}</td>
            <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.plan === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{p.plan}</span></td>
            <td className="p-3 text-xs font-mono">{p.referral_code_used || "—"}</td>
            <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString()}</td>
            <td className="p-3 text-center">
              <Select onValueChange={(v) => updateUserPlan.mutate({ userId: p.id, plan: v })}>
                <SelectTrigger className="h-7 text-xs w-24 bg-background border-border"><SelectValue placeholder="Set plan" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="free">Free</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="pro_plus">Pro+</SelectItem><SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PaymentsSection = ({ payments, profiles, updatePaymentStatus }: any) => (
  <div className="rounded-lg border border-border bg-card overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase">
        <th className="text-left p-3">User</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Method</th><th className="text-left p-3">TXN ID</th><th className="text-left p-3">Screenshot</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th><th className="text-center p-3">Actions</th>
      </tr></thead>
      <tbody>
        {payments.map((p: any) => {
          const profile = profiles.find((pr: any) => pr.id === p.user_id);
          return (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td className="p-3 text-xs">{profile?.email || p.user_id.slice(0, 8)}</td>
              <td className="p-3 text-right font-mono">${Number(p.amount).toFixed(2)}{p.amount_inr ? <span className="text-muted-foreground ml-1">(₹{Number(p.amount_inr).toFixed(0)})</span> : ""}</td>
              <td className="p-3 text-xs">{p.requested_plan || "—"}</td>
              <td className="p-3 text-xs">{p.method || "—"}</td>
              <td className="p-3 text-xs font-mono">{p.transaction_id || "—"}</td>
              <td className="p-3 text-xs">{p.screenshot_url ? <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View</a> : "—"}</td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-green-500/10 text-green-400" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-400"}`}>{p.status}</span></td>
              <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-center">
                {p.status === "pending" && (
                  <div className="flex gap-1 justify-center">
                    <Select onValueChange={(plan) => updatePaymentStatus.mutate({ id: p.id, status: "approved", userId: p.user_id, plan })}>
                      <SelectTrigger className="h-6 text-xs w-20 bg-background border-green-500/30 text-green-400"><SelectValue placeholder="Approve" /></SelectTrigger>
                      <SelectContent className="bg-card border-border"><SelectItem value="pro">Pro</SelectItem><SelectItem value="pro_plus">Pro+</SelectItem><SelectItem value="elite">Elite</SelectItem></SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-6 text-xs text-destructive border-destructive/30" onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "rejected", userId: p.user_id })}>Reject</Button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
        {payments.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground text-sm">No payments yet.</td></tr>}
      </tbody>
    </table>
  </div>
);

const ReferralsSection = ({ referrals, profiles, payments, refName, setRefName, refCode, setRefCode, refCommission, setRefCommission, createReferral, deleteReferral }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Create Referral Code</h3>
      <div className="space-y-3">
        <Input value={refName} onChange={(e: any) => setRefName(e.target.value)} placeholder="Referrer name" className="bg-background border-border" />
        <Input value={refCode} onChange={(e: any) => setRefCode(e.target.value)} placeholder="Code (e.g. JOHN20)" className="bg-background border-border font-mono" />
        <Input value={refCommission} onChange={(e: any) => setRefCommission(e.target.value)} placeholder="Commission %" className="bg-background border-border font-mono" type="number" />
        <Button onClick={() => createReferral.mutate()} disabled={createReferral.isPending} className="w-full"><Plus className="h-4 w-4 mr-2" />{createReferral.isPending ? "Creating..." : "Create Code"}</Button>
      </div>
    </div>
    <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase">
          <th className="text-left p-3">Code</th><th className="text-left p-3">Name</th><th className="text-right p-3">Commission</th><th className="text-right p-3">Signups</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Revenue</th><th className="text-center p-3">Actions</th>
        </tr></thead>
        <tbody>
          {referrals.map((r: any) => {
            const signups = profiles.filter((p: any) => p.referral_code_used === r.code).length;
            const paidSignups = profiles.filter((p: any) => p.referral_code_used === r.code && p.plan !== "free");
            const revenue = paidSignups.reduce((sum: number, u: any) => {
              return sum + payments.filter((pay: any) => pay.user_id === u.id && pay.status === "approved").reduce((s: number, p: any) => s + Number(p.amount), 0);
            }, 0);
            return (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-mono text-primary text-xs">{r.code}</td>
                <td className="p-3 text-xs">{r.name}</td>
                <td className="p-3 text-right text-xs font-mono">{r.commission_percent}%</td>
                <td className="p-3 text-right text-xs font-mono">{signups}</td>
                <td className="p-3 text-right text-xs font-mono">{paidSignups.length}</td>
                <td className="p-3 text-right text-xs font-mono text-green-400">${revenue.toFixed(0)}</td>
                <td className="p-3 text-center"><button onClick={() => deleteReferral.mutate(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            );
          })}
          {referrals.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">No referral codes yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const PropFirmsSection = ({ propFirms, pfName, setPfName, pfUrl, setPfUrl, pfDesc, setPfDesc, createPropFirm, deletePropFirm }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Add Prop Firm</h3>
      <div className="space-y-3">
        <Input value={pfName} onChange={(e: any) => setPfName(e.target.value)} placeholder="Firm name" className="bg-background border-border" />
        <Input value={pfUrl} onChange={(e: any) => setPfUrl(e.target.value)} placeholder="Website URL" className="bg-background border-border" />
        <Textarea value={pfDesc} onChange={(e: any) => setPfDesc(e.target.value)} placeholder="Description" className="bg-background border-border" rows={3} />
        <Button onClick={() => createPropFirm.mutate()} disabled={createPropFirm.isPending} className="w-full"><Plus className="h-4 w-4 mr-2" />{createPropFirm.isPending ? "Adding..." : "Add Firm"}</Button>
      </div>
    </div>
    <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase">
          <th className="text-left p-3">Name</th><th className="text-left p-3">URL</th><th className="text-left p-3">Description</th><th className="text-center p-3">Actions</th>
        </tr></thead>
        <tbody>
          {propFirms.map((f: any) => (
            <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <td className="p-3 text-xs font-semibold">{f.name}</td>
              <td className="p-3 text-xs">{f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{f.url}</a> : "—"}</td>
              <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{f.description || "—"}</td>
              <td className="p-3 text-center"><button onClick={() => deletePropFirm.mutate(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
            </tr>
          ))}
          {propFirms.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">No prop firms added yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const ChatSection = ({ chatUsers, profiles, selectedChatUser, setSelectedChatUser, chatMessages, chatReply, setChatReply, sendAdminReply, chatEndRef }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
    <div className="rounded-lg border border-border bg-card p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3">Conversations</h3>
      <div className="space-y-1">
        {chatUsers.length > 0 ? chatUsers.map((uid: string) => {
          const profile = profiles.find((p: any) => p.id === uid);
          return (
            <button key={uid} onClick={() => setSelectedChatUser(uid)} className={`w-full flex items-center gap-2 p-2.5 rounded-md text-left transition-colors ${selectedChatUser === uid ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" /><span className="text-xs truncate">{profile?.email || uid.slice(0, 12)}</span>
            </button>
          );
        }) : <p className="text-xs text-muted-foreground">No conversations yet.</p>}
      </div>
    </div>
    <div className="lg:col-span-2 rounded-lg border border-border bg-card flex flex-col">
      {selectedChatUser ? (
        <>
          <div className="p-3 border-b border-border text-xs text-muted-foreground">Chat with: {profiles.find((p: any) => p.id === selectedChatUser)?.email || selectedChatUser.slice(0, 12)}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {chatMessages.map((m: any) => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg text-xs ${m.sender === "admin" ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground"}`}>
                  {m.message}
                  <div className="text-[9px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={chatReply} onChange={(e: any) => setChatReply(e.target.value)} placeholder="Type reply..." className="bg-background border-border text-sm" onKeyDown={(e: any) => e.key === "Enter" && sendAdminReply()} />
            <Button size="sm" onClick={sendAdminReply}>Send</Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
      )}
    </div>
  </div>
);

const NewsSection = ({ newsList, newsTitle, setNewsTitle, newsContent, setNewsContent, newsSource, setNewsSource, newsCategory, setNewsCategory, newsAsset, setNewsAsset, createNews, deleteNews }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Post News</h3>
      <div className="space-y-3">
        <Input value={newsTitle} onChange={(e: any) => setNewsTitle(e.target.value)} placeholder="Headline" className="bg-background border-border" />
        <Input value={newsAsset} onChange={(e: any) => setNewsAsset(e.target.value)} placeholder="Asset name (e.g. EURUSD, BTCUSD, Gold)" className="bg-background border-border font-mono" />
        <Textarea value={newsContent} onChange={(e: any) => setNewsContent(e.target.value)} placeholder="Content..." className="bg-background border-border" rows={4} />
        <Input value={newsSource} onChange={(e: any) => setNewsSource(e.target.value)} placeholder="Source (e.g. Forex Factory)" className="bg-background border-border" />
        <Select value={newsCategory} onValueChange={setNewsCategory}>
          <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="forex">Forex</SelectItem><SelectItem value="crypto">Crypto</SelectItem><SelectItem value="stocks">Stocks</SelectItem><SelectItem value="commodities">Commodities</SelectItem><SelectItem value="economy">Economy</SelectItem><SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => createNews.mutate()} disabled={createNews.isPending} className="w-full"><Plus className="h-4 w-4 mr-2" />{createNews.isPending ? "Publishing..." : "Publish"}</Button>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Recent News ({newsList.length})</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {newsList.map((n: any) => (
          <div key={n.id} className="p-3 rounded border border-border bg-background group hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary font-mono uppercase">{n.category}</span>
                  {(n as any).asset_name && <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{(n as any).asset_name}</span>}
                </div>
                <h4 className="text-sm font-semibold mt-0.5">{n.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                <span className="text-[10px] text-muted-foreground font-mono mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <button onClick={() => deleteNews.mutate(n.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {newsList.length === 0 && <p className="text-sm text-muted-foreground">No news yet.</p>}
      </div>
    </div>
  </div>
);

const SettingsSection = ({ upiId, setUpiId, phoneNumber, setPhoneNumber, cryptoWallet, setCryptoWallet, instagram, setInstagram, twitter, setTwitter, telegram, setTelegram, discord, setDiscord, pricePro, setPricePro, priceProPlus, setPriceProPlus, priceElite, setPriceElite, inrRate, setInrRate, upsertSetting }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Payment Settings</h3>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground block mb-1">UPI ID</label><Input value={upiId} onChange={(e: any) => setUpiId(e.target.value)} placeholder="yourname@upi" className="bg-background border-border font-mono" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Phone (GPay/PhonePe)</label><Input value={phoneNumber} onChange={(e: any) => setPhoneNumber(e.target.value)} placeholder="+91..." className="bg-background border-border font-mono" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Crypto Wallet</label><Input value={cryptoWallet} onChange={(e: any) => setCryptoWallet(e.target.value)} placeholder="0x..." className="bg-background border-border font-mono" /></div>
        <Button onClick={() => upsertSetting.mutate({ key: "payment_settings", value: { upi_id: upiId, phone_number: phoneNumber, crypto_wallet: cryptoWallet } })} className="w-full">Save Payment Settings</Button>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Social Links</h3>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground block mb-1">Instagram</label><Input value={instagram} onChange={(e: any) => setInstagram(e.target.value)} className="bg-background border-border" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Twitter / X</label><Input value={twitter} onChange={(e: any) => setTwitter(e.target.value)} className="bg-background border-border" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Telegram</label><Input value={telegram} onChange={(e: any) => setTelegram(e.target.value)} className="bg-background border-border" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Discord</label><Input value={discord} onChange={(e: any) => setDiscord(e.target.value)} className="bg-background border-border" /></div>
        <Button onClick={() => upsertSetting.mutate({ key: "social_links", value: { instagram, twitter, telegram, discord } })} className="w-full">Save Social Links</Button>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">Pricing (USD)</h3>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground block mb-1">Pro ($)</label><Input value={pricePro} onChange={(e: any) => setPricePro(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Pro+ ($)</label><Input value={priceProPlus} onChange={(e: any) => setPriceProPlus(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">Elite ($)</label><Input value={priceElite} onChange={(e: any) => setPriceElite(e.target.value)} className="bg-background border-border font-mono" type="number" /></div>
        <Button onClick={() => upsertSetting.mutate({ key: "pricing", value: { free: 0, pro: parseFloat(pricePro), pro_plus: parseFloat(priceProPlus), elite: parseFloat(priceElite) } })} className="w-full">Save Pricing</Button>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">INR Conversion Rate</h3>
      <div className="space-y-3">
        <div><label className="text-xs text-muted-foreground block mb-1">1 USD = ₹</label><Input value={inrRate} onChange={(e: any) => setInrRate(e.target.value)} className="bg-background border-border font-mono" type="number" step="0.1" /></div>
        <Button onClick={() => upsertSetting.mutate({ key: "inr_rate", value: { rate: parseFloat(inrRate) } })} className="w-full">Save Rate</Button>
      </div>
    </div>
  </div>
);

export default Admin;
