/**
 * CallPreparation Page Tests
 *
 * Tests for the CallPreparation mentor page component.
 * Covers loading states, error handling, section rendering, and form submission.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock wouter
const mockUseParams = vi.fn();
const mockNavigate = vi.fn();
vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    useLocation: () => ["/admin/call-preparation/1", mockNavigate],
  };
});

// Mock trpc
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    mentor: {
      getCallPreparation: {
        useQuery: (input: unknown, options: unknown) => mockUseQuery(input, options),
      },
      saveCallNotes: {
        useMutation: () => mockUseMutation(),
      },
      generateTopicSuggestions: {
        useQuery: () => ({
          data: [
            { topic: "Test topic 1", priority: "high", source: "ai" },
            { topic: "Test topic 2", priority: "medium", source: "fallback" },
          ],
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock DashboardLayout
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock child components for isolation
vi.mock("@/components/mentor/CallHeader", () => ({
  CallHeader: ({ mentorado }: { mentorado: { nomeCompleto: string } }) => (
    <div data-testid="call-header">Header: {mentorado?.nomeCompleto}</div>
  ),
}));

vi.mock("@/components/mentor/AlertsSection", () => ({
  AlertsSection: ({ alerts }: { alerts: unknown[] }) => (
    <div data-testid="alerts-section">Alerts: {alerts?.length || 0}</div>
  ),
}));

vi.mock("@/components/mentor/MetricsSummary", () => ({
  MetricsSummary: () => <div data-testid="metrics-summary">Metrics Summary</div>,
}));

vi.mock("@/components/dashboard/EvolutionChart", () => ({
  EvolutionChart: () => <div data-testid="evolution-chart">Evolution Chart</div>,
}));

vi.mock("@/components/mentor/ComparativeRadar", () => ({
  ComparativeRadar: () => <div data-testid="comparative-radar">Comparative Radar</div>,
}));

vi.mock("@/components/mentor/PreviousCallNotes", () => ({
  PreviousCallNotes: () => <div data-testid="previous-call-notes">Previous Notes</div>,
}));

vi.mock("@/components/mentor/TopicSuggestions", () => ({
  TopicSuggestions: () => <div data-testid="topic-suggestions">Topic Suggestions</div>,
}));

vi.mock("@/components/mentor/CallNotesForm", () => ({
  CallNotesForm: ({ mentoradoId }: { mentoradoId: number }) => (
    <div data-testid="call-notes-form">Notes Form for ID: {mentoradoId}</div>
  ),
}));

// Import after mocks
import CallPreparation from "./CallPreparation";

// Sample mock data
const mockCallPreparationData = {
  mentorado: {
    id: 1,
    nomeCompleto: "Dr. João Silva",
    fotoUrl: null,
    email: "joao@test.com",
    turma: "neon_estrutura" as const,
    metaFaturamento: 50000,
  },
  currentMetrics: {
    faturamento: 45000,
    leads: 25,
    procedimentos: 15,
    lucro: 20000,
    postsFeed: 8,
    stories: 30,
  },
  alerts: [
    {
      type: "warning" as const,
      message: "Meta de faturamento em risco",
      metric: "faturamento",
      severity: "medium" as const,
      usedFallback: false,
    },
  ],
  evolution: [
    { ano: 2024, mes: 10, faturamento: 40000, leads: 20, procedimentos: 12 },
    { ano: 2024, mes: 11, faturamento: 42000, leads: 22, procedimentos: 14 },
    { ano: 2024, mes: 12, faturamento: 45000, leads: 25, procedimentos: 15 },
  ],
  comparison: {
    userMetrics: {
      faturamento: 45000,
      leads: 25,
      procedimentos: 15,
      lucro: 20000,
      postsFeed: 8,
      stories: 30,
    },
    turmaAverage: {
      faturamento: 50000,
      leads: 30,
      procedimentos: 18,
      lucro: 22000,
      postsFeed: 10,
      stories: 25,
    },
    percentiles: null,
  },
  lastCallNotes: {
    id: 1,
    dataCall: new Date("2024-12-01"),
    principaisInsights: "Great progress on marketing",
    acoesAcordadas: "Increase ad spend",
    proximosPassos: "Review results next week",
    duracaoMinutos: 45,
  },
  suggestions: [
    { topic: "AI topic 1", priority: "high", source: "ai" },
    { topic: "AI topic 2", priority: "medium", source: "ai" },
  ],
};

describe("CallPreparation Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ mentoradoId: "1" });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading skeletons while data is being fetched", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<CallPreparation />);

      // Check for skeleton elements - they have specific dimensions in the component
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should display error alert when fetching fails", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network error" },
        refetch: vi.fn(),
      });

      render(<CallPreparation />);

      expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    });

    it("should display error alert when data is null without error", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CallPreparation />);

      expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    });

    it("should display invalid ID error when mentoradoId is missing", () => {
      mockUseParams.mockReturnValue({ mentoradoId: undefined });

      render(<CallPreparation />);

      expect(screen.getByText("ID do mentorado inválido")).toBeInTheDocument();
    });

    it("should display invalid ID error when mentoradoId is NaN", () => {
      mockUseParams.mockReturnValue({ mentoradoId: "abc" });

      render(<CallPreparation />);

      expect(screen.getByText("ID do mentorado inválido")).toBeInTheDocument();
    });

    it("should allow retry on error", async () => {
      const refetchMock = vi.fn();
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Failed to fetch" },
        refetch: refetchMock,
      });

      render(<CallPreparation />);

      const retryButton = screen.getByRole("button", { name: /tentar novamente/i });
      await userEvent.click(retryButton);

      expect(refetchMock).toHaveBeenCalled();
    });
  });

  describe("Success State - All Eight Sections Render", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockCallPreparationData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should render the dashboard layout", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    });

    it("should render the page title", () => {
      render(<CallPreparation />);
      expect(screen.getByText("Preparação para Call")).toBeInTheDocument();
    });

    it("should render back button", () => {
      render(<CallPreparation />);
      expect(screen.getByRole("button", { name: /voltar/i })).toBeInTheDocument();
    });

    it("should render Section 1: Call Header with mentorado info", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("call-header")).toBeInTheDocument();
      expect(screen.getByText(/Header: Dr. João Silva/)).toBeInTheDocument();
    });

    it("should render Section 2: Alerts section", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("alerts-section")).toBeInTheDocument();
      expect(screen.getByText("Alertas")).toBeInTheDocument();
    });

    it("should render Section 3: Metrics Summary", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("metrics-summary")).toBeInTheDocument();
      expect(screen.getByText("Métricas do Mês Atual")).toBeInTheDocument();
    });

    it("should render Section 4: Evolution Chart", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("evolution-chart")).toBeInTheDocument();
    });

    it("should render Section 5: Comparative Radar", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("comparative-radar")).toBeInTheDocument();
    });

    it("should render Section 6: Previous Call Notes", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("previous-call-notes")).toBeInTheDocument();
    });

    it("should render Section 7: Topic Suggestions", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("topic-suggestions")).toBeInTheDocument();
    });

    it("should render Section 8: Call Notes Form", () => {
      render(<CallPreparation />);
      expect(screen.getByTestId("call-notes-form")).toBeInTheDocument();
      expect(screen.getByText("Registrar Notas")).toBeInTheDocument();
    });

    it("should pass mentoradoId to CallNotesForm", () => {
      render(<CallPreparation />);
      expect(screen.getByText("Notes Form for ID: 1")).toBeInTheDocument();
    });

    it("should render all section headers", () => {
      render(<CallPreparation />);

      expect(screen.getByText("Alertas")).toBeInTheDocument();
      expect(screen.getByText("Métricas do Mês Atual")).toBeInTheDocument();
      expect(screen.getByText("Análise de Performance")).toBeInTheDocument();
      expect(screen.getByText("Contexto para a Call")).toBeInTheDocument();
      expect(screen.getByText("Registrar Notas")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockCallPreparationData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should have accessible section landmarks", () => {
      render(<CallPreparation />);

      const _sectionsCount = screen.getAllByRole("region", { hidden: true }).length;
      // The component uses aria-label on sections
      expect(document.querySelector('[aria-label="Informações do mentorado"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-label="Alertas"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-label="Resumo de métricas"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-label="Gráficos de evolução"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-label="Notas e sugestões"]')).toBeInTheDocument();
      expect(document.querySelector('[aria-label="Formulário de notas"]')).toBeInTheDocument();
    });
  });

  describe("Query Configuration", () => {
    it("should not execute query when mentoradoId is invalid", () => {
      mockUseParams.mockReturnValue({ mentoradoId: "abc" });
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CallPreparation />);

      // Check that useQuery was called with enabled: false
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ mentoradoId: 0 }),
        expect.objectContaining({ enabled: false })
      );
    });

    it("should execute query when mentoradoId is valid", () => {
      mockUseParams.mockReturnValue({ mentoradoId: "5" });
      mockUseQuery.mockReturnValue({
        data: mockCallPreparationData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CallPreparation />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ mentoradoId: 5 }),
        expect.objectContaining({ enabled: true })
      );
    });
  });

  describe("Responsive Layout", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockCallPreparationData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should have responsive grid classes for charts section", () => {
      render(<CallPreparation />);

      // Check for lg:grid-cols-2 class on charts container
      const chartsSection = document.querySelector('[aria-label="Gráficos de evolução"]');
      expect(chartsSection).toBeInTheDocument();

      const chartsGrid = chartsSection?.querySelector(".lg\\:grid-cols-2");
      expect(chartsGrid).toBeInTheDocument();
    });

    it("should have responsive grid classes for notes section", () => {
      render(<CallPreparation />);

      const notesSection = document.querySelector('[aria-label="Notas e sugestões"]');
      expect(notesSection).toBeInTheDocument();

      const notesGrid = notesSection?.querySelector(".lg\\:grid-cols-2");
      expect(notesGrid).toBeInTheDocument();
    });
  });
});
