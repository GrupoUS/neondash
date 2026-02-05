import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsData {
  faturamento: number;
  leads: number;
  procedimentos: number;
  lucro?: number;
  postsFeed?: number;
  stories?: number;
}

interface ComparativeRadarProps {
  userMetrics: MetricsData | null;
  turmaAverage: Partial<MetricsData> | null;
}

export function ComparativeRadar({ userMetrics, turmaAverage }: ComparativeRadarProps) {
  if (!userMetrics || !turmaAverage) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparativo com Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-slate-400">
            Dados insuficientes para comparativo
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normalize data to 0-100 scale for radar visualization
  const normalizeValue = (value: number, average: number | undefined): number => {
    if (!average || average === 0) return 0;
    return Math.min((value / (average * 1.5)) * 100, 100);
  };

  const radarData = [
    {
      subject: "Faturamento",
      voce: normalizeValue(userMetrics.faturamento, turmaAverage.faturamento),
      turma: 66.67, // Average always at 66.67% of max (represents 1x average on 1.5x scale)
    },
    {
      subject: "Lucro",
      voce: normalizeValue(userMetrics.lucro ?? 0, turmaAverage.lucro),
      turma: 66.67,
    },
    {
      subject: "Leads",
      voce: normalizeValue(userMetrics.leads, turmaAverage.leads),
      turma: 66.67,
    },
    {
      subject: "Procedimentos",
      voce: normalizeValue(userMetrics.procedimentos, turmaAverage.procedimentos),
      turma: 66.67,
    },
    {
      subject: "Posts",
      voce: normalizeValue(userMetrics.postsFeed ?? 0, turmaAverage.postsFeed),
      turma: 66.67,
    },
    {
      subject: "Stories",
      voce: normalizeValue(userMetrics.stories ?? 0, turmaAverage.stories),
      turma: 66.67,
    },
  ];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Comparativo com Turma</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} outerRadius={90}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Você"
              dataKey="voce"
              stroke="var(--color-neon-blue)"
              fill="var(--color-neon-blue)"
              fillOpacity={0.4}
            />
            <Radar
              name="Média Turma"
              dataKey="turma"
              stroke="var(--color-neon-gold)"
              fill="var(--color-neon-gold)"
              fillOpacity={0.2}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
