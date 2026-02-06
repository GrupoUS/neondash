# Pesquisa: UX/UI Best Practices para Dashboards Médicos e Prontuários

## Data da Pesquisa
06 de Fevereiro de 2026

## Principais Padrões de Design Identificados

### 1. Navegação e Arquitetura de Informação
**Impacto: CRÍTICO**

#### Boas Práticas:
- **Navegação consistente**: Usar padrões de navegação familiares e consistentes em todas as páginas
- **Hierarquia clara**: Estrutura de navegação com níveis bem definidos
- **Breadcrumbs**: Para contexto de localização do usuário
- **Indicadores visuais**: Mostrar claramente quais itens de menu têm submenus
- **Tabs organizadas**: Permitir reorganização de tabs abertas
- **Retorno intuitivo**: Botão de voltar sempre visível e consistente

#### Anti-Padrões (evitar):
- Múltiplos estilos de navegação na mesma página
- Tabs que abrem em ordem aleatória
- Menus dropdown sem indicadores visuais
- Navegação que muda comportamento entre páginas

### 2. Layout e Espaçamento
**Impacto: ALTO**

#### Boas Práticas:
- **Sistema de espaçamento consistente**: Definir escala de padding/margin (ex: 4px, 8px, 16px, 24px, 32px)
- **Alinhamento preciso**: Elementos alinhados em grid consistente
- **Respiração visual**: Espaço suficiente entre elementos para reduzir carga cognitiva
- **Cards bem definidos**: Bordas, sombras e espaçamento interno consistentes
- **Responsive design**: Adaptar layout para diferentes resoluções

#### Anti-Padrões (evitar):
- Elementos que "quase se tocam"
- Tamanhos de campo inconsistentes
- Alinhamento misto (centro + esquerda na mesma seção)
- Padding/margin aleatórios

### 3. Visualização de Dados do Paciente
**Impacto: CRÍTICO**

#### Padrões Recomendados:

**Timeline/Cronologia:**
- Visualização cronológica de eventos médicos
- Eventos chave destacados (consultas, procedimentos, resultados)
- Filtros por tipo de evento e período
- Zoom in/out para diferentes escalas de tempo

**Cards de Informação:**
- Informações pessoais
- Informações de contato
- Informações médicas (alergias, condições, medicamentos)
- Estatísticas e atividade recente

**Tabs de Conteúdo:**
- Overview (visão geral)
- History (histórico médico)
- Appointments (consultas)
- Documents (documentos)
- Photos (fotos antes/depois)

### 4. Tabelas e Listas
**Impacto: ALTO**

#### Boas Práticas:
- **Paginação clara**: Controles de página visíveis e intuitivos
- **Ordenação**: Colunas ordenáveis com indicadores visuais
- **Filtros**: Filtros avançados acessíveis mas não intrusivos
- **Ações rápidas**: Botões de ação em cada linha (view, edit, delete)
- **Estados visuais**: Hover, selected, disabled claramente diferenciados
- **Densidade ajustável**: Opção de visualização compacta/confortável

### 5. Formulários e Entrada de Dados
**Impacto: ALTO**

#### Boas Práticas:
- **Labels claros**: Sempre com atributo "for" associado ao input
- **Validação inline**: Feedback imediato sem precisar submeter
- **Mensagens de erro**: Próximas ao campo com problema
- **Campos obrigatórios**: Indicados claramente com asterisco
- **Máscaras de input**: Para CPF, telefone, data, etc.
- **Autocomplete**: Para campos com opções conhecidas
- **Tamanho consistente**: Campos com largura proporcional ao conteúdo esperado

#### Anti-Padrões (evitar):
- Campos que mudam de tamanho ao clicar
- Botões com tamanho baseado no campo adjacente
- Muitos tamanhos diferentes de campo na mesma tela
- Botões de ação com estilo inconsistente

### 6. Cores e Hierarquia Visual
**Impacto: MÉDIO-ALTO**

#### Boas Práticas:
- **Paleta definida**: Primary, secondary, accent, neutral, semantic (success, warning, error, info)
- **Contraste adequado**: Mínimo 4.5:1 para texto normal (WCAG AA)
- **Cores semânticas**: Verde (sucesso), amarelo (aviso), vermelho (erro), azul (info)
- **Uso consistente**: Mesmas cores para mesmas ações/estados em todo o sistema
- **Modo claro/escuro**: Suporte para preferência do usuário

