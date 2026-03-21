import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const PropFirms = () => {
  const { data: firms = [] } = useQuery({
    queryKey: ["prop-firms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prop_firms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prop Firms</h1>
        <p className="text-sm text-muted-foreground mt-1">Top funded trading programs</p>
      </div>
      {firms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {firms.map((f: any, i: number) => (
            <motion.a
              key={f.id}
              href={f.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{f.name}</h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground">{f.description || "Trading prop firm"}</p>
            </motion.a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">No prop firms listed yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
};

export default PropFirms;
