import "dotenv/config";
import { createServer } from "node:http";
import net from "node:net";
import { URL } from "node:url";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { type WebSocket, WebSocketServer } from "ws";
import { appRouter } from "../routers";
import { openclawService } from "../services/openclawService";
import { handleClerkWebhook } from "../webhooks/clerk";
import { createContext } from "./context";
import { userRateLimiter } from "./rateLimiter";
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
  // WebSocket Server for Moltbot Client Connections
  // ─────────────────────────────────────────────────────────────────────────
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket connections
  wss.on("connection", (ws: WebSocket, userId: number) => {
    // Register with openclaw service
    openclawService.registerClientConnection(userId, ws);

    // Handle incoming messages
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await openclawService.handleClientMessage(userId, message);
      } catch (_error) {}
    });

    // Handle disconnection
    ws.on("close", () => {
      openclawService.unregisterClientConnection(userId);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  // HTTP upgrade handler for WebSocket
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);

    // Only handle /ws/openclaw path - let other paths (like Vite HMR) pass through
    if (url.pathname !== "/ws/openclaw") {
      // Don't destroy - let other handlers (like Vite HMR) handle this
      return;
    }

    // Extract userId from query param (simplified auth for WebSocket)
    // In production, use proper JWT verification from Clerk
    const userIdParam = url.searchParams.get("userId");
    if (!userIdParam) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const userId = parseInt(userIdParam, 10);
    if (Number.isNaN(userId)) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, userId);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Express Middleware
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // Webhooks (Must be before global body parser)
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), async (req, res) => {
    // Pass raw body buffer to the handler
    (req as any).rawBody = req.body;
    await handleClerkWebhook(req, res);
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize Moltbot Gateway Connection
  // ─────────────────────────────────────────────────────────────────────────

  try {
    await openclawService.connect();
  } catch (_error) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Start Server
  // ─────────────────────────────────────────────────────────────────────────

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
  }

  server.listen(port, () => {});

  // ─────────────────────────────────────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────────────────────────────────────

  const shutdown = async () => {
    // Disconnect openclaw service
    await openclawService.disconnect();

    // Close WebSocket server
    wss.close();

    // Close HTTP server
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(console.error);
