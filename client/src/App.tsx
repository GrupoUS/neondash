import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Eagerly loaded (landing + lightweight pages)
// Eagerly loaded (landing + lightweight pages)
import LandingPage from "./pages/LandingPage";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import { AuthSync } from "./components/auth/AuthSync";

// Lazy loaded (heavy pages with charts/complex UI)
const Home = lazy(() => import("./pages/Home"));
const MyDashboard = lazy(() => import("./pages/MyDashboard"));

const GestaoMentorados = lazy(() => import("./pages/GestaoMentorados"));
const MoltbotPage = lazy(() => import("./pages/MoltbotPage"));
const LeadsPage = lazy(() => import("./pages/crm/LeadsPage").then(module => ({ default: module.LeadsPage })));
const MentorshipStart = lazy(() => import("./pages/MentorshipStart"));


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
      <Route path="/dashboard" component={Home} />
      <Route path="/meu-dashboard" component={MyDashboard} />

      <Route path="/admin/mentorados" component={GestaoMentorados} />
      <Route path="/primeiro-acesso" component={PrimeiroAcesso} />
      <Route path="/assistente" component={MoltbotPage} />
      <Route path="/crm/leads" component={LeadsPage} />


      {/* 404 Pages */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";

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
