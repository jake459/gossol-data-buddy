import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { InfoModal } from "@/components/InfoModal";

/**
 * Global validation/required-field warning modal.
 * Use `notifyValidation("...message...")` from anywhere to show a centered modal
 * instead of a corner toast. Mount <ValidationModalHost /> once near the app root.
 */

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function notifyValidation(message: string, _opts?: { title?: string }) {
  listeners.forEach((l) => l(message));
}

export function ValidationModalHost() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const handler: Listener = (m) => {
      setMsg(m);
      setOpen(true);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <InfoModal
      open={open}
      onOpenChange={setOpen}
      title="입력 정보를 확인해 주세요"
      description={msg}
      tone="warning"
      icon={<AlertTriangle className="h-4 w-4" />}
      actionLabel="알겠어요"
    />
  );
}
