/**
 * Patient Types - Composite types and input types for the patient management feature
 *
 * Note: Base types (Paciente, InsertPaciente, etc.) are automatically exported
 * from drizzle/schema.ts via the re-export in shared/types.ts
 */

import type {
  Paciente,
  PacienteDocumento,
  PacienteFoto,
  PacienteInfoMedica,
  PacienteProcedimento,
} from "../drizzle/schema";

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE TYPES (for queries that join multiple tables)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Full patient profile with all related data
 */
export interface PacienteCompleto extends Paciente {
  infoMedica: PacienteInfoMedica | null;
  procedimentos: PacienteProcedimento[];
  fotosRecentes: PacienteFoto[];
  documentos: PacienteDocumento[];
  stats: PacienteStats;
}

/**
 * Summary statistics for a patient
 */
export interface PacienteStats {
  totalProcedimentos: number;
  totalFotos: number;
  totalDocumentos: number;
  ultimoProcedimento: Date | null;
  valorTotalGasto: number; // em centavos
}

/**
 * Timeline item for patient history
 */
export interface PacienteTimelineItem {
  id: number;
  tipo: "procedimento" | "foto" | "documento";
  data: Date;
  titulo: string;
  descricao: string | null;
  // Specific data based on type
  procedimentoId?: number;
  fotoId?: number;
  documentoId?: number;
  thumbnailUrl?: string;
}

/**
 * Photo pair for before/after comparison
 */
export interface FotoComparacaoPar {
  antes: PacienteFoto;
  depois: PacienteFoto;
  grupoId: string;
  areaFotografada: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT TYPES (for mutations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Input for creating a new patient
 */
export interface CreatePacienteInput {
  nomeCompleto: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: "masculino" | "feminino" | "outro" | "prefiro_nao_dizer";
  cpf?: string;
  endereco?: string;
  fotoUrl?: string;
  observacoes?: string;
}

/**
 * Input for updating a patient
 */
export interface UpdatePacienteInput extends Partial<CreatePacienteInput> {
  id: number;
  status?: "ativo" | "inativo";
}

/**
 * Input for creating/updating medical info
 */
export interface UpsertInfoMedicaInput {
  pacienteId: number;
  tipoSanguineo?: string;
  alergias?: string;
  medicamentosAtuais?: string;
  condicoesPreexistentes?: string;
  historicoCircurgico?: string;
  contraindacacoes?: string;
  observacoesClinicas?: string;
}

/**
 * Input for adding a procedure record
 */
export interface CreateProcedimentoInput {
  pacienteId: number;
  procedimentoId?: number; // Link to menu procedimento
  nomeProcedimento: string;
  dataRealizacao: string;
  profissionalResponsavel?: string;
  valorCobrado?: number;
  valorReal?: number;
  observacoes?: string;
  resultadoAvaliacao?: string;
  areaAplicacao?: string;
  produtosUtilizados?: string;
  quantidadeAplicada?: string;
  lotesProdutos?: string;
}

/**
 * Input for uploading a photo
 */
export interface CreateFotoInput {
  pacienteId: number;
  procedimentoRealizadoId?: number;
  url: string;
  thumbnailUrl?: string;
  tipo: "antes" | "depois" | "evolucao" | "simulacao";
  angulo?: "frontal" | "perfil_esquerdo" | "perfil_direito" | "obliquo";
  dataCaptura?: string;
  descricao?: string;
  areaFotografada?: string;
  parComId?: number;
  grupoId?: string;
}

/**
 * Input for uploading a document
 */
export interface CreateDocumentoInput {
  pacienteId: number;
  procedimentoRealizadoId?: number;
  tipo: "consentimento" | "exame" | "prescricao" | "outro";
  nome: string;
  url: string;
  mimeType?: string;
  tamanhoBytes?: number;
  dataAssinatura?: string;
  assinadoPor?: string;
  observacoes?: string;
}

/**
 * Input for AI chat message
 */
export interface CreateChatMessageInput {
  pacienteId: number;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  fotoId?: number;
  imagemUrl?: string;
  imagemGeradaUrl?: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & ENUMS (for UI)
// ═══════════════════════════════════════════════════════════════════════════

export const TIPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const GENEROS_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
] as const;

export const TIPO_FOTO_OPTIONS = [
  { value: "antes", label: "Antes", color: "text-blue-600" },
  { value: "depois", label: "Depois", color: "text-green-600" },
  { value: "evolucao", label: "Evolução", color: "text-yellow-600" },
  { value: "simulacao", label: "Simulação IA", color: "text-purple-600" },
] as const;

export const TIPO_DOCUMENTO_OPTIONS = [
  { value: "consentimento", label: "Termo de Consentimento", icon: "FileSignature" },
  { value: "exame", label: "Exame", icon: "FileText" },
  { value: "prescricao", label: "Prescrição", icon: "Pill" },
  { value: "outro", label: "Outro", icon: "File" },
] as const;

export const ANGULO_FOTO_OPTIONS = [
  { value: "frontal", label: "Frontal" },
  { value: "perfil_esquerdo", label: "Perfil Esquerdo" },
  { value: "perfil_direito", label: "Perfil Direito" },
  { value: "obliquo", label: "Oblíquo (45°)" },
] as const;

/**
 * Default AI prompt suggestions for aesthetic analysis
 */
export const AI_PROMPT_SUGGESTIONS = [
  {
    category: "Análise Facial",
    prompts: [
      "Analise a harmonia facial e sugira procedimentos de harmonização",
      "Identifique assimetrias faciais e possíveis correções",
      "Avalie a proporção do terço superior, médio e inferior da face",
    ],
  },
  {
    category: "Preenchimento Labial",
    prompts: [
      "Simule um preenchimento labial discreto e natural",
      "Analise a proporção lábio superior/inferior",
      "Sugira pontos de aplicação para definição de contorno labial",
    ],
  },
  {
    category: "Toxina Botulínica",
    prompts: [
      "Identifique áreas de aplicação para rugas dinâmicas",
      "Avalie o terço superior para aplicação de botox",
      "Simule resultado de tratamento de rugas frontais",
    ],
  },
  {
    category: "Contorno Corporal",
    prompts: [
      "Analise áreas para lipo de alta definição",
      "Simule resultado de preenchimento glúteo",
      "Identifique zonas de lipodistrofia localizada",
    ],
  },
] as const;
