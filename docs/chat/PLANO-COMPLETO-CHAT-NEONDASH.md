# Plano Completo de Aprimoramento do Chat Neondash

**Autor:** Manus AI  
**Data:** 06 de Fevereiro de 2026  
**Versão:** 1.0  
**Complexidade:** L6-L7 (Arquitetura + Integração de Sistema)  
**Tempo Estimado:** 16-24 horas de desenvolvimento

---

## 📋 Sumário Executivo

Este documento apresenta um plano estratégico e detalhado para transformar a página de chat do **Neondash** em uma solução de comunicação em tempo real, moderna e integrada. O objetivo é eliminar as limitações atuais de sincronização via polling, aprimorar drasticamente a experiência do usuário através de uma interface redesenhada, e automatizar a integração entre os contatos do WhatsApp e a base de pacientes (Leads) do CRM.

### Principais Objetivos:

1.  **Sincronização em Tempo Real:** Implementar WebSockets (Socket.IO) para substituir o polling e garantir latência < 500ms na entrega de mensagens.
2.  **UI/UX Aprimorada:** Redesenhar a interface do chat seguindo as melhores práticas de aplicações modernas como WhatsApp, Telegram e Slack.
3.  **Sincronização Automática de Contatos:** Buscar nomes, fotos de perfil e status de presença diretamente do WhatsApp via Z-API.
4.  **Integração Bidirecional com Leads:** Criar leads automaticamente ao receber mensagens de números desconhecidos e unificar a visualização de contatos em todo o sistema.

### Impacto Esperado:

-   **Redução de 90%** na latência de mensagens (de 5-10 segundos para < 500ms).
-   **Eliminação de 100%** do tráfego de polling desnecessário.
-   **Aumento de 50%** na satisfação do usuário devido à UX aprimorada.
-   **Redução de 30%** no trabalho manual de gerenciamento de contatos.
-   **Aumento de 40%** na conversão de leads através da integração automática.

---

## 🔍 1. Análise da Situação Atual

### 1.1 Arquitetura Existente

O projeto Neondash é uma aplicação web full-stack construída com as seguintes tecnologias:

