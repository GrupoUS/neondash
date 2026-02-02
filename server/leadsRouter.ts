import { TRPCError } from "@trpc/server";
import { and, arrayContains, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { interacoes, leads } from "../drizzle/schema";
import { mentoradoProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        busca: z.string().optional(),
        status: z.string().optional(),
        origem: z.string().optional(),
        valorMin: z.number().optional(),
        valorMax: z.number().optional(),
        tags: z.array(z.string()).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
        mentoradoId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;

      if (input.mentoradoId) {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        targetMentoradoId = input.mentoradoId;
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado necessário",
        });
      }

      const filters = [eq(leads.mentoradoId, targetMentoradoId)];

      if (input.busca) {
        const search = `%${input.busca}%`;
        filters.push(
          sql`(${leads.nome} ILIKE ${search} OR ${leads.email} ILIKE ${search} OR ${leads.telefone} ILIKE ${search})`
        );
      }

      // Guard: Only apply status filter if not 'all'
      if (input.status && input.status !== "all") {
        // @ts-expect-error Drizzle enum typing
        filters.push(eq(leads.status, input.status));
      }

      // Guard: Only apply origem filter if not 'all'
      if (input.origem && input.origem !== "all") {
        // @ts-expect-error Drizzle enum typing
        filters.push(eq(leads.origem, input.origem));
      }

      // Advanced filter: valorMin (stored in cents)
      if (input.valorMin !== undefined && input.valorMin > 0) {
        filters.push(gte(leads.valorEstimado, input.valorMin * 100));
      }

      // Advanced filter: valorMax (stored in cents)
      if (input.valorMax !== undefined && input.valorMax < 100000) {
        filters.push(lte(leads.valorEstimado, input.valorMax * 100));
      }

      // Advanced filter: tags
      if (input.tags && input.tags.length > 0) {
        filters.push(arrayContains(leads.tags, input.tags));
      }

      const whereClause = and(...filters);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(whereClause);

      const total = Number(countResult?.count || 0);

      const items = await db
        .select()
        .from(leads)
        .where(whereClause)
        .orderBy(desc(leads.updatedAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return {
        leads: items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = getDb();

    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, input.id),
      with: {
        interacoes: {
          orderBy: [desc(interacoes.createdAt)],
        },
      },
    });

    if (!lead) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lead não encontrado",
      });
    }

    // Check strict ownership
    const isOwner = ctx.mentorado?.id === lead.mentoradoId;
    const isAdmin = ctx.user.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    return { lead, interacoes: lead.interacoes };
  }),

  create: mentoradoProcedure
    .input(
      z.object({
        nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
        email: z.string().email("Email inválido"),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        origem: z.enum(["instagram", "whatsapp", "google", "indicacao", "site", "outro"]),
        valorEstimado: z.number().optional(),
        // Novos campos
        indicadoPor: z.string().optional(),
        profissao: z.string().optional(),
        produtoInteresse: z.string().optional(),
        possuiClinica: z.enum(["sim", "nao"]).optional(),
        anosEstetica: z.number().optional(),
        faturamentoMensal: z.string().optional(),
        dorPrincipal: z.string().optional(),
        desejoPrincipal: z.string().optional(),
        temperatura: z.enum(["frio", "morno", "quente"]).optional(),
        // Aesthetic Fields (B2C)
        dataNascimento: z.string().optional(), // Date string
        genero: z.string().optional(),
        procedimentosInteresse: z.array(z.string()).optional(),
        historicoEstetico: z.string().optional(),
        alergias: z.string().optional(),
        tipoPele: z.string().optional(),
        disponibilidade: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [newLead] = await db
        .insert(leads)
        .values({
          mentoradoId: ctx.mentorado.id,
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          origem: input.origem,
          valorEstimado: input.valorEstimado,
          status: "novo",
          // Novos campos
          indicadoPor: input.indicadoPor,
          profissao: input.profissao,
          produtoInteresse: input.produtoInteresse,
          possuiClinica: input.possuiClinica,
          anosEstetica: input.anosEstetica,
          faturamentoMensal: input.faturamentoMensal,
          dorPrincipal: input.dorPrincipal,
          desejoPrincipal: input.desejoPrincipal,
          temperatura: input.temperatura,
          // Aesthetic Fields
          ...(input.dataNascimento ? { dataNascimento: input.dataNascimento } : {}),
          genero: input.genero,
          procedimentosInteresse: input.procedimentosInteresse,
          historicoEstetico: input.historicoEstetico,
          alergias: input.alergias,
          tipoPele: input.tipoPele,
          disponibilidade: input.disponibilidade,
        })
        .returning({ id: leads.id });

      return newLead;
    }),

  update: mentoradoProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        valorEstimado: z.number().optional(),
        tags: z.array(z.string()).optional(),
        // Novos campos
        indicadoPor: z.string().optional(),
        profissao: z.string().optional(),
        produtoInteresse: z.string().optional(),
        possuiClinica: z.enum(["sim", "nao"]).optional(),
        anosEstetica: z.number().optional(),
        faturamentoMensal: z.string().optional(),
        dorPrincipal: z.string().optional(),
        desejoPrincipal: z.string().optional(),
        temperatura: z.enum(["frio", "morno", "quente"]).optional(),
        // Aesthetic Fields (B2C)
        dataNascimento: z.string().optional(),
        genero: z.string().optional(),
        procedimentosInteresse: z.array(z.string()).optional(),
        historicoEstetico: z.string().optional(),
        alergias: z.string().optional(),
        tipoPele: z.string().optional(),
        disponibilidade: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Fetch to check ownership
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead não encontrado",
        });
      }

      // 2. Strict Ownership
      if (lead.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // 3. Update
      await db
        .update(leads)
        .set({
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          valorEstimado: input.valorEstimado,
          tags: input.tags,
          // Novos campos
          indicadoPor: input.indicadoPor,
          profissao: input.profissao,
          produtoInteresse: input.produtoInteresse,
          possuiClinica: input.possuiClinica,
          anosEstetica: input.anosEstetica,
          faturamentoMensal: input.faturamentoMensal,
          dorPrincipal: input.dorPrincipal,
          desejoPrincipal: input.desejoPrincipal,
          temperatura: input.temperatura,
          // Aesthetic Fields
          ...(input.dataNascimento ? { dataNascimento: input.dataNascimento } : {}),
          genero: input.genero,
          procedimentosInteresse: input.procedimentosInteresse,
          historicoEstetico: input.historicoEstetico,
          alergias: input.alergias,
          tipoPele: input.tipoPele,
          disponibilidade: input.disponibilidade,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id));

      return { success: true };
    }),

  updateStatus: mentoradoProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "novo",
          "primeiro_contato",
          "qualificado",
          "proposta",
          "negociacao",
          "fechado",
          "perdido",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Fetch to check ownership
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead não encontrado",
        });
      }

      // 2. Strict Ownership
      if (lead.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // 3. Update status
      await db
        .update(leads)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id));

      // 4. Add auto interaction
      await db.insert(interacoes).values({
        leadId: lead.id,
        mentoradoId: ctx.mentorado.id,
        tipo: "nota",
        notas: `Status alterado de "${lead.status}" para "${input.status}"`,
      });

      return { success: true };
    }),

  delete: mentoradoProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Fetch to check ownership
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead não encontrado",
        });
      }

      // 2. Strict Ownership (Admin exception removed as per request to have strict separation here)
      // If admin needs delete, use admin router or separate procedure
      if (lead.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      await db.delete(leads).where(eq(leads.id, input.id));

      return { success: true };
    }),

  addInteraction: mentoradoProcedure
    .input(
      z.object({
        leadId: z.number(),
        tipo: z.enum(["ligacao", "email", "whatsapp", "reuniao", "nota"]),
        notas: z.string().optional(),
        duracao: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Fetch lead
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead não encontrado",
        });
      }

      // 2. ownership
      if (lead.mentoradoId !== ctx.mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const [newInteraction] = await db
        .insert(interacoes)
        .values({
          leadId: input.leadId,
          mentoradoId: ctx.mentorado.id,
          tipo: input.tipo,
          notas: input.notas,
          duracao: input.duracao,
        })
        .returning({ id: interacoes.id });

      // Update lead timestamp
      await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, input.leadId));

      return newInteraction;
    }),

  stats: protectedProcedure
    .input(
      z.object({
        periodo: z.enum(["7d", "30d", "90d"]).optional(),
        mentoradoId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      let targetMentoradoId = ctx.mentorado?.id;
      if (input.mentoradoId) {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        targetMentoradoId = input.mentoradoId;
      }
      if (!targetMentoradoId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Calculate date filter based on periodo
      let dateFilter: Date | undefined;
      if (input.periodo) {
        const now = new Date();
        switch (input.periodo) {
          case "7d":
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      // Build query with optional date filter
      const whereClause = dateFilter
        ? and(eq(leads.mentoradoId, targetMentoradoId), gte(leads.createdAt, dateFilter))
        : eq(leads.mentoradoId, targetMentoradoId);

      const allLeads = await db.select().from(leads).where(whereClause);

      const ativos = allLeads.filter(
        (l) => l.status !== "fechado" && l.status !== "perdido"
      ).length;

      const ganhos = allLeads.filter((l) => l.status === "fechado").length;
      const total = allLeads.length;
      const taxaConversao = total > 0 ? (ganhos / total) * 100 : 0;

      // valorPipeline stored in cents, divide by 100 for display
      const valorPipelineCents = allLeads
        .filter((l) => l.status !== "perdido" && l.status !== "fechado")
        .reduce((sum, l) => sum + (l.valorEstimado || 0), 0);

      // Calculate average time to close for 'fechado' leads
      const closedLeads = allLeads.filter(
        (l) => l.status === "fechado" && l.createdAt && l.updatedAt
      );
      let tempoMedioFechamento = 0;
      if (closedLeads.length > 0) {
        const totalDays = closedLeads.reduce((sum, l) => {
          const created = new Date(l.createdAt).getTime();
          const closed = new Date(l.updatedAt).getTime();
          return sum + (closed - created) / (1000 * 60 * 60 * 24);
        }, 0);
        tempoMedioFechamento = Math.round(totalDays / closedLeads.length);
      }

      // Simple stats for now, can be optimized with aggregations
      const leadsPorOrigem = allLeads.reduce(
        (acc, curr) => {
          acc[curr.origem] = (acc[curr.origem] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalAtivos: ativos,
        taxaConversao,
        tempoMedioFechamento,
        valorPipeline: valorPipelineCents / 100, // Return in reais for display
        leadsPorOrigem,
      };
    }),
  bulkUpdateStatus: mentoradoProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum([
          "novo",
          "primeiro_contato",
          "qualificado",
          "proposta",
          "negociacao",
          "fechado",
          "perdido",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      const validIds = targets.filter((l) => l.mentoradoId === ctx.mentorado.id).map((l) => l.id);

      if (validIds.length === 0) return { count: 0 };

      await db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(inArray(leads.id, validIds));

      return { count: validIds.length };
    }),

  bulkDelete: mentoradoProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      const validIds = targets.filter((l) => l.mentoradoId === ctx.mentorado.id).map((l) => l.id);

      if (validIds.length === 0) return { count: 0 };

      await db.delete(leads).where(inArray(leads.id, validIds));
      return { count: validIds.length };
    }),

  bulkAddTags: mentoradoProcedure
    .input(z.object({ ids: z.array(z.number()), tags: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      const validIds = targets.filter((l) => l.mentoradoId === ctx.mentorado.id).map((l) => l.id);

      if (validIds.length === 0) return { count: 0 };

      // Iterative update to ensure tag uniqueness per lead
      let updatedCount = 0;
      for (const id of validIds) {
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, id),
          columns: { tags: true },
        });

        if (lead) {
          const currentTags = lead.tags || [];
          const newTags = Array.from(new Set([...currentTags, ...input.tags]));

          if (newTags.length !== currentTags.length) {
            await db
              .update(leads)
              .set({ tags: newTags, updatedAt: new Date() })
              .where(eq(leads.id, id));
            updatedCount++;
          }
        }
      }
      return { count: updatedCount };
    }),
});
