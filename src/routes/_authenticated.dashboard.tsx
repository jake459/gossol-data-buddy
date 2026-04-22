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
  Phone,
  LogIn,
  LogOut,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { supabase } from "@/integrations/supabase/client";
import { formatKRW, formatKRWShort } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "대시보드 — Gossol" }] }),
  component: DashboardPage,
});

type OverdueTenant = {
  id: string;
  name: string;
  phone: string | null;
  amount: number;
  due_date: string;
};
type UpcomingMove = {
  id: string;
  title: string;
  event_date: string;
  kind: "move_in" | "move_out" | "inspection" | "room_tour" | "memo";
};

type Stats = {
  vacant: number;
  occupied: number;
  monthRevenue: number;
  overdueCount: number;
  overdueSum: number;
  overdueTenants: OverdueTenant[];
  upcoming: UpcomingMove[];
  todayDue: number;
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

  const totalRooms = stats.vacant + stats.occupied;
  const occupancy = totalRooms > 0 ? Math.round((stats.occupied / totalRooms) * 100) : 0;
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 6 ? "늦은 밤이에요" : hour < 12 ? "좋은 아침이에요" : hour < 18 ? "활기찬 오후예요" : "수고 많으셨어요";
  const dateLabel = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <MobileFrame>
      <TopBar />
      <main className="flex-1 space-y-5 px-5 py-5">
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.3_0.16_268)] p-5 text-white shadow-[0_18px_45px_-15px_oklch(0.32_0.16_262/0.55)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[oklch(0.7_0.2_205)]/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest opacity-85">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {timeGreeting}
              </span>
              <span className="opacity-80">{dateLabel}</span>
            </div>
            <h1 className="mt-2 text-[22px] font-bold leading-tight">
              {greetingName} 님 👋
            </h1>
            <p className="mt-1 text-[13px] opacity-85">
              {selected ? `${selected.name}의 운영 현황입니다.` : "지점을 선택하면 자세한 현황이 보여요."}
            </p>
            <div className="mt-4 flex items-end justify-between rounded-2xl bg-white/12 p-3.5 backdrop-blur-md ring-1 ring-white/20">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">입실률</div>
                <div className="mt-1 text-[26px] font-black leading-none">{occupancy}%</div>
                <div className="mt-1 text-[11.5px] opacity-80">
                  {stats.occupied}/{totalRooms}실 입실 중
                </div>
              </div>
              <div className="flex w-1/2 flex-col items-end gap-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-white to-[oklch(0.85_0.15_205)] transition-all"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
                <div className="text-[11px] opacity-80">공실 {stats.vacant}실</div>
              </div>
            </div>
          </div>
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
