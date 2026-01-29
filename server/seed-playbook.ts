
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { playbookModules, playbookItems } from "../drizzle/schema";

const seedData = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);

    console.log("Seeding Playbook data...");

    try {
        // --- NEON ESTRUTURA ---
        const [modEstrutura1] = await db.insert(playbookModules).values({
            title: "Fase 1: Onboarding e Diagnóstico",
            description: "Primeiros passos na metodologia Neon Estrutura.",
            order: 1,
            turma: "neon_estrutura"
        }).returning();

        await db.insert(playbookItems).values([
            { moduleId: modEstrutura1.id, title: "Assistir Aula Inaugural", type: "video", order: 1, contentUrl: "https://vimeo.com/" },
            { moduleId: modEstrutura1.id, title: "Preencher Diagnóstico Inicial", type: "link", order: 2, contentUrl: "https://typeform.com/" },
            { moduleId: modEstrutura1.id, title: "Definir Metas de Faturamento", type: "task", order: 3 },
            { moduleId: modEstrutura1.id, title: "Configurar Redes Sociais", type: "task", order: 4 },
        ]);

        const [modEstrutura2] = await db.insert(playbookModules).values({
            title: "Fase 2: Gestão Financeira",
            description: "Organizando a casa para crescer.",
            order: 2,
            turma: "neon_estrutura"
        }).returning();

         await db.insert(playbookItems).values([
            { moduleId: modEstrutura2.id, title: "Separar Contas PF e PJ", type: "task", order: 1 },
            { moduleId: modEstrutura2.id, title: "Planilha de Precificação", type: "link", order: 2 },
            { moduleId: modEstrutura2.id, title: "Definir Pró-labore", type: "task", order: 3 },
        ]);


         // --- NEON ESCALA ---
         const [modEscala1] = await db.insert(playbookModules).values({
            title: "Fase 1: Auditoria de Processos",
            description: "Onde estão os gargalos do seu crescimento?",
            order: 1,
            turma: "neon_escala"
        }).returning();

        await db.insert(playbookItems).values([
            { moduleId: modEscala1.id, title: "Mapeamento da Jornada do Cliente", type: "task", order: 1 },
            { moduleId: modEscala1.id, title: "Análise de LTV e CAC", type: "task", order: 2 },
            { moduleId: modEscala1.id, title: "Revisão de Scripts de Vendas", type: "task", order: 3 },
        ]);

        console.log("Playbook seeded successfully!");

    } catch (error) {
        console.error("Error seeding playbook:", error);
    } finally {
        // Close connection not strictly needed in serverless but good practice in logs
    }
};

seedData();
