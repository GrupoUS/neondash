import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { tasks } from "../../drizzle/schema";
import { createLogger } from "../_core/logger";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const tasksRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          mentoradoId: z.number().optional(),
          search: z.string().optional(),
          category: z.string().optional(),
          priority: z.enum(["alta", "media", "baixa"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;

      if (input?.mentoradoId) {
        const isOwnId = input.mentoradoId === ctx.mentorado?.id;
        const isAdmin = ctx.user?.role === "admin";

        if (!isOwnId && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem visualizar tarefas de outros.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Perfil de mentorado não encontrado.",
        });
      }

      // Build dynamic WHERE conditions
      const conditions = [eq(tasks.mentoradoId, targetMentoradoId)];

      if (input?.search) {
        conditions.push(ilike(tasks.title, `%${input.search}%`));
      }

      if (input?.category) {
        conditions.push(eq(tasks.category, input.category));
      }

      if (input?.priority) {
        conditions.push(eq(tasks.priority, input.priority));
      }

      return db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: z.enum(["geral", "aula", "crm", "financeiro", "atividade"]).default("geral"),
        priority: z.enum(["alta", "media", "baixa"]).default("media"),
        source: z.enum(["manual", "atividade"]).default("manual"),
        atividadeCodigo: z.string().optional(),
        mentoradoId: z.number().optional(), // Admin override
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
        const isOwnId = input.mentoradoId === ctx.mentorado?.id;
        const isAdmin = ctx.user?.role === "admin";

        if (!isOwnId && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem criar tarefas para outros.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Perfil de mentorado não encontrado.",
        });
      }

      const [newTask] = await db
        .insert(tasks)
        .values({
          mentoradoId: targetMentoradoId,
          title: input.title,
          category: input.category,
          priority: input.priority,
          source: input.source,
          atividadeCodigo: input.atividadeCodigo,
          status: "todo",
        })
        .returning();

      return newTask;
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.id)).limit(1);

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = ctx.mentorado?.id === task.mentoradoId;
      const isAdmin = ctx.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const newStatus = task.status === "done" ? "todo" : "done";

      const [updatedTask] = await db
        .update(tasks)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(tasks.id, input.id))
        .returning();

      return updatedTask;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [task] = await db.select().from(tasks).where(eq(tasks.id, input.id)).limit(1);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = ctx.mentorado?.id === task.mentoradoId;
      const isAdmin = ctx.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),

  generateFromAI: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();
      const requestId = `ai-tasks-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const logger = createLogger({ service: "tasks-router", requestId });

      logger.info("generateFromAI_started", { mentoradoId: input.mentoradoId });

      const db = getDb();
      const { invokeLLM, validateLLMConfig, LLMConfigurationError, LLMInvocationError } =
        await import("../_core/llm");
      const { metricasMensais, diagnosticos, mentorados, leads, systemSettings } = await import(
        "../../drizzle/schema"
      );

      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
        const isOwnId = input.mentoradoId === ctx.mentorado?.id;
        const isAdmin = ctx.user?.role === "admin";

        if (!isOwnId && !isAdmin) {
          logger.warn("unauthorized_ai_generation_attempt", {
            requestedMentoradoId: input.mentoradoId,
            userId: ctx.user?.id,
          });
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem gerar tarefas para outros.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Perfil de mentorado não encontrado.",
        });
      }

      // Validate LLM configuration before attempting generation
      const llmConfig = validateLLMConfig();
      if (!llmConfig.isValid) {
        logger.error("llm_configuration_invalid", { errors: llmConfig.errors });
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração de IA incompleta. Contate o administrador.",
        });
      }

      logger.info("llm_config_validated", { provider: llmConfig.provider, model: llmConfig.model });

      // 1. Fetch Prompt from System Settings
      const promptSetting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, "neon_coach_prompt"),
      });

      const systemPrompt =
        promptSetting?.value ||
        `
      Você é um Business Coach de Elite para clínicas de estética (Persona: "Neon Coach").
      Sua missão é analisar os dados do mentorado e criar 3-5 tarefas TÁTICAS e IMEDIATAS para alavancar os resultados.
      
      Regras:
      1. Seja direto e imperativo.
      2. Foque em: Vendas, Marketing (Instagram) e Gestão.
      3. Use tom motivador mas exigente ("Gamified").
      4. Retorne APENAS um JSON array de strings. Nada mais.
      Exemplo: ["Ligar para 10 leads antigos", "Postar story com caixinha de perguntas", "Revisar custos de produtos"]
      `;

      // 2. Fetch Extended Context
      const [mentoradoData] = await db
        .select()
        .from(mentorados)
        .where(eq(mentorados.id, targetMentoradoId))
        .limit(1);

      const recentMetrics = await db
        .select()
        .from(metricasMensais)
        .where(eq(metricasMensais.mentoradoId, targetMentoradoId))
        .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes))
        .limit(3); // Increased to 3 months

      const [diagnosticoData] = await db
        .select()
        .from(diagnosticos)
        .where(eq(diagnosticos.mentoradoId, targetMentoradoId))
        .limit(1);

      // Lead Stats
      const leadsCount = await db
        .select({ count: leads.id })
        .from(leads)
        .where(eq(leads.mentoradoId, targetMentoradoId));

      const newLeads = await db
        .select({ count: leads.id })
        .from(leads)
        .where(and(eq(leads.mentoradoId, targetMentoradoId), eq(leads.status, "novo")));

      // Recent Tasks History (to avoid repeats)
      const recentTasks = await db
        .select({ title: tasks.title })
        .from(tasks)
        .where(eq(tasks.mentoradoId, targetMentoradoId))
        .orderBy(desc(tasks.createdAt))
        .limit(5);

      const userContext = `
      Mentorado: ${mentoradoData?.nomeCompleto}
      Meta Faturamento: R$ ${mentoradoData?.metaFaturamento}
      
      Últimas Métricas (3 meses):
      ${recentMetrics
        .map(
          (m) => `- ${m.mes}/${m.ano}: Fat R$${m.faturamento}, Lucro R$${m.lucro}, Leads ${m.leads}`
        )
        .join("\n")}
      
      Funil de Vendas Atual:
      - Total Leads na base: ${leadsCount.length}
      - Leads "Novos" (sem contato): ${newLeads.length}
      
      Diagnóstico (Pontos de dor/Objetivos):
      - Dor: ${diagnosticoData?.incomodaRotina || "Não informado"}
      - Objetivo: ${diagnosticoData?.objetivo6Meses || "Não informado"}
      - Visão 1 Ano: ${diagnosticoData?.visaoUmAno || "Não informado"}
      - Prioridade: ${diagnosticoData?.nivelPrioridade || "Normal"}
      
      Tarefas Recentes (EVITE REPETIR):
      ${recentTasks.map((t) => `- ${t.title}`).join("\n")}
      `;

      logger.info("context_prepared", {
        mentorado: mentoradoData?.nomeCompleto,
        metricsCount: recentMetrics.length,
        hasDiagnostico: !!diagnosticoData,
      });

      // 3. Call LLM with enhanced error handling
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContext },
          ],
          response_format: { type: "json_object" },
        });

        const content = result.choices[0]?.message?.content as string;

        if (!content) {
          logger.error("llm_empty_response", { result });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Resposta vazia da IA. Tente novamente.",
          });
        }

        logger.info("llm_response_received", {
          contentLength: content.length,
          model: result.model,
          tokens: result.usage,
        });

        let suggestedTasks: string[] = [];

        try {
          const parsed = JSON.parse(content);
          suggestedTasks = Array.isArray(parsed) ? parsed : parsed.tasks || parsed.data || [];

          if (!Array.isArray(suggestedTasks)) {
            logger.error("invalid_tasks_format", { parsed, content });
            throw new Error("Formato de resposta inválido: esperado array de tarefas");
          }
        } catch (parseError) {
          logger.error("json_parse_failed", {
            content,
            error: parseError instanceof Error ? parseError.message : "Unknown error",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao processar resposta da IA. Tente novamente.",
          });
        }

        logger.info("tasks_parsed", { taskCount: suggestedTasks.length });

        // 4. Insert tasks
        if (suggestedTasks.length > 0) {
          const tasksToInsert = suggestedTasks
            .filter(
              (title): title is string => typeof title === "string" && title.trim().length > 0
            )
            .map((title) => ({
              mentoradoId: targetMentoradoId!,
              title: title.trim().substring(0, 255),
              status: "todo" as const,
              priority: "alta" as const,
              category: "atividade" as const,
              source: "ai_coach" as const,
            }));

          if (tasksToInsert.length > 0) {
            await db.insert(tasks).values(tasksToInsert);
            logger.info("tasks_inserted", { count: tasksToInsert.length });
          }
        }

        const duration = Date.now() - startTime;
        logger.info("generateFromAI_completed", {
          durationMs: duration,
          tasksGenerated: suggestedTasks.length,
        });

        return { success: true, count: suggestedTasks.length };
      } catch (error: unknown) {
        const duration = Date.now() - startTime;

        // Handle specific LLM errors
        if (error instanceof LLMConfigurationError) {
          logger.error("llm_configuration_error", {
            code: error.code,
            message: error.message,
            durationMs: duration,
          });
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Configuração de IA incompleta. Contate o administrador.",
          });
        }

        if (error instanceof LLMInvocationError) {
          logger.error("llm_invocation_error", {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details,
            durationMs: duration,
          });

          // Map specific error codes to user-friendly messages
          let userMessage = "Falha ao gerar plano com IA. Tente novamente.";

          switch (error.code) {
            case "TIMEOUT":
              userMessage = "A IA demorou muito para responder. Tente novamente.";
              break;
            case "RATE_LIMITED":
              userMessage = "Limite de requisições atingido. Aguarde um momento e tente novamente.";
              break;
            case "UNAUTHORIZED":
              userMessage = "Erro de autenticação com a IA. Contate o administrador.";
              break;
            case "MODEL_NOT_FOUND":
              userMessage = "Modelo de IA não encontrado. Contate o administrador.";
              break;
            case "SERVER_ERROR":
              userMessage =
                "Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.";
              break;
            case "NETWORK_ERROR":
              userMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
              break;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: userMessage,
          });
        }

        // Handle unexpected errors
        logger.error("unexpected_ai_generation_error", {
          error,
          durationMs: duration,
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro inesperado ao gerar plano. Tente novamente.",
        });
      }
    }),

  archivePlanTasks: protectedProcedure
    .input(
      z.object({
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
        const isOwnId = input.mentoradoId === ctx.mentorado?.id;
        const isAdmin = ctx.user?.role === "admin";

        if (!isOwnId && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem arquivar tarefas de outros.",
          });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Perfil de mentorado não encontrado.",
        });
      }

      // Archive all AI tasks (source = ai_coach OR category = atividade) that are done
      const result = await db
        .update(tasks)
        .set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(tasks.mentoradoId, targetMentoradoId), eq(tasks.status, "done")))
        .returning({ id: tasks.id });

      return { success: true, count: result.length };
    }),
});
