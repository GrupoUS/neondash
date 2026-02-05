# PLAN-whatsapp-sync: Sincronização de Conversas WhatsApp

> **Goal:** Sincronizar conversas ativas do WhatsApp com o chat interno via Z-API `get-chats`.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Z-API `get-chats` retorna: phone, name, unread, lastMessageTime, profileThumbnail | 5/5 | Context7 Z-API docs | Alto |
| 2 | Tabela `whatsapp_contacts` já existe no schema para armazenar nomes | 5/5 | drizzle/schema.ts | Médio |
| 3 | `getAllConversations` atual depende de `whatsapp_messages` locais | 5/5 | zapiRouter.ts | Alto |
| 4 | Z-API precisa `instanceId` + `token` para chamadas | 5/5 | zapiService.ts | Baixo |
| 5 | Erro atual: tabela `whatsapp_contacts` não criada no DB | 5/5 | Terminal logs | Alto |

### Knowledge Gaps & Assumptions
- **Gap:** Limite de rate-limit do Z-API para `get-chats`
- **Assumption:** `get-chats` retorna todas as conversas ativas (não paginado)

---

## 1. User Review Required

> [!IMPORTANT]
> **Priorização de Fonte de Conversas**
> 1. **Z-API (remoto)** → Fallback para mensagens locais
> 2. Se WhatsApp desconectado → Exibe só mensagens locais

> [!WARNING]
> **db:push pendente** - Execute: `bunx drizzle-kit push --force`

---

## 2. Proposed Changes

### Backend Service Layer

#### [MODIFY] [zapiService.ts](file:///home/mauricio/neondash/server/services/zapiService.ts)
- Add `getChats()` to fetch conversations from WhatsApp

### Backend Router Layer

#### [MODIFY] [zapiRouter.ts](file:///home/mauricio/neondash/server/zapiRouter.ts)
- Add `syncConversations` procedure
- Modify `getAllConversations` to use Z-API first with local fallback

### Frontend Layer

#### [MODIFY] [ChatPage.tsx](file:///home/mauricio/neondash/client/src/pages/ChatPage.tsx)
- Add sync button with RefreshCw icon

---

## 3. Atomic Implementation Tasks

### AT-001: Push Database Schema
- [ ] ST-001.1: Execute `bunx drizzle-kit push --force`
- [ ] ST-001.2: Restart dev server

### AT-002: Add getChats to zapiService ⚡
- [ ] ST-002.1: Add `ZApiChat` interface
- [ ] ST-002.2: Add `getChats()` async function

### AT-003: Add syncConversations Procedure
- [ ] ST-003.1: Add `syncConversations` mutation
- [ ] ST-003.2: Upsert contacts from Z-API response

### AT-004: Modify getAllConversations ⚡
- [ ] ST-004.1: Try getChats() from Z-API first
- [ ] ST-004.2: Merge with whatsapp_contacts for custom names
- [ ] ST-004.3: Fallback to local if Z-API fails

### AT-005: Add Sync Button to ChatPage
- [ ] ST-005.1: Add sync button
- [ ] ST-005.2: Call syncConversations on click
- [ ] ST-005.3: Refetch conversations after sync

---

## 4. Verification Plan

- `bun run check` - TypeScript validation
- `bun run lint` - Code formatting
- Manual: Open Chat → Sync → Verify list updates
