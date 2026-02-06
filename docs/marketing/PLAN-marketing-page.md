# PRP: Página de Marketing NeonDash
# Campanhas Automatizadas de Instagram e WhatsApp para Clínicas de Estética

---

## 📋 METADATA

```yaml
complexity: L7 - Sistema completo de marketing com múltiplas integrações
estimated_time: 40-60 horas (8-12 dias úteis)
parallel_safe: Parcialmente (fases podem ser paralelizadas após fundação)
stack: React + TypeScript + TailwindCSS + shadcn/ui + tRPC
integrations:
  - Instagram Graph API (Meta)
  - WhatsApp via Z-API
  - OpenAI DALL-E 3 / Gemini Imagen
  - Agente IA de Marketing (já configurado)
```

---

## 🎯 ROLE & OBJECTIVE

### Role
**Full-Stack Developer** especializado em **Marketing Automation**, **Social Media APIs**, **AI Integration** e **Dashboard UI/UX** para plataformas SaaS B2B no segmento de saúde estética.

### Expertise Areas
- Instagram Graph API & Content Publishing
- WhatsApp Business API & Z-API
- AI-powered content generation (text + images)
- Campaign management systems
- Analytics dashboards
- LGPD compliance & opt-in systems

### Objective
Implementar uma página de Marketing completa no NeonDash que permita aos mentores criar, gerenciar e executar campanhas automatizadas de marketing para Instagram e WhatsApp, focadas em clínicas de estética. A solução deve incluir geração de conteúdo com IA (textos, narrativas e imagens), análise de perfil do mentorado, conexão direta com Instagram, e funcionar como uma agência de marketing completa dentro da plataforma.

**Measurable Outcome**: Página funcional que permite criar uma campanha completa (7 posts) com textos e imagens geradas por IA, agendar publicações no Instagram, e enviar campanhas segmentadas via WhatsApp, tudo em menos de 15 minutos.

---

## 🔬 RESEARCH SUMMARY

### Key Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Instagram API permite publicar posts, reels, stories e carousels via Graph API com rate limit de 100 posts/24h | 5/5 | Meta Developers Docs | CRÍTICO - Define capacidades de publicação |
| 2 | Publicação requer mídia em servidor público (Meta faz cURL). Fluxo: criar container → publicar | 5/5 | Meta Developers Docs | ALTO - Arquitetura de storage |
| 3 | Z-API (já integrado) permite envio de mensagens WhatsApp sem limites da API, mas deve seguir padrões WhatsApp Web | 4/5 | Z-API Docs | ALTO - Campanhas WhatsApp |
| 4 | OpenAI DALL-E 3 ($0.04/img) e Gemini Imagen (já configurados) disponíveis para geração de imagens | 5/5 | OpenAI/Google Docs | MÉDIO - Custo e qualidade |
| 5 | NeonDash já tem: MarketingAgentSettingsCard, InstagramConnectionCard, WhatsAppConnectionCard | 5/5 | Codebase (Serena) | ALTO - Reutilizar componentes |
| 6 | Design system recomendado: Soft UI Evolution, cores #EC4899/#F472B6, Fira Code/Sans, Hero-Centric layout | 4/5 | UI/UX Pro Max Skill | MÉDIO - Consistência visual |
| 7 | Campanhas WhatsApp devem ter opt-in, segmentação e respeitar LGPD para evitar bloqueios | 5/5 | WhatsApp Policies | CRÍTICO - Compliance |

### Knowledge Gaps
- ❓ Qual storage usar para imagens geradas (S3, CDN, servidor próprio)?
- ❓ Sistema de filas já existe ou precisa implementar (Redis/Bull)?
- ❓ Limite de créditos/custos para geração de imagens por mentorado?

### Assumptions to Validate
- ✓ Mentorados já têm Instagram Business conectado (via InstagramConnectionCard)
- ✓ Mentorados já têm WhatsApp conectado via Z-API (via WhatsAppConnectionCard)
- ✓ Agente IA de Marketing já está configurado e funcional
- ⚠️ Assumindo que S3 ou storage público está disponível (validar com time)

---

## 🏗️ ARCHITECTURE OVERVIEW

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETING PAGE (Frontend)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Campaign    │  │  Content     │  │  Analytics   │          │
│  │  Builder     │  │  Generator   │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Instagram   │  │  WhatsApp    │  │  Template    │          │
│  │  Publisher   │  │  Campaigns   │  │  Library     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (tRPC Routers)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  marketing   │  │  aiContent   │  │  instagram   │          │
│  │  Router      │  │  Router      │  │  Router      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  whatsapp    │  │  analytics   │  │  storage     │          │
│  │  Router      │  │  Router      │  │  Router      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Instagram Graph API  │  Z-API WhatsApp  │  OpenAI DALL-E 3    │
│  (Meta)               │  (WhatsApp Web)  │  (Image Gen)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Database)                         │
├─────────────────────────────────────────────────────────────────┤
│  campaigns  │  posts  │  templates  │  analytics  │  queue      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Models (Drizzle Schema)

