# PRP: Aprimoramento Completo da Página de Pacientes — NeonDash

## Metadata

```yaml
complexity: "L8 — Arquitetura de módulo completo com schema, routers, hooks, componentes multi-step, exportação, busca avançada e integração com sistema existente"
estimated_time: "40-60 horas de desenvolvimento"
parallel_safe: false (dependências sequenciais entre schema → router → hooks → componentes)
mode: CONSERVATIVE (plano apenas, sem implementação)
```

## Objective

```yaml
task: "IMPLEMENTAR módulo completo de gestão de pacientes no NeonDash, portando todas as features do NeonPro e adicionando melhorias específicas para clínicas de estética"
context: "NeonDash (React 19 + Vite + tRPC + Drizzle + Neon PostgreSQL + Clerk Auth + shadcn/ui + Framer Motion), dark-mode-first, design system luxury/gold"
why_this_matters: "Clínicas de estética precisam de gestão completa de pacientes com prontuários, histórico de procedimentos, fotos antes/depois, consentimento LGPD e rastreamento de tratamentos para operar com excelência"
```

## Environment

```yaml
runtime: "Bun 1.x"
framework: "React 19 + Vite"
database: "Neon PostgreSQL (Drizzle ORM)"
auth: "Clerk"
api: "tRPC"
ui: "shadcn/ui (new-york style) + Framer Motion + Lucide Icons"
state: "TanStack React Query (via tRPC)"
routing: "Wouter"
testing: "Vitest"
fonts: "Manrope (já instalada)"
theme: "Dark luxury — fundo escuro, acentos dourados (#b45309), azul petróleo (#0f4c75)"
```

---

## Research Summary

### Findings Table

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | NeonPro possui wizard de 6 etapas para cadastro de pacientes (Informações Básicas, Contato/Endereço, Documentos, Info Médicas, Documentos Médicos, Consentimento LGPD) | 5 | `neonpro/apps/web/src/components/patients/PatientRegistrationWizard.tsx` | CRÍTICO |
| 2 | NeonPro usa Supabase como backend; NeonDash usa tRPC + Drizzle + Neon PostgreSQL — necessário reescrever toda a camada de dados | 5 | `neonpro/apps/web/src/hooks/usePatients.ts` vs `neondash/server/routers.ts` | CRÍTICO |
| 3 | NeonDash **não possui** tabela de pacientes no schema atual — precisa criar do zero | 5 | `neondash/drizzle/schema.ts` (grep "patient" = vazio) | CRÍTICO |
| 4 | NeonDash já possui 70+ componentes shadcn/ui incluindo animated-tabs, animated-progress, neon-card, bento-grid, celebration-effect | 5 | `neondash/client/src/components/ui/` | ALTO |
| 5 | NeonDash usa Framer Motion com sistema de animation-variants (fadeIn, slideUp, staggerContainer) | 5 | `neondash/client/src/lib/animation-variants.ts` | ALTO |
| 6 | NeonPro tem sistema de exportação CSV/PDF com encoding UTF-8 BOM e formatação brasileira | 5 | `neonpro/apps/web/src/hooks/useDataExport.ts` | MÉDIO |
| 7 | NeonPro tem busca avançada com validação de CPF/telefone brasileiro e métricas de performance | 5 | `neonpro/apps/web/src/components/patients/AdvancedSearchDialog.tsx` | MÉDIO |
| 8 | NeonPro tem sistema de histórico médico com tipos: consultation, treatment, procedure, follow_up, lab_result, imaging, prescription | 5 | `neonpro/apps/web/src/types/patient-history.ts` | ALTO |
| 9 | NeonPro tem sistema de plano de tratamento com fases, progresso e métricas de sucesso | 5 | `neonpro/apps/web/src/types/patient-history.ts` (TreatmentPlan) | ALTO |
| 10 | NeonPro tem sistema de notas de progresso com fotos antes/depois | 5 | `neonpro/apps/web/src/types/patient-history.ts` (ProgressNote) | ALTO |
| 11 | NeonDash usa DashboardLayout com sidebar Aceternity-style e proteção de rotas via Clerk | 5 | `neondash/client/src/components/DashboardLayout.tsx` | ALTO |
| 12 | NeonDash routing usa Wouter (não React Router) com lazy loading | 5 | `neondash/client/src/App.tsx` | MÉDIO |
| 13 | NeonPro tem PatientDetailView com tabs (Informações, Dados Médicos, Consultas, Consentimentos) e quick stats cards | 5 | `neonpro/apps/web/src/components/patients/PatientDetailView.tsx` | ALTO |
| 14 | NeonPro tem sistema de upload de documentos com drag-and-drop, categorias e validação de tipos | 5 | `neonpro/apps/web/src/components/patients/FileUploadIntegration.tsx` | MÉDIO |
| 15 | NeonDash já possui integração S3 (AWS SDK) e sistema de upload configurado | 5 | `neondash/package.json` (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner) | ALTO |

### Knowledge Gaps

1. **Estrutura exata de permissões**: Como o NeonDash gerencia permissões admin vs mentorado para acesso a pacientes
2. **Relação mentorado-paciente**: Um paciente pertence a um mentorado (clínica) ou ao sistema global
3. **Limites de storage S3**: Configuração atual de buckets e limites para upload de documentos médicos
4. **Integração com Agenda**: Como vincular pacientes aos eventos do calendário já existente

### Assumptions to Validate

