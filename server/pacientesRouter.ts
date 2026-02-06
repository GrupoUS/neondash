/**
 * Pacientes Router - CRUD for patient management (Prontuário Estético)
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  pacientes,
  pacientesChatIa,
  pacientesDocumentos,
  pacientesFotos,
  pacientesInfoMedica,
  pacientesProcedimentos,
} from "../drizzle/schema";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const createPacienteSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  genero: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional().nullable(),
  cpf: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

const updatePacienteSchema = createPacienteSchema.partial().extend({
  id: z.number(),
  status: z.enum(["ativo", "inativo"]).optional(),
});

const upsertInfoMedicaSchema = z.object({
  pacienteId: z.number(),
  tipoSanguineo: z.string().optional().nullable(),
  alergias: z.string().optional().nullable(),
  medicamentosAtuais: z.string().optional().nullable(),
  condicoesPreexistentes: z.string().optional().nullable(),
  historicoCircurgico: z.string().optional().nullable(),
  contraindacacoes: z.string().optional().nullable(),
  observacoesClinicas: z.string().optional().nullable(),
});

const createProcedimentoSchema = z.object({
  pacienteId: z.number(),
  procedimentoId: z.number().optional().nullable(),
  nomeProcedimento: z.string().min(1, "Nome do procedimento é obrigatório"),
  dataRealizacao: z.string(),
  profissionalResponsavel: z.string().optional().nullable(),
  valorCobrado: z.number().optional().nullable(),
  valorReal: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  resultadoAvaliacao: z.string().optional().nullable(),
  areaAplicacao: z.string().optional().nullable(),
  produtosUtilizados: z.string().optional().nullable(),
  quantidadeAplicada: z.string().optional().nullable(),
  lotesProdutos: z.string().optional().nullable(),
});

const createFotoSchema = z.object({
  pacienteId: z.number(),
  procedimentoRealizadoId: z.number().optional().nullable(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  tipo: z.enum(["antes", "depois", "evolucao", "simulacao"]),
  angulo: z.enum(["frontal", "perfil_esquerdo", "perfil_direito", "obliquo"]).optional().nullable(),
  dataCaptura: z.string().optional(),
  descricao: z.string().optional().nullable(),
  areaFotografada: z.string().optional().nullable(),
  parComId: z.number().optional().nullable(),
  grupoId: z.string().optional().nullable(),
});

const createDocumentoSchema = z.object({
  pacienteId: z.number(),
  procedimentoRealizadoId: z.number().optional().nullable(),
  tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]),
  nome: z.string().min(1, "Nome do documento é obrigatório"),
  url: z.string().url(),
  mimeType: z.string().optional().nullable(),
  tamanhoBytes: z.number().optional().nullable(),
  dataAssinatura: z.string().optional().nullable(),
  assinadoPor: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

const createChatMessageSchema = z.object({
  pacienteId: z.number(),
  sessionId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  fotoId: z.number().optional().nullable(),
  imagemUrl: z.string().url().optional().nullable(),
  imagemGeradaUrl: z.string().url().optional().nullable(),
  tokens: z.number().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function verifyPatientOwnership(mentoradoId: number, pacienteId: number) {
  const db = getDb();
  const [paciente] = await db
    .select({ id: pacientes.id })
    .from(pacientes)
    .where(and(eq(pacientes.id, pacienteId), eq(pacientes.mentoradoId, mentoradoId)))
    .limit(1);

  if (!paciente) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Paciente não encontrado ou acesso negado",
    });
  }
  return paciente;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const pacientesRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // PACIENTES CRUD
  // ─────────────────────────────────────────────────────────────────────────

  list: mentoradoProcedure
    .input(
      z
        .object({
          status: z.enum(["ativo", "inativo"]).optional(),
          search: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;
      const { status, search, limit = 50, offset = 0 } = input ?? {};

      // Build conditions
      const conditions = [eq(pacientes.mentoradoId, mentoradoId)];
      if (status) {
        conditions.push(eq(pacientes.status, status));
      }
      if (search) {
        conditions.push(
          or(
            ilike(pacientes.nomeCompleto, `%${search}%`),
            ilike(pacientes.telefone, `%${search}%`)
          )!
        );
      }

      const result = await db
        .select()
        .from(pacientes)
        .where(and(...conditions))
        .orderBy(desc(pacientes.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pacientes)
        .where(and(...conditions));

      return {
        items: result,
        total: countResult?.count ?? 0,
      };
    }),

  getById: mentoradoProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    const [paciente] = await db
      .select()
      .from(pacientes)
      .where(and(eq(pacientes.id, input.id), eq(pacientes.mentoradoId, mentoradoId)))
      .limit(1);

    if (!paciente) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Paciente não encontrado",
      });
    }

    // Get related data
    const [infoMedica] = await db
      .select()
      .from(pacientesInfoMedica)
      .where(eq(pacientesInfoMedica.pacienteId, input.id))
      .limit(1);

    const procedimentos = await db
      .select()
      .from(pacientesProcedimentos)
      .where(eq(pacientesProcedimentos.pacienteId, input.id))
      .orderBy(desc(pacientesProcedimentos.dataRealizacao))
      .limit(10);

    const fotosRecentes = await db
      .select()
      .from(pacientesFotos)
      .where(eq(pacientesFotos.pacienteId, input.id))
      .orderBy(desc(pacientesFotos.dataCaptura))
      .limit(20);

    const documentos = await db
      .select()
      .from(pacientesDocumentos)
      .where(eq(pacientesDocumentos.pacienteId, input.id))
      .orderBy(desc(pacientesDocumentos.createdAt))
      .limit(20);

    // Calculate stats
    const [statsResult] = await db
      .select({
        totalProcedimentos: sql<number>`count(distinct ${pacientesProcedimentos.id})::int`,
        totalFotos: sql<number>`(select count(*) from ${pacientesFotos} where ${pacientesFotos.pacienteId} = ${input.id})::int`,
        totalDocumentos: sql<number>`(select count(*) from ${pacientesDocumentos} where ${pacientesDocumentos.pacienteId} = ${input.id})::int`,
        ultimoProcedimento: sql<Date | null>`max(${pacientesProcedimentos.dataRealizacao})`,
        valorTotalGasto: sql<number>`coalesce(sum(${pacientesProcedimentos.valorReal}), 0)::int`,
      })
      .from(pacientesProcedimentos)
      .where(eq(pacientesProcedimentos.pacienteId, input.id));

    return {
      ...paciente,
      infoMedica: infoMedica ?? null,
      procedimentos,
      fotosRecentes,
      documentos,
      stats: {
        totalProcedimentos: statsResult?.totalProcedimentos ?? 0,
        totalFotos: statsResult?.totalFotos ?? 0,
        totalDocumentos: statsResult?.totalDocumentos ?? 0,
        ultimoProcedimento: statsResult?.ultimoProcedimento ?? null,
        valorTotalGasto: statsResult?.valorTotalGasto ?? 0,
      },
    };
  }),

  create: mentoradoProcedure.input(createPacienteSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    const [newPaciente] = await db
      .insert(pacientes)
      .values({
        mentoradoId,
        nomeCompleto: input.nomeCompleto,
        email: input.email,
        telefone: input.telefone,
        dataNascimento: input.dataNascimento,
        genero: input.genero,
        cpf: input.cpf,
        endereco: input.endereco,
        fotoUrl: input.fotoUrl,
        observacoes: input.observacoes,
      })
      .returning();

    return newPaciente;
  }),

  update: mentoradoProcedure.input(updatePacienteSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    await verifyPatientOwnership(mentoradoId, input.id);

    const { id, ...updateData } = input;
    const [updated] = await db
      .update(pacientes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(pacientes.id, id))
      .returning();

    return updated;
  }),

  delete: mentoradoProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      await verifyPatientOwnership(mentoradoId, input.id);
      await db.delete(pacientes).where(eq(pacientes.id, input.id));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // INFO MÉDICA
  // ─────────────────────────────────────────────────────────────────────────

  infoMedica: router({
    get: mentoradoProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const [info] = await db
          .select()
          .from(pacientesInfoMedica)
          .where(eq(pacientesInfoMedica.pacienteId, input.pacienteId))
          .limit(1);

        return info ?? null;
      }),

    upsert: mentoradoProcedure.input(upsertInfoMedicaSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const { pacienteId, ...data } = input;

      // Check if exists
      const [existing] = await db
        .select({ id: pacientesInfoMedica.id })
        .from(pacientesInfoMedica)
        .where(eq(pacientesInfoMedica.pacienteId, pacienteId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(pacientesInfoMedica)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(pacientesInfoMedica.pacienteId, pacienteId))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(pacientesInfoMedica)
        .values({ pacienteId, ...data })
        .returning();
      return created;
    }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // PROCEDIMENTOS
  // ─────────────────────────────────────────────────────────────────────────

  procedimentos: router({
    list: mentoradoProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        return db
          .select()
          .from(pacientesProcedimentos)
          .where(eq(pacientesProcedimentos.pacienteId, input.pacienteId))
          .orderBy(desc(pacientesProcedimentos.dataRealizacao));
      }),

    create: mentoradoProcedure.input(createProcedimentoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const [created] = await db
        .insert(pacientesProcedimentos)
        .values({
          ...input,
          dataRealizacao: new Date(input.dataRealizacao),
        })
        .returning();
      return created;
    }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number(), pacienteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);
        await db.delete(pacientesProcedimentos).where(eq(pacientesProcedimentos.id, input.id));
        return { success: true };
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // FOTOS
  // ─────────────────────────────────────────────────────────────────────────

  fotos: router({
    list: mentoradoProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          tipo: z.enum(["antes", "depois", "evolucao", "simulacao"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const conditions = [eq(pacientesFotos.pacienteId, input.pacienteId)];
        if (input.tipo) {
          conditions.push(eq(pacientesFotos.tipo, input.tipo));
        }

        return db
          .select()
          .from(pacientesFotos)
          .where(and(...conditions))
          .orderBy(desc(pacientesFotos.dataCaptura));
      }),

    create: mentoradoProcedure.input(createFotoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const [created] = await db
        .insert(pacientesFotos)
        .values({
          ...input,
          dataCaptura: input.dataCaptura ? new Date(input.dataCaptura) : new Date(),
        })
        .returning();
      return created;
    }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number(), pacienteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);
        await db.delete(pacientesFotos).where(eq(pacientesFotos.id, input.id));
        return { success: true };
      }),

    getComparacoes: mentoradoProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        // Get photos that have parComId set (linked pairs)
        const fotos = await db
          .select()
          .from(pacientesFotos)
          .where(eq(pacientesFotos.pacienteId, input.pacienteId))
          .orderBy(desc(pacientesFotos.dataCaptura));

        // Group by grupoId or parComId
        const grupos = new Map<string, typeof fotos>();
        for (const foto of fotos) {
          const key = foto.grupoId ?? `pair_${foto.parComId ?? foto.id}`;
          if (!grupos.has(key)) {
            grupos.set(key, []);
          }
          grupos.get(key)!.push(foto);
        }

        // Generate comparison pairs
        const comparacoes: Array<{
          antes: (typeof fotos)[0] | null;
          depois: (typeof fotos)[0] | null;
          grupoId: string;
          areaFotografada: string | null;
        }> = [];

        for (const [grupoId, fotosGrupo] of grupos) {
          const antes = fotosGrupo.find((f) => f.tipo === "antes") ?? null;
          const depois = fotosGrupo.find((f) => f.tipo === "depois") ?? null;
          if (antes || depois) {
            comparacoes.push({
              antes,
              depois,
              grupoId,
              areaFotografada: antes?.areaFotografada ?? depois?.areaFotografada ?? null,
            });
          }
        }

        return comparacoes;
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTOS
  // ─────────────────────────────────────────────────────────────────────────

  documentos: router({
    list: mentoradoProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const conditions = [eq(pacientesDocumentos.pacienteId, input.pacienteId)];
        if (input.tipo) {
          conditions.push(eq(pacientesDocumentos.tipo, input.tipo));
        }

        return db
          .select()
          .from(pacientesDocumentos)
          .where(and(...conditions))
          .orderBy(desc(pacientesDocumentos.createdAt));
      }),

    create: mentoradoProcedure.input(createDocumentoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const [created] = await db
        .insert(pacientesDocumentos)
        .values({
          ...input,
          dataAssinatura: input.dataAssinatura ? new Date(input.dataAssinatura) : null,
        })
        .returning();
      return created;
    }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number(), pacienteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);
        await db.delete(pacientesDocumentos).where(eq(pacientesDocumentos.id, input.id));
        return { success: true };
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT IA
  // ─────────────────────────────────────────────────────────────────────────

  chatIa: router({
    getSession: mentoradoProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          sessionId: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const conditions = [eq(pacientesChatIa.pacienteId, input.pacienteId)];
        if (input.sessionId) {
          conditions.push(eq(pacientesChatIa.sessionId, input.sessionId));
        }

        return db
          .select()
          .from(pacientesChatIa)
          .where(and(...conditions))
          .orderBy(pacientesChatIa.createdAt);
      }),

    addMessage: mentoradoProcedure
      .input(createChatMessageSchema)
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const [created] = await db.insert(pacientesChatIa).values(input).returning();
        return created;
      }),

    listSessions: mentoradoProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        // Get distinct sessions with first message as preview
        const sessions = await db
          .select({
            sessionId: pacientesChatIa.sessionId,
            firstMessageAt: sql<Date>`min(${pacientesChatIa.createdAt})`,
            lastMessageAt: sql<Date>`max(${pacientesChatIa.createdAt})`,
            messageCount: sql<number>`count(*)::int`,
          })
          .from(pacientesChatIa)
          .where(eq(pacientesChatIa.pacienteId, input.pacienteId))
          .groupBy(pacientesChatIa.sessionId)
          .orderBy(desc(sql`max(${pacientesChatIa.createdAt})`));

        return sessions;
      }),

    deleteSession: mentoradoProcedure
      .input(z.object({ pacienteId: z.number(), sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        await db
          .delete(pacientesChatIa)
          .where(
            and(
              eq(pacientesChatIa.pacienteId, input.pacienteId),
              eq(pacientesChatIa.sessionId, input.sessionId)
            )
          );

        return { success: true };
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // TIMELINE
  // ─────────────────────────────────────────────────────────────────────────

  getTimeline: mentoradoProcedure
    .input(
      z.object({
        pacienteId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      // Union of procedures, photos, and documents ordered by date
      const procedimentosResult = await db
        .select({
          id: pacientesProcedimentos.id,
          data: pacientesProcedimentos.dataRealizacao,
          titulo: pacientesProcedimentos.nomeProcedimento,
          descricao: pacientesProcedimentos.observacoes,
        })
        .from(pacientesProcedimentos)
        .where(eq(pacientesProcedimentos.pacienteId, input.pacienteId));

      const fotosResult = await db
        .select({
          id: pacientesFotos.id,
          data: pacientesFotos.dataCaptura,
          titulo: sql<string>`concat(${pacientesFotos.tipo}, ' - ', coalesce(${pacientesFotos.areaFotografada}, 'Foto'))`,
          descricao: pacientesFotos.descricao,
          thumbnailUrl: pacientesFotos.thumbnailUrl,
        })
        .from(pacientesFotos)
        .where(eq(pacientesFotos.pacienteId, input.pacienteId));

      const documentosResult = await db
        .select({
          id: pacientesDocumentos.id,
          data: pacientesDocumentos.createdAt,
          titulo: pacientesDocumentos.nome,
          descricao: pacientesDocumentos.observacoes,
        })
        .from(pacientesDocumentos)
        .where(eq(pacientesDocumentos.pacienteId, input.pacienteId));

      // Combine and sort
      const timeline = [
        ...procedimentosResult.map((p) => ({
          ...p,
          tipo: "procedimento" as const,
          procedimentoId: p.id,
        })),
        ...fotosResult.map((f) => ({
          ...f,
          tipo: "foto" as const,
          fotoId: f.id,
        })),
        ...documentosResult.map((d) => ({
          ...d,
          tipo: "documento" as const,
          documentoId: d.id,
        })),
      ]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, input.limit);

      return timeline;
    }),
});
