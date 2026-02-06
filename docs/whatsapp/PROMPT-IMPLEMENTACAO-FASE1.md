# Prompt de Implementação - Fase 1: Backend - Estrutura

**Para**: Agente de Implementação (Claude Code / Desenvolvedor)  
**Tempo Estimado**: 5 horas  
**Dependências**: Nenhuma

---

## 🎯 Objetivo

Implementar a estrutura base para integração com Meta WhatsApp Cloud API no projeto neondash, incluindo schema do banco de dados, serviço de comunicação com a API e configuração de variáveis de ambiente.

---

## 📋 Contexto

O projeto neondash atualmente usa Z API para integração com WhatsApp. Estamos migrando para a Meta WhatsApp Cloud API oficial. Esta é a Fase 1 da migração, focada em criar a estrutura base sem afetar a integração existente com Z API.

**Arquitetura Atual**:
- Backend: Node.js + tRPC + Drizzle ORM
- Banco de dados: PostgreSQL
- Integração existente: Z API (manter funcionando)

**Credenciais Meta API**:
```bash
META_APP_ID=751534357596165
META_APP_SECRET=615e75c97772199c28df9d6946da46dd
META_SYSTEM_USER_ACCESS_TOKEN=EAAKrhDpryAUBQusym1w6ZCNmtn81MraDbU5pdTDKD88NlFx1XCLeZCoxZCrWPusYCMYW16pZBim1fdeSumQUrvsT3acjHQ3y0KkhcpXLpX3YK8PZAV2E8XUFP870SGaDvRXZBQv5bO7VBZAIP8d0OnxnzDBuP9j1GQtacILP6bTcWx5zaWSjlvOl79QtwCYcJXoSAZDZD
META_WEBHOOK_VERIFY_TOKEN=EAAKrhDpryAUBQusym1w6ZCNmtn81MraDbU5pdTDKD88NlFx1XCLeZCoxZCrWPusYCMYW16pZBim1fdeSumQUrvsT3acjHQ3y0KkhcpXLpX3YK8PZAV2E8XUFP870SGaDvRXZBQv5bO7VBZAIP8d0OnxnzDBuP9j1GQtacILP6bTcWx5zaWSjlvOl79QtwCYcJXoSAZDZD
META_WEBHOOK_URL=https://neondash.com.br/webhooks/meta/whatsapp
META_GRAPH_API_VERSION=v23.0
```

---

## ✅ Tarefas a Implementar

### AT-001: Atualizar Schema do Banco de Dados

**Arquivo**: `drizzle/schema.ts`

**O que fazer**:
1. Localizar a definição da tabela `mentorados`
2. Adicionar os seguintes campos APÓS os campos existentes do Z API:

```typescript
// Meta WhatsApp Cloud API Integration
metaWabaId: varchar("meta_waba_id", { length: 128 }),
metaPhoneNumberId: varchar("meta_phone_number_id", { length: 128 }),
metaAccessToken: text("meta_access_token"), // Encrypted - Permanent System User Access Token
metaConnected: simNaoEnum("meta_connected").default("nao"),
metaConnectedAt: timestamp("meta_connected_at"),
metaPhoneNumber: varchar("meta_phone_number", { length: 20 }),
```

3. Executar comandos de migração:
```bash
bun run drizzle:generate
bun run drizzle:migrate
```

**Validação**:
```bash
# Verificar se migração foi criada
ls -la drizzle/migrations/

# Verificar SQL gerado
cat drizzle/migrations/<timestamp>_add_meta_fields.sql

# Verificar no banco de dados
bun run drizzle:studio
# Abrir tabela mentorados e confirmar que novos campos existem
```

**Critérios de Sucesso**:
- ✅ Migração SQL gerada sem erros
- ✅ Migração aplicada ao banco de dados
- ✅ Novos campos visíveis no Drizzle Studio
- ✅ Campos existentes do Z API não foram alterados

---

### AT-002: Criar Novo Serviço `metaApiService.ts`

**Arquivo**: `server/services/metaApiService.ts` (NOVO)

**O que fazer**:
Criar um novo arquivo com o seguinte conteúdo:

