import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  BarChart3,
  Calculator,
  Building2,
  Settings,
  LogOut,
  Zap,
  Crown,
  CalendarDays,
  Newspaper,
  DollarSign,
  Megaphone,
  Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Journal", url: "/app/journal", icon: BookOpen },
  { title: "Accounts", url: "/app/accounts", icon: Wallet },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "Tools", url: "/app/tools", icon: Calculator },
  { title: "News", url: "/app/news", icon: Newspaper },
  { title: "Calendar", url: "/app/calendar", icon: CalendarDays },
  { title: "Prop Firms", url: "/app/prop-firms", icon: Building2 },
  { title: "Payouts", url: "/app/payouts", icon: DollarSign },
  { title: "Announcements", url: "/app/announcements", icon: Megaphone },
  { title: "Upgrade", url: "/app/upgrade", icon: Crown },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-count"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/5 bg-[#06080c] text-white"
    >
      <div className="flex h-14 items-center border-b border-white/5 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]">
            <Zap className="h-4.5 w-4.5" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-white">
                JournalXPro
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Trading Hub
              </p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                      title={collapsed ? item.title : undefined}
                      className="group flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white"
                      activeClassName="bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.10)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 transition-all group-hover:bg-white/[0.05] group-hover:text-zinc-200">
                        <item.icon className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{item.title}</span>

                          {item.title === "Announcements" &&
                            announcements.length > 0 && (
                              <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-black">
                                {announcements.length}
                              </span>
                            )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  className={`h-10 rounded-xl px-2.5 text-[13px] text-zinc-600 opacity-70 cursor-not-allowed hover:bg-transparent hover:text-zinc-500 ${
                    collapsed ? "justify-center" : ""
                  }`}
                  title={collapsed ? "Backtesting (Soon)" : undefined}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.02] text-zinc-600">
                    <Lock className="h-4 w-4" />
                  </div>

                  {!collapsed && (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">Backtesting</span>
                      <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Soon
                      </span>
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={`h-10 rounded-xl px-2.5 text-[13px] text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 ${
                collapsed ? "justify-center" : ""
              }`}
              title={collapsed ? "Logout" : undefined}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-zinc-500 transition-all">
                <LogOut className="h-4 w-4" />
              </div>

              {!collapsed && <span className="font-medium">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}