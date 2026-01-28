import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { moltbotService } from "../services/moltbotService";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
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
  const app = express();
  const server = createServer(app);
  
  // ─────────────────────────────────────────────────────────────────────────
  // WebSocket Server for Moltbot Client Connections
  // ─────────────────────────────────────────────────────────────────────────
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket connections
  wss.on("connection", (ws: WebSocket, userId: number) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "moltbot-ws",
        action: "clientConnected",
        userId,
      })
    );

    // Register with moltbot service
    moltbotService.registerClientConnection(userId, ws);

    // Handle incoming messages
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await moltbotService.handleClientMessage(userId, message);
      } catch (error) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "error",
            service: "moltbot-ws",
            action: "messageError",
            userId,
            error: String(error),
          })
        );
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      moltbotService.unregisterClientConnection(userId);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  // HTTP upgrade handler for WebSocket
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);

    // Only handle /ws/moltbot path
    if (url.pathname !== "/ws/moltbot") {
      socket.destroy();
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
    if (isNaN(userId)) {
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
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Clerk middleware (must be before tRPC if using auth middleware in procedures, but usually globally applied)
  app.use(clerkMiddleware());

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
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
    await moltbotService.connect();
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "server",
        action: "moltbotGatewayConnected",
      })
    );
  } catch (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        service: "server",
        action: "moltbotGatewayUnavailable",
        message: "Moltbot gateway not available, will retry in background",
        error: String(error),
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Start Server
  // ─────────────────────────────────────────────────────────────────────────

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket endpoint: ws://localhost:${port}/ws/moltbot`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Graceful Shutdown
  // ─────────────────────────────────────────────────────────────────────────

  const shutdown = async () => {
    console.log("\nShutting down gracefully...");
    
    // Disconnect moltbot service
    await moltbotService.disconnect();
    
    // Close WebSocket server
    wss.close();
    
    // Close HTTP server
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(console.error);

