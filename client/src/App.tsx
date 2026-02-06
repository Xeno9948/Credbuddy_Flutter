import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/lib/session";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LenderLogin from "@/pages/lender/login";
import LenderDashboard from "@/pages/lender/dashboard";
import ApplicantDetail from "@/pages/lender/applicant-detail";
import UserManual from "@/pages/user-manual";
import Pricing from "@/pages/pricing";
import Terms from "@/pages/terms";
import SharedReport from "@/pages/shared-report";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/manual" component={UserManual} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/terms" component={Terms} />
      <Route path="/share/:token" component={SharedReport} />
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
        <SessionProvider>
          <Toaster />
          <Router />
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
