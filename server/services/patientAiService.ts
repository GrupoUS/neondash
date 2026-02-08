/**
 * Patient AI Service
 *
 * Uses @google/genai SDK directly with Gemini 3 Flash for patient chat.
 * The native SDK handles thought_signature management automatically,
 * which is mandatory for Gemini 3 multi-step function calling.
 *
 * @ai-sdk/google v1 strips thought signatures, causing 400 errors.
 * See: https://ai.google.dev/gemini-api/docs/thought-signatures
 */

import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import { and, desc, eq } from "drizzle-orm";
import {
  pacientes,
  pacientesFotos,
  pacientesInfoMedica,
  pacientesProcedimentos,
} from "../../drizzle/schema";
import { getGeminiClient, isAIConfigured } from "../_core/aiProvider";
import { generateImage } from "../_core/imageGeneration";
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

export interface PatientChatOptions {
  generateImage?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MODEL = "gemini-3-flash-preview";
const MAX_TOOL_STEPS = 5;

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
// TOOL DECLARATIONS (Google GenAI format)
// ═══════════════════════════════════════════════════════════════════════════

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "getPatientInfo",
    description: "Obter informações básicas do paciente (nome, idade, gênero, contato).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "getMedicalInfo",
    description:
      "Obter histórico médico do paciente (alergias, medicamentos, contraindicações, histórico cirúrgico).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "getProcedureHistory",
    description: "Obter histórico de procedimentos realizados no paciente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "Número de procedimentos para buscar (1-20, padrão 10)",
        },
      },
    },
  },
  {
    name: "getPhotos",
    description: "Obter fotos do paciente para análise visual (antes/depois/evolução).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo: {
          type: Type.STRING,
          description: "Filtrar por tipo de foto: antes, depois, evolucao, simulacao",
        },
        limit: {
          type: Type.NUMBER,
          description: "Número de fotos (1-20, padrão 10)",
        },
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  ctx: PatientChatContext
): Promise<unknown> {
  const db = getDb();

  switch (toolName) {
    case "getPatientInfo": {
      const [patient] = await db
        .select({
          nomeCompleto: pacientes.nomeCompleto,
          email: pacientes.email,
          telefone: pacientes.telefone,
          dataNascimento: pacientes.dataNascimento,
          genero: pacientes.genero,
          observacoes: pacientes.observacoes,
          updatedAt: pacientes.updatedAt,
        })
        .from(pacientes)
        .where(eq(pacientes.id, ctx.pacienteId))
        .limit(1);

      if (!patient) {
        return { status: "error", message: "Paciente não encontrado.", data: null };
      }

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
    }

    case "getMedicalInfo": {
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
        return { status: "empty", message: "Histórico médico não cadastrado.", data: null };
      }

      return { status: "success", message: "Histórico médico do paciente.", data: medical };
    }

    case "getProcedureHistory": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      const procedures = await db
        .select({
          id: pacientesProcedimentos.id,
          titulo: pacientesProcedimentos.titulo,
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
        return { status: "empty", message: "Nenhum procedimento registrado.", data: [] };
      }

      const totalGasto = procedures.reduce((sum, p) => sum + (p.valorCobrado || 0), 0);
      return {
        status: "success",
        message: `${procedures.length} procedimentos encontrados. Total investido: R$ ${(totalGasto / 100).toFixed(2)}`,
        data: procedures,
      };
    }

    case "getPhotos": {
      const tipo = args.tipo as string | undefined;
      const photoLimit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      const conditions = [eq(pacientesFotos.pacienteId, ctx.pacienteId)];
      if (tipo && ["antes", "depois", "evolucao", "simulacao"].includes(tipo)) {
        conditions.push(
          eq(pacientesFotos.tipo, tipo as "antes" | "depois" | "evolucao" | "simulacao")
        );
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
        .limit(photoLimit);

      if (photos.length === 0) {
        return {
          status: "empty",
          message: tipo ? `Nenhuma foto tipo "${tipo}" encontrada.` : "Nenhuma foto cadastrada.",
          data: [],
        };
      }

      return { status: "success", message: `${photos.length} fotos encontradas.`, data: photos };
    }

    default:
      return { status: "error", message: `Ferramenta "${toolName}" não reconhecida.` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const IMAGE_GENERATION_KEYWORDS = [
  "simula",
  "simulação",
  "simulacao",
  "simular",
  "antes e depois",
  "harmonização",
  "harmonizacao",
  "preenchimento",
  "botox",
];

function getLatestUserMessage(messages: PatientChatMessage[]): PatientChatMessage | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === "user") {
      return message;
    }
  }
  return null;
}

function shouldGenerateSimulationImage(message: PatientChatMessage): boolean {
  if (message.imagemUrl) return true;
  const normalizedContent = message.content.toLowerCase();
  return IMAGE_GENERATION_KEYWORDS.some((keyword) => normalizedContent.includes(keyword));
}

