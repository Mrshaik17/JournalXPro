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
        .from("user_payout_requests")
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
      <div className="min-h-screen bg-background text-foreground px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm font-semibold tracking-wide text-primary">
                JournalXPro
              </span>
            </div>

            <h1 className="text-3xl font-bold text-center tracking-tight mb-1">
              Payout Tracker
            </h1>

            <p className="text-center text-xs text-muted-foreground mb-6">
              Track • Verify • Share your trading payouts
            </p>

            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm font-semibold tracking-wide text-primary">
                JournalXPro
              </span>
            </div>

            <h1 className="text-3xl font-bold text-center tracking-tight mb-1">
              Payout Tracker
            </h1>

            <p className="text-center text-xs text-muted-foreground mb-6">
              Track • Verify • Share your trading payouts
            </p>

            <div className="text-sm text-muted-foreground mb-6">
              Invalid or expired link
            </div>

            <a
              href="/"
              className="mt-6 block w-full text-center bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
            >
              Start Your Trading Journal →
            </a>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Built for serious traders •{" "}
              <span className="text-primary font-semibold">JournalXPro</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm shadow-sm p-5 sm:p-8">
          {/* OPTIONAL LOGO */}
          {/* <img src="/logo-new.png" className="h-6 mx-auto mb-2" /> */}

          {/* TOP BRAND HEADER */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm font-semibold tracking-wide text-primary">
              JournalXPro
            </span>
          </div>

          {/* TITLE */}
          <h1 className="text-3xl font-bold text-center tracking-tight mb-1">
            Payout Tracker
          </h1>

          {/* TRUST LINE */}
          <p className="text-center text-xs text-muted-foreground mb-6">
            Track • Verify • Share your trading payouts
          </p>

          {/* 🔹 SHARE ALL */}
          {data.type === "all" && (
            <div className="space-y-4">
              {data.payouts?.map((payout: any) => (
                <motion.div
                  key={payout.id}
                  className="border border-border rounded-2xl p-4 sm:p-5 bg-background/60 shadow-sm hover:shadow-md transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                        {payout.company_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payout.received_date), "MMM dd, yyyy")}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-full border border-border bg-card p-2">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>

                  <p className="text-green-400 text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                    +${Number(payout.amount).toFixed(2)}
                  </p>

                  {/* SHARED VIA BADGE */}
                  <div className="mt-3 inline-flex items-center gap-2 text-xs bg-background border border-border px-3 py-1 rounded-full">
                    🚀 Shared via{" "}
                    <span className="text-primary font-semibold">
                      JournalXPro
                    </span>
                  </div>

                  {payout.screenshot_url && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                      <img
                        src={payout.screenshot_url}
                        alt={`${payout.company_name} payout screenshot`}
                        className="rounded-xl max-h-60 w-full object-contain bg-background"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* 🔹 SINGLE */}
          {data.type === "single" && (
            <motion.div
              className="border border-border rounded-2xl p-5 sm:p-6 bg-background/60 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg sm:text-xl text-foreground">
                    {data.payout.company_name}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(data.payout.received_date), "MMM dd, yyyy")}
                  </p>
                </div>

                <div className="shrink-0 rounded-full border border-border bg-card p-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
              </div>

              <p className="text-green-400 text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                +${Number(data.payout.amount).toFixed(2)}
              </p>

              {/* SHARED VIA BADGE */}
              <div className="mt-3 inline-flex items-center gap-2 text-xs bg-background border border-border px-3 py-1 rounded-full">
                🚀 Shared via{" "}
                <span className="text-primary font-semibold">JournalXPro</span>
              </div>

              {data.payout.screenshot_url && (
                <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
                  <img
                    src={data.payout.screenshot_url}
                    alt={`${data.payout.company_name} payout screenshot`}
                    className="rounded-xl w-full max-h-80 object-contain bg-background"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* CTA BUTTON */}
          <a
            href="/"
            className="mt-6 block w-full text-center bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
          >
            Start Your Trading Journal →
          </a>

          {/* FOOTER BRANDING */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Built for serious traders •{" "}
            <span className="text-primary font-semibold">JournalXPro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedPayouts;