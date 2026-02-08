/**
 * ClinicalTermsPanel - Pre-filled clinical term templates
 * Generates legal documents auto-filled with patient data.
 * Supports: editable content, save as document, send via email/WhatsApp, print/PDF.
 */

import { useUser } from "@clerk/clerk-react";
import DOMPurify from "dompurify";
import {
  Check,
  FileSignature,
  type FileText,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Syringe,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PatientData {
  id: number;
  nomeCompleto: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  dataNascimento?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface ClinicalTermsPanelProps {
  patientId: number;
  patientData: PatientData;
}

interface TermTemplate {
  id: string;
  titulo: string;
  descricao: string;
  icon: typeof FileText;
  iconColor: string;
  badgeLabel: string;
  badgeClass: string;
  conteudo: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return "___/___/______";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "___/___/______";
  return d.toLocaleDateString("pt-BR");
}

function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fillPlaceholders(
  template: string,
  patient: PatientData,
  professionalName?: string
): string {
  const endereco =
    patient.endereco ||
    [patient.cidade, patient.estado].filter(Boolean).join(" - ") ||
    "não informado";

  return template
    .replace(/\{\{NOME_PACIENTE\}\}/g, patient.nomeCompleto)
    .replace(/\{\{CPF\}\}/g, patient.cpf || "não informado")
    .replace(/\{\{RG\}\}/g, patient.rg || "não informado")
    .replace(/\{\{DATA_NASCIMENTO\}\}/g, formatDateBR(patient.dataNascimento))
    .replace(/\{\{TELEFONE\}\}/g, patient.telefone || "não informado")
    .replace(/\{\{EMAIL\}\}/g, patient.email || "não informado")
    .replace(/\{\{ENDERECO\}\}/g, endereco)
    .replace(/\{\{DATA_ATUAL\}\}/g, todayBR())
    .replace(
      /\{\{CIDADE_ESTADO\}\}/g,
      [patient.cidade, patient.estado].filter(Boolean).join("/") || "_______________"
    )
    .replace(/\{\{NOME_PROFISSIONAL\}\}/g, professionalName || "___________________________");
}

/** Strip HTML tags to get plain text for WhatsApp */
function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

// ═══════════════════════════════════════════════════════════════════════════
// TERM TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const TERM_TEMPLATES: TermTemplate[] = [
  {
    id: "uso_imagem",
    titulo: "Termo de Uso de Imagem",
    descricao: "Autorização para captura e uso de imagens antes/depois",
    icon: FileSignature,
    iconColor: "text-blue-600",
    badgeLabel: "Obrigatório",
    badgeClass: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    conteudo: `
<h2 style="text-align:center;margin-bottom:8px;">TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM</h2>
<p style="text-align:center;color:#666;margin-bottom:24px;">Lei nº 10.406/2002 (Código Civil) — Art. 20</p>

<p>Eu, <strong>{{NOME_PACIENTE}}</strong>, portador(a) do CPF nº <strong>{{CPF}}</strong>, RG nº <strong>{{RG}}</strong>, residente em <strong>{{ENDERECO}}</strong>, por meio deste instrumento, <strong>AUTORIZO</strong> de forma livre, consciente e espontânea, o uso da minha imagem, incluindo fotografias e vídeos registrados durante consultas e procedimentos estéticos, para os seguintes fins:</p>

<ul>
  <li>Documentação clínica do prontuário eletrônico;</li>
  <li>Acompanhamento da evolução de tratamentos (antes/depois);</li>
  <li>Divulgação em redes sociais, site e materiais publicitários da clínica, <strong>desde que sem identificação do nome completo e face</strong>, salvo autorização específica;</li>
  <li>Apresentações científicas, congressos e publicações acadêmicas.</li>
</ul>

<p>A presente autorização é concedida a título <strong>gratuito</strong>, abrangendo o uso da imagem em todo território nacional e internacional, em mídias impressas e digitais, por prazo indeterminado, podendo ser <strong>revogada a qualquer tempo</strong> mediante comunicação por escrito.</p>

<p>Declaro que fui devidamente informado(a) sobre os fins de utilização das imagens e que esta autorização foi concedida de forma voluntária, sem qualquer tipo de coerção.</p>

<br/>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<br/><br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PACIENTE}}</strong></p>
<p>CPF: {{CPF}}</p>
    `.trim(),
  },
  {
    id: "procedimento",
    titulo: "Termo de Consentimento de Procedimento",
    descricao: "TCLE para procedimentos estéticos",
    icon: Syringe,
    iconColor: "text-emerald-600",
    badgeLabel: "Obrigatório",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    conteudo: `
<h2 style="text-align:center;margin-bottom:8px;">TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)</h2>
<p style="text-align:center;color:#666;margin-bottom:24px;">Procedimentos Estéticos — Resolução CFM nº 2.217/2018</p>

<p>Eu, <strong>{{NOME_PACIENTE}}</strong>, CPF nº <strong>{{CPF}}</strong>, RG nº <strong>{{RG}}</strong>, nascido(a) em <strong>{{DATA_NASCIMENTO}}</strong>, declaro que fui devidamente informado(a) e esclarecido(a) pelo(a) profissional responsável sobre:</p>

<ol>
  <li><strong>Natureza do procedimento:</strong> O procedimento estético indicado, sua técnica, área de aplicação e produtos/equipamentos a serem utilizados;</li>
  <li><strong>Objetivo:</strong> Os resultados esperados com o tratamento proposto, ciente de que os resultados podem variar de pessoa para pessoa;</li>
  <li><strong>Riscos e complicações possíveis:</strong> Incluindo, mas não se limitando a: edema, equimoses, dor, hematomas, assimetrias, infecção, reações alérgicas, necrose tecidual, hiperpigmentação, cicatrizes, resultados insatisfatórios e necessidade de procedimentos complementares;</li>
  <li><strong>Alternativas terapêuticas:</strong> Fui informado(a) sobre outras opções de tratamento disponíveis;</li>
  <li><strong>Cuidados pós-procedimento:</strong> Recebi orientações sobre os cuidados necessários após o procedimento e comprometo-me a segui-los;</li>
  <li><strong>Contraindicações:</strong> A importância de informar sobre gravidez, alergias, uso de medicamentos, doenças pré-existentes e tratamentos anteriores.</li>
</ol>

<p>Declaro que tive a oportunidade de fazer perguntas e que todas as minhas dúvidas foram esclarecidas de forma satisfatória. <strong>Autorizo</strong>, de forma livre e voluntária, a realização do procedimento proposto, estando ciente dos riscos e benefícios envolvidos.</p>

<p>Estou ciente de que posso <strong>revogar este consentimento a qualquer momento</strong> antes da realização do procedimento.</p>

<br/>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<br/><br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PACIENTE}}</strong> — CPF: {{CPF}}</p>
<br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PROFISSIONAL}}</strong></p>
<p>Profissional Responsável</p>
    `.trim(),
  },
  {
    id: "lgpd",
    titulo: "Termo de Privacidade (LGPD)",
    descricao: "Consentimento para tratamento de dados pessoais",
    icon: Shield,
    iconColor: "text-violet-600",
    badgeLabel: "LGPD",
    badgeClass: "bg-violet-500/10 text-violet-700 border-violet-500/20",
    conteudo: `
<h2 style="text-align:center;margin-bottom:8px;">TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS</h2>
<p style="text-align:center;color:#666;margin-bottom:24px;">Lei nº 13.709/2018 — Lei Geral de Proteção de Dados (LGPD)</p>

<p>Eu, <strong>{{NOME_PACIENTE}}</strong>, CPF nº <strong>{{CPF}}</strong>, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD), <strong>AUTORIZO</strong> a coleta e o tratamento dos meus dados pessoais e dados pessoais sensíveis para as seguintes finalidades:</p>

<ul>
  <li><strong>Dados pessoais coletados:</strong> Nome completo, CPF, RG, data de nascimento, endereço, telefone, e-mail;</li>
  <li><strong>Dados sensíveis coletados:</strong> Informações de saúde, histórico médico, fotografias clínicas, biometria facial;</li>
</ul>

<p><strong>Finalidades do tratamento:</strong></p>
<ol>
  <li>Prontuário eletrônico e acompanhamento clínico;</li>
  <li>Agendamento de consultas e procedimentos;</li>
  <li>Comunicação sobre tratamentos e acompanhamento pós-procedimento;</li>
  <li>Cumprimento de obrigações legais e regulatórias (CFM, Vigilância Sanitária);</li>
  <li>Envio de comunicações de marketing (quando expressamente autorizado).</li>
</ol>

<p><strong>Direitos do titular:</strong> Conforme a LGPD, tenho direito a:</p>
<ul>
  <li>Acessar meus dados pessoais;</li>
  <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
  <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
  <li>Revogar o consentimento a qualquer momento;</li>
  <li>Solicitar a portabilidade dos dados.</li>
</ul>

<p>Declaro estar ciente de que a revogação do consentimento não afeta a legalidade do tratamento realizado anteriormente e que os dados necessários para cumprimento de obrigação legal serão mantidos conforme a legislação vigente.</p>

<br/>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<br/><br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PACIENTE}}</strong> — CPF: {{CPF}}</p>
    `.trim(),
  },
  {
    id: "plano_tratamento",
    titulo: "Consentimento de Plano de Tratamento",
    descricao: "Aceitação de plano com múltiplas sessões",
    icon: Sparkles,
    iconColor: "text-amber-600",
    badgeLabel: "Recomendado",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    conteudo: `
<h2 style="text-align:center;margin-bottom:8px;">TERMO DE CONSENTIMENTO E ADESÃO AO PLANO DE TRATAMENTO</h2>
<p style="text-align:center;color:#666;margin-bottom:24px;">Tratamento Estético com Múltiplas Sessões</p>

<p>Eu, <strong>{{NOME_PACIENTE}}</strong>, CPF nº <strong>{{CPF}}</strong>, RG nº <strong>{{RG}}</strong>, declaro que:</p>

<ol>
  <li>Fui avaliado(a) pelo(a) profissional responsável que me apresentou um <strong>plano de tratamento personalizado</strong> com indicação de procedimentos, número de sessões, intervalos entre sessões e resultados esperados;</li>
  <li>Compreendo que o plano de tratamento proposto envolve <strong>múltiplas sessões</strong> e que a adesão ao cronograma é fundamental para alcançar os resultados desejados;</li>
  <li>Fui informado(a) sobre os <strong>valores, formas de pagamento</strong> e política de cancelamento/remarcação de sessões;</li>
  <li>Entendo que os resultados dos tratamentos estéticos são <strong>individuais</strong> e podem variar de acordo com fatores como tipo de pele, idade, condições de saúde e adesão aos cuidados pós-tratamento;</li>
  <li>Comprometo-me a seguir as <strong>orientações pré e pós-procedimento</strong> fornecidas pelo(a) profissional responsável;</li>
  <li>Fui alertado(a) de que a <strong>interrupção do tratamento</strong> antes da conclusão pode comprometer os resultados e que não haverá garantia de resultados parciais.</li>
</ol>

<p>Declaro que todas as minhas dúvidas foram esclarecidas e que <strong>aceito voluntariamente</strong> a adesão ao plano de tratamento proposto.</p>

<br/>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<br/><br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PACIENTE}}</strong> — CPF: {{CPF}}</p>
<br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PROFISSIONAL}}</strong></p>
<p>Profissional Responsável</p>
    `.trim(),
  },
  {
    id: "anestesia",
    titulo: "Consentimento de Anestesia",
    descricao: "Para procedimentos com anestesia local/tópica",
    icon: ShieldCheck,
    iconColor: "text-rose-600",
    badgeLabel: "Quando aplicável",
    badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/20",
    conteudo: `
<h2 style="text-align:center;margin-bottom:8px;">TERMO DE CONSENTIMENTO PARA ANESTESIA LOCAL/TÓPICA</h2>
<p style="text-align:center;color:#666;margin-bottom:24px;">Procedimentos Estéticos com Anestesia</p>

<p>Eu, <strong>{{NOME_PACIENTE}}</strong>, CPF nº <strong>{{CPF}}</strong>, RG nº <strong>{{RG}}</strong>, nascido(a) em <strong>{{DATA_NASCIMENTO}}</strong>, declaro que fui informado(a) e esclarecido(a) sobre:</p>

<ol>
  <li><strong>Tipo de anestesia:</strong> Será utilizada anestesia local e/ou tópica para o procedimento estético indicado;</li>
  <li><strong>Substâncias utilizadas:</strong> Fui informado(a) sobre os anestésicos que serão utilizados (lidocaína, prilocaína ou similares) e suas concentrações;</li>
  <li><strong>Riscos possíveis:</strong> Incluindo, mas não se limitando a:
    <ul>
      <li>Reações alérgicas aos componentes anestésicos;</li>
      <li>Dor, ardência ou desconforto durante a aplicação;</li>
      <li>Hematomas ou edema no local da aplicação;</li>
      <li>Dormência temporária prolongada;</li>
      <li>Em casos raros: reações sistêmicas (tonturas, palpitações, convulsões);</li>
    </ul>
  </li>
  <li><strong>Cuidados prévios:</strong> Informei ao profissional sobre alergias, medicamentos em uso, condições cardíacas e gravidez/amamentação;</li>
  <li><strong>Alternativas:</strong> Fui informado(a) sobre a possibilidade de realizar o procedimento sem anestesia, quando aplicável.</li>
</ol>

<p>Declaro que <strong>informei veridicamente</strong> meu histórico de saúde e alergias e <strong>AUTORIZO</strong> a aplicação da anestesia indicada para a realização do procedimento estético proposto.</p>

<br/>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<br/><br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PACIENTE}}</strong> — CPF: {{CPF}}</p>
<br/>
<p>_____________________________________________</p>
<p><strong>{{NOME_PROFISSIONAL}}</strong></p>
<p>Profissional Responsável</p>
    `.trim(),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ClinicalTermsPanel({ patientId, patientData }: ClinicalTermsPanelProps) {
  const { user } = useUser();
  const professionalName = user?.fullName || "";
  const [selectedTerm, setSelectedTerm] = useState<TermTemplate | null>(null);
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Load persisted custom term templates for this mentorado
  const customTermsQuery = trpc.pacientes.termos.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const customTermsMap = useMemo(
    () => new Map((customTermsQuery.data ?? []).map((t) => [t.termoId, t.conteudoHtml])),
    [customTermsQuery.data]
  );

  const createMutation = trpc.pacientes.documentos.create.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Termo salvo no prontuário!");
      setSavedTerms((prev) => {
        const next = new Set(prev);
        next.add(variables.nome);
        return next;
      });
      void utils.pacientes.documentos.list.invalidate({ pacienteId: patientId });
      void utils.pacientes.getById.invalidate({ id: patientId });
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar termo"),
  });

  const sendEmailMutation = trpc.pacientes.documentos.sendTermByEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Termo enviado com sucesso para ${data.email}`);
    },
    onError: (e) => toast.error(e.message || "Erro ao enviar e-mail"),
  });

  const saveTemplateMutation = trpc.pacientes.termos.save.useMutation({
    onSuccess: () => {
      toast.success("Modelo salvo! Será reutilizado em todos os pacientes.");
      void utils.pacientes.termos.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar modelo"),
  });

  const resetTemplateMutation = trpc.pacientes.termos.reset.useMutation({
    onSuccess: () => {
      toast.success("Modelo restaurado ao padrão original.");
      void utils.pacientes.termos.getAll.invalidate();
      // Re-render with default template
      if (selectedTerm && contentRef.current) {
        contentRef.current.innerHTML = fillPlaceholders(
          selectedTerm.conteudo,
          patientData,
          professionalName
        );
      }
    },
    onError: (e) => toast.error(e.message || "Erro ao restaurar modelo"),
  });

  /** Get the template content: custom if saved, otherwise default filled with patient data */
  const getFilledContent = useCallback(
    (term: TermTemplate): string => {
      const customHtml = customTermsMap.get(term.id);
      if (customHtml) {
        // Custom templates already have placeholders filled with previous patient data,
        // so we store the raw template. Re-fill placeholders on the custom content.
        return fillPlaceholders(customHtml, patientData, professionalName);
      }
      return fillPlaceholders(term.conteudo, patientData, professionalName);
    },
    [customTermsMap, patientData, professionalName]
  );

  /** Get current HTML from the editable content area (may be edited by user) */
  const getCurrentHtml = useCallback((): string => {
    if (contentRef.current) return contentRef.current.innerHTML;
    if (selectedTerm) return getFilledContent(selectedTerm);
    return "";
  }, [selectedTerm, getFilledContent]);

  const handleSaveDoc = () => {
    if (!selectedTerm) return;
    const html = getCurrentHtml();
    const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${selectedTerm.titulo}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.7;color:#1a1a1a}h2{color:#111}ul,ol{margin:12px 0}li{margin:4px 0}strong{color:#000}</style></head><body>${html}</body></html>`;
    const dataUrl = `data:text/html;base64,${btoa(unescape(encodeURIComponent(htmlDoc)))}`;

    createMutation.mutate({
      pacienteId: patientId,
      tipo: "consentimento",
      nome: `${selectedTerm.titulo} — ${patientData.nomeCompleto}`,
      url: dataUrl,
      mimeType: "text/html",
      observacoes: `Termo gerado automaticamente em ${todayBR()}. Pendente de assinatura.`,
    });
  };

  const handleEmail = () => {
    if (!selectedTerm) return;
    if (!patientData.email) {
      toast.error("Paciente não possui e-mail cadastrado");
      return;
    }

    sendEmailMutation.mutate({
      pacienteId: patientId,
      pacienteEmail: patientData.email,
      pacienteNome: patientData.nomeCompleto,
      termoTitulo: selectedTerm.titulo,
      termoHtml: getCurrentHtml(),
    });
  };

  /** Save the current content as the mentorado's custom template (reusable across patients) */
  const handleSaveTemplate = () => {
    if (!selectedTerm) return;
    saveTemplateMutation.mutate({
      termoId: selectedTerm.id,
      conteudoHtml: getCurrentHtml(),
    });
  };

  /** Reset to default template (delete custom version) */
  const handleResetTemplate = () => {
    if (!selectedTerm) return;
    resetTemplateMutation.mutate({ termoId: selectedTerm.id });
  };

  const handleWhatsApp = () => {
    if (!selectedTerm) return;
    if (!patientData.telefone) {
      toast.error("Paciente não possui telefone cadastrado");
      return;
    }

    const plainText = htmlToPlainText(getCurrentHtml());
    // Clean phone: remove non-digits, ensure +55 prefix
    const cleanPhone = patientData.telefone.replace(/\D/g, "");
    const phone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const encodedText = encodeURIComponent(`*${selectedTerm.titulo}*\n\n${plainText}`);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank", "noopener");
  };

  const handlePrint = () => {
    if (!selectedTerm) return;
    const html = getCurrentHtml();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup bloqueado. Permita popups para imprimir.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${selectedTerm.titulo}</title>
        <style>
          @media print {
            @page { margin: 2cm; }
          }
          body {
            font-family: 'Times New Roman', Georgia, serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.8;
            color: #1a1a1a;
            font-size: 14px;
          }
          h2 { font-size: 18px; color: #111; margin-bottom: 4px; }
          ul, ol { margin: 12px 0; }
          li { margin: 6px 0; }
          strong { color: #000; }
          p { margin: 8px 0; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openTerm = (term: TermTemplate) => {
    setSelectedTerm(term);
    setIsEditing(false);
  };

  const closeTerm = () => {
    setSelectedTerm(null);
    setIsEditing(false);
  };

  return (
    <>
      <Card className="border-primary/10 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSignature className="h-5 w-5 text-primary" />
            Termos da Clínica
          </CardTitle>
          <CardDescription>
            Termos pré-preenchidos com os dados do paciente. Edite, salve, envie por e-mail/WhatsApp
            ou imprima.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TERM_TEMPLATES.map((term) => {
              const Icon = term.icon;
              const isSaved = savedTerms.has(`${term.titulo} — ${patientData.nomeCompleto}`);

              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => openTerm(term)}
                  className="group relative flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="shrink-0 rounded-lg bg-muted p-2 group-hover:bg-primary/10 transition-colors">
                      <Icon className={`h-5 w-5 ${term.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                        {term.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {term.descricao}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${term.badgeClass}`}
                    >
                      {term.badgeLabel}
                    </Badge>
                    {customTermsMap.has(term.id) && (
                      <Badge
                        className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400"
                        variant="outline"
                      >
                        <Pencil className="h-3 w-3 mr-0.5" />
                        Customizado
                      </Badge>
                    )}
                    {isSaved && (
                      <Badge
                        className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                        variant="outline"
                      >
                        <Check className="h-3 w-3 mr-0.5" />
                        Salvo
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Term Preview / Edit Dialog */}
      <Dialog open={!!selectedTerm} onOpenChange={() => closeTerm()}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              {selectedTerm &&
                (() => {
                  const Icon = selectedTerm.icon;
                  return <Icon className={`h-5 w-5 ${selectedTerm.iconColor}`} />;
                })()}
              {selectedTerm?.titulo}
              {isEditing && (
                <Badge variant="secondary" className="ml-2 text-xs gap-1">
                  <Pencil className="h-3 w-3" />
                  Editando
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? (
                "Editando o conteúdo do termo. As alterações serão usadas ao salvar, enviar ou imprimir."
              ) : (
                <>
                  Pré-visualização do termo com os dados de{" "}
                  <strong>{patientData.nomeCompleto}</strong>. Clique em "Editar" para modificar.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Separator className="shrink-0" />

          {/* Scrollable content area — native overflow for reliable scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div
              ref={contentRef}
              contentEditable={isEditing}
              suppressContentEditableWarning
              className={`prose prose-sm max-w-none p-6 break-words [word-break:break-word] [overflow-wrap:anywhere] ${
                isEditing
                  ? "bg-white dark:bg-zinc-900 outline-none ring-2 ring-inset ring-primary/20"
                  : ""
              }`}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized with DOMPurify
              dangerouslySetInnerHTML={{
                __html: selectedTerm ? DOMPurify.sanitize(getFilledContent(selectedTerm)) : "",
              }}
            />
          </div>

          <Separator className="shrink-0" />

          <DialogFooter className="shrink-0 flex-col gap-3 p-6 pt-4">
            {/* Row 1: Edit toggle + template actions */}
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {isEditing ? "Modo Leitura" : "Editar Conteúdo"}
              </Button>

              <div className="flex items-center gap-2">
                {selectedTerm && customTermsMap.has(selectedTerm.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={handleResetTemplate}
                    disabled={resetTemplateMutation.isPending}
                  >
                    {resetTemplateMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restaurar Original
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  onClick={handleSaveTemplate}
                  disabled={saveTemplateMutation.isPending}
                  title="Salvar como modelo padrão para todos os pacientes"
                >
                  {saveTemplateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileSignature className="h-3.5 w-3.5" />
                  )}
                  Salvar Modelo
                </Button>
              </div>
            </div>

            <Separator />

            {/* Row 2: Document/send actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                onClick={handleWhatsApp}
                disabled={!patientData.telefone}
                title={
                  !patientData.telefone ? "Paciente sem telefone cadastrado" : "Enviar via WhatsApp"
                }
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={handleEmail}
                disabled={!patientData.email || sendEmailMutation.isPending}
                title={!patientData.email ? "Paciente sem e-mail cadastrado" : undefined}
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                E-mail
              </Button>
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={handleSaveDoc}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Salvar no Prontuário
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
