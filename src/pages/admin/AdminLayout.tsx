import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import { AdminSection } from "./adminConfig";
import { useAdminHooks } from "./adminHooks";

import DashboardSection from "./sections/DashboardSection";
import UsersSection from "./sections/UsersSection";
import PaymentsSection from "./sections/PaymentsSection";
import ReferralsSection from "./sections/ReferralsSection";
import AnnouncementsSection from "./sections/AnnouncementsSection";
import PropFirmsSection from "./sections/PropFirmsSection";
import ChatSection from "./sections/ChatSection";
import ContactInboxSection from "./sections/ContactInboxSection";
import NewsSection from "./sections/NewsSection";
import SettingsSection from "./sections/SettingsSection";

type Props = {
  handleAdminLogout: () => void;
};

export default function AdminLayout({ handleAdminLogout }: Props) {
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [pendingNotif, setPendingNotif] = useState(0);
  const [chatNotif, setChatNotif] = useState(0);

  const admin = useAdminHooks({
    queryClient,
    setPendingNotif,
    setChatNotif,
  });

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pendingNotif={pendingNotif}
        setPendingNotif={setPendingNotif}
        chatNotif={chatNotif}
        setChatNotif={setChatNotif}
        handleAdminLogout={handleAdminLogout}
      />

      <motion.main
        animate={{ marginLeft: collapsed ? 82 : 240 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="min-h-screen flex-1 bg-[#06080c]"
      >
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between bg-[#0a0d11]/88 px-5 backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] sm:px-7">
          <div>
            <h2 className="text-lg font-semibold capitalize tracking-[0.01em] text-white">
              {activeSection === "propfirms" ? "Prop Firms" : activeSection}
            </h2>
            <p className="hidden text-xs text-zinc-500 sm:block">
              Manage platform operations and monitor admin activity
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <Bell className="h-4 w-4 text-zinc-400" />
            <span className="hidden text-xs font-medium text-zinc-300 sm:inline">
              JournalXPro
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeSection === "dashboard" && <DashboardSection {...admin} />}
              {activeSection === "users" && <UsersSection {...admin} />}
              {activeSection === "payments" && <PaymentsSection {...admin} />}
              {activeSection === "referrals" && <ReferralsSection {...admin} />}
              {activeSection === "announcements" && <AnnouncementsSection {...admin} />}
              {activeSection === "propfirms" && <PropFirmsSection {...admin} />}
              {activeSection === "chat" && <ChatSection {...admin} />}
              {activeSection === "contact" && <ContactInboxSection {...admin} />}
              {activeSection === "news" && <NewsSection {...admin} />}
              {activeSection === "settings" && <SettingsSection {...admin} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}