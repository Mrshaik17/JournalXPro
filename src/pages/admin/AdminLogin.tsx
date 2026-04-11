import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  loginError: string;
  handleAdminLogin: () => void;
};

export default function AdminLogin({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  handleAdminLogin,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-6 rounded-lg border border-border bg-card space-y-4"
      >
        <div className="text-center">
          <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-bold">Admin Login</h1>
          <p className="text-xs text-muted-foreground">JournalXPro Admin Panel</p>
        </div>

        <div className="space-y-3">
          <Input
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Email"
            className="bg-background border-border"
            type="email"
          />

          <Input
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Password"
            className="bg-background border-border"
            type="password"
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
          />

          {loginError && (
            <p className="text-xs text-destructive">{loginError}</p>
          )}

          <Button onClick={handleAdminLogin} className="w-full">
            Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
}