```typescript
// campaigns table
{
  id: serial,
  mentoradoId: integer,
  name: string,
  description: text,
  status: enum('draft', 'scheduled', 'active', 'completed', 'paused'),
  type: enum('instagram', 'whatsapp', 'both'),
  startDate: timestamp,
  endDate: timestamp,
  targetAudience: jsonb, // segmentation filters
  createdAt: timestamp,
  updatedAt: timestamp
}

// campaign_posts table
{
  id: serial,
  campaignId: integer,
  platform: enum('instagram', 'whatsapp'),
  contentType: enum('post', 'reel', 'story', 'carousel'),
  caption: text,
  imageUrl: string,
  imagePrompt: text, // prompt usado para gerar imagem
  scheduledFor: timestamp,
  publishedAt: timestamp,
  status: enum('draft', 'scheduled', 'published', 'failed'),
  instagramMediaId: string,
  analytics: jsonb, // likes, comments, reach, etc
  createdAt: timestamp
}

// campaign_templates table
{
  id: serial,
  name: string,
  category: enum('promocao', 'educativo', 'depoimento', 'antes_depois', 'dica'),
  platform: enum('instagram', 'whatsapp', 'both'),
  captionTemplate: text, // com variáveis {{nome_clinica}}, {{procedimento}}
  imagePromptTemplate: text,
  suggestedHashtags: jsonb,
  isPublic: boolean,
  createdBy: integer, // admin ou mentorado
  usageCount: integer,
  createdAt: timestamp
}

// whatsapp_campaigns table
{
  id: serial,
  campaignId: integer,
  mentoradoId: integer,
  message: text,
  mediaUrl: string,
  targetContacts: jsonb, // lista de números ou filtros CRM
  scheduledFor: timestamp,
  sentAt: timestamp,
  status: enum('draft', 'scheduled', 'sending', 'sent', 'failed'),
  stats: jsonb, // delivered, read, replied
  createdAt: timestamp
}
```

---

## 📝 ATOMIC TASKS BREAKDOWN

### PHASE 1: FOUNDATION & DATABASE (Crítica - Sequencial)

#### AT-001: Criar schemas de banco de dados
**Priority**: CRITICAL  
**Dependencies**: None  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar migration Drizzle para tabela `campaigns`
2. Criar migration para tabela `campaign_posts`
3. Criar migration para tabela `campaign_templates`
4. Criar migration para tabela `whatsapp_campaigns`
5. Adicionar índices para performance (mentoradoId, status, scheduledFor)
6. Criar seeds com templates iniciais (5-10 templates para clínicas estéticas)

**Validation**:
```bash
bun run db:push
bun run db:studio # verificar tabelas criadas
```

**Rollback**: `bun run db:drop` e remover migrations

---

#### AT-002: Configurar storage de imagens
**Priority**: CRITICAL  
**Dependencies**: None  
**Parallel-safe**: ❌

**Subtasks**:
1. Verificar se S3 ou storage está configurado (env vars)
2. Se não, criar serviço de upload local com endpoint público
3. Implementar `storageService.ts` com funções:
   - `uploadImage(buffer, filename)` → retorna URL pública
   - `deleteImage(url)` → remove imagem
   - `getImageUrl(key)` → retorna URL pública
4. Adicionar middleware de validação (tamanho, formato JPEG/PNG)
5. Testar upload e acesso público via cURL

**Validation**:
```bash
# Testar upload
curl -X POST http://localhost:5000/api/storage/upload -F "file=@test.jpg"
# Verificar URL retornada é acessível
curl -I <URL_RETORNADA>
```

**Rollback**: Remover serviço e env vars

---

