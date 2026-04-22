import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  Phone,
  Calendar,
  DoorOpen,
  Receipt,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Pencil,
  Trash2,
  MessageSquare,
  Wallet,
  ShieldAlert,
  PhoneCall,
} from "lucide-react";
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

  return (
    <MobileFrame>
      <Header onBack={() => navigate({ to: "/tenants" })} title="입실자 상세" />

      <main className="flex-1 space-y-4 px-4 py-4 pb-24">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.32_0.16_268)] p-4 text-white shadow-[0_18px_40px_-15px_oklch(0.32_0.16_262/0.5)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-[20px] font-bold ring-2 ring-white/30">
              {tenant.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold">{tenant.name}</h1>
                <StatusBadge kind="tenant" value={tenant.status} className="bg-white/20 text-white" />
              </div>
              <p className="mt-0.5 text-[12.5px] opacity-85">
                {room ? `${room.floor ?? "-"}층 · ${room.room_number}호` : "호실 미배정"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            <MiniStat label="월 이용료" value={formatKRW(tenant.monthly_rent ?? 0)} />
            <MiniStat
              label="결제일"
              value={tenant.payment_day ? `매달 ${tenant.payment_day}일` : "—"}
            />
          </div>

          {unpaidCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/25 px-3 py-2 text-[12.5px] font-semibold ring-1 ring-rose-200/40">
              <ShieldAlert className="h-4 w-4" />
              미수금 {unpaidCount}건 · {formatKRW(unpaidSum)}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-4 gap-2">
          <ActionTile
            icon={PhoneCall}
            label="전화"
            color="text-emerald-600"
            bg="bg-emerald-50"
            onClick={() => {
              if (!tenant.phone) return toast.info("등록된 연락처가 없어요.");
              window.location.href = `tel:${tenant.phone}`;
            }}
          />
          <ActionTile
            icon={Receipt}
            label="청구서"
            color="text-[oklch(0.46_0.18_258)]"
            bg="bg-[oklch(0.97_0.03_258)]"
            onClick={() => setIssueOpen(true)}
          />
          <ActionTile
            icon={MessageSquare}
            label="메모"
            color="text-amber-600"
            bg="bg-amber-50"
            onClick={() => setMemoOpen(true)}
          />
          <ActionTile
            icon={LogOut}
            label="퇴실"
            color="text-rose-600"
            bg="bg-rose-50"
            disabled={tenant.status === "moved_out"}
            onClick={() => setMoveOutOpen(true)}
          />
        </section>

        {/* Info card */}
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">기본 정보</h2>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand"
            >
              <Pencil className="h-3.5 w-3.5" /> 수정
            </button>
          </div>
          <InfoRow icon={Phone} label="연락처" value={tenant.phone ?? "—"} />
          <InfoRow icon={ShieldAlert} label="비상 연락처" value={tenant.emergency_contact ?? "—"} />
          <InfoRow
            icon={Calendar}
            label="입실일"
            value={tenant.move_in_date ?? "—"}
          />
          {tenant.move_out_date && (
            <InfoRow icon={LogOut} label="퇴실일" value={tenant.move_out_date} />
          )}
          <InfoRow
            icon={Wallet}
            label="선납금"
            value={formatKRW(tenant.deposit ?? 0)}
          />
          <InfoRow
            icon={DoorOpen}
            label="배정 호실"
            value={room ? `${room.room_number}호` : "미배정"}
          />
        </section>

        {/* Memo */}
        {tenant.memo && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-amber-700">
              <MessageSquare className="h-3.5 w-3.5" /> 원장님 메모
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
              {tenant.memo}
            </p>
          </section>
        )}

        {/* Invoice history */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-[14px] font-bold">청구 내역</h2>
            <span className="text-[12px] text-muted-foreground">최근 12건</span>
          </div>
          {invoices.length === 0 ? (
            <p className="border-t border-border px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              아직 청구 내역이 없어요.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {invoices.map((iv) => {
                const paid = iv.status === "paid";
                return (
                  <li key={iv.id} className="flex items-center gap-3 px-4 py-3">
                    {paid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px] font-semibold", paid && "opacity-60")}>
                        {iv.due_date}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {paid ? `수금일 ${iv.paid_at?.slice(0, 10) ?? ""}` : "미납"}
                      </p>
                    </div>
                    <p className={cn("text-[13.5px] font-bold", paid ? "text-muted-foreground" : "text-foreground")}>
                      {formatKRW(iv.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Danger zone */}
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" /> 입실자 정보 완전 삭제
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

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="flex items-center gap-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 text-[15px] font-bold">{title}</h1>
    </header>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/12 p-2.5 ring-1 ring-white/20 backdrop-blur-sm">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-0.5 text-[14px] font-bold leading-tight">{value}</div>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  label,
  color,
  bg,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-[11.5px] font-semibold transition active:scale-[0.97]",
        disabled && "opacity-40",
      )}
    >
      <span className={cn("grid h-9 w-9 place-items-center rounded-full", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
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
