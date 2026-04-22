import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Generic informational modal used in place of "준비 중" toasts and
 * for surfacing helpful explanations on placeholder actions.
 */
export function InfoModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  actionLabel = "확인",
  onAction,
  tone = "brand",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "brand" | "warning" | "success" | "neutral";
}) {
  const tones: Record<typeof tone, string> = {
    brand: "from-[oklch(0.97_0.03_258)] to-white text-[oklch(0.32_0.16_263)]",
    warning: "from-[oklch(0.98_0.04_78)] to-white text-[oklch(0.45_0.15_78)]",
    success: "from-[oklch(0.97_0.04_158)] to-white text-[oklch(0.4_0.15_158)]",
    neutral: "from-[oklch(0.97_0.005_260)] to-white text-foreground",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className={`space-y-1 border-b bg-gradient-to-br px-6 py-5 text-left ${tones[tone]}`}>
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-[12.5px] text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children && <div className="px-6 py-5 text-[13px] leading-relaxed text-foreground">{children}</div>}
        <DialogFooter className="border-t bg-muted/30 px-6 py-3">
          <Button
            type="button"
            onClick={() => {
              onAction?.();
              onOpenChange(false);
            }}
            className="h-10 rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-sm font-semibold"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
