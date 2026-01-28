
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { NeonCard } from "@/components/ui/neon-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function TaskBoard({ mentoradoId }: { mentoradoId?: number }) {
  const [newTask, setNewTask] = useState("");
  const utils = trpc.useContext();
  
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({ mentoradoId }, { enabled: !!mentoradoId });
  
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setNewTask("");
    },
  });

  const toggleTask = trpc.tasks.toggle.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    createTask.mutate({ title: newTask, category: "geral", mentoradoId });
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;
  }

  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono text-neon-gold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          TAREFAS [DBE]
        </h2>
      </div>

      <NeonCard className="flex-1 flex flex-col overflow-hidden bg-slate-950/80 border-slate-800">
        <Tabs defaultValue="todo" className="flex-1 flex flex-col p-4 w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-900 border border-slate-800">
            <TabsTrigger value="todo" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue font-mono">
              A Fazer ({todoTasks.length})
            </TabsTrigger>
            <TabsTrigger value="done" className="data-[state=active]:bg-neon-gold/20 data-[state=active]:text-neon-gold font-mono">
              Concluídas ({doneTasks.length})
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleCreate} className="flex gap-2 mb-4">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nova tarefa..."
              className="bg-slate-900 border-slate-800 focus:border-neon-blue font-mono text-sm"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={createTask.isPending}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          <TabsContent value="todo" className="flex-1 mt-0">
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800 group hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleTask.mutate({ id: task.id })}
                        className="border-slate-600 data-[state=checked]:bg-neon-gold data-[state=checked]:text-black"
                      />
                      <span className="text-sm text-slate-300 font-mono">{task.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask.mutate({ id: task.id })}
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-500 font-mono text-sm">
                    Nenhuma tarefa pendente
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="done" className="flex-1 mt-0">
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-3 opacity-60">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleTask.mutate({ id: task.id })}
                        className="border-slate-600"
                      />
                      <span className="text-sm text-slate-400 font-mono line-through">{task.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask.mutate({ id: task.id })}
                      className="h-8 w-8 text-slate-600 hover:text-red-500 hover:bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </NeonCard>
    </div>
  );
}
