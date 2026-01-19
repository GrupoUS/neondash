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
- [ ] Sistema de notificações por email
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
- [ ] Criar interface admin para vincular emails aos mentorados
- [ ] Atualizar MyDashboard para detectar mentorado pelo email logado
- [ ] Atualizar SubmitMetrics para vincular ao mentorado correto
- [ ] Testar fluxo completo de login e visualização
- [ ] Criar checkpoint final
- [ ] Preparar para deploy


## Nova Solicitação - Conformidade com Diretrizes de Design (style/)
- [x] Analisar arquivos de design na pasta style/
- [x] Comparar design atual com diretrizes (95% conforme)
- [x] Identificar gaps de ícones, miniaturas e thumbnails
- [x] Criar favicon SVG com símbolo N dourado
- [x] Validar tipografia (Outfit + JetBrains Mono)
- [x] Validar paleta de cores (#112031, #20445B, #AC9469, #D2D0C7)
- [x] Validar logo e branding em todas as páginas
- [ ] Criar checkpoint final


### Nova Solicitação - Atualizar Símbolo N Oficial
- [x] Copiar arquivo símbolo-07.png para o projeto
- [x] Atualizar DashboardLayout para usar símbolo oficial
- [x] Atualizar LandingPage para usar símbolo oficial
- [x] Atualizar favicon com novo símbolo
- [x] Verificar botão de logout na sidebar (confirmado presente)
- [x] Configurar redirecionamento após login para /dashboard
- [ ] Criar checkpoint final
