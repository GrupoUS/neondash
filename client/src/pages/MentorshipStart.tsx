
import { MentorshipContent } from "@/components/landing/MentorshipContent";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function MentorshipStart() {
  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-foreground">
      {/* Simple Header for navigation back */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-paper/80 backdrop-blur-md border-b border-neon-border/50 sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <Link href="/">
                <div className="cursor-pointer flex items-center gap-3">
                    <img
                        src="/brand/neon-symbol-official.png"
                        alt="Neon"
                        className="w-8 h-8 object-contain"
                    />
                    <div>
                        <span className="font-bold text-xl tracking-tight text-neon-blue-dark block leading-none">
                        NEON
                        </span>
                        <span className="text-[9px] text-neon-blue-medium uppercase tracking-[0.25em] font-mono font-medium">
                        Comece Aqui
                        </span>
                    </div>
                </div>
            </Link>
        </div>
        <div>
            <Link href="/dashboard">
                <Button variant="outline" className="border-neon-blue text-neon-blue hover:bg-neon-blue/10">
                    Ir para Dashboard
                </Button>
            </Link>
        </div>
      </header>

      <main className="flex-1">
        <MentorshipContent />
      </main>
    </div>
  );
}
