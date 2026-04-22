import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Bell, Megaphone, TrendingUp, FileText, LogOut, ClipboardList, ChevronRight, UserCircle2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/settings")({
  head: () => ({ meta: [{ title: "데모 설정 — Gossol" }] }),
  component: DemoSettingsPage,
});

function DemoSettingsPage() {
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <h1 className="text-[15px] font-bold">설정</h1>
      </header>
      <main className="flex-1 space-y-4 px-4 py-4">
        <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
            <UserCircle2 className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">데모 원장님</p>
            <p className="text-[12px] text-muted-foreground">demo@gossol.kr</p>
          </div>
          <Link to="/signup" className="rounded-xl bg-brand px-3 py-1.5 text-[12px] font-semibold text-white">가입하기</Link>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row to="/demo/branches" icon={Building2} label="지점 관리" />
          <Row to="/demo/applications" icon={ClipboardList} label="룸투어 · 입실 문의" />
          <Row to="/demo/stats" icon={TrendingUp} label="운영 통계" />
          <Row to="/demo/community" icon={Megaphone} label="원장님 커뮤니티" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <ActionRow icon={Bell} label="알림 설정" onClick={() => toast.info("데모: 알림 설정은 가입 후 이용 가능")} />
          <ActionRow icon={FileText} label="이용약관 · 개인정보" onClick={() => toast.info("데모: 약관 보기")} />
          <ActionRow icon={LogOut} label="데모 종료" onClick={() => (window.location.href = "/")} />
        </section>

        <p className="text-center text-[11px] text-muted-foreground">Gossol Demo · v1.4</p>
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}

function Row({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent">
      <Icon className="h-4 w-4 text-brand" />
      <span className="flex-1 text-[13.5px] font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ActionRow({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-accent">
      <Icon className="h-4 w-4 text-brand" />
      <span className="flex-1 text-[13.5px] font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
