import { eq } from "drizzle-orm";
import { mentorados } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  type BaileysConnectionEventPayload,
  type BaileysContactEventPayload,
  type BaileysMessageEventPayload,
  type BaileysQrEventPayload,
  type BaileysSessionStatus,
  baileysService,
} from "./baileysService";

type ManagedSession = {
  mentoradoId: number;
  updatedAt: Date;
};

type BaileysServiceEvent = {
  "connection.update": BaileysConnectionEventPayload;
  qr: BaileysQrEventPayload;
  message: BaileysMessageEventPayload;
  contacts: BaileysContactEventPayload;
};

type BaileysEventName = keyof BaileysServiceEvent;

class BaileysSessionManager {
  private static _instance: BaileysSessionManager | null = null;

  private managedSessions = new Map<number, ManagedSession>();

  private restoringPromise: Promise<void> | null = null;

  static getInstance(): BaileysSessionManager {
    if (!BaileysSessionManager._instance) {
      BaileysSessionManager._instance = new BaileysSessionManager();
    }
    return BaileysSessionManager._instance;
  }

  private touch(mentoradoId: number): void {
    this.managedSessions.set(mentoradoId, {
      mentoradoId,
      updatedAt: new Date(),
    });
  }

  async connect(mentoradoId: number): Promise<void> {
    this.touch(mentoradoId);
    await baileysService.connect(mentoradoId);
  }

  async disconnect(mentoradoId: number): Promise<void> {
    await baileysService.disconnect(mentoradoId);
    this.touch(mentoradoId);
  }

  async logout(mentoradoId: number): Promise<void> {
    await baileysService.logout(mentoradoId);
    this.managedSessions.delete(mentoradoId);
  }

  async getSessionStatus(mentoradoId: number): Promise<BaileysSessionStatus> {
    const status = await baileysService.getSessionStatus(mentoradoId);
    this.touch(mentoradoId);
    return status;
  }

  getManagedSessionIds(): number[] {
    return Array.from(this.managedSessions.keys());
  }

  getManagedSessionMap(): Map<number, ManagedSession> {
    return new Map(this.managedSessions);
  }

  on<T extends BaileysEventName>(
    event: T,
    listener: (payload: BaileysServiceEvent[T]) => void
  ): void {
    baileysService.on(event, listener as (payload: unknown) => void);
  }

  off<T extends BaileysEventName>(
    event: T,
    listener: (payload: BaileysServiceEvent[T]) => void
  ): void {
    baileysService.off(event, listener as (payload: unknown) => void);
  }

  async restorePersistedSessions(): Promise<void> {
    if (this.restoringPromise) {
      return this.restoringPromise;
    }

    this.restoringPromise = this.restorePersistedSessionsInternal();
    try {
      await this.restoringPromise;
    } finally {
      this.restoringPromise = null;
    }
  }

  private async restorePersistedSessionsInternal(): Promise<void> {
    const db = getDb();
    const connectedRows = await db
      .select({ id: mentorados.id })
      .from(mentorados)
      .where(eq(mentorados.baileysConnected, "sim"));

    for (const row of connectedRows) {
      try {
        await this.connect(row.id);
      } catch {
        await this.disconnect(row.id);
      }
    }
  }
}

export const baileysSessionManager = BaileysSessionManager.getInstance();
