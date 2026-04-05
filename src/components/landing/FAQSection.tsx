import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type FAQCategory =
  | "Getting Started"
  | "Pricing & Plans"
  | "Payments & Referrals"
  | "Journal & Accounts"
  | "Analytics & Tools"
  | "Prop Firms & MT5"
  | "Security & Data"
  | "Support & Policies";

type FAQItem = {
  q: string;
  a: string;
  category: FAQCategory;
};

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    q: "What is JournalXPro?",
    a: "JournalXPro is a discipline-first trading journal built for forex, crypto, and prop firm traders. Track trades, analyze performance, measure consistency, and build winning habits — all in one platform.",
  },
  {
    category: "Getting Started",
    q: "Who is JournalXPro for?",
    a: "JournalXPro is built for forex traders, crypto traders, prop firm traders, funded traders, and anyone who wants a structured system instead of spreadsheets or handwritten journals.",
  },
  {
    category: "Getting Started",
    q: "Can I use JournalXPro on mobile?",
    a: "Yes. JournalXPro is fully responsive and works well on mobile browsers, tablets, and desktop.",
  },
  {
    category: "Getting Started",
    q: "How fast can I log a trade?",
    a: "Under 10 seconds for a basic entry. You can also add more details like notes, tags, screenshots, and custom fields when needed.",
  },

  {
    category: "Pricing & Plans",
    q: "What are the pricing plans?",
    a: "JournalXPro offers plan-based access with different limits and features. Lower plans are built for getting started, while higher plans unlock advanced analytics, more accounts, more screenshots, AI insights, and premium features.",
  },
  {
    category: "Pricing & Plans",
    q: "What happens when my plan expires?",
    a: "You will move back to the free/basic access level. Your data is not immediately lost, and retention depends on your plan and system policy.",
  },
  {
    category: "Pricing & Plans",
    q: "Can I upgrade my plan anytime?",
    a: "Yes. You can upgrade anytime from the Upgrade section, and once payment is approved your limits and premium features will reflect in your account.",
  },
  {
    category: "Pricing & Plans",
    q: "Are analytics different for each plan?",
    a: "Yes. Basic plans get essential analytics, higher plans unlock deeper performance breakdowns, and top plans unlock the most advanced insights, AI-driven analysis, and premium reporting.",
  },

  {
    category: "Payments & Referrals",
    q: "How do payments work?",
    a: "Choose your plan, complete payment using the available method, upload the required payment proof if needed, and your plan gets activated after admin verification.",
  },
  {
    category: "Payments & Referrals",
    q: "What payment methods do you support?",
    a: "We support INR payments through UPI/GPay/PhonePe and also crypto payments for users who want to pay digitally from anywhere.",
  },
  {
    category: "Payments & Referrals",
    q: "What currencies can I pay in?",
    a: "You can pay in INR through Indian payment methods and in crypto where supported by the platform.",
  },
  {
    category: "Payments & Referrals",
    q: "How do coupon codes work?",
    a: "Admin-created coupon codes can reduce the subscription price during checkout. Validity and discount values depend on the active coupon configuration.",
  },
  {
    category: "Payments & Referrals",
    q: "How does the referral system work?",
    a: "Referral codes help track signups and rewards. Depending on the system rules, users can earn points or benefits when others join or upgrade using their referral.",
  },
  {
    category: "Payments & Referrals",
    q: "How do referral points work?",
    a: "Referral points are earned when eligible users join or complete successful actions through your code. These points can later be used according to the referral reward rules set inside the platform.",
  },
  {
    category: "Payments & Referrals",
    q: "Can I get a refund?",
    a: "Refund availability depends on the platform refund policy and time window after purchase. Always check the active Terms before payment.",
  },

  {
    category: "Journal & Accounts",
    q: "Can I track multiple accounts?",
    a: "Yes. JournalXPro supports multiple trading accounts. The number of accounts depends on your active plan.",
  },
  {
    category: "Journal & Accounts",
    q: "Do you support broker accounts and prop firm accounts?",
    a: "Yes. You can manage both broker accounts and prop firm accounts inside the platform.",
  },
  {
    category: "Journal & Accounts",
    q: "Can I add custom fields to my journal?",
    a: "Yes. You can use custom fields to track strategy-specific details like setup type, emotions, session, bias, and more.",
  },
  {
    category: "Journal & Accounts",
    q: "Can I upload trade screenshots?",
    a: "Yes. Screenshot upload support is included, and limits depend on your subscription plan. Images can be compressed to save storage while maintaining useful quality.",
  },
  {
    category: "Journal & Accounts",
    q: "What is Account Sharing?",
    a: "Account Sharing lets you share selected account access in a controlled way, useful for mentors, evaluators, or teammates who need to review performance.",
  },
  {
    category: "Journal & Accounts",
    q: "How do I share my account with a mentor?",
    a: "You can use the Account Sharing feature or a controlled view access system when available, so others can review data without interfering with your core records.",
  },
  {
    category: "Journal & Accounts",
    q: "What is Payout Tracker?",
    a: "Payout Tracker helps you monitor funded withdrawals, profits received, payout history, and overall funded account cash flow in a more organized way.",
  },

  {
    category: "Analytics & Tools",
    q: "What analytics are available?",
    a: "Analytics can include win rate, P&L, drawdown, average RR, streaks, account-level performance, pair/session/day breakdowns, and advanced plan-based insights.",
  },
  {
    category: "Analytics & Tools",
    q: "How does the JournalX Score work?",
    a: "The JournalX Score is a discipline-focused score that measures how consistently you follow your own plan and trading rules, rather than only focusing on profit.",
  },
  {
    category: "Analytics & Tools",
    q: "Do you provide trading signals?",
    a: "No. JournalXPro is focused on journaling, tracking, analytics, and self-improvement — not signal selling.",
  },
  {
    category: "Analytics & Tools",
    q: "What trading tools are included?",
    a: "Built-in tools can include pip calculator, lot size calculator, risk calculator, consistency calculator, and other utilities that support better decision-making.",
  },
  {
    category: "Analytics & Tools",
    q: "What is the consistency score calculator?",
    a: "It helps traders check whether profits or performance are too concentrated, which is especially useful for prop-style rule tracking.",
  },
  {
    category: "Analytics & Tools",
    q: "Do higher plans unlock better analytics?",
    a: "Yes. Advanced plans unlock more premium analytics, deeper performance views, and more powerful insights than the starter plans.",
  },

  {
    category: "Prop Firms & MT5",
    q: "What is the Prop Firm Tracker?",
    a: "The Prop Firm Tracker helps you monitor drawdown, daily loss limits, max loss limits, and other rules that matter for challenge and funded accounts.",
  },
  {
    category: "Prop Firms & MT5",
    q: "Do you support prop firm traders?",
    a: "Yes. JournalXPro is especially useful for prop firm traders who need structured journaling, drawdown awareness, payout tracking, and discipline management.",
  },
  {
    category: "Prop Firms & MT5",
    q: "What is MT5 Auto Sync?",
    a: "MT5 Auto Sync is designed to connect MetaTrader-based activity into the journal automatically so you don’t have to manually enter every trade.",
  },
  {
    category: "Prop Firms & MT5",
    q: "Is MT5 Auto Sync available right now?",
    a: "Availability depends on your current version and active plan. If shown as in development or coming soon, it means the feature is being prepared or rolled out gradually.",
  },
  {
    category: "Prop Firms & MT5",
    q: "Can I use JournalXPro for challenge accounts and funded accounts?",
    a: "Yes. You can track both challenge and funded accounts with account-specific history and performance.",
  },

  {
    category: "Security & Data",
    q: "Is my data secure?",
    a: "Yes. JournalXPro is designed to store user data securely with account-based separation so users only access their own trading records.",
  },
  {
    category: "Security & Data",
    q: "Who can see my journal data?",
    a: "Only you, unless you intentionally use sharing-related features that grant controlled access.",
  },
  {
    category: "Security & Data",
    q: "What is the data retention policy?",
    a: "Data retention depends on plan and system policy. Paid users usually retain more data history than free users.",
  },
  {
    category: "Security & Data",
    q: "Will my data be deleted immediately if I downgrade?",
    a: "Not usually immediately. Data retention and cleanup follow the active platform rules, giving users time before permanent cleanup where applicable.",
  },
  {
    category: "Security & Data",
    q: "Are screenshots stored safely?",
    a: "Yes. Screenshot uploads are intended to be stored securely and tied to your own account data.",
  },

  {
    category: "Support & Policies",
    q: "How do I contact support?",
    a: "You can use the chat widget, contact form, or any support channel listed in the platform footer or contact section.",
  },
  {
    category: "Support & Policies",
    q: "How do announcements work?",
    a: "Admin announcements can be published and shown directly to users inside the platform so important updates are visible quickly.",
  },
  {
    category: "Support & Policies",
    q: "Will admin changes reflect to users automatically?",
    a: "Yes. Important platform-level changes like announcements, pricing updates, payment settings, prop firm data, and similar shared content are intended to reflect to users from the admin side.",
  },
  {
    category: "Support & Policies",
    q: "What happens if the website is under maintenance?",
    a: "If maintenance mode is enabled, users will see a clear message and the system will return once maintenance is complete.",
  },
  {
    category: "Support & Policies",
    q: "Is there a backtesting tool?",
    a: "Backtesting may be listed as a current or upcoming advanced feature depending on the version of the platform you are using.",
  },
];

const categories: FAQCategory[] = [
  "Getting Started",
  "Pricing & Plans",
  "Payments & Referrals",
  "Journal & Accounts",
  "Analytics & Tools",
  "Prop Firms & MT5",
  "Security & Data",
  "Support & Policies",
];

export const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("Getting Started");

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => faq.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything useful about JournalXPro — organized category-wise so users can quickly find what they need.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm transition-all ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 md:p-6"
        >
          <div className="mb-5">
            <h3 className="text-xl md:text-2xl font-semibold">{activeCategory}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredFaqs.length} question{filteredFaqs.length !== 1 ? "s" : ""} in this section
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <AccordionItem
                key={`${activeCategory}-${i}`}
                value={`${activeCategory}-faq-${i}`}
                className="border border-border rounded-xl px-4 bg-background/60"
              >
                <AccordionTrigger className="text-sm md:text-base font-medium hover:no-underline text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-7">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};