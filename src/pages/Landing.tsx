import { useEffect, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const showcaseData = [
  {
    title: "Essential Trading Tools",
    description:
      "Calculate risk, pips, lot size, and consistency in one clean workspace built for traders.",
    image: "/showcase/tool showcase.jpg",
  },
  {
    title: "Trading Calendar Overview",
    description:
      "Track daily P&L and trading activity at a glance with a premium calendar experience.",
    image: "/showcase/Calender show case.jpg",
  },
  {
    title: "Trade Journal",
    description:
      "Log every trade in a structured way so you can review mistakes, results, and growth clearly.",
    image: "/showcase/Journal Case.jpg",
  },
  {
    title: "Advanced Analytics",
    description:
      "Visualize your performance with smart analytics that help you improve discipline and consistency.",
    image: "/showcase/analytics.jpg",
  },
];

const ShowcaseSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? showcaseData.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === showcaseData.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === showcaseData.length - 1 ? 0 : prev + 1
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const currentItem = showcaseData[currentIndex];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-medium text-primary mb-4">
            Product Showcase
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            See JournalXPro in action
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Explore the core screens traders use every day to journal, analyze,
            and improve performance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentIndex}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
              >
                <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
                  Screen {currentIndex + 1} of {showcaseData.length}
                </div>

                <h3 className="text-2xl md:text-4xl font-bold mb-4">
                  {currentItem.title}
                </h3>

                <p className="text-muted-foreground text-base md:text-lg leading-8 mb-8">
                  {currentItem.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handlePrev}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={handleNext}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {showcaseData.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setCurrentIndex(index)}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    currentIndex === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${currentIndex}`}
                initial={{ opacity: 0, x: 40, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-2xl overflow-hidden"
              >
                <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{currentItem.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Premium trading journal experience
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/20" />
                  </div>
                </div>

                <div className="p-3 md:p-4">
                  <img
                    src={currentItem.image}
                    alt={currentItem.title}
                    className="w-full rounded-2xl object-cover border border-border"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const { data: couponSetting } = useQuery({
    queryKey: ["site-settings-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "active_coupons")
        .maybeSingle();

      return (
        (data?.value as {
          codes?: { code: string; discount: string }[];
          enabled?: boolean;
        }) || {}
      );
    },
  });

  const coupons =
    couponSetting?.enabled !== false ? couponSetting?.codes || [] : [];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <LandingNav />

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
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  toast.success(`Copied: ${c.code}`);
                }}
                className="flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/80 transition-colors"
              >
                🎉 Use code <span className="font-bold underline">{c.code}</span> for{" "}
                {c.discount} off!
                <Copy className="h-3 w-3" />
              </button>
            ))}
          </motion.div>
        </div>
      )}

      <div className="bg-card border-b border-border py-2 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          🎁 Get <span className="text-primary font-bold">10 bonus points</span> on
          signup! Use referral code:{" "}
          <button
            onClick={() => {
              navigator.clipboard.writeText("JOURNALXPRO");
              toast.success("Copied: JOURNALXPRO");
            }}
            className="font-mono font-bold text-primary hover:underline"
          >
            JOURNALXPRO <Copy className="h-3 w-3 inline ml-1" />
          </button>
        </p>
      </div>

      <HeroSection />
      <ShowcaseSection />
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