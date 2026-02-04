import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  start: z.string(), // ISO datetime
  end: z.string(), // ISO datetime
  startTime: z.string(), // HTML time input format HH:mm
  endTime: z.string(), // HTML time input format HH:mm
  allDay: z.boolean().default(false),
  location: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

// Event type matching the calendar
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
  isNeonEvent?: boolean;
}

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: { start: Date; end: Date; allDay?: boolean };
  event?: CalendarEvent; // Existing event for edit mode
  onSuccess?: () => void;
}

function formatTimeFromDate(date: Date): string {
  return (
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0")
  );
}

export function EventFormDialog({
  open,
  onOpenChange,
  defaultDate,
  event,
  onSuccess,
}: EventFormDialogProps) {
  const utils = trpc.useUtils();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const isEditMode = Boolean(event);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as unknown as undefined,
    defaultValues: {
      title: "",
      description: "",
      allDay: false,
      location: "",
      start: new Date().toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (event) {
        // Edit mode: populate with existing event
        form.reset({
          title: event.title || "",
          description: event.description || "",
          allDay: event.allDay || false,
          location: event.location || "",
          start: event.start.toISOString().split("T")[0],
          end: event.end.toISOString().split("T")[0],
          startTime: formatTimeFromDate(event.start),
          endTime: formatTimeFromDate(event.end),
        });
      } else if (defaultDate) {
        // Create mode with slot
        form.reset({
          title: "",
          description: "",
          allDay: defaultDate.allDay || false,
          location: "",
          start: defaultDate.start.toISOString().split("T")[0],
          end: defaultDate.end.toISOString().split("T")[0],
          startTime: formatTimeFromDate(defaultDate.start),
          endTime: formatTimeFromDate(defaultDate.end),
        });
      } else {
        // Create mode without slot
        form.reset({
          title: "",
          description: "",
          allDay: false,
          location: "",
          start: new Date().toISOString().split("T")[0],
          end: new Date().toISOString().split("T")[0],
          startTime: "09:00",
          endTime: "10:00",
        });
      }
    }
  }, [open, defaultDate, event, form]);

  const createEventMutation = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento criado! O novo evento foi adicionado à sua agenda.");
      utils.calendar.getEvents.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao criar evento: ${error.message}`);
    },
  });

  const updateEventMutation = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      utils.calendar.getEvents.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar evento: ${error.message}`);
    },
  });

  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento excluído com sucesso.");
      utils.calendar.getEvents.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir evento: ${error.message}`);
    },
  });

  const onSubmit = (values: EventFormValues) => {
    // Combine date and time
    const startDate = new Date(`${values.start}T${values.startTime}:00`);
    const endDate = new Date(`${values.end}T${values.endTime}:00`);

    const payload = {
      title: values.title,
      description: values.description,
      location: values.location,
      allDay: values.allDay,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    if (isEditMode && event) {
      updateEventMutation.mutate({ id: event.id, ...payload });
    } else {
      createEventMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (event) {
      deleteEventMutation.mutate({ id: event.id });
    }
    setShowDeleteConfirm(false);
  };

  const isPending =
    createEventMutation.isPending || updateEventMutation.isPending || deleteEventMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#141820] border-[#C6A665]/30 text-slate-200 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#C6A665] font-serif text-xl">
              {isEditMode ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
              <FormField
                control={form.control as never}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Consulta Dr. Silva"
                        className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as never}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Início</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as never}
                  name="end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fim</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Fim</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as never}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Sala 1"
                        className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as never}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes do agendamento..."
                        className="bg-[#0B0E14] border-slate-700 focus:border-[#C6A665] min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as never}
                name="allDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-800 p-3 shadow-sm bg-[#0B0E14]">
                    <div className="space-y-0.5">
                      <FormLabel>Dia Inteiro</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isPending}
                    className="sm:mr-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-slate-800 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#C6A665] hover:bg-[#C6A665]/90 text-black font-bold"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Salvar Alterações" : "Criar Evento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#141820] border-[#C6A665]/30 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#C6A665]">Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir "{event?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteEventMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
