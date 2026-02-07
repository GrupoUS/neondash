import { ENV } from "./env";
import { createLogger } from "./logger";

const logger = createLogger({ service: "llm" });

/**
 * ============================================
 * TYPES AND INTERFACES
 * ============================================
 */

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  /** Override the default model for this specific invocation */
  model?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type LLMError = {
  code: string;
  message: string;
  status: number;
  details?: unknown;
};

/**
 * ============================================
 * CONSTANTS AND CONFIGURATION
 * ============================================
 */

/** Default model: Gemini 3 Flash Preview */
const DEFAULT_MODEL = "gemini-3-flash-preview";

/** Gemini OpenAI-compatible API endpoint */
const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** Request timeout in milliseconds (2 minutes) */
const REQUEST_TIMEOUT_MS = 120000;

/** Maximum tokens for response */
const MAX_TOKENS = 32768;

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const normalizeContentPart = (part: MessageContent): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error(`Unsupported message content part: ${JSON.stringify(part)}`);
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const getApiKey = (): string => {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    throw new LLMConfigurationError(
      "API Key missing. Configure GEMINI_API_KEY.",
      "API_KEY_MISSING"
    );
  }
  return apiKey;
};

const resolveModel = (requestedModel?: string): string => {
  if (requestedModel) {
    return requestedModel;
  }
  return DEFAULT_MODEL;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * ============================================
 * CUSTOM ERROR CLASSES
 * ============================================
 */

class LLMConfigurationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "LLMConfigurationError";
    this.code = code;
  }
}

class LLMInvocationError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "LLMInvocationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * ============================================
 * MAIN INVOKE FUNCTION
 * ============================================
 */

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const startTime = Date.now();
  const requestId = `llm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  logger.info("invocation_started", { requestId });

  try {
    // Validate and get API key
    const apiKey = getApiKey();

    // Destructure parameters
    const {
      messages,
      tools,
      toolChoice,
      tool_choice,
      outputSchema,
      output_schema,
      responseFormat,
      response_format,
      maxTokens,
      max_tokens,
      model: requestedModel,
    } = params;

    // Validate messages
    if (!messages || messages.length === 0) {
      throw new LLMConfigurationError("At least one message is required", "MESSAGES_EMPTY");
    }

    // Resolve model
    const model = resolveModel(requestedModel);

    // Build payload
    const payload: Record<string, unknown> = {
      model,
      messages: messages.map(normalizeMessage),
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      payload.tools = tools;
      logger.info("tools_configured", { requestId, toolCount: tools.length });
    }

    // Add tool choice if provided
    const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
    if (normalizedToolChoice) {
      payload.tool_choice = normalizedToolChoice;
    }

    // Set max tokens
    payload.max_tokens = maxTokens || max_tokens || MAX_TOKENS;

    // Add response format if provided
    const normalizedResponseFormat = normalizeResponseFormat({
      responseFormat,
      response_format,
      outputSchema,
      output_schema,
    });

    if (normalizedResponseFormat) {
      payload.response_format = normalizedResponseFormat;
      logger.info("response_format_set", { requestId, type: normalizedResponseFormat.type });
    }

    logger.info("sending_request", {
      requestId,
      apiUrl: GEMINI_API_ENDPOINT,
      model,
      messageCount: messages.length,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.error("request_timeout", { requestId, timeoutMs: REQUEST_TIMEOUT_MS });
    }, REQUEST_TIMEOUT_MS);

    // Make the request
    let response: Response;
    try {
      response = await fetch(GEMINI_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new LLMInvocationError(
          `Request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          "TIMEOUT",
          408,
          { requestId, timeout: REQUEST_TIMEOUT_MS }
        );
      }

      throw new LLMInvocationError(
        `Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        "NETWORK_ERROR",
        0,
        { requestId, originalError: fetchError }
      );
    }

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown;
      let errorText = "";

      try {
        errorText = await response.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      const statusCode = response.status;
      const statusText = response.statusText;

      logger.error("request_failed", {
        requestId,
        status: statusCode,
        statusText,
        error: errorData,
      });

      // Map common error codes
      let errorCode = "UNKNOWN_ERROR";
      let errorMessage = `LLM invoke failed: ${statusCode} ${statusText}`;

      switch (statusCode) {
        case 400:
          errorCode = "BAD_REQUEST";
          errorMessage = "Invalid request format or parameters";
          break;
        case 401:
          errorCode = "UNAUTHORIZED";
          errorMessage = "Invalid API key or authentication failed";
          break;
        case 403:
          errorCode = "FORBIDDEN";
          errorMessage = "API key does not have permission for this operation";
          break;
        case 404:
          errorCode = "MODEL_NOT_FOUND";
          errorMessage = `Model '${model}' not found. Please verify the model name.`;
          break;
        case 429:
          errorCode = "RATE_LIMITED";
          errorMessage = "Rate limit exceeded. Please try again later.";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = "SERVER_ERROR";
          errorMessage = "LLM service temporarily unavailable";
          break;
      }

      throw new LLMInvocationError(errorMessage, errorCode, statusCode, {
        requestId,
        response: errorData,
        model,
      });
    }

    // Parse successful response
    const result = (await response.json()) as InvokeResult;

    const duration = Date.now() - startTime;

    logger.info("request_completed", {
      requestId,
      durationMs: duration,
      model: result.model,
      tokens: result.usage,
      choiceCount: result.choices.length,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof LLMConfigurationError || error instanceof LLMInvocationError) {
      logger.error("llm_error", {
        requestId,
        durationMs: duration,
        code: error.code,
        message: error.message,
        status: (error as LLMInvocationError).status,
      });
      throw error;
    }

    // Wrap unknown errors
    logger.error("unexpected_error", { requestId, durationMs: duration, error });
    throw new LLMInvocationError(
      `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      "UNEXPECTED_ERROR",
      0,
      { requestId, originalError: error }
    );
  }
}

/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */

/**
 * Validates that the LLM is properly configured
 */
export function validateLLMConfig(): {
  isValid: boolean;
  provider: "gemini" | "none";
  model: string;
  errors: string[];
} {
  const errors: string[] = [];
  let provider: "gemini" | "none" = "none";
  const model = DEFAULT_MODEL;

  if (ENV.geminiApiKey) {
    provider = "gemini";

    if (ENV.geminiApiKey.length < 10) {
      errors.push("GEMINI_API_KEY appears to be invalid (too short)");
    }
  } else {
    errors.push("No API key configured. Set GEMINI_API_KEY");
  }

  return {
    isValid: errors.length === 0,
    provider,
    model,
    errors,
  };
}

/**
 * Test function to verify LLM connectivity
 */
export async function testLLMConnection(): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> {
  try {
    const config = validateLLMConfig();

    if (!config.isValid) {
      return {
        success: false,
        message: `Configuration error: ${config.errors.join(", ")}`,
        details: config,
      };
    }

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'OK' if you can hear me." },
      ],
      maxTokens: 10,
    });

    const content = result.choices[0]?.message?.content;

    return {
      success: true,
      message: `LLM connection successful. Response: ${content}`,
      details: {
        model: result.model,
        usage: result.usage,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
}

// Export error classes for external use
export { LLMConfigurationError, LLMInvocationError };