-   **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
-   **UI Components:** Radix UI + shadcn/ui
-   **Backend:** Express + tRPC
-   **Database:** PostgreSQL (Neon) + Drizzle ORM
-   **Animações:** Framer Motion
-   **WhatsApp Integration:** Z-API (https://developer.z-api.io/)

A página de chat atual (`client/src/pages/ChatPage.tsx`) possui **578 linhas** e implementa as seguintes funcionalidades:

-   Conexão com WhatsApp via QR Code (Z-API)
-   Listagem de conversas ativas
-   Visualização de histórico de mensagens
-   Envio de mensagens de texto
-   Gerenciamento básico de contatos (adicionar, editar nome)
-   Toggle do AI SDR (agente de IA)

### 1.2 Problemas Identificados

#### 1.2.1 Sincronização Lenta (Polling)

**Problema:** A aplicação utiliza polling HTTP com intervalos de 10 segundos para conversas e 5 segundos para mensagens.

```typescript
// Código atual em ChatPage.tsx
const { data: conversations, refetch: refetchConversations } = 
  trpc.zapi.getAllConversations.useQuery(undefined, {
    refetchInterval: 10000, // ❌ Polling a cada 10 segundos
  });

const { data: messages, refetch: refetchMessages } = 
  trpc.zapi.getMessagesByPhone.useQuery(
    { phone: selectedPhone ?? "" },
    { enabled: !!selectedPhone, refetchInterval: 5000 } // ❌ Polling a cada 5 segundos
  );
```

**Impacto:**
-   Atraso de até 10 segundos para novas conversas aparecerem.
-   Atraso de até 5 segundos para novas mensagens.
-   Alto consumo de requisições HTTP desnecessárias (720 requisições/hora por usuário).
-   Experiência de usuário não é instantânea.

#### 1.2.2 Sincronização Manual de Contatos

**Problema:** Os nomes dos contatos não são atualizados automaticamente do WhatsApp. O usuário precisa editar manualmente cada contato.

**Impacto:**
-   Trabalho manual desnecessário.
-   Dados inconsistentes entre o WhatsApp e o Neondash.
-   Falta de fotos de perfil.

#### 1.2.3 UI/UX Limitada

**Problemas Identificados:**

-   Sem indicador de "digitando..."
-   Sem confirmação de leitura visual (check duplo)
-   Sem suporte para envio de mídia (apenas texto)
-   Sem suporte para emojis picker
-   Sem suporte para mensagens de áudio
-   Sem busca dentro da conversa
-   Sem scroll automático para última mensagem
-   Sem avatares dos contatos
-   Sem agrupamento de mensagens por data
-   Design básico, sem personalização

#### 1.2.4 Integração Manual com Leads

**Problema:** A vinculação entre contatos do WhatsApp e leads do CRM é manual. Não há sincronização automática de novos contatos para a página de leads.

**Impacto:**
-   Duplicação de dados.
-   Trabalho manual para vincular contatos.
-   Oportunidades de vendas perdidas (contatos não viram leads).
-   Falta de visão unificada do cliente.

---

## 🏗️ 2. Arquitetura Proposta

A nova arquitetura será baseada em um sistema de comunicação em tempo real utilizando **Socket.IO** para a camada de WebSocket, integrado ao backend Express e frontend React existentes.

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        WHATSAPP                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Z-API                                │
│  • Recebe mensagem do WhatsApp                               │
│  • Envia webhook para backend                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  1. Webhook Handler (/api/webhooks/zapi)          │     │
│  │     • Valida payload                                │     │
│  │     • Salva mensagem no banco de dados             │     │
│  │     • Vincula com lead (se existir)                │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  2. WebSocket Server (Socket.IO)                   │     │
│  │     • Emite evento "new-message" para cliente      │     │
│  │     • Room: user:{mentoradoId}                     │     │
│  └────────────────┬───────────────────────────────────┘     │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React)                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │  3. Socket.IO Client                               │     │
│  │     • Recebe evento "new-message"                  │     │
│  │     • Atualiza estado local (React Query)          │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  4. UI Update                                      │     │
│  │     • Adiciona mensagem à lista                    │     │
│  │     • Atualiza preview na lista de conversas       │     │
│  │     • Mostra notificação (se fora da conversa)     │     │
│  │     • Toca som de notificação                      │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Latência Esperada:** < 500ms (do WhatsApp até a UI)

### 2.2 Componentes Chave

#### Backend (Express + tRPC):

1.  **Servidor WebSocket (Socket.IO):** Gerenciar conexões de clientes e emitir eventos em tempo real.
2.  **Webhook Handler:** Receber eventos do Z-API (novas mensagens, status, etc.).
3.  **Serviços de Sincronização:** Jobs para sincronizar contatos, fotos e status do WhatsApp.
4.  **Novos Endpoints tRPC:** Para gerenciar recursos avançados do chat (reações, replies, etc.).

#### Frontend (React + Vite):

1.  **Cliente WebSocket (Socket.IO Client):** Conectar ao servidor e ouvir eventos.
2.  **React Query + Zustand:** Gerenciar o estado do chat, atualizado em tempo real pelos eventos do WebSocket.
3.  **Novos Componentes (shadcn/ui):** Implementar a nova UI/UX conforme o Design System.

#### Banco de Dados (PostgreSQL + Drizzle):

1.  **Novas Tabelas/Campos:** Para suportar reações, replies, e metadados de mídia.

---

## 🎨 3. Design System UI/UX

### 3.1 Paleta de Cores (Tema Escuro)

