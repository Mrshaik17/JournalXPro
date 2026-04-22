import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  source_url?: string | null;
  url?: string | null;
  created_at: string;
};

const News = () => {
  const queryClient = useQueryClient();

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
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("News fetch error:", error);
        throw error;
      }

      return (data ?? []) as NewsItem[];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel("user-news-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["news"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "news" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["news"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "news" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["news"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
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
                <h1 className="mt-1 text-2xl font-bold tracking-tight">News</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest market news, platform updates, and trading context
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Published</div>
              <div className="mt-1 text-sm font-semibold">{news.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Filtered</div>
              <div className="mt-1 text-sm font-semibold">{filteredNews.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Categories</div>
              <div className="mt-1 text-sm font-semibold">{categories.length}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
              <div className="text-[11px] text-muted-foreground">Status</div>
              <div className="mt-1 text-sm font-semibold">
                {isFetching ? "Syncing..." : "Synced"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm leading-relaxed">
          <span className="text-foreground">
            For macro events and economic releases, also check{" "}
          </span>
          <a
            href="https://www.forexfactory.com/calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary/80"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, content, source, asset..."
              className="bg-background pl-10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full bg-background sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
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
              <SelectTrigger className="w-full bg-background sm:w-[180px]">
                <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
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
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 h-4 w-28 rounded bg-muted" />
            <div className="mb-3 h-8 w-3/4 rounded bg-muted" />
            <div className="mb-2 h-4 w-full rounded bg-muted" />
            <div className="mb-2 h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>

          <div className="grid gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-20 rounded-full bg-muted" />
                </div>
                <div className="mb-3 h-5 w-3/4 rounded bg-muted" />
                <div className="mb-2 h-4 w-full rounded bg-muted" />
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
          <h3 className="mb-2 text-lg font-semibold">No news published yet</h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            News from the admin panel will appear here automatically once it is published.
            Until then, you can check Forex Factory for live macro events and market timing.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Check again
            </Button>
            <a
              href="https://www.forexfactory.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">
                Open Forex Factory
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No matching news found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
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
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Featured
                </span>

                {featured.category && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-primary">
                    {featured.category}
                  </span>
                )}

                {featured.asset_name && (
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-mono">
                    {featured.asset_name}
                  </span>
                )}

                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {formatDistanceToNow(new Date(featured.created_at), { addSuffix: true })}
                </span>
              </div>

              <h2 className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl">
                {featured.title}
              </h2>

              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {featured.content}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="text-xs font-mono text-muted-foreground">
                  {featured.source ? `Source: ${featured.source}` : "Internal update"}
                </div>

                {(featured.source_url || featured.url) ? (
                  <a
                    href={featured.source_url || featured.url || "#"}
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
                className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/20"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {n.category && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
                      {n.category}
                    </span>
                  )}

                  {n.asset_name && (
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-mono">
                      {n.asset_name}
                    </span>
                  )}

                  <span className="ml-auto flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>

                <h3 className="mb-2 text-base font-semibold sm:text-lg">{n.title}</h3>

                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {n.content}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                  <p className="text-xs font-mono text-muted-foreground">
                    {n.source ? `Source: ${n.source}` : "Internal update"}
                  </p>

                  {(n.source_url || n.url) ? (
                    <a
                      href={n.source_url || n.url || "#"}
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