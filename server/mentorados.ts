import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  mentorados,
  metricasMensais,
  feedbacks,
  type InsertMentorado,
  type InsertMetricaMensal,
  type InsertFeedback,
} from "../drizzle/schema";

export async function getMentoradoByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMentoradoByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(mentorados)
    .where(eq(mentorados.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMentorados() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(mentorados);
}

export async function createMentorado(data: InsertMentorado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Postgres requires .returning() to get the ID
  const result = await db
    .insert(mentorados)
    .values(data)
    .returning({ id: mentorados.id });
  return result[0].id;
}

export async function getMetricasMensaisByMentorado(mentoradoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId))
    .orderBy(desc(metricasMensais.ano), desc(metricasMensais.mes));
}

export async function getMetricaMensal(
  mentoradoId: number,
  ano: number,
  mes: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(metricasMensais)
    .where(
      and(
        eq(metricasMensais.mentoradoId, mentoradoId),
        eq(metricasMensais.ano, ano),
        eq(metricasMensais.mes, mes)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertMetricaMensal(data: InsertMetricaMensal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getMetricaMensal(data.mentoradoId, data.ano, data.mes);

  if (existing) {
    await db
      .update(metricasMensais)
      .set(data)
      .where(eq(metricasMensais.id, existing.id));
    return existing.id;
  } else {
    const result = await db
      .insert(metricasMensais)
      .values(data)
      .returning({ id: metricasMensais.id });
    return result[0].id;
  }
}

export async function getFeedback(
  mentoradoId: number,
  ano: number,
  mes: number
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(feedbacks)
    .where(
      and(
        eq(feedbacks.mentoradoId, mentoradoId),
        eq(feedbacks.ano, ano),
        eq(feedbacks.mes, mes)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertFeedback(data: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getFeedback(data.mentoradoId, data.ano, data.mes);

  if (existing) {
    await db.update(feedbacks).set(data).where(eq(feedbacks.id, existing.id));
    return existing.id;
  } else {
    const result = await db
      .insert(feedbacks)
      .values(data)
      .returning({ id: feedbacks.id });
    return result[0].id;
  }
}
