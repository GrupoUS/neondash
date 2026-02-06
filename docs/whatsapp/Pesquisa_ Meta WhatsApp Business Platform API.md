# Pesquisa: Meta WhatsApp Business Platform API

## 1. Arquitetura Atual do Neondash (Z API)

### Arquivos Principais
- **`server/services/zapiService.ts`**: Serviço principal com todas as funções de integração
- **`server/zapiRouter.ts`**: Router tRPC com endpoints para o frontend
- **`server/webhooks/zapiWebhook.ts`**: Handler de webhooks do Z API

### Funcionalidades Implementadas
1. **Conexão via QR Code**: `getQRCode()`, `getConnectionStatus()`
2. **Envio de mensagens**: `sendTextMessage()`
3. **Recebimento de mensagens**: Webhook `on-message-received`
4. **Status de mensagens**: Webhook `on-message-status`
5. **Desconexão**: `disconnect()`
6. **Listagem de chats**: `getChats()`
7. **Normalização de telefones**: `normalizePhoneNumber()`, `phonesMatch()`
8. **Modo Integrator**: Criação e gerenciamento de instâncias programaticamente

### Estrutura de Dados (Schema)
```typescript
mentorados:
  - zapiInstanceId: varchar(128)
  - zapiToken: text (encrypted)
  - zapiClientToken: text (encrypted, optional)
  - zapiConnected: sim_nao enum
  - zapiConnectedAt: timestamp
  - zapiPhone: varchar(20)
  - zapiInstanceStatus: enum (trial, active, suspended, canceled)
  - zapiInstanceDueDate: timestamp
  - zapiManagedByIntegrator: sim_nao enum

whatsappMessages:
  - mentoradoId: integer
  - leadId: integer (nullable)
  - phone: varchar
  - direction: enum (inbound, outbound)
  - content: text
  - zapiMessageId: varchar
  - status: enum (pending, sent, delivered, read, failed)
  - isFromAi: sim_nao enum
```

### Fluxo Atual
1. Mentorado configura credenciais Z API (instanceId + token)
2. Sistema gera QR Code para conexão
3. Após conexão, mentorado pode enviar/receber mensagens
4. Webhooks processam mensagens recebidas e status
5. AI SDR pode responder automaticamente

---

## 2. Meta WhatsApp Business Platform - Overview

### Fonte
- URL: https://developers.facebook.com/documentation/business-messaging/whatsapp/overview
- Data de acesso: 2026-02-06

### Componentes Principais

#### Cloud API
- API hospedada pela Meta para envio/recebimento de mensagens
- Endpoint: `https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages`
- Autenticação: Bearer token (Access Token)

#### Exemplo de Envio de Mensagem (Python)
```python
import requests

url = "https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages"
headers = {
    "Authorization": "Bearer <ACCESS_TOKEN>",
    "Content-Type": "application/json",
}
data = {
    "messaging_product": "whatsapp",
    "to": "<WHATSAPP_USER_PHONE_NUMBER>",
    "type": "template",
    "template": {
        "name": "hello_world",
        "language": {"code": "en_US"},
    }
}

response = requests.post(url, headers=headers, json=data, timeout=30)
print(response.json())
```

### APIs Disponíveis
1. **Cloud API**: Envio/recebimento de mensagens, chamadas
2. **Marketing Messages API**: Otimizações automáticas para alto engajamento
3. **Business Management API**: Gerenciamento programático de conta e assets

### Recursos Essenciais
- **Messaging**: Diferentes tipos de mensagens (texto, mídia, templates, interativas)
- **Templates**: Criação e gerenciamento de templates de mensagens
- **Webhooks**: Notificações de eventos (mensagens recebidas, status)
- **Authentication**: Controle de acesso e permissões

### Novos Recursos
- **WhatsApp API Calling**: Chamadas de voz nativas no WhatsApp
- **Groups API**: Vendas e suporte via grupos
- **API + WhatsApp Business App**: Uso simultâneo do app e API com mesmo número



---

## 3. WhatsApp Cloud API - Get Started

### Fonte
- URL: https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started
- Última atualização: Oct 1, 2025

### Pré-requisitos
1. Conta Facebook ou Meta gerenciada
2. Registro como desenvolvedor Meta
3. Dispositivo com WhatsApp para testes

### Passos de Configuração

#### Step 1: Criar Meta Developer App
- Criar app no App Dashboard
- Adicionar use case "Connect with customers through WhatsApp"
- Criar ou selecionar Meta Business Portfolio

#### Step 2: Enviar Primeira Mensagem Template
- Usar template `hello_world` pré-aprovado
- Obter **Phone Number ID** (ID do número de telefone do negócio)
- Obter **WhatsApp Business Account ID**
- Endpoint: `https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/messages`

