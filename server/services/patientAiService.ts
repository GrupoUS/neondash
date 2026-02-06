/**
 * Patient AI Service
 *
 * Uses Vercel AI SDK with Google Gemini to provide an intelligent assistant
 * for patient prontuário analysis, procedure recommendations, and simulations.
 */

import { generateText, tool } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  pacientes,
  pacientesFotos,
  pacientesInfoMedica,
  pacientesProcedimentos,
} from "../../drizzle/schema";
import { defaultModel, isAIConfigured } from "../_core/aiProvider";
import { getDb } from "../db";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PatientChatContext {
  mentoradoId: number;
  pacienteId: number;
  patientName: string;
}

export interface PatientChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imagemUrl?: string | null;
}

export interface PatientChatResult {
  success: boolean;
  message: string;
  toolsUsed?: string[];
  generatedImageUrl?: string | null;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const PATIENT_SYSTEM_PROMPT = `Você é o **Assistente IA de Prontuário**, especializado em análise de pacientes de clínicas de estética.

## Seu Papel
Você ajuda profissionais de estética a:
- Analisar o histórico do paciente
- Sugerir procedimentos adequados ao perfil
- Comparar fotos antes/depois
- Recomendar protocolos personalizados
- Fornecer insights sobre tratamentos estéticos

## Ferramentas Disponíveis
- **getPatientInfo**: Informações básicas do paciente
- **getMedicalInfo**: Histórico médico, alergias, contraindicações
- **getProcedureHistory**: Procedimentos já realizados
- **getPhotos**: Fotos do paciente (antes/depois/evolução)

## Diretrizes
1. Sempre responda em **português brasileiro**
2. Seja objetivo e forneça **insights clínicos acionáveis**
3. Use dados reais do prontuário - nunca invente informações
4. Considere **contraindicações** antes de sugerir procedimentos
5. Sugira protocolos baseados em evidências
6. Use emojis moderadamente para tornar a conversa amigável

## Análise de Imagens
Quando o usuário enviar uma foto:
- Descreva o que observa na imagem
- Identifique áreas de atenção clínica
- Sugira procedimentos adequados
- Compare com fotos anteriores se disponíveis

## Simulações
Para pedidos de simulação, descreva detalhadamente:
- O resultado esperado do procedimento
- Técnicas recomendadas
- Produtos adequados
- Timeline de resultados

## Formatação
Use markdown para formatar respostas:
- Listas para itens
- **Negrito** para destacar
- Tabelas para comparações
`;

// ═══════════════════════════════════════════════════════════════════════════
// TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

function createPatientTools(ctx: PatientChatContext) {
  const db = getDb();

  return {
    getPatientInfo: tool({
      description: "Obter informações básicas do paciente (nome, idade, gênero, contato).",
      parameters: z.object({}),
      execute: async () => {
        const [patient] = await db
          .select({
            nomeCompleto: pacientes.nomeCompleto,
            email: pacientes.email,
            telefone: pacientes.telefone,
            dataNascimento: pacientes.dataNascimento,
            genero: pacientes.genero,
            observacoes: pacientes.observacoes,
            createdAt: pacientes.createdAt,
          })
          .from(pacientes)
          .where(eq(pacientes.id, ctx.pacienteId))
          .limit(1);

        if (!patient) {
          return { status: "error", message: "Paciente não encontrado.", data: null };
        }

        // Calculate age if birth date exists
        let idade = null;
        if (patient.dataNascimento) {
          const birth = new Date(patient.dataNascimento);
          const today = new Date();
          idade = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            idade--;
          }
        }

        return {
          status: "success",
          message: `Informações do paciente ${patient.nomeCompleto}.`,
          data: { ...patient, idade },
        };
      },
    }),

    getMedicalInfo: tool({
      description:
        "Obter histórico médico do paciente (alergias, medicamentos, contraindicações, histórico cirúrgico).",
      parameters: z.object({}),
      execute: async () => {
        const [medical] = await db
          .select({
            tipoSanguineo: pacientesInfoMedica.tipoSanguineo,
            alergias: pacientesInfoMedica.alergias,
            medicamentosAtuais: pacientesInfoMedica.medicamentosAtuais,
            condicoesPreexistentes: pacientesInfoMedica.condicoesPreexistentes,
            historicoCircurgico: pacientesInfoMedica.historicoCircurgico,
            contraindacacoes: pacientesInfoMedica.contraindacacoes,
            observacoesClinicas: pacientesInfoMedica.observacoesClinicas,
          })
          .from(pacientesInfoMedica)
          .where(eq(pacientesInfoMedica.pacienteId, ctx.pacienteId))
          .limit(1);

        if (!medical) {
          return {
            status: "empty",
            message: "Histórico médico não cadastrado.",
            data: null,
          };
        }

        return {
          status: "success",
          message: "Histórico médico do paciente.",
          data: medical,
        };
      },
    }),

    getProcedureHistory: tool({
      description: "Obter histórico de procedimentos realizados no paciente.",
      parameters: z.object({
        limit: z
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe("Número de procedimentos para buscar"),
      }),
      execute: async ({ limit }) => {
        const procedures = await db
          .select({
            id: pacientesProcedimentos.id,
            nomeProcedimento: pacientesProcedimentos.nomeProcedimento,
            dataRealizacao: pacientesProcedimentos.dataRealizacao,
            profissionalResponsavel: pacientesProcedimentos.profissionalResponsavel,
            valorCobrado: pacientesProcedimentos.valorCobrado,
            areaAplicacao: pacientesProcedimentos.areaAplicacao,
            produtosUtilizados: pacientesProcedimentos.produtosUtilizados,
            quantidadeAplicada: pacientesProcedimentos.quantidadeAplicada,
            observacoes: pacientesProcedimentos.observacoes,
            resultadoAvaliacao: pacientesProcedimentos.resultadoAvaliacao,
          })
          .from(pacientesProcedimentos)
          .where(eq(pacientesProcedimentos.pacienteId, ctx.pacienteId))
          .orderBy(desc(pacientesProcedimentos.dataRealizacao))
          .limit(limit);

        if (procedures.length === 0) {
          return {
            status: "empty",
            message: "Nenhum procedimento registrado.",
            data: [],
          };
        }

        // Calculate total spent
        const totalGasto = procedures.reduce((sum, p) => sum + (p.valorCobrado || 0), 0);

        return {
          status: "success",
          message: `${procedures.length} procedimentos encontrados. Total investido: R$ ${(totalGasto / 100).toFixed(2)}`,
          data: procedures,
        };
      },
    }),

    getPhotos: tool({
      description: "Obter fotos do paciente para análise visual (antes/depois/evolução).",
      parameters: z.object({
        tipo: z
          .enum(["antes", "depois", "evolucao", "simulacao"])
          .optional()
          .describe("Filtrar por tipo de foto"),
        limit: z.number().min(1).max(20).default(10).describe("Número de fotos"),
      }),
      execute: async ({ tipo, limit }) => {
        const conditions = [eq(pacientesFotos.pacienteId, ctx.pacienteId)];
        if (tipo) {
          conditions.push(eq(pacientesFotos.tipo, tipo));
        }

        const photos = await db
          .select({
            id: pacientesFotos.id,
            url: pacientesFotos.url,
            tipo: pacientesFotos.tipo,
            angulo: pacientesFotos.angulo,
            areaFotografada: pacientesFotos.areaFotografada,
            dataCaptura: pacientesFotos.dataCaptura,
            descricao: pacientesFotos.descricao,
          })
          .from(pacientesFotos)
          .where(and(...conditions))
          .orderBy(desc(pacientesFotos.dataCaptura))
          .limit(limit);

        if (photos.length === 0) {
          return {
            status: "empty",
            message: tipo ? `Nenhuma foto tipo "${tipo}" encontrada.` : "Nenhuma foto cadastrada.",
            data: [],
          };
        }

        return {
          status: "success",
          message: `${photos.length} fotos encontradas.`,
          data: photos,
        };
      },
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a patient chat message and generate a response using AI with tools.
 */
export async function patientChat(
  messages: PatientChatMessage[],
  context: PatientChatContext
): Promise<PatientChatResult> {
  if (!isAIConfigured()) {
    return {
      success: false,
      message: "Serviço de IA não configurado. Configure GOOGLE_GENERATIVE_AI_API_KEY.",
      error: "AI_NOT_CONFIGURED",
    };
  }

  try {
    const tools = createPatientTools(context);

    // Build context-aware system prompt
    const systemPrompt = `${PATIENT_SYSTEM_PROMPT}

## Contexto Atual
Você está analisando o prontuário do(a) paciente: **${context.patientName}**
Paciente ID: ${context.pacienteId}

Use as ferramentas disponíveis para buscar informações do prontuário antes de responder.
`;

    // Convert messages to AI SDK format, handling images
    // Use explicit typing to avoid CoreMessage incompatibility
    const formattedMessages = messages.map((m) => {
      if (m.imagemUrl && m.role === "user") {
        return {
          role: "user" as const,
          content: [
            { type: "text" as const, text: m.content },
            { type: "image" as const, image: m.imagemUrl },
          ],
        };
      }
      // For all other messages, return simple text format
      return {
        role: m.role as "user" | "assistant",
        content: m.content,
      };
    });

    // Early cast to avoid deep type instantiation issues
    const result = await generateText({
      model: defaultModel,
      system: systemPrompt,
      messages: formattedMessages as Parameters<typeof generateText>[0]["messages"],
      tools,
      maxSteps: 5, // Allow up to 5 tool calls
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
    console.error("[Patient AI] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMessage.includes("API key")) {
      return {
        success: false,
        message: "Erro de autenticação com a API de IA.",
        error: "AUTH_ERROR",
      };
    }

    return {
      success: false,
      message: "Erro ao processar mensagem. Tente novamente.",
      error: errorMessage,
    };
  }
}
