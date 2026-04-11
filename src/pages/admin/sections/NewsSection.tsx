import { Trash2, Newspaper, Eye, Copy } from "lucide-react";
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
  deleteNews,
}: any) {
  return (
    <div className="space-y-6">
      {/* Publish Form - Borderless */}
      <div className="rounded-2xl bg-card/70 shadow-sm hover:shadow-md transition-all p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Publish News</h3>
            <p className="text-sm text-muted-foreground">Create new market updates</p>
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
            className="min-h-[160px] rounded-xl bg-background/70 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50 resize-vertical"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Button 
            onClick={() => createNews.mutate()}
            className="h-12 rounded-xl px-8 text-sm font-medium w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            Publish News
          </Button>
        </div>
      </div>

      {/* News List - COMPLETELY BORDERLESS */}
      <div className="space-y-3">
        {newsList.map((item: any) => (
          <div
            key={item.id}
            className="group rounded-2xl bg-card/70 hover:bg-card/80 shadow-sm hover:shadow-md transition-all overflow-hidden hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                  <h4 className="font-semibold text-base line-clamp-1 flex-1 min-w-0 pr-2">
                    {item.title}
                  </h4>
                  <span className="px-3 py-1.5 text-[11px] font-medium rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                    {item.category?.toUpperCase() || "NEWS"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0 hover:bg-primary/10"
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                    onClick={() => deleteNews.mutate(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-muted-foreground mb-5 line-clamp-3">
                {item.content}
              </div>

              <div className="flex flex-wrap gap-6 text-xs text-muted-foreground/80">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                  Source: <span className="font-medium">{item.source || "—"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                  Asset: <span className="font-medium">{item.asset_name || "—"}</span>
                </span>
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                  {new Date(item.created_at).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        ))}

        {newsList.length === 0 && (
          <div className="rounded-2xl bg-card/50 shadow-sm p-12 text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/30 flex items-center justify-center group-hover:bg-muted/50 transition-all">
              <Newspaper className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No news published yet
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-6 max-w-md mx-auto">
              Publish your first market update to get started. Your news will appear here.
            </p>
            <Button 
              className="h-11 rounded-xl px-8 bg-primary/90 hover:bg-primary shadow-lg hover:shadow-xl"
              size="lg"
              onClick={() => {
                // Focus title input or scroll to form
                const titleInput = document.querySelector('input[placeholder*="title"]');
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