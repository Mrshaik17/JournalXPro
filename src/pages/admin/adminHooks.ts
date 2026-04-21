import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type UseAdminHooksProps = {
  queryClient: any;
  setPendingNotif: React.Dispatch<React.SetStateAction<number>>;
  setChatNotif: React.Dispatch<React.SetStateAction<number>>;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id?: string;
  method?: string;
  transaction_id?: string;
  billing_cycle?: string;
};

type Profile = {
  id: string;
  email: string;
  full_name?: string;
  plan?: string;
  plan_expiry?: string;
  referred_by?: string | null;
  referral_id?: string | null;
  referral_code_used?: string;
  created_at: string;
  payments?: Payment[];
};

type Referral = {
  id: string;
  name: string;
  code: string;
  commission_percent: number;
  email?: string;
  is_active?: boolean;
  paid_amount?: number;
  remaining_amount?: number;
  created_at: string;
  users?: Profile[];
  total_users?: number;
  paid_users?: number;
  total_revenue?: number;
  total_earnings?: number;
  joined_users_count?: number;
  paid_users_count?: number;
  total_paid?: number;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  link?: string | null;
  is_active?: boolean | null;
  created_at: string;
};

export function useAdminHooks({
  queryClient,
  setPendingNotif,
  setChatNotif,
}: UseAdminHooksProps) {
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatReply, setChatReply] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Referral form state
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCommission, setRefCommission] = useState("");

  // News form state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [newsCategory, setNewsCategory] = useState("forex");
  const [newsAsset, setNewsAsset] = useState("");

  // Announcement form state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("update");
  const [announcementLink, setAnnouncementLink] = useState("");
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Prop firm form state
  const [propFirmName, setPropFirmName] = useState("");
  const [propFirmDescription, setPropFirmDescription] = useState("");
  const [propFirmLink, setPropFirmLink] = useState("");
  const [propFirmCoupon, setPropFirmCoupon] = useState("");
  const [propFirmDiscount, setPropFirmDiscount] = useState("");

  const invalidateAnnouncementQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["user-announcements"] });
  };

  const resetAnnouncementForm = () => {
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("update");
    setAnnouncementLink("");
    setEditingAnnouncement(null);
  };

  const normalizeLink = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data: referralsData, error: refError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      const { data: usersData, error: userError } = await supabase
        .from("profiles")
        .select("id, email, full_name, referred_by");

      if (userError) throw userError;

      const { data: paymentsData, error: payError } = await supabase
        .from("payments")
        .select("*");

      if (payError) throw payError;

      const finalData = (referralsData || []).map((ref: any) => {
        const users = (usersData || []).filter((u: any) => u.referred_by === ref.id);

        const usersWithPayments = users.map((user: any) => {
          const userPayments = (paymentsData || []).filter(
            (p: any) => p.user_id === user.id && p.status === "approved"
          );

          return {
            ...user,
            payments: userPayments,
          };
        });

        const paidUsers = usersWithPayments.filter((u: any) => u.payments.length > 0);

        return {
          ...ref,
          users: usersWithPayments,
          joined_users_count: users.length,
          paid_users_count: paidUsers.length,
          total_revenue: paidUsers.reduce(
            (sum: number, u: any) =>
              sum + u.payments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
            0
          ),
          total_paid: 0,
          paid_amount: ref.paid_amount || 0,
          remaining_amount: ref.remaining_amount || 0,
        };
      });

      return finalData;
    },
  });

  useEffect(() => {
    if (!referrals || referrals.length === 0) return;

    const syncReferrals = async () => {
      for (const ref of referrals) {
        await supabase
          .from("referrals")
          .update({
            total_users: ref.users?.length || 0,
            paid_users: ref.paid_users_count || 0,
          })
          .eq("id", ref.id);
      }
    };

    syncReferrals();
  }, [referrals]);

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["admin-trades"],
    queryFn: async () => {
      const { data = [], error } = await supabase.from("trades").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data = [], error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: propFirms = [] } = useQuery({
    queryKey: ["admin-propfirms"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("prop_firms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        is_active: item.is_active ?? true,
      }));
    },
  });

  const { data: contactMessages = [] } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: chatUsers = [] } = useQuery<string[]>({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      const { data = [], error } = await supabase
        .from("support_messages")
        .select("user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return [...new Set(data.map((m: any) => m.user_id))];
    },
  });

  const updateReferral = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("referrals")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast.success("Referral status updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markReferralPaid = useMutation({
    mutationFn: async ({
      id,
      paid_amount,
      remaining_amount,
    }: {
      id: string;
      paid_amount: number;
      remaining_amount: number;
    }) => {
      const { error } = await supabase
        .from("referrals")
        .update({ paid_amount, remaining_amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast.success("Referral marked as paid.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createReferral = useMutation({
    mutationFn: async () => {
      if (!refName || !refCode) {
        throw new Error("Name and code are required.");
      }

      const { error } = await supabase.from("referrals").insert({
        name: refName,
        email: refEmail || null,
        code: refCode,
        commission_percent: parseFloat(refCommission) || 0,
        is_active: true,
        paid_amount: 0,
        remaining_amount: 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast.success("Referral created successfully.");
      setRefName("");
      setRefEmail("");
      setRefCode("");
      setRefCommission("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteReferral = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("referrals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      toast.success("Referral deleted.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const existing = siteSettings.find((s: any) => s.key === key);

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
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
    mutationFn: async ({
      id,
      status,
      userId,
      plan,
    }: {
      id: string;
      status: string;
      userId: string;
      plan?: string;
    }) => {
      const { error } = await supabase.from("payments").update({ status }).eq("id", id);
      if (error) throw error;

      if (status === "approved" && plan) {
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("id", id)
          .single();

        if (paymentError) throw paymentError;

        const now = new Date();
        const expiry = new Date();

        if (payment?.billing_cycle === "monthly") {
          expiry.setMonth(now.getMonth() + 1);
        } else if (payment?.billing_cycle === "3months") {
          expiry.setMonth(now.getMonth() + 3);
        } else if (payment?.billing_cycle === "6months") {
          expiry.setMonth(now.getMonth() + 6);
        } else if (payment?.billing_cycle === "yearly") {
          expiry.setFullYear(now.getFullYear() + 1);
        } else {
          expiry.setMonth(now.getMonth() + 1);
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ plan, plan_expiry: expiry.toISOString() })
          .eq("id", userId);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Payment updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("trades").delete().eq("user_id", userId);
      await supabase.from("accounts").delete().eq("user_id", userId);
      await supabase.from("payments").delete().eq("user_id", userId);
      await supabase.from("support_messages").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });
      toast.success("User deleted.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      if (!announcementTitle.trim() || !announcementContent.trim()) {
        throw new Error("Title and content are required.");
      }

      const finalLink = normalizeLink(announcementLink);
      if (finalLink) {
        new URL(finalLink);
      }

      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        type: announcementType,
        link: finalLink,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement published.");
      resetAnnouncementForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      type,
      link,
      is_active,
    }: {
      id: string;
      title: string;
      content: string;
      type: string;
      link?: string | null;
      is_active?: boolean;
    }) => {
      const finalLink = normalizeLink(link || "");
      if (finalLink) {
        new URL(finalLink);
      }

      const { error } = await supabase
        .from("announcements")
        .update({
          title: title.trim(),
          content: content.trim(),
          type,
          link: finalLink,
          ...(typeof is_active === "boolean" ? { is_active } : {}),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement updated.");
      resetAnnouncementForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleAnnouncementStatus = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("announcements")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateAnnouncementQueries();

      queryClient.setQueryData(["admin-announcements"], (oldData: any[] = []) =>
        oldData.map((item: any) =>
          item.id === variables.id ? { ...item, is_active: variables.is_active } : item
        )
      );

      queryClient.setQueryData(["announcements"], (oldData: any[] = []) =>
        oldData
          .map((item: any) =>
            item.id === variables.id ? { ...item, is_active: variables.is_active } : item
          )
          .filter((item: any) => item.is_active !== false)
      );

      queryClient.setQueryData(["user-announcements"], (oldData: any[] = []) =>
        oldData
          .map((item: any) =>
            item.id === variables.id ? { ...item, is_active: variables.is_active } : item
          )
          .filter((item: any) => item.is_active !== false)
      );

      toast.success(
        variables.is_active ? "Announcement enabled." : "Announcement disabled."
      );
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement deleted.");
      resetAnnouncementForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startEditAnnouncement = (item: Announcement) => {
    setEditingAnnouncement(item);
    setAnnouncementTitle(item.title || "");
    setAnnouncementContent(item.content || "");
    setAnnouncementType(item.type || "update");
    setAnnouncementLink(item.link || "");
  };

  const cancelEditAnnouncement = () => {
    resetAnnouncementForm();
  };

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        setPendingNotif((n) => n + 1);
        toast.info("💰 New payment received!");
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        (payload: any) => {
          if (payload.new?.sender === "user") {
            queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });
            setChatNotif((n) => n + 1);
            toast.info("💬 New chat message!");
          }
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
        queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
        toast.info("👤 New user signed up!");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "referrals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
        toast.info("🔗 New referral created!");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, () => {
        invalidateAnnouncementQueries();
        toast.info("📢 New announcement published!");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, () => {
        invalidateAnnouncementQueries();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "announcements" }, () => {
        invalidateAnnouncementQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, setPendingNotif, setChatNotif]);

  // Chat effect
  useEffect(() => {
    if (!selectedChatUser) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", selectedChatUser)
        .order("created_at", { ascending: true });

      if (!error) {
        setChatMessages(data || []);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedChatUser}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${selectedChatUser}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatUser]);

  const getSetting = (key: string): any => {
    const s = siteSettings.find((item: any) => item.key === key);
    return s?.value || {};
  };

  const sendAdminReply = async () => {
    if (!chatReply.trim() || !selectedChatUser) return;

    const { error } = await supabase.from("support_messages").insert({
      user_id: selectedChatUser,
      sender: "admin",
      message: chatReply.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setChatReply("");
  };

  const exportData = (format: "pdf" | "excel", range: string) => {
    const now = new Date();
    let since = new Date(0);

    if (range === "week") since = new Date(now.getTime() - 7 * 86400000);
    if (range === "month") since = new Date(now.getTime() - 30 * 86400000);
    if (range === "3month") since = new Date(now.getTime() - 90 * 86400000);
    if (range === "6month") since = new Date(now.getTime() - 180 * 86400000);

    const filteredPayments = payments.filter(
      (p: any) => range === "all" || new Date(p.created_at) >= since
    );
    const filteredUsers = profiles.filter(
      (p: any) => range === "all" || new Date(p.created_at) >= since
    );

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("JournalXPro - Admin Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Range: ${range} | Generated: ${now.toLocaleDateString()}`, 14, 28);

      autoTable(doc, {
        startY: 36,
        head: [["Email", "Plan", "Joined"]],
        body: filteredUsers.map((u: any) => [
          u.email || "",
          u.plan || "",
          new Date(u.created_at).toLocaleDateString(),
        ]),
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 50;

      autoTable(doc, {
        startY: finalY + 10,
        head: [["Amount", "Method", "Status", "Date"]],
        body: filteredPayments.map((p: any) => [
          `$${Number(p.amount).toFixed(2)}`,
          p.method || "",
          p.status || "",
          new Date(p.created_at).toLocaleDateString(),
        ]),
      });
      doc.save(`admin-report-${range}.pdf`);
    } else {
      const workbook = XLSX.utils.book_new();
      const usersSheet = XLSX.utils.json_to_sheet(
        filteredUsers.map((u: any) => ({
          Email: u.email,
          Name: u.full_name,
          Plan: u.plan,
          Referral: u.referral_code_used,
          Joined: new Date(u.created_at).toLocaleDateString(),
        }))
      );
      const paymentsSheet = XLSX.utils.json_to_sheet(
        filteredPayments.map((p: any) => ({
          Amount: p.amount,
          Method: p.method,
          Status: p.status,
          TxnID: p.transaction_id,
          Date: new Date(p.created_at).toLocaleDateString(),
        }))
      );
      XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Payments");
      XLSX.writeFile(workbook, `admin-report-${range}.xlsx`);
    }

    toast.success(`${format.toUpperCase()} downloaded.`);
  };

  const totalUsers = profiles.length;
  const paidUsers = profiles.filter((p: any) => p.plan !== "free").length;
  const totalRevenue = payments
    .filter((p: any) => p.status === "approved")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return {
    profiles,
    payments,
    referrals,
    trades,
    siteSettings,
    newsList,
    propFirms,
    announcements,
    contactMessages,
    chatUsers,
    selectedChatUser,
    setSelectedChatUser,
    chatMessages,
    chatReply,
    setChatReply,
    chatEndRef,
    sendAdminReply,

    refName,
    setRefName,
    refEmail,
    setRefEmail,
    refCode,
    setRefCode,
    refCommission,
    setRefCommission,

    newsTitle,
    setNewsTitle,
    newsContent,
    setNewsContent,
    newsSource,
    setNewsSource,
    newsCategory,
    setNewsCategory,
    newsAsset,
    setNewsAsset,

    announcementTitle,
    setAnnouncementTitle,
    announcementContent,
    setAnnouncementContent,
    announcementType,
    setAnnouncementType,
    announcementLink,
    setAnnouncementLink,
    editingAnnouncement,
    setEditingAnnouncement,
    startEditAnnouncement,
    cancelEditAnnouncement,

    propFirmName,
    setPropFirmName,
    propFirmDescription,
    setPropFirmDescription,
    propFirmLink,
    setPropFirmLink,
    propFirmCoupon,
    setPropFirmCoupon,
    propFirmDiscount,
    setPropFirmDiscount,

    getSetting,
    upsertSetting,
    updatePaymentStatus,

    updateUserPlan: useMutation({
      mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
        const { error } = await supabase.from("profiles").update({ plan }).eq("id", userId);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
        toast.success("User plan updated.");
      },
      onError: (err: any) => toast.error(err.message),
    }),

    deleteUserMutation,
    createReferral,
    deleteReferral,
    updateReferral,
    markReferralPaid,

    createNews: useMutation({
      mutationFn: async () => {
        if (!newsTitle || !newsContent) throw new Error("Title and content are required.");
        const { error } = await supabase.from("news").insert({
          title: newsTitle,
          content: newsContent,
          source: newsSource || null,
          category: newsCategory,
          asset_name: newsAsset || null,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-news"] });
        toast.success("News published.");
        setNewsTitle("");
        setNewsContent("");
        setNewsSource("");
        setNewsCategory("forex");
        setNewsAsset("");
      },
      onError: (err: any) => toast.error(err.message),
    }),

    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement,

    createPropFirm: useMutation({
      mutationFn: async () => {
        if (!propFirmName) throw new Error("Prop firm name is required.");
        const { error } = await supabase.from("prop_firms").insert({
          name: propFirmName,
          description: propFirmDescription || null,
          affiliate_link: propFirmLink || null,
          coupon_code: propFirmCoupon || null,
          discount: propFirmDiscount ? Number(propFirmDiscount) : null,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-propfirms"] });
        toast.success("Prop firm added.");
        setPropFirmName("");
        setPropFirmDescription("");
        setPropFirmLink("");
        setPropFirmCoupon("");
        setPropFirmDiscount("");
      },
      onError: (err: any) => toast.error(err.message),
    }),

    markContactResolved: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from("contact_messages")
          .update({ status: "resolved" })
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
        toast.success("Message marked as resolved.");
      },
      onError: (err: any) => toast.error(err.message),
    }),

    exportData,
    totalUsers,
    paidUsers,
    totalRevenue,
    queryClient,
  };
}