import { useEffect, useState } from "react";
import { ChevronDown, HeadphonesIcon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchSwitcher } from "@/components/BranchSwitcher";
import { SupportModal } from "@/components/SupportModal";
import { NotificationsModal } from "@/components/NotificationsModal";
import { useBranch } from "@/hooks/useBranch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function TopBar({
  branchName,
  onSupportClick,
}: {
  branchName?: string;
  /** 외부에서 가로채고 싶은 경우에만 전달. 미지정 시 내부 고객센터 모달이 열림. */
  onSupportClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const { selected, branches } = useBranch();
  const label = branchName ?? selected?.name ?? (branches.length === 0 ? "지점 없음" : "지점 선택");

  const handleSupport = () => {
    if (onSupportClick) onSupportClick();
    else setSupportOpen(true);
  };

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
        <span className="truncate text-sm font-semibold text-foreground">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[oklch(0.55_0.18_258)]" />
      </button>
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="알림"
          onClick={() => setNotiOpen(true)}
          className="relative text-[oklch(0.55_0.2_258)] hover:bg-[oklch(0.96_0.04_258)] hover:text-[oklch(0.45_0.2_258)]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[oklch(0.6_0.2_30)]" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="고객센터"
          onClick={handleSupport}
          className="text-[oklch(0.55_0.2_258)] hover:bg-[oklch(0.96_0.04_258)] hover:text-[oklch(0.45_0.2_258)]"
        >
          <HeadphonesIcon className="h-5 w-5" />
        </Button>
      </div>
      <BranchSwitcher open={open} onOpenChange={setOpen} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
      <NotificationsModal open={notiOpen} onOpenChange={setNotiOpen} />
    </header>
  );
}
