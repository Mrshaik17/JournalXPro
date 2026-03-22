import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ExternalLink, Info } from "lucide-react";
import { motion } from "framer-motion";

const News = () => {
  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">News</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest market news & updates</p>
      </div>

      {/* Forex Factory banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
      >
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-foreground">
            Please refer to{" "}
            <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1">
              Forex Factory <ExternalLink className="h-3 w-3" />
            </a>{" "}
            for the latest economic calendar and additional market news.
          </p>
        </div>
      </motion.div>

      {news.length > 0 ? (
        <div className="space-y-3">
          {news.map((n: any, i: number) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{n.category}</span>
                {n.asset_name && <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">{n.asset_name}</span>}
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-semibold mb-1">{n.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.content}</p>
              {n.source && <p className="text-xs text-muted-foreground mt-2 font-mono">Source: {n.source}</p>}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No news yet. Please refer to Forex Factory for the latest updates.</p>
        </div>
      )}
    </div>
  );
};

export default News;
