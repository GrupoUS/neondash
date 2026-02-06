# PLAN-meta-app-review: Guia Completo de Aprovação do App Meta

> **Objetivo:** Documentação completa para aprovação do NeonDash no processo de App Review da Meta, incluindo descrições de uso, requisitos e passos para cada permissão.

---

## 0. Resumo Executivo

O NeonDash precisa de **11 permissões** para funcionar como plataforma de mentoria com comunicação integrada via WhatsApp, Instagram e Facebook Ads.

| Categoria | Permissões | Prioridade |
|-----------|------------|------------|
| WhatsApp Business | 4 permissões | 🔴 Alta |
| Facebook Ads | 2 permissões | 🔴 Alta |
| Instagram | 3 permissões | 🟡 Média |
| Pages (Facebook) | 2 permissões | 🟡 Média |

---

## 1. Checklist de Pré-Requisitos

> [!IMPORTANT]
> Antes de submeter, você DEVE completar todos estes itens:

### Configurações do App

- [ ] **Privacy Policy URL** configurada no App Dashboard
  - Acessar: [developers.facebook.com](https://developers.facebook.com) → Seu App → Settings → Basic
  - URL sugerida: `https://neondash.com.br/privacidade`
  
- [ ] **Terms of Service URL** configurada
  - URL sugerida: `https://neondash.com.br/termos`

- [ ] **App Icon** (1024x1024 PNG) carregado

- [ ] **App Category** selecionada: `Business`

### Verificação Empresarial

- [ ] **Business Verification** completa no Business Manager
  - Acessar: [business.facebook.com/settings](https://business.facebook.com/settings) → Security Center → Start Verification
  - Documentos necessários: CNPJ, Contrato Social, Comprovante de endereço
  - Tempo estimado: 1-5 dias úteis

### Configuração Técnica

- [ ] **Webhooks** configurados e respondendo 200 OK
  - Endpoint: `https://seu-dominio.com/api/webhooks/meta`
  - Verify Token: configurado no `.env`

- [ ] **OAuth Redirect URI** configurada
  - URI: `https://seu-dominio.com/api/meta/callback`

- [ ] **Domínios permitidos** adicionados em "Facebook Login for Business"

---

## 2. Permissões WhatsApp Business (4 permissões)

### 2.1 `whatsapp_business_messaging`

#### Descrição para App Review (em inglês)

```
Our platform, NeonDash, is a mentorship management system for health and 
aesthetics professionals. The whatsapp_business_messaging permission is 
essential for:

1. PATIENT COMMUNICATION: Mentors can send appointment reminders, treatment 
   updates, and follow-up messages to their patients (mentees) via WhatsApp.

2. TWO-WAY CONVERSATIONS: When patients reply to messages, our system 
   receives and stores these conversations, enabling mentors to respond 
   through our unified inbox.

3. AUTOMATED RESPONSES: We use AI-powered responses to handle common 
   questions about appointments, business hours, and treatment information, 
   improving response time and patient satisfaction.

4. TEMPLATE MESSAGES: For re-engagement outside the 24-hour window, we send 
   pre-approved template messages such as appointment confirmations and 
   post-treatment follow-ups.

Without this permission, our mentors cannot communicate with their patients 
through WhatsApp, which is the primary communication channel in Brazil.
```

#### Screencast Obrigatório

**Duração:** 30-60 segundos

**Demonstrar:**
1. Abrir o NeonDash → Ir para página "Chat"
2. Selecionar um paciente da lista
3. Digitar uma mensagem e clicar "Enviar"
4. Mostrar a mensagem chegando no WhatsApp (usar número de teste)
5. Responder pelo WhatsApp e mostrar a mensagem chegando no NeonDash

---

### 2.2 `whatsapp_business_management`

#### Descrição para App Review (em inglês)

```
The whatsapp_business_management permission allows our platform to:

1. EMBEDDED SIGNUP: We use Meta's Embedded Signup flow to onboard new mentors 
   to WhatsApp Business. This creates their WABA (WhatsApp Business Account) 
   and registers their phone number within our platform.

2. PHONE NUMBER MANAGEMENT: After onboarding, we store the phone_number_id 
   and waba_id to route messages correctly for each mentor.

3. CONNECTION STATUS: We verify the connection health by checking the 
   verified_name and quality_rating of their WhatsApp Business number.

4. TEMPLATE MANAGEMENT: Our platform creates and submits message templates 
   for Meta approval, which mentors use for appointment reminders and 
   post-treatment follow-ups.

Each mentor operates independently with their own WhatsApp Business number, 
and we manage these connections centrally through our platform.
```

#### Screencast Obrigatório

**Duração:** 45-90 segundos

**Demonstrar:**
1. Abrir NeonDash → Ir para "Configurações" → "WhatsApp"
2. Clicar em "Conectar WhatsApp Business"
3. Mostrar o popup do Embedded Signup (pode parar aqui se não tiver número de teste)
4. OU: Mostrar uma conta já conectada com status "Conectado" e info do número
5. Mostrar a criação de um template de mensagem (opcional)

---

### 2.3 `whatsapp_business_manage_events`

#### Descrição para App Review (em inglês)

```
The whatsapp_business_manage_events permission is used for:

1. WEBHOOK EVENT HANDLING: We receive real-time webhook notifications when:
   - A patient sends a message
   - A message is delivered
   - A message is read by the recipient

2. CONVERSATION ANALYTICS: By tracking message events, we provide mentors 
   with engagement metrics such as response rates and read receipts.

3. CONVERSATION CONTINUITY: Events help us maintain conversation state, 
   knowing when the 24-hour messaging window opens or closes.

This permission is essential for our real-time chat functionality to work 
correctly and provide a seamless messaging experience.
```

#### Screencast Obrigatório

**Duração:** 30 segundos

**Demonstrar:**
1. No NeonDash, mostrar a página de Chat/Conversas
2. Enviar uma mensagem para um número de teste
3. Aguardar e mostrar os status: "Enviado" → "Entregue" → "Lido"
4. Ou mostrar logs/dashboard mostrando eventos recebidos

---

### 2.4 `manage_app_solution`

#### Descrição para App Review (em inglês)

```
The manage_app_solution permission is required for Tech Provider functionality:

1. MULTI-TENANT SUPPORT: NeonDash serves multiple independent mentors, each 
   with their own WhatsApp Business Account. This permission allows us to 
   manage these accounts programmatically.

2. CLIENT ONBOARDING: When a new mentor signs up, we can provision their 
   WhatsApp Business integration without requiring them to manually configure 
   API settings.

3. BUSINESS ACCOUNT LINKING: We link each mentor's WhatsApp Business Account 
   to their NeonDash profile, ensuring messages are routed correctly.

As a Solution Provider, we need this permission to serve multiple businesses 
through our unified platform.
```

---

## 3. Permissões Facebook Ads (2 permissões)

### 3.1 `Ads Management Standard Access`

#### Descrição para App Review (em inglês)

```
NeonDash requests Ads Management Standard Access to:

1. READ ADS INSIGHTS: Mentors can connect their Facebook Ads account to view 
   advertising performance metrics directly in our dashboard. We display:
   - Total spend
   - Impressions and reach
   - Click-through rates (CTR)
   - Cost per click (CPC) and cost per thousand (CPM)

2. CAMPAIGN SYNCHRONIZATION: We fetch campaign data daily to populate our 
   "Marketing" dashboard, helping mentors understand their ad performance 
   alongside patient metrics.

3. ROI CALCULATION: By correlating ad spend with patient acquisition, mentors 
   can calculate their return on investment for paid advertising.

We use the Marketing API with `ads_read` permission for read-only access. 
We do NOT create, modify, or manage ads through our platform.
```

#### Screencast Obrigatório

**Duração:** 45-60 segundos

**Demonstrar:**
1. Abrir NeonDash → "Configurações" → "Facebook Ads"
2. Clicar em "Conectar Facebook Ads"
3. Mostrar o fluxo de OAuth (selecionar conta de anúncios)
4. Após conexão, ir para "Marketing" → "Métricas de Anúncios"
5. Mostrar o dashboard com métricas sendo exibidas

---

### 3.2 `pages_manage_ads`

#### Descrição para App Review (em inglês)

```
The pages_manage_ads permission is required in conjunction with Ads access:

1. PAGE-LEVEL AD INSIGHTS: Some ad metrics are associated with Facebook Pages. 
   This permission allows us to read these insights when a mentor has ads 
   running from their business page.

2. AD ACCOUNT DISCOVERY: When connecting Facebook Ads, we list the user's 
   Pages to identify which ad accounts are available for metric retrieval.

Note: We use this permission in READ-ONLY mode. We do not create or manage 
advertisements through our platform.
```

---

## 4. Permissões Instagram (3 permissões)

### 4.1 `instagram_branded_content_ads_brand`

#### Descrição para App Review (em inglês)

```
NeonDash uses instagram_branded_content_ads_brand for:

1. CONTENT PERFORMANCE: Mentors who create branded content can view performance 
   metrics for their sponsored posts and partnerships.

2. PARTNERSHIP INSIGHTS: Health and aesthetics professionals often partner with 
   brands. This permission allows us to display engagement data for branded 
   content campaigns.

3. UNIFIED MARKETING VIEW: By combining branded content metrics with regular 
   post insights, mentors get a complete picture of their Instagram marketing 
   effectiveness.
```

---

### 4.2 `instagram_branded_content_brand`

#### Descrição para App Review (em inglês)

```
The instagram_branded_content_brand permission complements our branded content 
analytics:

1. BRAND MENTION TRACKING: Mentors can track when their business is mentioned 
   in branded content by other creators.

2. PARTNERSHIP MANAGEMENT: For mentors who work with influencers, this permission 
   allows visibility into content where they are tagged as the brand partner.

3. CONTENT APPROVAL WORKFLOWS: When brands approve content, we can display 
   these approvals in our platform for record-keeping.
```

---

### 4.3 `instagram_manage_comments`

#### Descrição para App Review (em inglês)

```
NeonDash uses instagram_manage_comments for:

1. COMMENT MODERATION: Mentors can view, reply to, and moderate comments on 
   their Instagram posts directly from our unified inbox.

2. ENGAGEMENT TRACKING: We count and analyze comments as part of our engagement 
   metrics, helping mentors understand which content resonates with their audience.

3. PATIENT INQUIRIES: Many potential patients ask questions in comments. Our 
   platform helps mentors respond promptly without switching between apps.

4. COMMUNITY MANAGEMENT: Mentors can hide inappropriate comments or spam to 
   maintain a professional presence.
```

#### Screencast Obrigatório

**Duração:** 30-45 segundos

**Demonstrar:**
1. Abrir NeonDash → "Instagram" → "Comentários"
2. Mostrar lista de comentários recentes
3. Responder a um comentário
4. (Opcional) Ocultar um comentário

---

## 5. Permissões Pages (2 permissões)

### 5.1 `pages_manage_engagement`

#### Descrição para App Review (em inglês)

```
The pages_manage_engagement permission supports our Facebook Page integration:

1. POST ENGAGEMENT: Mentors can view likes, shares, and comments on their 
   Facebook Page posts from within NeonDash.

2. RESPONSE MANAGEMENT: When patients comment on Facebook posts, mentors can 
   respond directly through our platform.

3. ENGAGEMENT METRICS: We aggregate engagement data to show mentors which 
   content types perform best on their Facebook Page.
```

---

### 5.2 `pages_messaging`

#### Descrição para App Review (em inglês)

```
NeonDash uses pages_messaging for:

1. FACEBOOK MESSENGER INTEGRATION: Mentors receive and respond to Facebook 
   Messenger conversations through our unified inbox.

2. PATIENT COMMUNICATION: Many patients reach out via Facebook Messenger. 
   This permission ensures mentors don't miss these inquiries.

3. CONVERSATION CONTINUITY: We store Messenger conversations alongside 
   WhatsApp and Instagram DMs for a complete communication history.
```

---

## 6. Guia de Screencasts

> [!WARNING]
> Screencasts mal feitos são a principal causa de rejeição. Siga estas regras:

### Requisitos Técnicos

| Requisito | Especificação |
|-----------|---------------|
| **Idioma da UI** | Inglês (ou legendas em inglês) |
| **Resolução** | Mínimo 720p, ideal 1080p |
| **Largura máxima** | 1440 pixels |
| **Formato** | MP4 ou MOV |
| **Duração** | 30-90 segundos por permissão |

### Script de Gravação para WhatsApp

```markdown
## Intro (5s)
"This is NeonDash, a mentorship platform for health professionals."

## Demonstração (40s)
1. "I'm opening the Settings page and connecting WhatsApp Business."
2. [Clique em Connect]
3. "The Embedded Signup flow allows my client to link their phone number."
4. [Mostre o popup ou uma conta já conectada]
5. "Now I'll go to the Chat page and send a message to a patient."
6. [Envie uma mensagem]
7. "The message was delivered via WhatsApp Business API."
8. [Mostre status de entrega]

## Conclusão (5s)
"This demonstrates how NeonDash uses whatsapp_business_messaging."
```

### Ferramentas de Gravação

- **Mac:** QuickTime Player ou ScreenFlow
- **Windows:** OBS Studio ou Loom
- **Linux:** OBS Studio ou SimpleScreenRecorder

---

## 7. Processo de Submissão

### Etapa 1: Verificação Empresarial (1-5 dias)

1. Acesse [business.facebook.com/settings](https://business.facebook.com/settings)
2. Vá para **Security Center** → **Start Verification**
3. Submeta documentos: CNPJ, Contrato Social
4. Aguarde aprovação por email

### Etapa 2: Configurar App Settings

1. Acesse o App Dashboard → Settings → Basic
2. Preencha todos os campos obrigatórios:
   - App Name
   - App Domain
   - Privacy Policy URL
   - Terms of Service URL
   - App Icon

### Etapa 3: Solicitar Advanced Access

1. Vá para **App Review** → **Permissions and Features**
2. Para cada permissão, clique **Request Advanced Access**
3. Clique **Continue Request**

### Etapa 4: Preencher Data Handling Questions

Perguntas típicas e respostas sugeridas:

| Pergunta | Resposta |
|----------|----------|
| Onde os dados são armazenados? | "Data is stored in Neon PostgreSQL (serverless Postgres) hosted in the USA with encryption at rest." |
| Por quanto tempo os dados são mantidos? | "Message data is retained indefinitely for conversation history. Users can request deletion at any time." |
| Quem tem acesso aos dados? | "Only the mentor (business owner) and their authorized team members can access their own patient data." |

### Etapa 5: Upload de Screencasts

1. Para cada permissão, clique no card correspondente
2. Faça upload do vídeo demonstrativo
3. Adicione notas explicativas se necessário

### Etapa 6: Submeter

1. Revise todas as informações
2. Clique **Submit for Review**
3. Tempo de aprovação: 2-7 dias úteis

---

## 8. Respostas para Rejeições Comuns

### Rejeição: "Unable to determine use case"

**Causa:** Descrição vaga ou screencast confuso.

**Solução:**
```
We apologize for the confusion. Here is a clearer explanation:

NeonDash is a SaaS platform for health professionals to manage their 
mentorship programs. The [permission_name] is specifically used for 
[specific action].

In the screencast, I demonstrate:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Please let us know if you need additional clarification.
```

### Rejeição: "Business not verified"

**Causa:** Verificação empresarial incompleta ou não vinculada ao app.

**Solução:**
1. Complete a verificação em [business.facebook.com/settings](https://business.facebook.com/settings)
2. Vincule o app ao Business Manager verificado
3. Resubmeta

### Rejeição: "Privacy Policy incomplete"

**Causa:** Política de privacidade não menciona uso de dados da Meta.

**Solução:** Adicione seção específica sobre Meta/WhatsApp:

```markdown
## Uso de APIs da Meta

Nosso aplicativo utiliza APIs da Meta (WhatsApp Business, Instagram, 
Facebook Ads) para fornecer funcionalidades de comunicação e marketing.

**Dados coletados via Meta APIs:**
- Mensagens de WhatsApp e Instagram
- Métricas de anúncios do Facebook Ads
- Informações de perfil de contas conectadas

**Uso dos dados:**
Os dados são utilizados exclusivamente para fornecer os serviços 
contratados pelo usuário e não são vendidos a terceiros.

**Exclusão de dados:**
Usuários podem solicitar a exclusão de seus dados a qualquer momento 
através de [email/link].
```

---

## 9. Checklist Final

### Antes de Submeter

- [ ] Business Verification aprovada
- [ ] App Settings completos (Privacy Policy, Terms, Icon)
- [ ] Webhooks funcionando e retornando 200 OK
- [ ] OAuth Redirect URIs configuradas
- [ ] Domínios permitidos adicionados

### Para Cada Permissão

- [ ] Descrição clara em inglês
- [ ] Screencast de 30-90 segundos
- [ ] Demonstração de uso real do app
- [ ] Data Handling Questions respondidas

### Após Submissão

- [ ] Monitorar email para feedback
- [ ] Responder rapidamente a solicitações de informação adicional
- [ ] Manter app funcional para testes do revisor

---

## 10. Recursos Externos

- [Meta App Review Documentation](https://developers.facebook.com/docs/app-review)
- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp)
- [Sample App Review Submission](https://developers.facebook.com/docs/whatsapp/solution-providers/app-review/sample-submission/)
- [Screen Recording Guidelines](https://developers.facebook.com/docs/app-review/submission-guide)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

> **Próximos passos:** Após revisar este documento, você pode:
> 1. Completar a verificação empresarial
> 2. Gravar os screencasts necessários
> 3. Submeter para review no App Dashboard
