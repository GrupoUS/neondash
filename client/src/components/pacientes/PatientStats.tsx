import { motion } from "framer-motion";
import { Activity, Calendar, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PatientStatsProps {
  total: number;
  active: number;
  newThisMonth: number;
  upcomingAppointments: number;
}

export function PatientStats({
  total,
  active,
  newThisMonth,
  upcomingAppointments,
}: PatientStatsProps) {
  const stats = [
    {
      label: "Total de Pacientes",
      value: total,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Ativos",
      value: active,
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Novos (Mês)",
      value: newThisMonth,
      icon: UserPlus,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Consultas Próximas",
      value: upcomingAppointments,
      icon: Calendar,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border/50 hover:border-border transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
