import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not found");
  }

  console.log(
    "⚠️  WARNING: This will DROP the 'public' schema and recreate it."
  );
  console.log("⚠️  All data will be lost!");
  console.log("Waiting 5 seconds... Press Ctrl+C to cancel.");

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Resetting database...");

  const sql = neon(connectionString);

  try {
    // Drop and recreate public schema
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO postgres`;
    await sql`GRANT ALL ON SCHEMA public TO public`;

    console.log("✅ Schema public reset successfully");
    console.log("Run 'bun run db:push' (or db:migrate) to apply schema");
    console.log("Run 'bun run db:seed' to seed data");
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

main();
