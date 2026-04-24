import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronDown, Phone, CreditCard, FileText, Pause } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/hooks/useBranch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId/edit")({
  head: () => ({ meta: [{ title: "입실자 수정 — Gossol" }] }),
  component: TenantEditPage,
});

type Gender = "male" | "female" | "";
type ContractType = "monthly" | "lump";

type RoomMini = { id: string; room_number: string; status: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function diffDays(a: string, b: string) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function TenantEditPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { selected } = useBranch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 기본 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [nationality, setNationality] = useState("대한민국");

  // 비상 연락처
  const [emergency, setEmergency] = useState("");
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // 계약 정보
  const [roomId, setRoomId] = useState<string>("none");
  const [originalRoomId, setOriginalRoomId] = useState<string | null>(null);
  const [contractStart, setContractStart] = useState(todayISO());
  const [contractEnd, setContractEnd] = useState(addMonths(todayISO(), 1));
  const [rooms, setRooms] = useState<RoomMini[]>([]);

  // 결제 정보
  const [contractType, setContractType] = useState<ContractType>("monthly");
  const [rent, setRent] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [paymentDay, setPaymentDay] = useState<number>(1);

  // 청구 / 환불 / 메모
  const [autoInvoice, setAutoInvoice] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBank, setRefundBank] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [refundHolder, setRefundHolder] = useState("");
  const [memoOpen, setMemoOpen] = useState(false);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!selected) return;
    let aborted = false;
    setLoading(true);
    (async () => {
      const [t, r] = await Promise.all([
        supabase
          .from("tenants")
          .select(
            "name, phone, emergency_contact, room_id, monthly_rent, deposit, payment_day, contract_start, contract_end, move_in_date, memo",
          )
          .eq("id", tenantId)
          .maybeSingle(),
        supabase
          .from("rooms")
          .select("id, room_number, status")
          .eq("branch_id", selected.id)
          .order("room_number"),
      ]);
      if (aborted) return;
      const data = t.data;
      if (data) {
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setEmergency(data.emergency_contact ?? "");
        setRoomId(data.room_id ?? "none");
        setOriginalRoomId(data.room_id ?? null);
        const cs = data.contract_start ?? data.move_in_date ?? todayISO();
        const ce = data.contract_end ?? addMonths(cs, 1);
        setContractStart(cs);
        setContractEnd(ce);
        setRent(Number(data.monthly_rent ?? 0));
        setDeposit(Number(data.deposit ?? 0));
        setPaymentDay(Number(data.payment_day ?? 1));

        // Try parse extras stored as JSON in memo
        if (data.memo) {
          const m = data.memo.match(/__GS_EXTRA__\{[\s\S]*?\}__\/GS_EXTRA__/);
          if (m) {
            try {
              const json = JSON.parse(m[0].replace("__GS_EXTRA__", "").replace("__/GS_EXTRA__", ""));
              if (json.birthDate) setBirthDate(json.birthDate);
              if (json.gender) setGender(json.gender);
              if (json.nationality) setNationality(json.nationality);
              if (json.contractType) setContractType(json.contractType);
              if (typeof json.autoInvoice === "boolean") setAutoInvoice(json.autoInvoice);
              if (json.refundBank) setRefundBank(json.refundBank);
              if (json.refundAccount) setRefundAccount(json.refundAccount);
              if (json.refundHolder) setRefundHolder(json.refundHolder);
              setMemo(data.memo.replace(m[0], "").trim());
            } catch {
              setMemo(data.memo);
            }
          } else {
            setMemo(data.memo);
          }
        }
      }
      setRooms((r.data ?? []) as RoomMini[]);
      setLoading(false);
    })();
    return () => {
      aborted = true;
    };
  }, [tenantId, selected?.id]);

  const contractDays = diffDays(contractStart, contractEnd);
  const contractMonths = Math.max(1, Math.round(contractDays / 30));
  const startInPast = new Date(contractStart) <= new Date(todayISO());

  const submit = async () => {
    if (!name.trim()) return notifyValidation("이름을 입력해 주세요.");
    if (!phone.trim()) return notifyValidation("연락처를 입력해 주세요.");

    setSaving(true);
    const extras = {
      birthDate,
      gender,
      nationality,
      contractType,
      autoInvoice,
      refundBank,
      refundAccount,
      refundHolder,
    };
    const memoCombined =
      `${memo}\n__GS_EXTRA__${JSON.stringify(extras)}__/GS_EXTRA__`.trim();

    const { error } = await supabase
      .from("tenants")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        emergency_contact: emergency.trim() || null,
        room_id: roomId === "none" ? null : roomId,
        monthly_rent: contractType === "lump" ? 0 : rent,
        deposit,
        payment_day: paymentDay,
        contract_start: contractStart,
        contract_end: contractEnd,
        move_in_date: startInPast ? contractStart : null,
        memo: memoCombined,
      })
      .eq("id", tenantId);

    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    // Update room occupancy if changed
    if (originalRoomId !== (roomId === "none" ? null : roomId)) {
      if (originalRoomId) {
        await supabase.from("rooms").update({ status: "vacant" }).eq("id", originalRoomId);
      }
      if (roomId !== "none") {
        await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId);
      }
    }

    setSaving(false);
    toast.success("입실자 정보가 저장되었습니다.");
    navigate({ to: "/tenants/$tenantId", params: { tenantId } });
  };

  if (loading) {
    return (
      <MobileFrame>
        <TopBar />
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <TopBar />
      <header className="flex items-center gap-2 border-b border-border bg-card/80 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate({ to: "/tenants/$tenantId", params: { tenantId } })}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
          aria-label="뒤로"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold">입실자 수정</h1>
          <p className="truncate text-[11px] text-muted-foreground">
            {selected?.name ?? "—"} · 입실자 정보를 수정합니다
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-3 bg-muted/30 px-3 py-3 pb-28">
        {/* 기본 정보 */}
        <Section title="기본 정보">
          <Field label="이름" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
          </Field>
          <Field label="연락처" required>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="h-10 rounded-xl"
              placeholder="010-0000-0000"
            />
          </Field>
          <Field label="생년월일">
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-10 rounded-xl"
              placeholder="날짜를 선택하세요"
            />
          </Field>
          <Field label="성별">
            <div className="flex gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? "" : (g as Gender))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                    gender === g
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-background text-foreground/70 hover:bg-accent",
                  )}
                >
                  {g === "male" ? "♂ 남성" : "♀ 여성"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="국적">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {[
                { k: "KR", label: "대한민국" },
                { k: "CN", label: "중국" },
                { k: "VN", label: "베트남" },
                { k: "JP", label: "일본" },
              ].map((n) => (
                <button
                  key={n.k}
                  type="button"
                  onClick={() => setNationality(n.label)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition",
                    nationality === n.label
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-background text-foreground/70 hover:bg-accent",
                  )}
                >
                  <span className="mr-1 rounded bg-muted px-1 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                    {n.k}
                  </span>
                  {n.label}
                </button>
              ))}
            </div>
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} className="h-10 rounded-xl" />
          </Field>
        </Section>

        {/* 비상 연락처 */}
        <CollapsibleSection
          icon={Phone}
          title="비상 연락처"
          subtitle="선택사항 · 터치하여 입력"
          open={emergencyOpen}
          onToggle={() => setEmergencyOpen((v) => !v)}
        >
          <Field label="비상 연락처">
            <Input
              value={emergency}
              onChange={(e) => setEmergency(e.target.value)}
              inputMode="tel"
              className="h-10 rounded-xl"
              placeholder="010-0000-0000"
            />
          </Field>
        </CollapsibleSection>

        {/* 계약 정보 */}
        <Section title="계약 정보">
          <Field label="호실" required>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="호실 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미배정</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.id === originalRoomId ? `🟢 입실 - ${r.room_number}호` : `${r.room_number}호`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">수정 모드에서는 호실 변경이 불가능합니다.</p>
            {roomId !== "none" && (
              <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-900">
                    {rooms.find((r) => r.id === roomId)?.room_number ?? "—"}
                  </p>
                  <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    입실중
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  월세: {Math.round(rent / 10000)}만원 · 보증금: {Math.round(deposit / 10000)}만원
                </p>
              </div>
            )}
          </Field>

          <DateField
            label="계약 시작일"
            required
            value={contractStart}
            onChange={setContractStart}
            hint={startInPast ? "시작일이 과거이므로 입실자로 등록됩니다." : undefined}
          />
          <DateField
            label="계약 종료일"
            required
            value={contractEnd}
            onChange={setContractEnd}
          />
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-[11.5px] font-semibold text-blue-700">
            계약 기간: {contractDays}일 (약 {contractMonths}개월)
          </div>
        </Section>

        {/* 결제 정보 */}
        <Section title="결제 정보">
          <Field label="계약 형태">
            <div className="flex gap-4 text-[12.5px]">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={contractType === "monthly"}
                  onChange={() => setContractType("monthly")}
                />
                월세
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={contractType === "lump"}
                  onChange={() => setContractType("lump")}
                />
                일시납
              </label>
            </div>
          </Field>
          <AmountField label="월 이용료" required value={rent} onChange={setRent} />
          <AmountField label="보증금" required value={deposit} onChange={setDeposit} />
          <Field label="결제일">
            <Select value={String(paymentDay)} onValueChange={(v) => setPaymentDay(Number(v))}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    매월 {d}일
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        {/* 청구 설정 */}
        <Section title="청구 설정">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted">
              <Pause className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">청구서 자동발송</p>
              <p className="text-[11px] text-muted-foreground">
                {autoInvoice ? "활성화됨" : "지점에서 비활성화됨"}
              </p>
            </div>
            <Switch checked={autoInvoice} onCheckedChange={setAutoInvoice} />
          </div>
        </Section>

        {/* 환불 계좌 */}
        <CollapsibleSection
          icon={CreditCard}
          title="환불 계좌 정보"
          subtitle="선택사항 · 터치하여 입력"
          open={refundOpen}
          onToggle={() => setRefundOpen((v) => !v)}
        >
          <Field label="은행">
            <Input value={refundBank} onChange={(e) => setRefundBank(e.target.value)} className="h-10 rounded-xl" placeholder="예: 하나은행" />
          </Field>
          <Field label="계좌번호">
            <Input value={refundAccount} onChange={(e) => setRefundAccount(e.target.value)} className="h-10 rounded-xl" />
          </Field>
          <Field label="예금주">
            <Input value={refundHolder} onChange={(e) => setRefundHolder(e.target.value)} className="h-10 rounded-xl" />
          </Field>
        </CollapsibleSection>

        {/* 메모 */}
        <CollapsibleSection
          icon={FileText}
          title="메모"
          subtitle="선택사항 · 터치하여 입력"
          open={memoOpen}
          onToggle={() => setMemoOpen((v) => !v)}
        >
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            className="rounded-xl"
            placeholder="입실자 관련 특이사항을 입력하세요"
          />
        </CollapsibleSection>
      </main>

      <div className="sticky bottom-16 z-10 border-t border-border bg-card/95 px-3 py-3 backdrop-blur">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => navigate({ to: "/tenants/$tenantId", params: { tenantId } })}
            disabled={saving}
          >
            취소
          </Button>
          <Button className="flex-1 rounded-xl" onClick={submit} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      <BottomTabs />
    </MobileFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-3">
      <h2 className="text-[13.5px] font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent/40"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="space-y-3 border-t border-border p-3">{children}</div>}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[12px] font-semibold">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function DateField({
  label,
  required,
  value,
  onChange,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <Field label={label} required={required}>
      <div className="flex gap-2">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 flex-1 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-1">
          <StepBtn tone="green" onClick={() => onChange(addDays(value, 1))}>+1일</StepBtn>
          <StepBtn tone="green" onClick={() => onChange(addMonths(value, 1))}>+1개월</StepBtn>
          <StepBtn tone="rose" onClick={() => onChange(addDays(value, -1))}>-1일</StepBtn>
          <StepBtn tone="rose" onClick={() => onChange(addMonths(value, -1))}>-1개월</StepBtn>
        </div>
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </Field>
  );
}

function AmountField({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} required={required}>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className="h-10 flex-1 rounded-xl tabular-nums"
        />
        <div className="grid grid-cols-3 gap-1">
          <StepBtn tone="green" onClick={() => onChange(value + 10000)}>+1만</StepBtn>
          <StepBtn tone="green" onClick={() => onChange(value + 50000)}>+5만</StepBtn>
          <StepBtn tone="green" onClick={() => onChange(value + 100000)}>+10만</StepBtn>
          <StepBtn tone="rose" onClick={() => onChange(Math.max(0, value - 10000))}>-1만</StepBtn>
          <StepBtn tone="rose" onClick={() => onChange(Math.max(0, value - 50000))}>-5만</StepBtn>
          <StepBtn tone="rose" onClick={() => onChange(Math.max(0, value - 100000))}>-10만</StepBtn>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">약 {Math.round(value / 10000)}만원</p>
    </Field>
  );
}

function StepBtn({
  tone,
  onClick,
  children,
}: {
  tone: "green" | "rose";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-1.5 py-1 text-[10.5px] font-bold transition",
        tone === "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
      )}
    >
      {children}
    </button>
  );
}
