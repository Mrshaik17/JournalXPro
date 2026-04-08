import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ChatWidget } from "@/components/ChatWidget";
import { ThemeProvider } from "@/components/ThemeProvider";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Rules from "./pages/Rules";

// App Pages
import { AppLayout } from "./components/app/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Journal from "./pages/app/Journal";
import Accounts from "./pages/app/Accounts";
import Analytics from "./pages/app/Analytics";
import Tools from "./pages/app/Tools";
import News from "./pages/app/News";
import Calendar from "./pages/app/Calendar";
import PropFirms from "./pages/app/PropFirms";
import AppSettings from "./pages/app/AppSettings";
import Upgrade from "./pages/app/Upgrade";
import Payouts from "./pages/app/Payouts";
import Announcements from "./pages/app/Announcements";

// Shared (PUBLIC)
import SharedAccount from "./pages/app/SharedAccount";
import SharedPayouts from "./pages/app/SharedPayouts";

// Admin
import Admin from "./pages/admin/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* 🌐 PUBLIC ROUTES */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/rules" element={<Rules />} />

              {/* 🔥 SHARED ROUTES (IMPORTANT - OUTSIDE /app) */}
              <Route path="/shared/account/:token" element={<SharedAccount />} />
              <Route path="/shared/payout/:token" element={<SharedPayouts />} />
              <Route path="/shared/payouts/:token" element={<SharedPayouts />} />

              {/* 🔐 APP ROUTES */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="journal" element={<Journal />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="tools" element={<Tools />} />
                <Route path="news" element={<News />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="prop-firms" element={<PropFirms />} />
                <Route path="upgrade" element={<Upgrade />} />
                <Route path="payouts" element={<Payouts />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="settings" element={<AppSettings />} />
              </Route>

              {/* 🛠 ADMIN */}
              <Route path="/admin1709" element={<Admin />} />

              {/* ❌ FALLBACK */}
              <Route path="*" element={<NotFound />} />

            </Routes>

            <ChatWidget />
          </BrowserRouter>

        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;