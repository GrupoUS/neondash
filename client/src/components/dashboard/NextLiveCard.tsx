import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Edit2, Video } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Schema for the edit form
const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  date: z.string().min(1, "Data/Hora são obrigatórios"),
  url: z.string().url("URL inválida"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NextLiveCardProps {
  isAdmin?: boolean;
}

export function NextLiveCard({ isAdmin = false }: NextLiveCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const utils = trpc.useUtils();

  // Fetch the next live session
  const { data: session, isLoading } = trpc.classes.getNextLive.useQuery();

  // Mutation to update
  const upsertMutation = trpc.classes.upsertNextLive.useMutation({
    onSuccess: () => {
      utils.classes.getNextLive.invalidate();
      setIsEditOpen(false);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      url: "",
      description: "",
    },
  });

  // Prepare form when opening dialog
  const handleEditClick = () => {
    if (session) {
      form.reset({
        title: session.title,
        date: session.date ? new Date(session.date).toISOString().slice(0, 16) : "", // datetime-local format
        url: session.url || "",
        description: session.description || "",
      });
    }
    setIsEditOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    upsertMutation.mutate({
      id: session?.id,
      ...values,
    });
  };

  if (isLoading) {
    return <div className="h-48 w-full bg-slate-800/50 animate-pulse rounded-2xl" />;
  }

  // If no session and not admin, show nothing or placeholder
  if (!session && !isAdmin) return null;

  const sessionDate = session?.date ? new Date(session.date) : null;
  const isLiveNow =
    sessionDate &&
    new Date() >= sessionDate &&
    new Date() <= new Date(sessionDate.getTime() + 1000 * 60 * 90); // Assumes 90 min duration

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-slate-900 via-slate-900 to-black shadow-xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -m-16 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl" />

      <div className="relative flex flex-col md:flex-row gap-6 p-6">
        {/* Left: Image/Thumbnail */}
        <div className="relative shrink-0 w-full md:w-32 h-32 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
          {/* Placeholder or Image */}
          <Video className="w-12 h-12 text-[#D4AF37]" />
          {/* If we had an image URL properly stored: 
               <img src={session.imageUrl} className="absolute inset-0 w-full h-full object-cover" /> 
           */}

          {isLiveNow && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              LIVE NOW
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {sessionDate && (
            <div className="flex items-center gap-2 text-[#D4AF37] font-medium text-sm">
              <Calendar className="w-4 h-4" />
              {format(sessionDate, "dd/MM/yyyy", { locale: ptBR })}
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <Clock className="w-4 h-4" />
              {format(sessionDate, "HH:mm")}
            </div>
          )}

          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
            {session?.title || "Nenhuma aula agendada"}
          </h3>

          <p className="text-slate-400 text-sm line-clamp-2">
            {session?.description ||
              (isAdmin ? "Configure a próxima aula..." : "Aguarde novidades!")}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-3 justify-center min-w-[140px]">
          {session?.url && (
            <Button
              asChild
              className={cn(
                "w-full font-bold shadow-lg transition-all hover:scale-105",
                isLiveNow
                  ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-none"
                  : "bg-[#D4AF37] hover:bg-[#F2D06B] text-slate-900 border-none"
              )}
            >
              <a href={session.url} target="_blank" rel="noopener noreferrer">
                {isLiveNow ? "Entrar na Sessão" : "Acessar Link"}
              </a>
            </Button>
          )}

          {isAdmin && (
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Configurar Próxima Aula</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Mentoria Coletiva..."
                              className="bg-slate-950 border-slate-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-slate-950 border-slate-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link (Zoom/Meet)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://zoom.us/..."
                              className="bg-slate-950 border-slate-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição / Nome do Mentor</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Dra. Sacha Gualberto"
                              className="bg-slate-950 border-slate-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#D4AF37] text-slate-900 hover:bg-[#F2D06B]"
                    >
                      Salvar
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
