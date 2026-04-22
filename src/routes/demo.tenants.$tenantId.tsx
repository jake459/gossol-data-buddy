import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ChevronLeft, Phone, MessageSquare, Receipt, Edit3, FileText, Wallet, Calendar } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_TENANTS, DEMO_INVOICES } from "@/lib/demoData";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo/tenants/$tenantId")({
  head: () => ({ meta: [{ title: "데모 입실자 상세 — Gossol" }] }),
  component: DemoTenantDetail,
  notFoundComponent: () => (
    <MobileFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <p className="font-semibold">입실자를 찾을 수 없어요.</p>
        <Link to="/demo/tenants" className="text-brand">목록으로</Link>
      </div>
    </MobileFrame>
  ),
});

function DemoTenantDetail() {
  const { tenantId } = useParams({ from: "/demo/tenants/$tenantId" });
  const t = DEMO_TENANTS.find((x) => x.id === tenantId);

  if (!t) {
    return (
      <MobileFrame>
        <DemoTopBar />
        <main className="flex-1 p-6 text-center">
          <p className="text-sm font-semibold">입실자를 찾을 수 없어요.</p>
          <Link to="/demo/tenants" className="mt-3 inline-block text-brand">목록으로</Link>
        </main>
        <DemoBottomTabs />
      </MobileFrame>
    );
  }

  const invoices = DEMO_INVOICES.filter((i) => i.tenant_id === t.id);
  const moveIn = new Date(t.move_in_date);
  const expectedOut = new Date(moveIn.getFullYear() + 1, moveIn.getMonth(), moveIn.getDate());
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  const dDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${-diff}`;
  };

  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link to="/demo/tenants" className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-bold">{t.name}</h1>
            <StatusBadge kind="tenant" value={t.status} />
          </div>
          <p className="text-[11.5px] text-muted-foreground">{t.room_number}호 · {t.phone}</p>
        </div>
        <button type="button" onClick={() => toast.info("데모: 편집은 비활성화")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
          <Edit3 className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <ActionMini icon={Phone} label="전화" tone="bg-emerald-50 text-emerald-700" onClick={() => (window.location.href = `tel:${t.phone}`)} />
          <ActionMini icon={MessageSquare} label="문자" tone="bg-sky-50 text-sky-700" onClick={() => toast.info("데모: 문자 발송 비활성화")} />
          <ActionMini icon={Receipt} label="청구서" tone="bg-amber-50 text-amber-700" onClick={() => toast.info("데모: 청구서 발행 비활성화")} />
        </div>

        {/* Contract status grid */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-bold">계약 상태</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatusTile label="계약서 발송" done tone="blue" />
            <StatusTile label="계약 동의" done tone="green" />
            <StatusTile label="보증금 입금" done tone="green" />
            <StatusTile label="보증금 반환" tone="muted" />
            <StatusTile label="연장 의사" tone="amber" />
            <StatusTile label="퇴실 요청" tone="muted" />
          </div>
        </section>

        {/* Contract info */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-bold">계약 정보</h2>
          <div className="mt-3 space-y-2 text-[13px]">
            <KV k="호실" v={`${t.room_number}호`} />
            <KV k="계약 기간" v={`${fmt(moveIn)} ~ ${fmt(expectedOut)} (1년)`} />
            <KV k="월세" v={`${formatKRW(t.monthly_rent)} / 매월 ${t.payment_day}일`} />
            <KV k="보증금" v={formatKRW(t.deposit)} />
            <KV k="비상 연락처" v={t.emergency_contact} />
            {t.memo && <KV k="메모" v={t.memo} />}
          </div>
        </section>

        {/* Deposit */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold"><Wallet className="h-4 w-4 text-brand" /> 보증금 관리</h2>
          <div className="mt-3 rounded-xl bg-muted/40 p-3 text-[13px]">
            <div className="flex justify-between"><span className="text-muted-foreground">입금 완료</span><span className="font-semibold">{formatKRW(t.deposit)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">차감/공제</span><span>-{formatKRW(0)}</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2"><span className="font-semibold">반환 예정액</span><span className="font-bold text-brand">{formatKRW(t.deposit)}</span></div>
          </div>
        </section>

        {/* Invoices */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold"><Receipt className="h-4 w-4 text-brand" /> 청구서 내역</h2>
          <ul className="mt-3 divide-y divide-border">
            {invoices.length === 0 && <li className="py-3 text-center text-[12px] text-muted-foreground">청구서가 없어요.</li>}
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{formatKRW(i.amount)}</p>
                  <p className="text-[11.5px] text-muted-foreground">납부일 {i.due_date} · {dDay(i.due_date)}</p>
                </div>
                <StatusBadge kind="invoice" value={i.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* Documents */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-bold">첨부 서류</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DocBtn label="임대차 계약서" />
            <DocBtn label="신분증 사본" />
          </div>
        </section>
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}

function ActionMini({ icon: Icon, label, tone, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[12px] font-semibold transition active:scale-95", tone)}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatusTile({ label, done, tone }: { label: string; done?: boolean; tone: "blue" | "green" | "amber" | "muted" }) {
  const tones = {
    blue: done ? "bg-sky-100 text-sky-700" : "bg-sky-50 text-sky-400",
    green: done ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-400",
    amber: done ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-500",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className={cn("rounded-xl px-2 py-2.5 text-center text-[11.5px] font-semibold", tones[tone])}>
      {done && "✓ "}{label}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function DocBtn({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => toast.info("데모: 미리보기 비활성화")} className="flex items-center gap-2 rounded-xl border border-border p-3 text-[12.5px] font-medium hover:bg-accent">
      <FileText className="h-4 w-4 text-brand" /> {label}
    </button>
  );
}
