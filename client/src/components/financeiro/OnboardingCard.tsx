import { Info, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { NeonCard } from "@/components/ui/neon-card";

interface OnboardingCardProps {
  title: string;
  steps: string[];
  storageKey: string;
  actionLabel?: string;
  onAction?: () => void;
  isActionLoading?: boolean;
}

export function OnboardingCard({
  title,
  steps,
  storageKey,
  actionLabel,
  onAction,
  isActionLoading,
}: OnboardingCardProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === "dismissed";
  });

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "dismissed");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <NeonCard className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-sm text-primary mb-2">{title}</h4>
          <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
            {steps.map((step, index) => (
              <li key={`step-${index + 1}`}>{step}</li>
            ))}
          </ol>
          {actionLabel && onAction && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={onAction}
              disabled={isActionLoading}
            >
              {isActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionLabel}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </NeonCard>
  );
}
