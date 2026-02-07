import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { BufferJSON, initAuthCreds, proto } from "@whiskeysockets/baileys";
import { and, eq } from "drizzle-orm";
import { baileysSessions } from "../../drizzle/schema";
import { getDb } from "../db";

export const clearAuthState = async (mentoradoId: number): Promise<void> => {
  const db = getDb();
  try {
    await db.delete(baileysSessions).where(eq(baileysSessions.mentoradoId, mentoradoId));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: expected error
    console.error("Error removing auth state from DB:", error);
  }
};

export const hasSession = async (mentoradoId: number): Promise<boolean> => {
  const db = getDb();
  try {
    const existing = await db
      .select({ id: baileysSessions.id })
      .from(baileysSessions)
      .where(and(eq(baileysSessions.mentoradoId, mentoradoId), eq(baileysSessions.key, "creds")))
      .limit(1);
    return existing.length > 0;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: expected error
    console.error("Error checking auth state in DB:", error);
    return false;
  }
};

export const usePostgresAuthState = async (
  mentoradoId: number
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const db = getDb();

  const writeData = async (data: unknown, key: string) => {
    try {
      // Use upsert pattern
      // First try to update
      const existing = await db
        .select()
        .from(baileysSessions)
        .where(and(eq(baileysSessions.mentoradoId, mentoradoId), eq(baileysSessions.key, key)));

      if (existing.length > 0) {
        await db
          .update(baileysSessions)
          .set({
            value: JSON.stringify(data, BufferJSON.replacer),
            updatedAt: new Date(),
          })
          .where(eq(baileysSessions.id, existing[0].id));
      } else {
        await db.insert(baileysSessions).values({
          mentoradoId,
          key,
          value: JSON.stringify(data, BufferJSON.replacer),
        });
      }
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: expected error
      console.error("Error writing auth state to DB:", error);
    }
  };

  const readData = async (key: string) => {
    try {
      const data = await db
        .select()
        .from(baileysSessions)
        .where(and(eq(baileysSessions.mentoradoId, mentoradoId), eq(baileysSessions.key, key)));

      if (data.length === 0) return null;
      return JSON.parse(data[0].value, BufferJSON.reviver);
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: expected error
      console.error("Error reading auth state from DB:", error);
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await db
        .delete(baileysSessions)
        .where(and(eq(baileysSessions.mentoradoId, mentoradoId), eq(baileysSessions.key, key)));
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: expected error
      console.error("Error removing auth state from DB:", error);
    }
  };

  const creds: AuthenticationCreds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
          const data: { [key: string]: SignalDataTypeMap[T] } = {};
          await Promise.all(
            ids.map(async (id: string) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              if (value) {
                data[id] = value;
              }
            })
          );
          return data;
        },
        set: async (data: SignalDataSet) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            const cat = category as keyof typeof data;
            const catData = data[cat];
            if (!catData) continue;

            for (const id in catData) {
              const value = catData[id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, "creds");
    },
  };
};
