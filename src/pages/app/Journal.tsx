const Journal = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Journal</h1>
        <p className="text-sm text-muted-foreground mt-1">Your trade log</p>
      </div>
    </div>
    <div className="rounded-lg border border-border bg-card p-8 card-glow text-center">
      <p className="text-muted-foreground text-sm">No trades found. The best trade is sometimes no trade.</p>
    </div>
  </div>
);

export default Journal;
