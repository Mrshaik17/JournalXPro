import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PanelLeft, Sparkles } from "lucide-react";

export function AppLayout() {
  const { data: maintenance } = useQuery({
  queryKey: ["maintenance"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "maintenance")
      .maybeSingle(); // ✅ fix

    if (error) throw error;
    return data || {}; // ✅ fix
  },
});

  if (maintenance?.enabled) {
    return (
      <div className="min-h-screen bg-[#05070b] text-white">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Under Maintenance
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {maintenance.message || "Website under maintenance, please wait…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-[#05070b] text-white">
        <div className="flex min-h-screen w-full">
          <AppSidebar />

          <div className="flex min-w-0 flex-1 flex-col bg-[#07090d]">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#090c11]/88 px-4 backdrop-blur-xl sm:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white">
                  <PanelLeft className="h-4 w-4" />
                </SidebarTrigger>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold tracking-tight text-white">
                    JournalXPro
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Trader Workspace
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs font-medium text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Personalized Trading Journal</span>
                <span className="sm:hidden">Premium</span>
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1600px]">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}