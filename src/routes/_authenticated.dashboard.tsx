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
import { Pager } from "@/components/Pager";
import { TenantDetailModal } from "@/components/TenantDetailModal";
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
  const [profileName, setProfileName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileName(data?.display_name ?? null));
  }, [user?.id]);
  const greetingName =
    profileName ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "사장님";

  const [stats, setStats] = useState<Stats>({
    vacant: 0,
    occupied: 0,
    monthRevenue: 0,
    overdueCount: 0,
    overdueSum: 0,
    overdueTenants: [],
    upcoming: [],
    todayDue: 0,
  });
  const [overduePage, setOverduePage] = useState(1);
  const [overdueOpen, setOverdueOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const OVERDUE_PAGE_SIZE = 6;

  useEffect(() => {
    if (!selected) return;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    Promise.all([
      supabase.from("rooms").select("status").eq("branch_id", selected.id),
      supabase
        .from("invoices")
        .select("amount, status, due_date")
        .eq("branch_id", selected.id)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd),
      supabase
        .from("events")
        .select("id, title, event_date, kind")
        .eq("branch_id", selected.id)
        .gte("event_date", todayStr)
        .order("event_date")
        .limit(4),
      // Overdue (unpaid past due_date OR status overdue) with tenant info
      supabase
        .from("invoices")
        .select("id, amount, due_date, tenant_id, tenants(id, name, phone)")
        .eq("branch_id", selected.id)
        .in("status", ["unpaid", "overdue"])
        .lte("due_date", todayStr)
        .order("due_date", { ascending: true }),
      // Today's payments due (unpaid scheduled today)
      supabase
        .from("invoices")
        .select("amount", { count: "exact" })
        .eq("branch_id", selected.id)
        .eq("status", "unpaid")
        .eq("due_date", todayStr),
    ]).then(([rooms, invs, evs, overdue, todayDue]) => {
      const rs = (rooms.data ?? []) as { status: string }[];
      let vacant = 0,
        occupied = 0;
      rs.forEach((r) => {
        if (r.status === "vacant") vacant++;
        if (r.status === "occupied") occupied++;
      });
      const ivs = (invs.data ?? []) as { amount: number; status: string }[];
      let revenue = 0;
      ivs.forEach((i) => {
        if (i.status === "paid") revenue += i.amount;
      });
      const od = (overdue.data ?? []) as Array<{
        id: string;
        amount: number;
        due_date: string;
        tenant_id: string | null;
        tenants: { id: string; name: string; phone: string | null } | null;
      }>;
      const overdueTenants: OverdueTenant[] = od
        .filter((x) => x.tenants)
        .map((x) => ({
          id: x.tenants!.id,
          name: x.tenants!.name,
          phone: x.tenants!.phone,
          amount: x.amount,
          due_date: x.due_date,
        }));
      const overdueSum = od.reduce((s, x) => s + x.amount, 0);
      setStats({
        vacant,
        occupied,
        monthRevenue: revenue,
        overdueCount: od.length,
        overdueSum,
        overdueTenants,
        upcoming: (evs.data ?? []) as UpcomingMove[],
        todayDue: todayDue.count ?? 0,
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
      <main className="flex-1 space-y-3 px-4 py-3">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.3_0.16_268)] p-4 text-white shadow-[0_14px_30px_-14px_oklch(0.32_0.16_262/0.6)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-widest opacity-85">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {timeGreeting}
              </span>
              <span className="opacity-80">{dateLabel}</span>
            </div>
            <h1 className="mt-1.5 text-[18px] font-bold leading-tight">
              {greetingName} 님 👋
            </h1>
            <p className="mt-0.5 text-[12px] opacity-85">
              {selected ? `${selected.name} 운영 현황` : "지점을 선택해 주세요"}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/12 p-3 backdrop-blur-md ring-1 ring-white/20">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">방 가동률</div>
                <div className="text-[24px] font-black leading-none">{occupancy}%</div>
                <div className="mt-1 text-[11px] opacity-80">
                  {totalRooms}실 중 {stats.occupied}실 입실
                </div>
              </div>
              <div className="ml-3 h-2 w-1/2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white to-[oklch(0.85_0.15_205)] transition-all"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Tile to="/tenants" icon={Users} label="입실" value={`${stats.occupied}명`} tone="brand" />
          <Tile
            to="/invoices"
            icon={Receipt}
            label="이번 달 수익"
            value={formatKRWShort(stats.monthRevenue)}
            tone="success"
          />
          <Tile
            to="/invoices"
            icon={AlertCircle}
            label="미납"
            value={`${stats.overdueCount}건`}
            tone="danger"
          />
        </section>

        {/* Today's tasks — owner action panel */}
        <section className="rounded-2xl border border-border bg-card p-3.5">
          <h2 className="text-[13px] font-bold">오늘 할 일</h2>
          <div className="mt-2 space-y-1 text-[13px]">
            <TodoRow
              icon={Receipt}
              color="text-amber-600"
              bg="bg-amber-50"
              label={`오늘 월세 납부 예정 ${stats.todayDue}건`}
              empty={stats.todayDue === 0}
              to="/invoices"
            />
            <TodoRow
              icon={AlertCircle}
              color="text-rose-600"
              bg="bg-rose-50"
              label={
                stats.overdueCount > 0
                  ? `미납 ${stats.overdueCount}건 · ${formatKRW(stats.overdueSum)}`
                  : "미납자가 없어요"
              }
              empty={stats.overdueCount === 0}
              to="/invoices"
            />
          </div>
        </section>

        {/* Overdue tenants — quick contact */}
        {stats.overdueTenants.length > 0 && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold text-rose-700">
                <AlertCircle className="h-4 w-4" /> 미납자 현황
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {stats.overdueTenants.length}
                </span>
              </h2>
              <Link to="/invoices" className="text-[12px] font-semibold text-rose-700">
                전체
              </Link>
            </div>
            <ul className="mt-1.5 divide-y divide-rose-100">
              {stats.overdueTenants
                .slice((overduePage - 1) * OVERDUE_PAGE_SIZE, overduePage * OVERDUE_PAGE_SIZE)
                .map((t) => (
                  <li key={`${t.id}-${t.due_date}`} className="flex items-center gap-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailId(t.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-[13px] font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-rose-700">
                        {formatKRW(t.amount)} · {t.due_date}
                      </p>
                    </button>
                    {t.phone && (
                      <a
                        href={`tel:${t.phone}`}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white text-rose-600 ring-1 ring-rose-200"
                        aria-label="전화"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </li>
                ))}
            </ul>
            <Pager
              page={overduePage}
              totalPages={Math.max(1, Math.ceil(stats.overdueTenants.length / OVERDUE_PAGE_SIZE))}
              onChange={setOverduePage}
              total={stats.overdueTenants.length}
            />
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold">입·퇴실 예정</h2>
            <Link to="/schedule" className="text-[12px] font-semibold text-brand">
              전체
            </Link>
          </div>
          <ul className="mt-1.5 space-y-1.5 text-[13px]">
            {stats.upcoming.length === 0 ? (
              <li className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-brand" /> 예정된 일정이 없어요.
              </li>
            ) : (
              stats.upcoming.slice(0, 3).map((e) => {
                const Icon =
                  e.kind === "move_in" ? LogIn : e.kind === "move_out" ? LogOut : CalendarClock;
                const color =
                  e.kind === "move_in"
                    ? "text-emerald-600"
                    : e.kind === "move_out"
                      ? "text-rose-600"
                      : "text-brand";
                return (
                  <li key={e.id} className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", color)} />
                    <span className="truncate font-medium text-foreground">{e.title}</span>
                    <span className="ml-auto text-[11.5px] text-muted-foreground">{e.event_date}</span>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <QuickLink to="/applications" icon={ClipboardList} label="문의" />
          <QuickLink to="/stats" icon={TrendingUp} label="통계" />
          <QuickLink to="/community" icon={Megaphone} label="커뮤니티" />
          <QuickLink to="/branches" icon={Building2} label="지점" />
        </section>
      </main>
      <TenantDetailModal
        tenantId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
      <BottomTabs />
    </MobileFrame>
  );
}

function TodoRow({
  icon: Icon,
  color,
  bg,
  label,
  empty,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  label: string;
  empty: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-accent/40",
        empty && "opacity-60",
      )}
    >
      <span className={cn("grid h-6 w-6 place-items-center rounded-full", bg)}>
        <Icon className={cn("h-3 w-3", color)} />
      </span>
      <span className="flex-1 text-[12.5px] font-semibold">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
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
      className="flex h-[68px] flex-col justify-between rounded-xl border border-border bg-card px-2.5 py-2 transition hover:bg-accent/40"
    >
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", toneClass)} />
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("truncate text-[17px] font-bold leading-tight", toneClass)}>{value}</div>
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
      className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-[11.5px] font-semibold transition hover:bg-accent/40"
    >
      <Icon className="h-4.5 w-4.5 text-brand" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