1. Cada mentorado (clínica) terá seus próprios pacientes isolados (multi-tenant por mentorado)
2. O upload de documentos usará o S3 já configurado no NeonDash
3. A página de pacientes será acessível tanto para admins quanto para mentorados
4. O design seguirá o tema dark luxury existente com acentos dourados

### Edge Cases

1. Paciente com CPF duplicado entre mentorados diferentes
2. Upload de arquivo excedendo limite de tamanho
3. Busca com caracteres especiais ou acentos
4. Exportação CSV/PDF com dados contendo vírgulas ou aspas
5. Paciente inativo tentando ser agendado
6. Consentimento LGPD expirado ou revogado
7. Fotos antes/depois com formatos diferentes (HEIC de iPhone)
8. Paciente sem dados obrigatórios tentando avançar no wizard
9. Múltiplos uploads simultâneos de documentos
10. Timezone inconsistente em datas de nascimento

---

## Relevant Files

### Must Read (NeonDash — Arquivos Existentes)

| Path | Relevance |
|------|-----------|
| `neondash/drizzle/schema.ts` | Schema atual — adicionar tabelas de pacientes aqui |
| `neondash/drizzle/relations.ts` | Relações Drizzle — adicionar relações de pacientes |
| `neondash/server/routers.ts` | Router principal — registrar novo patientsRouter |
| `neondash/server/_core/trpc.ts` | Configuração tRPC — entender procedures protegidas |
| `neondash/client/src/App.tsx` | Routing — adicionar rota /pacientes |
| `neondash/client/src/components/DashboardLayout.tsx` | Layout — adicionar link na sidebar |
| `neondash/client/src/lib/animation-variants.ts` | Variantes de animação — reutilizar |
| `neondash/client/src/lib/trpc.ts` | Client tRPC — já configurado |
| `neondash/client/src/index.css` | Tema/CSS — variáveis de cor e design tokens |

### Must Read (NeonPro — Referência de Features)

| Path | Relevance |
|------|-----------|
| `neonpro/apps/web/src/routes/patients.tsx` | Página principal com stats cards e layout |
| `neonpro/apps/web/src/components/patients/PatientRegistrationWizard.tsx` | Wizard de 6 etapas — modelo principal |
| `neonpro/apps/web/src/components/patients/PatientDataTable.tsx` | DataTable com filtros, seleção, ações |
| `neonpro/apps/web/src/components/patients/PatientDetailView.tsx` | Visualização detalhada com tabs |
| `neonpro/apps/web/src/components/patients/AdvancedSearchDialog.tsx` | Busca avançada com validação BR |
| `neonpro/apps/web/src/components/patients/FileUploadIntegration.tsx` | Upload de documentos médicos |
| `neonpro/apps/web/src/hooks/usePatients.ts` | Hooks CRUD + real-time + cache |
| `neonpro/apps/web/src/hooks/useDataExport.ts` | Exportação CSV/PDF |
| `neonpro/apps/web/src/types/patient-history.ts` | Tipos de histórico médico completo |

---

## Existing Patterns (NeonDash)

```yaml
naming: "camelCase para variáveis/funções, PascalCase para componentes, snake_case para colunas DB"
file_structure: "pages/ para rotas, components/ para UI, server/ para routers tRPC, drizzle/ para schema"
error_handling: "try/catch com toast.error() via Sonner, ErrorBoundary global"
state_management: "tRPC + TanStack Query (server state), useState/useReducer (local state)"
animations: "Framer Motion com animation-variants.ts, prefers-reduced-motion respeitado"
forms: "react-hook-form + @hookform/resolvers + zod"
data_tables: "@tanstack/react-table (já no package.json)"
icons: "Lucide React"
```

---

## Constraints

```yaml
non_negotiable:
  - "Manter tema dark luxury existente (fundo escuro, acentos dourados)"
  - "Usar tRPC + Drizzle (NÃO Supabase como no NeonPro)"
  - "Conformidade LGPD em todos os dados de pacientes"
  - "Multi-tenant: pacientes isolados por mentorado"
  - "Responsivo: funcionar em 375px até 1440px"
  - "Acessibilidade: WCAG 2.1 AA mínimo"
  - "Usar componentes shadcn/ui existentes no projeto"

preferences:
  - "Animações sutis com Framer Motion"
  - "Lazy loading para página de pacientes"
  - "Skeleton loading states"
  - "Validação brasileira (CPF, telefone, CEP)"
```

---

## Chain of Thought

### Research

- **Codebase patterns**: NeonDash segue padrão tRPC router → Drizzle query → React Query cache. Leads/CRM é o módulo mais similar ao que precisamos construir.
- **Docs consultados**: shadcn/ui new-york style, Drizzle ORM pgTable, tRPC procedures
- **Security**: LGPD exige consentimento explícito, soft-delete, auditoria de acesso, direito ao esquecimento
- **Edge cases**: 10 identificados acima

### Analyze

- **Core requirement**: Módulo completo de pacientes com CRUD, wizard multi-step, histórico médico, documentos, exportação e busca avançada
- **Technical constraints**: tRPC (não Supabase), Drizzle (não raw SQL), Clerk auth (não custom auth)
- **Integration points**: DashboardLayout (sidebar), Agenda (vincular pacientes), S3 (documentos), Clerk (auth/permissions)

### Think