```typescript
/**
 * Meta WhatsApp Cloud API Service
 * Handles all interactions with Meta's official WhatsApp Business API
 *
 * API Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v23.0";
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Simple logger for Meta API service
const noop = (): void => undefined;
const logger = {
  info: noop as (msg: string, ...args: unknown[]) => void,
  error: noop as (msg: string, ...args: unknown[]) => void,
};
if (process.env.NODE_ENV !== "production") {
  // biome-ignore lint/suspicious/noConsole: development logging only
  logger.info = (msg, ...a) => console.info(`[Meta API] ${msg}`, ...a);
  // biome-ignore lint/suspicious/noConsole: development logging only
  logger.error = (msg, ...a) => console.error(`[Meta API] ${msg}`, ...a);
}

export interface MetaApiCredentials {
  accessToken: string;
  phoneNumberId: string;
}

export interface MetaSendMessageRequest {
  to: string;
  message: string;
}

export interface MetaSendMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

/**
 * Build headers for Meta API requests
 */
function buildHeaders(accessToken: string): HeadersInit {
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Build Meta API URL for a specific endpoint
 */
function buildUrl(phoneNumberId: string, endpoint: string): string {
  return `${META_GRAPH_API_BASE}/${phoneNumberId}/${endpoint}`;
}

/**
 * Generic Meta API request handler with error handling
 */
async function metaApiRequest<T>(
  credentials: MetaApiCredentials,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const url = buildUrl(credentials.phoneNumberId, endpoint);
  const options: RequestInit = {
    method,
    headers: buildHeaders(credentials.accessToken),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  logger.info(`${method} ${url}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Meta API request failed (${response.status}): ${errorText}`);
    throw new Error(`Meta API request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Send a text message via Meta WhatsApp Cloud API
 */
export async function sendTextMessage(
  credentials: MetaApiCredentials,
  { to, message }: MetaSendMessageRequest
): Promise<MetaSendMessageResponse> {
  const normalizedPhone = normalizePhoneNumber(to);

  logger.info(`Sending message to ${normalizedPhone}`);

  return metaApiRequest<MetaSendMessageResponse>(
    credentials,
    "messages",
    "POST",
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: {
        body: message,
      },
    }
  );
}

