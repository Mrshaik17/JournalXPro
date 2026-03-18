import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const FooterSection = () => {
  const { data: socialLinks } = useQuery({
    queryKey: ["site-settings-social"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "social_links").single();
      return data?.value as { instagram?: string; twitter?: string; telegram?: string; discord?: string } || {};
    },
  });

  const links = [
    { label: "Instagram", url: socialLinks?.instagram, icon: "📷" },
    { label: "Twitter / X", url: socialLinks?.twitter, icon: "𝕏" },
    { label: "Telegram", url: socialLinks?.telegram, icon: "✈️" },
    { label: "Discord", url: socialLinks?.discord, icon: "💬" },
  ].filter((l) => l.url);

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Trader's Divine</span>
          </div>

          {links.length > 0 && (
            <div className="flex items-center gap-4">
              {links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  <span>{l.icon}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Trader's Divine. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
