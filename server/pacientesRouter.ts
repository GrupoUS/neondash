/**
 * Pacientes Router - CRUD for patient management (Prontuário Estético)
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  pacientes,
  pacientesChatIa,
  pacientesDocumentos,
  pacientesFotos,
  pacientesInfoMedica,
  pacientesProcedimentos,
  pacientesRelatoriosConsulta,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { createLogger } from "./_core/logger";
import { mentoradoProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { patientChat } from "./services/patientAiService";
import { storagePut } from "./storage";

const logger = createLogger({ service: "pacientesRouter" });

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const createPacienteSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome é obrigatório"),
  nomePreferido: z.string().optional().nullable(), // NEW
  email: z.union([z.string().email(), z.literal(""), z.null(), z.undefined()]),
  telefone: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  genero: z.enum(["masculino", "feminino", "outro", "prefiro_nao_dizer"]).optional().nullable(),
  cpf: z.string().optional().nullable(),
  rg: z.string().optional().nullable(), // NEW

  // Address
  endereco: z.string().optional().nullable(), // Legacy fallback
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),

  // Insurance
  convenio: z.string().optional().nullable(),
  numeroCarteirinha: z.string().optional().nullable(),

  // Medical Info (Optional Initial)
  infoMedica: z
    .object({
      tipoSanguineo: z.string().optional().nullable(),
      alergias: z.string().optional().nullable(),
      medicamentosAtuais: z.string().optional().nullable(),
      queixasPrincipais: z.array(z.string()).optional().nullable(),
    })
    .optional(),

  fotoUrl: z.string().url().optional().nullable(),
  observacoes: z.string().optional().nullable(),

  // Documents (Optional Initial)
  documentos: z
    .array(
      z.object({
        tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]),
        nome: z.string(),
        url: z.string(),
        mimeType: z.string().optional(),
        tamanhoBytes: z.number().optional(),
      })
    )
    .optional(),
});

const updatePacienteSchema = createPacienteSchema
  .omit({ infoMedica: true })
  .partial()
  .extend({
    id: z.number(),
    status: z.enum(["ativo", "inativo"]).optional(),
    // Add infoMedica back for update mutation transaction
    infoMedica: z
      .object({
        tipoSanguineo: z.string().optional().nullable(),
        alergias: z.string().optional().nullable(),
        medicamentosAtuais: z.string().optional().nullable(),
        queixasPrincipais: z.array(z.string()).optional().nullable(),
      })
      .optional(),
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

const updateProcedimentoSchema = createProcedimentoSchema.partial().extend({
  id: z.number(),
  pacienteId: z.number(),
});

const createFotoSchema = z.object({
  pacienteId: z.number(),
  procedimentoRealizadoId: z.number().optional().nullable(),
  url: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  tipo: z.enum(["antes", "depois", "evolucao", "simulacao"]),
  angulo: z.enum(["frontal", "perfil_esquerdo", "perfil_direito", "obliquo"]).optional().nullable(),
  dataCaptura: z.string().optional(),
  descricao: z.string().optional().nullable(),
  areaFotografada: z.string().optional().nullable(),
  parComId: z.number().optional().nullable(),
  grupoId: z.string().optional().nullable(),
});

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

const uploadFotoSchema = z.object({
  pacienteId: z.number(),
  fileData: z.string().min(1, "Arquivo é obrigatório"),
  thumbnailData: z.string().optional(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  tipo: z.enum(["antes", "depois", "evolucao", "simulacao"]),
  angulo: z.enum(["frontal", "perfil_esquerdo", "perfil_direito", "obliquo"]).optional().nullable(),
  descricao: z.string().optional().nullable(),
  areaFotografada: z.string().optional().nullable(),
  parComId: z.number().optional().nullable(),
  grupoId: z.string().optional().nullable(),
});

const uploadDocumentoSchema = z.object({
  pacienteId: z.number(),
  fileData: z.string().min(1, "Arquivo é obrigatório"),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]),
  nome: z.string().min(1, "Nome do documento é obrigatório"),
  observacoes: z.string().optional().nullable(),
});

const createDocumentoSchema = z.object({
  pacienteId: z.number(),
  procedimentoRealizadoId: z.number().optional().nullable(),
  tipo: z.enum(["consentimento", "exame", "prescricao", "outro"]),
  nome: z.string().min(1, "Nome do documento é obrigatório"),
  url: z.string().min(1),
  mimeType: z.string().optional().nullable(),
  tamanhoBytes: z.number().optional().nullable(),
  dataAssinatura: z.string().optional().nullable(),
  assinadoPor: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

const updateDocumentoSchema = createDocumentoSchema.partial().extend({
  id: z.number(),
  pacienteId: z.number(),
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

const saveGeneratedChatImageSchema = z
  .object({
    pacienteId: z.number(),
    chatMessageId: z.number().optional(),
    sessionId: z.string().optional(),
    imagemGeradaUrl: z.string().url().optional(),
    procedimentoRealizadoId: z.number().optional().nullable(),
    descricao: z.string().optional().nullable(),
    areaFotografada: z.string().optional().nullable(),
  })
  .refine((input) => Boolean(input.imagemGeradaUrl || input.chatMessageId || input.sessionId), {
    message: "Informe imagemGeradaUrl, chatMessageId ou sessionId",
    path: ["imagemGeradaUrl"],
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
          status: z.enum(["ativo", "inativo"]).optional().nullable(),
          search: z.string().optional().nullable(),
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
        .orderBy(desc(pacientes.updatedAt))
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

    const relatoriosConsulta = await db
      .select()
      .from(pacientesRelatoriosConsulta)
      .where(eq(pacientesRelatoriosConsulta.pacienteId, input.id))
      .orderBy(desc(pacientesRelatoriosConsulta.dataConsulta));

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
      relatoriosConsulta,
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

    // Sequential inserts (neon-http driver does not support transactions)
    const [newPaciente] = await db
      .insert(pacientes)
      .values({
        mentoradoId,
        nomeCompleto: input.nomeCompleto,
        nomePreferido: input.nomePreferido,
        email: input.email,
        telefone: input.telefone,
        dataNascimento: input.dataNascimento,
        genero: input.genero,
        cpf: input.cpf,
        rg: input.rg,

        // Address
        endereco: input.endereco,
        cep: input.cep,
        logradouro: input.logradouro,
        numero: input.numero,
        complemento: input.complemento,
        bairro: input.bairro,
        cidade: input.cidade,
        estado: input.estado,

        // Insurance
        convenio: input.convenio,
        numeroCarteirinha: input.numeroCarteirinha,

        fotoUrl: input.fotoUrl,
        observacoes: input.observacoes,
      })
      .returning();

    // Insert documents if provided
    if (input.documentos && input.documentos.length > 0) {
      await db.insert(pacientesDocumentos).values(
        input.documentos.map((doc) => ({
          pacienteId: newPaciente.id,
          tipo: doc.tipo,
          nome: doc.nome,
          url: doc.url,
          mimeType: doc.mimeType,
          tamanhoBytes: doc.tamanhoBytes,
        }))
      );
    }

    return newPaciente;
  }),

  // Upload Document Mutation
  uploadDocument: mentoradoProcedure
    .input(
      z.object({
        file: z.string(), // Base64
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode Base64
        const buffer = Buffer.from(input.file, "base64");

        // Upload to Storage
        const { url } = await storagePut(
          `pacientes/docs/${ctx.mentorado.id}/${Date.now()}-${input.fileName}`,
          buffer,
          input.contentType
        );

        return { url };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Upload de documento falhou:", { error: message });

        // If storage credentials are missing, return a clear error so frontend can handle it
        if (message.includes("Storage proxy credentials missing")) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Serviço de armazenamento não configurado. O paciente será criado sem documentos.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao fazer upload do documento",
        });
      }
    }),

  update: mentoradoProcedure.input(updatePacienteSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const mentoradoId = ctx.mentorado.id;

    await verifyPatientOwnership(mentoradoId, input.id);

    // Sequential queries (neon-http driver does not support transactions)
    const { id, infoMedica, ...updateData } = input;

    // Update patient core data
    const [updated] = await db
      .update(pacientes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(pacientes.id, id))
      .returning();

    // Upsert medical info if provided
    if (infoMedica) {
      const [existingInfo] = await db
        .select({ id: pacientesInfoMedica.id })
        .from(pacientesInfoMedica)
        .where(eq(pacientesInfoMedica.pacienteId, id))
        .limit(1);

      if (existingInfo) {
        await db
          .update(pacientesInfoMedica)
          .set({
            ...infoMedica,
            updatedAt: new Date(),
          })
          .where(eq(pacientesInfoMedica.id, existingInfo.id));
      } else {
        await db.insert(pacientesInfoMedica).values({
          pacienteId: id,
          tipoSanguineo: infoMedica.tipoSanguineo,
          alergias: infoMedica.alergias,
          medicamentosAtuais: infoMedica.medicamentosAtuais,
          queixasPrincipais: infoMedica.queixasPrincipais,
        });
      }
    }

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
  // IMPORTAÇÃO INTELIGENTE
  // ─────────────────────────────────────────────────────────────────────────

  getImportMapping: mentoradoProcedure
    .input(
      z.object({
        headers: z.array(z.string()),
        sampleRows: z.array(z.record(z.string(), z.any())).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use LLM core utility to map columns

      const systemPrompt = `
      Você é um especialista em integração de dados médicos.
      Sua tarefa é mapear colunas de uma planilha (CSV/XLSX) para o schema do banco de dados de pacientes.

      Schema Alvo (Pacientes):
      - nomeCompleto (Obrigatório)
      - email
      - telefone (celular com DDD)
      - dataNascimento (converter para YYYY-MM-DD)
      - cpf
      - rg
      - genero (masculino, feminino, outro)
      - endereco
      - bairro
      - cidade
      - estado (UF)
      - convenio
      - numeroCarteirinha (número do convênio)
      - numeroProntuario
      - observacoes

      Instruções:
      1. Analise os 'Headers' e 'Amostras' fornecidos.
      2. Retorne um JSON onde:
         - A chave é o nome da coluna original (Header).
         - O valor é o nome do campo no Schema Alvo.
      3. Se uma coluna não corresponder a nada, ignore-a (não inclua no JSON).
      4. A coluna de NOME é obrigatória. Tente identificar com variações como "Paciente", "Nome", "Cliente".
      5. Identifique colunas de CONTATO como telefone/email.

      Response Format (JSON only):
      {
        "Nome da Coluna Original": "nomeFieldNoSchema"
      }
      `;

      const userPrompt = `
      Headers: ${JSON.stringify(input.headers)}
      Sample Rows: ${JSON.stringify(input.sampleRows.slice(0, 3))}
      `;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          responseFormat: { type: "json_object" },
          model: "gemini-1.5-flash", // Use fast model
        });

        const content = result.choices[0]?.message?.content;
        if (!content) return {};

        return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      } catch (error) {
        logger.error("Erro ao mapear colunas com IA:", { error });
        // Fallback: exact match
        const mapping: Record<string, string> = {};
        const targetFields = ["nomeCompleto", "email", "telefone", "dataNascimento", "cpf"];

        input.headers.forEach((header) => {
          const normalized = header.toLowerCase().replace(/[^a-z]/g, "");
          const match = targetFields.find((f) => f.toLowerCase() === normalized);
          if (match) mapping[header] = match;
        });

        return mapping;
      }
    }),

  bulkCreate: mentoradoProcedure
    .input(z.array(createPacienteSchema))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const mentoradoId = ctx.mentorado.id;

      if (input.length === 0) return { count: 0 };

      // Process in chunks of 50 to avoid big transactions blocking
      const chunkSize = 50;
      let totalCreated = 0;

      for (let i = 0; i < input.length; i += chunkSize) {
        const chunk = input.slice(i, i + chunkSize);

        // Direct insert per chunk (neon-http driver does not support transactions)
        const valuesToInsert = chunk.map((p) => ({
          mentoradoId,
          nomeCompleto: p.nomeCompleto,
          email: p.email || null,
          telefone: p.telefone,
          dataNascimento: p.dataNascimento,
          genero: p.genero,
          cpf: p.cpf,
          rg: p.rg,
          endereco: p.endereco,
          cep: p.cep,
          logradouro: p.logradouro,
          numero: p.numero,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.estado,
          convenio: p.convenio,
          numeroCarteirinha: p.numeroCarteirinha,
          observacoes: p.observacoes,
          status: "ativo" as const,
        }));

        await db.insert(pacientes).values(valuesToInsert);
        totalCreated += chunk.length;
      }

      return { count: totalCreated };
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
  // RELATÓRIOS DE CONSULTA
  // ─────────────────────────────────────────────────────────────────────────

  relatorios: router({
    list: mentoradoProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        return db
          .select()
          .from(pacientesRelatoriosConsulta)
          .where(eq(pacientesRelatoriosConsulta.pacienteId, input.pacienteId))
          .orderBy(desc(pacientesRelatoriosConsulta.dataConsulta));
      }),

    create: mentoradoProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          dataConsulta: z.string().min(1, "Data é obrigatória"),
          observacao: z.string().min(1, "Observação é obrigatória"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const [created] = await db
          .insert(pacientesRelatoriosConsulta)
          .values({
            pacienteId: input.pacienteId,
            dataConsulta: input.dataConsulta,
            observacao: input.observacao,
          })
          .returning();
        return created;
      }),

    update: mentoradoProcedure
      .input(
        z.object({
          id: z.number(),
          pacienteId: z.number(),
          dataConsulta: z.string().optional(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        const { id, pacienteId, ...data } = input;
        const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
        if (data.dataConsulta !== undefined) updatePayload.dataConsulta = data.dataConsulta;
        if (data.observacao !== undefined) updatePayload.observacao = data.observacao;

        const [updated] = await db
          .update(pacientesRelatoriosConsulta)
          .set(updatePayload)
          .where(
            and(
              eq(pacientesRelatoriosConsulta.id, id),
              eq(pacientesRelatoriosConsulta.pacienteId, pacienteId)
            )
          )
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Relatório não encontrado",
          });
        }
        return updated;
      }),

    delete: mentoradoProcedure
      .input(z.object({ id: z.number(), pacienteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        await db
          .delete(pacientesRelatoriosConsulta)
          .where(
            and(
              eq(pacientesRelatoriosConsulta.id, input.id),
              eq(pacientesRelatoriosConsulta.pacienteId, input.pacienteId)
            )
          );
        return { success: true };
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

    update: mentoradoProcedure.input(updateProcedimentoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const { id, pacienteId, dataRealizacao, ...updateData } = input;
      const [updated] = await db
        .update(pacientesProcedimentos)
        .set({
          ...updateData,
          dataRealizacao: dataRealizacao === undefined ? undefined : new Date(dataRealizacao),
          updatedAt: new Date(),
        })
        .where(
          and(eq(pacientesProcedimentos.id, id), eq(pacientesProcedimentos.pacienteId, pacienteId))
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Procedimento não encontrado",
        });
      }

      return updated;
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

    upload: mentoradoProcedure.input(uploadFotoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      // Validate base64 size
      const rawSize = Math.ceil((input.fileData.length * 3) / 4);
      if (rawSize > MAX_PHOTO_SIZE) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Arquivo excede o limite de ${MAX_PHOTO_SIZE / 1024 / 1024}MB`,
        });
      }

      const dataUrl = `data:${input.contentType};base64,${input.fileData}`;
      const thumbnailUrl = input.thumbnailData
        ? `data:${input.contentType};base64,${input.thumbnailData}`
        : null;

      const [created] = await db
        .insert(pacientesFotos)
        .values({
          pacienteId: input.pacienteId,
          url: dataUrl,
          thumbnailUrl,
          tipo: input.tipo,
          angulo: input.angulo ?? null,
          dataCaptura: new Date(),
          descricao: input.descricao ?? null,
          areaFotografada: input.areaFotografada ?? null,
          parComId: input.parComId ?? null,
          grupoId: input.grupoId ?? null,
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

    update: mentoradoProcedure.input(updateDocumentoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      const { id, pacienteId, dataAssinatura, ...updateData } = input;
      const [updated] = await db
        .update(pacientesDocumentos)
        .set({
          ...updateData,
          dataAssinatura:
            dataAssinatura === undefined
              ? undefined
              : dataAssinatura
                ? new Date(dataAssinatura)
                : null,
        })
        .where(and(eq(pacientesDocumentos.id, id), eq(pacientesDocumentos.pacienteId, pacienteId)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      return updated;
    }),

    upload: mentoradoProcedure.input(uploadDocumentoSchema).mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

      // Validate base64 size
      const rawSize = Math.ceil((input.fileData.length * 3) / 4);
      if (rawSize > MAX_DOC_SIZE) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Arquivo excede o limite de ${MAX_DOC_SIZE / 1024 / 1024}MB`,
        });
      }

      const dataUrl = `data:${input.contentType};base64,${input.fileData}`;

      const [created] = await db
        .insert(pacientesDocumentos)
        .values({
          pacienteId: input.pacienteId,
          tipo: input.tipo,
          nome: input.nome,
          url: dataUrl,
          mimeType: input.contentType,
          tamanhoBytes: rawSize,
          observacoes: input.observacoes ?? null,
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

    // AI Response Generation using Gemini
    generateResponse: mentoradoProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          sessionId: z.string(),
          userMessage: z.string().min(1),
          imagemUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        // Get patient name for context
        const [patient] = await db
          .select({ nomeCompleto: pacientes.nomeCompleto })
          .from(pacientes)
          .where(eq(pacientes.id, input.pacienteId))
          .limit(1);

        if (!patient) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
        }

        // Get chat history for context
        const history = await db
          .select({
            role: pacientesChatIa.role,
            content: pacientesChatIa.content,
            imagemUrl: pacientesChatIa.imagemUrl,
          })
          .from(pacientesChatIa)
          .where(
            and(
              eq(pacientesChatIa.pacienteId, input.pacienteId),
              eq(pacientesChatIa.sessionId, input.sessionId)
            )
          )
          .orderBy(pacientesChatIa.createdAt);

        // Add user message to history
        const messages = [
          ...history.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
            imagemUrl: m.imagemUrl,
          })),
          {
            role: "user" as const,
            content: input.userMessage,
            imagemUrl: input.imagemUrl,
          },
        ];

        // Save user message
        const [userMsg] = await db
          .insert(pacientesChatIa)
          .values({
            pacienteId: input.pacienteId,
            sessionId: input.sessionId,
            role: "user",
            content: input.userMessage,
            imagemUrl: input.imagemUrl || null,
          })
          .returning();

        // Generate AI response using Gemini
        const aiResult = await patientChat(
          messages,
          {
            mentoradoId: ctx.mentorado.id,
            pacienteId: input.pacienteId,
            patientName: patient.nomeCompleto,
          },
          {
            generateImage: true,
          }
        );

        if (!aiResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: aiResult.error || "Erro ao gerar resposta da IA",
          });
        }

        // Save AI response
        const [aiMsg] = await db
          .insert(pacientesChatIa)
          .values({
            pacienteId: input.pacienteId,
            sessionId: input.sessionId,
            role: "assistant",
            content: aiResult.message,
            imagemGeradaUrl: aiResult.generatedImageUrl || null,
            metadata: aiResult.toolsUsed ? { toolsUsed: aiResult.toolsUsed } : null,
          })
          .returning();

        return {
          userMessage: userMsg,
          aiResponse: aiMsg,
          toolsUsed: aiResult.toolsUsed,
        };
      }),

    saveGeneratedImageAsFoto: mentoradoProcedure
      .input(saveGeneratedChatImageSchema)
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        await verifyPatientOwnership(ctx.mentorado.id, input.pacienteId);

        let imageUrl = input.imagemGeradaUrl ?? null;
        let sourceChatMessageId = input.chatMessageId ?? null;
        let sourceSessionId = input.sessionId ?? null;
        let sourceDescription: string | null = null;

        if (!imageUrl) {
          const conditions = [
            eq(pacientesChatIa.pacienteId, input.pacienteId),
            eq(pacientesChatIa.role, "assistant"),
            isNotNull(pacientesChatIa.imagemGeradaUrl),
          ];

          if (input.chatMessageId) {
            conditions.push(eq(pacientesChatIa.id, input.chatMessageId));
          }

          if (input.sessionId) {
            conditions.push(eq(pacientesChatIa.sessionId, input.sessionId));
          }

          const [chatWithImage] = await db
            .select({
              id: pacientesChatIa.id,
              sessionId: pacientesChatIa.sessionId,
              imagemGeradaUrl: pacientesChatIa.imagemGeradaUrl,
              content: pacientesChatIa.content,
            })
            .from(pacientesChatIa)
            .where(and(...conditions))
            .orderBy(desc(pacientesChatIa.createdAt))
            .limit(1);

          if (!chatWithImage?.imagemGeradaUrl) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Imagem gerada não encontrada no histórico do chat",
            });
          }

          imageUrl = chatWithImage.imagemGeradaUrl;
          sourceChatMessageId = chatWithImage.id;
          sourceSessionId = chatWithImage.sessionId;
          sourceDescription = chatWithImage.content;
        }

        const [createdFoto] = await db
          .insert(pacientesFotos)
          .values({
            pacienteId: input.pacienteId,
            procedimentoRealizadoId: input.procedimentoRealizadoId ?? null,
            url: imageUrl,
            thumbnailUrl: imageUrl,
            tipo: "simulacao",
            dataCaptura: new Date(),
            descricao:
              input.descricao ??
              (sourceDescription
                ? `Simulação IA: ${sourceDescription.slice(0, 200)}`
                : `Simulação gerada via Chat IA${sourceSessionId ? ` (sessão ${sourceSessionId})` : ""}`),
            areaFotografada: input.areaFotografada ?? null,
          })
          .returning();

        return {
          foto: createdFoto,
          sourceChatMessageId,
          sourceSessionId,
        };
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

      // Union of procedures, photos, documents and chat events ordered by date
      const procedimentosResult = await db
        .select({
          id: pacientesProcedimentos.id,
          data: pacientesProcedimentos.dataRealizacao,
          titulo: pacientesProcedimentos.titulo,
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

      const chatResult = await db
        .select({
          id: pacientesChatIa.id,
          data: pacientesChatIa.createdAt,
          titulo: sql<string>`case
            when ${pacientesChatIa.role} = 'assistant' then 'Chat IA: Resposta'
            when ${pacientesChatIa.role} = 'user' then 'Chat IA: Mensagem'
            else 'Chat IA: Sistema'
          end`,
          descricao: pacientesChatIa.content,
          sessionId: pacientesChatIa.sessionId,
          origemFoto: sql<string | null>`case
            when ${pacientesChatIa.fotoId} is not null then 'galeria'
            when ${pacientesChatIa.imagemUrl} is not null then 'url'
            else null
          end`,
          imagemGeradaUrl: pacientesChatIa.imagemGeradaUrl,
        })
        .from(pacientesChatIa)
        .where(eq(pacientesChatIa.pacienteId, input.pacienteId));

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
        ...chatResult.map((c) => ({
          id: c.id,
          data: c.data,
          titulo: c.titulo,
          descricao: c.descricao,
          tipo: "chat" as const,
          chatId: c.id,
          metadata: {
            sessionId: c.sessionId,
            origemFoto: c.origemFoto,
            imagemGeradaUrl: c.imagemGeradaUrl,
          },
        })),
      ]
        .sort(
          (a, b) =>
            (b.data ? new Date(b.data).getTime() : 0) - (a.data ? new Date(a.data).getTime() : 0)
        )
        .slice(0, input.limit);

      return timeline;
    }),
});
