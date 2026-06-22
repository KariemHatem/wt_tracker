import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import SessionsPage from "@/pages/sessions";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminDashboardPage from "@/pages/admin/index";
import AdminUsersPage from "@/pages/admin/users";
import AdminReportsPage from "@/pages/admin/reports";
import AdminActivityPage from "@/pages/admin/activity";
import AdminAnalyticsPage from "@/pages/admin/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (adminOnly && !user.isAdmin) return <Redirect to="/dashboard" />;

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        {() => user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute><DashboardPage /></ProtectedRoute>}
      </Route>
      <Route path="/sessions">
        {() => <ProtectedRoute><SessionsPage /></ProtectedRoute>}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute><ReportsPage /></ProtectedRoute>}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute><SettingsPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin/reports">
        {() => <ProtectedRoute adminOnly><AdminReportsPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin/activity">
        {() => <ProtectedRoute adminOnly><AdminActivityPage /></ProtectedRoute>}
      </Route>
      <Route path="/admin/analytics">
        {() => <ProtectedRoute adminOnly><AdminAnalyticsPage /></ProtectedRoute>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