#### AT-003: Criar router tRPC de marketing
**Priority**: HIGH  
**Dependencies**: AT-001  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/routers/marketingRouter.ts`
2. Implementar procedures:
   - `createCampaign` (input: name, description, type, dates)
   - `getCampaigns` (filter por mentoradoId, status)
   - `getCampaignById` (com posts relacionados)
   - `updateCampaign` (status, dates, description)
   - `deleteCampaign` (soft delete)
3. Adicionar validação Zod para inputs
4. Adicionar middleware de autenticação (apenas mentorado owner)
5. Registrar router no `server/routers.ts`

**Validation**:
```bash
bun run test:api # rodar testes de integração
```

**Rollback**: Remover router e imports

---

### PHASE 2: AI CONTENT GENERATION (Alta prioridade)

#### AT-004: Implementar serviço de geração de texto com IA
**Priority**: HIGH  
**Dependencies**: None  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `server/services/aiContentService.ts`
2. Implementar função `generateCampaignPosts(params)`:
   - Input: tema, público-alvo, quantidade de posts, tom de voz
   - Usar agente IA de Marketing configurado (via `marketing_agent_prompt`)
   - Retornar array de posts com: caption, imagePrompt, hashtags, callToAction
3. Implementar função `generateSinglePost(params)`:
   - Input: tipo de post, procedimento, objetivo
   - Retornar: caption, imagePrompt, hashtags
4. Implementar função `improveCaptionWithAI(caption)`:
   - Melhorar caption existente com sugestões
5. Adicionar cache de prompts similares (Redis ou memória)
6. Adicionar rate limiting para evitar abuso

**Validation**:
```typescript
const posts = await aiContentService.generateCampaignPosts({
  tema: 'Lançamento de tratamento de harmonização facial',
  publicoAlvo: 'Mulheres 25-45 anos',
  quantidade: 7,
  tomDeVoz: 'profissional e acolhedor'
});
console.log(posts); // verificar qualidade dos textos
```

**Rollback**: Remover serviço

---

#### AT-005: Implementar serviço de geração de imagens com IA
**Priority**: HIGH  
**Dependencies**: AT-002  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `server/services/aiImageService.ts`
2. Implementar função `generateImage(prompt, options)`:
   - Usar OpenAI DALL-E 3 (via `OPENAI_API_KEY`)
   - Options: size (1024x1024, 1080x1080), quality (standard/hd)
   - Fazer download da imagem temporária
   - Upload para storage (via `storageService`)
   - Retornar URL pública permanente
3. Implementar função `generateMultipleVariations(prompt, count)`:
   - Gerar múltiplas variações do mesmo prompt
   - Retornar array de URLs
4. Implementar fallback para Gemini Imagen se DALL-E falhar
5. Adicionar logging de custos (salvar no DB)
6. Adicionar retry logic (3 tentativas)

**Validation**:
```typescript
const imageUrl = await aiImageService.generateImage(
  'Modern aesthetic clinic interior with soft pink lighting',
  { size: '1024x1024', quality: 'standard' }
);
console.log(imageUrl); // verificar URL é acessível
```

**Rollback**: Remover serviço e imagens geradas

---

#### AT-006: Criar router tRPC de AI Content
**Priority**: HIGH  
**Dependencies**: AT-004, AT-005  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/routers/aiContentRouter.ts`
2. Implementar procedures:
   - `generateCampaignContent` (tema, quantidade) → posts completos
   - `generatePostCaption` (tipo, procedimento) → caption
   - `generatePostImage` (prompt, size) → imageUrl
   - `improveCaption` (caption) → melhorado
   - `generateImageVariations` (prompt, count) → array de URLs
3. Adicionar validação de rate limiting (máx 50 gerações/dia por mentorado)
4. Adicionar tracking de custos no DB
5. Registrar router

**Validation**:
```bash
bun run test:api
```

**Rollback**: Remover router

---

### PHASE 3: INSTAGRAM INTEGRATION (Crítica)

#### AT-007: Implementar serviço de publicação Instagram
**Priority**: CRITICAL  
**Dependencies**: AT-002  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/services/instagramPublishService.ts`
2. Implementar função `createMediaContainer(params)`:
   - POST `/<IG_ID>/media` com image_url, caption
   - Retornar container ID
3. Implementar função `publishMediaContainer(containerId)`:
   - POST `/<IG_ID>/media_publish`
   - Retornar media ID
4. Implementar função `publishPost(post)`:
   - Fluxo completo: criar container → verificar status → publicar
   - Salvar media ID no DB
5. Implementar função `publishCarousel(posts)`:
   - Criar containers individuais → carousel container → publicar
6. Implementar função `checkPublishingLimit(igId)`:
   - GET `/<IG_ID>/content_publishing_limit`
   - Retornar limite atual
7. Adicionar error handling para cada etapa
8. Adicionar retry logic

**Validation**:
```typescript
const mediaId = await instagramPublishService.publishPost({
  igAccountId: '123456',
  imageUrl: 'https://...',
  caption: 'Teste de publicação via API'
});
// Verificar post apareceu no Instagram
```

**Rollback**: Deletar posts de teste via Instagram

---

#### AT-008: Criar router tRPC de Instagram Publishing
**Priority**: HIGH  
**Dependencies**: AT-007  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/routers/instagramPublishRouter.ts`
2. Implementar procedures:
   - `publishPost` (postId) → publica post agendado
   - `publishCampaign` (campaignId) → publica todos posts da campanha
   - `schedulePost` (postId, scheduledFor) → agenda publicação
   - `getPublishingLimit` (mentoradoId) → limite atual
   - `cancelScheduledPost` (postId) → cancela agendamento
3. Adicionar validação de limite (100 posts/24h)
4. Adicionar queue system para agendamentos (Bull/Redis ou cron simples)
5. Registrar router

**Validation**:
```bash
bun run test:api
```

**Rollback**: Remover router e jobs agendados

---

