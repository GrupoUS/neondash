import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface Note {
  id: number;
  createdAt: Date;
  notas: string | null;
}

interface MentorNotesProps {
  existingNotes?: Note[];
}

export function MentorNotes({ existingNotes = [] }: MentorNotesProps) {
  const [note, setNote] = useState("");
  const trpcUtils = trpc.useUtils();

  const { mutate, isPending } = trpc.interacoes.createNote.useMutation({
    onSuccess: () => {
      toast.success("Nota salva", {
        description: "A anotação foi salva com sucesso.",
      });
      setNote("");
      // Invalidate to refresh the overview stats
      trpcUtils.mentorados.getOverviewStats.invalidate();
    },
    onError: () => {
      toast.error("Erro", {
        description: "Não foi possível salvar a nota.",
      });
    },
  });

  return (
    <div className="space-y-3">
      {/* Existing notes */}
      {existingNotes.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {existingNotes.map((n) => (
            <div
              key={n.id}
              className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm"
            >
              <p className="text-slate-300">{n.notas}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(n.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New note input */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
        <Textarea
          placeholder="Adicionar notas..."
          className="bg-transparent border-none resize-none focus-visible:ring-0 text-slate-300 placeholder:text-slate-600 min-h-[80px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-[#D4AF37] text-slate-900 hover:bg-[#B5952F] font-semibold"
            onClick={() => mutate({ content: note })}
            disabled={!note.trim() || isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Notas
          </Button>
        </div>
      </div>
    </div>
  );
}
