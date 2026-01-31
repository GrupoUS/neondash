import { motion } from "framer-motion";
import { Mail, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoCardContent, BentoCardFooter } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProfileCardProps {
  name: string;
  jobTitle: string;
  email?: string;
  imageUrl?: string;
  coverUrl?: string; // Optional custom cover
  badges?: string[];
  turma?: "neon";
  stats?: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }[];
  onAction?: () => void;
  actionLabel?: string;
  footer?: React.ReactNode; // Custom footer content
  className?: string;
}

export function ProfileCard({
  name,
  jobTitle,
  email,
  imageUrl,
  coverUrl,
  badges = [],
  turma,
  stats = [],
  onAction,
  actionLabel = "View Profile",
  footer,
  className,
}: ProfileCardProps) {
  // Gradient for neon turma
  const gradientClass = turma
    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
    : "bg-gradient-to-r from-neutral-800 to-neutral-600";

  return (
    <BentoCard
      className={cn("w-full max-w-sm mx-auto p-0 overflow-hidden group", className)}
      delay={0.1}
    >
      {/* Cover Image */}
      <div className={cn("h-32 w-full relative", gradientClass)}>
        {coverUrl && (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="relative px-6 pb-0 -mt-12">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-full p-1 bg-background shadow-lg inline-block"
        >
          <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
            <AvatarImage src={imageUrl} alt={name} className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="pt-4 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-2xl tracking-tight text-foreground group-hover:text-neon-purple transition-colors">
                {name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-1">
                <User className="w-3 h-3" /> {jobTitle}
              </p>
              {email && (
                <p className="text-xs text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {email}
                </p>
              )}
            </div>
            {turma && (
              <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                {turma.replace("_", " ")}
              </Badge>
            )}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs rounded-full px-2">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <BentoCardContent className="px-6 py-4">
          <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group/stat cursor-default">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 group-hover/stat:text-primary transition-colors">
                  {stat.label}
                </p>
                <p className="font-bold text-lg text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </BentoCardContent>
      )}

      <BentoCardFooter className="px-6 pb-6 pt-0 border-t-0">
        {footer ? (
          footer
        ) : (
          <Button
            onClick={onAction}
            className="w-full font-semibold shadow-md hover:shadow-lg transition-all"
            variant="default"
          >
            {actionLabel}
          </Button>
        )}
      </BentoCardFooter>
    </BentoCard>
  );
}
