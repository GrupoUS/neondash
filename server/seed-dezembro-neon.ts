/**
 * Seed de Dados de Dezembro 2025 para Neon PostgreSQL
 *
 * Este script:
 * 1. Mapeia nomes similares entre seed e banco existente
 * 2. Insere métricas de dezembro 2025 para mentorados existentes
 * 3. Cria novos mentorados para os que ainda não estão cadastrados
 * 4. Insere feedbacks do mentor
 */

import { eq, ilike } from "drizzle-orm";
import { feedbacks, mentorados, metricasMensais } from "../drizzle/schema";
import { getDb } from "./db";

// Dados de dezembro 2025 do arquivo original
const dadosDezembro = {
  neon_estrutura: {
    "Ana Scaravate": {
      faturamento: 16000,
      lucro: 8000,
      postsFeed: 12,
      stories: 60,
      leads: 25,
      procedimentos: 18,
      feedback: {
        analiseMes:
          "Atingiu a meta de faturamento com consistência. Boa presença nas redes sociais.",
        focoProximoMes: "Aumentar a conversão de leads em procedimentos",
        sugestaoMentor:
          "Implemente a campanha de avaliação gratuita para atrair novos clientes e fortalecer o relacionamento com leads existentes.",
      },
    },
    "Tamara Martins": {
      faturamento: 12000,
      lucro: 6000,
      postsFeed: 8,
      stories: 40,
      leads: 15,
      procedimentos: 12,
      feedback: {
        analiseMes: "Faturamento abaixo da meta. Necessita aumentar a produção de conteúdo.",
        focoProximoMes: "Aumentar presença digital e captação de leads",
        sugestaoMentor:
          "Foque na prospecção ativa e crie uma rotina de postagens mais frequente para aumentar a visibilidade.",
      },
    },
    "Élica Pires": {
      faturamento: 18000,
      lucro: 9000,
      postsFeed: 15,
      stories: 75,
      leads: 30,
      procedimentos: 22,
      feedback: {
        analiseMes: "Excelente performance! Superou a meta e manteve alta produtividade.",
        focoProximoMes: "Manter o ritmo e explorar upsell",
        sugestaoMentor:
          "Continue com a estratégia atual e implemente pacotes premium para aumentar o ticket médio.",
      },
    },
    "Ana Cláudia": {
      faturamento: 14000,
      lucro: 7000,
      postsFeed: 10,
      stories: 50,
      leads: 20,
      procedimentos: 15,
      feedback: {
        analiseMes: "Próximo da meta. Boa consistência operacional.",
        focoProximoMes: "Aumentar ticket médio dos procedimentos",
        sugestaoMentor:
          "Trabalhe a venda de protocolos combinados e produtos complementares para aumentar o valor por atendimento.",
      },
    },
    "Iza Nunes": {
      faturamento: 15000,
      lucro: 7500,
      postsFeed: 11,
      stories: 55,
      leads: 22,
      procedimentos: 16,
      feedback: {
        analiseMes: "Atingiu a meta com margem de lucro saudável.",
        focoProximoMes: "Escalar atendimentos sem perder qualidade",
        sugestaoMentor:
          "Otimize sua agenda e considere treinar uma assistente para aumentar a capacidade de atendimento.",
      },
    },
  },
  neon_escala: {
    "Lana Máximo": {
      faturamento: 65000,
      lucro: 32500,
      postsFeed: 20,
      stories: 100,
      leads: 80,
      procedimentos: 60,
      feedback: {
        analiseMes: "Performance excepcional! Liderança em faturamento e engajamento.",
        focoProximoMes: "Consolidar processos para crescimento sustentável",
        sugestaoMentor:
          "Documente seus processos de vendas e atendimento para replicar o sucesso de forma escalável.",
      },
    },
    "Thaís Olímpia": {
      faturamento: 95000,
      lucro: 47500,
      postsFeed: 25,
      stories: 120,
      leads: 100,
      procedimentos: 75,
      feedback: {
        analiseMes: "Melhor performance do grupo! Excelência em todos os indicadores.",
        focoProximoMes: "Manter liderança e explorar novos nichos",
        sugestaoMentor:
          "Explore parcerias estratégicas e considere lançar um produto digital para diversificar receita.",
      },
    },
    "Kleber Oliveira": {
      faturamento: 68000,
      lucro: 34000,
      postsFeed: 18,
      stories: 90,
      leads: 70,
      procedimentos: 55,
      feedback: {
        analiseMes: "Ótimo faturamento com boa margem de lucro.",
        focoProximoMes: "Aumentar frequência de conteúdo",
        sugestaoMentor:
          "Aumente a produção de stories para 120+/mês para manter o engajamento e atrair novos leads.",
      },
    },
    "Jéssica Borges": {
      faturamento: 28000,
      lucro: 14000,
      postsFeed: 12,
      stories: 60,
      leads: 35,
      procedimentos: 25,
      feedback: {
        analiseMes: "Faturamento abaixo do potencial da turma Escala.",
        focoProximoMes: "Intensificar prospecção e aumentar ticket médio",
        sugestaoMentor:
          "Implemente a estratégia de geração de demanda com campanhas de avaliação e foque em procedimentos de maior valor.",
      },
    },
    "Carmen Lúcia": {
      faturamento: 65000,
      lucro: 32500,
      postsFeed: 19,
      stories: 95,
      leads: 75,
      procedimentos: 58,
      feedback: {
        analiseMes: "Excelente performance com equilíbrio entre marketing e operação.",
        focoProximoMes: "Escalar sem perder qualidade",
        sugestaoMentor:
          "Estruture uma equipe de apoio para aumentar a capacidade de atendimento mantendo o padrão de qualidade.",
      },
    },
    "Alina Souza": {
      faturamento: 15000,
      lucro: 7500,
      postsFeed: 8,
      stories: 40,
      leads: 18,
      procedimentos: 12,
      feedback: {
        analiseMes: "Faturamento muito abaixo do esperado para a turma Escala.",
        focoProximoMes: "Revisar estratégia completa de marketing e vendas",
        sugestaoMentor:
          "Priorize a vitrine ativa com posts diários e stories constantes. Considere mentoria individual para ajuste de rota.",
      },
    },
    "Dra. Milena": {
      faturamento: 45000,
      lucro: 22500,
      postsFeed: 15,
      stories: 75,
      leads: 55,
      procedimentos: 40,
      feedback: {
        analiseMes: "Boa performance com espaço para crescimento.",
        focoProximoMes: "Aumentar conversão de leads",
        sugestaoMentor:
          "Implemente um funil de vendas estruturado com follow-up automatizado para melhorar a taxa de conversão.",
      },
    },
    "Dra. Bruna": {
      faturamento: 38000,
      lucro: 19000,
      postsFeed: 14,
      stories: 70,
      leads: 45,
      procedimentos: 32,
      feedback: {
        analiseMes: "Performance sólida com margem para otimização.",
        focoProximoMes: "Aumentar ticket médio e frequência de atendimentos",
        sugestaoMentor:
          "Trabalhe pacotes de tratamento e fidelização de clientes para aumentar o LTV (Lifetime Value).",
      },
    },
    "Dra. Jéssica": {
      faturamento: 32000,
      lucro: 16000,
      postsFeed: 13,
      stories: 65,
      leads: 40,
      procedimentos: 28,
      feedback: {
        analiseMes: "Performance mediana com potencial de crescimento.",
        focoProximoMes: "Aumentar presença digital e otimizar conversão",
        sugestaoMentor:
          "Crie uma estratégia de conteúdo educativo para posicionar-se como autoridade e atrair leads qualificados.",
      },
    },
  },
};

