import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Megaphone, Gift, Trophy, AlertTriangle, Bell } from "lucide-react";

const typeIcon: Record<string, any> = {
  update: Bell,
  giveaway: Gift,
  winner: Trophy,
  maintenance: AlertTriangle,
};
const typeColor: Record<string, string> = {
  update: "text-primary",
  giveaway: "text-yellow-400",
  winner: "text-green-400",
  maintenance: "text-destructive",
};

const Announcements = () => {
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest updates from the team</p>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((a: any, i: number) => {
            const Icon = typeIcon[a.type] || Bell;
            const color = typeColor[a.type] || "text-primary";
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${a.type === "giveaway" ? "bg-yellow-500/10 text-yellow-400" : a.type === "winner" ? "bg-green-500/10 text-green-400" : a.type === "maintenance" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{a.type}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{a.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">No announcements yet. Stay tuned!</p>
        </div>
      )}
    </div>
  );
};

export default Announcements;
