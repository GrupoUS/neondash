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
  baileys: string;
  zapi: string;
  highlightBaileys?: boolean;
};

const PROVIDER_ROWS: ProviderComparisonRow[] = [
  {
    feature: "Custo",
    baileys: "Grátis (Open Source)",
    zapi: "Pago (Mensalidade)",
    highlightBaileys: true,
  },
  {
    feature: "Estabilidade",
    baileys: "Média (Depende da conexão do celular)",
    zapi: "Alta",
  },
  {
    feature: "Requisito",
    baileys: "Celular conectado e servidor ativo",
    zapi: "Celular conectado",
  },
  {
    feature: "Risco de Banimento",
    baileys: "Médio (Se abusar de envios)",
    zapi: "Baixo",
  },
  {
    feature: "Multimídia",
    baileys: "Sim (Texto, Imagem, Áudio)",
    zapi: "Sim",
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
            <TableHead className="text-emerald-600 font-semibold">Baileys (Self-Hosted)</TableHead>
            <TableHead>Z-API</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {PROVIDER_ROWS.map((row) => (
            <TableRow key={row.feature}>
              <TableCell className="font-medium">{row.feature}</TableCell>
              <TableCell
                className={row.highlightBaileys ? "text-emerald-600 font-semibold" : undefined}
              >
                {row.baileys}
              </TableCell>
              <TableCell>{row.zapi}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProviderComparisonTable;
