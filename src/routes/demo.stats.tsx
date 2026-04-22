import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, TrendingUp, Users, DoorOpen, Receipt } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_STATS, DEMO_ROOMS } from "@/lib/demoData";
import { formatKRW } from "@/components/StatusBadge";

export const Route = createFileRoute("/demo/stats")({
  head: () => ({ meta: [{ title: "데모 통계 — Gossol" }] }),
  component: DemoStatsPage,
});

function DemoStatsPage() {
  const totalRooms = DEMO_ROOMS.length;
  const occRate = Math.round((DEMO_STATS.occupied / totalRooms) * 100);
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link to="/demo/dashboard" className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[15px] font-bold">운영 통계</h1>
      </header>
      <main className="flex-1 space-y-3 px-4 py-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[12px] font-semibold text-muted-foreground">이번 달 월세 수납</p>
          <p className="mt-1 text-[26px] font-bold text-emerald-600">{formatKRW(DEMO_STATS.monthRevenue)}</p>
          <p className="text-[11.5px] text-muted-foreground">전월 대비 +8.2%</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={DoorOpen} label="방 가동률" value={`${occRate}%`} sub={`${DEMO_STATS.occupied}/${totalRooms}실`} />
          <Stat icon={Users} label="입실자" value={`${DEMO_STATS.occupied}명`} sub="활성" />
          <Stat icon={Receipt} label="미납" value={`${DEMO_STATS.overdueCount}건`} sub={formatKRW(DEMO_STATS.overdueSum)} />
          <Stat icon={TrendingUp} label="평균 재실기간" value="9.2개월" sub="전월비 +0.4" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[13px] font-bold">호실 상태</p>
          <div className="mt-3 space-y-2 text-[13px]">
            <Row label="입실" value={DEMO_STATS.occupied} total={totalRooms} color="bg-emerald-500" />
            <Row label="공실" value={DEMO_STATS.vacant} total={totalRooms} color="bg-rose-500" />
            <Row label="청소중" value={DEMO_STATS.cleaning} total={totalRooms} color="bg-amber-500" />
            <Row label="수리중" value={DEMO_STATS.maintenance} total={totalRooms} color="bg-slate-400" />
          </div>
        </div>
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5 text-brand" />{label}</div>
      <p className="mt-1 text-[20px] font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Row({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between"><span>{label}</span><span className="font-semibold">{value}실</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
