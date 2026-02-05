# PLAN-file-import: Importação de CSV e PDF via File Upload

> **Goal:** Alterar o botão "Importar CSV" na página de Financeiro/Transações para fazer upload de arquivos `.csv` e `.pdf` ao invés de colar dados em textarea.

## 0. Research Findings

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Implementação atual usa `<Textarea>` para colar CSV com formato `data,descricao,valor` | 5/5 | `TransacoesTab.tsx:280-287` | Frontend precisa substituir textarea por dropzone |
| 2 | Backend `importCsv` mutation recebe `csvContent: string` e já faz parsing | 5/5 | `financeiroRouter.ts:469-500` | Backend não precisa mudar - apenas receber string |
| 3 | `react-dropzone` é padrão para file upload em React com hook `useDropzone` | 5/5 | Context7 docs | Dependência já compatível com projeto |
| 4 | CSV pode ser lido client-side via `FileReader.readAsText()` | 5/5 | Context7 docs | Parsing simples, sem nova dependência |
| 5 | PDF requer `pdfjs-dist` para extrair texto das páginas | 4/5 | Tavily + Stack Overflow | Nova dependência ~2MB |
| 6 | PDF de extrato bancário típico tem formato tabular que pode ser convertido para CSV | 3/5 | Análise de casos | Requer heurística para parsing |

### Knowledge Gaps & Assumptions

- **Gap:** Não sabemos o formato exato dos PDFs que o usuário vai importar (extrato bancário? planilha exportada?)
- **Assumption:** PDFs terão texto selecionável (não imagens escaneadas)
- **Assumption:** Formato básico: linhas com data, descrição e valor separados por espaço/tab

### Edge Cases (5+)

1. **Arquivo vazio** - Validar antes de processar
2. **Encoding incorreto** - CSV com caracteres especiais (UTF-8 vs ISO-8859-1)
3. **PDF com imagens** - Não conseguirá extrair texto, mostrar erro amigável
4. **Arquivo muito grande** - Limitar a 5MB para evitar travamento do browser
5. **Formato inesperado** - Mostrar preview antes de importar para validação visual
6. **PDF protegido por senha** - pdfjs-dist retorna erro, tratar adequadamente

---

## 1. User Review Required

> [!IMPORTANT]
> **Decisão sobre formato PDF:** O parsing de PDF é heurístico e pode não funcionar com todos os formatos. Recomendo começar apenas com CSV e adicionar PDF em fase posterior se necessário.

> [!WARNING]
> **Nova dependência:** `pdfjs-dist` adiciona ~2MB ao bundle. Se PDF não for crítico, podemos omitir para manter o bundle leve.

**Opções:**
- **A)** Implementar apenas CSV com file upload (menor impacto)
- **B)** Implementar CSV + PDF com file upload (maior complexidade)

---

## 2. Proposed Changes

### Frontend - Componente de Import

#### [MODIFY] [TransacoesTab.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/TransacoesTab.tsx)

- **L264-297:** Substituir Dialog de import com textarea por novo componente
- Adicionar estados para arquivos selecionados e preview de dados
- Manter mutation `importCsv` inalterada (backend recebe string)

#### [NEW] [FileImportDialog.tsx](file:///home/mauricio/neondash/client/src/components/financeiro/FileImportDialog.tsx)

- Componente separado para Dialog de importação
- Usa `useDropzone` do `react-dropzone` para drag-and-drop
- Aceita `.csv` e opcionalmente `.pdf`
- Mostra preview das transações antes de importar
- Permite edição/remoção antes de confirmar

---

### Dependências

#### [MODIFY] [package.json](file:///home/mauricio/neondash/package.json)

- Adicionar `react-dropzone` (se não existir)
- Adicionar `pdfjs-dist` (apenas se opção B escolhida)

---

## 3. Atomic Implementation Tasks

> [!CAUTION]
> Cada task tem subtasks obrigatórias com validação.

### AT-001: Instalar dependências ⚡ PARALLEL-SAFE
**Goal:** Adicionar react-dropzone (e opcionalmente pdfjs-dist) ao projeto
**Dependencies:** None

#### Subtasks:
- [ ] ST-001.1: Verificar se react-dropzone já existe
  - **Comando:** `grep -r "react-dropzone" package.json`
  - **Validation:** Confirmar presença ou ausência
- [ ] ST-001.2: Instalar dependência
  - **Comando:** `bun add react-dropzone`
  - **Validation:** `bun run check` sem erros

**Rollback:** `bun remove react-dropzone`

---

