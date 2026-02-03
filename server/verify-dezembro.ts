import { and, eq } from "drizzle-orm";
import { mentorados, metricasMensais } from "../drizzle/schema";
import { getDb } from "./db";

async function verify() {
  const db = getDb();
  console.log("📊 Verificando dados de dezembro 2025...\n");

  const result = await db
    .select({
      nome: mentorados.nomeCompleto,
      faturamento: metricasMensais.faturamento,
      lucro: metricasMensais.lucro,
      leads: metricasMensais.leads,
    })
    .from(metricasMensais)
    .innerJoin(mentorados, eq(mentorados.id, metricasMensais.mentoradoId))
    .where(and(eq(metricasMensais.ano, 2025), eq(metricasMensais.mes, 12)));

  console.log("Métricas dezembro 2025:");
  for (const r of result) {
    console.log(`  ${r.nome}: R$${r.faturamento} fat | R$${r.lucro} lucro | ${r.leads} leads`);
  }
  console.log(`\nTotal: ${result.length} registros de dezembro 2025`);
  process.exit(0);
}

verify();
