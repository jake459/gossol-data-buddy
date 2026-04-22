import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt, Plus } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_INVOICES } from "@/lib/demoData";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/invoices")({
  head: () => ({ meta: [{ title: "데모 청구서 — Gossol" }] }),
  component: DemoInvoicesPage,
});

function DemoInvoicesPage() {
  const sorted = [...DEMO_INVOICES].sort((a, b) => a.due_date.localeCompare(b.due_date));
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div>
          <h1 className="text-[15px] font-bold">청구서</h1>
          <p className="text-[11.5px] text-muted-foreground">총 {DEMO_INVOICES.length}건</p>
        </div>
        <button type="button" onClick={() => toast.info("데모: 청구서 발행 비활성화")} className="inline-flex h-9 items-center gap-1 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background">
          <Plus className="h-3.5 w-3.5" /> 발행
        </button>
      </header>
      <main className="flex-1 space-y-2 px-4 py-4">
        {sorted.map((i) => (
          <Link key={i.id} to="/demo/tenants/$tenantId" params={{ tenantId: i.tenant_id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <Receipt className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{i.tenant_name}</p>
              <p className="text-[12px] text-muted-foreground">납부일 {i.due_date}</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-bold">{formatKRW(i.amount)}</p>
              <StatusBadge kind="invoice" value={i.status} className="mt-0.5" />
            </div>
          </Link>
        ))}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
