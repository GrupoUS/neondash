/**
 * AI SDR (Sales Development Representative) Service
 * Handles AI-powered automated responses for lead qualification via WhatsApp
 *
 * Uses shared LLM service for natural conversation generation
 */
import { and, desc, eq } from "drizzle-orm";
import {
  type AiAgentConfig,
  aiAgentConfig,
  type Lead,
  whatsappMessages,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { type ZApiCredentials, zapiService } from "./zapiService";

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de atendimento profissional para uma clínica de estética. 
Seu objetivo é qualificar leads de forma amigável e profissional.

Diretrizes:
- Seja educado e empático
- Responda de forma concisa e natural
- Faça perguntas para entender as necessidades do cliente
- Colete informações relevantes: nome, procedimento de interesse, disponibilidade
- Se o cliente demonstrar interesse, sugira agendar uma consulta
- Não faça promessas sobre preços ou resultados
- Se não souber responder algo, diga que um especialista entrará em contato`;

const DEFAULT_GREETING = `Olá! 👋 Tudo bem? Vi que você entrou em contato conosco. 
Como posso te ajudar hoje?`;

interface ConversationContext {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  lead?: Lead;
  config: AiAgentConfig;
}

/**
 * Check if current time is within working hours
 */
function isWithinWorkingHours(config: AiAgentConfig): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Check if current day is a working day
  const workingDays = (config.workingDays ?? "1,2,3,4,5").split(",").map(Number);
  if (!workingDays.includes(currentDay)) {
    return false;
  }

  // Check if current time is within working hours
  const start = config.workingHoursStart ?? "09:00";
  const end = config.workingHoursEnd ?? "18:00";

  return currentTime >= start && currentTime <= end;
}

/**
 * Get AI agent configuration for a mentorado
 */
export async function getAgentConfig(mentoradoId: number): Promise<AiAgentConfig | null> {
  const db = getDb();
  const [config] = await db
    .select()
    .from(aiAgentConfig)
    .where(eq(aiAgentConfig.mentoradoId, mentoradoId))
    .limit(1);

  return config ?? null;
}

/**
 * Get recent message history for context
 */
async function getMessageHistory(
  mentoradoId: number,
  phone: string,
  limit = 10
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const db = getDb();
  const messages = await db
    .select()
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.mentoradoId, mentoradoId), eq(whatsappMessages.phone, phone)))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit);

  // Reverse to get chronological order and map to conversation format
  return messages.reverse().map((msg) => ({
    role: msg.direction === "inbound" ? "user" : "assistant",
    content: msg.content,
  }));
}

/**
 * Generate AI response using shared LLM service
 */
async function generateResponse(context: ConversationContext): Promise<string> {
  const systemPrompt = context.config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  try {
    // Import LLM dynamically to avoid circular dependencies
    const { invokeLLM } = await import("../_core/llm");

    // Build messages for LLM with conversation history
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...context.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const result = await invokeLLM({ messages });
    const choice = result.choices[0];

    if (choice?.message?.content) {
      return typeof choice.message.content === "string"
        ? choice.message.content
        : choice.message.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text)
            .join("\n");
    }

    throw new Error("No content in LLM response");
  } catch (_error) {
    return "Obrigado pelo contato! Um de nossos especialistas entrará em contato em breve.";
  }
}

/**
 * Process an incoming message and generate AI response if applicable
 */
export async function processIncomingMessage(
  mentoradoId: number,
  phone: string,
  messageContent: string,
  credentials: ZApiCredentials,
  lead?: Lead
): Promise<{ responded: boolean; response?: string }> {
  // Get AI configuration
  const config = await getAgentConfig(mentoradoId);

  // Check if AI is enabled
  if (!config || config.enabled !== "sim") {
    return { responded: false };
  }

  // Check working hours
  if (!isWithinWorkingHours(config)) {
    return { responded: false };
  }

  // Get message history for context
  const history = await getMessageHistory(mentoradoId, phone);

  // Add current message to history
  const context: ConversationContext = {
    messages: [...history, { role: "user", content: messageContent }],
    lead,
    config,
  };

  // Check if this is a first contact
  const isFirstMessage = history.length === 0;

  // Generate response
  let response: string;
  if (isFirstMessage && config.greetingMessage) {
    response = config.greetingMessage;
  } else {
    response = await generateResponse(context);
  }

  // Add delay to appear more natural (configurable, default 3s)
  const delay = config.responseDelayMs ?? 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Send response via Z-API
  try {
    const sendResult = await zapiService.sendTextMessage(credentials, {
      phone,
      message: response,
    });

    // Store AI response in database
    const db = getDb();
    await db.insert(whatsappMessages).values({
      mentoradoId,
      leadId: lead?.id ?? null,
      phone,
      direction: "outbound",
      content: response,
      zapiMessageId: sendResult.zapiMessageId ?? sendResult.id,
      status: "sent",
      isFromAi: "sim",
    });

    return { responded: true, response };
  } catch (_error) {
    return { responded: false };
  }
}

/**
 * Get default configuration values
 */
export function getDefaultConfig(): Partial<AiAgentConfig> {
  return {
    enabled: "nao",
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    greetingMessage: DEFAULT_GREETING,
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    workingDays: "1,2,3,4,5",
    responseDelayMs: 3000,
  };
}

export const aiSdrService = {
  getAgentConfig,
  processIncomingMessage,
  isWithinWorkingHours,
  getDefaultConfig,
};