```yaml
tree_of_thoughts:
  approach_a:
    description: "Portar código NeonPro diretamente, adaptando Supabase → tRPC/Drizzle"
    pros: "Rápido, features já testadas"
    cons: "Código legado, padrões diferentes, pode não se integrar bem"
    score: 6/10
  approach_b:
    description: "Reescrever do zero seguindo padrões NeonDash, usando NeonPro como referência de features"
    pros: "Código limpo, padrões consistentes, melhor integração, oportunidade de melhorar"
    cons: "Mais tempo, risco de esquecer features"
    score: 9/10
  selected: "approach_b"
  rationale: "Reescrever seguindo os padrões do NeonDash garante consistência, manutenibilidade e permite incorporar melhorias específicas para estética que o NeonPro não tem"
```

---

## Arquitetura Proposta

### Estrutura de Arquivos a Criar

```
neondash/
├── drizzle/
│   └── schema.ts                          # MODIFICAR — adicionar tabelas de pacientes
│   └── relations.ts                       # MODIFICAR — adicionar relações
├── server/
│   ├── patientsRouter.ts                  # CRIAR — tRPC router completo
│   ├── patientDocumentsRouter.ts          # CRIAR — router de documentos/upload
│   ├── patientHistoryRouter.ts            # CRIAR — router de histórico médico
│   └── routers.ts                         # MODIFICAR — registrar novos routers
├── client/src/
│   ├── pages/
│   │   └── pacientes/
│   │       ├── PacientesPage.tsx           # CRIAR — página principal
│   │       └── PacienteDetailPage.tsx      # CRIAR — página de detalhe
│   ├── components/
│   │   └── pacientes/
│   │       ├── PatientStatsCards.tsx        # CRIAR — cards de estatísticas
│   │       ├── PatientDataTable.tsx         # CRIAR — tabela com filtros
│   │       ├── PatientRegistrationWizard.tsx # CRIAR — wizard 7 etapas
│   │       ├── PatientDetailView.tsx        # CRIAR — visualização com tabs
│   │       ├── PatientAdvancedSearch.tsx    # CRIAR — busca avançada
│   │       ├── PatientExport.tsx            # CRIAR — exportação CSV/PDF
│   │       ├── PatientDocumentUpload.tsx    # CRIAR — upload S3
│   │       ├── PatientTimeline.tsx          # CRIAR — timeline procedimentos
│   │       ├── PatientBeforeAfter.tsx       # CRIAR — galeria antes/depois
│   │       ├── PatientConsentManager.tsx    # CRIAR — gestão LGPD
│   │       ├── PatientTreatmentPlan.tsx     # CRIAR — plano de tratamento
│   │       ├── PatientEditModal.tsx         # CRIAR — modal de edição
│   │       └── PatientDeleteDialog.tsx      # CRIAR — dialog de exclusão
│   ├── hooks/
│   │   ├── usePatients.ts                  # CRIAR — hooks tRPC
│   │   ├── usePatientExport.ts             # CRIAR — hook de exportação
│   │   └── usePatientSearch.ts             # CRIAR — hook de busca
│   ├── lib/
│   │   └── patient-validators.ts           # CRIAR — validações BR
│   └── App.tsx                             # MODIFICAR — adicionar rotas
└── shared/
    └── patient-types.ts                    # CRIAR — tipos compartilhados
```

### Schema de Banco de Dados

```sql
-- Tabela principal de pacientes
patients (
  id SERIAL PRIMARY KEY,
  mentorado_id INTEGER NOT NULL REFERENCES mentorados(id),
  -- Informações Básicas
  nome_completo VARCHAR(255) NOT NULL,
  nome_preferido VARCHAR(100),
  data_nascimento DATE,
  genero VARCHAR(20),
  foto_url TEXT,
  -- Contato
  telefone_principal VARCHAR(20),
  telefone_secundario VARCHAR(20),
  email VARCHAR(320),
  metodo_contato_preferido VARCHAR(20) DEFAULT 'whatsapp',
  -- Endereço
  cep VARCHAR(10),
  logradouro TEXT,
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  -- Documentos
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  convenio VARCHAR(100),
  numero_convenio VARCHAR(50),
  -- Informações Médicas
  tipo_sanguineo VARCHAR(5),
  alergias TEXT[],
  condicoes_cronicas TEXT[],
  medicamentos_em_uso TEXT[],
  -- Estética Específico
  tipo_pele VARCHAR(50),  -- Fitzpatrick I-VI
  fototipo VARCHAR(20),
  queixas_principais TEXT[],
  historico_procedimentos_anteriores TEXT,
  -- Contato de Emergência
  contato_emergencia_nome VARCHAR(255),
  contato_emergencia_telefone VARCHAR(20),
  contato_emergencia_relacao VARCHAR(50),
  -- LGPD
  lgpd_consentimento BOOLEAN DEFAULT FALSE,
  lgpd_data_consentimento TIMESTAMP,
  lgpd_consentimento_marketing BOOLEAN DEFAULT FALSE,
  lgpd_consentimento_fotos BOOLEAN DEFAULT FALSE,
  -- Status
  status VARCHAR(20) DEFAULT 'ativo',
  observacoes TEXT,
  numero_prontuario VARCHAR(20),
  -- Métricas
  total_consultas INTEGER DEFAULT 0,
  total_faltas INTEGER DEFAULT 0,
  ultima_visita TIMESTAMP,
  proxima_consulta TIMESTAMP,
  valor_total_gasto NUMERIC(12,2) DEFAULT 0,
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
)

-- Documentos do paciente (S3)
patient_documents (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  categoria VARCHAR(30) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho INTEGER,
  s3_key TEXT NOT NULL,
  s3_url TEXT,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
)

-- Histórico de procedimentos/consultas
patient_procedures (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  mentorado_id INTEGER NOT NULL REFERENCES mentorados(id),
  tipo VARCHAR(30) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  notas_clinicas TEXT,
  diagnostico TEXT[],
  area_tratada TEXT[],
  produtos_utilizados TEXT[],
  tecnica_utilizada VARCHAR(255),
  peso NUMERIC(5,2),
  altura NUMERIC(5,2),
  pressao_arterial VARCHAR(10),
  fotos_antes TEXT[],
  fotos_depois TEXT[],
  status VARCHAR(20) DEFAULT 'realizado',
  data_procedimento TIMESTAMP NOT NULL,
  duracao_minutos INTEGER,
  valor NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Planos de tratamento
treatment_plans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  mentorado_id INTEGER NOT NULL REFERENCES mentorados(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  objetivos TEXT[],
  status VARCHAR(20) DEFAULT 'planejado',
  progresso_percentual INTEGER DEFAULT 0,
  sessoes_planejadas INTEGER DEFAULT 0,
  sessoes_realizadas INTEGER DEFAULT 0,
  data_inicio DATE,
  data_prevista_fim DATE,
  data_real_fim DATE,
  valor_total NUMERIC(10,2),
  valor_pago NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Consentimentos LGPD (histórico)
patient_consents (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  consentido BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  documento_s3_key TEXT,
  data_consentimento TIMESTAMP DEFAULT NOW(),
  data_revogacao TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
)
```

---

## Wizard de Cadastro — 7 Etapas (Aprimorado)

O wizard do NeonPro possui 6 etapas. A versão aprimorada para o NeonDash terá **7 etapas**, adicionando uma etapa específica para estética:

| Etapa | Título | Campos | Validação |
|-------|--------|--------|-----------|
| 1 | **Informações Básicas** | Nome completo*, nome preferido, data nascimento*, gênero*, foto (avatar upload) | Nome obrigatório, data válida |
| 2 | **Contato e Endereço** | Telefone principal*, telefone secundário, email, método preferido (WhatsApp/Telefone/Email), CEP (auto-fill via ViaCEP), logradouro, número, complemento, bairro, cidade, estado | Telefone BR válido, email válido, CEP válido |
| 3 | **Documentos** | CPF*, RG, convênio, número do convênio | CPF válido (algoritmo), formato RG |
| 4 | **Informações Médicas** | Tipo sanguíneo, alergias (tags), condições crônicas (tags), medicamentos em uso (tags), contato de emergência (nome, telefone, relação) | Tags dinâmicas |
| 5 | **Perfil Estético** *(NOVO)* | Tipo de pele (Fitzpatrick I-VI), fototipo, queixas principais (tags), histórico de procedimentos anteriores (textarea), expectativas do tratamento | Seleção obrigatória de tipo de pele |
| 6 | **Documentos Médicos** | Upload drag-and-drop de exames, fotos, documentos (categorizado) | Tipos aceitos: PDF, JPG, PNG, HEIC. Max 10MB |
| 7 | **Consentimento LGPD** | Consentimento para uso de dados pessoais*, consentimento para marketing, consentimento para uso de fotos antes/depois, checkbox de termos | Consentimento de dados obrigatório |

---

## Features Específicas para Clínicas de Estética

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Galeria Antes/Depois** | Visualização side-by-side de fotos antes e depois de procedimentos, com slider de comparação | CRÍTICA |
| **Perfil de Pele Fitzpatrick** | Classificação do tipo de pele (I-VI) com recomendações visuais | ALTA |
| **Timeline de Procedimentos** | Linha do tempo visual com todos os procedimentos realizados, com fotos e notas | ALTA |
| **Plano de Tratamento** | Gestão de planos com sessões, progresso visual e financeiro | ALTA |
| **Score de Engajamento** | Indicador visual de engajamento do paciente (frequência, pontualidade, adesão) | MÉDIA |
| **Alertas Inteligentes** | Alertas de alergias, medicamentos incompatíveis, consentimento expirado | MÉDIA |
| **Integração WhatsApp** | Botão direto para WhatsApp do paciente (já existe Z-API no NeonDash) | MÉDIA |
| **Auto-fill CEP** | Preenchimento automático de endereço via API ViaCEP | MÉDIA |
| **Aniversariantes** | Widget de aniversariantes do mês/semana | BAIXA |

---

## Atomic Tasks

### FASE 1: Fundação (Schema + Router + Tipos)

#### AT-001: Criar schema de pacientes no Drizzle

```yaml
id: "AT-001"
title: "Criar tabelas de pacientes, documentos, procedimentos, planos e consentimentos no Drizzle schema"
phase: 1
priority: critical
dependencies: []
parallel_safe: false
files_to_modify:
  - "neondash/drizzle/schema.ts"
  - "neondash/drizzle/relations.ts"
validation: "bun run db:generate && bun run check"
rollback: "git checkout drizzle/schema.ts drizzle/relations.ts"
acceptance_criteria:
  - "5 novas tabelas criadas: patients, patient_documents, patient_procedures, treatment_plans, patient_consents"
  - "Enums criados: status_paciente, tipo_procedimento, tipo_documento, tipo_consentimento, tipo_pele_fitzpatrick"
  - "Índices em mentorado_id, cpf, email, status, created_at"
  - "Foreign keys com ON DELETE CASCADE onde apropriado"
  - "Relações definidas em relations.ts"
  - "Migration gerada sem erros"
```

