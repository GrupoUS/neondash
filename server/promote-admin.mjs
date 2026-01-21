import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const ADMIN_EMAIL = "msm.jur@gmail.com";

async function promoteToAdmin() {
  console.log(`🔐 Promovendo ${ADMIN_EMAIL} para administrador...`);

  try {
    // Buscar usuário pelo email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (existingUsers.length === 0) {
      console.log(
        `⚠️  Usuário com email ${ADMIN_EMAIL} ainda não existe no banco.`
      );
      console.log(`📝 Instruções:`);
      console.log(`   1. Acesse a plataforma e faça login com ${ADMIN_EMAIL}`);
      console.log(`   2. Após o primeiro login, execute este script novamente`);
      console.log(
        `   3. O sistema promoverá automaticamente sua conta para admin`
      );
      return;
    }

    const user = existingUsers[0];

    if (user.role === "admin") {
      console.log(`✅ ${ADMIN_EMAIL} já é administrador!`);
      return;
    }

    // Promover para admin
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));

    console.log(`✅ ${ADMIN_EMAIL} promovido para administrador com sucesso!`);
    console.log(`🎉 Agora você tem acesso completo ao sistema.`);
  } catch (error) {
    console.error("❌ Erro ao promover usuário:", error);
    throw error;
  }
}

promoteToAdmin();
