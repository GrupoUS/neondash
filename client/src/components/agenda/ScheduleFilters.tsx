import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ScheduleFiltersProps {
  className?: string;
}

export function ScheduleFilters({ className }: ScheduleFiltersProps) {
  return (
    <Card className={cn("bg-[#141820] border-[#C6A665]/30 shadow-lg shadow-black/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[#C6A665] font-mono text-xl">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground font-mono">Professional</Label>
          <Select defaultValue="all">
            <SelectTrigger className="bg-[#0B0E14] border-[#C6A665]/20 text-white font-mono">
              <SelectValue placeholder="Select Professional" />
            </SelectTrigger>
            <SelectContent className="bg-[#141820] border-[#C6A665]/20 text-white">
              <SelectItem value="all">All Professionals</SelectItem>
              <SelectItem value="silva">Dr. A. Silva</SelectItem>
              <SelectItem value="lee">Dr. M. Lee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground font-mono">Room</Label>
          <Select defaultValue="all">
            <SelectTrigger className="bg-[#0B0E14] border-[#C6A665]/20 text-white font-mono">
              <SelectValue placeholder="Select Room" />
            </SelectTrigger>
            <SelectContent className="bg-[#141820] border-[#C6A665]/20 text-white">
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="1">Room 1</SelectItem>
              <SelectItem value="2">Room 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
