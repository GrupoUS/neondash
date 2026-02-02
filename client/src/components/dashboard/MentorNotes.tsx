import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export function MentorNotes() {
  const [note, setNote] = useState("");
  // const trpcUtils = trpc.useContext();

  const { mutate, isPending } = trpc.interacoes.createNote.useMutation({
    onSuccess: () => {
      toast.success("Nota salva", {
        description: "A anotação foi salva com sucesso.",
      });
      setNote("");
      // trpcUtils.interacoes.getNotes.invalidate();
    },
    onError: () => {
      toast.error("Erro", {
        description: "Não foi possível salvar a nota.",
      });
    },
  });

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
      <Textarea
        placeholder="Adicionar notas..."
        className="bg-transparent border-none resize-none focus-visible:ring-0 text-slate-300 placeholder:text-slate-600 min-h-[100px]"
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
  );
}
