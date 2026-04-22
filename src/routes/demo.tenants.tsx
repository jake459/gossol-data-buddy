import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserPlus, Phone } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_TENANTS } from "@/lib/demoData";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/tenants")({
  head: () => ({ meta: [{ title: "데모 입실자 — Gossol" }] }),
  component: DemoTenantsPage,
});

function DemoTenantsPage() {
  const [q, setQ] = useState("");
  const list = DEMO_TENANTS.filter(
    (t) => !q || t.name.includes(q) || t.room_number.includes(q) || t.phone.includes(q),
  );

  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">입실자 ({DEMO_TENANTS.length}명)</h1>
          <button
            type="button"
            onClick={() => toast.info("데모에서는 추가가 비활성화되어 있어요.")}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background"
          >
            <UserPlus className="h-3.5 w-3.5" /> 추가
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 호실 · 전화" className="h-10 rounded-xl pl-9" />
        </div>
      </header>
      <main className="flex-1 space-y-2 px-4 py-4">
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <Link to="/demo/tenants/$tenantId" params={{ tenantId: t.id }} className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14.5px] font-semibold">{t.name}</p>
                <StatusBadge kind="tenant" value={t.status} />
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {t.room_number}호 · {formatKRW(t.monthly_rent)}/월 · 매월 {t.payment_day}일
              </p>
            </Link>
            <a href={`tel:${t.phone}`} className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
              <Phone className="h-4 w-4" />
            </a>
          </div>
        ))}
        {list.length === 0 && (
          <p className="py-12 text-center text-[13px] text-muted-foreground">검색 결과가 없어요.</p>
        )}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
