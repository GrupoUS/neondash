#!/usr/bin/env bun
/**
 * Script de teste para verificar a integração com o Google Gemini LLM
 * Este script verifica:
 * 1. Se a variável GEMINI_API_KEY está configurada
 * 2. Se a conexão com a API do Gemini está funcionando
 * 3. Se o modelo gemini-3-flash-preview está acessível
 * 
 * Execute com: bun run test-llm-integration.ts
 */

import { testLLMConnection, validateLLMConfig } from "./server/_core/llm";

console.log("===================================================");
console.log("🧪 TESTE DE INTEGRAÇÃO COM GOOGLE GEMINI LLM");
console.log("===================================================\n");

// Step 1: Validate configuration
console.log("📋 Passo 1: Validando configuração...\n");
const config = validateLLMConfig();

console.log("✅ Configuração:");
console.log(`   Provedor: ${config.provider}`);
console.log(`   Modelo: ${config.model}`);
console.log(`   Válida: ${config.isValid ? "✅ SIM" : "❌ NÃO"}`);

if (config.errors.length > 0) {
  console.log("\n❌ Erros encontrados:");
  config.errors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
}

console.log("\n---------------------------------------------------\n");

// Step 2: Test connection
console.log("📡 Passo 2: Testando conexão com a API...\n");

testLLMConnection()
  .then((result) => {
    console.log("✅ Resultado do teste:");
    console.log(`   Sucesso: ${result.success ? "✅ SIM" : "❌ NÃO"}`);
    console.log(`   Mensagem: ${result.message}`);
    
    if (result.details) {
      console.log("\n📊 Detalhes:");
      console.log(`   ${JSON.stringify(result.details, null, 2)}`);
    }

    console.log("\n===================================================");
    
    if (result.success) {
      console.log("🎉 INTEGRAÇÃO FUNCIONANDO CORRETAMENTE!");
      process.exit(0);
    } else {
      console.log("❌ INTEGRAÇÃO COM PROBLEMAS");
      console.log("\n💡 Dicas para resolver:");
      console.log("   1. Verifique se a GEMINI_API_KEY está configurada no .env");
      console.log("   2. Obtenha uma chave em: https://aistudio.google.com/app/apikey");
      console.log("   3. Reinicie o servidor após configurar a chave");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ Erro inesperado durante o teste:");
    console.error(error);
    process.exit(1);
  });
