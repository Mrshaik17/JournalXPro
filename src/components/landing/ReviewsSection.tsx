import { motion } from "framer-motion";
import { Star, Quote, BadgeCheck } from "lucide-react";

const reviews = [
  {
    name: "Arjun S.",
    role: "Forex Trader",
    text: "JournalXPro completely changed how I approach journaling. The JournalX Score keeps me honest about my discipline.",
    stars: 5,
    tag: "Discipline Focused",
  },
  {
    name: "Priya M.",
    role: "Crypto Trader",
    text: "The simplicity is unmatched. I log trades in seconds and the analytics help me see patterns I never noticed before.",
    stars: 5,
    tag: "Fast Logging",
  },
  {
    name: "Rahul K.",
    role: "Prop Firm Trader",
    text: "Managing multiple accounts is seamless. The consistency score calculator and risk tools are game changers for prop firm challenges.",
    stars: 5,
    tag: "Prop Firm Ready",
  },
  {
    name: "Sarah T.",
    role: "Day Trader",
    text: "Finally a journal that focuses on discipline, not just profit. The plan adherence tracking is exactly what I needed.",
    stars: 4,
    tag: "Clean Experience",
  },
  {
    name: "Mike D.",
    role: "Swing Trader",
    text: "The pricing is unbeatable compared to other journals. Getting AI insights and MT5 sync at this price is incredible value.",
    stars: 5,
    tag: "Best Value",
  },
  {
    name: "Aisha R.",
    role: "Gold Trader",
    text: "Love the custom fields feature. I can track exactly what matters to my strategy. The photo upload for trade screenshots is perfect.",
    stars: 5,
    tag: "Custom Tracking",
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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-5">
            <BadgeCheck className="h-3.5 w-3.5" />
            Real trader feedback
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by disciplined traders
          </h2>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for forex, crypto, and prop firm traders who want more than just
            a spreadsheet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 card-glow transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star
                      key={`filled-${j}`}
                      className="h-3.5 w-3.5 fill-primary text-primary"
                    />
                  ))}
                  {Array.from({ length: 5 - review.stars }).map((_, j) => (
                    <Star
                      key={`empty-${j}`}
                      className="h-3.5 w-3.5 text-muted"
                    />
                  ))}
                </div>

                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Quote className="h-4 w-4" />
                </div>
              </div>

              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary mb-4">
                {review.tag}
              </span>

              <p className="text-sm text-muted-foreground leading-7 mb-6">
                “{review.text}”
              </p>

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};