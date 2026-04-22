import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, FileText, AlertCircle, TrendingUp, CalendarClock, Sparkles } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "대시보드 — Gossol" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const greetingName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "사장님";

  return (
    <MobileFrame>
      <TopBar branchName={selected?.name ?? "지점 선택"} />
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
          <Tile icon={Building2} label="공실" value="0" tone="danger" />
          <Tile icon={Users} label="현재 입실" value="0" tone="brand" />
          <Tile icon={FileText} label="이번 달 매출" value="0원" tone="success" />
          <Tile icon={AlertCircle} label="미납자" value="0" tone="danger" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">오늘의 할 일</h2>
            <Link to="/schedule" className="text-[12px] font-semibold text-brand">
              전체 보기
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand" /> 예정된 일정이 없어요.
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" /> 입실자를 추가하면 여기에 보여요.
            </li>
          </ul>
        </section>

        <p className="text-center text-[12px] text-muted-foreground">
          호실 · 입실자 · 청구서 관리 화면이 다음 단계에서 추가됩니다.
        </p>
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "brand" | "success" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "success"
        ? "text-emerald-600"
        : "text-brand";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} /> {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
