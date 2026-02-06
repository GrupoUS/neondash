import { format } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, Clock, FileText, Mail, MessageSquare, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadTimelineProps {
  whatsappMessages: any[]; // Define proper type
  data: any; // Define proper type with interactions
}

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const getInteractionIcon = (type: string) => {
  switch (type) {
    case "ligacao":
      return <Phone className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "whatsapp":
      return <MessageSquare className="h-4 w-4" />;
    case "reuniao":
      return <Calendar className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function LeadTimeline({ whatsappMessages, data }: LeadTimelineProps) {
  return (
    <motion.div
      className="relative border-l-2 border-border/30 ml-4 space-y-8 min-h-[200px]"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* WhatsApp Messages Section */}
      {whatsappMessages.length > 0 && (
        <motion.div variants={sectionVariants} className="relative pl-8">
          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background shadow-md z-10" />
          <div className="space-y-1 mb-4">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Histórico WhatsApp
            </p>
            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              {whatsappMessages.length} mensagem(ns)
            </span>
          </div>

          <div className="space-y-3">
            {whatsappMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-3 rounded-xl border text-sm transition-all hover:shadow-sm",
                  msg.direction === "outbound"
                    ? "bg-emerald-500/5 border-emerald-500/20 ml-6"
                    : "bg-card border-border/60 mr-6"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5 capitalize font-bold",
                      msg.direction === "outbound"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    )}
                  >
                    {msg.direction === "outbound" ? "Enviada" : "Recebida"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                  {msg.isFromAi === "sim" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    >
                      IA
                    </Badge>
                  )}
                  {msg.status && (
                    <span
                      className={cn(
                        "text-[10px] ml-auto font-medium",
                        msg.status === "read"
                          ? "text-blue-500"
                          : msg.status === "delivered"
                            ? "text-emerald-500"
                            : msg.status === "failed"
                              ? "text-destructive"
                              : "text-muted-foreground"
                      )}
                    >
                      {msg.status === "read" && "✓✓ Lida"}
                      {msg.status === "delivered" && "✓✓ Entregue"}
                      {msg.status === "sent" && "✓ Enviada"}
                      {msg.status === "pending" && "◷ Pendente"}
                      {msg.status === "failed" && "⚠ Falhou"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interactions */}
      {data.interacoes
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((interaction: any) => (
          <motion.div key={interaction.id} variants={sectionVariants} className="relative pl-8">
            <div className="absolute -left-[13px] top-0 bg-card p-1.5 rounded-full border border-border text-muted-foreground shadow-sm z-10">
              {getInteractionIcon(interaction.tipo)}
            </div>
            <div className="space-y-2 pb-4 border-b border-border/30 last:border-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="capitalize text-[11px] h-5 px-2 font-bold bg-muted/20"
                  >
                    {interaction.tipo}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date(interaction.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
                {interaction.duracao && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-full border border-border/30">
                    <Clock className="h-3 w-3" /> {interaction.duracao}
                  </span>
                )}
              </div>

              {interaction.notas && (
                <div className="bg-muted/10 p-3 rounded-lg text-sm whitespace-pre-line border border-border/20 text-foreground/80 leading-relaxed italic">
                  "{interaction.notas}"
                </div>
              )}
            </div>
          </motion.div>
        ))}

      {/* Creation Event */}
      <motion.div variants={sectionVariants} className="relative pl-8">
        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background shadow-md z-10" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">Lead criado</p>
          <span className="text-xs text-muted-foreground font-mono">
            {format(new Date(data.lead.createdAt), "dd/MM/yyyy 'às' HH:mm")}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
