import { ExternalLink } from "lucide-react";

const firms = [
  { name: "FTMO", url: "https://ftmo.com", desc: "Challenge-based prop firm with up to $200K funding." },
  { name: "The Funded Trader", url: "https://thefundedtrader.com", desc: "Multiple challenge types with scaling plans." },
  { name: "MyForexFunds", url: "https://myforexfunds.com", desc: "Rapid scaling and evaluation programs." },
  { name: "True Forex Funds", url: "https://trueforexfunds.com", desc: "One and two-step evaluation processes." },
];

const PropFirms = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Prop Firms</h1>
      <p className="text-sm text-muted-foreground mt-1">Top funded trading programs</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {firms.map((f) => (
        <a
          key={f.name}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border bg-card p-5 card-glow hover:divine-border transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{f.name}</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground">{f.desc}</p>
        </a>
      ))}
    </div>
  </div>
);

export default PropFirms;
