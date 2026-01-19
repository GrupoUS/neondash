# Project TODO

## ✅ Concluído

### Dashboard Inicial (Dezembro 2025)
- [x] Dashboard estático com visualizações de dezembro 2025
- [x] Análise de performance Neon Estrutura e Neon Escala
- [x] Sugestões personalizadas para cada mentorado
- [x] Gráficos comparativos e rankings

### Upgrade Full Stack
- [x] Upgrade para Full Stack (DB + Auth)
- [x] Resolver conflitos de merge do upgrade
- [x] Modelar banco de dados (mentorados, métricas mensais, feedbacks)
- [x] Implementar sistema de autenticação via Manus OAuth
- [x] Configurar roles (admin/user)

### Funcionalidades de Alunos
- [x] Criar formulários de entrada de dados mensais
- [x] Desenvolver dashboard individual com gráficos de evolução
- [x] Adicionar comparativo histórico (gráficos de linha e barra)
- [x] Exibir feedbacks personalizados do mentor

### Área Administrativa
- [x] Criar página administrativa completa (/admin)
- [x] Listar todos os mentorados com filtros
- [x] Visualizar estatísticas consolidadas
- [x] Configurar email msm.jur@gmail.com como admin automático

### Migração de Dados
- [x] Script de migração de dados de dezembro criado
- [x] Migração executada com sucesso (14 mentorados)
- [x] Dados de faturamento, métricas e feedbacks importados

### Melhorias de UX
- [x] Implementar filtro de mês/ano no dashboard
- [x] Adicionar navegação completa no sidebar
- [x] Criar estados de loading e empty states

### SEO e Performance
- [x] Adicionar meta description (155 caracteres)
- [x] Adicionar palavras-chave relevantes
- [x] Adicionar Open Graph tags para compartilhamento

## 📋 Backlog (Futuras Melhorias)

### Notificações
- [x] Sistema de notificações por email (implementado ao vincular perfil)
- [ ] Lembretes automáticos para envio de métricas
- [ ] Alertas de metas não atingidas

### Gamificação
- [ ] Sistema de badges e conquistas
- [ ] Ranking mensal com recompensas
- [ ] Metas progressivas

### Relatórios
- [ ] Exportação de relatórios em PDF
- [ ] Relatórios comparativos entre turmas
- [ ] Análise de tendências e previsões

### Integrações
- [ ] Integração com Instagram API
- [ ] Integração com Google Analytics
- [ ] Webhook para automações externas


## Nova Solicitação - Identidade Visual
- [x] Analisar manual de identidade visual (cores, tipografia, símbolos)
- [x] Criar logo SVG (símbolo N + tipografia completa)
- [x] Atualizar paleta de cores (#112031, #20445B, #AC9469, #D2D0C7)
- [x] Substituir "NEONDASH" por "NEON" com logo oficial
- [x] Aplicar identidade visual em todos os componentes
- [x] Atualizar favicon e título da página
- [x] Adicionar classes utilitárias para cores da marca


## Nova Solicitação - Sistema de Login Independente (Opção 1)
- [x] Reverter alterações do Clerk (manter Manus OAuth)
- [x] Restaurar schema original com openId
- [x] Adicionar campo email na tabela mentorados
- [x] Criar procedure tRPC linkEmail para vincular emails
- [x] Criar interface admin para vincular emails aos mentorados
- [x] Atualizar MyDashboard para detectar mentorado pelo email logado
- [x] Atualizar SubmitMetrics para vincular ao mentorado correto
- [x] Testar fluxo completo de login e visualização
- [x] Criar checkpoint final
- [x] Preparar para deploy


## Nova Solicitação - Conformidade com Diretrizes de Design (style/)
- [x] Analisar arquivos de design na pasta style/
- [x] Comparar design atual com diretrizes (95% conforme)
- [x] Identificar gaps de ícones, miniaturas e thumbnails
- [x] Criar favicon SVG com símbolo N dourado
- [x] Validar tipografia (Outfit + JetBrains Mono)
- [x] Validar paleta de cores (#112031, #20445B, #AC9469, #D2D0C7)
- [x] Validar logo e branding em todas as páginas
- [x] Criar checkpoint final


### Nova Solicitação - Atualizar Símbolo N Oficial
- [x] Copiar arquivo símbolo-07.png para o projeto
- [x] Atualizar DashboardLayout para usar símbolo oficial
- [x] Atualizar LandingPage para usar símbolo oficial
- [x] Atualizar favicon com novo símbolo
- [x] Verificar botão de logout na sidebar (confirmado presente)
- [x] Configurar redirecionamento após login para /dashboard
- [x] Criar checkpoint final


### Nova Solicitação - Corrigir Redirecionamento Após Login
- [x] Verificar se o OAuth callback está redirecionando corretamente para /dashboard
- [x] Garantir que usuários autenticados sejam redirecionados do / para /dashboard
- [x] Testar fluxo completo: Landing Page → Login → Dashboard
- [x] Criar checkpoint após validação


### Nova Solicitação - Corrigir Redirecionamento para Contas Não-Admin
- [x] Investigar problema de redirecionamento após login com contas não-admin
- [x] Verificar configuração de cookies (domínio, path, sameSite)
- [x] Ajustar configuração de cookies para suportar HTTPS e localhost
- [x] Adicionar logs detalhados para diagnóstico
- [x] Garantir que o redirecionamento funcione para admin e não-admin
- [x] Criar checkpoint após validação completa


### Nova Solicitação - Sistema de Vinculação e Detecção de Mentorados
- [x] Criar página /admin/vincular para associar emails aos mentorados
- [x] Implementar formulário de vinculação com seleção de mentorado e input de email
- [x] Atualizar MyDashboard para detectar automaticamente mentorado pelo email
- [x] Criar página de primeiro acesso para usuários sem perfil vinculado
- [x] Adicionar rotas no App.tsx
- [x] Adicionar links de navegação no DashboardLayout com filtro de permissões
- [x] Testar fluxo completo: login → detecção → dashboard personalizado
- [x] Criar checkpoint final


### Nova Solicitação - Notificações, Gestão de Mentorados e Dashboard Comparativo
- [x] Implementar sistema de notificações por email ao vincular perfil
- [x] Criar função de envio de email usando API do Manus
- [x] Integrar notificação na ação de vincular email
- [x] Criar página /admin/mentorados para gestão completa
- [x] Implementar CRUD de mentorados (criar, editar, remover)
- [x] Adicionar upload de foto de perfil (via URL)
- [x] Implementar definição de metas personalizadas
- [x] Criar dashboard comparativo para mentorados
- [x] Calcular percentis de performance vs turma
- [x] Mostrar áreas de destaque do mentorado
- [x] Adicionar gráficos comparativos anonimizados
- [x] Atualizar rotas e navegação
- [x] Criar checkpoint final


### Nova Solicitação - Remover Clerk e Corrigir Autenticação
- [x] Identificar todas as referências ao Clerk no código
- [x] Remover imports e configurações do Clerk
- [x] Garantir que apenas Manus Auth seja utilizado
- [x] Corrigir redirecionamento após login para dashboard correto
- [x] Testar fluxo completo de autenticação
- [x] Criar checkpoint após validação


### Nova Solicitação - Correção de Bugs Críticos
- [x] Corrigir logout incompleto (não volta para landing page)
- [x] Corrigir query feedback retornando undefined
- [x] Corrigir erro de âncoras aninhadas no DashboardLayout
- [x] Verificar redirecionamento após login para dashboard
- [x] Testar fluxo completo: login → dashboard → logout → landing page
- [x] Criar checkpoint após validação
