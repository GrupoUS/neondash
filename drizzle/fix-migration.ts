import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function fixProcedimentosInteresse() {
  console.log("🔧 Fixing procedimentos_interesse column...");
  
  try {
    // Step 1: Clear existing data 
    await sql`UPDATE leads SET procedimentos_interesse = NULL WHERE procedimentos_interesse IS NOT NULL`;
    console.log("✓ Cleared existing text[] data");
    
    // Step 2: Alter column type with USING
    await sql`ALTER TABLE leads ALTER COLUMN procedimentos_interesse SET DATA TYPE integer[] USING procedimentos_interesse::integer[]`;
    console.log("✓ Changed column type to integer[]");
    
    console.log("\n✅ Migration complete! Now run: bun run db:push");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixProcedimentosInteresse();
