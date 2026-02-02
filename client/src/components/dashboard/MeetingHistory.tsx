import { Button } from "@/components/ui/button";

interface Meeting {
  id: number;
  createdAt: Date;
  duracao: number | null;
  notas: string | null;
}

interface MeetingHistoryProps {
  meetings: Meeting[];
}

export function MeetingHistory({ meetings }: MeetingHistoryProps) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 text-center text-slate-500 text-sm">
        Nenhuma reunião registrada recentemente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
        >
          <div>
            <div className="text-slate-200 text-sm font-medium">
              {new Date(meeting.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="text-xs text-slate-500">
              {meeting.duracao ? `Duração: ${meeting.duracao}m` : "Sem duração"}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
          >
            Ver Resumo
          </Button>
        </div>
      ))}
    </div>
  );
}
