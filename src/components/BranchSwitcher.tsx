import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBranch } from "@/hooks/useBranch";
import { Building2, Check, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BranchSwitcher({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { branches, selectedId, setSelectedId } = useBranch();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 p-5">
        <SheetHeader className="text-left">
          <SheetTitle className="text-[17px]">지점 전환</SheetTitle>
        </SheetHeader>
        <ul className="mt-3 space-y-1.5">
          {branches.map((b) => {
            const active = b.id === selectedId;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(b.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                    active ? "border-brand bg-brand/5" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{b.name}</span>
                    {b.address && (
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {b.address}
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-5 w-5 text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
        <Link
          to="/branches"
          onClick={() => onOpenChange(false)}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border px-4 py-3 text-[13px] font-semibold text-brand"
        >
          <Plus className="h-4 w-4" /> 지점 추가/관리
        </Link>
      </SheetContent>
    </Sheet>
  );
}
