import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { LanguageProvider } from "./components/language-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Tenders from "@/pages/tenders";
import CreateTender from "@/pages/create-tender";
import BidEvaluation from "@/pages/bid-evaluation";
import Reports from "@/pages/reports";
import Clarifications from "@/pages/clarifications";
import UserManagement from "@/pages/user-management";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/tenders" component={Tenders} />
      <ProtectedRoute path="/create-tender" component={CreateTender} />
      <ProtectedRoute path="/tenders/:tenderId/evaluate" component={BidEvaluation} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/clarifications" component={Clarifications} />
      <ProtectedRoute path="/users" component={UserManagement} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <Toaster />
            <Router />
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
