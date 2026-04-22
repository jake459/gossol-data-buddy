import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "대시보드 — Gossol" }] }),
  component: DashboardPlaceholder,
});

function DashboardPlaceholder() {
  return (
    <MobileFrame>
      <TopBar branchName="지점을 선택하세요" />
      <main className="flex-1 px-5 py-6">
        <h1 className="text-xl font-bold">대시보드 준비 중</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          로그인 후 지점을 등록하면 여기서 운영 현황을 확인할 수 있어요.
        </p>
        <Button asChild className="mt-6 h-11 rounded-xl">
          <Link to="/demo/dashboard">데모로 먼저 둘러보기</Link>
        </Button>
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}