#### AT-009: Implementar sistema de agendamento de posts
**Priority**: HIGH  
**Dependencies**: AT-008  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/services/schedulerService.ts`
2. Implementar cron job que roda a cada 5 minutos:
   - Buscar posts com `status='scheduled'` e `scheduledFor <= now`
   - Para cada post, chamar `instagramPublishService.publishPost()`
   - Atualizar status para 'published' ou 'failed'
   - Salvar analytics iniciais
3. Implementar função `schedulePost(postId, date)`:
   - Validar data futura
   - Atualizar DB
4. Implementar função `cancelScheduledPost(postId)`:
   - Atualizar status para 'cancelled'
5. Adicionar logging de execuções
6. Adicionar notificações de falha (via email ou dashboard)

**Validation**:
```bash
# Agendar post para daqui 2 minutos
# Aguardar e verificar se foi publicado
```

**Rollback**: Parar cron job e remover serviço

---

### PHASE 4: WHATSAPP CAMPAIGNS (Alta prioridade)

#### AT-010: Implementar serviço de campanhas WhatsApp
**Priority**: HIGH  
**Dependencies**: AT-002  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `server/services/whatsappCampaignService.ts`
2. Implementar função `sendMessage(params)`:
   - Usar Z-API (já integrado)
   - Input: número, mensagem, mediaUrl (opcional)
   - Retornar messageId
3. Implementar função `sendBulkMessages(contacts, message, mediaUrl)`:
   - Iterar com delay entre envios (evitar bloqueio)
   - Delay recomendado: 2-3 segundos entre mensagens
   - Retornar array de resultados
4. Implementar função `sendCampaign(campaignId)`:
   - Buscar campanha e contatos
   - Validar opt-in dos contatos
   - Enviar mensagens em batch
   - Atualizar stats no DB
5. Implementar função `getContactsFromSegmentation(filters)`:
   - Integrar com CRM (tabela leads)
   - Filtrar por tags, status, última interação
   - Retornar lista de números
6. Adicionar rate limiting (máx 100 msg/hora)
7. Adicionar logging de envios

**Validation**:
```typescript
const result = await whatsappCampaignService.sendCampaign(campaignId);
console.log(result); // verificar envios bem-sucedidos
```

**Rollback**: Não há rollback para mensagens enviadas (avisar usuário)

---

#### AT-011: Criar router tRPC de WhatsApp Campaigns
**Priority**: HIGH  
**Dependencies**: AT-010  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/routers/whatsappCampaignRouter.ts`
2. Implementar procedures:
   - `createWhatsAppCampaign` (message, mediaUrl, targetContacts)
   - `sendWhatsAppCampaign` (campaignId) → envia imediatamente
   - `scheduleWhatsAppCampaign` (campaignId, scheduledFor)
   - `getWhatsAppCampaigns` (mentoradoId)
   - `getWhatsAppCampaignStats` (campaignId) → delivered, read, replied
3. Adicionar validação de opt-in (verificar se contato aceitou receber)
4. Adicionar middleware de compliance LGPD
5. Registrar router

**Validation**:
```bash
bun run test:api
```

**Rollback**: Remover router

---

### PHASE 5: FRONTEND - CAMPAIGN BUILDER (UI/UX)

