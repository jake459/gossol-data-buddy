import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search, UserRound, Phone } from "lucide-react";
import { TenantDetailModal } from "@/components/TenantDetailModal";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { Pager } from "@/components/Pager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { notifyValidation } from "@/components/ValidationModal";
import { notify } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "입실자 — Gossol" }] }),
  component: TenantsPage,
});

type TenantStatus = "active" | "overdue" | "moved_out";
type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  status: TenantStatus;
  monthly_rent: number | null;
  payment_day: number | null;
  room_id: string | null;
};
type RoomMini = { id: string; room_number: string; status: string; room_type_id: string | null };
type RoomTypeMini = { id: string; name: string; monthly_rent: number; deposit: number };

const PAGE_SIZE = 6;

function TenantsPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const navigate = useNavigate();
  const [items, setItems] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<RoomMini[]>([]);
  const [types, setTypes] = useState<RoomTypeMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openNew, setOpenNew] = useState(false);

  // New-tenant modal form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");
  const [roomId, setRoomId] = useState<string>("none");
  const [moveIn, setMoveIn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentDay, setPaymentDay] = useState<number>(1);
  const [rent, setRent] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    if (!selected) return;
    setLoading(true);
    const [t, r, ty] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, phone, status, monthly_rent, payment_day, room_id")
        .eq("branch_id", selected.id)
        .order("created_at", { ascending: false }),
      supabase.from("rooms").select("id, room_number, status, room_type_id").eq("branch_id", selected.id),
      supabase.from("room_types").select("id, name, monthly_rent, deposit").eq("branch_id", selected.id),
    ]);
    setItems((t.data ?? []) as Tenant[]);
    setRooms((r.data ?? []) as RoomMini[]);
    setTypes((ty.data ?? []) as RoomTypeMini[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Auto-fill rent/deposit from chosen room's type
  useEffect(() => {
    if (roomId === "none") return;
    const room = rooms.find((r) => r.id === roomId);
    if (!room?.room_type_id) return;
    const t = types.find((x) => x.id === room.room_type_id);
    if (t) {
      if (!rent) setRent(t.monthly_rent);
      if (!deposit) setDeposit(t.deposit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmergency("");
    setRoomId("none");
    setMoveIn(new Date().toISOString().slice(0, 10));
    setPaymentDay(1);
    setRent(0);
    setDeposit(0);
    setMemo("");
  };

  const submit = async () => {
    if (!user || !selected) return;
    if (!name.trim()) return notifyValidation("이름을 입력해 주세요.");
    setSubmitting(true);
    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({
        owner_id: user.id,
        branch_id: selected.id,
        name: name.trim(),
        phone: phone.trim() || null,
        emergency_contact: emergency.trim() || null,
        room_id: roomId === "none" ? null : roomId,
        move_in_date: moveIn || null,
        payment_day: paymentDay,
        monthly_rent: rent,
        deposit,
        memo: memo.trim() || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !tenant) {
      setSubmitting(false);
      return toast.error(error?.message ?? "등록에 실패했습니다.");
    }
    if (roomId !== "none") {
      await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId);
      await supabase.from("events").insert({
        owner_id: user.id,
        branch_id: selected.id,
        title: `${name} 입실`,
        kind: "move_in",
        event_date: moveIn,
        room_id: roomId,
        tenant_id: tenant.id,
      });
    }
    await notify({
      recipientId: user.id,
      branchId: selected.id,
      audience: "owner",
      category: "move_in",
      title: `${name} 님 입실 등록`,
      body: roomId !== "none" ? `${rooms.find((r) => r.id === roomId)?.room_number ?? ""}호 배정` : "호실 미배정",
      link: `/tenants/${tenant.id}`,
    });
    setSubmitting(false);
    toast.success("입실 등록이 완료되었습니다.");
    resetForm();
    setOpenNew(false);
    loadAll();
    navigate({ to: "/tenants/$tenantId", params: { tenantId: tenant.id } });
  };

  const filtered = items.filter(
    (t) => !q || t.name.includes(q) || (t.phone ?? "").includes(q),
  );

  useEffect(() => setPage(1), [q, selected?.id]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const vacantRooms = rooms.filter((r) => r.status === "vacant" || r.status === "cleaning");

  return (
    <MobileFrame>
      <TopBar />
      <header className="bg-gradient-to-b from-white/85 to-transparent px-4 pb-3 pt-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">입실자</h1>
          <Button size="sm" onClick={() => setOpenNew(true)} className="h-9 rounded-xl">
            <Plus className="h-4 w-4" /> 입실 등록
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·연락처 검색"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={q ? "검색 결과가 없어요" : "아직 등록된 입실자가 없어요"}
            description={q ? "다른 이름이나 연락처로 검색해 보세요." : "첫 입실자를 등록해 운영을 시작해 보세요."}
            actionLabel="입실 등록"
            onAction={() => setOpenNew(true)}
          />
        ) : (
          <>
            <ul className="space-y-2">
              {pageItems.map((t) => {
                const room = rooms.find((r) => r.id === t.room_id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:bg-accent/40"
                  >
                    <Link
                      to="/tenants/$tenantId"
                      params={{ tenantId: t.id }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-[13px] font-bold text-brand">
                        {t.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13.5px] font-semibold">{t.name}</p>
                          <StatusBadge kind="tenant" value={t.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                          {room ? `${room.room_number}호` : "미배정"} · 월 {formatKRW(t.monthly_rent ?? 0)}
                          {t.payment_day ? ` · 매달 ${t.payment_day}일` : ""}
                        </p>
                      </div>
                    </Link>
                    {t.phone && (
                      <a
                        href={`tel:${t.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
                        aria-label="전화"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pager page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} />
          </>
        )}
      </main>

      <BottomTabs />

      <Dialog open={openNew} onOpenChange={(o) => { setOpenNew(o); if (!o) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>입실 등록</DialogTitle>
            <DialogDescription className="text-[12px]">
              새 입실자를 등록하면 호실 상태와 일정에 자동 반영돼요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="이름 *">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" placeholder="홍길동" />
              </FormField>
              <FormField label="연락처">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="h-10 rounded-xl" placeholder="010-..." />
              </FormField>
            </div>
            <FormField label="비상 연락처">
              <Input value={emergency} onChange={(e) => setEmergency(e.target.value)} className="h-10 rounded-xl" />
            </FormField>
            <FormField label="배정 호실">
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="공실 호실 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미배정</SelectItem>
                  {vacantRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number}호
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="입실일">
                <Input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="h-10 rounded-xl" />
              </FormField>
              <FormField label="결제일 (매달)">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(Number(e.target.value))}
                  className="h-10 rounded-xl"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="월 이용료(원)">
                <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} className="h-10 rounded-xl" />
              </FormField>
              <FormField label="보증금(원)">
                <Input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="h-10 rounded-xl" />
              </FormField>
            </div>
            <FormField label="메모">
              <Input value={memo} onChange={(e) => setMemo(e.target.value)} className="h-10 rounded-xl" />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNew(false)}>취소</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileFrame>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[12px]">{label}</Label>
      {children}
    </div>
  );
}
