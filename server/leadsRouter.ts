import { TRPCError } from "@trpc/server";
import { and, arrayContains, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { interacoes, leads } from "../drizzle/schema";
import { validateBrazilianPhone } from "../shared/phone-utils";
import { protectedProcedure, router } from "./_core/trpc";
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

      // Determine target mentorado (admin override or own)
      let targetMentoradoId = ctx.mentorado?.id;

      // If a specific mentoradoId is requested
      if (input.mentoradoId) {
        // If it's the user's own ID, allow it (redundant but safe)
        if (ctx.mentorado?.id === input.mentoradoId) {
          targetMentoradoId = input.mentoradoId;
        }
        // If it's different, only allow admins
        else if (ctx.user.role === "admin") {
          targetMentoradoId = input.mentoradoId;
        }
        // Otherwise forbidden
        else {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
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

  create: protectedProcedure
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
        procedimentosInteresse: z.array(z.number()).optional(),
        historicoEstetico: z.string().optional(),
        alergias: z.string().optional(),
        tipoPele: z.string().optional(),
        disponibilidade: z.string().optional(),
        objecoes: z.array(z.string()).optional(),
        // Admin override
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado (admin override or own)
      let targetMentoradoId = ctx.mentorado?.id;
      if (input.mentoradoId) {
        const isSelf = ctx.mentorado?.id === input.mentoradoId;
        if (!isSelf && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        targetMentoradoId = input.mentoradoId;
      }
      if (!targetMentoradoId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Perfil de mentorado necessário" });
      }

      // Validate and normalize phone if provided
      let normalizedPhone: string | undefined;
      if (input.telefone) {
        const phoneValidation = validateBrazilianPhone(input.telefone);
        if (!phoneValidation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: phoneValidation.error || "Telefone inválido",
          });
        }
        normalizedPhone = phoneValidation.normalized;
      }

      const [newLead] = await db
        .insert(leads)
        .values({
          mentoradoId: targetMentoradoId,
          nome: input.nome,
          email: input.email,
          telefone: normalizedPhone,
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
          objecoes: input.objecoes,
        })
        .returning({ id: leads.id });

      return newLead;
    }),

  update: protectedProcedure
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
        procedimentosInteresse: z.array(z.number()).optional(),
        historicoEstetico: z.string().optional(),
        alergias: z.string().optional(),
        tipoPele: z.string().optional(),
        disponibilidade: z.string().optional(),
        objecoes: z.array(z.string()).optional(),
        // Admin override
        mentoradoId: z.number().optional(),
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

      // 2. Ownership check with admin bypass
      const isOwner = ctx.mentorado?.id === lead.mentoradoId;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // 3. Validate and normalize phone if provided
      let normalizedPhone: string | undefined;
      if (input.telefone) {
        const phoneValidation = validateBrazilianPhone(input.telefone);
        if (!phoneValidation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: phoneValidation.error || "Telefone inválido",
          });
        }
        normalizedPhone = phoneValidation.normalized;
      }

      // 4. Update
      await db
        .update(leads)
        .set({
          nome: input.nome,
          email: input.email,
          telefone: normalizedPhone ?? input.telefone,
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
          objecoes: input.objecoes,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id));

      return { success: true };
    }),

  updateStatus: protectedProcedure
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
        // Admin override
        mentoradoId: z.number().optional(),
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

      // 2. Ownership check with admin bypass
      const isOwner = ctx.mentorado?.id === lead.mentoradoId;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) {
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

      // 4. Add auto interaction (use lead's mentorado for consistency)
      await db.insert(interacoes).values({
        leadId: lead.id,
        mentoradoId: lead.mentoradoId,
        tipo: "nota",
        notas: `Status alterado de "${lead.status}" para "${input.status}"`,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), mentoradoId: z.number().optional() }))
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

      // 2. Ownership check with admin bypass
      const isOwner = ctx.mentorado?.id === lead.mentoradoId;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      await db.delete(leads).where(eq(leads.id, input.id));

      return { success: true };
    }),

  addInteraction: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        tipo: z.enum(["ligacao", "email", "whatsapp", "reuniao", "nota"]),
        notas: z.string().optional(),
        duracao: z.number().optional(),
        // Admin override
        mentoradoId: z.number().optional(),
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

      // 2. Ownership check with admin bypass
      const isOwner = ctx.mentorado?.id === lead.mentoradoId;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const [newInteraction] = await db
        .insert(interacoes)
        .values({
          leadId: input.leadId,
          mentoradoId: lead.mentoradoId, // Use lead's mentorado for consistency
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
        mentoradoId: z.number().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Determine target mentorado (admin override or own)
      let targetMentoradoId = ctx.mentorado?.id;

      // If a specific mentoradoId is requested
      if (input.mentoradoId != null) {
        // If it's the user's own ID, allow it
        if (ctx.mentorado?.id === input.mentoradoId) {
          targetMentoradoId = input.mentoradoId;
        }
        // If it's different, only allow admins
        else if (ctx.user.role === "admin") {
          targetMentoradoId = input.mentoradoId;
        }
        // Otherwise forbidden
        else {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
      }

      if (!targetMentoradoId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Perfil de mentorado necessário",
        });
      }

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

      const [statsResult, origemResult, tempoFechamentoResult] = await Promise.all([
        // 1. General Stats
        db
          .select({
            total: sql<number>`count(*)`,
            ativos: sql<number>`count(*) filter (where ${leads.status} not in ('fechado', 'perdido'))`,
            ganhos: sql<number>`count(*) filter (where ${leads.status} = 'fechado')`,
            valorPipeline: sql<number>`sum(${leads.valorEstimado}) filter (where ${leads.status} not in ('fechado', 'perdido'))`,
          })
          .from(leads)
          .where(whereClause),

        // 2. Leads por Origem
        db
          .select({
            origem: leads.origem,
            count: sql<number>`count(*)`,
          })
          .from(leads)
          .where(whereClause)
          .groupBy(leads.origem),

        // 3. Average Closing Time (only for closed leads)
        db
          .select({
            avgTime: sql<number>`avg(extract(epoch from (${leads.updatedAt} - ${leads.createdAt})))`,
          })
          .from(leads)
          .where(and(whereClause, eq(leads.status, "fechado"))),
      ]);

      const stats = statsResult[0];
      const total = Number(stats?.total || 0);
      const ganhos = Number(stats?.ganhos || 0);
      const ativos = Number(stats?.ativos || 0);
      const valorPipelineCents = Number(stats?.valorPipeline || 0);

      const taxaConversao = total > 0 ? (ganhos / total) * 100 : 0;

      const avgTimeSeconds = Number(tempoFechamentoResult[0]?.avgTime || 0);
      const tempoMedioFechamento = Math.round(avgTimeSeconds / (24 * 60 * 60));

      const leadsPorOrigem = origemResult.reduce(
        (acc, curr) => {
          acc[curr.origem] = Number(curr.count);
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
  bulkUpdateStatus: protectedProcedure
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
        // Admin override
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const isAdmin = ctx.user.role === "admin";

      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      // Admin can update all requested leads, regular users only their own
      const validIds = isAdmin
        ? targets.map((l) => l.id)
        : targets.filter((l) => l.mentoradoId === ctx.mentorado?.id).map((l) => l.id);

      if (validIds.length === 0) return { count: 0 };

      await db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(inArray(leads.id, validIds));

      return { count: validIds.length };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()), mentoradoId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const isAdmin = ctx.user.role === "admin";

      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      // Admin can delete all requested leads, regular users only their own
      const validIds = isAdmin
        ? targets.map((l) => l.id)
        : targets.filter((l) => l.mentoradoId === ctx.mentorado?.id).map((l) => l.id);

      if (validIds.length === 0) return { count: 0 };

      await db.delete(leads).where(inArray(leads.id, validIds));
      return { count: validIds.length };
    }),

  bulkAddTags: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        tags: z.array(z.string()),
        mentoradoId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const isAdmin = ctx.user.role === "admin";

      const targets = await db
        .select({ id: leads.id, mentoradoId: leads.mentoradoId })
        .from(leads)
        .where(inArray(leads.id, input.ids));

      // Admin can update all requested leads, regular users only their own
      const validIds = isAdmin
        ? targets.map((l) => l.id)
        : targets.filter((l) => l.mentoradoId === ctx.mentorado?.id).map((l) => l.id);

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
