import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { LandingNav } from "@/components/landing/LandingNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const Landing = () => {
  // Fetch active coupons from site_settings
  const { data: couponSetting } = useQuery({
    queryKey: ["site-settings-coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "active_coupons").maybeSingle();
      return (data?.value as { codes?: { code: string; discount: string }[]; enabled?: boolean }) || {};
    },
  });

  const coupons = couponSetting?.enabled !== false ? (couponSetting?.codes || []) : [];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <LandingNav />

      {/* Coupon Marquee */}
      {coupons.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 overflow-hidden">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-8 whitespace-nowrap py-2 px-4"
          >
            {coupons.concat(coupons).map((c, i) => (
              <button
                key={i}
                onClick={() => { navigator.clipboard.writeText(c.code); toast.success(`Copied: ${c.code}`); }}
                className="flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/80 transition-colors"
              >
                🎉 Use code <span className="font-bold underline">{c.code}</span> for {c.discount} off!
                <Copy className="h-3 w-3" />
              </button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Official referral code banner */}
      <div className="bg-card border-b border-border py-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          🎁 Get <span className="text-primary font-bold">10 bonus points</span> on signup! Use referral code:{" "}
          <button
            onClick={() => { navigator.clipboard.writeText("JOURNALXPRO"); toast.success("Copied: JOURNALXPRO"); }}
            className="font-mono font-bold text-primary hover:underline"
          >
            JOURNALXPRO <Copy className="h-3 w-3 inline ml-1" />
          </button>
        </p>
      </div>

      <HeroSection />
      <FeaturesSection />
      <ReviewsSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
      <FooterSection />
    </div>
  );
};

export default Landing;