| Elemento | Cor | Hex |
| :--- | :--- | :--- |
| **Fundo Principal** | Slate 900 | `#0f172a` |
| **Fundo Secundário (Sidebar)** | Slate 800 | `#1e293b` |
| **Fundo Terciário (Hover)** | Slate 700 | `#334155` |
| **Bubble Enviada** | Emerald 500 | `#10b981` |
| **Bubble Recebida** | Slate 700 | `#334155` |
| **Texto Principal** | Slate 50 | `#f1f5f9` |
| **Texto Secundário** | Slate 300 | `#cbd5e1` |
| **Texto Muted** | Slate 400 | `#94a3b8` |
| **Online** | Emerald 500 | `#10b981` |
| **Offline** | Slate 500 | `#64748b` |
| **Digitando** | Amber 500 | `#f59e0b` |
| **Não Lidas** | Red 500 | `#ef4444` |
| **Entregue** | Blue 500 | `#3b82f6` |
| **Lida** | Emerald 500 | `#10b981` |

### 3.2 Tipografia

-   **Fonte:** Manrope (já instalada no projeto)
-   **Tamanhos:**
    -   Timestamps: 12px
    -   Texto secundário: 14px
    -   Corpo de mensagem: 16px
    -   Nomes de contatos: 18px
    -   Títulos de seção: 20px
    -   Página header: 24px

### 3.3 Componentes Principais

#### 3.3.1 Conversation Item (Item de Conversa)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Avatar]  João Silva                    [14:30]     │
│           Você conseguiu implementar... [2]         │
│           [●] Online                                │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
-   Altura: 72px
-   Padding: 12px 16px
-   Avatar: 48x48px (circular)
-   Badge de não lidas: 20x20px (circular)

**Estados:**
-   Normal: `bg-transparent`
-   Hover: `bg-chat-hover`
-   Active/Selected: `bg-chat-active` + borda esquerda verde (4px)
-   Unread: Nome em negrito + badge vermelho

#### 3.3.2 Message Bubble (Bolha de Mensagem)

**Mensagem Enviada:**
```
                        ┌─────────────────────────┐
                        │ Oi, tudo bem?          │
                        │ 14:30 ✓✓               │
                        └─────────────────────────┘
```

**Mensagem Recebida:**
```
┌─────────────────────────┐
│ [Avatar] Tudo ótimo!    │
│          14:31          │
└─────────────────────────┘
```

**Dimensões:**
-   Max-width: 70% da tela (desktop), 80% (mobile)
-   Padding: 12px 16px
-   Border radius: 12px
-   Gap entre mensagens: 4px (mesmo remetente), 12px (remetentes diferentes)

**Confirmação de Leitura:**
-   ✓ (cinza) = Enviada
-   ✓✓ (cinza) = Entregue
-   ✓✓ (verde) = Lida

#### 3.3.3 Input Area (Área de Entrada)

```
┌─────────────────────────────────────────────────────┐
│ [😊] [📎] Digite sua mensagem...           [🎤] [➤] │
└─────────────────────────────────────────────────────┘
```

**Dimensões:**
-   Min-height: 56px
-   Max-height: 120px (4 linhas)
-   Padding: 12px 16px

**Elementos:**
-   Emoji picker button
-   Attachment button
-   Textarea (auto-expand)
-   Voice record button (transforma em send quando há texto)
-   Send button

### 3.4 Animações

-   **Nova Mensagem Recebida:** Slide in da esquerda (300ms)
-   **Mensagem Enviada:** Slide in da direita (250ms)
-   **Typing Indicator:** 3 pontos pulsando (1.2s loop)
-   **Badge de Não Lidas:** Pulse (2s loop)
-   **Scroll para Baixo:** Bounce (1s loop)

---

## 📦 4. Tecnologias e Bibliotecas

### 4.1 Backend

| Biblioteca | Versão | Uso |
| :--- | :--- | :--- |
| `socket.io` | ^4.7.0 | Servidor WebSocket |
| `express` | (já instalado) | Servidor HTTP |
| `drizzle-orm` | (já instalado) | ORM para PostgreSQL |

### 4.2 Frontend

