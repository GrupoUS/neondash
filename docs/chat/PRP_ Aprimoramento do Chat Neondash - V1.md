# PRP: Aprimoramento do Chat Neondash - V1

---

## 1. Visão Geral e Objetivos

**Objetivo Principal:** Transformar a página de chat do Neondash em uma solução de comunicação em tempo real, moderna e integrada, aprimorando a experiência do usuário e automatizando a sincronização de dados entre o WhatsApp e o CRM de pacientes (Leads).

**Complexidade Estimada:** L6-L7 (Arquitetura + Integração de Sistema)

**Tempo Estimado:** 16-24 horas de desenvolvimento

### Principais Entregáveis:

1.  **Sincronização em Tempo Real:** Substituir o polling por WebSockets para atualização instantânea de mensagens e status.
2.  **UI/UX Aprimorada:** Redesenhar a interface do chat para ser mais moderna, funcional e rica em recursos, baseada no Design System criado.
3.  **Sincronização Automática de Contatos:** Sincronizar nomes, fotos e status de contatos do WhatsApp automaticamente.
4.  **Integração com Pacientes (Leads):** Automatizar a criação e vinculação de contatos do WhatsApp com a base de leads/pacientes.

---

## 2. Arquitetura Proposta

A arquitetura será baseada em um sistema de comunicação em tempo real utilizando **Socket.IO** para a camada de WebSocket, integrado ao backend Express e frontend React existentes.

### Fluxo de Dados em Tempo Real:

```
WhatsApp → Z-API → Webhook (Backend) → Salva no DB → Emite via WebSocket → Frontend Recebe → UI Atualiza
```

### Componentes Chave:

-   **Backend (Express + tRPC):**
    -   **Servidor WebSocket (Socket.IO):** Gerenciar conexões de clientes e emitir eventos em tempo real.
    -   **Webhook Handler:** Receber eventos do Z-API (novas mensagens, status, etc.).
    -   **Serviços de Sincronização:** Jobs para sincronizar contatos, fotos e status do WhatsApp.
    -   **Novos Endpoints tRPC:** Para gerenciar recursos avançados do chat (reações, replies, etc.).

-   **Frontend (React + Vite):**
    -   **Cliente WebSocket (Socket.IO Client):** Conectar ao servidor e ouvir eventos.
    -   **React Query + Zustand:** Gerenciar o estado do chat, atualizado em tempo real pelos eventos do WebSocket.
    -   **Novos Componentes (shadcn/ui):** Implementar a nova UI/UX conforme o Design System.

-   **Banco de Dados (PostgreSQL + Drizzle):**
    -   **Novas Tabelas/Campos:** Para suportar reações, replies, e metadados de mídia.

---

## 3. Plano de Implementação Atômico (Atomic Tasks)

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

## 4. Plano de Validação

1.  **Testes Unitários e de Integração:**
    -   Cobertura de >80% para os novos serviços de backend (WebSocket, Sync).
    -   Testes de componentes React para a nova UI.

2.  **Testes End-to-End (E2E):**
    -   **Cenário 1 (Tempo Real):** Usuário A envia mensagem, Usuário B recebe em <1 segundo.
    -   **Cenário 2 (Sincronização):** Conectar um novo WhatsApp. Contatos e nomes são sincronizados na UI.
    -   **Cenário 3 (Criação de Lead):** Um número desconhecido envia uma mensagem. Um novo lead aparece na página de Leads.

3.  **Testes Manuais:**
    -   Seguir um roteiro de testes cobrindo todas as novas funcionalidades (reações, replies, mídia, etc.).
    -   Testar em múltiplos navegadores (Chrome, Firefox, Safari).

4.  **Beta Testing:**
    -   Liberar a nova versão para um grupo seleto de usuários para coletar feedback antes do lançamento completo.

---

## 5. Plano de Rollback

-   **Feature Flags:** Envolver as novas funcionalidades em feature flags (ex: `useNewChatUI`). Isso permite ativar/desativar a nova versão sem a necessidade de um novo deploy.
-   **Versionamento de Banco de Dados:** Todas as alterações de schema serão feitas através de migrations com scripts de `up` e `down`, permitindo reverter o banco de dados para o estado anterior.
-   **Controle de Versão (Git):** Manter o desenvolvimento em uma branch separada (`feature/real-time-chat`). Em caso de falha crítica, a branch `main` pode ser restaurada para a versão anterior ao merge.

---

## 6. Referências

-   [Análise da Arquitetura Atual - Neondash Chat](file:///home/ubuntu/neondash-chat-analysis.md)
-   [Achados de Pesquisa - Tecnologias e Melhores Práticas](file:///home/ubuntu/neondash-research-findings.md)
-   [Design System UI/UX - Neondash Chat Aprimorado](file:///home/ubuntu/neondash-chat-design-system.md)

