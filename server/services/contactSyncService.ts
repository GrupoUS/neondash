import { and, eq } from "drizzle-orm";
import { mentorados, whatsappContacts } from "../../drizzle/schema";
import { getDb } from "../db";
import { safeDecrypt } from "./crypto";
import { type ZApiContact, type ZApiCredentials, zapiService } from "./zapiService";

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const CONTACTS_SYNC_TTL_MS = 60_000;
const PHOTO_SYNC_TTL_MS = 3 * 60_000;
const PRESENCE_SYNC_TTL_MS = 15_000;
const MIN_INTERVAL_MS = 350;

const cache = new Map<string, CacheEntry>();
const lastCallAtByKey = new Map<string, number>();

function nowMs(): number {
  return Date.now();
}

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCache(key: string, value: unknown, ttlMs: number): void {
  cache.set(key, { value, expiresAt: nowMs() + ttlMs });
}

async function throttle(key: string): Promise<void> {
  const last = lastCallAtByKey.get(key) ?? 0;
  const elapsed = nowMs() - last;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastCallAtByKey.set(key, nowMs());
}

async function getMentoradoCredentials(mentoradoId: number): Promise<ZApiCredentials | null> {
  const db = getDb();
  const [mentorado] = await db
    .select({
      id: mentorados.id,
      zapiInstanceId: mentorados.zapiInstanceId,
      zapiToken: mentorados.zapiToken,
      zapiClientToken: mentorados.zapiClientToken,
    })
    .from(mentorados)
    .where(eq(mentorados.id, mentoradoId))
    .limit(1);

  if (!mentorado?.zapiInstanceId || !mentorado.zapiToken) return null;
  const decryptedToken = safeDecrypt(mentorado.zapiToken);
  if (!decryptedToken) return null;

  return {
    instanceId: mentorado.zapiInstanceId,
    token: decryptedToken,
    clientToken: mentorado.zapiClientToken
      ? (safeDecrypt(mentorado.zapiClientToken) ?? undefined)
      : undefined,
  };
}

function extractContactPhone(contact: ZApiContact): string | null {
  const raw = contact.phone ?? contact.number ?? contact.id ?? "";
  const normalized = zapiService.normalizePhoneNumber(raw.replace(/@.*/, ""));
  return normalized.length >= 8 ? normalized : null;
}

export async function syncAllContacts(
  mentoradoId: number
): Promise<{ synced: number; total: number }> {
  const cacheKey = `contacts:${mentoradoId}`;
  const cached = getCache<{ synced: number; total: number }>(cacheKey);
  if (cached) return cached;

  const credentials = await getMentoradoCredentials(mentoradoId);
  if (!credentials) return { synced: 0, total: 0 };

  await throttle(cacheKey);
  const remoteContacts = await zapiService.getContacts(credentials);
  const db = getDb();

  let synced = 0;
  for (const remote of remoteContacts) {
    const phone = extractContactPhone(remote);
    if (!phone) continue;

    const name = remote.name ?? remote.pushname ?? null;
    const profilePicUrl = remote.profilePicUrl ?? null;

    const [existing] = await db
      .select({ id: whatsappContacts.id })
      .from(whatsappContacts)
      .where(and(eq(whatsappContacts.mentoradoId, mentoradoId), eq(whatsappContacts.phone, phone)))
      .limit(1);

    if (existing) {
      await db
        .update(whatsappContacts)
        .set({
          name,
          profilePicUrl,
          syncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappContacts.id, existing.id));
    } else {
      await db.insert(whatsappContacts).values({
        mentoradoId,
        phone,
        name,
        profilePicUrl,
        syncedAt: new Date(),
      });
    }

    synced += 1;
  }

  const result = { synced, total: remoteContacts.length };
  setCache(cacheKey, result, CONTACTS_SYNC_TTL_MS);
  return result;
}

export async function syncContactPhoto(
  mentoradoId: number,
  phone: string
): Promise<{ phone: string; profilePicUrl: string | null }> {
  const normalizedPhone = zapiService.normalizePhoneNumber(phone);
  const cacheKey = `photo:${mentoradoId}:${normalizedPhone}`;
  const cached = getCache<{ phone: string; profilePicUrl: string | null }>(cacheKey);
  if (cached) return cached;

  const credentials = await getMentoradoCredentials(mentoradoId);
  if (!credentials) return { phone: normalizedPhone, profilePicUrl: null };

  await throttle(cacheKey);
  const profile = await zapiService.getProfilePicture(credentials, normalizedPhone);
  const profilePicUrl = profile?.profilePicUrl ?? profile?.value ?? null;

  const db = getDb();
  await db
    .update(whatsappContacts)
    .set({
      profilePicUrl,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(whatsappContacts.mentoradoId, mentoradoId),
        eq(whatsappContacts.phone, normalizedPhone)
      )
    );

  const result = { phone: normalizedPhone, profilePicUrl };
  setCache(cacheKey, result, PHOTO_SYNC_TTL_MS);
  return result;
}

export async function syncContactPresence(
  mentoradoId: number,
  phone: string
): Promise<{ phone: string; isOnline: boolean; lastSeen: string | null }> {
  const normalizedPhone = zapiService.normalizePhoneNumber(phone);
  const cacheKey = `presence:${mentoradoId}:${normalizedPhone}`;
  const cached = getCache<{ phone: string; isOnline: boolean; lastSeen: string | null }>(cacheKey);
  if (cached) return cached;

  const credentials = await getMentoradoCredentials(mentoradoId);
  if (!credentials) return { phone: normalizedPhone, isOnline: false, lastSeen: null };

  await throttle(cacheKey);
  const presence = await zapiService.getPresence(credentials, normalizedPhone);
  const isOnline = !!presence?.isOnline;
  const lastSeenDate = presence?.lastSeen ? new Date(presence.lastSeen * 1000) : null;

  const db = getDb();
  await db
    .update(whatsappContacts)
    .set({
      isOnline: isOnline ? "sim" : "nao",
      lastSeen: lastSeenDate,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(whatsappContacts.mentoradoId, mentoradoId),
        eq(whatsappContacts.phone, normalizedPhone)
      )
    );

  const result = {
    phone: normalizedPhone,
    isOnline,
    lastSeen: lastSeenDate?.toISOString() ?? null,
  };
  setCache(cacheKey, result, PRESENCE_SYNC_TTL_MS);
  return result;
}

export const contactSyncService = {
  syncAllContacts,
  syncContactPhoto,
  syncContactPresence,
};
