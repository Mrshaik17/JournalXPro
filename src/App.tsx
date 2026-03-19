import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Journal from "./pages/app/Journal";
import Accounts from "./pages/app/Accounts";
import Analytics from "./pages/app/Analytics";
import Tools from "./pages/app/Tools";
import PropFirms from "./pages/app/PropFirms";
import AppSettings from "./pages/app/AppSettings";
import Upgrade from "./pages/app/Upgrade";
import Admin from "./pages/admin/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="journal" element={<Journal />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="tools" element={<Tools />} />
              <Route path="prop-firms" element={<PropFirms />} />
              <Route path="upgrade" element={<Upgrade />} />
              <Route path="settings" element={<AppSettings />} />
            </Route>
            <Route path="/admin1709" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