#### AT-012: Criar página base de Marketing
**Priority**: HIGH  
**Dependencies**: None  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/pages/MarketingPage.tsx`
2. Implementar layout base com DashboardLayout
3. Adicionar header com título "Marketing & Campanhas"
4. Adicionar tabs: "Campanhas", "Templates", "Analytics"
5. Adicionar botão "Nova Campanha" (destaque)
6. Aplicar design system (Soft UI Evolution, cores #EC4899/#F472B6)
7. Adicionar rota em `App.tsx`: `/marketing`

**Validation**:
```bash
bun run dev
# Acessar http://localhost:5173/marketing
```

**Rollback**: Remover página e rota

---

#### AT-013: Criar componente Campaign Builder (Wizard)
**Priority**: CRITICAL  
**Dependencies**: AT-012  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `client/src/components/marketing/CampaignBuilder.tsx`
2. Implementar wizard multi-step:
   - **Step 1**: Informações básicas (nome, descrição, tipo, datas)
   - **Step 2**: Geração de conteúdo com IA (tema, tom de voz, quantidade)
   - **Step 3**: Revisão e edição de posts (cards editáveis)
   - **Step 4**: Agendamento (calendário visual)
   - **Step 5**: Confirmação e publicação
3. Adicionar navegação entre steps (Próximo, Voltar, Salvar Rascunho)
4. Adicionar validação em cada step
5. Adicionar loading states e error handling
6. Usar shadcn/ui components (Card, Button, Input, Textarea, Calendar)
7. Aplicar animações suaves (150-300ms)

**Validation**:
```bash
# Testar fluxo completo do wizard
```

**Rollback**: Remover componente

---

#### AT-014: Criar componente AI Content Generator
**Priority**: HIGH  
**Dependencies**: AT-006  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `client/src/components/marketing/AIContentGenerator.tsx`
2. Implementar form com campos:
   - Tema da campanha (textarea)
   - Público-alvo (select: mulheres 25-35, 35-45, homens, etc)
   - Quantidade de posts (slider: 1-14)
   - Tom de voz (select: profissional, descontraído, educativo)
   - Procedimentos/serviços (multi-select)
3. Adicionar botão "Gerar Conteúdo com IA" (destaque)
4. Implementar loading state com skeleton (7 cards)
5. Ao gerar, chamar `aiContentRouter.generateCampaignContent`
6. Exibir preview dos posts gerados (cards com imagem placeholder)
7. Permitir regenerar posts individuais
8. Adicionar botão "Gerar Imagens" para cada post

**Validation**:
```bash
# Testar geração de conteúdo
```

**Rollback**: Remover componente

---

#### AT-015: Criar componente Post Editor Card
**Priority**: HIGH  
**Dependencies**: AT-014  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `client/src/components/marketing/PostEditorCard.tsx`
2. Implementar card com:
   - Preview de imagem (ou placeholder se não gerada)
   - Caption editável (textarea com contador de caracteres)
   - Hashtags editáveis (tags input)
   - Botão "Gerar Imagem com IA" (se não tem imagem)
   - Botão "Regenerar Imagem" (se já tem)
   - Botão "Upload Imagem" (alternativa manual)
   - Select de tipo (post, reel, story)
   - Date/time picker para agendamento
3. Adicionar preview de como ficará no Instagram (mock)
4. Adicionar validação (caption max 2200 chars)
5. Aplicar design beautiful (glassmorphism sutil, shadows)
6. Adicionar drag handle para reordenar posts

**Validation**:
```bash
# Testar edição e preview
```

**Rollback**: Remover componente

---

#### AT-016: Criar componente Image Generator Modal
**Priority**: HIGH  
**Dependencies**: AT-006  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `client/src/components/marketing/ImageGeneratorModal.tsx`
2. Implementar modal com:
   - Textarea para prompt (pré-preenchido com imagePrompt do post)
   - Botão "Gerar Imagem" (chama `aiContentRouter.generatePostImage`)
   - Loading state com progress bar
   - Preview da imagem gerada
   - Botão "Gerar Variações" (3 variações)
   - Grid de variações para escolher
   - Botão "Usar esta imagem"
3. Adicionar opções avançadas (collapsible):
   - Tamanho (1080x1080, 1080x1350, 1080x1920)
   - Qualidade (standard, HD)
   - Estilo (fotorrealista, ilustração, 3D)
4. Adicionar custo estimado ($0.04 por imagem)
5. Aplicar design modal responsivo

**Validation**:
```bash
# Testar geração de imagens
```

**Rollback**: Remover componente

---

#### AT-017: Criar componente Campaign Calendar
**Priority**: MEDIUM  
**Dependencies**: AT-013  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/CampaignCalendar.tsx`
2. Implementar calendário visual (usar shadcn/ui Calendar ou lib externa)
3. Exibir posts agendados como eventos no calendário
4. Permitir drag-and-drop para reagendar
5. Adicionar cores por status (agendado, publicado, falha)
6. Adicionar tooltip com preview do post ao hover
7. Adicionar filtros (por campanha, por plataforma)
8. Adicionar visualização: mês, semana, dia

**Validation**:
```bash
# Testar visualização e drag-and-drop
```

**Rollback**: Remover componente

---

### PHASE 6: FRONTEND - WHATSAPP CAMPAIGNS

#### AT-018: Criar componente WhatsApp Campaign Builder
**Priority**: HIGH  
**Dependencies**: AT-011  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/WhatsAppCampaignBuilder.tsx`
2. Implementar form com:
   - Nome da campanha
   - Mensagem (textarea com preview WhatsApp)
   - Upload de mídia (imagem, vídeo, documento)
   - Segmentação de contatos:
     - Todos os contatos
     - Por tags (leads, clientes, prospects)
     - Por status CRM (novo, qualificado, negociação)
     - Por última interação (últimos 7, 30, 90 dias)
   - Agendamento (data/hora ou envio imediato)
3. Adicionar preview de mensagem estilo WhatsApp
4. Adicionar contador de caracteres e estimativa de envios
5. Adicionar checkbox de confirmação LGPD/opt-in
6. Adicionar botão "Enviar Campanha" ou "Agendar"

**Validation**:
```bash
# Testar criação e envio de campanha teste
```

**Rollback**: Remover componente

---

#### AT-019: Criar componente Contact Segmentation
**Priority**: MEDIUM  
**Dependencies**: AT-018  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/ContactSegmentation.tsx`
2. Implementar filtros avançados:
   - Multi-select de tags
   - Range de datas (última interação)
   - Status CRM (checkboxes)
   - Procedimentos de interesse
3. Adicionar preview de contatos selecionados (tabela)
4. Adicionar contador de contatos (ex: "127 contatos selecionados")
5. Adicionar botão "Salvar Segmento" (para reutilizar)
6. Adicionar validação de opt-in (destacar contatos sem opt-in)

**Validation**:
```bash
# Testar filtros e preview
```

**Rollback**: Remover componente

---

### PHASE 7: ANALYTICS & MONITORING

