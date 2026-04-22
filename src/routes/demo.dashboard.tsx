import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Receipt, AlertCircle, DoorOpen } from "lucide-react";

export const Route = createFileRoute("/demo/dashboard")({
  head: () => ({ meta: [{ title: "데모 대시보드 — Gossol" }] }),
  component: DemoDashboard,
});

const demoTabs = [
  { to: "/demo/dashboard", label: "대시보드", Icon: TrendingUp },
  { to: "/demo/dashboard", label: "일정", Icon: Receipt },
  { to: "/demo/dashboard", label: "입실자", Icon: AlertCircle },
  { to: "/demo/dashboard", label: "지점", Icon: DoorOpen },
];

function DemoDashboard() {
  return (
    <MobileFrame>
      <TopBar branchName="강남 1호점 (데모)" />
      <main className="flex-1 space-y-4 bg-app-shell px-4 py-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-[oklch(0.32_0.15_265)] p-5 text-primary-foreground shadow-md">
          <p className="text-xs font-medium text-white/70">이번 달 매출</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">₩ 12,480,000</p>
          <p className="mt-1 text-xs text-white/70">전월 대비 +8.2%</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="입실 호실" value="38" sub="/ 42실" tone="success" />
          <StatTile label="공실" value="4" sub="즉시 입실 가능" tone="danger" />
          <StatTile label="미납자" value="3" sub="확인 필요" tone="danger" />
          <StatTile label="오늘 룸투어" value="2" sub="14:00 / 17:00" tone="warning" />
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm font-semibold">오늘의 할 일</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex justify-between"><span>302호 청소 확인</span><span className="text-warning">진행중</span></li>
              <li className="flex justify-between"><span>김철수 님 청구서 발송</span><span className="text-muted-foreground">대기</span></li>
              <li className="flex justify-between"><span>박영희 님 미납 안내</span><span className="text-danger font-semibold">긴급</span></li>
            </ul>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-center">
          <p className="text-sm font-semibold text-brand">데모 모드입니다</p>
          <p className="mt-1 text-xs text-muted-foreground">회원가입하고 실제 데이터로 시작해 보세요.</p>
          <Button asChild className="mt-3 h-10 rounded-xl">
            <Link to="/signup">무료로 회원가입</Link>
          </Button>
        </div>
      </main>
      <BottomTabs tabs={demoTabs} />
    </MobileFrame>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "success" | "danger" | "warning" | "default";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : "text-foreground";
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