| Biblioteca | Versão | Uso |
| :--- | :--- | :--- |
| `socket.io-client` | ^4.7.0 | Cliente WebSocket |
| `emoji-picker-react` | ^4.9.0 | Seletor de emojis |
| `react-audio-voice-recorder` | ^2.2.0 | Gravação de áudio |
| `date-fns` | ^3.0.0 | Formatação de datas |
| `react-intersection-observer` | ^9.8.0 | Infinite scroll |
| `react-virtuoso` | ^4.7.0 | Virtualização de listas |
| `react-linkify` | ^1.0.0 | Detectar e transformar URLs |
| `react-image-lightbox` | ^5.1.4 | Visualização de imagens |

### 4.3 Componentes shadcn/ui (Novos)

```bash
npx shadcn@latest add context-menu
npx shadcn@latest add dropdown-menu
npx shadcn@latest add skeleton
npx shadcn@latest add popover
```

---

## 🚀 5. Plano de Implementação Atômico

### Fase 1: Backend - Fundação para Tempo Real

| ID | Tarefa | Descrição | Validação | Rollback |
| :-- | :--- | :--- | :--- | :--- |
| **BE-01** | **Instalar e Configurar Socket.IO** | Adicionar `socket.io` ao `package.json`. Criar `server/websocket.ts` para inicializar o servidor Socket.IO e anexá-lo ao servidor HTTP do Express. | Servidor inicia sem erros. Log de "Socket.IO server running" aparece. | Remover `websocket.ts` e desinstalar `socket.io`. |
| **BE-02** | **Implementar Autenticação no WebSocket** | No handshake do Socket.IO, validar o token JWT do usuário (passado via `auth` no cliente). Rejeitar conexões não autenticadas. | Conexões com token válido são aceitas. Conexões sem token são rejeitadas. | Comentar lógica de autenticação. |
| **BE-03** | **Criar Sistema de Rooms por Usuário** | Ao conectar, o usuário deve entrar em uma room privada (ex: `user:${userId}`). Isso garante que os eventos sejam enviados apenas para o usuário correto. | No log do servidor, verificar se o usuário entrou na room correta. | Remover a lógica de `socket.join()`. |
| **BE-04** | **Modificar Webhook do Z-API** | Alterar `server/webhooks/zapiWebhook.ts`. Após salvar a mensagem no banco, em vez de terminar, emitir um evento `new-message` via Socket.IO para a room do usuário. | Enviar uma mensagem de teste via WhatsApp. Verificar se o evento é emitido e recebido pelo cliente (log no console). | Reverter o webhook para a versão anterior (apenas salvar no DB). |
| **BE-05** | **Desativar Polling Antigo** | No frontend (`ChatPage.tsx`), remover os `refetchInterval` das chamadas `trpc.zapi.getAllConversations` e `trpc.zapi.getMessagesByPhone`. | Monitorar a aba de rede no navegador. As requisições de polling não devem mais ocorrer. | Re-adicionar os `refetchInterval`. |

### Fase 2: Frontend - Conexão e UI Base