#### Para Clínicas de Estética (sugestão):
- **Primary**: Tons sofisticados (azul profundo, verde esmeralda, roxo elegante)
- **Secondary**: Tons complementares suaves
- **Accent**: Dourado/rose gold para destaques premium
- **Neutral**: Cinzas quentes para backgrounds

### 7. Tipografia
**Impacto: MÉDIO**

#### Boas Práticas:
- **Escala tipográfica**: Definir tamanhos (12px, 14px, 16px, 18px, 24px, 32px, 48px)
- **Hierarquia clara**: H1 > H2 > H3 > Body > Caption
- **Line-height adequado**: 1.5-1.75 para texto corpo
- **Comprimento de linha**: 65-75 caracteres por linha
- **Font pairing**: Máximo 2 famílias tipográficas (heading + body)
- **Peso variado**: Regular, medium, semibold, bold para hierarquia

### 8. Componentes Interativos
**Impacto: ALTO**

#### Boas Práticas:

**Botões:**
- **Hierarquia**: Primary, secondary, tertiary, ghost
- **Estados**: Default, hover, active, disabled, loading
- **Tamanho de toque**: Mínimo 44x44px (mobile)
- **Cursor pointer**: Sempre em elementos clicáveis
- **Loading state**: Desabilitar durante operações assíncronas

**Modals/Dialogs:**
- **Overlay escuro**: Para focar atenção
- **Escape para fechar**: Sempre permitir ESC ou clique fora
- **Ações claras**: Botões de confirmação/cancelamento bem posicionados
- **Conteúdo focado**: Não sobrecarregar com informação

**Dropdowns:**
- **Indicador visual**: Seta para baixo
- **Estados claros**: Aberto vs fechado
- **Scroll interno**: Se muitas opções
- **Busca integrada**: Para listas longas

### 9. Fotos Antes/Depois (Específico para Estética)
**Impacto: CRÍTICO**

#### Padrões Recomendados:

**Captura:**
- Interface de câmera integrada (mobile + desktop)
- Guias de posicionamento para consistência
- Iluminação e ângulo padronizados
- Metadata automática (data, procedimento, profissional)

**Visualização:**
- Comparação lado a lado (slider)
- Zoom sincronizado
- Anotações e marcações
- Timeline de evolução (múltiplas fotos ao longo do tempo)

**Organização:**
- Agrupamento por procedimento
- Filtros por data, profissional, tipo
- Tags customizáveis
- Galeria privada do paciente

**Compartilhamento:**
- Controle de privacidade granular
- Geração de links temporários
- Watermark automático (opcional)
- Consentimento documentado

### 10. Acessibilidade (WCAG 2.1 AA+)
**Impacto: CRÍTICO**

#### Requisitos Obrigatórios:
- **Contraste de cores**: Mínimo 4.5:1 para texto normal
- **Focus states**: Anéis de foco visíveis em elementos interativos
- **Alt text**: Texto alternativo para imagens significativas
- **ARIA labels**: Para botões apenas com ícones
- **Navegação por teclado**: Tab order segue ordem visual
- **Labels de formulário**: Sempre usar label com atributo "for"
- **Tamanho de toque**: Mínimo 44x44px
- **Mensagens de erro**: Claras e próximas ao problema
- **Screen reader**: Conteúdo semântico e anúncios apropriados

### 11. Performance e Loading States
**Impacto: ALTO**

#### Boas Práticas:
- **Skeleton screens**: Mostrar estrutura enquanto carrega
- **Spinners**: Para operações curtas (< 3s)
- **Progress bars**: Para operações longas com progresso conhecido
- **Lazy loading**: Carregar imagens sob demanda
- **Optimistic UI**: Mostrar resultado antes da confirmação do servidor
- **Error boundaries**: Capturar erros sem quebrar toda a interface

### 12. Customização e Personalização
**Impacto: MÉDIO**

#### Funcionalidades Desejáveis:
- **Temas**: Múltiplas opções de cores/estilos
- **Densidade**: Layout compacto vs confortável
- **Tabs padrão**: Escolher quais tabs abrir por padrão
- **Widgets**: Arrastar e soltar cards no dashboard
- **Favoritos**: Marcar ações/páginas frequentes

### 13. Assinatura Digital
**Impacto: MÉDIO-ALTO**

