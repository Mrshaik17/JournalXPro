import { useMemo, useState } from "react";
import {
  Trash2,
  Building2,
  Search,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  propFirmWebsiteUrl,
  setPropFirmWebsiteUrl,
  propFirmIsActive,
  setPropFirmIsActive,
  propFirmIsFeatured,
  setPropFirmIsFeatured,
  propFirmTags,
  setPropFirmTags,
  editingPropFirm,
  startEditPropFirm,
  cancelEditPropFirm,
  savePropFirm,
  deletePropFirm,
  togglePropFirmActive,
  togglePropFirmFeatured,
}: any) {
  const [search, setSearch] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const filteredFirms = useMemo(() => {
    const q = search.trim().toLowerCase();

    return propFirms.filter((firm: any) => {
      const tags = Array.isArray(firm.tags) ? firm.tags.join(" ").toLowerCase() : "";
      const matchesSearch =
        !q ||
        (firm.name || "").toLowerCase().includes(q) ||
        (firm.coupon_code || "").toLowerCase().includes(q) ||
        (firm.description || "").toLowerCase().includes(q) ||
        tags.includes(q);

      return matchesSearch;
    });
  }, [propFirms, search]);

  const stats = useMemo(() => {
    return {
      total: propFirms.length,
      active: propFirms.filter((f: any) => f.is_active).length,
      featured: propFirms.filter((f: any) => f.is_featured).length,
      withCoupons: propFirms.filter((f: any) => f.coupon_code).length,
      avgDiscount: propFirms.length
        ? (
            propFirms.reduce(
              (sum: number, f: any) => sum + (parseFloat(String(f.discount)) || 0),
              0
            ) / propFirms.length
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total Firms
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Active
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Featured
          </p>
          <p className="mt-2 text-xl font-semibold text-primary tabular-nums">
            {stats.featured}
          </p>
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

      <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {editingPropFirm ? "Edit Prop Firm" : "Add Prop Firm"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Add partner prop firms with affiliate links, discount codes, tags, and visibility
              controls.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
            placeholder="Website URL"
            value={propFirmWebsiteUrl}
            onChange={(e) => setPropFirmWebsiteUrl(e.target.value)}
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

          <Input
            placeholder="Tags (comma separated, e.g. best, pro, instant)"
            value={propFirmTags}
            onChange={(e) => setPropFirmTags(e.target.value)}
            className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
          />
        </div>

        <Textarea
          placeholder="Firm description (optional)"
          value={propFirmDescription}
          onChange={(e) => setPropFirmDescription(e.target.value)}
          className="mt-3 min-h-[120px] rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPropFirmIsActive(!propFirmIsActive)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
                propFirmIsActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {propFirmIsActive ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              {propFirmIsActive ? "Enabled" : "Disabled"}
            </button>

            <button
              type="button"
              onClick={() => setPropFirmIsFeatured(!propFirmIsFeatured)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
                propFirmIsFeatured
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {propFirmIsFeatured ? (
                <Star className="h-4 w-4" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
              {propFirmIsFeatured ? "Featured" : "Not featured"}
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {editingPropFirm && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditPropFirm}
                className="h-11 rounded-xl px-6"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}

            <Button onClick={() => savePropFirm.mutate()} className="h-11 rounded-xl px-6">
              {editingPropFirm ? "Update Prop Firm" : "Add Prop Firm"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 shadow-sm">
        <div className="p-4 pb-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Prop Firms</h3>
              <p className="text-xs text-muted-foreground">
                Manage partner prop trading firms, tags, and visibility for users.
              </p>
            </div>

            <div className="relative w-full xl:w-[400px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search firms, coupons, descriptions, or tags"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{firm.name}</h4>

                    {firm.discount && (
                      <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        {firm.discount}%
                      </span>
                    )}

                    {firm.is_featured && (
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Featured
                      </span>
                    )}

                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        firm.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {firm.is_active ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {firm.description || "No description provided."}
                  </p>

                  {Array.isArray(firm.tags) && firm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {firm.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {firm.coupon_code && (
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-muted-foreground">Coupon</span>
                        <div className="flex flex-1 items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-1.5 font-mono">
                          <span className="truncate">{firm.coupon_code}</span>
                          <button
                            onClick={() => copyCoupon(firm.coupon_code)}
                            className="-m-1.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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

                    {(firm.affiliate_link || firm.website_url) && (
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-muted-foreground">Link</span>
                        <button
                          onClick={() => openAffiliateLink(firm.affiliate_link || firm.website_url)}
                          className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open link
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="font-mono text-xs text-muted-foreground">
                    Added {new Date(firm.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() =>
                      togglePropFirmFeatured.mutate({
                        id: firm.id,
                        is_featured: !firm.is_featured,
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-amber-500/10 hover:text-amber-400"
                    title={firm.is_featured ? "Remove featured" : "Mark as featured"}
                  >
                    <Star className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      togglePropFirmActive.mutate({
                        id: firm.id,
                        is_active: !firm.is_active,
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-400"
                    title={firm.is_active ? "Disable firm" : "Enable firm"}
                  >
                    {firm.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => startEditPropFirm(firm)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    title="Edit prop firm"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => deletePropFirm.mutate(firm.id)}
                    className="group-hover:text-destructive flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-destructive/10"
                    title="Delete prop firm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredFirms.length === 0 && (
        <div className="rounded-2xl bg-card/70 p-12 text-center shadow-sm">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            {search ? "No prop firms match your search." : "No prop firms added yet."}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-xs text-muted-foreground">
            Add your first prop trading firm partner with affiliate links, tags, and discount codes
            to get started.
          </p>
          <Button variant="outline" className="rounded-xl">
            Add first prop firm
          </Button>
        </div>
      )}

      {filteredFirms.length > 0 && filteredFirms.length !== propFirms.length && (
        <div className="text-center text-xs tabular-nums text-muted-foreground">
          Showing {filteredFirms.length} of {propFirms.length} prop firms
        </div>
      )}
    </div>
  );
}