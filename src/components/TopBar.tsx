import { useState } from "react";
import { ChevronDown, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BranchSwitcher } from "@/components/BranchSwitcher";
import { useBranch } from "@/hooks/useBranch";

export function TopBar({
  branchName,
  onSupportClick,
}: {
  branchName?: string;
  onSupportClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { selected, branches } = useBranch();
  const label = branchName ?? selected?.name ?? (branches.length === 0 ? "지점 없음" : "지점 선택");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent"
      >
        <span className="truncate text-sm font-semibold text-foreground">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <Button type="button" variant="ghost" size="icon" aria-label="고객센터" onClick={onSupportClick}>
        <HeadphonesIcon className="h-5 w-5" />
      </Button>
      <BranchSwitcher open={open} onOpenChange={setOpen} />
    </header>
  );
}
