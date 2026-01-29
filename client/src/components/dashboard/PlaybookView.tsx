
import { trpc } from "@/lib/trpc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, PlayCircle, FileText, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PlaybookViewProps {
  turma?: "neon_estrutura" | "neon_escala";
}

export function PlaybookView({ turma }: PlaybookViewProps) {
  const { data: modules, isLoading, refetch } = trpc.playbook.getModules.useQuery({ turma });

  const toggleMutation = trpc.playbook.toggleItem.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => {
      toast.error("Erro ao atualizar progresso", { description: err.message });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />
      </div>
    );
  }

  // Calculate overall progress
  const totalItems = modules?.reduce((acc, m) => acc + m.items.length, 0) || 0;
  const completedItems = modules?.reduce((acc, m) => acc + m.items.filter(i => i.isCompleted).length, 0) || 0;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-white/10 md:col-span-2">
          <CardHeader className="pb-2">
             <CardTitle className="text-lg text-white">Seu Progresso</CardTitle>
             <CardDescription>Complete as etapas para avançar na jornada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{completedItems} de {totalItems} concluídos</span>
                  <span className="text-neon-purple font-bold">{Math.round(progressPercentage)}%</span>
               </div>
               <Progress value={progressPercentage} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-neon-purple to-neon-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Accordion */}
      <ScrollArea className="h-[calc(100vh-320px)] pr-4">
        <Accordion type="multiple" className="space-y-4">
          {modules?.map((module, index) => {
            const moduleTotal = module.items.length;
            const moduleCompleted = module.items.filter(i => i.isCompleted).length;
            const isModuleDone = moduleTotal > 0 && moduleTotal === moduleCompleted;

            return (
              <AccordionItem
                key={module.id}
                value={`item-${module.id}`}
                className="border border-white/10 rounded-xl bg-black/20 overflow-hidden data-[state=open]:bg-black/40 transition-colors"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-white/5">
                  <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold shadow-[0_0_10px_inset_transparent]",
                      isModuleDone
                        ? "bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20"
                        : "bg-white/5 border-white/20 text-gray-400"
                    )}>
                      {isModuleDone ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>

                    <div className="flex flex-col items-start gap-1 flex-1">
                       <span className={cn("font-semibold text-lg", isModuleDone ? "text-green-400" : "text-white")}>
                         {module.title}
                       </span>
                       {module.description && (
                         <span className="text-xs text-gray-500 text-left line-clamp-1">{module.description}</span>
                       )}
                    </div>

                    <div className="mr-4">
                      <Badge variant="outline" className="bg-black/50 border-white/10 text-xs">
                        {moduleCompleted}/{moduleTotal}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6 pt-2">
                   <div className="space-y-3 pl-12 border-l border-white/5 ml-4">
                      {module.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-colors",
                            item.isCompleted && "opacity-60"
                          )}
                        >
                           <Checkbox
                              id={`item-${item.id}`}
                              checked={item.isCompleted}
                              onCheckedChange={(checked) => {
                                toggleMutation.mutate({
                                  itemId: item.id,
                                  completed: !!checked
                                });
                              }}
                              className="mt-1 border-white/20 data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
                           />

                           <div className="flex-1 space-y-1">
                              <label
                                htmlFor={`item-${item.id}`}
                                className={cn(
                                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                  item.isCompleted ? "text-gray-500 line-through decoration-gray-600" : "text-gray-200"
                                )}
                              >
                                {item.title}
                              </label>

                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}

                              {item.contentUrl && (
                                <div className="pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10"
                                    onClick={() => window.open(item.contentUrl || '', '_blank')}
                                  >
                                    {item.type === 'video' ? <PlayCircle className="w-3 h-3 mr-2" /> : <ExternalLink className="w-3 h-3 mr-2" />}
                                    {item.type === 'video' ? 'Assistir' : 'Acessar Conteúdo'}
                                  </Button>
                                </div>
                              )}
                           </div>
                        </motion.div>
                      ))}

                      {module.items.length === 0 && (
                        <div className="text-sm text-gray-500 italic py-2">
                          Nenhum item nesta etapa.
                        </div>
                      )}
                   </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
