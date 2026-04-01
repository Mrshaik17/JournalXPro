import {
  LayoutDashboard, BookOpen, Wallet, BarChart3,
  Calculator, Building2, Settings, LogOut, Zap, Crown, CalendarDays, Newspaper
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  { title: "Upgrade", url: "/app/upgrade", icon: Crown },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
