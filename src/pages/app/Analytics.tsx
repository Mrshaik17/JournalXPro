import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const { user } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trades").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const breakeven = trades.filter((t) => t.result === "breakeven").length;

  const pieData = [
    { name: "Wins", value: wins, color: "hsl(160, 60%, 40%)" },
    { name: "Losses", value: losses, color: "hsl(0, 84%, 60%)" },
    { name: "Breakeven", value: breakeven, color: "hsl(240, 5%, 48%)" },
  ].filter((d) => d.value > 0);

  // PnL by day
  const pnlByDay: Record<string, number> = {};
  trades.forEach((t) => {
    const day = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    pnlByDay[day] = (pnlByDay[day] || 0) + Number(t.pnl_amount);
  });
  const barData = Object.entries(pnlByDay).map(([day, pnl]) => ({ day, pnl }));

  // Tag performance
  const tagPerf: Record<string, { wins: number; total: number; pnl: number }> = {};
  trades.forEach((t) => {
    (t.tags || []).forEach((tag: string) => {
      if (!tagPerf[tag]) tagPerf[tag] = { wins: 0, total: 0, pnl: 0 };
      tagPerf[tag].total++;
      if (t.result === "win") tagPerf[tag].wins++;
      tagPerf[tag].pnl += Number(t.pnl_amount);
    });
  });

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance insights</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
          <p className="text-muted-foreground text-sm">Add trades to see your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Pie */}
        <div className="rounded-lg border border-border bg-card p-5 card-glow">
          <h3 className="text-sm font-semibold mb-4">Win Rate Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 5%, 7%)", border: "1px solid hsl(0, 0%, 20%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* PnL Bar Chart */}
        <div className="rounded-lg border border-border bg-card p-5 card-glow">
          <h3 className="text-sm font-semibold mb-4">Daily P&L</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(240, 5%, 48%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240, 5%, 48%)" }} />
                <Tooltip contentStyle={{ background: "hsl(240, 5%, 7%)", border: "1px solid hsl(0, 0%, 20%)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="pnl" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tag Performance */}
      {Object.keys(tagPerf).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 card-glow">
          <h3 className="text-sm font-semibold mb-4">Tag Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left p-2">Tag</th>
                  <th className="text-right p-2">Trades</th>
                  <th className="text-right p-2">Win Rate</th>
                  <th className="text-right p-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tagPerf).map(([tag, data]) => (
                  <tr key={tag} className="border-b border-border last:border-0">
                    <td className="p-2">{tag}</td>
                    <td className="p-2 text-right font-mono">{data.total}</td>
                    <td className="p-2 text-right font-mono">{((data.wins / data.total) * 100).toFixed(0)}%</td>
                    <td className={`p-2 text-right font-mono ${data.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