**Prompt para implementação:**

> Abra `neondash/drizzle/schema.ts` e adicione ao final do arquivo as seguintes tabelas usando o padrão Drizzle existente no projeto (pgTable, pgEnum, index, etc.):
>
> 1. **Enums**: `statusPacienteEnum` (ativo, inativo, pendente), `tipoProcedimentoEnum` (consulta, procedimento, retorno, avaliacao, emergencia), `tipoDocumentoPacienteEnum` (identidade, medico, convenio, consentimento, foto_antes, foto_depois, exame, outro), `tipoConsentimentoEnum` (dados_pessoais, marketing, fotos, procedimento), `tipoPeleFitzpatrickEnum` (I, II, III, IV, V, VI), `statusTratamentoEnum` (planejado, em_andamento, concluido, cancelado, pausado), `statusProcedimentoEnum` (agendado, realizado, cancelado, falta)
>
> 2. **Tabela `patients`**: Seguir o schema SQL definido acima. Usar `serial("id").primaryKey()`, `integer("mentorado_id").notNull().references(() => mentorados.id, { onDelete: "cascade" })`. Campos de array usar `text("alergias").array()`. Adicionar índices em `mentorado_id`, `cpf`, `email`, `status`, `created_at`.
>
> 3. **Tabelas `patient_documents`, `patient_procedures`, `treatment_plans`, `patient_consents`**: FK para patients com CASCADE.
>
> Depois abra `neondash/drizzle/relations.ts` e adicione as relações. Execute `bun run db:generate` para gerar a migration.

---

#### AT-002: Criar tipos compartilhados de pacientes

```yaml
id: "AT-002"
title: "Criar arquivo de tipos TypeScript compartilhados para pacientes"
phase: 1
priority: critical
dependencies: ["AT-001"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/shared/patient-types.ts"
validation: "bun run check"
rollback: "rm shared/patient-types.ts"
acceptance_criteria:
  - "Tipos exportados: Patient, PatientDocument, PatientProcedure, TreatmentPlan, PatientConsent"
  - "Tipos de input: CreatePatientInput, UpdatePatientInput, PatientSearchFilters"
  - "Zod schemas para validação de input"
  - "Validadores brasileiros: validateCPF, validatePhone, formatCPF, formatPhone"
```

**Prompt para implementação:**

> Crie `neondash/shared/patient-types.ts` com Zod schemas para cada etapa do wizard (basicInfoSchema, contactSchema, documentsSchema, medicalSchema, aestheticProfileSchema, consentSchema), tipos inferidos via `z.infer<>`, e funções de validação brasileira: `validateCPF` (algoritmo completo), `validatePhone`, `formatCPF`, `formatPhone`, `formatCEP`.

---

#### AT-003: Criar tRPC router de pacientes

```yaml
id: "AT-003"
title: "Criar patientsRouter com todas as procedures CRUD + busca + stats"
phase: 1
priority: critical
dependencies: ["AT-001", "AT-002"]
parallel_safe: false
files_to_create:
  - "neondash/server/patientsRouter.ts"
files_to_modify:
  - "neondash/server/routers.ts"
validation: "bun run check && bun run dev (verificar que o server inicia)"
rollback: "rm server/patientsRouter.ts && git checkout server/routers.ts"
acceptance_criteria:
  - "Procedures: list, getById, create, update, delete (soft), bulkDelete, search, getStats, advancedSearch"
  - "Todas as procedures protegidas com autenticação Clerk"
  - "Filtro por mentorado_id automático (multi-tenant)"
  - "Paginação server-side com offset"
  - "Ordenação por qualquer coluna"
  - "Router registrado em routers.ts"
```

**Prompt para implementação:**

> Crie `neondash/server/patientsRouter.ts` seguindo o padrão dos routers existentes (ex: `leadsRouter.ts`, `mentoradosRouter.ts`). Use `protectedProcedure` do tRPC. Procedures: `list` (paginação + filtros), `getById` (paciente completo com documentos e últimos procedimentos), `create` (validação Zod, gera prontuário NEON-YYYYMMDD-XXXX), `update`, `delete` (soft), `bulkDelete`, `search` (full-text), `getStats` (contadores), `advancedSearch` (filtros combinados). Registre em `server/routers.ts`.

---

#### AT-004: Criar tRPC router de documentos de pacientes

```yaml
id: "AT-004"
title: "Criar patientDocumentsRouter com upload S3 e gestão de documentos"
phase: 1
priority: high
dependencies: ["AT-001"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/server/patientDocumentsRouter.ts"
files_to_modify:
  - "neondash/server/routers.ts"
validation: "bun run check"
rollback: "rm server/patientDocumentsRouter.ts"
acceptance_criteria:
  - "Procedures: getPresignedUrl, listByPatient, delete, updateCategory"
  - "Presigned URL para upload direto ao S3"
  - "Categorização de documentos"
  - "Validação de tipo de arquivo e tamanho máximo (10MB)"
```

---

#### AT-005: Criar tRPC router de histórico/procedimentos

