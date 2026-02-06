import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LenderLogin from "@/pages/lender/login";
import LenderDashboard from "@/pages/lender/dashboard";
import ApplicantDetail from "@/pages/lender/applicant-detail";

function Router() {
  return (
    <Switch>
      {/* Simulation / Admin Dashboard */}
      <Route path="/" component={Dashboard} />
      
      {/* Lender Partner Portal */}
      <Route path="/partner/login" component={LenderLogin} />
      <Route path="/partner" component={LenderDashboard} />
      <Route path="/partner/applicant/:id" component={ApplicantDetail} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
