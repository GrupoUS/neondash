import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { AuthSync } from "./components/auth/AuthSync";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
// Eagerly loaded (landing + lightweight pages)
import LandingPage from "./pages/LandingPage";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";

// Lazy loaded (heavy pages with charts/complex UI)
const MyDashboard = lazy(() => import("./pages/MyDashboard"));

const GestaoMentorados = lazy(() => import("./pages/GestaoMentorados"));
const OpenClawPage = lazy(() => import("./pages/OpenClawPage"));
const LeadsPage = lazy(() =>
  import("./pages/crm/LeadsPage").then((module) => ({
    default: module.LeadsPage,
  }))
);
const MentorshipStart = lazy(() => import("./pages/MentorshipStart"));
const DiagnosticoPage = lazy(() => import("./pages/Diagnostico"));
const AgendaPage = lazy(() =>
  import("./pages/Agenda").then((module) => ({
    default: module.Agenda,
  }))
);
const SettingsPage = lazy(() =>
  import("./pages/Settings").then((module) => ({
    default: module.SettingsPage,
  }))
);
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AccountDeletion = lazy(() => import("./pages/AccountDeletion"));
const CallPreparation = lazy(() => import("./pages/CallPreparation"));
const UpcomingCalls = lazy(() => import("./pages/UpcomingCalls"));

// Loading fallback for lazy components
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Landing Page */}
      <Route path="/" component={LandingPage} />
      <Route path="/comece-aqui" component={MentorshipStart} />

      {/* Dashboard Routes (protected by DashboardLayout) */}
      <Route path="/dashboard">
        <Redirect to="/admin/mentorados" />
      </Route>
      <Route path="/meu-dashboard" component={MyDashboard} />

      <Route path="/admin/mentorados" component={GestaoMentorados} />
      <Route path="/primeiro-acesso" component={PrimeiroAcesso} />
      <Route path="/assistente" component={OpenClawPage} />
      <Route path="/crm/leads" component={LeadsPage} />
      <Route path="/diagnostico" component={DiagnosticoPage} />
      <Route path="/agenda" component={AgendaPage} />
      <Route path="/configuracoes" component={SettingsPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/admin/call-preparation/:mentoradoId" component={CallPreparation} />
      <Route path="/admin/upcoming-calls" component={UpcomingCalls} />
      {/* Public Pages - Meta Compliance */}
      <Route path="/account-deletion" component={AccountDeletion} />

      {/* 404 Pages */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <AuthSync />
          {/* Header removed - handled by Layout/Sidebar */}
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