```yaml
id: "AT-005"
title: "Criar patientHistoryRouter com CRUD de procedimentos e planos de tratamento"
phase: 1
priority: high
dependencies: ["AT-001"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/server/patientHistoryRouter.ts"
files_to_modify:
  - "neondash/server/routers.ts"
validation: "bun run check"
rollback: "rm server/patientHistoryRouter.ts"
acceptance_criteria:
  - "Procedures para patient_procedures: list, create, update, delete, getTimeline"
  - "Procedures para treatment_plans: list, create, update, updateProgress, complete"
  - "Timeline agregada ordenada por data"
  - "Filtros por tipo, data, status"
```

---

### FASE 2: Componentes Core (Página Principal)

#### AT-006: Criar página principal de Pacientes com stats cards

```yaml
id: "AT-006"
title: "Criar PacientesPage.tsx com layout, stats cards animados e integração com DashboardLayout"
phase: 2
priority: critical
dependencies: ["AT-003"]
parallel_safe: false
files_to_create:
  - "neondash/client/src/pages/pacientes/PacientesPage.tsx"
  - "neondash/client/src/components/pacientes/PatientStatsCards.tsx"
files_to_modify:
  - "neondash/client/src/App.tsx"
  - "neondash/client/src/components/DashboardLayout.tsx"
validation: "bun run check && navegação para /pacientes funciona"
rollback: "rm -rf client/src/pages/pacientes client/src/components/pacientes"
acceptance_criteria:
  - "Rota /pacientes registrada no App.tsx com lazy loading"
  - "Link 'Pacientes' adicionado na sidebar do DashboardLayout com ícone Users"
  - "5 stats cards: Total, Ativos, Novos (30d), Próximas Consultas (7d), Aniversariantes"
  - "Cards com NeonCard component, animated-counter, ícones Lucide"
  - "Animação staggerContainer do Framer Motion"
  - "Skeleton loading enquanto carrega stats"
  - "Layout responsivo: 5 cards em desktop, 2+3 em tablet, 1 coluna em mobile"
```

**Prompt para implementação:**

> Crie a página principal de pacientes seguindo o padrão da LeadsPage.tsx. Envolver com `<DashboardLayout>`. No topo, renderizar `<PatientStatsCards />` (5 cards com NeonCard, animated-counter, ícones Lucide, dados de `trpc.patients.getStats.useQuery()`). Abaixo, renderizar `<PatientDataTable />`. Usar `motion.div` com `staggerContainer`. Adicionar rota lazy no App.tsx e link na sidebar do DashboardLayout.

---

#### AT-007: Criar DataTable de pacientes com TanStack Table

```yaml
id: "AT-007"
title: "Criar PatientDataTable com colunas, filtros, seleção, ações e paginação server-side"
phase: 2
priority: critical
dependencies: ["AT-003", "AT-006"]
parallel_safe: false
files_to_create:
  - "neondash/client/src/components/pacientes/PatientDataTable.tsx"
validation: "bun run check && tabela renderiza"
rollback: "rm client/src/components/pacientes/PatientDataTable.tsx"
acceptance_criteria:
  - "Colunas: Checkbox, Avatar+Nome, Contato, CPF, Status (badge), Última Visita, Consultas, Ações"
  - "Busca por texto com debounce 300ms"
  - "Filtro por status (dropdown multi-select)"
  - "Botão 'Busca Avançada' abrindo dialog"
  - "Botão 'Colunas' para toggle de colunas visíveis"
  - "Botões de exportação CSV e PDF"
  - "Botão '+ Novo Paciente' abrindo wizard"
  - "Paginação server-side com seletor de linhas por página (5, 10, 25, 50)"
  - "Ações por linha: Visualizar, Editar, Agendar, WhatsApp, Email, Mais opções"
  - "Seleção múltipla com exclusão em lote"
  - "Ordenação por clique no header"
  - "Row click navega para detalhe"
  - "Empty state e loading state com skeleton"
```

**Prompt para implementação:**

> Crie `PatientDataTable.tsx` usando `@tanstack/react-table`. Referência: `neonpro/apps/web/src/components/patients/PatientDataTable.tsx`. Adaptar para tRPC (`trpc.patients.list.useQuery()`), Wouter (`useLocation`), e design dark luxury do NeonDash. Badges dourados para "Ativo", cinza para "Inativo", amber para "Pendente". Avatar com iniciais douradas. Ação WhatsApp: `window.open(\`https://wa.me/55${phone}\`)`.

---

#### AT-008: Criar wizard de cadastro de pacientes (7 etapas)

```yaml
id: "AT-008"
title: "Criar PatientRegistrationWizard com 7 etapas, validação por etapa e progress bar"
phase: 2
priority: critical
dependencies: ["AT-002", "AT-003"]
parallel_safe: false
files_to_create:
  - "neondash/client/src/components/pacientes/PatientRegistrationWizard.tsx"
validation: "bun run check && wizard abre, navega entre etapas e submete"
rollback: "rm client/src/components/pacientes/PatientRegistrationWizard.tsx"
acceptance_criteria:
  - "Dialog modal com max-w-3xl"
  - "Progress bar animada no topo (animated-progress)"
  - "Navegação por etapas clicáveis (ícone + título + descrição)"
  - "Etapa ativa destacada com borda dourada"
  - "Etapas completadas com checkmark verde"
  - "Validação Zod por etapa antes de avançar"
  - "Etapa 2: Auto-fill via ViaCEP ao digitar CEP"
  - "Etapa 3: Validação de CPF em tempo real"
  - "Etapa 4: Tags dinâmicas para alergias/medicamentos"
  - "Etapa 5: Seletor visual de tipo de pele Fitzpatrick"
  - "Etapa 6: Drag-and-drop upload com preview"
  - "Etapa 7: Checkboxes de consentimento LGPD"
  - "Submissão via trpc.patients.create.useMutation()"
  - "Toast de sucesso com celebration-effect"
```

