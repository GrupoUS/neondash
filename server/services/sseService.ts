import type { Response } from "express";

export type ChatSSEEvent =
  | "connected"
  | "message"
  | "new-message"
  | "message-read"
  | "typing-start"
  | "typing-stop"
  | "contact-online"
  | "contact-offline"
  | "status_update";

interface SSEClient {
  response: Response;
  phone?: string;
}

/**
 * SSE Service for real-time chat message push

 * Manages client connections and broadcasts events to connected clients
 */
class SSEService {
  private clients: Map<number, SSEClient[]> = new Map();

  /**
   * Add a client connection for a mentorado
   */
  addClient(mentoradoId: number, res: Response): void {
    const existing = this.clients.get(mentoradoId) ?? [];
    existing.push({ response: res });
    this.clients.set(mentoradoId, existing);

    // Send initial connection confirmation
    this.sendToClient(res, "connected", { mentoradoId });
  }

  /**
   * Remove a client connection
   */
  removeClient(mentoradoId: number, res: Response): void {
    const existing = this.clients.get(mentoradoId);
    if (!existing) return;

    const filtered = existing.filter((client) => client.response !== res);
    if (filtered.length === 0) {
      this.clients.delete(mentoradoId);
    } else {
      this.clients.set(mentoradoId, filtered);
    }
  }

  /**
   * Attach a phone filter to a specific client connection
   */
  setClientPhone(mentoradoId: number, res: Response, phone: string): void {
    const existing = this.clients.get(mentoradoId);
    if (!existing) return;

    for (const client of existing) {
      if (client.response === res) {
        client.phone = phone;
      }
    }
  }

  /**
   * Broadcast an event to all clients of a mentorado
   */
  broadcast(mentoradoId: number, eventName: ChatSSEEvent, data: unknown): void {
    const clientResponses = this.clients.get(mentoradoId);
    if (!clientResponses || clientResponses.length === 0) return;

    for (const client of clientResponses) {
      this.sendToClient(client.response, eventName, data);
    }
  }

  /**
   * Broadcast an event to clients subscribed to a specific phone
   */
  broadcastToPhone(
    mentoradoId: number,
    phone: string,
    eventName: ChatSSEEvent,
    data: unknown
  ): void {
    const clientResponses = this.clients.get(mentoradoId);
    if (!clientResponses || clientResponses.length === 0) return;

    for (const client of clientResponses) {
      if (!client.phone || client.phone === phone) {
        this.sendToClient(client.response, eventName, data);
      }
    }
  }

  /**
   * Send SSE event to a single client
   */
  private sendToClient(res: Response, eventName: ChatSSEEvent, data: unknown): void {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      // Client disconnected, will be cleaned up on close event
    }
  }

  /**
   * Get count of connected clients for a mentorado (for debugging)
   */
  getClientCount(mentoradoId: number): number {
    return this.clients.get(mentoradoId)?.length ?? 0;
  }

  /**
   * Get total connected clients (for debugging)
   */
  getTotalClients(): number {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.length;
    }
    return total;
  }
}

// Singleton instance
export const sseService = new SSEService();
