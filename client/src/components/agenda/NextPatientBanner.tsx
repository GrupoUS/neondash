import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NextPatientProps {
  name: string;
  procedure: string;
  time: string;
  room: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  className?: string;
}

export function NextPatientBanner({
  name,
  procedure,
  time,
  room,
  status,
  className,
}: NextPatientProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
        "bg-[#141820] border border-[#C6A665]/30 rounded-xl p-4 shadow-lg shadow-black/20",
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <h3 className="text-[#C6A665] font-mono text-lg font-bold uppercase tracking-wider shrink-0">
          Next Patient
        </h3>
        <div className="hidden md:block h-6 w-px bg-[#C6A665]/20" />
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-mono text-sm leading-relaxed">
          <span className="text-white font-semibold">NEXT: {name}</span>
          <span className="hidden md:inline">-</span>
          <span className="text-gray-300">{procedure}</span>
          <span className="text-[#C6A665] mx-1">|</span>
          <span className="text-gray-300">
            {time}, {room}
          </span>
        </div>
      </div>
      <Badge
        variant="outline"
        className="border-[#C6A665] text-[#C6A665] font-mono bg-[#C6A665]/5 shrink-0"
      >
        Status: {status}
      </Badge>
    </div>
  );
}
