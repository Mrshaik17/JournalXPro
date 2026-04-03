import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  { q: "What is JournalXPro?", a: "JournalXPro is a discipline-first trading journal built for forex, crypto, and prop firm traders. Track trades, analyze performance, measure consistency, and build winning habits — all in one platform." },
  { q: "How does the JournalX Score work?", a: "The JournalX Score measures your plan adherence — how often you follow your trading plan. It's calculated as (trades where plan followed) / total trades. Above 90% means excellent discipline." },
  { q: "What are the pricing plans?", a: "Free: 15 trades/month, 1 account. Pro (₹350/mo): 70 trades, 3 accounts. Pro+ (₹499/mo): 150 trades, MT5 sync, AI insights. Elite (₹649/mo): Unlimited trades, unlimited MT5 sync, full AI analysis." },
  { q: "How do payments work?", a: "We support UPI, GPay, PhonePe, and crypto payments. Select your plan, send payment, upload your screenshot with transaction ID, and we'll verify and activate within minutes." },
  { q: "Can I track multiple accounts?", a: "Yes! Free gets 1 account. Pro allows 3, Pro+ gives 7, and Elite supports up to 10 accounts. Each maintains its own balance, P&L, and trade history." },
  { q: "What is MT5 Auto Sync?", a: "MT5 Auto Sync connects your MetaTrader 5 account to automatically import trades. You provide server, login, and investor password. Pro+ gets 50 auto-synced trades, Elite gets unlimited." },
  { q: "How does the referral system work?", a: "Each user gets a unique referral code automatically. Share it with friends — earn 10 points per successful signup. If they buy a plan, you earn bonus points (20 for Pro, 30 for Pro+, 50 for Elite). Redeem 500 points for a free month!" },
  { q: "Is my data secure?", a: "Absolutely. All data is stored securely with row-level security. Only you can access your trading data. We never share or sell your information." },
  { q: "Can I get a refund?", a: "Refunds are available within 24 hours of payment only. After that, your subscription remains active for the paid period. This is clearly mentioned in our Terms of Service." },
  { q: "What happens when my plan expires?", a: "You'll revert to the free plan. Your data is retained for 30 days (free) or 1 year (paid plans). We'll notify you before any data cleanup." },
  { q: "How fast can I log a trade?", a: "Under 10 seconds! Our streamlined journal form lets you log entry, SL, TP, result, P&L, lot size, pips and more. Add up to 2 photos and custom fields as needed." },
  { q: "Do you provide trading signals?", a: "No. We focus on journaling and analytics, not signals. Our AI insights (Elite plan) analyze your trading patterns and suggest improvements based on your own data." },
  { q: "Can I use JournalXPro on mobile?", a: "Yes! JournalXPro is fully responsive and works great on mobile browsers. The entire interface adapts to your screen size." },
  { q: "What is the consistency score calculator?", a: "It's a prop firm tool that checks if your best trading day exceeds the consistency limit (typically 25% of profit target). Essential for passing prop firm challenges." },
  { q: "How do I contact support?", a: "Use the live chat widget on any page, or send us a message from the Contact section on the landing page. Our support team responds within minutes during business hours." },
  { q: "What trading tools are included?", a: "Universal Pip Calculator (supports Forex, JPY, Gold, Crypto, Indices), Lot Size Calculator, Risk Calculator, and Consistency Score Calculator — all built in for free." },
  { q: "Can I add custom fields to my journal?", a: "Yes! You can add unlimited custom fields to each trade entry. This lets you track any metric specific to your strategy — session, setup type, emotion, or anything else." },
  { q: "What is the Prop Firm Tracker?", a: "When you add a Prop Firm account, you can set daily drawdown and max drawdown limits. The dashboard then tracks your usage against these limits in real-time, helping you stay within rules." },
  { q: "What analytics are available?", a: "Basic: Win rate, PnL, streaks. Pro: Pair/session/day analysis, drawdown metrics, strategy analytics. Elite: AI insights, discipline score, equity curves, expectancy, and monthly reports." },
  { q: "How do I share my account with a mentor?", a: "Each account can generate a read-only sharing link. Your mentor or evaluator can view your trades and analytics without being able to modify anything." },
  { q: "Do you support Broker and Prop Firm accounts?", a: "Yes! When adding an account, choose Broker or Prop Firm. Prop Firm accounts include drawdown tracking and consistency score monitoring." },
  { q: "Can I upload trade screenshots?", a: "Yes, up to 2 photos per trade. Images are automatically compressed to save storage while maintaining quality." },
  { q: "What currencies can I pay in?", a: "You can pay in INR (via UPI/GPay/PhonePe) or USD/crypto. The INR conversion rate is updated by admin to reflect current market rates." },
  { q: "How do coupon codes work?", a: "Admin-created coupon codes provide discounts on subscription plans. Enter your code during checkout. Note: coupons and referral points cannot be combined on the same purchase." },
  { q: "What is the data retention policy?", a: "Free plan data is retained for 30 days. Paid plan data is retained for 1 year. After expiry, data is automatically cleaned. We recommend exporting your data regularly." },
  { q: "Is there a backtesting tool?", a: "Backtesting is currently listed as 'Coming Soon' in our advanced settings. We're actively developing it and will announce when it's available." },
  { q: "How do announcements work?", a: "Admin posts announcements (updates, giveaways, winner announcements) that sync to all users in real-time. Check your dashboard sidebar for the latest announcements." },
  { q: "What happens if the website is under maintenance?", a: "If admin enables maintenance mode, you'll see a clear message explaining the situation. Your data is safe and the site will be back shortly." },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="container px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">FAQ</h2>
          <p className="text-muted-foreground">Everything you need to know about JournalXPro — from A to Z</p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-medium hover:no-underline text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
