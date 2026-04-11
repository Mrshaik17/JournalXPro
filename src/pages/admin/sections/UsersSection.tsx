import React, { useState, useMemo, useTransition } from "react";
import { Search, ChevronDown, Trash2, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersSection({
  profiles,
  updateUserPlan,
  deleteUserMutation,
  upsertSetting,
  siteSettings,
}: any) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, any>>({});

  const getSetting = (key: string): any => {
    const s = siteSettings?.find((s: any) => s.key === key);
    return s?.value || {};
  };

  const userOverrides = getSetting("user_overrides") || {};

  // Smart Search + Filter
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p: any) => {
      const matchesSearch = 
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referral_code_used?.includes(searchTerm);
      
      const matchesPlan = planFilter === "all" || p.plan === planFilter;
      
      return matchesSearch && matchesPlan;
    });
  }, [profiles, searchTerm, planFilter]);

  const saveOverride = (userId: string) => {
    startTransition(() => {
      const updated = { ...userOverrides, [userId]: overrides[userId] || {} };
      upsertSetting.mutate({ key: "user_overrides", value: updated });
      setEditingUser(null);
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPlanFilter("all");
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              User Management ({filteredProfiles.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage user plans, limits, and permissions
            </p>
          </div>
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-10 w-32 px-3">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="pro_plus">Pro+</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchTerm || planFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="w-1/5 font-semibold text-foreground tracking-tight">
                  Email
                </TableHead>
                <TableHead className="w-1/6 font-semibold text-foreground tracking-tight">
                  Name
                </TableHead>
                <TableHead className="w-1/8 font-semibold text-foreground tracking-tight">
                  Plan
                </TableHead>
                <TableHead className="w-1/6 font-semibold text-foreground tracking-tight">
                  Referral
                </TableHead>
                <TableHead className="w-1/6 font-semibold text-foreground tracking-tight">
                  Joined
                </TableHead>
                <TableHead className="w-1/8 text-center font-semibold text-foreground tracking-tight">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {searchTerm || planFilter !== "all" 
                      ? "No users match your filters"
                      : "No users found"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((p: any) => (
                  <React.Fragment key={p.id}>
                    <TableRow className="group hover:bg-muted/30 transition-colors h-12">
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {p.email}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={p.plan === "free" ? "secondary" : "default"}
                          className="text-xs px-2.5 py-0.5 font-semibold"
                        >
                          {p.plan.replace('_', '+').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                          {p.referral_code_used || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Select
                            onValueChange={(v) =>
                              updateUserPlan.mutate({ userId: p.id, plan: v })
                            }
                          >
                            <SelectTrigger className="h-8 w-24 text-xs border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="w-24">
                              <SelectItem value="free" className="text-xs">Free</SelectItem>
                              <SelectItem value="pro" className="text-xs">Pro</SelectItem>
                              <SelectItem value="pro_plus" className="text-xs">Pro+</SelectItem>
                              <SelectItem value="elite" className="text-xs">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            onClick={() => setEditingUser(editingUser === p.id ? null : p.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete ${p.email}?`)) {
                                deleteUserMutation.mutate(p.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Inline Edit Row */}
                    <AnimatePresence>
                      {editingUser === p.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-muted/20"
                        >
                          <TableCell colSpan={6} className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 items-end">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  Max Trades
                                </label>
                                <Input
                                  value={overrides[p.id]?.max_trades || ""}
                                  onChange={(e) => setOverrides(o => ({
                                    ...o,
                                    [p.id]: { ...o[p.id], max_trades: e.target.value }
                                  }))}
                                  className="h-9 text-sm"
                                  placeholder="Unlimited"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  Max Accounts
                                </label>
                                <Input
                                  value={overrides[p.id]?.max_accounts || ""}
                                  onChange={(e) => setOverrides(o => ({
                                    ...o,
                                    [p.id]: { ...o[p.id], max_accounts: e.target.value }
                                  }))}
                                  className="h-9 text-sm"
                                  placeholder="Unlimited"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                  AI Trading
                                </label>
                                <input
                                  type="checkbox"
                                  checked={overrides[p.id]?.ai_enabled || false}
                                  onChange={(e) => setOverrides(o => ({
                                    ...o,
                                    [p.id]: { ...o[p.id], ai_enabled: e.target.checked }
                                  }))}
                                  className="w-5 h-5 rounded border-2 border-border bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                  MT5 Access
                                </label>
                                <input
                                  type="checkbox"
                                  checked={overrides[p.id]?.mt5_enabled || false}
                                  onChange={(e) => setOverrides(o => ({
                                    ...o,
                                    [p.id]: { ...o[p.id], mt5_enabled: e.target.checked }
                                  }))}
                                  className="w-5 h-5 rounded border-2 border-border bg-background focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              
                              <div className="col-span-2 flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-4"
                                  onClick={() => setEditingUser(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-9 px-4"
                                  onClick={() => saveOverride(p.id)}
                                  disabled={isPending}
                                >
                                  {isPending ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredProfiles.length > 0 && (
          <div className="mt-4 pt-4 text-center text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profiles.length} users
          </div>
        )}
      </CardContent>
    </Card>
  );
}