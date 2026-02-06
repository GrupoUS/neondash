# PRP: Migração de Z API para Meta WhatsApp Cloud API

## 1. Visão Geral

Este documento descreve o plano para migrar a integração de WhatsApp do projeto **neondash** da API não-oficial **Z API** para a **API oficial da Meta (WhatsApp Cloud API)**. O objetivo é permitir que os mentorados do sistema cadastrem seus próprios números de telefone para se comunicarem com seus clientes de forma mais robusta, escalável e segura.

- **Complexidade**: L6 - Arquitetura e Integração
- **Tempo Estimado**: 3-5 dias
- **Parallel-Safe**: Não

## 2. Requisitos

1.  **Onboarding de Mentorados**: Mentorados devem conseguir conectar seus próprios números de WhatsApp à plataforma neondash através de um fluxo de onboarding seguro e guiado (Embedded Signup).
2.  **Envio de Mensagens**: O sistema deve ser capaz de enviar mensagens de texto e mídia para os clientes dos mentorados através da API da Meta.
3.  **Recebimento de Mensagens**: O sistema deve ser capaz de receber mensagens de clientes e associá-las ao mentorado e lead corretos.
4.  **Status de Mensagens**: O sistema deve receber e processar atualizações de status das mensagens (enviada, entregue, lida).
5.  **Gerenciamento de Conexão**: Mentorados devem conseguir visualizar o status da conexão do seu número de WhatsApp e desconectá-lo se necessário.
6.  **Migração de Dados**: As credenciais e o estado da conexão do Z API devem ser mantidos durante a migração, e um novo conjunto de campos para a API da Meta deve ser adicionado.
7.  **Coexistência (Temporária)**: O sistema deve suportar ambas as integrações (Z API e Meta API) durante o período de migração para garantir uma transição suave.

## 3. Arquitetura Proposta

A migração seguirá uma abordagem de **coexistência e migração gradual**. A nova integração com a Meta Cloud API será construída em paralelo à existente com o Z API. Novas colunas serão adicionadas à tabela `mentorados` para armazenar as credenciais da Meta API, e novos serviços, rotas e webhooks serão criados para lidar com a lógica da nova API.

### 3.1. Alterações no Banco de Dados

Adicionar as seguintes colunas à tabela `mentorados` em `drizzle/schema.ts`:

```typescript
// Meta WhatsApp Cloud API Integration
metaWabaId: varchar("meta_waba_id", { length: 128 }), // WhatsApp Business Account ID
metaPhoneNumberId: varchar("meta_phone_number_id", { length: 128 }), // Phone Number ID
metaAccessToken: text("meta_access_token"), // Encrypted - Permanent System User Access Token
metaConnected: simNaoEnum("meta_connected").default("nao"),
metaConnectedAt: timestamp("meta_connected_at"),
metaPhoneNumber: varchar("meta_phone_number", { length: 20 }),
```

### 3.2. Estrutura de Arquivos

- **`server/services/metaApiService.ts`**: Novo serviço para encapsular a lógica de comunicação com a Meta Cloud API.
- **`server/metaApiRouter.ts`**: Novas rotas tRPC para o frontend interagir com a Meta API (onboarding, status, envio de mensagens).
- **`server/webhooks/metaWebhook.ts`**: Novo handler para os webhooks da Meta (recebimento de mensagens, status).
- **`client/src/components/whatsapp/MetaConnectionCard.tsx`**: Novo componente de UI para o onboarding e gerenciamento da conexão com a Meta API.

## 4. Plano de Implementação (Atomic Tasks)

### Fase 1: Backend - Estrutura e Configuração

| ID | Título | Prioridade | Validação | Rollback |
|---|---|---|---|---|
| **AT-001** | Atualizar Schema do Banco de Dados | Crítica | `bun run drizzle:generate` e verificar o SQL gerado | Reverter as alterações no arquivo `drizzle/schema.ts` |
| **AT-002** | Criar Novo Serviço `metaApiService.ts` | Alta | Testes unitários para as funções do serviço | Excluir o arquivo `server/services/metaApiService.ts` |
| **AT-003** | Adicionar Variáveis de Ambiente | Alta | Verificar se as variáveis são lidas corretamente no `metaApiService.ts` | Remover as variáveis do `.env` |

### Fase 2: Backend - Webhooks

| ID | Título | Prioridade | Validação | Rollback |
|---|---|---|---|---|
| **AT-004** | Criar Rota de Webhook em `metaWebhook.ts` | Crítica | Testar o endpoint com um payload de exemplo da documentação da Meta | Remover o arquivo `server/webhooks/metaWebhook.ts` |
| **AT-005** | Implementar Lógica de Recebimento de Mensagens | Alta | Enviar uma mensagem de teste e verificar se ela é salva no banco de dados | Comentar a lógica de recebimento de mensagens |
| **AT-006** | Implementar Lógica de Atualização de Status | Média | Enviar uma mensagem e verificar se o status é atualizado no banco de dados | Comentar a lógica de atualização de status |