**Prompt para implementação:**

> Crie `PatientRegistrationWizard.tsx` como Dialog modal com react-hook-form + zod. Referência: `neonpro/apps/web/src/components/patients/PatientRegistrationWizard.tsx` (570 linhas). 7 etapas com STEPS array. Etapa 5 NOVA (Perfil Estético): seletor visual Fitzpatrick I-VI com cards coloridos, tags para queixas, textarea para histórico. Etapa 2: auto-fill CEP via `https://viacep.com.br/ws/{cep}/json/`. Design: fundo `bg-card`, progress bar dourada, step indicators com borda dourada, transições `motion.div` com `slideUp`.

---

### FASE 3: Componentes de Detalhe

#### AT-009: Criar página de detalhe do paciente com tabs

```yaml
id: "AT-009"
title: "Criar PacienteDetailPage.tsx com header, quick stats e tabs"
phase: 3
priority: high
dependencies: ["AT-003", "AT-005"]
parallel_safe: false
files_to_create:
  - "neondash/client/src/pages/pacientes/PacienteDetailPage.tsx"
  - "neondash/client/src/components/pacientes/PatientDetailView.tsx"
files_to_modify:
  - "neondash/client/src/App.tsx"
validation: "bun run check && navegação para /pacientes/:id funciona"
rollback: "rm client/src/pages/pacientes/PacienteDetailPage.tsx client/src/components/pacientes/PatientDetailView.tsx"
acceptance_criteria:
  - "Rota /pacientes/:id registrada no App.tsx"
  - "Header card com nome, idade, status badge, LGPD badge, avatar"
  - "Botões: Editar, WhatsApp, Email, Agendar, Excluir"
  - "3 quick stats: Total Consultas, Faltas, Última Visita"
  - "5 tabs: Informações, Dados Médicos, Procedimentos, Documentos, Consentimentos"
  - "Breadcrumb: Dashboard > Pacientes > [Nome]"
```

---

#### AT-010: Criar componente de Timeline de Procedimentos

```yaml
id: "AT-010"
title: "Criar PatientTimeline.tsx com visualização cronológica"
phase: 3
priority: high
dependencies: ["AT-005", "AT-009"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientTimeline.tsx"
validation: "bun run check"
acceptance_criteria:
  - "Timeline vertical com linha conectora"
  - "Cada evento: data, tipo (ícone colorido), título, descrição"
  - "Fotos antes/depois em miniatura clicável"
  - "Filtro por tipo e período"
  - "Animação staggered"
```

---

#### AT-011: Criar componente Galeria Antes/Depois

```yaml
id: "AT-011"
title: "Criar PatientBeforeAfter.tsx com comparação side-by-side e slider"
phase: 3
priority: high
dependencies: ["AT-004", "AT-009"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientBeforeAfter.tsx"
validation: "bun run check"
acceptance_criteria:
  - "Grid de pares antes/depois por procedimento"
  - "Slider de comparação (arrastar para revelar)"
  - "Data e nome do procedimento como legenda"
  - "Lightbox para tela cheia"
  - "Zoom com pinch/scroll"
```

---

#### AT-012: Criar componente de Plano de Tratamento

```yaml
id: "AT-012"
title: "Criar PatientTreatmentPlan.tsx com gestão de planos e progresso visual"
phase: 3
priority: high
dependencies: ["AT-005", "AT-009"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientTreatmentPlan.tsx"
validation: "bun run check"
acceptance_criteria:
  - "Lista de planos ativos e concluídos"
  - "Progresso com progress bar animada"
  - "Sessões realizadas/planejadas"
  - "Indicador financeiro: valor total vs pago"
  - "Status visual: planejado (azul), em andamento (dourado), concluído (verde), cancelado (vermelho)"
```

---

### FASE 4: Componentes Auxiliares

#### AT-013: Criar busca avançada de pacientes ⚡

```yaml
id: "AT-013"
title: "Criar PatientAdvancedSearch.tsx com filtros combinados e validação brasileira"
phase: 4
priority: medium
dependencies: ["AT-003"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientAdvancedSearch.tsx"
  - "neondash/client/src/hooks/usePatientSearch.ts"
acceptance_criteria:
  - "Dialog com filtros: busca geral, CPF (máscara + validação), telefone (máscara), email, status (checkboxes), data cadastro (range), tipo de pele"
  - "Formatação automática enquanto digita"
  - "Validação visual para CPF/telefone inválidos"
  - "Hook usePatientSearch com debounce 300ms"
```

---

#### AT-014: Criar sistema de exportação CSV/PDF ⚡

```yaml
id: "AT-014"
title: "Criar PatientExport.tsx e usePatientExport.ts"
phase: 4
priority: medium
dependencies: ["AT-003"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/hooks/usePatientExport.ts"
acceptance_criteria:
  - "CSV com BOM UTF-8 para Excel"
  - "PDF com tabela formatada e header"
  - "Formatação brasileira: datas dd/MM/yyyy, CPF com pontos, telefone com parênteses"
  - "Progress indicator"
  - "Opção de exportar todos ou selecionados"
  - "Rodapé LGPD no PDF"
```

