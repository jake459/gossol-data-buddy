import { type ReactNode, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

type Tone = "danger" | "warning" | "info" | "success";

const TONE_STYLE: Record<Tone, { icon: ReactNode; ring: string; btn: string }> = {
  danger: {
    icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
    ring: "from-rose-50 to-white",
    btn: "bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:opacity-95",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    ring: "from-amber-50 to-white",
    btn: "bg-gradient-to-b from-amber-500 to-amber-600 text-white hover:opacity-95",
  },
  info: {
    icon: <Info className="h-5 w-5 text-[oklch(0.46_0.18_258)]" />,
    ring: "from-[oklch(0.97_0.03_258)] to-white",
    btn: "bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-white",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    ring: "from-emerald-50 to-white",
    btn: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
  },
};

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  details?: ReactNode;
};

/**
 * useConfirm — promise-based confirmation modal hook.
 * Replaces native window.confirm() with an in-app modal.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm();
 *   if (await confirm({ title: "삭제할까요?", tone: "danger" })) { ... }
 *   // Render <ConfirmDialog /> once in the component tree.
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handle = (value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  };

  const tone = opts?.tone ?? "info";
  const style = TONE_STYLE[tone];

  const ConfirmDialog = () => (
    <Dialog open={open} onOpenChange={(o) => !o && handle(false)}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className={`space-y-1 border-b bg-gradient-to-br ${style.ring} px-6 py-5 text-left`}>
          <div className="flex items-center gap-2">
            {style.icon}
            <DialogTitle className="text-base font-bold">
              {opts?.title ?? "확인"}
            </DialogTitle>
          </div>
          {opts?.description && (
            <DialogDescription className="text-[12.5px] text-muted-foreground">
              {opts.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {opts?.details && (
          <div className="px-6 py-4 text-[13px] text-foreground">{opts.details}</div>
        )}
        <DialogFooter className="flex-row justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handle(false)}
            className="h-10 rounded-xl"
          >
            {opts?.cancelLabel ?? "취소"}
          </Button>
          <Button
            type="button"
            onClick={() => handle(true)}
            className={`h-10 rounded-xl text-sm font-semibold ${style.btn}`}
          >
            {opts?.confirmLabel ?? "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
