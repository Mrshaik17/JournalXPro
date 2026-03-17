import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  { q: "What is the Divine Score?", a: "The Divine Score measures your plan adherence — how often you follow your trading plan. It's calculated as (trades where follow_plan = true) / total trades. Above 90% and you're in Monk Mode." },
  { q: "How does the free plan work?", a: "You get 20 trades per month for free with 1 account. Perfect for getting started and building the journaling habit." },
  { q: "Can I track multiple accounts?", a: "Yes! Pro allows 5 accounts and Pro+ gives you unlimited accounts. Each maintains its own balance and trade history." },
  { q: "How do payments work?", a: "We support UPI, GPay, and PhonePe. Upload your payment screenshot and transaction ID for verification. Crypto payments coming soon." },
  { q: "Is my data secure?", a: "Absolutely. All data is stored securely with row-level security. Only you can access your trading data." },
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
