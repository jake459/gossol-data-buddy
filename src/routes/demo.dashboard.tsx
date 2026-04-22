import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, Users, Receipt, AlertCircle, Sparkles, CalendarClock, ArrowRight,
  DoorOpen, TrendingUp, ClipboardList, Megaphone, Phone, LogIn, LogOut,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_STATS, DEMO_INVOICES, DEMO_EVENTS, DEMO_ROOMS } from "@/lib/demoData";
import { formatKRW, formatKRWShort } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo/dashboard")({
  head: () => ({ meta: [{ title: "데모 대시보드 — Gossol" }] }),
  component: DemoDashboard,
});

function DemoDashboard() {
  const totalRooms = DEMO_ROOMS.length;
  const occupancy = Math.round((DEMO_STATS.occupied / totalRooms) * 100);
  const today = new Date();
  const dateLabel = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const overdue = DEMO_INVOICES.filter((i) => i.status === "overdue").slice(0, 4);
  const upcoming = DEMO_EVENTS.slice(0, 4);

  return (
    <MobileFrame>
      <DemoTopBar />
      <main className="flex-1 space-y-5 px-5 py-5">
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.3_0.16_268)] p-5 text-white shadow-[0_18px_45px_-15px_oklch(0.32_0.16_262/0.55)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest opacity-85">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> 데모 모드</span>
              <span className="opacity-80">{dateLabel}</span>
            </div>
            <h1 className="mt-2 text-[22px] font-bold leading-tight">원장님 👋</h1>
            <p className="mt-1 text-[13px] opacity-85">강남 1호점 운영 현황입니다.</p>
            <div className="mt-4 flex items-end justify-between rounded-2xl bg-white/12 p-3.5 backdrop-blur-md ring-1 ring-white/20">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">방 가동률</div>
                <div className="mt-1 text-[26px] font-black leading-none">{occupancy}%</div>
                <div className="mt-1 text-[11.5px] opacity-80">전체 {totalRooms}실 중 {DEMO_STATS.occupied}실 입실</div>
              </div>
              <div className="flex w-1/2 flex-col items-end gap-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-gradient-to-r from-white to-[oklch(0.85_0.15_205)]" style={{ width: `${occupancy}%` }} />
                </div>
                <div className="text-[11px] opacity-80">빈 방 {DEMO_STATS.vacant}실</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Tile to="/demo/rooms" icon={DoorOpen} label="빈 방" value={`${DEMO_STATS.vacant}실`} tone="danger" />
          <Tile to="/demo/tenants" icon={Users} label="입실 인원" value={`${DEMO_STATS.occupied}명`} tone="brand" />
          <Tile to="/demo/invoices" icon={Receipt} label="이번 달 월세 수납" value={formatKRWShort(DEMO_STATS.monthRevenue)} tone="success" />
          <Tile to="/demo/invoices" icon={AlertCircle} label="월세 미납" value={`${DEMO_STATS.overdueCount}건`} tone="danger" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-bold">오늘 할 일</h2>
          <div className="mt-3 space-y-2 text-[13px]">
            <TodoRow icon={Receipt} color="text-amber-600" bg="bg-amber-50" label={`오늘 월세 납부 예정 ${DEMO_STATS.todayDue}건`} to="/demo/invoices" />
            <TodoRow icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" label={`월세 미납 ${DEMO_STATS.overdueCount}건 · ${formatKRW(DEMO_STATS.overdueSum)}`} to="/demo/invoices" />
            <TodoRow icon={DoorOpen} color="text-emerald-600" bg="bg-emerald-50" label={`빈 방 ${DEMO_STATS.vacant}실 — 입실 모집 가능`} to="/demo/rooms" />
          </div>
        </section>

        {overdue.length > 0 && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1.5 text-[14px] font-bold text-rose-700">
                <AlertCircle className="h-4 w-4" /> 월세 독촉이 필요한 입실자
              </h2>
              <Link to="/demo/invoices" className="text-[12px] font-semibold text-rose-700">전체</Link>
            </div>
            <ul className="mt-2 divide-y divide-rose-100">
              {overdue.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-2">
                  <Link to="/demo/tenants/$tenantId" params={{ tenantId: t.tenant_id }} className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{t.tenant_name}</p>
                    <p className="text-[11.5px] text-rose-700">{t.due_date} 납부 예정일 경과 · {formatKRW(t.amount)}</p>
                  </Link>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-rose-600 ring-1 ring-rose-200">
                    <Phone className="h-4 w-4" />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">입·퇴실 예정</h2>
            <Link to="/demo/schedule" className="text-[12px] font-semibold text-brand">전체 보기</Link>
          </div>
          <ul className="mt-3 space-y-2 text-[13px]">
            {upcoming.map((e) => {
              const Icon = e.kind === "move_in" ? LogIn : e.kind === "move_out" ? LogOut : CalendarClock;
              const color = e.kind === "move_in" ? "text-emerald-600" : e.kind === "move_out" ? "text-rose-600" : "text-brand";
              return (
                <li key={e.id} className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <span className="font-medium text-foreground">{e.title}</span>
                  <span className="ml-auto text-[12px] text-muted-foreground">{e.event_date}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <QuickLink to="/demo/applications" icon={ClipboardList} label="룸투어·입실 문의" />
          <QuickLink to="/demo/stats" icon={TrendingUp} label="운영 통계" />
          <QuickLink to="/demo/community" icon={Megaphone} label="원장님 커뮤니티" />
          <QuickLink to="/demo/branches" icon={Building2} label="지점 관리" />
        </section>

        <div className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-center">
          <p className="text-sm font-semibold text-brand">데모 모드입니다</p>
          <p className="mt-1 text-xs text-muted-foreground">회원가입하고 실제 데이터로 시작해 보세요.</p>
          <Link to="/signup" className="mt-3 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-[13px] font-semibold text-white">
            무료로 회원가입
          </Link>
        </div>
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}

function TodoRow({ icon: Icon, color, bg, label, to }: { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-accent/40">
      <span className={cn("grid h-7 w-7 place-items-center rounded-full", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </span>
      <span className="flex-1 text-[13px] font-semibold">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function Tile({ to, icon: Icon, label, value, tone }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "brand" | "success" | "danger" }) {
  const toneClass = tone === "danger" ? "text-rose-600" : tone === "success" ? "text-emerald-600" : "text-brand";
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 transition hover:bg-accent/40">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", toneClass)} /> {label}
      </div>
      <div className={cn("mt-2 text-2xl font-bold", toneClass)}>{value}</div>
    </Link>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-[13.5px] font-semibold transition hover:bg-accent/40">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-brand" /> {label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