#### Implementação:
- **Desenho com mouse/touch**: Canvas HTML5
- **Suavização**: Aplicar smoothing para aparência profissional
- **Salvar como imagem**: PNG transparente
- **Aplicar em documentos**: Integração com PDFs
- **Histórico**: Manter registro de assinaturas aplicadas

### 14. Exportação e Relatórios
**Impacto: MÉDIO**

#### Formatos Suportados:
- **PDF**: Para impressão e compartilhamento
- **Excel/CSV**: Para análise de dados
- **JSON**: Para integração com outros sistemas
- **Imagens**: Para fotos e gráficos

#### Opções de Exportação:
- **Seleção de dados**: Escolher o que exportar
- **Período**: Filtrar por data
- **Formato customizável**: Templates de relatório
- **Agendamento**: Relatórios automáticos periódicos

## Recomendações Específicas para NeonPro

### Página de Pacientes - Estrutura Sugerida

#### Seção 1: Header com Informações Principais
- Foto do paciente (avatar)
- Nome completo
- Idade e data de nascimento
- Status (ativo/inativo)
- Badges (VIP, alergias, observações importantes)
- Ações rápidas (editar, agendar, mensagem, chat IA)

#### Seção 2: Tabs de Navegação
1. **Overview**: Visão geral com cards de informações principais
2. **Prontuário**: Histórico médico completo e cronológico
3. **Fotos**: Galeria de fotos antes/depois com comparações
4. **Documentos**: Consentimentos, exames, prescrições
5. **Financeiro**: Pagamentos, pacotes, pendências
6. **Comunicação**: Histórico de mensagens e interações

#### Seção 3: Cards de Informação (Overview)
- **Informações Pessoais**: Nome, CPF, contato, endereço
- **Informações Médicas**: Alergias, condições, medicamentos
- **Estatísticas**: Total de consultas, última visita, próxima consulta
- **Procedimentos Recentes**: Lista dos últimos 5 procedimentos
- **Chat IA Widget**: Integrado na lateral direita ou como floating button

#### Seção 4: Timeline de Procedimentos
- Visualização cronológica de todos os procedimentos
- Cada item mostra: data, procedimento, profissional, fotos (se houver)
- Expandir para ver detalhes completos
- Filtros por tipo de procedimento, profissional, período

#### Seção 5: Galeria de Fotos Antes/Depois
- Grid de thumbnails organizados por procedimento
- Clique para abrir visualizador com comparação lado a lado
- Slider para comparar antes/depois
- Botão "Simular Resultado" que abre chat IA para gerar simulação

### Chat IA Widget - Integração

#### Posicionamento:
- Floating button no canto inferior direito
- Ou painel lateral expansível
- Contexto automático do paciente atual

#### Funcionalidades:
1. **Análise de Fotos**: Upload de foto para análise
2. **Simulação de Resultados**: Gerar foto "depois" com IA
3. **Sugestões de Tratamento**: Baseado no histórico
4. **Perguntas Frequentes**: Sobre procedimentos
5. **Documentação Assistida**: Ajudar a preencher prontuário

#### Prompts Prontos (Sugestões para Dono da Clínica):

**Para Simulação de Preenchimento Labial:**
```
"Analise esta foto do paciente e simule como ficaria com preenchimento labial sutil, mantendo naturalidade e proporções harmoniosas."
```

**Para Análise de Harmonização Facial:**
```
"Avalie a simetria facial deste paciente e sugira áreas que poderiam se beneficiar de harmonização, com foco em resultados naturais."
```

**Para Simulação de Botox:**
```
"Simule o resultado de aplicação de botox nas linhas de expressão desta foto, mostrando suavização natural sem perda de expressividade."
```

**Para Evolução de Tratamento:**
```
"Compare as fotos antes e depois deste procedimento e gere um relatório de evolução destacando as melhorias alcançadas."
```

**Para Sugestão de Próximos Passos:**
```
"Baseado no histórico de procedimentos deste paciente, sugira tratamentos complementares que poderiam potencializar os resultados."
```

## Fontes
- UX Planet: "Designing Medical Data Dashboards: UX patterns & Benchmarking"
- Fuselab Creative: "Healthcare Dashboard Design Best Practices"
- Sidekick Interactive: "UX/UI Best Practices for Healthcare Analytics Dashboards"
- AHRQ: "Electronic Health Record Usability: Interface Design Considerations"
- EHRA: "Electronic Health Record Design Patterns for Patient Safety"
