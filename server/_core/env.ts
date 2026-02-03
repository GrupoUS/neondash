import "dotenv/config";

export const ENV = {
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Vercel AI SDK - Google Gemini provider
  googleAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY,

  // Legacy: OpenAI-compatible LLM provider (deprecated, use googleAiApiKey)
  llmApiUrl: process.env.LLM_API_URL,
  llmApiKey: process.env.LLM_API_KEY,

  // Google Calendar OAuth (optional, for calendar integration)
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/calendar/callback",

  // Brave Search API (optional, for web search tool)
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY,

  // Instagram Business API OAuth (optional, for Instagram metrics sync)
  instagramAppId: process.env.INSTAGRAM_APP_ID,
  instagramAppSecret: process.env.INSTAGRAM_APP_SECRET,
  instagramRedirectUri:
    process.env.INSTAGRAM_REDIRECT_URI ?? "http://localhost:3000/api/instagram/callback",
};