function buildSimulationImagePrompt(params: {
  patientName: string;
  userMessage: string;
  assistantMessage: string;
}): string {
  return [
    `Simulação estética para o(a) paciente ${params.patientName}.`,
    `Pedido do profissional: ${params.userMessage}`,
    `Direcionamento clínico da análise: ${params.assistantMessage}`,
    "Gere uma imagem de simulação com aparência natural, iluminação clínica neutra e enquadramento facial.",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type ChatPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type ChatContent = { role: "user" | "model"; parts: ChatPart[] };

/** Parse a data-URL into an inlineData part, or null if not a valid data-URL. */
function parseDataUrl(url: string): { mimeType: string; data: string } | null {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

/** Convert chat message history into Google GenAI content format. */
function buildChatHistory(messages: PatientChatMessage[]): ChatContent[] {
  const history: ChatContent[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const m = messages[i];
    if (m.role === "system") continue;

    const role = m.role === "assistant" ? "model" : "user";
    const parts: ChatPart[] = [{ text: m.content }];

    if (m.imagemUrl && m.role === "user") {
      const inline = parseDataUrl(m.imagemUrl);
      if (inline) parts.push({ inlineData: inline });
    }

    history.push({ role, parts });
  }

  return history;
}

/** Build message parts for the current (last) user message. */
function buildUserParts(message: PatientChatMessage): ChatPart[] {
  const parts: ChatPart[] = [{ text: message.content }];
  if (message.imagemUrl) {
    const inline = parseDataUrl(message.imagemUrl);
    if (inline) parts.push({ inlineData: inline });
  }
  return parts;
}

interface ToolLoopResult {
  text: string;
  toolsUsed: string[];
}

/** Run the multi-step tool calling loop. SDK preserves thought signatures. */
async function runToolLoop(
  chat: ReturnType<InstanceType<typeof import("@google/genai").GoogleGenAI>["chats"]["create"]>,
  userParts: ChatPart[],
  context: PatientChatContext
): Promise<ToolLoopResult> {
  const toolsUsed: string[] = [];
  let response = await chat.sendMessage({ message: userParts });

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      return { text: response.text ?? "", toolsUsed };
    }

    const responses: Array<{
      functionResponse: { name: string; response: Record<string, unknown> };
    }> = [];
    for (const fc of calls) {
      const name = fc.name ?? "unknown";
      toolsUsed.push(name);
      const result = await executeToolCall(
        name,
        (fc.args as Record<string, unknown>) ?? {},
        context
      );
      responses.push({ functionResponse: { name, response: result as Record<string, unknown> } });
    }

    response = await chat.sendMessage({ message: responses });

    if (step === MAX_TOOL_STEPS - 1) {
      return {
        text:
          response.text ??
          "Desculpe, não consegui completar a análise. Tente reformular sua pergunta.",
        toolsUsed,
      };
    }
  }

  return { text: response.text ?? "", toolsUsed };
}

/** Optionally generate a simulation image and return its URL. */
async function tryGenerateSimulationImage(
  messages: PatientChatMessage[],
  context: PatientChatContext,
  assistantText: string
): Promise<string | null> {
  const latestUserMessage = getLatestUserMessage(messages);
  if (!latestUserMessage || !shouldGenerateSimulationImage(latestUserMessage)) return null;

  try {
    const result = await generateImage({
      prompt: buildSimulationImagePrompt({
        patientName: context.patientName,
        userMessage: latestUserMessage.content,
        assistantMessage: assistantText,
      }),
      originalImages: latestUserMessage.imagemUrl
        ? [{ url: latestUserMessage.imagemUrl }]
        : undefined,
    });
    return result.url ?? null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a patient chat message and generate a response using AI with tools.
 *
 * Uses @google/genai SDK directly with chat.sendMessage() which handles
 * Gemini 3's mandatory thought_signature automatically.
 */
export async function patientChat(
  messages: PatientChatMessage[],
  context: PatientChatContext,
  options: PatientChatOptions = {}
): Promise<PatientChatResult> {
  if (!isAIConfigured()) {
    return {
      success: false,
      message: "Serviço de IA não configurado. Configure GEMINI_API_KEY.",
      error: "AI_NOT_CONFIGURED",
    };
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    return { success: false, message: "Cliente Gemini não disponível.", error: "CLIENT_ERROR" };
  }

  try {
    const systemPrompt = `${PATIENT_SYSTEM_PROMPT}\n\n## Contexto Atual\nVocê está analisando o prontuário do(a) paciente: **${context.patientName}**\nPaciente ID: ${context.pacienteId}\n\nUse as ferramentas disponíveis para buscar informações do prontuário antes de responder.`;

    const chat = gemini.chats.create({
      model: MODEL,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations }],
        thinkingConfig: { thinkingBudget: 1024 },
      },
      history: buildChatHistory(messages),
    });

    const { text: finalText, toolsUsed } = await runToolLoop(
      chat,
      buildUserParts(messages[messages.length - 1]),
      context
    );

    const uniqueToolsUsed = Array.from(new Set(toolsUsed));

    let generatedImageUrl: string | null = null;
    if (options.generateImage !== false) {
      generatedImageUrl = await tryGenerateSimulationImage(messages, context, finalText);
      if (generatedImageUrl) uniqueToolsUsed.push("generateImage");
    }

    return {
      success: true,
      message: finalText,
      toolsUsed: uniqueToolsUsed.length > 0 ? uniqueToolsUsed : undefined,
      generatedImageUrl,
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
