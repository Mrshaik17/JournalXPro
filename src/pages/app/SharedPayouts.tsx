import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { DollarSign, Award, TrendingUp, Calendar } from "lucide-react";

const SharedPayouts = () => {
  const { token } = useParams<{ token: string }>();

  const { data: payout, isLoading } = useQuery({
    queryKey: ["shared-payout", token],
    queryFn: async () => {
      const { data, error } = await supabase.from("payouts" as any).select("*").eq("share_token", token!).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><p>Loading...</p></div>;
  if (!payout) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><p className="text-muted-foreground">Payout not found or link expired.</p></div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Payout Certificate</h1>
        <p className="text-sm text-muted-foreground">Verified by JournalXPro</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{payout.company_name}</h3>
            <span className="text-xs text-muted-foreground font-mono">{format(new Date(payout.received_date), "MMM dd, yyyy")}</span>
          </div>
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div className="font-mono text-3xl font-bold text-green-400 mb-4">+${Number(payout.payout_amount).toFixed(2)}</div>
        {payout.screenshot_url && (
          <img src={payout.screenshot_url} alt="Certificate" className="rounded-md border border-border w-full max-h-80 object-contain" />
        )}
        {/* Watermark */}
        <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/50 font-semibold">JournalXPro</div>
      </motion.div>

      <div className="text-center mt-8 text-xs text-muted-foreground">
        Powered by <span className="text-primary font-semibold">JournalXPro</span>
      </div>
    </div>
  );
};

export default SharedPayouts;
