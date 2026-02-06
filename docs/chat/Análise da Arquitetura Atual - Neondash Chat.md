# Análise da Arquitetura Atual - Neondash Chat

## 📊 Visão Geral do Projeto

**Stack Tecnológico:**
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **UI Components:** Radix UI + shadcn/ui
- **Backend:** tRPC + Express
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Animações:** Framer Motion
- **WhatsApp Integration:** Z-API (https://developer.z-api.io/)

---

## 🔍 Análise da Página de Chat Atual

### Localização
- **Arquivo Principal:** `/client/src/pages/ChatPage.tsx` (578 linhas)
- **Componentes Relacionados:**
  - `/client/src/components/chat/ChatMessageBubble.tsx`
  - `/client/src/components/chat/LeadChatWindow.tsx`

### Funcionalidades Existentes

#### ✅ Implementado
1. **Conexão WhatsApp via Z-API**
   - QR Code para autenticação
   - Status de conexão em tempo real
   - Desconexão manual

2. **Lista de Conversas**
   - Exibição de contatos/conversas ativas
   - Busca por nome ou telefone
   - Última mensagem e timestamp
   - Contador de mensagens não lidas

3. **Visualização de Mensagens**
   - Histórico de mensagens por contato
   - Diferenciação visual entre mensagens enviadas/recebidas
   - Timestamps formatados

4. **Envio de Mensagens**
   - Input com textarea
   - Envio via Enter (sem Shift)
   - Loading state durante envio
   - Feedback de erro

5. **Gerenciamento de Contatos**
   - Adicionar novo contato manualmente
   - Editar nome e notas do contato
   - Vinculação opcional com leads do CRM

6. **AI SDR Toggle**
   - Ativação/desativação do agente de IA
   - Indicador visual de status

### Backend - APIs Disponíveis (zapiRouter.ts)

#### Endpoints Implementados
1. `getStatus` - Status da conexão WhatsApp
2. `configure` - Configurar credenciais Z-API
3. `getQRCode` - Obter QR Code para conexão
4. `disconnect` - Desconectar sessão WhatsApp
5. `sendMessage` - Enviar mensagem de texto
6. `getMessages` - Obter histórico de mensagens (por leadId ou phone)
7. `getUnreadCounts` - Contador de mensagens não lidas por lead
8. `getAllConversations` - Listar todas as conversas ativas
9. `getMessagesByPhone` - Obter mensagens de um telefone específico
10. `upsertContact` - Criar/atualizar contato no WhatsApp

### Banco de Dados - Schema

#### Tabelas Relevantes

**whatsapp_messages**
```typescript
{
  id: serial
  mentoradoId: integer (FK → mentorados)
  leadId: integer (FK → leads, nullable)
  phone: varchar(20)
  direction: enum('inbound', 'outbound')
  content: text
  zapiMessageId: varchar(128)
  status: enum('pending', 'sent', 'delivered', 'read', 'failed')
  isFromAi: enum('sim', 'nao')
  createdAt: timestamp
}
```

**whatsapp_contacts**
```typescript
{
  id: serial
  mentoradoId: integer (FK → mentorados)
  phone: varchar(20)
  name: varchar(255)
  notes: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

**leads** (CRM - Pacientes)
```typescript
{
  id: serial
  mentoradoId: integer
  nome: varchar(255)
  telefone: varchar(20)
  email: varchar(255)
  status: enum
  origem: varchar(100)
  // ... outros campos
}
```

---

## ❌ Gaps Identificados

### 1. **Sincronização em Tempo Real**

#### Problema Atual
- **Polling a cada 10 segundos** para conversas (`refetchInterval: 10000`)
- **Polling a cada 5 segundos** para mensagens (`refetchInterval: 5000`)
- **Não há WebSocket ou Server-Sent Events (SSE)**
- **Webhook do Z-API existe** (`/server/webhooks/zapiWebhook.ts`) mas não notifica o frontend em tempo real

#### Impacto
- Atraso de até 10 segundos para novas conversas aparecerem
- Atraso de até 5 segundos para novas mensagens
- Alto consumo de requisições HTTP desnecessárias
- Experiência de usuário não é instantânea

### 2. **Sincronização de Nomes e Grupos**

#### Problema Atual
- **Nomes dos contatos não são atualizados automaticamente** do WhatsApp
- **Grupos não são suportados** (filtrados no código: `!chat.phone.includes("@g.us")`)
- **Não há sincronização de foto de perfil** do WhatsApp
- **Não há sincronização de status online/offline**

#### Impacto
- Usuário precisa editar manualmente o nome de cada contato
- Impossível gerenciar grupos do WhatsApp
- Interface menos rica visualmente
- Falta de indicadores de presença

### 3. **UI/UX Limitada**

#### Problemas Identificados

**Layout:**
- Sidebar de contatos fixa em 320px (`w-80`)
- Sem responsividade para mobile
- Sem modo compacto/expandido para lista de contatos
- Sem preview de mídia (imagens, áudios, vídeos)

**Interações:**
- Sem indicador de "digitando..."
- Sem confirmação de leitura visual (check duplo)
- Sem suporte para envio de mídia (apenas texto)
- Sem suporte para emojis picker
- Sem suporte para mensagens de áudio
- Sem busca dentro da conversa
- Sem scroll automático para última mensagem

**Visual:**
- Design básico, sem personalização
- Sem avatares dos contatos
- Sem agrupamento de mensagens por data
- Sem animações suaves de entrada/saída de mensagens
- Cores hardcoded (não usa design system)

### 4. **Integração com Página de Pacientes (Leads)**

#### Problema Atual
- **Vinculação manual** entre contatos do WhatsApp e leads do CRM
- **Não há sincronização automática** de novos contatos para a página de leads
- **Matching de telefone existe** (`phonesMatch()`) mas não cria leads automaticamente
- **Dados isolados:** Contatos do WhatsApp e Leads do CRM são entidades separadas

#### Impacto
- Duplicação de dados
- Trabalho manual para vincular contatos
- Oportunidades de vendas perdidas (contatos não viram leads)
- Falta de visão unificada do cliente

---

## 🎯 Oportunidades de Melhoria

### 1. **Tempo Real (WebSocket)**
- Implementar WebSocket server (Socket.io ou WS nativo)
- Notificar frontend instantaneamente quando webhook Z-API recebe mensagem
- Eliminar polling desnecessário
- Sincronizar status de leitura em tempo real

### 2. **Sincronização Automática**
- Buscar nomes dos contatos via Z-API (`/contacts` endpoint)
- Sincronizar fotos de perfil
- Suportar grupos do WhatsApp
- Atualizar status online/offline
- Sincronizar automaticamente ao conectar WhatsApp

### 3. **UI/UX Moderna**
- Implementar design system baseado em shadcn/ui
- Adicionar avatares com fallback
- Implementar preview de mídia
- Adicionar emoji picker
- Implementar indicador de "digitando..."
- Adicionar confirmação de leitura (check duplo)
- Melhorar responsividade mobile
- Adicionar animações suaves (Framer Motion)
- Implementar busca dentro da conversa
- Agrupar mensagens por data

### 4. **Integração Automática com Leads**
- Criar lead automaticamente ao receber primeira mensagem de número desconhecido
- Sincronizar dados bidirecionalmente (WhatsApp ↔ CRM)
- Exibir histórico de WhatsApp na página de leads
- Permitir iniciar conversa diretamente da página de leads
- Unificar visualização de contatos

---

## 📦 Recursos Disponíveis

### Z-API Endpoints (Não Utilizados)
- `/contacts` - Listar contatos do WhatsApp
- `/profile-picture` - Obter foto de perfil
- `/send-image` - Enviar imagem
- `/send-audio` - Enviar áudio
- `/send-file` - Enviar arquivo
- `/groups` - Gerenciar grupos
- `/presence` - Status online/offline

### Bibliotecas Já Instaladas
- **Framer Motion** - Animações
- **Radix UI** - Componentes acessíveis
- **TailwindCSS** - Estilização
- **tRPC** - Type-safe APIs
- **Drizzle ORM** - Database queries

### Bibliotecas Necessárias
- **Socket.io** (client + server) - WebSocket
- **emoji-picker-react** - Emoji picker
- **react-audio-voice-recorder** - Gravação de áudio
- **date-fns** - Formatação de datas
- **react-intersection-observer** - Infinite scroll
- **react-virtuoso** - Virtualização de listas longas

---

## 🏗️ Arquitetura Proposta

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  ChatPage    │  │  LeadsPage   │  │  Components  │  │
│  │  (Enhanced)  │  │  (Enhanced)  │  │  (shadcn/ui) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                  │                             │
│         └──────────┬───────┘                             │
│                    │                                     │
│         ┌──────────▼───────────┐                        │
│         │   tRPC Client        │                        │
│         │   + Socket.io Client │                        │
│         └──────────┬───────────┘                        │
└────────────────────┼─────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   WebSocket (Socket.io)│
         └───────────┬────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  tRPC Router │  │  WebSocket   │  │  Z-API       │  │
│  │  (zapiRouter)│  │  Server      │  │  Webhook     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────┬───────┴──────────────────┘          │
│                    │                                     │
│         ┌──────────▼───────────┐                        │
│         │   Service Layer      │                        │
│         │   (zapiService)      │                        │
│         └──────────┬───────────┘                        │
│                    │                                     │
│         ┌──────────▼───────────┐                        │
│         │   Database (Drizzle) │                        │
│         │   (PostgreSQL/Neon)  │                        │
│         └──────────────────────┘                        │
└──────────────────────────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   Z-API (WhatsApp)     │
         └────────────────────────┘
```

### Fluxo de Dados em Tempo Real

```
WhatsApp → Z-API → Webhook → Backend → WebSocket → Frontend
                              ↓
                         Database
```

---

## 📈 Complexidade Estimada

Baseado no guia de complexidade da skill de planejamento:

**Nível: L6-L7 (Arquitetura + Integração de Sistema)**

**Justificativa:**
- Múltiplos arquivos e componentes afetados
- Integração de WebSocket (nova tecnologia no projeto)
- Sincronização bidirecional de dados
- Redesign completo de UI/UX
- Integração entre dois módulos existentes (Chat + Leads)
- Requer pesquisa de APIs externas (Z-API)
- Requer testes de integração

**Tempo Estimado:** 16-24 horas de desenvolvimento

---

## 🎨 Próximos Passos

1. ✅ Análise concluída
2. 🔄 Pesquisa de tecnologias e melhores práticas
3. 🔄 Design do sistema UI/UX
4. 🔄 Criação do plano de implementação (PRP)
5. ⏳ Entrega do plano completo

