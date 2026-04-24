import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Phone, MessageSquare, Wallet, CalendarClock, DoorOpen, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

type TenantStatus = "active" | "overdue" | "moved_out";
type Detail = {
  id: string;
  name: string;
  phone: string | null;
  emergency_contact: string | null;
  status: TenantStatus;
  monthly_rent: number | null;
  deposit: number | null;
  payment_day: number | null;
  move_in_date: string | null;
  contract_end: string | null;
  memo: string | null;
  room_id: string | null;
};
type Room = { id: string; room_number: string; floor: number | null };
type InvoiceMini = {
  id: string;
  amount: number;
  due_date: string;
  status: "unpaid" | "paid" | "overdue" | "canceled";
};

export function TenantDetailModal({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Detail | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [invoices, setInvoices] = useState<InvoiceMini[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId || !open) return;
    let aborted = false;
    setLoading(true);
    setTenant(null);
    setRoom(null);
    setInvoices([]);
    (async () => {
      const { data: t } = await supabase
        .from("tenants")
        .select(
          "id, name, phone, emergency_contact, status, monthly_rent, deposit, payment_day, move_in_date, contract_end, memo, room_id",
        )
        .eq("id", tenantId)
        .maybeSingle();
      if (aborted || !t) {
        setLoading(false);
        return;
      }
      setTenant(t as Detail);
      const [r, iv] = await Promise.all([
        t.room_id
          ? supabase.from("rooms").select("id, room_number, floor").eq("id", t.room_id).maybeSingle()
          : Promise.resolve({ data: null } as { data: Room | null }),
        supabase
          .from("invoices")
          .select("id, amount, due_date, status")
          .eq("tenant_id", tenantId)
          .order("due_date", { ascending: false })
          .limit(4),
      ]);
      if (aborted) return;
      setRoom((r.data as Room | null) ?? null);
      setInvoices((iv.data ?? []) as InvoiceMini[]);
      setLoading(false);
    })();
    return () => {
      aborted = true;
    };
  }, [tenantId, open]);

  const unpaid = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
  const unpaidSum = unpaid.reduce((s, i) => s + i.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{tenant?.name ?? "입실자 정보"}</DialogTitle>
        </DialogHeader>

        {loading || !tenant ? (
          <div className="p-10 text-center text-sm text-muted-foreground">불러오는 중…</div>
        ) : (
          <>
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.3_0.16_268)] px-4 pb-4 pt-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-[16px] font-bold ring-2 ring-white/30 backdrop-blur">
                  {tenant.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-[17px] font-bold">{tenant.name}</h2>
                    <StatusBadge kind="tenant" value={tenant.status} className="bg-white/20 text-white" />
                  </div>
                  <p className="mt-0.5 truncate text-[12px] opacity-85">
                    {room ? `${room.room_number}호` : "호실 미배정"}
                    {tenant.payment_day ? ` · 매달 ${tenant.payment_day}일 납부` : ""}
                  </p>
                </div>
              </div>
              <div className="relative mt-3 grid grid-cols-3 gap-2">
                <HeroStat label="월세" value={`${Math.round((tenant.monthly_rent ?? 0) / 10000)}만`} />
                <HeroStat label="보증금" value={`${Math.round((tenant.deposit ?? 0) / 10000)}만`} />
                <HeroStat
                  label="미납"
                  value={unpaid.length > 0 ? `${unpaid.length}건` : "없음"}
                  highlight={unpaid.length > 0}
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2 border-b border-border bg-card px-3 py-3">
              <ActionBtn
                icon={Phone}
                label="전화"
                disabled={!tenant.phone}
                onClick={() => tenant.phone && (window.location.href = `tel:${tenant.phone}`)}
              />
              <ActionBtn
                icon={MessageSquare}
                label="문자"
                disabled={!tenant.phone}
                onClick={() => tenant.phone && (window.location.href = `sms:${tenant.phone}`)}
              />
              <ActionBtn
                icon={ArrowRight}
                label="수정"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/tenants/$tenantId/edit", params: { tenantId: tenant.id } });
                }}
              />
            </div>



            <div className="space-y-3 bg-muted/30 p-3">
              {/* 연락처 */}
              <Card>
                <CardHeader title="연락처" />
                <div className="space-y-2 px-3 pb-3 text-[12.5px]">
                  <Row label="본인" value={tenant.phone ?? "—"} />
                  <Row label="비상" value={tenant.emergency_contact ?? "—"} />
                </div>
              </Card>

              {/* 계약 정보 */}
              <Card>
                <CardHeader title="계약 정보" />
                <div className="space-y-2 px-3 pb-3 text-[12.5px]">
                  <Row
                    icon={DoorOpen}
                    label="호실"
                    value={room ? `${room.floor ? `${room.floor}층 ` : ""}${room.room_number}호` : "미배정"}
                  />
                  <Row
                    icon={CalendarClock}
                    label="입실일"
                    value={tenant.move_in_date ?? "—"}
                  />
                  <Row
                    icon={Wallet}
                    label="월세 / 보증금"
                    value={`${formatKRW(tenant.monthly_rent ?? 0)} / ${formatKRW(tenant.deposit ?? 0)}`}
                  />
                </div>
              </Card>

              {/* 청구서 */}
              <Card>
                <CardHeader
                  title="최근 청구서"
                  right={
                    unpaid.length > 0 ? (
                      <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        미납 {formatKRW(unpaidSum)}
                      </span>
                    ) : null
                  }
                />
                {invoices.length === 0 ? (
                  <p className="px-3 pb-3 text-[12px] text-muted-foreground">청구 내역이 없어요.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {invoices.map((iv) => (
                      <li key={iv.id} className="flex items-center gap-2 px-3 py-2 text-[12.5px]">
                        <StatusBadge kind="invoice" value={iv.status} />
                        <span className="text-muted-foreground">{iv.due_date}</span>
                        <span className="ml-auto font-bold">{formatKRW(iv.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* 메모 */}
              {tenant.memo && (
                <Card>
                  <CardHeader title="메모" />
                  <p className="whitespace-pre-wrap px-3 pb-3 text-[12.5px] text-foreground">
                    {tenant.memo}
                  </p>
                </Card>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HeroStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-[60px] flex-col items-center justify-center rounded-xl bg-white/12 px-2 py-2 text-center ring-1 ring-white/20 backdrop-blur",
        highlight && "bg-rose-500/40 ring-rose-200/40",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-[14px] font-bold leading-tight tabular-nums">{value}</p>
    </div>
  );
}



function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card py-2 text-[11.5px] font-semibold transition hover:bg-accent",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Icon className="h-4 w-4 text-brand" />
      {label}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>;
}
function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <h3 className="text-[13px] font-bold">{title}</h3>
      {right}
    </div>
  );
}
function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto truncate text-right font-semibold">{value}</span>
    </div>
  );
}
