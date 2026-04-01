import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Arjun S.",
    role: "Forex Trader",
    text: "JournalXPro completely changed how I approach journaling. The JournalX Score keeps me honest about my discipline.",
    stars: 5,
  },
  {
    name: "Priya M.",
    role: "Crypto Trader",
    text: "The simplicity is unmatched. I log trades in seconds and the analytics help me see patterns I never noticed before.",
    stars: 5,
  },
  {
    name: "Rahul K.",
    role: "Prop Firm Trader",
    text: "Managing multiple accounts is seamless. The consistency score calculator and risk tools are game changers for prop firm challenges.",
    stars: 5,
  },
  {
    name: "Sarah T.",
    role: "Day Trader",
    text: "Finally a journal that focuses on discipline, not just profit. The plan adherence tracking is exactly what I needed.",
    stars: 4,
  },
  {
    name: "Mike D.",
    role: "Swing Trader",
    text: "The pricing is unbeatable compared to other journals. Getting AI insights and MT5 sync at this price is incredible value.",
    stars: 5,
  },
  {
    name: "Aisha R.",
    role: "Gold Trader",
    text: "Love the custom fields feature. I can track exactly what matters to my strategy. The photo upload for trade screenshots is perfect.",
    stars: 5,
  },
];

export const ReviewsSection = () => {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Traders</h2>
          <p className="text-muted-foreground text-lg">Trusted by prop firm traders and brokers worldwide.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300"
            >
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: review.stars }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
                {Array.from({ length: 5 - review.stars }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-muted" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{review.text}"</p>
              <div>
                <p className="text-sm font-semibold">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