// Mapeamento de nomes (seed -> banco)
// Baseado em similaridade de nomes entre o seed e os mentorados atuais
const nameMapping: Record<string, string> = {
  "Ana Scaravate": "Ana Mara Santos", // Similar (Ana)
  "Tamara Martins": "Enfa Tamara Dilma", // Similar (Tamara)
  "Élica Pires": "Elica Pereira", // Similar (Elica/Élica)
  "Iza Nunes": "Iza Rafaela Bezerra Pionório Freires", // Similar (Iza)
  // Os demais serão criados como novos mentorados
};

async function findMentoradoByName(db: ReturnType<typeof getDb>, seedName: string) {
  // Primeiro tenta mapeamento direto
  const mappedName = nameMapping[seedName];
  if (mappedName) {
    const [found] = await db
      .select()
      .from(mentorados)
      .where(ilike(mentorados.nomeCompleto, `%${mappedName}%`))
      .limit(1);
    if (found) return found;
  }

  // Tenta busca por similaridade
  const nameParts = seedName.split(" ");
  for (const part of nameParts) {
    if (part.length < 3) continue;
    const [found] = await db
      .select()
      .from(mentorados)
      .where(ilike(mentorados.nomeCompleto, `%${part}%`))
      .limit(1);
    if (found) return found;
  }

  return null;
}

async function createMentorado(
  db: ReturnType<typeof getDb>,
  nome: string,
  metaFaturamento: number
) {
  const [result] = await db
    .insert(mentorados)
    .values({
      nomeCompleto: nome,
      turma: "neon",
      metaFaturamento,
      ativo: "sim",
      onboardingCompleted: "nao",
    })
    .returning({ id: mentorados.id });
  return result.id;
}

