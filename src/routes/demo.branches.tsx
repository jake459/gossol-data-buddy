import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_BRANCHES } from "@/lib/demoData";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/branches")({
  head: () => ({ meta: [{ title: "데모 지점 관리 — Gossol" }] }),
  component: DemoBranchesPage,
});

function DemoBranchesPage() {
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <h1 className="text-[15px] font-bold">지점 관리</h1>
        <button type="button" onClick={() => toast.info("데모: 지점 추가는 회원가입 후 가능해요")} className="inline-flex h-9 items-center gap-1 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background">
          <Plus className="h-3.5 w-3.5" /> 추가
        </button>
      </header>
      <main className="flex-1 space-y-2 px-4 py-4">
        {DEMO_BRANCHES.map((b) => (
          <button key={b.id} type="button" onClick={() => toast.info("데모: 편집 비활성화")} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{b.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{b.address} · {b.phone}</p>
            </div>
          </button>
        ))}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