#### AT-020: Criar componente Analytics Dashboard
**Priority**: MEDIUM  
**Dependencies**: AT-008, AT-011  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/AnalyticsDashboard.tsx`
2. Implementar cards de métricas:
   - **Instagram**: Posts publicados, alcance, engajamento, novos seguidores
   - **WhatsApp**: Mensagens enviadas, entregues, lidas, respondidas
   - **Campanhas**: Ativas, concluídas, taxa de sucesso
3. Adicionar gráficos (usar Recharts ou Chart.js):
   - Linha: Engajamento ao longo do tempo
   - Barra: Performance por tipo de post
   - Pizza: Distribuição de plataformas
4. Adicionar filtros por período (7, 30, 90 dias)
5. Adicionar comparação com período anterior
6. Aplicar design data-viz (cores acessíveis, tooltips)

**Validation**:
```bash
# Testar visualização de dados
```

**Rollback**: Remover componente

---

#### AT-021: Implementar sincronização de analytics Instagram
**Priority**: MEDIUM  
**Dependencies**: AT-007  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar `server/services/instagramAnalyticsService.ts`
2. Implementar função `syncPostAnalytics(mediaId)`:
   - GET `/<IG_MEDIA_ID>/insights` (likes, comments, reach, impressions)
   - Salvar no campo `analytics` da tabela `campaign_posts`
3. Implementar cron job que roda diariamente:
   - Buscar posts publicados nos últimos 30 dias
   - Sincronizar analytics de cada post
4. Implementar função `getAccountInsights(igId)`:
   - GET `/<IG_ID>/insights` (follower_count, reach, impressions)
5. Adicionar cache de analytics (1 hora)

**Validation**:
```bash
# Verificar analytics sendo atualizados no DB
```

**Rollback**: Parar cron job e remover serviço

---

### PHASE 8: TEMPLATES LIBRARY

#### AT-022: Criar componente Template Library
**Priority**: MEDIUM  
**Dependencies**: AT-001  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/TemplateLibrary.tsx`
2. Implementar grid de templates:
   - Cards com preview (imagem mockup + caption)
   - Categorias: Promoção, Educativo, Depoimento, Antes/Depois, Dica
   - Filtros por categoria e plataforma
   - Search bar
3. Adicionar botão "Usar Template" em cada card
4. Ao clicar, preencher Campaign Builder com dados do template
5. Adicionar botão "Criar Novo Template" (admin)
6. Implementar modal de criação de template:
   - Nome, categoria, plataforma
   - Caption template (com variáveis {{nome_clinica}})
   - Image prompt template
   - Hashtags sugeridas
7. Adicionar contador de uso de cada template

**Validation**:
```bash
# Testar uso de templates
```

**Rollback**: Remover componente

---

#### AT-023: Criar seeds de templates iniciais
**Priority**: LOW  
**Dependencies**: AT-001  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `server/seeds/marketingTemplates.ts`
2. Adicionar 10-15 templates para clínicas estéticas:
   - **Promoção**: "Desconto especial em harmonização facial"
   - **Educativo**: "5 mitos sobre botox que você precisa conhecer"
   - **Depoimento**: "Veja o que nossos clientes dizem"
   - **Antes/Depois**: "Resultados reais de [procedimento]"
   - **Dica**: "Como cuidar da pele no inverno"
3. Para cada template, incluir:
   - Caption template com variáveis
   - Image prompt template
   - Hashtags relevantes
   - Categoria
4. Rodar seed: `bun run db:seed`

**Validation**:
```bash
bun run db:seed
# Verificar templates no DB
```

**Rollback**: Deletar registros

---

### PHASE 9: PROFILE ANALYSIS & SMART SUGGESTIONS

#### AT-024: Implementar análise de perfil Instagram
**Priority**: LOW  
**Dependencies**: AT-007  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `server/services/profileAnalysisService.ts`
2. Implementar função `analyzeInstagramProfile(igId)`:
   - Buscar últimos 30 posts do mentorado
   - Analisar: tipos de post mais engajados, horários, hashtags
   - Usar IA para gerar insights (via OpenAI)
   - Retornar relatório: "Seus posts de antes/depois têm 3x mais engajamento"
3. Implementar função `getSuggestedContent(mentoradoId)`:
   - Baseado em análise de perfil
   - Sugerir temas, horários, tipos de post
4. Adicionar cache de análise (7 dias)

**Validation**:
```typescript
const analysis = await profileAnalysisService.analyzeInstagramProfile(igId);
console.log(analysis); // verificar insights
```

**Rollback**: Remover serviço

---

#### AT-025: Criar componente Profile Insights
**Priority**: LOW  
**Dependencies**: AT-024  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `client/src/components/marketing/ProfileInsights.tsx`
2. Implementar card com insights:
   - "Seus posts mais engajados são sobre [tema]"
   - "Melhor horário para postar: [horário]"
   - "Hashtags que funcionam: [lista]"
   - "Sugestão: Poste mais [tipo de conteúdo]"
3. Adicionar botão "Atualizar Análise"
4. Adicionar gráfico de performance por tipo de post
5. Aplicar design informativo (ícones, cores)

**Validation**:
```bash
# Testar visualização de insights
```

**Rollback**: Remover componente

---

### PHASE 10: POLISH & OPTIMIZATION

