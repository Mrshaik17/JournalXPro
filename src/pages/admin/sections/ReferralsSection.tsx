import { useMemo, useState } from "react";
import { Trash2, Plus, Search, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReferralsSection({
  referrals,
  refName,
  setRefName,
  refCode,
  setRefCode,
  refCommission,
  setRefCommission,
  createReferral,
  deleteReferral,
}: any) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredReferrals = useMemo(() => {
    const q = search.trim().toLowerCase();

    return referrals.filter((ref: any) => {
      if (!q) return true;

      return (
        (ref.name || "").toLowerCase().includes(q) ||
        (ref.code || "").toLowerCase().includes(q)
      );
    });
  }, [referrals, search]);

  const totalReferrals = referrals.length;
  const avgCommission =
    referrals.length > 0
      ? referrals.reduce(
          (sum: number, ref: any) => sum + Number(ref.commission_percent || 0),
          0
        ) / referrals.length
      : 0;

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Referrals
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {totalReferrals}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Average Commission
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {avgCommission.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Visible Results
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {filteredReferrals.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Add Referral</h3>
            <p className="text-xs text-muted-foreground">
              Create a clean referral code with commission settings.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.8fr_auto]">
          <Input
            placeholder="Referral name"
            value={refName}
            onChange={(e) => setRefName(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />

          <Input
            placeholder="Referral code"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            className="h-11 rounded-xl border-0 bg-background/70 font-mono uppercase shadow-none focus-visible:ring-1"
          />

          <div className="relative">
            <Input
              placeholder="Commission"
              value={refCommission}
              onChange={(e) => setRefCommission(e.target.value)}
              className="h-11 rounded-xl border-0 bg-background/70 pr-8 shadow-none focus-visible:ring-1"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>

          <Button
            onClick={() => createReferral.mutate()}
            className="h-11 rounded-xl px-5"
          >
            Create Referral
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 shadow-sm">
        <div className="p-4 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Referral Codes</h3>
              <p className="text-xs text-muted-foreground">
                Search, copy, and manage your referral records.
              </p>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Commission</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReferrals.map((ref: any) => (
                <tr
                  key={ref.id}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{ref.name}</div>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copyCode(ref.id, ref.code)}
                      className="inline-flex items-center gap-2 rounded-xl bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground/90 transition-colors hover:bg-background"
                    >
                      <span>{ref.code}</span>
                      {copiedId === ref.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {ref.commission_percent || 0}%
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {new Date(ref.created_at).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteReferral.mutate(ref.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReferrals.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    {search
                      ? "No referrals match your search."
                      : "No referrals added yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredReferrals.length > 0 && (
          <div className="px-4 py-3 text-center text-xs text-muted-foreground tabular-nums">
            Showing {filteredReferrals.length} of {referrals.length} referrals
          </div>
        )}
      </div>
    </div>
  );
}