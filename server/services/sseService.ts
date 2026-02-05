import type { Response } from "express";

/**
 * SSE Service for real-time chat message push

 * Manages client connections and broadcasts events to connected clients
 */
class SSEService {
  private clients: Map<number, Response[]> = new Map();

  /**
   * Add a client connection for a mentorado
   */
  addClient(mentoradoId: number, res: Response): void {
    const existing = this.clients.get(mentoradoId) ?? [];
    existing.push(res);
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

    const filtered = existing.filter((r) => r !== res);
    if (filtered.length === 0) {
      this.clients.delete(mentoradoId);
    } else {
      this.clients.set(mentoradoId, filtered);
    }
  }

  /**
   * Broadcast an event to all clients of a mentorado
   */
  broadcast(mentoradoId: number, eventName: string, data: unknown): void {
    const clientResponses = this.clients.get(mentoradoId);
    if (!clientResponses || clientResponses.length === 0) return;

    for (const res of clientResponses) {
      this.sendToClient(res, eventName, data);
    }
  }

  /**
   * Send SSE event to a single client
   */
  private sendToClient(res: Response, eventName: string, data: unknown): void {
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
