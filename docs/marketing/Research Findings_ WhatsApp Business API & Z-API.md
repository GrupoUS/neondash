# Research Findings: WhatsApp Business API & Z-API

## Fontes
- **Z-API Docs**: https://developer.z-api.io/en/
- **WhatsApp Business Platform**: https://business.whatsapp.com/products/business-platform
- **Data**: 06/02/2026
- **Confiança**: 4/5 (Documentação oficial Z-API + WhatsApp)

## Z-API Overview

### O que é Z-API
Z-API é um serviço RESTful que fornece uma API para interagir com WhatsApp através de uma API simples e intuitiva, além de webhooks para alertar sobre interações com o número. Utiliza o mesmo canal de comunicação do WhatsApp Web.

### Características Principais
- **Sem limites de mensagens**: Z-API não impõe limites no número de mensagens enviadas
- **Baseado em WhatsApp Web**: Usa a mesma sessão do WhatsApp Web
- **Multi-dispositivo**: Suporta funcionalidade de múltiplos dispositivos do WhatsApp (até 4 dispositivos)
- **Não armazena mensagens**: Mensagens são encaminhadas para fila e deletadas após envio
- **RESTful**: API simples e intuitiva para programadores

### Limitações e Considerações
- ⚠️ **Padrão de uso compatível**: Precisa seguir padrões de uso do WhatsApp Web
- ⚠️ **Políticas WhatsApp**: Seguir políticas oficiais do WhatsApp (https://www.whatsapp.com/legal)
- ⚠️ **Bloqueios**: Risco de bloqueio se usar de forma inadequada (spam, mensagens em massa não solicitadas)
- ⚠️ **WhatsApp Web exclusivo**: Ao conectar com Z-API, não pode usar WhatsApp Web simultaneamente (exceto com multi-dispositivo)

## Funcionalidades Disponíveis

### Envio de Mensagens
- ✅ Texto simples
- ✅ Imagens
- ✅ Vídeos
- ✅ Áudio
- ✅ Documentos
- ✅ Stickers
- ✅ GIF
- ✅ PTV (Picture-to-Video)
- ✅ Links
- ✅ Localização
- ✅ Produtos
- ✅ Catálogo
- ✅ Contatos (único e múltiplos)

### Mensagens Interativas
- ✅ Botões de ação
- ✅ Botões com texto
- ✅ Botões com imagens
- ✅ Botões com vídeo
- ✅ Lista de opções
- ✅ Botão OTP
- ✅ Botão PIX
- ✅ Carousel
- ✅ Enquetes (polls)

### Funcionalidades Avançadas
- ✅ Encaminhar mensagens
- ✅ Reações (adicionar/remover)
- ✅ Deletar mensagens
- ✅ Marcar como lido
- ✅ Responder mensagens
- ✅ Fixar/desafixar mensagens
- ✅ Eventos
- ✅ Newsletter

### Gerenciamento de Instância
- ✅ Status da instância
- ✅ QR Code
- ✅ Reiniciar instância
- ✅ Desconectar
- ✅ Atualizar foto de perfil
- ✅ Atualizar nome/descrição
- ✅ Auto-leitura
- ✅ Rejeitar chamadas

### Webhooks
- ✅ Status de entrega de mensagens
- ✅ Mensagens recebidas
- ✅ Status de leitura
- ✅ Interações com número

## Fluxo de Entrega de Mensagens

1. **Envio**: Usuário envia mensagem via API para Z-API
2. **Queue**: Z-API adiciona à fila e retorna message ID
3. **Processamento**: Instância processa fila e envia para WhatsApp
4. **Webhook Delivery**: Chamado quando mensagem é enviada
5. **Webhook Received**: Chamado quando destinatário recebe
6. **Webhook Read**: Chamado quando destinatário lê

## Integração Existente no NeonDash

### Componentes Encontrados
- **WhatsAppConnectionCard.tsx**: Gerencia conexão Z-API
- **AIAgentSettingsCard.tsx**: Configuração de agente IA para WhatsApp (SDR)
- Rotas backend para WhatsApp

### Funcionalidades Atuais
- ✅ Conexão com Z-API
- ✅ Envio/recebimento de mensagens
- ✅ Agente IA para qualificação de leads
- ❌ **NÃO IMPLEMENTADO**: Campanhas de marketing em massa

## WhatsApp Business API (Oficial)

### Diferenças Z-API vs API Oficial
- **Z-API**: Baseado em WhatsApp Web, mais flexível, sem aprovação Meta necessária
- **API Oficial**: Requer aprovação Meta, mais recursos empresariais, templates pré-aprovados

### Campanhas de Marketing (API Oficial)
- **Templates**: Mensagens de marketing precisam usar templates pré-aprovados
- **Categorias**: Marketing, Utility, Authentication
- **Limitações**: Não pode enviar mensagens não solicitadas
- **Opt-in**: Usuários precisam dar opt-in antes de receber marketing

### Recursos Empresariais (API Oficial)
- Flows conversacionais interativos
- CTAs dinâmicos
- Listas de produtos
- Rich media
- Integração com CRM

## Considerações para Página de Marketing

### Campanhas WhatsApp via Z-API

#### ✅ Pode Fazer
- Enviar mensagens para contatos que iniciaram conversa
- Mensagens personalizadas com dados do cliente
- Botões interativos para ações
- Catálogo de produtos/serviços
- Agendamentos e lembretes
- Follow-ups automatizados

#### ❌ Não Pode Fazer (Risco de Bloqueio)
- Spam em massa para números desconhecidos
- Mensagens não solicitadas
- Envio em alta frequência sem interação
- Mensagens promocionais agressivas

### Best Practices para Campanhas

1. **Segmentação**: Enviar apenas para leads qualificados que deram opt-in
2. **Personalização**: Usar dados do CRM para personalizar mensagens
3. **Timing**: Respeitar horários comerciais
4. **Frequência**: Limitar frequência de envio
5. **Valor**: Fornecer conteúdo de valor, não apenas promoções
6. **Interatividade**: Usar botões e listas para facilitar resposta
7. **Compliance**: Seguir políticas WhatsApp e LGPD

### Arquitetura Sugerida

#### Queue System
- Fila de mensagens para controlar rate
- Priorização de mensagens
- Retry logic para falhas

#### Segmentação
- Filtros por perfil de mentorado
- Tags e categorias
- Histórico de interação

#### Templates de Campanha
- Biblioteca de mensagens pré-aprovadas
- Variáveis dinâmicas
- A/B testing

#### Analytics
- Taxa de entrega
- Taxa de leitura
- Taxa de resposta
- Conversões

## Gaps Identificados para Implementação

### Funcionalidades Necessárias
1. **Sistema de Campanhas**: Criar, agendar e gerenciar campanhas
2. **Templates**: Biblioteca de templates para clínicas estéticas
3. **Segmentação Avançada**: Filtros e tags para público-alvo
4. **Agendamento**: Schedule de envio respeitando best practices
5. **Analytics**: Dashboard de performance de campanhas
6. **Compliance**: Sistema de opt-in/opt-out
7. **Rate Limiting**: Controle de frequência de envio
8. **Personalização**: Merge tags com dados do CRM

### Integrações Necessárias
- ✅ Z-API (já existe)
- ⏳ Sistema de filas (Redis/Bull)
- ⏳ Storage de templates
- ⏳ Analytics/tracking
- ⏳ Geração de conteúdo com IA

## Próximos Passos
1. ✅ Instagram API - Completo
2. ✅ WhatsApp/Z-API - Completo
3. ⏳ APIs de geração de imagem
4. ⏳ Design system detalhado para página