### AT-002: Criar componente FileImportDialog
**Goal:** Novo componente com dropzone para upload de arquivos
**Dependencies:** AT-001

#### Subtasks:
- [ ] ST-002.1: Criar arquivo `FileImportDialog.tsx` em `client/src/components/financeiro/`
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Arquivo criado com exports válidos
- [ ] ST-002.2: Implementar hook `useDropzone` com accept `.csv`
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Console mostra arquivo ao dropar
- [ ] ST-002.3: Implementar parsing de CSV via FileReader
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Preview mostra linhas do CSV
- [ ] ST-002.4: Adicionar preview de transações em tabela
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Tabela renderiza dados parseados
- [ ] ST-002.5: Conectar com mutation `importCsv` existente
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Toast de sucesso após import

**Rollback:** `rm client/src/components/financeiro/FileImportDialog.tsx`

---

### AT-003: Integrar FileImportDialog no TransacoesTab
**Goal:** Substituir textarea por novo componente
**Dependencies:** AT-002

#### Subtasks:
- [ ] ST-003.1: Importar `FileImportDialog` no `TransacoesTab`
  - **File:** `client/src/components/financeiro/TransacoesTab.tsx`
  - **Validation:** Import sem erro de TS
- [ ] ST-003.2: Remover código antigo do Dialog de import (L264-297)
  - **File:** `client/src/components/financeiro/TransacoesTab.tsx`
  - **Validation:** Código removido, sem erros
- [ ] ST-003.3: Adicionar novo componente no lugar
  - **File:** `client/src/components/financeiro/TransacoesTab.tsx`
  - **Validation:** Dialog abre com dropzone
- [ ] ST-003.4: Remover estado `csvContent` não utilizado
  - **File:** `client/src/components/financeiro/TransacoesTab.tsx`
  - **Validation:** `bun run check` sem unused variables

**Rollback:** `git checkout client/src/components/financeiro/TransacoesTab.tsx`

---

### AT-004: Adicionar suporte a PDF (OPCIONAL)
**Goal:** Extrair texto de PDFs e converter para formato CSV
**Dependencies:** AT-003

#### Subtasks:
- [ ] ST-004.1: Instalar `pdfjs-dist`
  - **Comando:** `bun add pdfjs-dist`
  - **Validation:** Dependência instalada
- [ ] ST-004.2: Criar utilitário `parsePdf.ts` em `client/src/lib/`
  - **File:** `client/src/lib/parsePdf.ts`
  - **Validation:** Função exportada
- [ ] ST-004.3: Integrar parsing de PDF no FileImportDialog
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** PDF dropado mostra preview
- [ ] ST-004.4: Adicionar `.pdf` ao accept do dropzone
  - **File:** `client/src/components/financeiro/FileImportDialog.tsx`
  - **Validation:** Aceita arquivos PDF

**Rollback:** `bun remove pdfjs-dist && rm client/src/lib/parsePdf.ts`

---

## 4. Verification Plan

### Automated Tests

```bash
# TypeScript validation
bun run check

# Code formatting
bun run lint

# Unit tests (se existirem)
bun test
```

### Manual Verification

1. **Abrir página Financeiro > Transações**
   - Clicar em "Importar CSV"
   - Verificar que Dialog abre com área de drag-and-drop

2. **Testar upload de CSV**
   - Criar arquivo `test.csv` com conteúdo:
     ```csv
     data,descricao,valor
     2024-01-15,Venda procedimento,350.00
     2024-01-16,Compra insumos,-120.00
     ```
   - Arrastar arquivo para dropzone
   - Verificar preview das 2 transações
   - Clicar "Importar"
   - Verificar toast de sucesso
   - Verificar transações aparecem na tabela

3. **Testar erros de validação**
   - Tentar dropar arquivo `.txt` → deve rejeitar
   - Tentar dropar arquivo > 5MB → deve mostrar erro
   - Dropar CSV vazio → deve mostrar mensagem

4. **Testar PDF (se implementado)**
   - Dropar PDF de extrato bancário simples
   - Verificar preview das transações extraídas
   - Importar e validar

---

## 5. Rollback Plan

```bash
# Reverter todas as alterações
git checkout client/src/components/financeiro/TransacoesTab.tsx
rm -f client/src/components/financeiro/FileImportDialog.tsx
rm -f client/src/lib/parsePdf.ts

# Remover dependências adicionadas
bun remove react-dropzone pdfjs-dist
```

---

## Complexity Level: L4

- Multi-file feature
- Nova dependência
- Parsing de formatos diferentes
- UX com preview antes de importar