#### AT-026: Implementar error handling e loading states
**Priority**: HIGH  
**Dependencies**: Todos componentes frontend  
**Parallel-safe**: ❌

**Subtasks**:
1. Adicionar error boundaries em componentes principais
2. Implementar toast notifications para erros (Sonner)
3. Adicionar skeleton loaders em todos componentes com fetch
4. Implementar retry logic em chamadas de API críticas
5. Adicionar mensagens de erro user-friendly
6. Adicionar validação de formulários com feedback visual

**Validation**:
```bash
# Simular erros de rede e verificar UX
```

**Rollback**: N/A

---

#### AT-027: Implementar testes E2E do fluxo completo
**Priority**: MEDIUM  
**Dependencies**: Todas tasks anteriores  
**Parallel-safe**: ❌

**Subtasks**:
1. Criar teste E2E: Criar campanha → Gerar conteúdo → Agendar → Publicar
2. Criar teste E2E: Criar campanha WhatsApp → Segmentar → Enviar
3. Criar teste E2E: Usar template → Customizar → Publicar
4. Adicionar testes de validação de limites (rate limiting)
5. Adicionar testes de error scenarios

**Validation**:
```bash
bun run test:e2e
```

**Rollback**: N/A

---

#### AT-028: Otimizar performance e acessibilidade
**Priority**: MEDIUM  
**Dependencies**: Todos componentes frontend  
**Parallel-safe**: ❌

**Subtasks**:
1. Adicionar lazy loading de componentes pesados
2. Otimizar imagens (WebP, lazy load)
3. Adicionar `aria-labels` em botões e inputs
4. Verificar contraste de cores (WCAG AA)
5. Adicionar focus states visíveis
6. Testar navegação por teclado (Tab order)
7. Adicionar `prefers-reduced-motion` para animações
8. Rodar Lighthouse audit e corrigir issues

**Validation**:
```bash
# Lighthouse score > 90 em todas categorias
```

**Rollback**: N/A

---

#### AT-029: Documentar funcionalidades e criar guia de uso
**Priority**: LOW  
**Dependencies**: Todas tasks anteriores  
**Parallel-safe**: ⚡ PARALLEL-SAFE

**Subtasks**:
1. Criar `docs/MARKETING_PAGE_GUIDE.md` com:
   - Overview de funcionalidades
   - Fluxo de criação de campanha
   - Boas práticas de marketing
   - Troubleshooting comum
2. Adicionar tooltips inline na UI (? icons)
3. Criar tour guiado para primeiro uso (opcional)
4. Adicionar vídeo tutorial (opcional)

**Validation**:
```bash
# Revisar documentação
```

**Rollback**: N/A

---

## 🎨 UI/UX DESIGN SYSTEM

### Visual Identity

**Style**: Soft UI Evolution  
**Primary Color**: `#EC4899` (Pink 500)  
**Secondary Color**: `#F472B6` (Pink 400)  
**CTA Color**: `#06B6D4` (Cyan 500)  
**Background**: `#FDF2F8` (Pink 50)  
**Text**: `#831843` (Pink 900)

**Typography**:
- **Headings**: Fira Code (600, 700)
- **Body**: Fira Sans (400, 500)
- **Monospace**: Fira Code (para códigos, IDs)

**Effects**:
- Shadows: Soft, subtle (0 4px 6px rgba(0,0,0,0.1))
- Transitions: 200-300ms ease
- Border radius: 8px (cards), 6px (buttons)
- Glassmorphism sutil em cards importantes

### Component Patterns

#### Campaign Card
```tsx
<Card className="group hover:shadow-lg transition-all duration-300 border-pink-200">
  <CardHeader>
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {status}
    </Badge>
    <CardTitle className="text-lg font-semibold">{name}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <Stat label="Posts" value={postsCount} />
      <Stat label="Alcance" value={reach} />
      <Stat label="Engajamento" value={engagement} />
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Ver Detalhes</Button>
    <Button>Editar</Button>
  </CardFooter>
</Card>
```

#### Post Editor Card
```tsx
<Card className="relative overflow-hidden border-pink-200">
  <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
    {imageUrl ? (
      <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
    ) : (
      <div className="flex items-center justify-center h-full">
        <Button onClick={generateImage}>
          <Sparkles className="mr-2" />
          Gerar Imagem com IA
        </Button>
      </div>
    )}
  </div>
  <CardContent className="space-y-4">
    <Textarea
      value={caption}
      onChange={setCaption}
      placeholder="Escreva a legenda..."
      className="min-h-[100px]"
    />
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {caption.length}/2200
      </span>
      <Button variant="ghost" size="sm" onClick={improveWithAI}>
        <Wand2 className="mr-2 h-4 w-4" />
        Melhorar com IA
      </Button>
    </div>
    <TagsInput value={hashtags} onChange={setHashtags} />
    <DateTimePicker value={scheduledFor} onChange={setScheduledFor} />
  </CardContent>
</Card>
```

