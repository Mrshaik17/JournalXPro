import React from "react";
import { ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { sidebarItems, AdminSection } from "./adminConfig";

type Props = {
  activeSection: AdminSection;
  setActiveSection: (value: AdminSection) => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  pendingNotif: number;
  setPendingNotif: React.Dispatch<React.SetStateAction<number>>;
  chatNotif: number;
  setChatNotif: React.Dispatch<React.SetStateAction<number>>;
  handleAdminLogout: () => void;
};

export default function AdminSidebar({
  activeSection,
  setActiveSection,
  collapsed,
  setCollapsed,
  pendingNotif,
  setPendingNotif,
  chatNotif,
  setChatNotif,
  handleAdminLogout,
}: Props) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 82 : 240 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-[#0a0d12] shadow-[inset_-1px_0_0_rgba(255,255,255,0.045)]"
    >
      <div
        className={`flex h-[72px] shrink-0 items-center ${
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]">
          <Shield className="h-5 w-5 shrink-0" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Admin Panel</p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              JournalXPro
            </p>
          </div>
        )}
      </div>

      <nav
        className={`sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden ${
          collapsed ? "px-2 py-3" : "px-3 py-3"
        }`}
      >
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.key;
            const badge =
              item.key === "payments" ? pendingNotif : item.key === "chat" ? chatNotif : 0;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key);
                  if (item.key === "payments") setPendingNotif(0);
                  if (item.key === "chat") setChatNotif(0);
                }}
                className={`group relative flex w-full items-center rounded-2xl text-sm transition-all ${
                  collapsed
                    ? "justify-center px-0 py-3"
                    : "gap-3 px-3 py-3"
                } ${
                  isActive
                    ? "bg-cyan-500/12 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]"
                    : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-100"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-white/[0.02] text-zinc-500 group-hover:bg-white/[0.04] group-hover:text-zinc-300"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </div>

                {!collapsed && (
                  <div className="flex min-w-0 flex-1 items-center justify-between">
                    <span className="truncate font-medium">{item.label}</span>
                  </div>
                )}

                {badge > 0 && (
                  <span
                    className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg ${
                      collapsed ? "right-1.5 top-1.5" : "right-3 top-3"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className={`shrink-0 ${collapsed ? "px-2 pb-3 pt-2" : "px-3 pb-3 pt-2"}`}>
        <div className="rounded-2xl bg-white/[0.02] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
          <button
            onClick={handleAdminLogout}
            className={`flex w-full items-center rounded-xl text-sm text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 ${
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.02]">
              <LogOut className="h-4 w-4 shrink-0" />
            </div>
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 flex w-full items-center justify-center rounded-xl py-2 text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-zinc-200"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}