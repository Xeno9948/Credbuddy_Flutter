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
import WebLanding from "@/pages/web/landing";
import WebLogin from "@/pages/web/login";
import WebCallback from "@/pages/web/callback";
import WebHome from "@/pages/web/home";
import AddEntry from "@/pages/web/add-entry";
import Entries from "@/pages/web/entries";
import WebHistory from "@/pages/web/history";
import Report from "@/pages/web/report";
import { WebAppLayout } from "@/pages/web/app-layout";

function WebApp({ component: Component }: { component: React.ComponentType }) {
  return (
    <WebAppLayout>
      <Component />
    </WebAppLayout>
  );
}

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
      <Route path="/web">{() => <WebLanding />}</Route>
      <Route path="/web/login">{() => <WebLogin />}</Route>
      <Route path="/web/auth/callback">{() => <WebCallback />}</Route>
      <Route path="/web/app">{() => <WebApp component={WebHome} />}</Route>
      <Route path="/web/app/add">{() => <WebApp component={AddEntry} />}</Route>
      <Route path="/web/app/entries">{() => <WebApp component={Entries} />}</Route>
      <Route path="/web/app/history">{() => <WebApp component={WebHistory} />}</Route>
      <Route path="/web/app/report">{() => <WebApp component={Report} />}</Route>
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