async function insertMetricas(
  db: ReturnType<typeof getDb>,
  mentoradoId: number,
  dados: {
    faturamento: number;
    lucro: number;
    postsFeed: number;
    stories: number;
    leads: number;
    procedimentos: number;
  }
) {
  // Check if metrics already exist for this month
  const [existing] = await db
    .select()
    .from(metricasMensais)
    .where(eq(metricasMensais.mentoradoId, mentoradoId))
    .limit(1);

  if (existing) {
    // Update existing
    await db
      .update(metricasMensais)
      .set({
        faturamento: dados.faturamento,
        lucro: dados.lucro,
        postsFeed: dados.postsFeed,
        stories: dados.stories,
        leads: dados.leads,
        procedimentos: dados.procedimentos,
        updatedAt: new Date(),
      })
      .where(eq(metricasMensais.id, existing.id));
    return existing.id;
  }

  const [result] = await db
    .insert(metricasMensais)
    .values({
      mentoradoId,
      ano: 2025,
      mes: 12,
      faturamento: dados.faturamento,
      lucro: dados.lucro,
      postsFeed: dados.postsFeed,
      stories: dados.stories,
      leads: dados.leads,
      procedimentos: dados.procedimentos,
    })
    .returning({ id: metricasMensais.id });
  return result.id;
}

async function insertFeedback(
  db: ReturnType<typeof getDb>,
  mentoradoId: number,
  feedback: { analiseMes: string; focoProximoMes: string; sugestaoMentor: string }
) {
  // Check if feedback already exists
  const [existing] = await db
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.mentoradoId, mentoradoId))
    .limit(1);

  if (existing) {
    await db
      .update(feedbacks)
      .set({
        analiseMes: feedback.analiseMes,
        focoProximoMes: feedback.focoProximoMes,
        sugestaoMentor: feedback.sugestaoMentor,
        updatedAt: new Date(),
      })
      .where(eq(feedbacks.id, existing.id));
    return existing.id;
  }

  const [result] = await db
    .insert(feedbacks)
    .values({
      mentoradoId,
      ano: 2025,
      mes: 12,
      analiseMes: feedback.analiseMes,
      focoProximoMes: feedback.focoProximoMes,
      sugestaoMentor: feedback.sugestaoMentor,
    })
    .returning({ id: feedbacks.id });
  return result.id;
}

export async function seedDezembroData() {
  const db = getDb();
  const results = {
    mapped: [] as string[],
    created: [] as string[],
    errors: [] as string[],
  };

  console.log("🌱 Iniciando seed de dados de dezembro 2025...\n");

  // Process Neon Estrutura (meta: 16000)
  console.log("📊 Processando Neon Estrutura...");
  for (const [nome, dados] of Object.entries(dadosDezembro.neon_estrutura)) {
    try {
      let mentorado = await findMentoradoByName(db, nome);
      let isNew = false;

      if (!mentorado) {
        const id = await createMentorado(db, nome, 16000);
        mentorado = { id } as typeof mentorado;
        isNew = true;
        results.created.push(nome);
        console.log(`  ✨ Criado: ${nome} (ID: ${id})`);
      } else {
        results.mapped.push(`${nome} → ${mentorado.nomeCompleto}`);
        console.log(`  🔗 Mapeado: ${nome} → ${mentorado.nomeCompleto} (ID: ${mentorado.id})`);
      }

      await insertMetricas(db, mentorado.id, dados);
      await insertFeedback(db, mentorado.id, dados.feedback);
      console.log(`  ✅ Métricas e feedback inseridos para ${nome}`);
    } catch (error) {
      results.errors.push(`${nome}: ${error}`);
      console.error(`  ❌ Erro ao processar ${nome}:`, error);
    }
  }

  // Process Neon Escala (meta: 50000)
  console.log("\n📊 Processando Neon Escala...");
  for (const [nome, dados] of Object.entries(dadosDezembro.neon_escala)) {
    try {
      let mentorado = await findMentoradoByName(db, nome);
      let isNew = false;

      if (!mentorado) {
        const id = await createMentorado(db, nome, 50000);
        mentorado = { id } as typeof mentorado;
        isNew = true;
        results.created.push(nome);
        console.log(`  ✨ Criado: ${nome} (ID: ${id})`);
      } else {
        results.mapped.push(`${nome} → ${mentorado.nomeCompleto}`);
        console.log(`  🔗 Mapeado: ${nome} → ${mentorado.nomeCompleto} (ID: ${mentorado.id})`);
      }

      await insertMetricas(db, mentorado.id, dados);
      await insertFeedback(db, mentorado.id, dados.feedback);
      console.log(`  ✅ Métricas e feedback inseridos para ${nome}`);
    } catch (error) {
      results.errors.push(`${nome}: ${error}`);
      console.error(`  ❌ Erro ao processar ${nome}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 RESUMO DA MIGRAÇÃO");
  console.log("=".repeat(60));
  console.log(`✅ Mentorados mapeados: ${results.mapped.length}`);
  results.mapped.forEach((m) => console.log(`   - ${m}`));
  console.log(`\n✨ Mentorados criados: ${results.created.length}`);
  results.created.forEach((m) => console.log(`   - ${m}`));
  if (results.errors.length > 0) {
    console.log(`\n❌ Erros: ${results.errors.length}`);
    results.errors.forEach((e) => console.log(`   - ${e}`));
  }
  console.log("=".repeat(60));

  return results;
}

// Run if executed directly
if (process.argv[1]?.includes("seed-dezembro-neon")) {
  seedDezembroData()
    .then((results) => {
      console.log("\n🎉 Migração concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erro fatal:", error);
      process.exit(1);
    });
}
