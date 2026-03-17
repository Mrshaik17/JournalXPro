import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AppSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 card-glow max-w-lg space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <p className="font-mono text-sm">{user?.email}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Name</label>
          <p className="text-sm">{profile?.full_name || "Not set"}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Plan</label>
          <p className="text-sm capitalize">{profile?.plan || "free"}</p>
        </div>
        <div className="pt-4 border-t border-border">
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
