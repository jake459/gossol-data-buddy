import { useState } from "react";
import { ChevronDown, HeadphonesIcon, Check, Bell } from "lucide-react";
import { NotificationsModal } from "@/components/NotificationsModal";
import { Button } from "@/components/ui/button";
import { DEMO_BRANCHES } from "@/lib/demoData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DemoTopBar() {
  const [selectedId, setSelectedId] = useState(DEMO_BRANCHES[0].id);
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const selected = DEMO_BRANCHES.find((b) => b.id === selectedId)!;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-white/85 px-4 py-3 backdrop-blur-xl ring-1 ring-[oklch(0.93_0.03_258)]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[oklch(0.96_0.03_258)]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[oklch(0.6_0.2_258)] to-[oklch(0.4_0.18_265)] text-[11px] font-black text-white shadow-sm">
          G
        </span>
        <span className="truncate text-sm font-semibold text-foreground">{selected.name}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[oklch(0.55_0.18_258)]" />
      </button>
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">데모</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="알림"
          onClick={() => setNotiOpen(true)}
          className="relative text-[oklch(0.55_0.2_258)] hover:bg-[oklch(0.96_0.04_258)]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.2_30)]" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="고객센터"
          onClick={() => setSupportOpen(true)}
          className="text-[oklch(0.55_0.2_258)] hover:bg-[oklch(0.96_0.04_258)]"
        >
          <HeadphonesIcon className="h-5 w-5" />
        </Button>
      </div>

      <NotificationsModal open={notiOpen} onOpenChange={setNotiOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>지점 선택</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1.5">
            {DEMO_BRANCHES.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(b.id);
                    setOpen(false);
                    toast.success(`${b.name}으로 전환했어요`);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-accent",
                    b.id === selectedId && "border-brand bg-brand/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{b.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{b.address}</p>
                  </div>
                  {b.id === selectedId && <Check className="h-4 w-4 text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>고객센터 (데모)</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            데모 모드에서는 문의 전송이 비활성화되어 있어요. 회원가입 후 1:1 문의를 이용해 주세요.
          </p>
          <div className="space-y-2 text-[13px]">
            <p>📞 1588-0000 (평일 10–18시)</p>
            <p>✉️ help@gossol.kr</p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
