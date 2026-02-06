/**
 * Hook for exporting patient data to CSV and PDF formats
 * Follows Brazilian formatting standards
 */

import { useCallback, useState } from "react";
import { formatCPF, formatCurrencyBR, formatDateBR, formatPhone } from "@/lib/patient-validators";

interface PatientExportData {
  id: number;
  nomeCompleto: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  dataNascimento?: Date | string | null;
  genero?: string | null;
  status?: string | null;
  cidade?: string | null;
  estado?: string | null;
  totalConsultas?: number;
  totalProcedimentos?: number;
  valorTotalGasto?: number;
  ultimaVisita?: Date | string | null;
  updatedAt?: Date | string | null;
}

interface ExportOptions {
  includeContact?: boolean;
  includeAddress?: boolean;
  includeMetrics?: boolean;
  selectedIds?: number[];
}

export function usePatientExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateCSV = useCallback(
    (patients: PatientExportData[], options: ExportOptions = {}): string => {
      const { includeContact = true, includeAddress = true, includeMetrics = true } = options;

      // Build headers
      const headers: string[] = ["ID", "Nome Completo"];
      if (includeContact) {
        headers.push("Email", "Telefone", "CPF");
      }
      headers.push("Data de Nascimento", "Gênero", "Status");
      if (includeAddress) {
        headers.push("Cidade", "Estado");
      }
      if (includeMetrics) {
        headers.push(
          "Total Consultas",
          "Total Procedimentos",
          "Valor Total Gasto",
          "Última Visita"
        );
      }
      headers.push("Atualizado em");

      // Build rows
      const rows = patients.map((p) => {
        const row: string[] = [String(p.id), p.nomeCompleto];

        if (includeContact) {
          row.push(
            p.email ?? "",
            p.telefone ? formatPhone(p.telefone) : "",
            p.cpf ? formatCPF(p.cpf) : ""
          );
        }

        row.push(formatDateBR(p.dataNascimento ?? null), p.genero ?? "", p.status ?? "");

        if (includeAddress) {
          row.push(p.cidade ?? "", p.estado ?? "");
        }

        if (includeMetrics) {
          row.push(
            String(p.totalConsultas ?? 0),
            String(p.totalProcedimentos ?? 0),
            formatCurrencyBR(p.valorTotalGasto ?? 0),
            formatDateBR(p.ultimaVisita ?? null)
          );
        }

        row.push(formatDateBR(p.updatedAt ?? null));

        return row;
      });

      // Escape and join cells
      const escapeCell = (cell: string) => {
        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      };

      const csvContent = [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
      ].join("\n");

      // Add UTF-8 BOM for Excel compatibility
      return `\uFEFF${csvContent}`;
    },
    []
  );

  const exportCSV = useCallback(
    async (patients: PatientExportData[], filename = "pacientes", options: ExportOptions = {}) => {
      setIsExporting(true);
      setProgress(0);

      try {
        // Filter by selected IDs if provided
        const dataToExport = options.selectedIds
          ? patients.filter((p) => options.selectedIds?.includes(p.id))
          : patients;

        setProgress(50);

        const csvContent = generateCSV(dataToExport, options);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setProgress(100);
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    [generateCSV]
  );

  const generatePDFContent = useCallback(
    (patients: PatientExportData[], options: ExportOptions = {}): string => {
      const { includeContact = true, includeMetrics = true } = options;

      // Filter by selected IDs if provided
      const dataToExport = options.selectedIds
        ? patients.filter((p) => options.selectedIds?.includes(p.id))
        : patients;

      // Generate HTML table for PDF
      let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Pacientes - NeonDash</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #b45309; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th { background: #0f172a; color: white; padding: 10px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 30px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .total { font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header-info">
    <div>
      <h1>Relatório de Pacientes</h1>
      <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        ${includeContact ? "<th>Contato</th><th>CPF</th>" : ""}
        <th>Status</th>
        ${includeMetrics ? "<th>Consultas</th><th>Última Visita</th>" : ""}
      </tr>
    </thead>
    <tbody>
`;

      for (const p of dataToExport) {
        html += `
      <tr>
        <td>${p.nomeCompleto}</td>
        ${includeContact ? `<td>${p.telefone ? formatPhone(p.telefone) : "-"}</td><td>${p.cpf ? formatCPF(p.cpf) : "-"}</td>` : ""}
        <td>${p.status ?? "-"}</td>
        ${includeMetrics ? `<td>${p.totalConsultas ?? 0}</td><td>${formatDateBR(p.ultimaVisita ?? null)}</td>` : ""}
      </tr>
`;
      }

      html += `
    </tbody>
  </table>
  
  <p class="total">Total de pacientes: ${dataToExport.length}</p>
  
  <div class="footer">
    <p><strong>Aviso LGPD:</strong> Este documento contém dados pessoais protegidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018). 
    O uso desses dados é restrito às finalidades autorizadas pelo titular. Não compartilhe este documento sem autorização.</p>
    <p>NeonDash - Sistema de Gestão de Clínicas</p>
  </div>
</body>
</html>
`;

      return html;
    },
    []
  );

  const exportPDF = useCallback(
    async (patients: PatientExportData[], _filename = "pacientes", options: ExportOptions = {}) => {
      setIsExporting(true);
      setProgress(0);

      try {
        setProgress(30);

        const htmlContent = generatePDFContent(patients, options);

        setProgress(60);

        // Open print dialog with the HTML content
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to load then print
          printWindow.onload = () => {
            printWindow.print();
          };
        }

        setProgress(100);
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    [generatePDFContent]
  );

  return {
    exportCSV,
    exportPDF,
    isExporting,
    progress,
  };
}
