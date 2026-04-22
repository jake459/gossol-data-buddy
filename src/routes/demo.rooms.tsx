import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_ROOMS, DEMO_TENANTS } from "@/lib/demoData";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo/rooms")({
  head: () => ({ meta: [{ title: "데모 호실 — Gossol" }] }),
  component: DemoRoomsPage,
});

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "occupied", label: "입실" },
  { value: "vacant", label: "공실" },
  { value: "cleaning", label: "청소중" },
  { value: "maintenance", label: "수리중" },
] as const;

function DemoRoomsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const rooms = DEMO_ROOMS.filter((r) => filter === "all" || r.status === filter);

  const byFloor = rooms.reduce<Record<number, typeof rooms>>((acc, r) => {
    (acc[r.floor] ||= []).push(r);
    return acc;
  }, {});

  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-[15px] font-bold">호실 현황</h1>
        <p className="text-[11.5px] text-muted-foreground">총 {DEMO_ROOMS.length}실 · 입실 {DEMO_ROOMS.filter((r) => r.status === "occupied").length}실</p>
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold transition",
                filter === f.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>
      <main className="flex-1 space-y-4 px-4 py-4">
        {Object.entries(byFloor).sort(([a], [b]) => Number(b) - Number(a)).map(([floor, list]) => (
          <section key={floor}>
            <h2 className="mb-2 text-[12px] font-bold text-muted-foreground">{floor}층</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {list.map((r) => {
                const tenant = DEMO_TENANTS.find((t) => t.id === r.tenant_id);
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-bold">{r.room_number}호</p>
                      <StatusBadge kind="room" value={r.status} />
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{formatKRW(r.monthly_rent)}/월</p>
                    {tenant ? (
                      <Link to="/demo/tenants/$tenantId" params={{ tenantId: tenant.id }} className="mt-2 block truncate text-[12.5px] font-semibold text-brand">
                        {tenant.name} →
                      </Link>
                    ) : (
                      <p className="mt-2 text-[12px] text-muted-foreground">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