---

#### AT-015: Criar upload de documentos com S3 ⚡

```yaml
id: "AT-015"
title: "Criar PatientDocumentUpload.tsx com drag-and-drop e upload S3"
phase: 4
priority: medium
dependencies: ["AT-004"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientDocumentUpload.tsx"
acceptance_criteria:
  - "Drag-and-drop com visual de upload"
  - "Seleção de categoria"
  - "Preview de imagens"
  - "Progress bar por arquivo"
  - "Lista de documentos com ações (visualizar, download, excluir)"
  - "Suporte PDF, JPG, PNG, HEIC"
  - "Upload via presigned URL"
```

---

#### AT-016: Criar gestão de consentimento LGPD ⚡

```yaml
id: "AT-016"
title: "Criar PatientConsentManager.tsx"
phase: 4
priority: medium
dependencies: ["AT-003"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientConsentManager.tsx"
acceptance_criteria:
  - "Lista de tipos de consentimento com status"
  - "Botões solicitar/revogar consentimento"
  - "Histórico de alterações"
  - "Badges: verde (concedido), amarelo (pendente), vermelho (revogado)"
```

---

#### AT-017: Criar modal de edição e dialog de exclusão ⚡

```yaml
id: "AT-017"
title: "Criar PatientEditModal.tsx e PatientDeleteDialog.tsx"
phase: 4
priority: medium
dependencies: ["AT-003"]
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/components/pacientes/PatientEditModal.tsx"
  - "neondash/client/src/components/pacientes/PatientDeleteDialog.tsx"
acceptance_criteria:
  - "EditModal: form pré-preenchido, tabs (Básico, Contato, Médico, Estético)"
  - "DeleteDialog: AlertDialog com confirmação, soft delete"
  - "Loading state nos botões"
```

---

### FASE 5: Validação e Polish

#### AT-018: Criar validadores brasileiros e integração ViaCEP ⚡

```yaml
id: "AT-018"
title: "Criar lib/patient-validators.ts"
phase: 5
priority: high
dependencies: []
parallel_safe: true ⚡
files_to_create:
  - "neondash/client/src/lib/patient-validators.ts"
validation: "bun test -- patient-validators"
acceptance_criteria:
  - "validateCPF: algoritmo completo com dígitos verificadores"
  - "validatePhone: aceita fixo e celular com DDD"
  - "formatCPF, formatPhone, formatCEP: máscaras corretas"
  - "fetchAddressByCEP: integração ViaCEP"
  - "Testes unitários"
```

---

#### AT-019: Adicionar animações e polish visual

```yaml
id: "AT-019"
title: "Adicionar animações Framer Motion, skeleton loading, empty states e micro-interações"
phase: 5
priority: medium
dependencies: ["AT-006", "AT-007", "AT-008", "AT-009"]
parallel_safe: false
acceptance_criteria:
  - "Entrada de página com fadeIn + slideUp"
  - "Cards com staggerContainer"
  - "Tabela com skeleton rows"
  - "Wizard com transição slideUp entre etapas"
  - "Badges com hover scale(1.05)"
  - "Botões com loading spinner"
  - "Empty states com ilustração e CTA"
  - "prefers-reduced-motion respeitado"
```

---

#### AT-020: Testes e validação final

```yaml
id: "AT-020"
title: "Escrever testes unitários e de integração"
phase: 5
priority: high
dependencies: ["AT-018", "AT-003"]
parallel_safe: false
files_to_create:
  - "neondash/client/src/lib/__tests__/patient-validators.test.ts"
  - "neondash/server/__tests__/patientsRouter.test.ts"
validation: "bun test"
acceptance_criteria:
  - "Testes de validateCPF: válidos, inválidos, com/sem formatação"
  - "Testes de validatePhone: fixo, celular, com/sem DDD"
  - "Testes do router: create, list, getById, update, delete"
  - "Todos passando"
```

---

## Validation Gates

```yaml
automated:
  - id: "VT-001"
    command: "bun run check"
    expected: "Exit 0 — sem erros TypeScript"
  - id: "VT-002"
    command: "bun run lint:check"
    expected: "Sem warnings ou erros"
  - id: "VT-003"
    command: "bun test"
    expected: "Todos os testes passando"
  - id: "VT-004"
    command: "bun run build"
    expected: "Build sem erros"
  - id: "VT-005"
    command: "bun run db:generate"
    expected: "Migration gerada sem erros"
```

---

## Ordem de Execução Recomendada

```
FASE 1 (Fundação):     AT-001 → AT-002 → AT-003 + AT-004⚡ + AT-005⚡
FASE 2 (Core):         AT-006 → AT-007 → AT-008
FASE 3 (Detalhe):      AT-009 → AT-010⚡ + AT-011⚡ + AT-012⚡
FASE 4 (Auxiliares):   AT-013⚡ + AT-014⚡ + AT-015⚡ + AT-016⚡ + AT-017⚡
FASE 5 (Polish):       AT-018 → AT-019 → AT-020
```

**Total: 20 tarefas atômicas em 5 fases**
**Tarefas paralelizáveis: 12 (marcadas com ⚡)**
**Tarefas sequenciais críticas: 8**
