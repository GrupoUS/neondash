/**
 * AI Assistant Service
 *
 * Uses Vercel AI SDK with Google Gemini to provide an intelligent assistant
 * with access to mentorado data via tool calling.
 */

import { generateText, tool } from "ai";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import {
  diagnosticos,
  feedbacks,
  googleTokens,
  leads,
  type Mentorado,
  metricasMensais,
  tasks,
} from "../../drizzle/schema";
import { defaultModel, isAIConfigured } from "../_core/aiProvider";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { getEvents, refreshAccessToken } from "./googleCalendarService";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatContext {
  mentorado: Mentorado;
  userId: number;
  mentoradoId: number;
}

export interface ChatResult {
  success: boolean;
  message: string;
  toolsUsed?: string[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é o **Assistente NEON**, um assistente de IA especializado em mentoria de negócios para profissionais de estética.

## Seu Papel
Você ajuda mentorados da Mentoria Black da Dra. Camila a acompanhar seu progresso, analisar métricas e tomar decisões estratégicas para crescer seus negócios.

## Ferramentas Disponíveis
Você tem acesso às seguintes ferramentas para consultar dados do mentorado:
- **getMyMetrics**: Ver métricas mensais (faturamento, lucro, leads, procedimentos, posts, stories)
- **getMyLeads**: Ver leads do CRM com filtros por status
- **searchLeads**: Buscar leads por nome, email ou telefone
- **getLatestFeedback**: Ver o feedback mais recente do mentor
- **getMyTasks**: Ver tarefas pendentes e seus status
- **getMyGoals**: Ver metas atuais e progresso
- **getDiagnostico**: Ver diagnóstico inicial de onboarding
- **getMyAgenda**: Ver próximos eventos do Google Calendar
- **searchWeb**: Pesquisar na web por informações atualizadas

## Diretrizes
1. Sempre responda em **português brasileiro**
2. Seja objetivo e forneça **insights acionáveis**
3. Use dados reais quando disponíveis - não invente números
4. Se não houver dados, informe isso claramente
5. Sugira próximos passos práticos baseados nos dados
6. Use emojis moderadamente para tornar a conversa mais amigável
7. Quando analisar métricas, compare com metas e meses anteriores

## Formatação
Use markdown para formatar respostas quando apropriado:
- Listas para itens
- **Negrito** para destacar
- Tabelas para comparações
`;

// ═══════════════════════════════════════════════════════════════════════════
// TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

function createTools(ctx: ChatContext) {
  const db = getDb();

  return {
    getMyMetrics: tool({
      description:
        "Obter métricas mensais do mentorado (faturamento, lucro, leads, procedimentos, posts, stories). Use para analisar performance.",
      parameters: z.object({
        months: z.number().min(1).max(12).default(6).describe("Número de meses para buscar (1-12)"),
      }),
      execute: async ({ months }) => {
        const metrics = await db
          .select({
            ano: metricasMensais.ano,
            mes: metricasMensais.mes,
            faturamento: metricasMensais.faturamento,
            lucro: metricasMensais.lucro,
            leads: metricasMensais.leads,
            procedimentos: metricasMensais.procedimentos,
            postsFeed: metricasMensais.postsFeed,
            stories: metricasMensais.stories,
            observacoes: metricasMensais.observacoes,
          })
          .from(metricasMensais)
          .where(eq(metricasMensais.mentoradoId, ctx.mentoradoId))
          .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
          .limit(months);

        if (metrics.length === 0) {
          return { status: "empty", message: "Nenhuma métrica registrada ainda.", data: [] };
        }

        return {
          status: "success",
          message: `Encontradas ${metrics.length} métricas mensais.`,
          data: metrics,
        };
      },
    }),

    getMyLeads: tool({
      description:
        "Obter leads do CRM do mentorado. Pode filtrar por status (novo, primeiro_contato, qualificado, proposta, negociacao, fechado, perdido).",
      parameters: z.object({
        status: z
          .enum([
            "novo",
            "primeiro_contato",
            "qualificado",
            "proposta",
            "negociacao",
            "fechado",
            "perdido",
          ])
          .optional()
          .describe("Filtrar por status do lead"),
        limit: z.number().min(1).max(50).default(20).describe("Limite de resultados"),
      }),
      execute: async ({ status, limit }) => {
        const conditions = [eq(leads.mentoradoId, ctx.mentoradoId)];
        if (status) {
          conditions.push(eq(leads.status, status));
        }

        const leadsList = await db
          .select({
            id: leads.id,
            nome: leads.nome,
            email: leads.email,
            telefone: leads.telefone,
            status: leads.status,
            origem: leads.origem,
            valorEstimado: leads.valorEstimado,
            temperatura: leads.temperatura,
            createdAt: leads.createdAt,
          })
          .from(leads)
          .where(and(...conditions))
          .orderBy(desc(leads.createdAt))
          .limit(limit);

        // Get counts by status
        const allLeads = await db
          .select({ status: leads.status })
          .from(leads)
          .where(eq(leads.mentoradoId, ctx.mentoradoId));

        const statusCounts = allLeads.reduce<Record<string, number>>((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {});

        return {
          status: "success",
          message: `Total: ${allLeads.length} leads, mostrando ${leadsList.length}.`,
          statusCounts,
          data: leadsList,
        };
      },
    }),

    searchLeads: tool({
      description: "Buscar leads por nome, email ou telefone.",
      parameters: z.object({
        query: z.string().min(2).describe("Termo de busca (nome, email ou telefone)"),
      }),
      execute: async ({ query }) => {
        const searchTerm = `%${query}%`;
        const foundLeads = await db
          .select({
            id: leads.id,
            nome: leads.nome,
            email: leads.email,
            telefone: leads.telefone,
            status: leads.status,
            origem: leads.origem,
            valorEstimado: leads.valorEstimado,
          })
          .from(leads)
          .where(
            and(
              eq(leads.mentoradoId, ctx.mentoradoId),
              or(
                ilike(leads.nome, searchTerm),
                ilike(leads.email, searchTerm),
                ilike(leads.telefone ?? "", searchTerm)
              )
            )
          )
          .limit(10);

        return {
          status: foundLeads.length > 0 ? "success" : "empty",
          message:
            foundLeads.length > 0
              ? `Encontrados ${foundLeads.length} leads para "${query}".`
              : `Nenhum lead encontrado para "${query}".`,
          data: foundLeads,
        };
      },
    }),

    getLatestFeedback: tool({
      description: "Obter o feedback mais recente do mentor sobre o mentorado.",
      parameters: z.object({}),
      execute: async () => {
        const latestFeedback = await db
          .select({
            ano: feedbacks.ano,
            mes: feedbacks.mes,
            analiseMes: feedbacks.analiseMes,
            focoProximoMes: feedbacks.focoProximoMes,
            sugestaoMentor: feedbacks.sugestaoMentor,
            createdAt: feedbacks.createdAt,
          })
          .from(feedbacks)
          .where(eq(feedbacks.mentoradoId, ctx.mentoradoId))
          .orderBy(desc(feedbacks.ano), desc(feedbacks.mes))
          .limit(1);

        if (latestFeedback.length === 0) {
          return { status: "empty", message: "Nenhum feedback registrado ainda.", data: null };
        }

        const fb = latestFeedback[0];
        return {
          status: "success",
          message: `Feedback de ${fb.mes}/${fb.ano}.`,
          data: fb,
        };
      },
    }),

    getMyTasks: tool({
      description: "Obter tarefas do mentorado. Pode filtrar por status (todo, done).",
      parameters: z.object({
        status: z.enum(["todo", "done"]).optional().describe("Filtrar por status da tarefa"),
      }),
      execute: async ({ status }) => {
        const conditions = [eq(tasks.mentoradoId, ctx.mentoradoId)];
        if (status) {
          conditions.push(eq(tasks.status, status));
        }

        const tasksList = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            category: tasks.category,
            priority: tasks.priority,
            createdAt: tasks.createdAt,
          })
          .from(tasks)
          .where(and(...conditions))
          .orderBy(desc(tasks.priority), tasks.createdAt);

        const todoCount = tasksList.filter((t: { status: string }) => t.status === "todo").length;
        const doneCount = tasksList.filter((t: { status: string }) => t.status === "done").length;

        return {
          status: "success",
          message: `Total: ${tasksList.length} tarefas (${todoCount} pendentes, ${doneCount} concluídas).`,
          summary: { total: tasksList.length, todo: todoCount, done: doneCount },
          data: tasksList,
        };
      },
    }),

    getMyGoals: tool({
      description:
        "Obter as metas atuais do mentorado (faturamento, leads, procedimentos, posts, stories).",
      parameters: z.object({}),
      execute: async () => {
        const mentorado = ctx.mentorado;

        // Get current month metrics to calculate progress
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const currentMetrics = await db
          .select({
            faturamento: metricasMensais.faturamento,
            leads: metricasMensais.leads,
            procedimentos: metricasMensais.procedimentos,
            postsFeed: metricasMensais.postsFeed,
            stories: metricasMensais.stories,
          })
          .from(metricasMensais)
          .where(
            and(
              eq(metricasMensais.mentoradoId, ctx.mentoradoId),
              eq(metricasMensais.ano, currentYear),
              eq(metricasMensais.mes, currentMonth)
            )
          )
          .limit(1);

        const metrics = currentMetrics[0] || {
          faturamento: 0,
          leads: 0,
          procedimentos: 0,
          postsFeed: 0,
          stories: 0,
        };

        const goals = {
          faturamento: {
            meta: mentorado.metaFaturamento,
            atual: metrics.faturamento,
            percentual: Math.round((metrics.faturamento / mentorado.metaFaturamento) * 100),
          },
          leads: {
            meta: mentorado.metaLeads,
            atual: metrics.leads,
            percentual: mentorado.metaLeads
              ? Math.round((metrics.leads / mentorado.metaLeads) * 100)
              : 0,
          },
          procedimentos: {
            meta: mentorado.metaProcedimentos,
            atual: metrics.procedimentos,
            percentual: mentorado.metaProcedimentos
              ? Math.round((metrics.procedimentos / mentorado.metaProcedimentos) * 100)
              : 0,
          },
          posts: {
            meta: mentorado.metaPosts,
            atual: metrics.postsFeed,
            percentual: mentorado.metaPosts
              ? Math.round((metrics.postsFeed / mentorado.metaPosts) * 100)
              : 0,
          },
          stories: {
            meta: mentorado.metaStories,
            atual: metrics.stories,
            percentual: mentorado.metaStories
              ? Math.round((metrics.stories / mentorado.metaStories) * 100)
              : 0,
          },
        };

        return {
          status: "success",
          message: `Metas de ${currentMonth}/${currentYear} para ${mentorado.nomeCompleto}.`,
          periodo: { ano: currentYear, mes: currentMonth },
          data: goals,
        };
      },
    }),

    getDiagnostico: tool({
      description:
        "Obter o diagnóstico inicial de onboarding do mentorado (momento profissional, resultados, dores, objetivos).",
      parameters: z.object({}),
      execute: async () => {
        const diag = await db
          .select({
            atuacaoSaude: diagnosticos.atuacaoSaude,
            tempoLivre: diagnosticos.tempoLivre,
            jaAtuaEstetica: diagnosticos.jaAtuaEstetica,
            temClinica: diagnosticos.temClinica,
            rendaMensal: diagnosticos.rendaMensal,
            faturaEstetica: diagnosticos.faturaEstetica,
            custoVida: diagnosticos.custoVida,
            incomodaRotina: diagnosticos.incomodaRotina,
            dificuldadeCrescer: diagnosticos.dificuldadeCrescer,
            objetivo6Meses: diagnosticos.objetivo6Meses,
            resultadoTransformador: diagnosticos.resultadoTransformador,
            organizacao: diagnosticos.organizacao,
          })
          .from(diagnosticos)
          .where(eq(diagnosticos.mentoradoId, ctx.mentoradoId))
          .limit(1);

        if (diag.length === 0) {
          return { status: "empty", message: "Diagnóstico não preenchido ainda.", data: null };
        }

        return {
          status: "success",
          message: "Diagnóstico inicial do mentorado.",
          data: diag[0],
        };
      },
    }),

    getMyAgenda: tool({
      description:
        "Obter próximos eventos do Google Calendar do usuário. Retorna compromissos, reuniões e lembretes.",
      parameters: z.object({
        days: z
          .number()
          .min(1)
          .max(30)
          .default(7)
          .describe("Número de dias à frente para buscar (1-30)"),
      }),
      execute: async ({ days }) => {
        // Check if user has Google Calendar connected
        const [token] = await db
          .select()
          .from(googleTokens)
          .where(eq(googleTokens.userId, ctx.userId));

        if (!token) {
          return {
            status: "not_connected",
            message:
              "Google Calendar não conectado. O usuário precisa conectar sua conta Google na página Agenda.",
            data: null,
          };
        }

        // Check if token is expired and refresh if needed
        let accessToken = token.accessToken;
        if (new Date() >= token.expiresAt) {
          if (!token.refreshToken) {
            return {
              status: "expired",
              message:
                "Sessão do Google Calendar expirou. O usuário precisa reconectar na página Agenda.",
              data: null,
            };
          }

          try {
            const refreshed = await refreshAccessToken(token.refreshToken);
            accessToken = refreshed.access_token;

            // Update token in database
            await db
              .update(googleTokens)
              .set({
                accessToken: refreshed.access_token,
                expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              })
              .where(eq(googleTokens.userId, ctx.userId));
          } catch {
            return {
              status: "refresh_failed",
              message:
                "Falha ao renovar sessão do Google Calendar. O usuário precisa reconectar na página Agenda.",
              data: null,
            };
          }
        }

        // Fetch events
        try {
          const now = new Date();
          const timeMin = now;
          const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

          const events = await getEvents(accessToken, timeMin, timeMax, 20);

          if (events.length === 0) {
            return {
              status: "empty",
              message: `Nenhum evento encontrado nos próximos ${days} dias.`,
              data: [],
            };
          }

          return {
            status: "success",
            message: `Encontrados ${events.length} eventos nos próximos ${days} dias.`,
            data: events.map((e) => ({
              title: e.title,
              start: e.start,
              end: e.end,
              allDay: e.allDay,
              location: e.location,
            })),
          };
        } catch {
          return {
            status: "error",
            message: "Erro ao buscar eventos do Google Calendar.",
            data: null,
          };
        }
      },
    }),

    searchWeb: tool({
      description:
        "Pesquisar na web por informações atualizadas usando Brave Search. Use para buscar tendências, notícias ou informações que não estão no banco de dados.",
      parameters: z.object({
        query: z
          .string()
          .min(3)
          .max(200)
          .describe("Termo de busca (ex: 'tendências estética 2025', 'marketing clínicas')"),
        count: z.number().min(1).max(10).default(5).describe("Número de resultados (1-10)"),
      }),
      execute: async ({ query, count }) => {
        if (!ENV.braveSearchApiKey) {
          return {
            status: "not_configured",
            message: "Pesquisa web não configurada. BRAVE_SEARCH_API_KEY não definida.",
            data: null,
          };
        }

        try {
          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
            {
              headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": ENV.braveSearchApiKey,
              },
            }
          );

          if (!response.ok) {
            return {
              status: "error",
              message: `Erro na pesquisa: ${response.status} ${response.statusText}`,
              data: null,
            };
          }

          const data = (await response.json()) as {
            web?: {
              results?: Array<{
                title: string;
                url: string;
                description: string;
              }>;
            };
          };
          const results = data.web?.results ?? [];

          if (results.length === 0) {
            return {
              status: "empty",
              message: `Nenhum resultado encontrado para "${query}".`,
              data: [],
            };
          }

          return {
            status: "success",
            message: `Encontrados ${results.length} resultados para "${query}".`,
            data: results.map((r) => ({
              title: r.title,
              url: r.url,
              description: r.description,
            })),
          };
        } catch (error) {
          return {
            status: "error",
            message: `Erro ao pesquisar: ${error instanceof Error ? error.message : "desconhecido"}`,
            data: null,
          };
        }
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a chat message and generate a response using AI with tools.
 */
export async function chat(messages: AIMessage[], context: ChatContext): Promise<ChatResult> {
  if (!isAIConfigured()) {
    return {
      success: false,
      message:
        "Serviço de IA não configurado. Configure GOOGLE_GENERATIVE_AI_API_KEY ou GOOGLE_API_KEY.",
      error: "AI_NOT_CONFIGURED",
    };
  }

  try {
    const tools = createTools(context);

    const result = await generateText({
      model: defaultModel,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools,
      maxSteps: 5, // Allow up to 5 tool calls in a single request
    });

    const toolsUsed = result.steps
      .flatMap((step) => step.toolCalls?.map((tc) => tc.toolName) ?? [])
      .filter(Boolean);

    return {
      success: true,
      message: result.text,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Intentional error logging for debugging
    console.error("[AI Assistant] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    // Handle specific error types
    if (errorMessage.includes("API key")) {
      return {
        success: false,
        message: "Erro de autenticação com a API de IA. Verifique a configuração.",
        error: "AUTH_ERROR",
      };
    }

    if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
      return {
        success: false,
        message: "Limite de requisições atingido. Por favor, aguarde alguns minutos.",
        error: "RATE_LIMIT",
      };
    }

    return {
      success: false,
      message: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
      error: errorMessage,
    };
  }
}

/**
 * Simple one-shot query for quick responses without conversation history.
 */
export async function query(prompt: string, context: ChatContext): Promise<ChatResult> {
  return chat([{ role: "user", content: prompt }], context);
}
