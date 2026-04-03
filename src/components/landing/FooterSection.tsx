import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export const FooterSection = () => {
  const { data: socialLinks } = useQuery({
    queryKey: ["site-settings-social"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle();
      return (data?.value as any) || {};
    },
  });

  const allLinks = [
    { label: "Instagram", url: socialLinks?.instagram || "#", icon: "📷" },
    { label: "Twitter / X", url: socialLinks?.twitter || "#", icon: "𝕏" },
    { label: "Telegram", url: socialLinks?.telegram || "#", icon: "✈️" },
    { label: "Discord", url: socialLinks?.discord || "#", icon: "💬" },
    { label: "YouTube", url: socialLinks?.youtube || "#", icon: "▶️" },
    { label: "Facebook", url: socialLinks?.facebook || "#", icon: "📘" },
    { label: "Email", url: "mailto:support@journalxpro.com", icon: "📧" },
  ];

  return (
    <footer className="border-t border-border py-12">
      <div className="container px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">JournalXPro</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The trading journal built for traders who value precision, discipline, and consistency.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/rules" className="text-muted-foreground hover:text-primary transition-colors">Trading Rules</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Connect</h4>
            <ul className="space-y-2">
              {allLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.url} target={l.url.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                    <span>{l.icon}</span>{l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} JournalXPro. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made with discipline ⚡</p>
        </div>
      </div>
    </footer>
  );
};
