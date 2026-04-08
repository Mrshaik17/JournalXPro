import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

const SharedPayouts = () => {
  const { token } = useParams<{ token: string }>();

  // 🔹 Detect type
  const isAll = token?.startsWith("all_");

  const { data, isLoading } = useQuery({
    queryKey: ["shared-payout", token],
    queryFn: async () => {
      if (!token) return null;

      // 🔹 SHARE ALL
      if (isAll) {
        const realToken = token.replace("all_", "");

        // get user_id from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("payouts_share_token", realToken)
          .single();

        if (!profile) throw new Error("Invalid link");

        // get all payouts of that user
        const { data: payouts } = await supabase
          .from("payouts")
          .select("*")
          .eq("user_id", profile.id)
          .order("received_date", { ascending: false });

        return { type: "all", payouts };
      }

      // 🔹 SINGLE PAYOUT
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("share_token", token)
        .single();

      if (error) throw error;

      return { type: "single", payout: data };
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Invalid or expired link
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold text-center mb-6">
        Payout Tracker (Read Only)
      </h1>

      {/* 🔹 SHARE ALL */}
      {data.type === "all" &&
        data.payouts?.map((payout: any) => (
          <motion.div
            key={payout.id}
            className="border rounded-lg p-4 mb-4 bg-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="font-semibold">{payout.company_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(payout.received_date), "MMM dd, yyyy")}
                </p>
              </div>
              <Award className="h-5 w-5 text-primary" />
            </div>

            <p className="text-green-400 text-xl font-bold mb-2">
              +${Number(payout.payout_amount).toFixed(2)}
            </p>

            {payout.screenshot_url && (
              <img
                src={payout.screenshot_url}
                className="rounded-md max-h-60 w-full object-contain"
              />
            )}
          </motion.div>
        ))}

      {/* 🔹 SINGLE */}
      {data.type === "single" && (
        <motion.div
          className="border rounded-lg p-6 bg-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="font-semibold text-lg mb-2">
            {data.payout.company_name}
          </h3>

          <p className="text-xs text-muted-foreground mb-2">
            {format(new Date(data.payout.received_date), "MMM dd, yyyy")}
          </p>

          <p className="text-green-400 text-2xl font-bold mb-4">
            +${Number(data.payout.payout_amount).toFixed(2)}
          </p>

          {data.payout.screenshot_url && (
            <img
              src={data.payout.screenshot_url}
              className="rounded-md w-full max-h-80 object-contain"
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SharedPayouts;