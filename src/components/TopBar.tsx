import { ChevronDown, HeadphonesIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function TopBar({
  branchName = "지점 선택",
  supportHref = "#",
  onBranchClick,
}: {
  branchName?: string;
  supportHref?: string;
  onBranchClick?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onBranchClick}
        className="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent"
      >
        <span className="truncate text-sm font-semibold text-foreground">{branchName}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      <Button asChild variant="ghost" size="icon" aria-label="고객센터">
        <Link to={supportHref}>
          <HeadphonesIcon className="h-5 w-5" />
        </Link>
      </Button>
    </header>
  );
}