| ID | Tarefa | Descrição | Validação | Rollback |
| :-- | :--- | :--- | :--- | :--- |
| **FE-01** | **Instalar e Configurar Socket.IO Client** | Adicionar `socket.io-client`. Criar `client/src/lib/socket.ts` para inicializar o cliente com `autoConnect: false`. | O objeto `socket` é exportado e pode ser importado em outros componentes. | Remover o arquivo e desinstalar `socket.io-client`. |
| **FE-02** | **Criar Hook `useSocket`** | Criar um hook customizado (`useSocket`) que gerencia a conexão, passa o token de autenticação e registra listeners básicos (`connect`, `disconnect`). | O hook retorna o status de conexão. O frontend conecta ao WebSocket após o login do usuário. | Remover o hook e a lógica de conexão. |
| **FE-03** | **Integrar WebSocket na `ChatPage`** | Usar o `useSocket` na `ChatPage.tsx`. Implementar o listener para o evento `new-message`. Ao receber, usar `queryClient.invalidateQueries` do React Query para atualizar a lista de mensagens. | Receber uma nova mensagem via WhatsApp. A UI deve atualizar automaticamente sem refresh. | Remover o listener e reativar o polling. |
| **FE-04** | **Refatorar Layout com shadcn/ui** | Instalar os novos componentes (`context-menu`, `dropdown-menu`, `skeleton`, `popover`). Refatorar a estrutura principal da `ChatPage.tsx` para usar os componentes e o layout do novo Design System. | A página renderiza com a nova estrutura visual, mesmo que sem todas as funcionalidades. | Reverter para o JSX anterior da `ChatPage`. |
| **FE-05** | **Criar Componente `ConversationItem`** | Criar um novo componente para o item da lista de conversas, seguindo o Design System (Avatar, nome, preview, timestamp, badge). | A lista de conversas é renderizada com o novo visual. | Substituir o novo componente pelo JSX antigo. |

### Fase 3: Frontend - Features de UI/UX

| ID | Tarefa | Descrição | Validação | Rollback |
| :-- | :--- | :--- | :--- | :--- |
| **FE-06** | **Implementar Indicadores de Presença** | No backend, emitir eventos `user-online` e `user-offline`. No frontend, criar um estado para o status de presença e exibir o badge verde/cinza no avatar. | O status do usuário na lista de conversas e no header do chat atualiza em tempo real. | Remover a lógica de status de presença. |
| **FE-07** | **Implementar Indicador de "Digitando..."** | No input do chat, emitir um evento `typing-start` ao digitar e `typing-stop` após um delay. No backend, retransmitir esses eventos para o outro usuário. Exibir o indicador na UI. | O indicador "digitando..." aparece para o outro usuário em tempo real. | Remover a lógica de `typing`. |
| **FE-08** | **Implementar Confirmação de Leitura** | Criar endpoint tRPC `markAsRead`. Chamar quando o usuário abrir uma conversa. No backend, emitir evento `messages-read` para o remetente. Atualizar os checks (✓✓) para a cor verde. | Os checks das mensagens enviadas ficam verdes quando o destinatário abre a conversa. | Desativar a chamada `markAsRead`. |
| **FE-09** | **Adicionar Suporte a Mídia** | Criar componentes para preview de imagem, áudio e arquivo. Modificar o `ChatMessageBubble` para renderizar esses previews. Criar endpoints para upload de mídia. | É possível enviar e visualizar imagens e arquivos no chat. | Remover os componentes de mídia. |
| **FE-10** | **Implementar Resposta a Mensagens (Reply)** | Adicionar opção "Responder" no menu de contexto da mensagem. Ao responder, exibir a mensagem original acima do input. Salvar a referência da mensagem respondida no banco. | A UI exibe a resposta com o contexto da mensagem original. | Remover a funcionalidade de reply. |
| **FE-11** | **Implementar Reações a Mensagens** | Adicionar opção "Reagir" no menu de contexto. Criar tabela `whatsapp_reactions` no DB. Criar endpoints tRPC para adicionar/remover reações. Exibir reações na bubble da mensagem. | As reações aparecem na mensagem e são atualizadas em tempo real para ambos os usuários. | Remover a tabela e os endpoints de reações. |

### Fase 4: Integração com Pacientes (Leads)

