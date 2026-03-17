import { Zap } from "lucide-react";

export const FooterSection = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Trader's Divine</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Trader's Divine. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
