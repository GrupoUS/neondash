
import { invokeLLM } from "../server/_core/llm";

async function test() {
  try {
    console.log("Testing invokeLLM with Gemini 3 Flash Preview...");
    const result = await invokeLLM({
      messages: [{ role: "user", content: "Hello, are you Gemini?" }],
    });
    console.log("Result:", result.choices[0].message.content);
    console.log("Model Used:", result.model);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
