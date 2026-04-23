import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { notify } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tenants/new")({
  head: () => ({ meta: [{ title: "입실 등록 — Gossol" }] }),
  component: NewTenantPage,
});

function NewTenantPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selected } = useBranch();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");
  const [roomId, setRoomId] = useState<string>("none");
  const [moveIn, setMoveIn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentDay, setPaymentDay] = useState<number>(1);
  const [rent, setRent] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState<{ id: string; room_number: string; room_type_id: string | null }[]>([]);
  const [types, setTypes] = useState<{ id: string; monthly_rent: number; deposit: number }[]>([]);

  useEffect(() => {
    if (!selected) return;
    Promise.all([
      supabase
        .from("rooms")
        .select("id, room_number, room_type_id")
        .eq("branch_id", selected.id)
        .in("status", ["vacant", "cleaning"])
        .order("room_number"),
      supabase
        .from("room_types")
        .select("id, monthly_rent, deposit")
        .eq("branch_id", selected.id),
    ]).then(([r, t]) => {
      setRooms((r.data ?? []) as typeof rooms);
      setTypes((t.data ?? []) as typeof types);
    });
  }, [selected?.id]);

  // Auto-fill rent/deposit from selected room's type
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    if (!name.trim()) return notifyValidation("이름을 입력해 주세요.");
    setLoading(true);
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
        deposit: deposit,
        memo: memo.trim() || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !tenant) {
      setLoading(false);
      return toast.error(error?.message ?? "등록에 실패했습니다.");
    }
    // Mark room as occupied
    if (roomId !== "none") {
      await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId);
      // Add move_in event
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

    // Auto-issue invoices: deposit (if any) + first month rent
    const moveInDate = moveIn ? new Date(moveIn) : new Date();
    const firstDueDay = Math.min(Math.max(paymentDay, 1), 28);
    const firstDue = new Date(moveInDate.getFullYear(), moveInDate.getMonth(), firstDueDay);
    if (firstDue < moveInDate) firstDue.setMonth(firstDue.getMonth() + 1);
    const cycleMonth = `${firstDue.getFullYear()}-${String(firstDue.getMonth() + 1).padStart(2, "0")}-01`;
    const autoInvoices: Array<{
      owner_id: string;
      branch_id: string;
      tenant_id: string;
      amount: number;
      due_date: string;
      kind: "deposit" | "first_rent" | "monthly";
      status: "unpaid";
      memo: string;
      cycle_month?: string;
    }> = [];
    if (deposit > 0) {
      autoInvoices.push({
        owner_id: user.id,
        branch_id: selected.id,
        tenant_id: tenant.id,
        amount: deposit,
        due_date: moveIn || new Date().toISOString().slice(0, 10),
        kind: "deposit",
        status: "unpaid",
        memo: "보증금",
      });
    }
    if (rent > 0) {
      autoInvoices.push({
        owner_id: user.id,
        branch_id: selected.id,
        tenant_id: tenant.id,
        amount: rent,
        due_date: firstDue.toISOString().slice(0, 10),
        kind: "first_rent",
        status: "unpaid",
        memo: "첫달 월 이용료",
        cycle_month: cycleMonth,
      });
    }
    if (autoInvoices.length > 0) {
      await supabase.from("invoices").insert(autoInvoices);
    }

    // Notify owner
    await notify({
      recipientId: user.id,
      branchId: selected.id,
      audience: "owner",
      category: "move_in",
      title: `${name} 님 입실 등록`,
      body: roomId !== "none" ? `${rooms.find((r) => r.id === roomId)?.room_number ?? ""}호 배정` : "호실 미배정",
      link: `/tenants/${tenant.id}`,
    });

    setLoading(false);
    toast.success("입실 등록이 완료되었습니다.");
    navigate({ to: "/tenants" });
  };

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/tenants" })}
          className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold">입실 등록</h1>
      </header>

      <main className="flex-1 px-5 py-5">
        <form onSubmit={submit} className="space-y-4">
          <Section title="입실자 정보">
            <Field label="이름 *">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
            </Field>
            <Field label="연락처">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="h-11 rounded-xl" />
            </Field>
            <Field label="비상 연락처">
              <Input value={emergency} onChange={(e) => setEmergency(e.target.value)} className="h-11 rounded-xl" />
            </Field>
          </Section>

          <Section title="호실/계약">
            <Field label="배정 호실">
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="공실 호실 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미배정</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number}호
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="입실일">
              <Input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="h-11 rounded-xl" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="월 이용료(원)">
                <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} className="h-11 rounded-xl" />
              </Field>
              <Field label="선납금(원)">
                <Input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="h-11 rounded-xl" />
              </Field>
            </div>
            <Field label="결제일 (매달)">
              <Input
                type="number"
                min={1}
                max={31}
                value={paymentDay}
                onChange={(e) => setPaymentDay(Number(e.target.value))}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="메모">
              <Input value={memo} onChange={(e) => setMemo(e.target.value)} className="h-11 rounded-xl" />
            </Field>
          </Section>

          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-[15px] font-semibold">
            {loading ? "등록 중..." : "입실 등록"}
          </Button>
        </form>
      </main>
    </MobileFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-[13px] font-bold text-foreground">{title}</h2>
      {children}
    </section>
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
