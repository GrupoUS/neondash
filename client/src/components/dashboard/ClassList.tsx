
import { trpc } from "@/lib/trpc";
import { NeonCard } from "@/components/ui/neon-card";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle, Clock, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ClassList({ mentoradoId }: { mentoradoId?: number }) {
  const utils = trpc.useContext();
  const { data: classes, isLoading } = trpc.classes.list.useQuery({ mentoradoId }, { enabled: !!mentoradoId });
  
  const markWatched = trpc.classes.markWatched.useMutation({
    onSuccess: () => utils.classes.list.invalidate(),
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;
  }

  const sortedClasses = classes || [];
  const completedCount = sortedClasses.filter(c => c.watched).length;
  const progress = sortedClasses.length > 0 ? (completedCount / sortedClasses.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono text-purple-400 flex items-center gap-2">
          <Video className="w-5 h-5" />
          AULAS E ENCONTROS [DBE]
        </h2>
        <span className="text-xs font-mono text-slate-400">
          {completedCount}/{sortedClasses.length} completed
        </span>
      </div>

      <NeonCard className="flex-1 flex flex-col overflow-hidden bg-slate-950/80 border-slate-800 p-4">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-900 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-neon-blue transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {sortedClasses.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start justify-between p-4 rounded-lg border transition-all duration-300",
                  item.watched 
                    ? "bg-slate-950/30 border-slate-800/50 opacity-60" 
                    : "bg-slate-900/50 border-slate-700 hover:border-purple-500/50"
                )}
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-mono uppercase",
                      item.type === 'aula' ? "bg-blue-500/10 text-blue-400" :
                      item.type === 'encontro' ? "bg-purple-500/10 text-purple-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Data a definir'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  
                  {item.url && !item.watched && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neon-blue mt-2 hover:underline"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Assistir Agora
                    </a>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={item.watched || markWatched.isPending}
                  onClick={() => markWatched.mutate({ classId: item.id, mentoradoId })} // Pass mentoradoId
                  className={cn(
                    "flex-shrink-0 h-8 self-center",
                    item.watched 
                      ? "text-emerald-500 hover:text-emerald-500 hover:bg-transparent cursor-default" 
                      : "text-slate-500 hover:text-purple-400 hover:bg-purple-950/20"
                  )}
                >
                  {item.watched ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </Button>
              </div>
            ))}
            
            {sortedClasses.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-mono text-sm">
                Nenhuma aula disponível
              </div>
            )}
          </div>
        </ScrollArea>
      </NeonCard>
    </div>
  );
}
