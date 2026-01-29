import { motion } from "framer-motion";
import { User, MapPin, Calendar, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ProfileCardProps {
  name: string;
  role: string;
  email?: string;
  imageUrl?: string;
  coverUrl?: string; // Optional custom cover
  badges?: string[];
  turma?: "neon_estrutura" | "neon_escala"; // Specific to schema
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
  role,
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
  // Determine gradient based on turma or default
  const gradientClass =
    turma === "neon_escala"
      ? "bg-gradient-to-r from-purple-500 to-pink-500"
      : turma === "neon_estrutura"
      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
      : "bg-gradient-to-r from-neutral-800 to-neutral-600"; // Default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full max-w-sm mx-auto", className)}
    >
      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Cover Image */}
        <div className={cn("h-32 w-full relative", gradientClass)}>
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Cover"
              className="w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <CardHeader className="relative px-6 pb-0">
          <div className="absolute -top-12 left-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="rounded-full p-1 bg-background shadow-lg"
            >
              <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          <div className="pt-14 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-2xl tracking-tight text-foreground">
                  {name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" /> {role}
                </p>
                {email && (
                  <p className="text-xs text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" /> {email}
                  </p>
                )}
              </div>
              {turma && (
                <Badge
                  variant={turma === "neon_escala" ? "default" : "secondary"}
                  className="uppercase text-[10px] tracking-wider"
                >
                  {turma.replace("_", " ")}
                </Badge>
              )}
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs rounded-full px-2"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        {stats.length > 0 && (
          <CardContent className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group cursor-default">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                    {stat.label}
                  </p>
                  <p className="font-bold text-lg text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        <CardFooter className="px-6 pb-6 pt-0">
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
        </CardFooter>
      </Card>
    </motion.div>
  );
}
