import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, mentorados } from "../../drizzle/schema";
import { createMentorado, getMentoradoByEmail } from "../mentorados";

interface ClerkUserPayload {
  id: string;
  email_addresses: { email_address: string; id: string; verification: { status: string } }[];
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  public_metadata: Record<string, any>;
}

export async function syncClerkUser(user: ClerkUserPayload) {
  const db = await getDb();
  if (!db) {
    console.error("[UserService] Database connection failed");
    return;
  }

  const primaryEmail = user.email_addresses[0]?.email_address;
  if (!primaryEmail) {
    console.warn(`[UserService] User ${user.id} has no email address`);
    return;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");

  console.log(`[UserService] Syncing user ${user.id} (${primaryEmail})`);

  try {
    // 1. Upsert User
    await db
      .insert(users)
      .values({
        clerkId: user.id,
        email: primaryEmail,
        name: fullName || "User",
        imageUrl: user.image_url,
        role: "user", // Default role
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: primaryEmail,
          name: fullName || "User",
          imageUrl: user.image_url,
          updatedAt: new Date(),
        },
      });

    // 2. Get the new/updated User ID
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
      columns: { id: true },
    });

    if (!userRecord) {
      console.error(`[UserService] Failed to retrieve user after insert: ${user.id}`);
      return;
    }

    // 3. Link or Create Mentorado
    const existingMentorado = await getMentoradoByEmail(primaryEmail);

    if (existingMentorado) {
      // Link existing mentorado
      if (!existingMentorado.userId) {
        console.log(`[UserService] Linking existing mentorado ${existingMentorado.id} to user ${userRecord.id}`);
        await db
          .update(mentorados)
          .set({ userId: userRecord.id })
          .where(eq(mentorados.id, existingMentorado.id));
      } else {
        console.log(`[UserService] Mentorado ${existingMentorado.id} already linked to user ${existingMentorado.userId}`);
      }
    } else {
      // Create new mentorado
      console.log(`[UserService] Creating new mentorado for user ${userRecord.id}`);
      
      const turma = (user.public_metadata?.turma as "neon_estrutura" | "neon_escala") || "neon_estrutura";
      
      await createMentorado({
        userId: userRecord.id,
        nomeCompleto: fullName || primaryEmail.split("@")[0],
        email: primaryEmail,
        turma: turma,
        metaFaturamento: 16000, 
        fotoUrl: user.image_url,
        ativo: "sim"
      });
    }

    console.log(`[UserService] Successfully synced user ${user.id}`);

  } catch (error) {
    console.error("[UserService] Error syncing user:", error);
    throw error;
  }
}
