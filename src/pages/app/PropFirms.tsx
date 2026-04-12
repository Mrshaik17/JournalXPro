import { ExternalLink, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const PropFirms = () => {
  const { data: firms = [] } = useQuery({
    queryKey: ["prop-firms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prop_firms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "PF";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prop Firms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore funded trading programs and external firm websites
          </p>
        </div>

        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit">
          {firms.length} firm{firms.length !== 1 ? "s" : ""}
        </div>
      </div>

      {firms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {firms.map((f: any, i: number) => (
            <motion.a
              key={f.id}
              href={f.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.28 }}
              className="group rounded-2xl bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(f.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight truncate">
                      {f.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        Prop Firm
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-full bg-background/70 p-2 text-muted-foreground transition-colors group-hover:text-primary">
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {f.description || "Explore this trading prop firm and visit the official website for program details."}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  Open website
                </span>

                <div className="flex items-center gap-2 text-primary">
                  <span className="text-xs font-medium opacity-80">Visit</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-card/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-base font-semibold tracking-tight">
            No prop firms available
          </h3>

          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            There are no listed funded trading programs right now. Check back soon for new firm entries.
          </p>
        </div>
      )}
    </div>
  );
};

export default PropFirms;