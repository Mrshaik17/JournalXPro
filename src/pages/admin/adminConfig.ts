import {
  LayoutDashboard,
  Users,
  CreditCard,
  Link2,
  Settings,
  Newspaper,
  MessageSquare,
  Building2,
  Megaphone,
  Mail,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "users"
  | "payments"
  | "referrals"
  | "announcements"
  | "propfirms"
  | "chat"
  | "contact"
  | "news"
  | "settings";

export const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "referrals", label: "Referrals", icon: Link2 },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "propfirms", label: "Prop Firms", icon: Building2 },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "contact", label: "Contact Inbox", icon: Mail },
  { key: "news", label: "News", icon: Newspaper },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "shaiktouheed17@gmail.com";

export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "$Haik098@";