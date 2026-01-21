import { getDb } from "./db";
import { badges } from "../drizzle/schema";

/**
 * Seed default badges into database
 */
async function seedBadges() {
  const db = getDb();

  if (!db) {
    throw new Error("Failed to connect to database");
  }

  const defaultBadges = [
    // Faturamento
    {
      codigo: "meta_faturamento",
      nome: "Meta Batida",
      descricao: "Atingiu a meta de faturamento do mês",
      icone: "Trophy",
      cor: "gold",
      categoria: "faturamento" as const,
      criterio: JSON.stringify({
        type: "faturamento",
        operator: ">=",
        target: "meta",
      }),
      pontos: 50,
    },
    {
      codigo: "super_faturamento",
      nome: "Super Performance",
      descricao: "Ultrapassou 150% da meta de faturamento",
      icone: "Rocket",
      cor: "purple",
      categoria: "faturamento" as const,
      criterio: JSON.stringify({
        type: "faturamento",
        operator: ">=",
        target: "meta*1.5",
      }),
      pontos: 100,
    },
    // Conteúdo
    {
      codigo: "criador_conteudo",
      nome: "Criador de Conteúdo",
      descricao: "Publicou todos os posts e stories do mês",
      icone: "Camera",
      cor: "blue",
      categoria: "conteudo" as const,
      criterio: JSON.stringify({
        type: "conteudo",
        operator: ">=",
        target: "meta",
      }),
      pontos: 30,
    },
    // Consistência
    {
      codigo: "consistente_3",
      nome: "Consistência Bronze",
      descricao: "Bateu a meta 3 meses consecutivos",
      icone: "Award",
      cor: "bronze",
      categoria: "consistencia" as const,
      criterio: JSON.stringify({ type: "streak", months: 3 }),
      pontos: 75,
    },
    {
      codigo: "consistente_6",
      nome: "Consistência Prata",
      descricao: "Bateu a meta 6 meses consecutivos",
      icone: "Medal",
      cor: "silver",
      categoria: "consistencia" as const,
      criterio: JSON.stringify({ type: "streak", months: 6 }),
      pontos: 150,
    },
    {
      codigo: "consistente_12",
      nome: "Consistência Ouro",
      descricao: "Bateu a meta 12 meses consecutivos",
      icone: "Crown",
      cor: "gold",
      categoria: "consistencia" as const,
      criterio: JSON.stringify({ type: "streak", months: 12 }),
      pontos: 300,
    },
    // Operacional
    {
      codigo: "leads_master",
      nome: "Mestre dos Leads",
      descricao: "Gerou mais de 100 leads no mês",
      icone: "Users",
      cor: "blue",
      categoria: "operacional" as const,
      criterio: JSON.stringify({ type: "leads", operator: ">=", value: 100 }),
      pontos: 40,
    },
    // Especial
    {
      codigo: "primeiro_lugar",
      nome: "Campeão do Mês",
      descricao: "Conquistou o 1º lugar no ranking mensal",
      icone: "Star",
      cor: "gold",
      categoria: "especial" as const,
      criterio: JSON.stringify({ type: "ranking", position: 1 }),
      pontos: 100,
    },
  ];

  console.log("[Seed] Inserting default badges...");

  for (const badge of defaultBadges) {
    try {
      await db
        .insert(badges)
        .values(badge)
        .onConflictDoNothing({ target: badges.codigo });
      console.log(`[Seed] Badge "${badge.codigo}" inserted/skipped`);
    } catch (error) {
      console.error(`[Seed] Failed to insert badge "${badge.codigo}":`, error);
    }
  }

  console.log("[Seed] Badges seeding complete!");
}

/**
 * Main seed function
 */
async function main() {
  console.log("[Seed] Starting database seeding...");

  await seedBadges();

  console.log("[Seed] All seeding complete!");
  process.exit(0);
}

main().catch(error => {
  console.error("[Seed] Fatal error:", error);
  process.exit(1);
});
