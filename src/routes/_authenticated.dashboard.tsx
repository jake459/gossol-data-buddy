import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Receipt,
  AlertCircle,
  Sparkles,
  CalendarClock,
  ArrowRight,
  DoorOpen,
  TrendingUp,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { supabase } from "@/integrations/supabase/client";
import { formatKRWShort } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "대시보드 — Gossol" }] }),
  component: DashboardPage,
});

type Stats = {
  vacant: number;
  occupied: number;
  monthRevenue: number;
  overdue: number;
  upcoming: { id: string; title: string; event_date: string }[];
};

function DashboardPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const greetingName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "사장님";

  const [stats, setStats] = useState<Stats>({
    vacant: 0,
    occupied: 0,
    monthRevenue: 0,
    overdue: 0,
    upcoming: [],
  });

  useEffect(() => {
    if (!selected) return;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    Promise.all([
      supabase.from("rooms").select("status", { count: "exact" }).eq("branch_id", selected.id),
      supabase
        .from("invoices")
        .select("amount, status, due_date")
        .eq("branch_id", selected.id)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd),
      supabase
        .from("events")
        .select("id, title, event_date")
        .eq("branch_id", selected.id)
        .gte("event_date", todayStr)
        .order("event_date")
        .limit(3),
    ]).then(([rooms, invs, evs]) => {
      const rs = (rooms.data ?? []) as { status: string }[];
      let vacant = 0,
        occupied = 0;
      rs.forEach((r) => {
        if (r.status === "vacant") vacant++;
        if (r.status === "occupied") occupied++;
      });
      const ivs = (invs.data ?? []) as { amount: number; status: string }[];
      let revenue = 0,
        overdue = 0;
      ivs.forEach((i) => {
        if (i.status === "paid") revenue += i.amount;
        if (i.status === "unpaid" || i.status === "overdue") overdue += 1;
      });
      setStats({
        vacant,
        occupied,
        monthRevenue: revenue,
        overdue,
        upcoming: (evs.data ?? []) as Stats["upcoming"],
      });
    });
  }, [selected?.id]);

  return (
    <MobileFrame>
      <TopBar />
      <main className="flex-1 space-y-5 px-5 py-5">
        <section className="rounded-2xl bg-gradient-to-br from-[oklch(0.46_0.18_258)] to-[oklch(0.32_0.16_262)] p-5 text-white shadow-[0_15px_35px_-12px_oklch(0.32_0.16_262/0.5)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-80">
            <Sparkles className="h-3.5 w-3.5" /> 오늘의 한눈 요약
          </div>
          <h1 className="mt-2 text-[22px] font-bold leading-tight">
            {greetingName} 님, 좋은 하루예요 👋
          </h1>
          <p className="mt-1 text-[13px] opacity-85">
            {selected ? `${selected.name} 운영 현황입니다.` : "지점을 선택하면 자세한 현황이 보여요."}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Tile to="/rooms" icon={DoorOpen} label="공실" value={`${stats.vacant}실`} tone="danger" />
          <Tile to="/tenants" icon={Users} label="현재 입실" value={`${stats.occupied}명`} tone="brand" />
          <Tile
            to="/invoices"
            icon={Receipt}
            label="이번 달 매출"
            value={formatKRWShort(stats.monthRevenue)}
            tone="success"
          />
          <Tile to="/invoices" icon={AlertCircle} label="미납" value={`${stats.overdue}건`} tone="danger" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">다가오는 일정</h2>
            <Link to="/schedule" className="text-[12px] font-semibold text-brand">
              전체 보기
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-[13px]">
            {stats.upcoming.length === 0 ? (
              <li className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-brand" /> 예정된 일정이 없어요.
              </li>
            ) : (
              stats.upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-brand" />
                  <span className="font-medium text-foreground">{e.title}</span>
                  <span className="ml-auto text-[12px] text-muted-foreground">{e.event_date}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <QuickLink to="/applications" icon={ClipboardList} label="입실 신청" />
          <QuickLink to="/stats" icon={TrendingUp} label="운영 통계" />
          <QuickLink to="/community" icon={Megaphone} label="커뮤니티" />
          <QuickLink to="/branches" icon={Building2} label="지점 관리" />
        </section>
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}

function Tile({
  to,
  icon: Icon,
  label,
  value,
  tone,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "brand" | "success" | "danger";
}) {
  const toneClass =
    tone === "danger" ? "text-rose-600" : tone === "success" ? "text-emerald-600" : "text-brand";
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-4 transition hover:bg-accent/40"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", toneClass)} /> {label}
      </div>
      <div className={cn("mt-2 text-2xl font-bold", toneClass)}>{value}</div>
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-[13.5px] font-semibold transition hover:bg-accent/40"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand" /> {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