### Fase 3: Backend - API e Rotas

| ID | Título | Prioridade | Validação | Rollback |
|---|---|---|---|---|
| **AT-007** | Criar `metaApiRouter.ts` com Rotas tRPC | Alta | Chamar as rotas tRPC a partir de um cliente de teste | Excluir o arquivo `server/metaApiRouter.ts` |
| **AT-008** | Implementar Rota de Envio de Mensagem | Alta | Enviar uma mensagem através da nova rota e verificar se ela é entregue | Comentar a rota de envio de mensagem |
| **AT-009** | Implementar Rota de Status da Conexão | Média | Chamar a rota e verificar se o status retornado está correto | Comentar a rota de status da conexão |

### Fase 4: Frontend - Onboarding e UI

| ID | Título | Prioridade | Validação | Rollback |
|---|---|---|---|---|
| **AT-010** | Criar Componente `MetaConnectionCard.tsx` | Alta | Renderizar o componente em uma página de teste | Excluir o arquivo do componente |
| **AT-011** | Implementar Fluxo de Embedded Signup | Crítica | Concluir o fluxo de onboarding e verificar se as credenciais são salvas no banco de dados | Desativar o botão de onboarding |
| **AT-012** | Atualizar UI de Chat para Suportar Meta API | Média | Enviar e receber mensagens na UI de chat usando a nova API | Reverter as alterações na UI de chat |

### Fase 5: Migração e Limpeza

| ID | Título | Prioridade | Validação | Rollback |
|---|---|---|---|---|
| **AT-013** | Criar Script de Migração para Mentorados Existentes | Baixa | Executar o script em um ambiente de teste e verificar se os dados são migrados corretamente | Restaurar o backup do banco de dados |
| **AT-014** | Desativar Gradualmente a Integração com Z API | Baixa | Monitorar o uso e desativar a integração para um grupo de usuários | Reativar a integração com Z API |
| **AT-015** | Remover Código Legado do Z API | Baixa | Verificar se a aplicação continua funcionando após a remoção do código | Reverter o commit de remoção do código |

## 5. Prompts para Implementação

### Prompt para AT-001: Atualizar Schema do Banco de Dados

**Tarefa**: Modifique o arquivo `drizzle/schema.ts` para adicionar os campos necessários para a integração com a Meta WhatsApp Cloud API na tabela `mentorados`. Os novos campos são:

- `metaWabaId`: `varchar("meta_waba_id", { length: 128 })`
- `metaPhoneNumberId`: `varchar("meta_phone_number_id", { length: 128 })`
- `metaAccessToken`: `text("meta_access_token")` (deve ser criptografado)
- `metaConnected`: `simNaoEnum("meta_connected").default("nao")`
- `metaConnectedAt`: `timestamp("meta_connected_at")`
- `metaPhoneNumber`: `varchar("meta_phone_number", { length: 20 })`

Após a modificação, execute `bun run drizzle:generate` para gerar o script de migração SQL.

### Prompt para AT-002: Criar Novo Serviço `metaApiService.ts`

**Tarefa**: Crie um novo arquivo `server/services/metaApiService.ts`. Este serviço deve conter a lógica para interagir com a Meta WhatsApp Cloud API. Implemente as seguintes funções:

- `sendTextMessage(accessToken, phoneNumberId, to, message)`: Envia uma mensagem de texto.
- `getPhoneNumberId(accessToken, wabaId)`: Obtém o ID do número de telefone a partir do ID da WABA.
- Funções para outros tipos de mensagens (mídia, templates) podem ser adicionadas posteriormente.

Utilize `node-fetch` ou `axios` para fazer as requisições HTTP para a Graph API da Meta. A URL base é `https://graph.facebook.com/v18.0/`.

### Prompt para AT-004: Criar Rota de Webhook em `metaWebhook.ts`

**Tarefa**: Crie um novo arquivo `server/webhooks/metaWebhook.ts` e uma rota Express para lidar com os webhooks da Meta. A rota deve:

1.  Implementar a verificação do webhook (challenge) conforme a documentação da Meta.
2.  Receber e processar payloads de mensagens recebidas e de atualização de status.
3.  Assinar os eventos `messages` no painel de desenvolvedor da Meta.
4.  Usar um token de verificação seguro armazenado em variáveis de ambiente.

---

*Este plano será a base para a implementação da migração. Cada tarefa atômica deve ser executada e validada individualmente para garantir a qualidade e a estabilidade do sistema.*
