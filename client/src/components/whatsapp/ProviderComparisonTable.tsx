import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderComparisonRow = {
  feature: string;
  zapi: string;
  meta: string;
  baileys: string;
  highlightBaileys?: boolean;
};

const PROVIDER_ROWS: ProviderComparisonRow[] = [
  {
    feature: "Custo",
    zapi: "Pago (Mensalidade)",
    meta: "Pago (Por conversa)",
    baileys: "Grátis (Open Source)",
    highlightBaileys: true,
  },
  {
    feature: "Estabilidade",
    zapi: "Alta",
    meta: "Muito Alta",
    baileys: "Média (Depende da conexão do celular)",
  },
  {
    feature: "Requisito",
    zapi: "Celular conectado",
    meta: "Nenhum (Cloud)",
    baileys: "Celular conectado e servidor ativo",
  },
  {
    feature: "Risco de Banimento",
    zapi: "Baixo",
    meta: "Nulo (Oficial)",
    baileys: "Médio (Se abusar de envios)",
  },
  {
    feature: "Multimídia",
    zapi: "Sim",
    meta: "Sim",
    baileys: "Sim (Texto, Imagem, Áudio)",
  },
];

export function ProviderComparisonTable() {
  return (
    <div className="mt-8 border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-3 border-b">
        <h3 className="font-medium text-sm">Comparativo de Provedores</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recurso</TableHead>
            <TableHead>Z-API</TableHead>
            <TableHead>Meta Cloud API</TableHead>
            <TableHead className="text-emerald-600 font-semibold">Baileys (Self-Hosted)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {PROVIDER_ROWS.map((row) => (
            <TableRow key={row.feature}>
              <TableCell className="font-medium">{row.feature}</TableCell>
              <TableCell>{row.zapi}</TableCell>
              <TableCell>{row.meta}</TableCell>
              <TableCell
                className={row.highlightBaileys ? "text-emerald-600 font-semibold" : undefined}
              >
                {row.baileys}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProviderComparisonTable;
