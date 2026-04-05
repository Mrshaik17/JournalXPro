import {
  LayoutDashboard, BookOpen, Wallet, BarChart3,
  Calculator, Building2, Settings, LogOut, Zap, Crown, CalendarDays, Newspaper, DollarSign, Megaphone, Lock
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
      const { data } = await supabase.from("announcements").select("id").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Zap className="h-5 w-5 text-primary flex-shrink-0" />
        {!collapsed && <span className="text-sm font-semibold text-foreground">JournalXPro</span>}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.title === "Announcements" && announcements.length > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{announcements.length}</span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Backtesting - Coming Soon */}
              <SidebarMenuItem>
                <SidebarMenuButton className="opacity-50 cursor-not-allowed">
                  <Lock className="mr-2 h-4 w-4" />
                  {!collapsed && <span className="flex items-center gap-2">Backtesting <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Soon</span></span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
