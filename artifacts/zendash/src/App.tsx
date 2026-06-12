import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Servers from "@/pages/servers";
import ServerDetail from "@/pages/server-detail";
import Nodes from "@/pages/nodes";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-mono text-sm">
        LOADING_SESSION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/servers" component={() => <ProtectedRoute component={Servers} />} />
      <Route path="/servers/:id" component={() => <ProtectedRoute component={ServerDetail} />} />
      <Route path="/nodes" component={() => <ProtectedRoute component={Nodes} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