#### Step 3: Configurar Webhook
- Webhook recebe notificações de status de mensagens (read, delivered)
- Payload exemplo:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "215589313241560883",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551797781",
          "phone_number_id": "7794189252778687"
        },
        "contacts": [{
          "profile": {"name": "Jessica Laverdetman"},
          "wa_id": "13557825698"
        }],
        "messages": [{
          "from": "17863559966",
          "id": "wamid.HBgLMTc4NjM1NTk5NjYVAGHAYWYET688aASGNTI1QzZFQjhEMDk2QQA=",
          "timestamp": "1758254144",
          "text": {"body": "Hi!"},
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

#### Step 4: Criar System User e Token Permanente
- Navegar para Business Settings → System users
- Criar novo system user
- Atribuir assets:
  - App: **Manage app** (Full control)
  - WhatsApp account: **Manage WhatsApp Business Accounts** (Full control)
- Gerar token com permissões:
  - `business_management`
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`
- **Token permanente** para uso em produção

#### Step 5: Enviar Mensagem Não-Template
- Janela de atendimento: 24 horas após resposta do cliente
- Permite envio de mensagens não-template
- Exemplo cURL:
```bash
curl 'https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "<PHONE_NUMBER>",
    "type": "text",
    "text": {"body": "Hello!"}
  }'
```

### Diferenças Chave: Z API vs Meta Cloud API

| Aspecto | Z API | Meta Cloud API |
|---------|-------|----------------|
| **Autenticação** | Instance ID + Token na URL | Bearer Token no header |
| **Endpoint** | `https://api.z-api.io/instances/{id}/token/{token}/...` | `https://graph.facebook.com/v23.0/{phone_id}/messages` |
| **Conexão** | QR Code via Z API | Configuração no Meta Business Manager |
| **Webhook** | Custom endpoints com Client-Token | Verificação via challenge do Meta |
| **Custo** | Pago por instância (Z API) | Pago por conversa (Meta) |
| **Gerenciamento** | Via Z API Integrator | Via Business Management API |
| **Phone Number** | Um por instância Z API | Múltiplos números por WABA |



---

## 4. Webhooks - Meta WhatsApp Business Platform

### Fonte
- URL: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/
- Última atualização: Dec 2, 2025

### Conceito
Webhooks são requisições HTTP com payloads JSON enviados dos servidores da Meta para o servidor designado pelo desenvolvedor. Informam sobre:
- Mensagens recebidas
- Status de mensagens enviadas
- Mudanças no status da conta
- Upgrades de capacidade de mensagens
- Mudanças em quality scores de templates

### Permissões Necessárias
- `whatsapp_business_messaging`: Para webhooks de mensagens
- `whatsapp_business_management`: Para todos os outros webhooks

### Webhook Fields Principais

| Field | Descrição |
|-------|-----------|
| **messages** | Mensagens enviadas de usuário para negócio + status de mensagens enviadas pelo negócio |
| **account_alerts** | Mudanças em limite de mensagens, perfil de negócio, status OBA |
| **account_update** | Verificação de negócio, elegibilidade de taxa internacional, violações de política |
| **business_capability_update** | Mudanças em capacidades (limites de mensagens, limites de números) |
| **message_template_status_update** | Mudanças no status de templates existentes |
| **message_template_quality_update** | Mudanças no quality score de templates |
| **phone_number_quality_update** | Mudanças no throughput level de números |

### Configuração de Webhook
1. Criar endpoint de webhook próprio
2. Configurar URL no App Dashboard → WhatsApp → Configuration
3. Subscrever aos campos (fields) desejados
4. Validar webhook via challenge do Meta

### Webhook Payload - Mensagem Recebida
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "102290129340398",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550783881",
          "phone_number_id": "106540352242922"
        },
        "contacts": [{
          "profile": {"name": "Sheena Nelson"},
          "wa_id": "16505551234"
        }],
        "messages": [{
          "from": "16505551234",
          "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQTRBNjU5OUFFRTAzODEwMTQ0RgA=",
          "timestamp": "1749416383",
          "type": "text",
          "text": {"body": "Does it come in another color?"}
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Características Importantes
- **Payload size**: Até 3 MB
- **Retry policy**: Tentativas com frequência decrescente por até 7 dias se falhar
- **Mutual TLS (mTLS)**: Suporte para segurança adicional
- **IP addresses**: Mudam periodicamente, recomenda-se usar mTLS ao invés de whitelist

---

## 5. Messages API - Envio de Mensagens

### Fonte
- URL: https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api

### Endpoint
```
POST https://graph.facebook.com/{Version}/{Phone-Number-ID}/messages
```

### Headers
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Tipos de Mensagens Suportadas
1. **Text messages**: Mensagens de texto simples
2. **Media messages**: Audio, image, video, document, sticker
3. **Template messages**: Templates pré-aprovados
4. **Interactive messages**: Botões, listas
5. **Location messages**: Compartilhamento de localização
6. **Reaction messages**: Reações a mensagens
7. **Contact messages**: Compartilhamento de contatos

### Exemplo: Enviar Mensagem de Texto
```bash
curl --request POST \
  --url 'https://graph.facebook.com/v23.0/{Phone-Number-ID}/messages' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "{{Recipient-Phone-Number}}",
    "type": "text",
    "text": {
      "body": "Hello from Meta Cloud API!"
    }
  }'
```

### Response
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "5511999999999",
    "wa_id": "5511999999999"
  }],
  "messages": [{
    "id": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYFjNFQjBDODg5RjNCNzQxRTc5MTRCQTAA"
  }]
}
```

### Autenticação
- **Scheme**: HTTP Bearer
- **Location**: Header `Authorization`
- **Format**: `Bearer <access_token>`



---

## 6. Embedded Signup e Onboarding de Clientes

### Fonte
- URL: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview/

### Conceito
**Embedded Signup** é um fluxo de onboarding embarcável que facilita para Solution Partners, Tech Providers e Tech Partners a integração de clientes de negócio à WhatsApp Business Platform.

### Características
- **Fluxo único**: Combina múltiplos passos de onboarding em um único fluxo
- **Integração simplificada**: Conecta Meta Business Manager e WhatsApp Business Account
- **Self-service**: Clientes podem fazer onboarding diretamente do site do provedor
- **Coexistence**: Permite onboarding de usuários que já usam WhatsApp Business App

### Múltiplos Números de Telefone

#### Estrutura
- **WABA (WhatsApp Business Account)**: Pode ter múltiplos números de telefone
- **Limite inicial**: Meta limita a 2 números de telefone por negócio durante registro inicial
- **Expansão**: Após verificação e uso, limite pode ser aumentado

#### Arquitetura Possível
1. **Um WABA por plataforma**: Todos os números dos mentorados em um único WABA
2. **Um WABA por mentorado**: Cada mentorado tem seu próprio WABA (mais isolamento)
3. **WABA regional**: Um WABA por região geográfica

### Verificação de Negócio
- **Business Verification**: Processo de verificação multi-etapas
- **Verified Badge**: Selo verde de verificação no WhatsApp
- **Official Business Account (OBA)**: Status especial para grandes empresas

---

## 7. Comparação Detalhada: Z API vs Meta Cloud API

### Modelo de Negócio

| Aspecto | Z API | Meta Cloud API |
|---------|-------|----------------|
| **Provedor** | Z-API (terceiro) | Meta (oficial) |
| **Custo** | Por instância (mensal) | Por conversa (usage-based) |
| **Setup** | Rápido (QR Code) | Complexo (Business Manager, verificação) |
| **Escalabilidade** | Uma instância = um número | Um WABA = múltiplos números |

### Arquitetura Técnica

| Aspecto | Z API | Meta Cloud API |
|---------|-------|----------------|
| **Autenticação** | Instance ID + Token na URL | Bearer Token no header |
| **Base URL** | `api.z-api.io` | `graph.facebook.com` |
| **Conexão** | QR Code via API | Configuração no Business Manager |
| **Webhook Format** | Custom (Z-API format) | Meta standard format |
| **Phone Management** | Um número por instância | Múltiplos números por WABA |

### Funcionalidades

| Funcionalidade | Z API | Meta Cloud API |
|----------------|-------|----------------|
| Envio de mensagens texto | ✅ | ✅ |
| Envio de mídia | ✅ | ✅ |
| Templates | ✅ | ✅ |
| Webhooks (recebimento) | ✅ | ✅ |
| Status de mensagens | ✅ | ✅ |
| QR Code connection | ✅ | ❌ (via Business Manager) |
| Groups API | ❌ | ✅ |
| Calling API | ❌ | ✅ |
| Marketing Messages API | ❌ | ✅ |
| Embedded Signup | ❌ | ✅ |

### Vantagens e Desvantagens

#### Z API
**Vantagens:**
- Setup rápido e simples
- QR Code direto via API
- Menos burocracia
- Ideal para MVPs e testes

**Desvantagens:**
- Custo por instância (não escala bem)
- Dependência de terceiro
- Menos features oficiais
- Possível descontinuação

#### Meta Cloud API
**Vantagens:**
- API oficial da Meta
- Custo por conversa (escala melhor)
- Todas as features oficiais
- Suporte a múltiplos números por WABA
- Embedded Signup para onboarding
- Maior confiabilidade e suporte

**Desvantagens:**
- Setup complexo (Business Manager, verificação)
- Curva de aprendizado maior
- Requer verificação de negócio
- Não tem QR Code direto via API

---

## 8. Estratégias de Migração

### Opção 1: Migração Gradual (Recomendada)
1. Implementar Meta Cloud API em paralelo ao Z API
2. Novos mentorados usam Meta Cloud API
3. Mentorados existentes migram gradualmente
4. Desativar Z API após migração completa

### Opção 2: Migração Big Bang
1. Implementar Meta Cloud API completamente
2. Migrar todos os mentorados de uma vez
3. Desativar Z API imediatamente

### Opção 3: Coexistência Permanente
1. Manter ambas as APIs
2. Mentorado escolhe qual usar
3. Sistema suporta ambos indefinidamente

### Recomendação
**Opção 1 (Migração Gradual)** é a mais segura e permite:
- Testar Meta Cloud API com novos usuários
- Manter sistema funcionando durante migração
- Resolver problemas sem impactar todos os usuários
- Aprender com erros em escala menor

