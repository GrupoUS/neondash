import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  totalAppointments: number;
  expectedRevenue: number;
  newPatients: number;
  className?: string;
}

export function QuickStats({
  totalAppointments,
  expectedRevenue,
  newPatients,
  className,
}: QuickStatsProps) {
  return (
    <Card className={cn("bg-[#141820] border-[#C6A665]/30 shadow-lg shadow-black/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[#C6A665] font-mono text-xl">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatItem label="Total Appointments" value={totalAppointments} />
        <StatItem
          label="Expected Revenue"
          value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            expectedRevenue
          )}
          highlight
        />
        <StatItem label="New Patients" value={newPatients} />
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#0B0E14] border border-[#C6A665]/20 rounded-lg p-4 text-center">
      <p className="text-muted-foreground text-sm font-mono mb-1">{label}:</p>
      <p
        className={cn("text-2xl font-bold font-mono", highlight ? "text-[#C6A665]" : "text-white")}
      >
        {value}
      </p>
    </div>
  );
}
