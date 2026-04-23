import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  Phone,
  CheckCircle2,
  LogOut,
  Pencil,
  Trash2,
  MessageSquare,
  ShieldAlert,
  PhoneCall,
  FileText,
  FileSignature,
  Wallet,
  RotateCcw,
  CalendarPlus,
  Copy,
  Plus,
  Receipt,
  MoreVertical,
} from "lucide-react";
import { toast as _toast } from "sonner";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { useConfirm } from "@/components/ConfirmModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  head: () => ({ meta: [{ title: "입실자 상세 — Gossol" }] }),
  component: TenantDetailPage,
});

type TenantStatus = "active" | "overdue" | "moved_out";
type Tenant = {
  id: string;
  branch_id: string;
  name: string;
  phone: string | null;
  emergency_contact: string | null;
  room_id: string | null;
  monthly_rent: number | null;
  deposit: number | null;
  payment_day: number | null;
  move_in_date: string | null;
  move_out_date: string | null;
  contract_start: string | null;
  contract_end: string | null;
  deposit_paid_at: string | null;
  deposit_returned_at: string | null;
  extension_requested_at: string | null;
  moveout_requested_at: string | null;
  status: TenantStatus;
  memo: string | null;
};
type Room = { id: string; room_number: string; floor: number | null };
type Invoice = {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: "unpaid" | "paid" | "overdue" | "canceled";
};

function TenantDetailPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, ConfirmDialog } = useConfirm();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from("tenants")
      .select(
        "id, branch_id, name, phone, emergency_contact, room_id, monthly_rent, deposit, payment_day, move_in_date, move_out_date, status, memo",
      )
      .eq("id", tenantId)
      .maybeSingle();
    if (!t) {
      setTenant(null);
      setLoading(false);
      return;
    }
    setTenant(t as Tenant);

    const [r, iv] = await Promise.all([
      t.room_id
        ? supabase.from("rooms").select("id, room_number, floor").eq("id", t.room_id).maybeSingle()
        : Promise.resolve({ data: null } as { data: Room | null }),
      supabase
        .from("invoices")
        .select("id, amount, due_date, paid_at, status")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: false })
        .limit(12),
    ]);
    setRoom((r.data as Room | null) ?? null);
    setInvoices((iv.data ?? []) as Invoice[]);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const unpaidCount = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length;
  const unpaidSum = invoices
    .filter((i) => i.status === "unpaid" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

  const handleDelete = async () => {
    if (!tenant) return;
    const ok = await confirm({
      title: "입실자 정보를 완전히 삭제할까요?",
      description: "삭제하면 청구서와 일정 기록은 남지만 연결이 끊깁니다. 일반적으로는 '퇴실 처리'를 권장합니다.",
      tone: "danger",
      confirmLabel: "삭제하기",
    });
    if (!ok) return;
    const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
    if (error) return toast.error(error.message);
    toast.success("삭제되었습니다.");
    navigate({ to: "/tenants" });
  };

  const handleMoveOut = async (date: string) => {
    if (!tenant || !user) return;
    const { error } = await supabase
      .from("tenants")
      .update({ status: "moved_out", move_out_date: date, room_id: null })
      .eq("id", tenant.id);
    if (error) return toast.error(error.message);
    if (tenant.room_id) {
      await supabase.from("rooms").update({ status: "cleaning" }).eq("id", tenant.room_id);
    }
    await supabase.from("events").insert({
      owner_id: user.id,
      branch_id: tenant.branch_id,
      title: `${tenant.name} 퇴실`,
      kind: "move_out",
      event_date: date,
      tenant_id: tenant.id,
    });
    toast.success("퇴실 처리되었습니다. 호실은 청소중으로 변경되었어요.");
    setMoveOutOpen(false);
    load();
  };

  const handleIssueInvoice = async (amount: number, dueDate: string, memo: string) => {
    if (!tenant || !user) return;
    const { error } = await supabase.from("invoices").insert({
      owner_id: user.id,
      branch_id: tenant.branch_id,
      tenant_id: tenant.id,
      amount,
      due_date: dueDate,
      memo: memo || null,
      status: "unpaid",
    });
    if (error) return toast.error(error.message);
    toast.success("청구서가 발행되었습니다.");
    setIssueOpen(false);
    load();
  };

  if (loading) {
    return (
      <MobileFrame>
        <Header onBack={() => navigate({ to: "/tenants" })} title="입실자 상세" />
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      </MobileFrame>
    );
  }

  if (!tenant) {
    return (
      <MobileFrame>
        <Header onBack={() => navigate({ to: "/tenants" })} title="입실자 상세" />
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">입실자를 찾을 수 없어요.</p>
          <Link to="/tenants" className="mt-3 inline-block text-sm font-semibold text-brand">
            목록으로 돌아가기
          </Link>
        </div>
      </MobileFrame>
    );
  }

  const contractEnd = (() => {
    if (!tenant.move_in_date) return null;
    const d = new Date(tenant.move_in_date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const today = new Date();
  const nextDueDay = tenant.payment_day ?? 1;
  const nextDue = new Date(today.getFullYear(), today.getMonth(), Math.min(nextDueDay, 28));
  if (nextDue < today) nextDue.setMonth(nextDue.getMonth() + 1);
  const dDay = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <MobileFrame>
      <Header onBack={() => navigate({ to: "/tenants" })} title={tenant.name} status={tenant.status} onEdit={() => setEditOpen(true)} />

      <main className="flex-1 space-y-3 bg-muted/30 px-3 py-3 pb-24">
        {/* 계약 상태 관리 */}
        <Card>
          <CardHeader title="계약 상태 관리" right={
            <button
              type="button"
              disabled={tenant.status === "moved_out"}
              onClick={() => setMoveOutOpen(true)}
              className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
            >
              퇴실 처리
            </button>
          } />
          <div className="grid grid-cols-2 gap-2 px-3 pb-3">
            <StatusTile tone="blue" icon={FileText} title="계약서 전송" status="전송완료" detail="2026. 04. 18. 오후 05:50" />
            <StatusTile tone="green" icon={FileSignature} title="계약 동의" status="동의완료" detail="2026. 04. 18. 오후 10:31" />
            <StatusTile tone="purple" icon={Wallet} title="보증금 납입" status="청구완료" detail={tenant.move_in_date ? `(${tenant.move_in_date})` : "—"} badge="완료" />
            <StatusTile tone="amber" icon={RotateCcw} title="보증금 반환" status="미반환" detail="" />
            <StatusTile tone="gray" icon={CalendarPlus} title="연장신청" status="없음" detail="" />
            <StatusTile tone="gray" icon={LogOut} title="퇴실신청" status={tenant.move_out_date ? "신청됨" : "없음"} detail={tenant.move_out_date ?? ""} />
          </div>
        </Card>

        {/* 계약 정보 */}
        <Card>
          <CardHeader title="계약 정보" />
          <div className="space-y-3 px-3 pb-3">
            <div>
              <p className="text-[11px] text-muted-foreground">건물 / 호실</p>
              <p className="mt-0.5 text-[14px] font-bold">{room ? `${room.room_number}호` : "호실 미배정"}</p>
            </div>
            <div className="border-t border-border pt-2.5">
              <p className="text-[11px] text-muted-foreground">계약기간</p>
              <p className="mt-0.5 text-[14px] font-bold">
                {tenant.move_in_date ?? "—"}{contractEnd ? ` ~ ${contractEnd}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-2.5">
              <KV label="월세" value={formatKRWMan(tenant.monthly_rent ?? 0)} />
              <KV label="보증금" value={formatKRWMan(tenant.deposit ?? 0)} />
              <KV label="월세 납부일" value={tenant.payment_day ? `매달 ${tenant.payment_day}일` : "—"} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <DocBtn icon={FileText} label="주거증명서" onClick={() => _toast.info("준비 중인 기능이에요.")} />
              <DocBtn icon={FileText} label="계약서" onClick={() => _toast.info("준비 중인 기능이에요.")} />
            </div>
          </div>
        </Card>

        {/* 보증금 관리 */}
        <Card>
          <CardHeader title="보증금 관리" right={
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">입금 대기</span>
          } />
          <div className="space-y-2 px-3 pb-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-[12.5px]">
              <span className="truncate text-muted-foreground">하나은행 190-910193-98007 (이상덕)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText("190-910193-98007");
                  _toast.success("계좌번호가 복사되었어요.");
                }}
                className="ml-2 grid h-7 w-7 shrink-0 place-items-center rounded-md hover:bg-accent"
                aria-label="복사"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-[12.5px]">
              <span className="text-muted-foreground">보증금</span>
              <span className="font-bold">{formatKRWMan(tenant.deposit ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="font-bold">최종 반환액</span>
              <span className="font-bold text-[oklch(0.46_0.18_258)]">
                {(tenant.deposit ?? 0).toLocaleString("ko-KR")}원
              </span>
            </div>
          </div>
        </Card>

        {/* 청구서 내역 */}
        <Card>
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[13.5px] font-bold">청구서 내역</h2>
              <span className="text-[11.5px] text-muted-foreground">({invoices.length})</span>
              <button
                type="button"
                onClick={() => setIssueOpen(true)}
                className="ml-1 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                aria-label="추가"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px]">
              <span className="text-muted-foreground">납부일: {nextDueDay}일</span>
              <span className="rounded-md bg-rose-500 px-1.5 py-0.5 font-bold text-white">
                D{dDay >= 0 ? `-${dDay}` : `+${-dDay}`}
              </span>
            </div>
          </div>
          {invoices.length === 0 ? (
            <p className="border-t border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
              청구 내역이 없어요.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {invoices.map((iv) => {
                const paid = iv.status === "paid";
                return (
                  <li key={iv.id} className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold">
                        {iv.due_date} <span className="text-muted-foreground">월세</span>
                      </p>
                      <div className="mt-1 flex gap-1">
                        <Tag>{paid ? "청구" : "미청구"}</Tag>
                        <Tag>계좌이체</Tag>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13.5px] font-bold">{formatKRWMan(iv.amount)}</p>
                      <p className={cn("text-[11px] font-semibold", paid ? "text-emerald-600" : "text-amber-600")}>
                        {paid ? "납부완료" : "대기"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* 첨부파일 */}
        <Card>
          <div className="flex items-center justify-between px-3 py-2.5">
            <h2 className="text-[13.5px] font-bold">첨부파일</h2>
            <button
              type="button"
              onClick={() => _toast.info("준비 중인 기능이에요.")}
              className="inline-flex items-center gap-1 rounded-lg bg-[oklch(0.96_0.02_258)] px-2.5 py-1 text-[11.5px] font-bold text-[oklch(0.46_0.18_258)]"
            >
              <Plus className="h-3 w-3" /> 파일 추가
            </button>
          </div>
          <p className="border-t border-border px-3 py-5 text-center text-[12px] text-muted-foreground">
            첨부된 파일이 없어요.
          </p>
        </Card>

        {/* 메모 */}
        {tenant.memo && (
          <Card>
            <div className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-[13.5px] font-bold">원장님 메모</h2>
              <button
                type="button"
                onClick={() => setMemoOpen(true)}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[oklch(0.46_0.18_258)]"
              >
                <Pencil className="h-3 w-3" /> 수정
              </button>
            </div>
            <p className="whitespace-pre-wrap border-t border-border px-3 py-2.5 text-[12.5px] leading-relaxed">
              {tenant.memo}
            </p>
          </Card>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <ActionMini
            icon={PhoneCall}
            label="전화"
            onClick={() => {
              if (!tenant.phone) return _toast.info("등록된 연락처가 없어요.");
              window.location.href = `tel:${tenant.phone}`;
            }}
          />
          <ActionMini icon={Receipt} label="청구서 발행" onClick={() => setIssueOpen(true)} />
          <ActionMini icon={MessageSquare} label="메모" onClick={() => setMemoOpen(true)} />
        </div>

        {tenant.emergency_contact && (
          <p className="px-1 text-[11px] text-muted-foreground">
            비상 연락처: <span className="font-semibold text-foreground">{tenant.emergency_contact}</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> 입실자 정보 완전 삭제
        </button>
      </main>

      {/* Edit modal */}
      <EditTenantModal
        open={editOpen}
        tenant={tenant}
        onOpenChange={setEditOpen}
        onSaved={load}
      />
      {/* Memo modal */}
      <MemoModal
        open={memoOpen}
        initial={tenant.memo ?? ""}
        onOpenChange={setMemoOpen}
        onSave={async (memo) => {
          const { error } = await supabase.from("tenants").update({ memo }).eq("id", tenant.id);
          if (error) return toast.error(error.message);
          toast.success("메모가 저장되었습니다.");
          setMemoOpen(false);
          load();
        }}
      />
      {/* Move-out modal */}
      <MoveOutModal
        open={moveOutOpen}
        tenantName={tenant.name}
        onOpenChange={setMoveOutOpen}
        onConfirm={handleMoveOut}
      />
      {/* Issue invoice modal */}
      <IssueInvoiceModal
        open={issueOpen}
        defaultAmount={tenant.monthly_rent ?? 0}
        defaultDay={tenant.payment_day ?? 1}
        onOpenChange={setIssueOpen}
        onConfirm={handleIssueInvoice}
      />
      <ConfirmDialog />
    </MobileFrame>
  );
}

function Header({
  onBack,
  title,
  status,
  onEdit,
}: {
  onBack: () => void;
  title: string;
  status?: TenantStatus;
  onEdit?: () => void;
}) {
  return (
    <header className="flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="flex flex-1 items-center gap-2 text-[15px] font-bold">
        {title}
        {status && (
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
            {status === "active" ? "입실자" : status === "overdue" ? "연체" : "퇴실"}
          </span>
        )}
      </h1>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="수정"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        aria-label="더보기"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </header>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card">{children}</section>;
}

function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <h2 className="text-[13.5px] font-bold">{title}</h2>
      {right}
    </div>
  );
}

const TILE_TONES: Record<string, string> = {
  blue: "bg-[oklch(0.97_0.03_258)] border-[oklch(0.92_0.04_258)]",
  green: "bg-emerald-50/70 border-emerald-100",
  purple: "bg-violet-50/70 border-violet-100",
  amber: "bg-amber-50/70 border-amber-100",
  gray: "bg-muted/40 border-border",
};

function StatusTile({
  tone,
  icon: Icon,
  title,
  status,
  detail,
  badge,
}: {
  tone: keyof typeof TILE_TONES;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className={cn("relative rounded-xl border p-2.5", TILE_TONES[tone])}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-foreground/70" />
        <p className="text-[12px] font-bold">{title}</p>
        {badge && (
          <span className="ml-auto rounded-md bg-violet-200/70 px-1.5 py-0.5 text-[9.5px] font-bold text-violet-700">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11.5px] font-semibold text-foreground/80">{status}</p>
      {detail && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold">{value}</p>
    </div>
  );
}

function DocBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-[12px] font-semibold hover:bg-accent"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

function ActionMini({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2.5 text-[11.5px] font-semibold transition active:scale-[0.97]"
    >
      <Icon className="h-4 w-4 text-[oklch(0.46_0.18_258)]" />
      {label}
    </button>
  );
}

function formatKRWMan(amount: number) {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

// Used by edit modal
function _UnusedKeepCheckCircle() {
  return <CheckCircle2 />;
}

/* ---------- Modals ---------- */

function EditTenantModal({
  open,
  onOpenChange,
  tenant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tenant: Tenant;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(tenant);
  useEffect(() => setForm(tenant), [tenant, open]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("이름을 입력해 주세요.");
    const { error } = await supabase
      .from("tenants")
      .update({
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        emergency_contact: form.emergency_contact?.trim() || null,
        monthly_rent: form.monthly_rent ?? 0,
        deposit: form.deposit ?? 0,
        payment_day: form.payment_day ?? 1,
      })
      .eq("id", tenant.id);
    if (error) return toast.error(error.message);
    toast.success("저장되었습니다.");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>입실자 정보 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="이름">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label="연락처">
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              inputMode="tel"
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label="비상 연락처">
            <Input
              value={form.emergency_contact ?? ""}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              className="h-11 rounded-xl"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="월 이용료">
              <Input
                type="number"
                value={form.monthly_rent ?? 0}
                onChange={(e) => setForm({ ...form, monthly_rent: Number(e.target.value) })}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="선납금">
              <Input
                type="number"
                value={form.deposit ?? 0}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          <Field label="결제일 (매달)">
            <Input
              type="number"
              min={1}
              max={31}
              value={form.payment_day ?? 1}
              onChange={(e) => setForm({ ...form, payment_day: Number(e.target.value) })}
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={save}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemoModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: string;
  onSave: (memo: string) => void;
}) {
  const [memo, setMemo] = useState(initial);
  useEffect(() => setMemo(initial), [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>원장님 메모</DialogTitle>
        </DialogHeader>
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="입실자에 대한 특이사항, 주의사항 등을 적어 두세요."
          className="min-h-[140px] rounded-xl"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={() => onSave(memo)}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoveOutModal({
  open,
  onOpenChange,
  tenantName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tenantName: string;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>퇴실 처리</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-muted-foreground">
          <b className="text-foreground">{tenantName}</b> 님의 퇴실을 처리합니다. 호실은 자동으로
          <b className="text-foreground"> 청소중</b>으로 변경되고, 일정에 퇴실 이벤트가 추가됩니다.
        </p>
        <Field label="퇴실일">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl"
          />
        </Field>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => onConfirm(date)}
            className="bg-gradient-to-b from-rose-500 to-rose-600 text-white"
          >
            퇴실 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueInvoiceModal({
  open,
  onOpenChange,
  defaultAmount,
  defaultDay,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultAmount: number;
  defaultDay: number;
  onConfirm: (amount: number, dueDate: string, memo: string) => void;
}) {
  const today = new Date();
  const defaultDue = new Date(
    today.getFullYear(),
    today.getMonth(),
    Math.min(Math.max(defaultDay, 1), 28),
  )
    .toISOString()
    .slice(0, 10);
  const [amount, setAmount] = useState(defaultAmount);
  const [due, setDue] = useState(defaultDue);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setDue(defaultDue);
      setMemo("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>청구서 발행</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="금액">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label="납부 기한">
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label="메모 (선택)">
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 11월 월 이용료"
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={() => onConfirm(amount, due, memo)}>발행</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px]">{label}</Label>
      {children}
    </div>
  );
}
