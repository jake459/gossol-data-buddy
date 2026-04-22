import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/applications")({
  head: () => ({ meta: [{ title: "데모 입실 신청 — Gossol" }] }),
  component: DemoApplicationsPage,
});

const APPS = [
  { id: "a1", name: "홍길동", phone: "010-2345-6789", kind: "room_tour" as const, desired_date: "내일", status: "pending" as const, memo: "오후 시간대 선호" },
  { id: "a2", name: "김나래", phone: "010-3456-7890", kind: "move_in" as const, desired_date: "이번 주 금요일", status: "approved" as const },
  { id: "a3", name: "이태민", phone: "010-4567-8901", kind: "room_tour" as const, desired_date: "다음주 월요일", status: "pending" as const },
  { id: "a4", name: "최민호", phone: "010-5678-9012", kind: "move_in" as const, desired_date: "다음달 1일", status: "completed" as const },
];

function DemoApplicationsPage() {
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link to="/demo/dashboard" className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[15px] font-bold">룸투어 · 입실 문의</h1>
      </header>
      <main className="flex-1 space-y-2 px-4 py-4">
        {APPS.map((a) => (
          <button key={a.id} type="button" onClick={() => toast.info("데모: 상세 처리 비활성화")} className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14px] font-semibold">{a.name}</p>
                <StatusBadge kind="application" value={a.status} />
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {a.kind === "room_tour" ? "룸투어" : "입실 문의"} · 희망일 {a.desired_date} · {a.phone}
              </p>
              {a.memo && <p className="mt-1 text-[12px] text-muted-foreground">"{a.memo}"</p>}
            </div>
          </button>
        ))}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
