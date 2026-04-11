import { useMemo, useState } from "react";
import {
  Trash2,
  Building2,
  Search,
  Link2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PropFirmsSection({
  propFirms,
  propFirmName,
  setPropFirmName,
  propFirmDescription,
  setPropFirmDescription,
  propFirmLink,
  setPropFirmLink,
  propFirmCoupon,
  setPropFirmCoupon,
  propFirmDiscount,
  setPropFirmDiscount,
  createPropFirm,
  deletePropFirm,
}: any) {
  const [search, setSearch] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const filteredFirms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return propFirms.filter((firm: any) => {
      const matchesSearch =
        !q ||
        firm.name.toLowerCase().includes(q) ||
        (firm.coupon_code || "").toLowerCase().includes(q) ||
        (firm.description || "").toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [propFirms, search]);

  const stats = useMemo(() => {
    return {
      total: propFirms.length,
      withCoupons: propFirms.filter((f: any) => f.coupon_code).length,
      avgDiscount: propFirms.length
        ? (
            propFirms.reduce((sum: number, f: any) => sum + (parseFloat(f.discount) || 0), 0) /
            propFirms.length
          ).toFixed(1)
        : 0,
    };
  }, [propFirms]);

  const copyCoupon = async (coupon: string) => {
    await navigator.clipboard.writeText(coupon);
    setCopiedCoupon(coupon);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const openAffiliateLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Firms
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Active Coupons
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.withCoupons}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Avg Discount
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.avgDiscount}%
          </p>
        </div>
      </div>

      {/* Add Form */}
      <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Add Prop Firm</h3>
            <p className="text-xs text-muted-foreground">
              Add partner prop firms with affiliate links and discount codes.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            placeholder="Firm name"
            value={propFirmName}
            onChange={(e) => setPropFirmName(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />
          <Input
            placeholder="Affiliate link"
            value={propFirmLink}
            onChange={(e) => setPropFirmLink(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />
          <Input
            placeholder="Coupon code"
            value={propFirmCoupon}
            onChange={(e) => setPropFirmCoupon(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />
          <Input
            placeholder="Discount %"
            type="number"
            value={propFirmDiscount}
            onChange={(e) => setPropFirmDiscount(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />
        </div>

        <Textarea
          placeholder="Firm description (optional)"
          value={propFirmDescription}
          onChange={(e) => setPropFirmDescription(e.target.value)}
          className="mt-3 min-h-[120px] rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
        />

        <Button
          onClick={() => createPropFirm.mutate()}
          className="mt-3 h-11 rounded-xl px-6"
        >
          Add Prop Firm
        </Button>
      </div>

      {/* Search & List */}
      <div className="rounded-2xl bg-card/70 shadow-sm">
        <div className="p-4 pb-3">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Prop Firms</h3>
              <p className="text-xs text-muted-foreground">
                Manage partner prop trading firms and their discount codes.
              </p>
            </div>

            <div className="relative w-full xl:w-[400px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search firms, coupons, or descriptions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-6">
          {filteredFirms.map((firm: any) => (
            <div
              key={firm.id}
              className="group rounded-2xl bg-background/40 p-4 transition-all hover:bg-background/60 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {firm.name}
                    </h4>
                    {firm.discount && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        {firm.discount}%
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground line-clamp-2">
                    {firm.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {firm.coupon_code && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Coupon</span>
                        <div className="flex items-center gap-2 font-mono bg-secondary/50 rounded-lg px-2.5 py-1.5 flex-1">
                          <span className="truncate">{firm.coupon_code}</span>
                          <button
                            onClick={() => copyCoupon(firm.coupon_code)}
                            className="p-1.5 -m-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Copy coupon"
                          >
                            {copiedCoupon === firm.coupon_code ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {firm.affiliate_link && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Link</span>
                        <button
                          onClick={() => openAffiliateLink(firm.affiliate_link)}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium truncate max-w-[200px]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open affiliate link
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground font-mono">
                    Added {new Date(firm.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <button
                  onClick={() => deletePropFirm.mutate(firm.id)}
                  className="group-hover:text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredFirms.length === 0 && (
        <div className="rounded-2xl bg-card/70 p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
            {search ? "No prop firms match your search." : "No prop firms added yet."}
          </h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first prop trading firm partner with affiliate links and discount codes to get started.
          </p>
          <Button variant="outline" className="rounded-xl">
            Add first prop firm
          </Button>
        </div>
      )}

      {filteredFirms.length > 0 && filteredFirms.length !== propFirms.length && (
        <div className="text-center text-xs text-muted-foreground tabular-nums">
          Showing {filteredFirms.length} of {propFirms.length} prop firms
        </div>
      )}
    </div>
  );
}