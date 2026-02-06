
# Plano de Implementação: Página de Pacientes v2 (NeonPro)

**Documento:** `.opencode/specs/pacientes-v2/spec.md`  
**Complexidade:** L5 - Feature complexa com integração de IA

---

## 1. Requisitos e Objetivos

Implementar uma nova página de gestão de pacientes (`/pacientes-v2/{patientId}`) focada em um prontuário completo, visualmente rico e com funcionalidades avançadas, incluindo:

- **Prontuário Cronológico (Timeline):** Visualização clara de todo o histórico do paciente.
- **Galeria de Fotos Antes/Depois:** Ferramenta de comparação com slider e integração com IA.
- **Gestão de Documentos:** Upload e visualização de consentimentos, exames, etc.
- **Chat Widget de IA:** Para análise de fotos, simulação de resultados (Nano Banana) e suporte à decisão.
- **UI/UX Aprimorada:** Baseado no Design System `design-system-neonpro-patients.md`.

## 2. Arquitetura e Estrutura de Arquivos

- **Nova Rota:** `apps/web/src/routes/pacientes-v2/$patientId.tsx`
- **Componentes Reutilizáveis:** `apps/web/src/components/pacientes-v2/`
- **Hooks de Dados:** `apps/web/src/hooks/usePatientV2.ts` (e outros específicos)
- **Tipos de Dados:** `apps/web/src/types/patient-v2.ts`

## 3. Plano de Implementação (Atomic Tasks)

---

### **FASE 1: Foundation & Setup**

O objetivo desta fase é configurar a estrutura básica da nova página, incluindo a rota, os tipos de dados e o layout principal, garantindo que a base para as funcionalidades futuras seja sólida.

| ID | Tarefa | Prioridade | Dependências | Validação | Rollback |
|---|---|---|---|---|---|
| **AT-101** | **Criar Nova Rota e Layout Principal** | Crítica | - | Acessar `/pacientes-v2/teste` e ver o layout básico com header e tabs. | Deletar o diretório `pacientes-v2`. |
| **AT-102** | **Definir Tipos de Dados (TypeScript)** | Crítica | - | Arquivo `patient-v2.ts` criado com todas as interfaces necessárias. | Deletar o arquivo `patient-v2.ts`. |
| **AT-103** | **Criar Hook de Dados `usePatientV2`** | Alta | AT-102 | Hook retorna dados mockados do paciente com a nova estrutura de tipos. | Deletar o arquivo `usePatientV2.ts`. |

---

### **FASE 2: Core Patient Profile**

Nesta fase, construiremos os componentes centrais que exibem as informações essenciais do paciente, como o cabeçalho de perfil e os cards de informações detalhadas.

| ID | Tarefa | Prioridade | Dependências | Validação | Rollback |
|---|---|---|---|---|---|
| **AT-201** | **Componente: `PatientHeaderV2`** | Crítica | AT-101, AT-103 | Header exibe foto, nome, idade, status e badges do paciente. | Comentar o componente `PatientHeaderV2` na rota. |
| **AT-202** | **Componente: `PatientInfoCard`** | Alta | AT-101, AT-103 | Card exibe informações pessoais e de contato do paciente. | Comentar o componente `PatientInfoCard` na rota. |
| **AT-203** | **Componente: `PatientMedicalCard`** | Alta | AT-101, AT-103 | Card exibe alergias, condições crônicas e medicamentos. | Comentar o componente `PatientMedicalCard` na rota. |
| **AT-204** | **Componente: `PatientStatsCard`** | Média | AT-101, AT-103 | Card exibe estatísticas como total de consultas e última visita. | Comentar o componente `PatientStatsCard` na rota. |

---

### **FASE 3: Advanced Prontuário Features**

Foco na implementação das funcionalidades avançadas do prontuário, que são o coração da nova página: a timeline, a galeria de fotos e a gestão de documentos.

| ID | Tarefa | Prioridade | Dependências | Validação | Rollback |
|---|---|---|---|---|---|
| **AT-301** | **Componente: `PatientTimeline`** | Crítica | AT-101, AT-103 | Timeline exibe o histórico de procedimentos de forma cronológica. | Comentar o componente `PatientTimeline` na tab de prontuário. |
| **AT-302** | **Componente: `PhotoGallery`** | Crítica | AT-101 | Galeria exibe thumbnails de fotos antes/depois. | Comentar o componente `PhotoGallery` na tab de fotos. |
| **AT-303** | **Componente: `PhotoComparisonView`** | Alta | AT-302 | Clicar em uma foto abre um modal com slider para comparação. | Desabilitar o evento de clique no thumbnail da galeria. |
| **AT-304** | **Componente: `DocumentManager`** | Alta | AT-101 | Permite upload e listagem de documentos (PDFs, imagens). | Comentar o componente `DocumentManager` na tab de documentos. |

---

### **FASE 4: AI Chat Widget Integration**

Integração do chat de IA, permitindo a análise de imagens e a simulação de resultados, agregando um diferencial tecnológico e de alto valor para o profissional.

| ID | Tarefa | Prioridade | Dependências | Validação | Rollback |
|---|---|---|---|---|---|
| **AT-401** | **Componente: `AIChatWidget` (Floating)** | Crítica | AT-101 | Botão flutuante do chat aparece na página e abre o painel de chat. | Comentar o componente `AIChatWidget` na rota. |
| **AT-402** | **Integração: Upload de Foto para IA** | Alta | AT-302, AT-401 | Adicionar botão "Analisar com IA" na galeria que envia a foto para o chat. | Remover o botão "Analisar com IA". |
| **AT-403** | **Feature: Simulação com Nano Banana** | Crítica | AT-402 | Chat IA recebe a foto e um prompt, e retorna uma imagem simulada. | Desabilitar a funcionalidade de geração de imagem no backend do chat. |
| **AT-404** | **Componente: `PromptSuggestions`** | Média | AT-401 | Exibir sugestões de prompts prontos para o usuário no chat. | Ocultar o componente de sugestões de prompt. |

---

### **FASE 5: Polish & Validation**

Etapa final para refinar a experiência do usuário, garantir a responsividade, testar todas as funcionalidades e preparar a feature para o lançamento.

| ID | Tarefa | Prioridade | Dependências | Validação | Rollback |
|---|---|---|---|---|---|
| **AT-501** | **Refinamento de UI/UX e Responsividade** | Alta | Todas | A página está visualmente polida e funciona perfeitamente em mobile, tablet e desktop. | Reverter commits de CSS e layout. |
| **AT-502** | **Implementar Loading & Error States** | Alta | Todas | Skeleton loaders e mensagens de erro amigáveis aparecem em todas as operações assíncronas. | Substituir os componentes de loading/error por `null`. |
| **AT-503** | **Testes End-to-End (E2E)** | Crítica | Todas | Criar testes automatizados que simulam o fluxo completo do usuário. | Desativar os novos testes no pipeline de CI. |
| **AT-504** | **Documentação e Revisão Final** | Média | Todas | Documentar os novos componentes e hooks. Revisar todo o código. | Reverter commits de documentação. |

