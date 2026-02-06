import type React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FieldDisplayProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  editComponent: React.ReactNode;
}

export function FieldDisplay({
  label,
  value,
  valueClassName,
  icon,
  isEditing,
  editComponent,
}: FieldDisplayProps) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        {label}
      </Label>
      {isEditing ? (
        editComponent
      ) : (
        <div
          className={cn(
            "text-sm font-medium text-foreground flex items-center gap-2 p-1",
            valueClassName
          )}
        >
          {icon}
          {value}
        </div>
      )}
    </div>
  );
}