### Accessibility Checklist
- [ ] Contraste mínimo 4.5:1 em textos
- [ ] Focus states visíveis (ring-2 ring-pink-500)
- [ ] Aria-labels em ícones e botões sem texto
- [ ] Keyboard navigation (Tab order lógico)
- [ ] Screen reader friendly (semantic HTML)
- [ ] Prefers-reduced-motion respeitado
- [ ] Touch targets mínimo 44x44px

---

## 🔐 SECURITY & COMPLIANCE

### LGPD Compliance

1. **Opt-in obrigatório** para campanhas WhatsApp
2. **Consentimento explícito** para uso de dados
3. **Direito ao esquecimento**: Botão "Não quero mais receber"
4. **Transparência**: Informar uso de dados na criação de campanha
5. **Logs de consentimento**: Salvar no DB quando e como opt-in foi dado

### Rate Limiting

- **Instagram**: Máx 100 posts/24h (verificar antes de publicar)
- **WhatsApp**: Máx 100 mensagens/hora (implementar queue)
- **AI Generation**: Máx 50 gerações/dia por mentorado
- **API calls**: Rate limit geral de 1000 req/min

### Error Handling

- **Instagram API errors**: Retry 3x com backoff exponencial
- **WhatsApp errors**: Logar e notificar usuário
- **AI generation errors**: Fallback para modelo alternativo
- **Storage errors**: Retry upload 3x

---

## 📊 VALIDATION CHECKLIST

### Functional Tests

- [ ] Criar campanha Instagram com 7 posts
- [ ] Gerar conteúdo com IA (textos + imagens)
- [ ] Editar posts individuais
- [ ] Agendar posts para datas futuras
- [ ] Publicar post imediatamente
- [ ] Criar campanha WhatsApp com segmentação
- [ ] Enviar campanha WhatsApp
- [ ] Visualizar analytics de campanha
- [ ] Usar template da biblioteca
- [ ] Criar novo template personalizado
- [ ] Verificar rate limiting funcionando
- [ ] Testar error scenarios (API offline, etc)

### Performance Tests

- [ ] Tempo de geração de conteúdo < 10s
- [ ] Tempo de geração de imagem < 15s
- [ ] Carregamento de página < 2s
- [ ] Lighthouse score > 90

### UX Tests

- [ ] Fluxo completo em < 15 minutos
- [ ] Navegação intuitiva (sem documentação)
- [ ] Mensagens de erro claras
- [ ] Loading states em todas operações
- [ ] Responsivo (mobile, tablet, desktop)

---

## 🚀 DEPLOYMENT PLAN

### Pre-deployment

1. Rodar todos testes: `bun run test && bun run test:e2e`
2. Build production: `bun run build`
3. Verificar env vars em produção
4. Backup do banco de dados
5. Testar em staging

### Deployment

1. Deploy backend (server)
2. Rodar migrations: `bun run db:push`
3. Rodar seeds (templates): `bun run db:seed`
4. Deploy frontend (client)
5. Verificar health checks
6. Testar fluxo crítico em produção

### Post-deployment

1. Monitorar logs por 24h
2. Verificar custos de APIs (OpenAI, etc)
3. Coletar feedback de usuários beta
4. Ajustar rate limits se necessário

---

## 💰 COST ESTIMATION

### Development Time
- **Phase 1-2**: 8-12 horas (Foundation + AI)
- **Phase 3**: 8-10 horas (Instagram)
- **Phase 4**: 6-8 horas (WhatsApp)
- **Phase 5-6**: 12-16 horas (Frontend)
- **Phase 7-10**: 8-12 horas (Analytics + Polish)
- **Total**: 42-58 horas

### Operational Costs (Monthly)
- **OpenAI DALL-E 3**: ~$3-10 (50-250 imagens)
- **Instagram API**: Grátis
- **WhatsApp (Z-API)**: Custo do plano Z-API
- **Storage**: ~$1-5 (S3 ou similar)
- **Total**: ~$5-20/mês

---

## 📚 REFERENCES

- [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- [Z-API Documentation](https://developer.z-api.io/en/)
- [OpenAI DALL-E API](https://platform.openai.com/docs/guides/images)
- [WhatsApp Business Policies](https://www.whatsapp.com/legal)
- [LGPD Compliance Guide](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

## 🎯 SUCCESS CRITERIA

### MVP (Minimum Viable Product)
- ✅ Criar campanha Instagram com 7 posts
- ✅ Gerar textos com IA
- ✅ Gerar imagens com IA
- ✅ Agendar e publicar posts
- ✅ Visualizar analytics básicos

### V1.0 (Full Release)
- ✅ Todos itens do MVP
- ✅ Campanhas WhatsApp com segmentação
- ✅ Biblioteca de templates
- ✅ Analytics avançados
- ✅ Profile insights

### V2.0 (Future)
- 🔮 Carousels automáticos
- 🔮 Reels com vídeo
- 🔮 A/B testing de posts
- 🔮 Integração com Facebook Ads
- 🔮 Relatórios PDF exportáveis

---

**Criado em**: 06/02/2026  
**Autor**: Manus AI Agent  
**Versão**: 1.0  
**Status**: Ready for Implementation ✅
