import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarClock, Pencil, User2, Wallet, DoorOpen, Phone, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  buildAutoRoomName,
  ROOM_OPTIONS,
  ROOM_TAGS,
  type RoomCategory,
  type WindowKind,
  type RoomSize,
} from "@/lib/roomTemplate";

type RoomStatus = "vacant" | "occupied" | "cleaning" | "maintenance";

export type RoomDetail = {
  id: string;
  room_number: string;
  floor: number | null;
  status: RoomStatus;
  room_type_id: string | null;
  room_category: RoomCategory | null;
  window_type: WindowKind | null;
  size_type: RoomSize | null;
  extra_options: string[];
  tags: string[];
  auto_name: string | null;
};

type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  monthly_rent: number | null;
  deposit: number | null;
  payment_day: number | null;
  move_in_date: string | null;
  contract_end: string | null;
};

const STATUS_LABEL: Record<RoomStatus, string> = {
  vacant: "공실",
  occupied: "입실",
  cleaning: "청소",
  maintenance: "수리",
};

const STATUS_TONE: Record<RoomStatus, string> = {
  vacant: "bg-rose-50 text-rose-600 ring-rose-200",
  occupied: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  cleaning: "bg-amber-50 text-amber-600 ring-amber-200",
  maintenance: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function RoomDetailModal({
  room,
  typeName,
  open,
  onOpenChange,
  onEdit,
}: {
  room: RoomDetail | null;
  typeName?: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onEdit: () => void;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!room || !open) return;
    let aborted = false;
    setTenant(null);
    if (room.status !== "occupied") return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, phone, monthly_rent, deposit, payment_day, move_in_date, contract_end")
        .eq("room_id", room.id)
        .neq("status", "moved_out")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aborted) return;
      setTenant((data as Tenant | null) ?? null);
      setLoading(false);
    })();
    return () => {
      aborted = true;
    };
  }, [room, open]);

  if (!room) return null;

  const autoName =
    room.auto_name ??
    buildAutoRoomName({
      category: room.room_category,
      window_type: room.window_type,
      size_type: room.size_type,
    });

  const optLabel = (v: string) =>
    ROOM_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const tagLabel = (v: string) =>
    ROOM_TAGS.find((o) => o.value === v)?.label ?? v;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{room.room_number}호 상세</DialogTitle>
        </DialogHeader>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.46_0.18_258)] via-[oklch(0.4_0.18_262)] to-[oklch(0.3_0.16_268)] px-4 pb-4 pt-5 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 text-[15px] font-extrabold ring-2 ring-white/30 backdrop-blur">
              {room.room_number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-[17px] font-bold">
                  {room.room_number}호
                </h2>
                <span
                  className={cn(
                    "rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-white/30",
                  )}
                >
                  {STATUS_LABEL[room.status]}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] opacity-85">
                {room.floor ? `${room.floor}층` : "층 미설정"}
                {typeName ? ` · ${typeName}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition hover:bg-white/25"
              aria-label="수정"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          {autoName && (
            <p className="relative mt-3 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-white/25">
              {autoName}
            </p>
          )}
        </div>

        <div className="space-y-3 bg-muted/30 p-3">
          {/* 호실 정보 */}
          <Card>
            <CardHeader title="호실 정보" />
            <div className="space-y-2 px-3 pb-3 text-[12.5px]">
              <Row
                icon={DoorOpen}
                label="상태"
                value={
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold ring-1",
                      STATUS_TONE[room.status],
                    )}
                  >
                    {STATUS_LABEL[room.status]}
                  </span>
                }
              />
              <Row label="창문" value={room.window_type === "external" ? "외창" : room.window_type === "internal" ? "내창" : "—"} />
              <Row
                label="크기"
                value={
                  room.size_type === "wide"
                    ? "와이드"
                    : room.size_type === "duplex"
                      ? "복층"
                      : room.size_type === "standard"
                        ? "스탠다드"
                        : "—"
                }
              />
            </div>
            {(room.extra_options?.length || room.tags?.length) ? (
              <div className="border-t border-border px-3 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {(room.extra_options ?? []).map((o) => (
                    <span
                      key={`opt-${o}`}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[10.5px] font-semibold text-foreground/80"
                    >
                      {optLabel(o)}
                    </span>
                  ))}
                  {(room.tags ?? []).map((t) => (
                    <span
                      key={`tag-${t}`}
                      className="rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-semibold text-brand"
                    >
                      #{tagLabel(t)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* 입실자 */}
          <Card>
            <CardHeader title="입실자" />
            {loading ? (
              <p className="px-3 pb-3 text-[12px] text-muted-foreground">불러오는 중…</p>
            ) : !tenant ? (
              <p className="px-3 pb-3 text-[12px] text-muted-foreground">
                {room.status === "occupied" ? "배정된 입실자가 없어요." : "현재 비어있는 호실이에요."}
              </p>
            ) : (
              <div className="space-y-2 px-3 pb-3 text-[12.5px]">
                <Row icon={User2} label="이름" value={tenant.name} />
                <Row icon={Phone} label="연락처" value={tenant.phone ?? "—"} />
                <Row
                  icon={Wallet}
                  label="월세 / 보증금"
                  value={`${formatKRW(tenant.monthly_rent ?? 0)} / ${formatKRW(tenant.deposit ?? 0)}`}
                />
                <Row
                  icon={CalendarClock}
                  label="계약 기간"
                  value={
                    tenant.move_in_date
                      ? `${tenant.move_in_date}${tenant.contract_end ? ` ~ ${tenant.contract_end}` : ""}`
                      : "—"
                  }
                />
                {tenant.payment_day ? (
                  <Row label="납부일" value={`매달 ${tenant.payment_day}일`} />
                ) : null}
              </div>
            )}
          </Card>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-[13px] font-bold transition hover:bg-accent"
          >
            <Pencil className="h-4 w-4 text-brand" />
            호실 정보 수정
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatKRW(n: number) {
  return `${Math.round(n / 10000)}만원`;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <h3 className="text-[13px] font-bold">{title}</h3>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
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
