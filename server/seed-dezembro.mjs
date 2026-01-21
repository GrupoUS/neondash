import { drizzle } from "drizzle-orm/mysql2";
import { mentorados, metricasMensais, feedbacks } from "../drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// Dados de dezembro 2025
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
        analiseMes:
          "Faturamento abaixo da meta. Necessita aumentar a produção de conteúdo.",
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
        analiseMes:
          "Excelente performance! Superou a meta e manteve alta produtividade.",
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
        analiseMes:
          "Performance excepcional! Liderança em faturamento e engajamento.",
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
        analiseMes:
          "Melhor performance do grupo! Excelência em todos os indicadores.",
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
        analiseMes:
          "Excelente performance com equilíbrio entre marketing e operação.",
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

async function seed() {
  console.log("🌱 Iniciando migração de dados de dezembro 2025...");

  try {
    // Seed Neon Estrutura
    for (const [nome, dados] of Object.entries(dadosDezembro.neon_estrutura)) {
      console.log(`Processando ${nome} (Neon Estrutura)...`);

      // Criar mentorado (assumindo userId fictício - ajustar conforme necessário)
      const [mentoradoResult] = await db.insert(mentorados).values({
        userId: 1, // Placeholder - ajustar com IDs reais
        nomeCompleto: nome,
        turma: "neon_estrutura",
        metaFaturamento: 16000,
      });

      const mentoradoId = Number(mentoradoResult.insertId);

      // Inserir métricas de dezembro
      await db.insert(metricasMensais).values({
        mentoradoId,
        ano: 2025,
        mes: 12,
        faturamento: dados.faturamento,
        lucro: dados.lucro,
        postsFeed: dados.postsFeed,
        stories: dados.stories,
        leads: dados.leads,
        procedimentos: dados.procedimentos,
      });

      // Inserir feedback
      await db.insert(feedbacks).values({
        mentoradoId,
        ano: 2025,
        mes: 12,
        analiseMes: dados.feedback.analiseMes,
        focoProximoMes: dados.feedback.focoProximoMes,
        sugestaoMentor: dados.feedback.sugestaoMentor,
      });
    }

    // Seed Neon Escala
    for (const [nome, dados] of Object.entries(dadosDezembro.neon_escala)) {
      console.log(`Processando ${nome} (Neon Escala)...`);

      const [mentoradoResult] = await db.insert(mentorados).values({
        userId: 1, // Placeholder
        nomeCompleto: nome,
        turma: "neon_escala",
        metaFaturamento: 50000,
      });

      const mentoradoId = Number(mentoradoResult.insertId);

      await db.insert(metricasMensais).values({
        mentoradoId,
        ano: 2025,
        mes: 12,
        faturamento: dados.faturamento,
        lucro: dados.lucro,
        postsFeed: dados.postsFeed,
        stories: dados.stories,
        leads: dados.leads,
        procedimentos: dados.procedimentos,
      });

      await db.insert(feedbacks).values({
        mentoradoId,
        ano: 2025,
        mes: 12,
        analiseMes: dados.feedback.analiseMes,
        focoProximoMes: dados.feedback.focoProximoMes,
        sugestaoMentor: dados.feedback.sugestaoMentor,
      });
    }

    console.log("✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

seed();
