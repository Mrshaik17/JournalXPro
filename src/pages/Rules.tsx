import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Rules = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="container max-w-3xl px-6 py-16">
      <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mb-8 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-8">Trading Rules & Guidelines</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>These are the principles that Trader's Divine encourages every trader to follow:</p>
        <h2 className="text-foreground text-lg font-semibold">1. Always Follow Your Plan</h2>
        <p>Before entering a trade, have a clear plan. Your Divine Score reflects how well you stick to it.</p>
        <h2 className="text-foreground text-lg font-semibold">2. Risk Management First</h2>
        <p>Never risk more than 1-2% of your account per trade. Use the built-in risk calculator.</p>
        <h2 className="text-foreground text-lg font-semibold">3. Journal Every Trade</h2>
        <p>Winners and losers — log them all. Patterns emerge from consistency, not cherry-picking.</p>
        <h2 className="text-foreground text-lg font-semibold">4. Review Weekly</h2>
        <p>Use analytics to review your performance weekly. Identify what's working and what isn't.</p>
        <h2 className="text-foreground text-lg font-semibold">5. Discipline Over Profit</h2>
        <p>A disciplined trader who follows the plan is more valuable than a lucky trader. Focus on process, not outcome.</p>
        <h2 className="text-foreground text-lg font-semibold">6. No Revenge Trading</h2>
        <p>After a loss, step away. Don't chase the market. Your journal will help you spot this pattern.</p>
      </div>
    </div>
  </div>
);

export default Rules;
