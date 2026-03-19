import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="container max-w-3xl px-6 py-16">
      <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mb-8 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-foreground text-lg font-semibold">1. Information We Collect</h2>
        <p>We collect information you provide when creating an account (email, name) and your trading journal data (trades, accounts, analytics). We do not sell your data.</p>
        <h2 className="text-foreground text-lg font-semibold">2. How We Use Your Data</h2>
        <p>Your data is used solely to provide the journaling service, analytics, and account management features. Payment information is stored securely for subscription verification.</p>
        <h2 className="text-foreground text-lg font-semibold">3. Data Security</h2>
        <p>All data is protected with row-level security. Only you can access your trading data. We use industry-standard encryption for data in transit and at rest.</p>
        <h2 className="text-foreground text-lg font-semibold">4. Data Deletion</h2>
        <p>You can delete your trading accounts and data at any time from Settings. Once deleted, data cannot be recovered.</p>
        <h2 className="text-foreground text-lg font-semibold">5. Contact</h2>
        <p>For privacy concerns, reach out via our social media channels listed on the homepage.</p>
      </div>
    </div>
  </div>
);

export default Privacy;
