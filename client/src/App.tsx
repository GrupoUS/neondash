import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Eagerly loaded (landing + lightweight pages)
import LandingPage from "./pages/LandingPage";
import Estrutura from "./pages/Estrutura";
import Escala from "./pages/Escala";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";

// Lazy loaded (heavy pages with charts/complex UI)
const Home = lazy(() => import("./pages/Home"));
const MyDashboard = lazy(() => import("./pages/MyDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const SubmitMetrics = lazy(() => import("./pages/SubmitMetrics"));
const VincularEmails = lazy(() => import("./pages/VincularEmails"));
const GestaoMentorados = lazy(() => import("./pages/GestaoMentorados"));
const DashboardComparativo = lazy(() => import("./pages/DashboardComparativo"));
const Conquistas = lazy(() => import("./pages/Conquistas"));
const RankingMensal = lazy(() => import("./pages/RankingMensal"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const MoltbotPage = lazy(() => import("./pages/MoltbotPage"));
const LeadsPage = lazy(() => import("./pages/crm/LeadsPage").then(module => ({ default: module.LeadsPage })));

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

      {/* Dashboard Routes (protected by DashboardLayout) */}
      <Route path="/dashboard" component={Home} />
      <Route path="/meu-dashboard" component={MyDashboard} />
      <Route path="/enviar-metricas" component={SubmitMetrics} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/vincular" component={VincularEmails} />
      <Route path="/admin/mentorados" component={GestaoMentorados} />
      <Route path="/comparativo" component={DashboardComparativo} />
      <Route path="/conquistas" component={Conquistas} />
      <Route path="/ranking" component={RankingMensal} />
      <Route path="/notificacoes" component={Notificacoes} />
      <Route path="/estrutura" component={Estrutura} />
      <Route path="/escala" component={Escala} />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <header className="flex justify-end p-4 gap-4">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
