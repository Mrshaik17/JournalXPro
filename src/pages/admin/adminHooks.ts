import { useEffect, useMemo, useRef, useState } from "react";
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
  is_active?: boolean;
  created_at: string;
};

type PropFirm = {
  id: string;
  name: string;
  description?: string | null;
  affiliate_link?: string | null;
  website_url?: string | null;
  coupon_code?: string | null;
  discount?: number | null;
  tags?: string[] | null;
  is_active?: boolean;
  is_featured?: boolean;
  created_at: string;
};

type NewsItem = {
  id: string;
  title: string;
  content: string;
  source?: string | null;
  category?: string | null;
  asset_name?: string | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  user_id: string;
  sender: "user" | "admin" | "bot";
  message: string;
  created_at: string;
};

type ChatUser = {
  id: string;
  email: string;
  full_name?: string;
  latest_message_at?: string;
};

export function useAdminHooks({
  queryClient,
  setPendingNotif,
  setChatNotif,
}: UseAdminHooksProps) {
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatReply, setChatReply] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCommission, setRefCommission] = useState("");

  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [newsCategory, setNewsCategory] = useState("forex");
  const [newsAsset, setNewsAsset] = useState("");
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("update");
  const [announcementLink, setAnnouncementLink] = useState("");
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [propFirmName, setPropFirmName] = useState("");
  const [propFirmDescription, setPropFirmDescription] = useState("");
  const [propFirmLink, setPropFirmLink] = useState("");
  const [propFirmCoupon, setPropFirmCoupon] = useState("");
  const [propFirmDiscount, setPropFirmDiscount] = useState("");
  const [propFirmWebsiteUrl, setPropFirmWebsiteUrl] = useState("");
  const [propFirmIsActive, setPropFirmIsActive] = useState(true);
  const [propFirmIsFeatured, setPropFirmIsFeatured] = useState(false);
  const [propFirmTags, setPropFirmTags] = useState("");
  const [editingPropFirm, setEditingPropFirm] = useState<PropFirm | null>(null);

  const invalidateAnnouncementQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  const invalidateNewsQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    queryClient.invalidateQueries({ queryKey: ["news"] });
    queryClient.invalidateQueries({ queryKey: ["user-news"] });
  };

  const invalidatePropFirmQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-propfirms"] });
    queryClient.invalidateQueries({ queryKey: ["prop-firms"] });
    queryClient.invalidateQueries({ queryKey: ["propFirms"] });
    queryClient.invalidateQueries({ queryKey: ["user-propfirms"] });
  };

  const resetPropFirmForm = () => {
    setPropFirmName("");
    setPropFirmDescription("");
    setPropFirmLink("");
    setPropFirmCoupon("");
    setPropFirmDiscount("");
    setPropFirmWebsiteUrl("");
    setPropFirmIsActive(true);
    setPropFirmIsFeatured(false);
    setPropFirmTags("");
    setEditingPropFirm(null);
  };

  const normalizeTags = (value: string) => {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const upsertChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => {
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) {
        return prev.map((msg) => (msg.id === message.id ? message : msg));
      }

      const next = [...prev, message];
      next.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return next;
    });
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

  const { data: newsList = [] } = useQuery<NewsItem[]>({
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

  const { data: propFirms = [] } = useQuery<PropFirm[]>({
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
      return data;
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

  const { data: chatUsers = [] } = useQuery<ChatUser[]>({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from("support_messages")
        .select("user_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uniqueUserIds = [
        ...new Set((messages || []).map((m: any) => m.user_id).filter(Boolean)),
      ];

      if (uniqueUserIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", uniqueUserIds);

      if (profilesError) throw profilesError;

      return uniqueUserIds.map((id) => {
        const profile = (profilesData || []).find((p: any) => p.id === id);
        const lastMsg = (messages || []).find((m: any) => m.user_id === id);

        return {
          id,
          email: profile?.email || "No email",
          full_name: profile?.full_name || "",
          latest_message_at: lastMsg?.created_at || "",
        };
      });
    },
  });

  const selectedChatUserDetails = useMemo(
    () => chatUsers.find((u) => u.id === selectedChatUser) || null,
    [chatUsers, selectedChatUser]
  );

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
      if (!refName || !refCode) throw new Error("Name and code are required.");

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

        if (payment?.billing_cycle === "monthly") expiry.setMonth(now.getMonth() + 1);
        else if (payment?.billing_cycle === "3months")
          expiry.setMonth(now.getMonth() + 3);
        else if (payment?.billing_cycle === "6months")
          expiry.setMonth(now.getMonth() + 6);
        else if (payment?.billing_cycle === "yearly")
          expiry.setFullYear(now.getFullYear() + 1);
        else expiry.setMonth(now.getMonth() + 1);

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

  const createNews = useMutation({
    mutationFn: async () => {
      if (!newsTitle.trim() || !newsContent.trim()) {
        throw new Error("Title and content are required.");
      }

      const { error } = await supabase.from("news").insert({
        title: newsTitle.trim(),
        content: newsContent.trim(),
        source: newsSource.trim() || null,
        category: newsCategory,
        asset_name: newsAsset.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNewsQueries();
      toast.success("News published.");
      setNewsTitle("");
      setNewsContent("");
      setNewsSource("");
      setNewsCategory("forex");
      setNewsAsset("");
      setEditingNews(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateNews = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      source,
      category,
      asset_name,
    }: {
      id: string;
      title: string;
      content: string;
      source?: string | null;
      category: string;
      asset_name?: string | null;
    }) => {
      const { error } = await supabase
        .from("news")
        .update({
          title: title.trim(),
          content: content.trim(),
          source: source?.trim() || null,
          category,
          asset_name: asset_name?.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNewsQueries();
      toast.success("News updated.");
      setNewsTitle("");
      setNewsContent("");
      setNewsSource("");
      setNewsCategory("forex");
      setNewsAsset("");
      setEditingNews(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNewsQueries();
      toast.success("News deleted.");
      setEditingNews(null);
      setNewsTitle("");
      setNewsContent("");
      setNewsSource("");
      setNewsCategory("forex");
      setNewsAsset("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startEditNews = (item: NewsItem) => {
    setEditingNews(item);
    setNewsTitle(item.title || "");
    setNewsContent(item.content || "");
    setNewsSource(item.source || "");
    setNewsCategory(item.category || "forex");
    setNewsAsset(item.asset_name || "");
  };

  const cancelEditNews = () => {
    setEditingNews(null);
    setNewsTitle("");
    setNewsContent("");
    setNewsSource("");
    setNewsCategory("forex");
    setNewsAsset("");
  };

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      if (!announcementTitle.trim() || !announcementContent.trim()) {
        throw new Error("Title and content are required.");
      }

      const { error } = await supabase.from("announcements").insert({
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        type: announcementType,
        link: announcementLink.trim() || null,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement published.");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementType("update");
      setAnnouncementLink("");
      setEditingAnnouncement(null);
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
      link?: string;
      is_active?: boolean;
    }) => {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        type,
        link: link?.trim() || null,
      };

      if (typeof is_active === "boolean") {
        payload.is_active = is_active;
      }

      const { error } = await supabase
        .from("announcements")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement updated.");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementType("update");
      setAnnouncementLink("");
      setEditingAnnouncement(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleAnnouncementStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast.success("Announcement status updated.");
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
      setEditingAnnouncement(null);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementType("update");
      setAnnouncementLink("");
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
    setEditingAnnouncement(null);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("update");
    setAnnouncementLink("");
  };

  const savePropFirm = useMutation({
    mutationFn: async () => {
      if (!propFirmName.trim()) throw new Error("Prop firm name is required.");

      const payload = {
        name: propFirmName.trim(),
        description: propFirmDescription.trim() || null,
        affiliate_link: propFirmLink.trim() || null,
        website_url: propFirmWebsiteUrl.trim() || null,
        coupon_code: propFirmCoupon.trim() || null,
        discount: propFirmDiscount !== "" ? Number(propFirmDiscount) : null,
        tags: normalizeTags(propFirmTags),
        is_active: propFirmIsActive,
        is_featured: propFirmIsFeatured,
      };

      if (editingPropFirm?.id) {
        const { error } = await supabase
          .from("prop_firms")
          .update(payload)
          .eq("id", editingPropFirm.id);

        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("prop_firms").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePropFirmQueries();
      toast.success(editingPropFirm ? "Prop firm updated." : "Prop firm added.");
      resetPropFirmForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePropFirm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prop_firms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePropFirmQueries();
      toast.success("Prop firm deleted.");
      resetPropFirmForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const togglePropFirmActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("prop_firms")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePropFirmQueries();
      toast.success("Prop firm status updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const togglePropFirmFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from("prop_firms")
        .update({ is_featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidatePropFirmQueries();
      toast.success("Prop firm featured status updated.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startEditPropFirm = (firm: PropFirm) => {
    setEditingPropFirm(firm);
    setPropFirmName(firm.name || "");
    setPropFirmDescription(firm.description || "");
    setPropFirmLink(firm.affiliate_link || "");
    setPropFirmWebsiteUrl(firm.website_url || "");
    setPropFirmCoupon(firm.coupon_code || "");
    setPropFirmDiscount(
      firm.discount !== null && firm.discount !== undefined ? String(firm.discount) : ""
    );
    setPropFirmIsActive(Boolean(firm.is_active));
    setPropFirmIsFeatured(Boolean(firm.is_featured));
    setPropFirmTags(Array.isArray(firm.tags) ? firm.tags.join(", ") : "");
  };

  const cancelEditPropFirm = () => {
    resetPropFirmForm();
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        setPendingNotif((n: number) => n + 1);
        toast.info("💰 New payment received!");
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });

          if (payload.eventType === "INSERT" && payload.new?.sender === "user") {
            setChatNotif((n: number) => n + 1);
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
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, () => {
        invalidateAnnouncementQueries();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "announcements" }, () => {
        invalidateAnnouncementQueries();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "news" }, () => {
        invalidateNewsQueries();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "news" }, () => {
        invalidateNewsQueries();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "news" }, () => {
        invalidateNewsQueries();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "prop_firms" }, () => {
        invalidatePropFirmQueries();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "prop_firms" }, () => {
        invalidatePropFirmQueries();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "prop_firms" }, () => {
        invalidatePropFirmQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, setPendingNotif, setChatNotif]);

  useEffect(() => {
    if (!selectedChatUser) {
      setChatMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", selectedChatUser)
        .order("created_at", { ascending: true });

      if (!error) {
        setChatMessages((data || []) as ChatMessage[]);
        scrollChatToBottom();
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-live-${selectedChatUser}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        (payload: any) => {
          const changedUserId = payload.new?.user_id || payload.old?.user_id;
          if (changedUserId !== selectedChatUser) return;

          if (payload.eventType === "INSERT") {
            upsertChatMessage(payload.new as ChatMessage);
            scrollChatToBottom();
          }

          if (payload.eventType === "UPDATE") {
            upsertChatMessage(payload.new as ChatMessage);
          }

          if (payload.eventType === "DELETE") {
            setChatMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }

          queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatUser, queryClient]);

  const getSetting = (key: string): any => {
    const s = siteSettings.find((item: any) => item.key === key);
    return s?.value || {};
  };

  const sendAdminReply = async () => {
    if (!chatReply.trim() || !selectedChatUser) return;

    const replyText = chatReply.trim();

    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        user_id: selectedChatUser,
        sender: "admin",
        message: replyText,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      upsertChatMessage(data as ChatMessage);
      scrollChatToBottom();
    }

    setChatReply("");
    queryClient.invalidateQueries({ queryKey: ["admin-chat-users"] });
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
    selectedChatUserDetails,
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
    editingNews,
    setEditingNews,
    startEditNews,
    cancelEditNews,

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
    propFirmWebsiteUrl,
    setPropFirmWebsiteUrl,
    propFirmIsActive,
    setPropFirmIsActive,
    propFirmIsFeatured,
    setPropFirmIsFeatured,
    propFirmTags,
    setPropFirmTags,
    editingPropFirm,
    setEditingPropFirm,
    startEditPropFirm,
    cancelEditPropFirm,

    getSetting,
    upsertSetting,
    updatePaymentStatus,

    updateUserPlan: useMutation({
      mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
        const { error } = await supabase
          .from("profiles")
          .update({ plan })
          .eq("id", userId);
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

    createNews,
    updateNews,
    deleteNews,

    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement,

    savePropFirm,
    deletePropFirm,
    togglePropFirmActive,
    togglePropFirmFeatured,

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