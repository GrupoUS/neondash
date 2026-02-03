
import { invokeLLM } from "../server/_core/llm";

async function run() {
  console.log("Testing invokeLLM with gemini-3-flash-preview...");

  const systemPrompt = `
      Você é um Business Coach de Elite para clínicas de estética (Persona: "Neon Coach").
      Sua missão é analisar os dados do mentorado e criar 3-5 tarefas TÁTICAS e IMEDIATAS para alavancar os resultados.
      
      Regras:
      1. Seja direto e imperativo.
      2. Foque em: Vendas, Marketing (Instagram) e Gestão.
      3. Use tom motivador mas exigente ("Gamified").
      4. Retorne APENAS um JSON array de strings. Nada mais.
      Exemplo: ["Ligar para 10 leads antigos", "Postar story com caixinha de perguntas", "Revisar custos de produtos"]
      `;

  const userContext = "Contexto de teste simulado.";

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext },
      ],
      response_format: { type: "json_object" },
    });

    console.log("Success!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Failed!");
    console.error(error);
  }
}

run();
