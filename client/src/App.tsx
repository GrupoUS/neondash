import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MyDashboard from "./pages/MyDashboard";
import Admin from "./pages/Admin";
import SubmitMetrics from "./pages/SubmitMetrics";
import Estrutura from "./pages/Estrutura";
import Escala from "./pages/Escala";
import LandingPage from "./pages/LandingPage";
import VincularEmails from "./pages/VincularEmails";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import GestaoMentorados from "./pages/GestaoMentorados";
import DashboardComparativo from "./pages/DashboardComparativo";
import Conquistas from "./pages/Conquistas";
import RankingMensal from "./pages/RankingMensal";
import Notificacoes from "./pages/Notificacoes";

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

      {/* 404 Pages */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
