import "dotenv/config";
import { createServer } from "node:http";
import net from "node:net";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { appRouter } from "../routers";
import { handleClerkWebhook } from "../webhooks/clerk";
import { registerMetaWebhooks } from "../webhooks/metaWebhook";
import { registerZapiWebhooks } from "../webhooks/zapiWebhook";
import { createContext } from "./context";
import { userRateLimiter } from "./rateLimiter";
import { initSchedulers, stopSchedulers } from "./scheduler";
import { initRedis, invalidateSession } from "./sessionCache";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize session cache (Redis or in-memory fallback)
  await initRedis();

  const app = express();
  const server = createServer(app);

  // ─────────────────────────────────────────────────────────────────────────
  // Express Middleware
  // ─────────────────────────────────────────────────────────────────────────

  app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), async (req, res) => {
    // Pass raw body buffer to the handler
    (req as any).rawBody = req.body;
    await handleClerkWebhook(req, res);
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─────────────────────────────────────────────────────────────────────────
  // Z-API Webhooks (for WhatsApp integration)
  // ─────────────────────────────────────────────────────────────────────────
  registerZapiWebhooks(app);

  // ─────────────────────────────────────────────────────────────────────────
  // Meta WhatsApp Cloud API Webhooks
  // ─────────────────────────────────────────────────────────────────────────
  registerMetaWebhooks(app);

  // Clerk middleware (must be before tRPC if using auth middleware in procedures, but usually globally applied)
  app.use(clerkMiddleware());

  // ─────────────────────────────────────────────────────────────────────────
  // Auth Routes (Login/Logout)
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/auth/login", (_req, res) => {
    // Redirect to Clerk's sign-in page
    // In production, Clerk handles the OAuth flow and redirects back
    const signInUrl = process.env.CLERK_SIGN_IN_URL || "/sign-in";
    res.redirect(signInUrl);
  });

  app.get("/api/auth/logout", async (req, res) => {
    const auth = getAuth(req);

    // Invalidate session cache if user is authenticated
    if (auth.userId) {
      await invalidateSession(auth.userId);
    }

    // Redirect to Clerk's sign-out page or back to home
    const signOutUrl = process.env.CLERK_SIGN_OUT_URL || "/";
    res.redirect(signOutUrl);
  });

  // Rate limiting for API routes
  app.use("/api/trpc", userRateLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SSE Endpoint for Real-Time Chat Updates
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/chat/events", async (req, res) => {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get mentorado ID from Clerk user
    const { getDb } = await import("../db");
    const { eq } = await import("drizzle-orm");
    const { mentorados, users } = await import("../../drizzle/schema");
    const { sseService } = await import("../services/sseService");

    const db = getDb();
    const [mentorado] = await db
      .select({ id: mentorados.id })
      .from(mentorados)
      .innerJoin(users, eq(users.id, mentorados.userId))
      .where(eq(users.clerkId, auth.userId))
      .limit(1);

    if (!mentorado) {
      return res.status(404).json({ error: "Mentorado not found" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Register client
    sseService.addClient(mentorado.id, res);

    // Cleanup on close
    req.on("close", () => {
      sseService.removeClient(mentorado.id, res);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Google Calendar OAuth Callback
  // ─────────────────────────────────────────────────────────────────────────

  app.get("/api/calendar/callback", async (req, res) => {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      return res.redirect(`/agenda?error=${encodeURIComponent(String(error))}`);
    }

    if (!code || typeof code !== "string") {
      return res.redirect("/agenda?error=missing_code");
    }

    // Redirect to client with code and state for tRPC to handle
    // This keeps authentication in the Clerk context
    const params = new URLSearchParams({
      code,
      ...(state && { state: String(state) }),
    });
    return res.redirect(`/agenda?${params.toString()}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Instagram OAuth Callback
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/instagram/callback", async (req, res) => {
    const { code, state, error, error_reason, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      const errorMsg = error_description || error_reason || error;
      return res.redirect(`/configuracoes?instagram_error=${encodeURIComponent(String(errorMsg))}`);
    }

    if (!code || typeof code !== "string") {
      return res.redirect("/configuracoes?instagram_error=missing_code");
    }

    // Redirect to settings page with code and mentorado state
    const params = new URLSearchParams({
      instagram_code: code,
      ...(state && { mentorado_id: String(state) }),
    });
    return res.redirect(`/configuracoes?${params.toString()}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Instagram Data Deletion Request (Meta Compliance)
  // This endpoint receives POST requests from Facebook when a user requests
  // data deletion from their Facebook/Instagram settings.
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/instagram/delete", async (req, res) => {
    try {
      // Facebook sends a signed_request in the body
      const { signed_request } = req.body;

      if (!signed_request) {
        // Also handle direct deletion requests (from our own UI)
        return res.json({
          url: "https://neondash.gpus.com.br/account-deletion",
          confirmation_code: `DEL-${Date.now()}`,
        });
      }

      // Parse the signed request (Facebook format)
      // Format: [signature].[payload] where payload is base64url encoded JSON
      const [, payload] = signed_request.split(".");

      if (!payload) {
        return res.status(400).json({ error: "Invalid signed_request format" });
      }

      // Decode payload
      const decodedPayload = Buffer.from(payload, "base64url").toString("utf-8");
      const data = JSON.parse(decodedPayload);

      // data.user_id contains the Facebook user ID
      const facebookUserId = data.user_id;

      // Log the deletion request (in production, you'd look up and delete user data)
      console.log("[Instagram] Data deletion request received for Facebook user:", facebookUserId);

      // Return confirmation as required by Facebook
      // The URL should point to a page where the user can check deletion status
      const confirmationCode = `DEL-${facebookUserId}-${Date.now()}`;

      return res.json({
        url: `https://neondash.gpus.com.br/account-deletion?code=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    } catch (error) {
      console.error("[Instagram] Data deletion request error:", error);
      return res.status(500).json({ error: "Failed to process deletion request" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Instagram Deauthorize Callback (Meta Compliance)
  // Called when user removes the app from their Instagram
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/instagram/deauth", async (req, res) => {
    try {
      console.log("[Instagram] Deauthorize callback received");
      // In production, mark the user's Instagram as disconnected
      return res.json({ success: true });
    } catch (error) {
      console.error("[Instagram] Deauth error:", error);
      return res.status(500).json({ error: "Failed to process deauthorization" });
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Start Server
  // ─────────────────────────────────────────────────────────────────────────

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  server.listen(port, () => {
    console.log(`[server] Server listening on http://localhost:${port}`);

    // Initialize background schedulers AFTER server is ready (fire-and-forget)
    // This prevents catch-up sync from blocking server startup
    initSchedulers().catch((error) => {
      console.error("[scheduler] Failed to initialize schedulers:", error);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────────────────────────────────────

  const shutdown = async () => {
    // Stop all scheduled tasks
    stopSchedulers();

    // Close HTTP server
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(console.error);
