import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

export function AppLayout() {
  const { data: maintenance } = useQuery({
    queryKey: ["maintenance-check"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "maintenance").single();
      return data?.value as { enabled: boolean; message: string } | null;
    },
    refetchInterval: 30000,
  });

  if (maintenance?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-muted-foreground">{maintenance.message || "Website under maintenance, please wait…"}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
