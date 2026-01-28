import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, like, sql, getTableColumns } from "drizzle-orm";
import { getDb } from "./db";
import { leads, interacoes, mentorados } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const leadsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        busca: z.string().optional(),
        status: z.string().optional(),
        origem: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      
      // Get mentoId from current user
      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      if (!mentorado) {
        return { leads: [], total: 0, page: input.page, totalPages: 0 };
      }

      const filters = [eq(leads.mentoradoId, mentorado.id)];

      if (input.busca) {
        const search = `%${input.busca}%`;
        filters.push(
          sql`(${leads.nome} ILIKE ${search} OR ${leads.email} ILIKE ${search} OR ${leads.telefone} ILIKE ${search})`
        );
      }

      if (input.status) {
        // @ts-expect-error Drizzle enum typing
        filters.push(eq(leads.status, input.status));
      }

      if (input.origem) {
        // @ts-expect-error Drizzle enum typing
        filters.push(eq(leads.origem, input.origem));
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

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      
      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
        with: {
          interacoes: {
            orderBy: [desc(interacoes.createdAt)],
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      // Check ownership or admin
      if (ctx.user.role !== "admin" && (!mentorado || lead.mentoradoId !== mentorado.id)) {
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      if (!mentorado) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Usuário não é um mentorado" });
      }

      const [newLead] = await db
        .insert(leads)
        .values({
          mentoradoId: mentorado.id,
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          origem: input.origem,
          valorEstimado: input.valorEstimado,
          status: "novo",
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      if (ctx.user.role !== "admin" && (!mentorado || lead.mentoradoId !== mentorado.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      await db
        .update(leads)
        .set({
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          valorEstimado: input.valorEstimado,
          tags: input.tags,
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
          "em_contato",
          "reuniao_agendada",
          "proposta_enviada",
          "negociacao",
          "fechado_ganho",
          "perdido",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      if (!mentorado || lead.mentoradoId !== mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      // Update status
      await db
        .update(leads)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id));

      // Add auto interaction
      await db.insert(interacoes).values({
        leadId: lead.id,
        mentoradoId: mentorado.id,
        tipo: "nota",
        notas: `Status alterado de "${lead.status}" para "${input.status}"`,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      if (ctx.user.role !== "admin" && (!mentorado || lead.mentoradoId !== mentorado.id)) {
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      if (!mentorado) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Usuário não é um mentorado" });
      }

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.leadId),
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      if (lead.mentoradoId !== mentorado.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const [newInteraction] = await db
        .insert(interacoes)
        .values({
          leadId: input.leadId,
          mentoradoId: mentorado.id,
          tipo: input.tipo,
          notas: input.notas,
          duracao: input.duracao,
        })
        .returning({ id: interacoes.id });

      // Update lead timestamp
      await db
        .update(leads)
        .set({ updatedAt: new Date() })
        .where(eq(leads.id, input.leadId));

      return newInteraction;
    }),

  stats: protectedProcedure
    .input(z.object({ periodo: z.enum(["7d", "30d", "90d"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const mentorado = await db.query.mentorados.findFirst({
        where: eq(mentorados.userId, ctx.user.id),
      });

      if (!mentorado) {
        return {
          totalAtivos: 0,
          taxaConversao: 0,
          tempoMedioFechamento: 0,
          valorPipeline: 0,
          leadsPorOrigem: [],
        };
      }

      const allLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.mentoradoId, mentorado.id));

      const ativos = allLeads.filter(
        l => l.status !== "fechado_ganho" && l.status !== "perdido"
      ).length;

      const ganhos = allLeads.filter(l => l.status === "fechado_ganho").length;
      const total = allLeads.length;
      const taxaConversao = total > 0 ? (ganhos / total) * 100 : 0;

      const valorPipeline = allLeads
        .filter(l => l.status !== "perdido" && l.status !== "fechado_ganho")
        .reduce((sum, l) => sum + (l.valorEstimado || 0), 0);

      // Simple stats for now, can be optimized with aggregations
      const leadsPorOrigem = allLeads.reduce((acc, curr) => {
        acc[curr.origem] = (acc[curr.origem] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAtivos: ativos,
        taxaConversao,
        tempoMedioFechamento: 0, // Placeholder
        valorPipeline,
        leadsPorOrigem,
      };
    }),
});
