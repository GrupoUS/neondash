import "dotenv/config";

export const ENV = {
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // OpenAI-compatible LLM provider (optional, for AI features)
  llmApiUrl: process.env.LLM_API_URL,
  llmApiKey: process.env.LLM_API_KEY,
};
