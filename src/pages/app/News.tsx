import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Newspaper,
  ExternalLink,
  Info,
  Search,
  Filter,
  RefreshCw,
  Clock3,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  asset_name: string | null;
  source: string | null;
  created_at: string;
  published: boolean;
  url?: string | null;
};

const News = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all");

  const {
    data: news = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("News fetch error:", error);
        return [];
      }

      return (data ?? []) as NewsItem[];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const categories = useMemo(() => {
    return Array.from(
      new Set(news.map((n) => n.category).filter(Boolean))
    ) as string[];
  }, [news]);

  const assets = useMemo(() => {
    return Array.from(
      new Set(news.map((n) => n.asset_name).filter(Boolean))
    ) as string[];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      const q = search.toLowerCase();

      const matchesSearch =
        !search ||
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.source?.toLowerCase().includes(q) ||
        n.asset_name?.toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || n.category === categoryFilter;

      const matchesAsset =
        assetFilter === "all" || n.asset_name === assetFilter;

      return matchesSearch && matchesCategory && matchesAsset;
    });
  }, [news, search, categoryFilter, assetFilter]);

  const featured = filteredNews[0];
  const restNews = filteredNews.slice(1);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setAssetFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">News</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest market news, platform updates, and trading context
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Published</div>
              <div className="text-sm font-semibold mt-1">{news.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Filtered</div>
              <div className="text-sm font-semibold mt-1">{filteredNews.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Categories</div>
              <div className="text-sm font-semibold mt-1">{categories.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Status</div>
              <div className="text-sm font-semibold mt-1">
                {isFetching ? "Syncing..." : "Synced"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
      >
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <span className="text-foreground">
            For macro events and economic releases, also check{" "}
          </span>
          <a
            href="https://www.forexfactory.com/calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
          >
            Forex Factory
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-foreground">
            {" "}for the latest economic calendar and high-impact event timing.
          </span>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, content, source, asset..."
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assets</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear
            </Button>

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
            <div className="h-4 w-28 rounded bg-muted mb-4" />
            <div className="h-8 w-3/4 rounded bg-muted mb-3" />
            <div className="h-4 w-full rounded bg-muted mb-2" />
            <div className="h-4 w-5/6 rounded bg-muted mb-2" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>

          <div className="grid gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5 animate-pulse"
              >
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-20 rounded-full bg-muted" />
                </div>
                <div className="h-5 w-3/4 rounded bg-muted mb-3" />
                <div className="h-4 w-full rounded bg-muted mb-2" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No news published yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            News from the admin panel will appear here automatically once it is published.
            Until then, you can check Forex Factory for live macro events and market timing.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Check again
            </Button>
            <a
              href="https://www.forexfactory.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                Open Forex Factory
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No matching news found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try changing your search or filters to see more updates.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Featured
                </span>

                {featured.category && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {featured.category}
                  </span>
                )}

                {featured.asset_name && (
                  <span className="text-[10px] font-mono bg-background border border-border px-2.5 py-1 rounded-full">
                    {featured.asset_name}
                  </span>
                )}

                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {formatDistanceToNow(new Date(featured.created_at), { addSuffix: true })}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
                {featured.title}
              </h2>

              <p className="text-sm text-muted-foreground leading-7 max-w-3xl">
                {featured.content}
              </p>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground font-mono">
                  {featured.source ? `Source: ${featured.source}` : "Internal update"}
                </div>

                {featured.url ? (
                  <a
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                  >
                    Open source
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            {restNews.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {n.category && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {n.category}
                    </span>
                  )}

                  {n.asset_name && (
                    <span className="text-[10px] font-mono bg-background border border-border px-2 py-0.5 rounded-full">
                      {n.asset_name}
                    </span>
                  )}

                  <span className="text-[11px] text-muted-foreground font-mono ml-auto flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>

                <h3 className="font-semibold mb-2 text-base sm:text-lg">{n.title}</h3>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {n.content}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/70">
                  <p className="text-xs text-muted-foreground font-mono">
                    {n.source ? `Source: ${n.source}` : "Internal update"}
                  </p>

                  {n.url ? (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                    >
                      Read more
                      <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default News;