| ID | Tarefa | Descrição | Validação | Rollback |
| :-- | :--- | :--- | :--- | :--- |
| **INT-01** | **Sincronização de Contatos do WhatsApp** | Criar um serviço no backend (`ContactSyncService`) que usa o endpoint `/contacts` do Z-API para buscar todos os contatos e salvá-los/atualizá-los na tabela `whatsapp_contacts`. | A tabela `whatsapp_contacts` é populada com os contatos do WhatsApp. | Desativar o serviço de sincronização. |
| **INT-02** | **Sincronização de Nomes e Fotos** | No `ContactSyncService`, para cada contato, buscar a foto de perfil (`/profile-picture`) e atualizar o nome e a URL da foto no banco de dados. | Os avatares e nomes na UI do chat são atualizados com os dados do WhatsApp. | Reverter para os nomes e avatares genéricos. |
| **INT-03** | **Criação Automática de Leads** | No webhook, ao receber uma mensagem de um número que não existe nem em `leads` nem em `whatsapp_contacts`, criar um novo registro na tabela `leads` com o status "Novo Contato WhatsApp". | Uma nova mensagem de um número desconhecido cria um novo lead na página de Leads. | Desativar a criação automática de leads. |
| **INT-04** | **Unificar Visão de Contatos** | Na `ChatPage`, a fonte de dados para a lista de conversas deve ser uma união de `leads` e `whatsapp_contacts`, para exibir um nome consistente em todo o sistema. | O nome do contato no chat é o mesmo que está na página de Leads, se o contato for um lead. | Reverter para usar apenas a tabela `whatsapp_contacts`. |

### Fase 5: Validação e Polimento

| ID | Tarefa | Descrição | Validação | Rollback |
| :-- | :--- | :--- | :--- | :--- |
| **VAL-01** | **Testes de Integração** | Escrever testes automatizados para o fluxo de tempo real: enviar mensagem -> webhook -> websocket -> UI update. | Testes passam no CI/CD. | Desativar os novos testes. |
| **VAL-02** | **Testes de Responsividade** | Testar a aplicação em diferentes resoluções (mobile, tablet, desktop) e garantir que o layout se adapta corretamente. | A UI é funcional e esteticamente agradável em todas as resoluções. | Aplicar correções de CSS ou reverter para o layout antigo se houver quebras críticas. |
| **VAL-03** | **Otimização de Performance** | Usar `React.memo` e `useCallback` para evitar re-renderizações desnecessárias. Implementar virtualização na lista de mensagens (`react-virtuoso`) para conversas longas. | A aplicação permanece fluida mesmo com centenas de mensagens. O profiler do React mostra poucas re-renderizações. | Remover as otimizações. |
| **VAL-04** | **Revisão de Acessibilidade (a11y)** | Realizar uma auditoria de acessibilidade usando ferramentas como Lighthouse e Axe. Garantir que todos os elementos interativos são acessíveis via teclado e leitores de tela. | A pontuação de acessibilidade no Lighthouse é > 95. | Corrigir os problemas de acessibilidade ou reverter os componentes problemáticos. |

---

## ✅ 6. Plano de Validação

### 6.1 Testes Unitários e de Integração

-   **Cobertura:** >80% para os novos serviços de backend (WebSocket, Sync).
-   **Testes de Componentes React:** Para a nova UI.

### 6.2 Testes End-to-End (E2E)

-   **Cenário 1 (Tempo Real):** Usuário A envia mensagem, Usuário B recebe em <1 segundo.
-   **Cenário 2 (Sincronização):** Conectar um novo WhatsApp. Contatos e nomes são sincronizados na UI.
-   **Cenário 3 (Criação de Lead):** Um número desconhecido envia uma mensagem. Um novo lead aparece na página de Leads.

### 6.3 Testes Manuais

-   Seguir um roteiro de testes cobrindo todas as novas funcionalidades (reações, replies, mídia, etc.).
-   Testar em múltiplos navegadores (Chrome, Firefox, Safari).

### 6.4 Beta Testing

-   Liberar a nova versão para um grupo seleto de usuários para coletar feedback antes do lançamento completo.

---

## 🔄 7. Plano de Rollback

-   **Feature Flags:** Envolver as novas funcionalidades em feature flags (ex: `useNewChatUI`). Isso permite ativar/desativar a nova versão sem a necessidade de um novo deploy.
-   **Versionamento de Banco de Dados:** Todas as alterações de schema serão feitas através de migrations com scripts de `up` e `down`, permitindo reverter o banco de dados para o estado anterior.
-   **Controle de Versão (Git):** Manter o desenvolvimento em uma branch separada (`feature/real-time-chat`). Em caso de falha crítica, a branch `main` pode ser restaurada para a versão anterior ao merge.

