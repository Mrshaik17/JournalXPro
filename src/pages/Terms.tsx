import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="container max-w-3xl px-6 py-16">
      <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mb-8 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-foreground text-lg font-semibold">1. Acceptance</h2>
        <p>By using JournalXPro, you agree to these terms. The service is a trading journal tool — not financial advice.</p>
        <h2 className="text-foreground text-lg font-semibold">2. Account Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account. All data you enter is your responsibility.</p>
        <h2 className="text-foreground text-lg font-semibold">3. Subscription & Payments</h2>
        <p>Paid plans are billed monthly. Payments are verified manually. Refunds are at the discretion of the admin team.</p>
        <h2 className="text-foreground text-lg font-semibold">4. Prohibited Use</h2>
        <p>Do not use the service for illegal activities, spam, or to harm other users.</p>
        <h2 className="text-foreground text-lg font-semibold">5. Disclaimer</h2>
        <p>Trader's Divine is not a financial advisor. Trading involves risk. We are not responsible for any trading losses.</p>
      </div>
    </div>
  </div>
);

export default Terms;
