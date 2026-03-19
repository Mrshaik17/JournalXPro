import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { LandingNav } from "@/components/landing/LandingNav";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <ReviewsSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default Landing;
