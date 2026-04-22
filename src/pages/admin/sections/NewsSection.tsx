import { useMemo, useState } from "react";
import {
  Trash2,
  Newspaper,
  Copy,
  Pencil,
  X,
  Search,
  Filter,
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

type NewsItem = {
  id: string;
  title: string;
  content: string;
  source?: string | null;
  asset_name?: string | null;
  category?: string | null;
  created_at: string;
};

type NewsSectionProps = {
  newsList: NewsItem[];
  newsTitle: string;
  setNewsTitle: React.Dispatch<React.SetStateAction<string>>;
  newsContent: string;
  setNewsContent: React.Dispatch<React.SetStateAction<string>>;
  newsSource: string;
  setNewsSource: React.Dispatch<React.SetStateAction<string>>;
  newsCategory: string;
  setNewsCategory: React.Dispatch<React.SetStateAction<string>>;
  newsAsset: string;
  setNewsAsset: React.Dispatch<React.SetStateAction<string>>;
  createNews: { mutate: () => void };
  updateNews?: { mutate: (payload: any) => void };
  deleteNews: { mutate: (id: string) => void };
  editingNews?: NewsItem | null;
  startEditNews?: (item: NewsItem) => void;
  cancelEditNews?: () => void;
};

export default function NewsSection({
  newsList,
  newsTitle,
  setNewsTitle,
  newsContent,
  setNewsContent,
  newsSource,
  setNewsSource,
  newsCategory,
  setNewsCategory,
  newsAsset,
  setNewsAsset,
  createNews,
  updateNews,
  deleteNews,
  editingNews,
  startEditNews,
  cancelEditNews,
}: NewsSectionProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredNews = useMemo(() => {
    const q = search.trim().toLowerCase();

    return newsList.filter((item) => {
      const matchesSearch =
        !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.content || "").toLowerCase().includes(q) ||
        (item.source || "").toLowerCase().includes(q) ||
        (item.asset_name || "").toLowerCase().includes(q);

      const matchesCategory =
        filterCategory === "all" ||
        (item.category || "forex").toLowerCase() === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [newsList, search, filterCategory]);

  const stats = useMemo(() => {
    return {
      total: newsList.length,
      forex: newsList.filter((n) => n.category === "forex").length,
      crypto: newsList.filter((n) => n.category === "crypto").length,
      stocks: newsList.filter((n) => n.category === "stocks").length,
      economy: newsList.filter((n) => n.category === "economy").length,
    };
  }, [newsList]);

  const handleSubmit = () => {
    if (editingNews?.id && updateNews) {
      updateNews.mutate({
        id: editingNews.id,
        title: newsTitle,
        content: newsContent,
        source: newsSource || null,
        category: newsCategory,
        asset_name: newsAsset || null,
      });
      return;
    }

    createNews.mutate();
  };

  const handleCopy = async (item: NewsItem) => {
    const text = `${item.title}\n\n${item.content}\n\nSource: ${item.source || "—"}\nAsset: ${
      item.asset_name || "—"
    }`;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Total News
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Forex
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.forex}</p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Crypto
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.crypto}</p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Stocks
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.stocks}</p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Economy
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.economy}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {editingNews ? "Edit News" : "Publish News"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Create market updates that reflect instantly on the user side.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="News title"
            value={newsTitle}
            onChange={(e) => setNewsTitle(e.target.value)}
            className="h-12 rounded-xl bg-background/70 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50"
          />

          <Textarea
            placeholder="News content"
            value={newsContent}
            onChange={(e) => setNewsContent(e.target.value)}
            className="min-h-[160px] resize-y rounded-xl bg-background/70 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Source
              </label>
              <Input
                placeholder="e.g. Bloomberg, Reuters"
                value={newsSource}
                onChange={(e) => setNewsSource(e.target.value)}
                className="h-11 rounded-xl bg-background/70 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Asset / Pair
              </label>
              <Input
                placeholder="e.g. EUR/USD, BTC/USD"
                value={newsAsset}
                onChange={(e) => setNewsAsset(e.target.value)}
                className="h-11 rounded-xl bg-background/70 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <Select value={newsCategory} onValueChange={setNewsCategory}>
                <SelectTrigger className="h-11 rounded-xl bg-background/70 shadow-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card/90 border-border/20">
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {editingNews && cancelEditNews && (
              <Button
                variant="outline"
                onClick={cancelEditNews}
                className="h-12 rounded-xl px-6"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}

            <Button
              onClick={handleSubmit}
              className="h-12 rounded-xl px-8 text-sm font-medium"
              size="lg"
            >
              {editingNews ? "Update News" : "Publish News"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-sm font-semibold">News Feed</h3>
            <p className="text-xs text-muted-foreground">
              Review, copy, edit, and delete market updates.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, content, source, asset"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-background/70 shadow-none sm:w-44">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className={`group overflow-hidden rounded-2xl bg-card/70 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-md ${
              editingNews?.id === item.id ? "ring-1 ring-primary/40" : ""
            }`}
          >
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60" />
                  <h4 className="min-w-0 flex-1 truncate pr-2 text-base font-semibold">
                    {item.title}
                  </h4>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
                    {(item.category || "news").toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                  {startEditNews && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-lg p-0 hover:bg-primary/10"
                      title="Edit"
                      onClick={() => startEditNews(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0 hover:bg-primary/10"
                    title="Copy content"
                    onClick={() => handleCopy(item)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteNews.mutate(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {item.content}
              </div>

              <div className="flex flex-wrap gap-6 text-xs text-muted-foreground/80">
                <span className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                  Source: <span className="font-medium">{item.source || "—"}</span>
                </span>

                <span className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                  Asset: <span className="font-medium">{item.asset_name || "—"}</span>
                </span>

                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                  {new Date(item.created_at).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredNews.length === 0 && (
          <div className="rounded-2xl bg-card/50 p-12 text-center shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/30">
              <Newspaper className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-muted-foreground">
              No news found
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground/70">
              {search || filterCategory !== "all"
                ? "Try changing your search or category filter."
                : "Publish your first market update to get started. Your news will appear here."}
            </p>

            <Button
              className="h-11 rounded-xl px-8"
              size="lg"
              onClick={() => {
                const titleInput = document.querySelector('input[placeholder*="title"]') as HTMLInputElement | null;
                titleInput?.focus();
              }}
            >
              Publish First News
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}