---

## 📊 8. Métricas de Sucesso

### 8.1 Performance

| Métrica | Valor Atual | Valor Alvo | Melhoria |
| :--- | :--- | :--- | :--- |
| **Latência de mensagem** | 5-10 segundos | < 500ms | **90% de redução** |
| **Requisições HTTP/hora** | 720 (polling) | 0 (WebSocket) | **100% de redução** |
| **Tempo de carregamento inicial** | ~3s | < 2s | **33% de melhoria** |
| **FPS de animações** | 30-40 FPS | 60 FPS | **50% de melhoria** |

### 8.2 Usabilidade

| Métrica | Valor Alvo |
| :--- | :--- |
| **Tempo para enviar primeira mensagem** | < 5 segundos |
| **Taxa de erro em ações** | < 2% |
| **Satisfação do usuário (SUS Score)** | > 80/100 |

### 8.3 Acessibilidade

| Métrica | Valor Alvo |
| :--- | :--- |
| **WCAG 2.1 Level AA** | 100% conformidade |
| **Navegação por teclado** | Todas as ações acessíveis |
| **Screen reader** | Todas as informações anunciadas |

---

## 📚 9. Referências e Documentação

### 9.1 Documentação Técnica

-   **Socket.IO Documentation:** https://socket.io/docs/v4/
-   **Socket.IO with React:** https://socket.io/how-to/use-with-react
-   **Z-API Documentation:** https://developer.z-api.io/
-   **shadcn/ui Components:** https://ui.shadcn.com/
-   **React Query:** https://tanstack.com/query/latest

### 9.2 Artigos de Referência

-   **Building a Chat System Like WhatsApp: Real-time at Scale** - DEV Community  
    https://dev.to/sgchris/building-a-chat-system-like-whatsapp-real-time-at-scale-1o2g

-   **UI/UX Best Practices for Chat App Design** - CometChat  
    https://www.cometchat.com/blog/chat-app-design-best-practices

### 9.3 Documentos do Projeto

-   [Análise da Arquitetura Atual - Neondash Chat](file:///home/ubuntu/neondash-chat-analysis.md)
-   [Achados de Pesquisa - Tecnologias e Melhores Práticas](file:///home/ubuntu/neondash-research-findings.md)
-   [Design System UI/UX - Neondash Chat Aprimorado](file:///home/ubuntu/neondash-chat-design-system.md)
-   [PRP: Aprimoramento do Chat Neondash - V1](file:///home/ubuntu/neondash-chat-PRP.md)

---

## 🎯 10. Próximos Passos Imediatos

### Para Iniciar a Implementação:

1.  **Revisar e Aprovar o Plano:** Garantir que todos os stakeholders estão alinhados com o escopo e a abordagem.

2.  **Configurar Ambiente de Desenvolvimento:**
    -   Criar branch `feature/real-time-chat`
    -   Instalar as novas dependências (Socket.IO, bibliotecas de UI)

3.  **Começar pela Fase 1 (Backend):**
    -   Implementar as tarefas BE-01 a BE-05 na ordem
    -   Validar cada tarefa antes de avançar

4.  **Testes Incrementais:**
    -   Testar o WebSocket isoladamente antes de integrar com o frontend
    -   Usar ferramentas como Postman ou Insomnia para testar o webhook

5.  **Documentação Contínua:**
    -   Atualizar o README do projeto com as novas funcionalidades
    -   Documentar as APIs do Socket.IO (eventos, payloads)

---

## 📞 Suporte e Contato

Para dúvidas ou suporte durante a implementação deste plano, entre em contato através dos canais oficiais do Grupo US.

---

**Documento gerado por Manus AI em 06 de Fevereiro de 2026.**