/**
 * Normalize phone number for Meta API
 * - Removes non-digit characters
 * - Adds Brazil country code (55) if not present
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If less than 10 digits, likely incomplete
  if (digits.length < 10) {
    return digits;
  }

  // If doesn't start with country code, add Brazil's
  if (!digits.startsWith("55") && digits.length <= 11) {
    digits = `55${digits}`;
  }

  return digits;
}

/**
 * Format phone number for display
 * Returns phone in format: +55 (XX) XXXXX-XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 13) {
    // 55 + DDD + 9 + 8 digits
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    // 55 + DDD + 8 digits
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 11) {
    // DDD + 9 + 8 digits
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    // DDD + 8 digits
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Check if two phone numbers match (accounting for format differences)
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);

  // Direct match
  if (normalized1 === normalized2) return true;

  // Match ignoring 9th digit differences
  const last8_1 = normalized1.slice(-8);
  const last8_2 = normalized2.slice(-8);

  // Check if they share the same last 8 digits and same DDD
  const ddd1 = normalized1.length >= 12 ? normalized1.slice(-10, -8) : "";
  const ddd2 = normalized2.length >= 12 ? normalized2.slice(-10, -8) : "";

  return last8_1 === last8_2 && ddd1 === ddd2;
}

export const metaApiService = {
  sendTextMessage,
  normalizePhoneNumber,
  formatPhoneForDisplay,
  phonesMatch,
};
```

**Validação**:
```typescript
// Criar arquivo de teste: server/services/metaApiService.test.ts
import { describe, test, expect } from "bun:test";
import { normalizePhoneNumber, formatPhoneForDisplay, phonesMatch } from "./metaApiService";

describe("metaApiService", () => {
  test("normalizePhoneNumber - adiciona código do país", () => {
    expect(normalizePhoneNumber("11999999999")).toBe("5511999999999");
  });

  test("normalizePhoneNumber - remove formatação", () => {
    expect(normalizePhoneNumber("+55 (11) 99999-9999")).toBe("5511999999999");
  });

  test("formatPhoneForDisplay - formata corretamente", () => {
    expect(formatPhoneForDisplay("5511999999999")).toBe("+55 (11) 99999-9999");
  });

  test("phonesMatch - identifica números iguais", () => {
    expect(phonesMatch("5511999999999", "+55 (11) 99999-9999")).toBe(true);
  });
});

// Executar testes
bun test server/services/metaApiService.test.ts
```

**Critérios de Sucesso**:
- ✅ Arquivo criado sem erros de sintaxe
- ✅ Todos os testes passam
- ✅ Funções de normalização funcionam corretamente
- ✅ Logger está configurado

---

### AT-003: Adicionar Variáveis de Ambiente

**Arquivo**: `.env` (raiz do projeto)

**O que fazer**:
1. Adicionar as seguintes variáveis ao final do arquivo `.env`:

```bash
# ═══════════════════════════════════════════════════════════════════════════
# META WHATSAPP CLOUD API
# ═══════════════════════════════════════════════════════════════════════════

# App Credentials
META_APP_ID=751534357596165
META_APP_SECRET=615e75c97772199c28df9d6946da46dd

# System User Access Token (Token Permanente)
META_SYSTEM_USER_ACCESS_TOKEN=EAAKrhDpryAUBQusym1w6ZCNmtn81MraDbU5pdTDKD88NlFx1XCLeZCoxZCrWPusYCMYW16pZBim1fdeSumQUrvsT3acjHQ3y0KkhcpXLpX3YK8PZAV2E8XUFP870SGaDvRXZBQv5bO7VBZAIP8d0OnxnzDBuP9j1GQtacILP6bTcWx5zaWSjlvOl79QtwCYcJXoSAZDZD

# Webhook Configuration
META_WEBHOOK_VERIFY_TOKEN=EAAKrhDpryAUBQusym1w6ZCNmtn81MraDbU5pdTDKD88NlFx1XCLeZCoxZCrWPusYCMYW16pZBim1fdeSumQUrvsT3acjHQ3y0KkhcpXLpX3YK8PZAV2E8XUFP870SGaDvRXZBQv5bO7VBZAIP8d0OnxnzDBuP9j1GQtacILP6bTcWx5zaWSjlvOl79QtwCYcJXoSAZDZD
META_WEBHOOK_URL=https://neondash.com.br/webhooks/meta/whatsapp

# Graph API Version
META_GRAPH_API_VERSION=v23.0
```

2. Atualizar `.env.example` com as mesmas variáveis (mas sem valores):

```bash
# Meta WhatsApp Cloud API
META_APP_ID=
META_APP_SECRET=
META_SYSTEM_USER_ACCESS_TOKEN=
META_WEBHOOK_VERIFY_TOKEN=
META_WEBHOOK_URL=
META_GRAPH_API_VERSION=v23.0
```

**Validação**:
```typescript
// Criar script de teste: scripts/test-meta-env.ts
console.log("=== Meta API Environment Variables ===");
console.log("META_APP_ID:", process.env.META_APP_ID);
console.log("META_APP_SECRET:", process.env.META_APP_SECRET ? "✅ Set" : "❌ Not set");
console.log("META_SYSTEM_USER_ACCESS_TOKEN:", process.env.META_SYSTEM_USER_ACCESS_TOKEN ? "✅ Set" : "❌ Not set");
console.log("META_WEBHOOK_VERIFY_TOKEN:", process.env.META_WEBHOOK_VERIFY_TOKEN ? "✅ Set" : "❌ Not set");
console.log("META_WEBHOOK_URL:", process.env.META_WEBHOOK_URL);
console.log("META_GRAPH_API_VERSION:", process.env.META_GRAPH_API_VERSION);

// Executar
bun run scripts/test-meta-env.ts
```

**Critérios de Sucesso**:
- ✅ Todas as variáveis estão definidas no `.env`
- ✅ Script de teste mostra todos os valores
- ✅ `.env.example` atualizado
- ✅ Servidor reinicia sem erros

---

## 🔍 Validação Final da Fase 1

Após completar todas as tarefas, executar:

```bash
# 1. Verificar se o projeto compila
bun run build

# 2. Verificar se testes passam
bun test

# 3. Iniciar servidor em modo de desenvolvimento
bun run dev

# 4. Verificar logs
# Deve iniciar sem erros relacionados a Meta API
```

**Checklist de Conclusão**:
- [ ] Schema do banco de dados atualizado
- [ ] Migração aplicada com sucesso
- [ ] Serviço `metaApiService.ts` criado
- [ ] Testes do serviço passando
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor inicia sem erros
- [ ] Build passa sem erros

---

## 🚨 Rollback (Se Necessário)

Se algo der errado:

```bash
# Reverter migração do banco de dados
bun run drizzle:rollback

# Remover arquivo do serviço
rm server/services/metaApiService.ts
rm server/services/metaApiService.test.ts

# Remover variáveis do .env
# (editar manualmente e remover seção Meta API)

# Reverter commit
git reset --hard HEAD~1
```

---

## 📝 Próximos Passos

Após completar a Fase 1, você estará pronto para:
- **Fase 2**: Implementar webhooks para receber mensagens
- **Fase 3**: Criar rotas tRPC para o frontend
- **Fase 4**: Implementar UI de onboarding

---

**Documento criado por**: Manus AI  
**Data**: 2026-02-06  
**Versão**: 1.0
