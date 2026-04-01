import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  { q: "What is JournalXPro?", a: "JournalXPro is a discipline-first trading journal built for forex, crypto, and prop firm traders. Track trades, analyze performance, measure consistency, and build winning habits." },
  { q: "How does the JournalX Score work?", a: "The JournalX Score measures your plan adherence — how often you follow your trading plan. It's calculated as (trades where plan followed) / total trades. Above 90% means excellent discipline." },
  { q: "What are the pricing plans?", a: "Free: 15 trades/month, 1 account. Pro (₹350/mo): 70 trades, 3 accounts. Pro+ (₹499/mo): 150 trades, MT5 sync, AI insights. Elite (₹649/mo): Unlimited trades, unlimited MT5 sync, full AI analysis." },
  { q: "How do payments work?", a: "We support UPI, GPay, PhonePe, and crypto payments. Select your plan, send payment, upload your screenshot with transaction ID, and we'll verify and activate within minutes." },
  { q: "Can I track multiple accounts?", a: "Yes! Free gets 1 account. Pro allows 3, Pro+ gives 7, and Elite supports up to 10 accounts. Each maintains its own balance, P&L, and trade history." },
  { q: "What is MT5 Auto Sync?", a: "MT5 Auto Sync connects your MetaTrader 5 account to automatically import trades. Pro+ gets 50 auto-synced trades, Elite gets unlimited." },
  { q: "How does the referral system work?", a: "Share your referral code with friends. You earn 10 points per successful referral. If they buy a plan, you earn bonus points (20 for Pro, 30 for Pro+, 50 for Elite). Redeem 500 points for a free month!" },
  { q: "Is my data secure?", a: "Absolutely. All data is stored securely with row-level security. Only you can access your trading data. We never share or sell your information." },
  { q: "Can I get a refund?", a: "Refunds are available within 24 hours of payment. After that, your subscription remains active for the paid period. Contact support for any issues." },
  { q: "What happens when my plan expires?", a: "You'll revert to the free plan. Your data is retained for 30 days (free) or 1 year (paid plans). We'll notify you before any data cleanup." },
  { q: "How fast can I log a trade?", a: "Under 10 seconds! Our streamlined journal form lets you log entry, SL, TP, result, and P&L with just a few taps. Add photos and custom fields as needed." },
  { q: "Do you provide trading signals?", a: "We focus on journaling and analytics, not signals. However, our AI insights (Elite plan) analyze your trading patterns and suggest improvements." },
  { q: "Can I use JournalXPro on mobile?", a: "Yes! JournalXPro is fully responsive and works great on mobile browsers. A dedicated app is coming soon." },
  { q: "What is the consistency score calculator?", a: "It's a prop firm tool that checks if your best trading day exceeds the consistency limit (typically 25% of profit target). Essential for passing prop firm challenges." },
  { q: "How do I contact support?", a: "Use the live chat widget on any page. Our support team responds within minutes during business hours. You can also raise a support ticket for complex issues." },
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
          <p className="text-muted-foreground">Everything you need to know about JournalXPro</p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
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
