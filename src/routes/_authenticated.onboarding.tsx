import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Users,
  CalendarCheck,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomTabs } from "@/components/BottomTabs";
import { InfoModal } from "@/components/InfoModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "환영합니다 — Gossol" }] }),
  component: OnboardingPage,
});

type Step = "welcome" | "form";

function OnboardingPage() {
  const { user } = useAuth();
  const { refresh, setSelectedId } = useBranch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setWarnOpen(true);
      return;
    }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("branches")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
      })
      .select("id")
      .single();
    if (!error && data) {
      await supabase.from("branch_settings").insert({ branch_id: data.id, owner_id: user.id });
      setSelectedId(data.id);
    }
    await refresh();
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "지점 등록에 실패했습니다.");
      return;
    }
    toast.success("첫 지점이 등록되었어요!");
    navigate({ to: "/dashboard" });
  };

  return (
    <MobileFrame>
      <main className="relative flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-[oklch(0.98_0.02_268)] via-background to-background">
        {/* Ambient gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[55vh]"
          style={{
            background:
              "radial-gradient(60% 50% at 18% 0%, oklch(0.78 0.16 268 / 0.55), transparent 65%), radial-gradient(55% 45% at 95% 5%, oklch(0.82 0.14 200 / 0.45), transparent 70%), radial-gradient(40% 30% at 50% 100%, oklch(0.85 0.12 320 / 0.35), transparent 70%)",
          }}
        />

        {/* Top bar — back option when on form step */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-5 pt-5">
          {step === "form" ? (
            <button
              type="button"
              onClick={() => setStep("welcome")}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground backdrop-blur transition hover:bg-background/80"
            >
              ← 이전
            </button>
          ) : (
            <span aria-hidden />
          )}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand/30 bg-white/80 px-4 py-2 text-[12.5px] font-semibold text-brand shadow-sm backdrop-blur transition hover:border-brand/50 hover:bg-white"
          >
            나중에 할게요 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {step === "welcome" ? (
          <WelcomeStep
            displayName={user?.user_metadata?.display_name as string | undefined}
            onStart={() => setStep("form")}
          />
        ) : (
          <FormStep
            name={name}
            address={address}
            phone={phone}
            loading={loading}
            onName={setName}
            onAddress={setAddress}
            onPhone={setPhone}
            onSubmit={handleCreate}
          />
        )}
      </main>
      <BottomTabs />
      <InfoModal
        open={warnOpen}
        onOpenChange={setWarnOpen}
        title="지점 이름을 입력해 주세요"
        description="첫 지점을 등록하려면 이름이 필요해요."
        tone="warning"
        actionLabel="알겠어요"
      />
    </MobileFrame>
  );
}

function WelcomeStep({
  displayName,
  onStart,
}: {
  displayName?: string;
  onStart: () => void;
}) {
  const greeting = displayName ? `${displayName} 원장님,` : "환영합니다,";
  return (
    <section className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-6">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-brand shadow-sm backdrop-blur">
        <Sparkles className="h-3.5 w-3.5" /> 첫 시작을 도와드릴게요
      </div>
      <h1 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-tight text-foreground">
        {greeting}
        <br />
        <span className="bg-gradient-to-r from-[oklch(0.42_0.18_268)] to-[oklch(0.55_0.18_220)] bg-clip-text text-transparent">
          오늘부터 운영이 가벼워져요.
        </span>
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        호실, 입실자, 청구서까지 한 곳에서. 먼저 지점 하나만 등록하면 모든 메뉴가 열려요.
      </p>

      {/* Preview cards — what they'll get */}
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        <Perk Icon={Building2} title="호실 보드" tint="oklch(0.94 0.05 268)" iconTint="oklch(0.42 0.16 268)" />
        <Perk Icon={Users} title="입실자 관리" tint="oklch(0.94 0.05 200)" iconTint="oklch(0.42 0.14 210)" />
        <Perk Icon={Receipt} title="청구서 자동" tint="oklch(0.94 0.06 25)" iconTint="oklch(0.5 0.16 25)" />
        <Perk Icon={CalendarCheck} title="월간 일정" tint="oklch(0.94 0.06 158)" iconTint="oklch(0.42 0.13 158)" />
      </div>

      {/* Steps */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          시작 가이드
        </p>
        <ol className="mt-2 space-y-2">
          {[
            "첫 지점 등록",
            "방 타입 만들기 — 보증금·월세 자동 적용",
            "호실 추가 — 입실자 등록 시 청구서 자동",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-7">
        <Button
          type="button"
          onClick={onStart}
          className="group h-14 w-full rounded-2xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.34_0.16_262)] text-[15px] font-semibold shadow-[0_18px_40px_-18px_oklch(0.34_0.16_262/0.7)] transition active:scale-[0.99]"
        >
          첫 지점 등록하기
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border-2 border-dashed border-brand/25 bg-brand/[0.04] p-3.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-[12px] leading-relaxed text-foreground/80">
            <p className="font-semibold text-foreground">지금 안 해도 괜찮아요.</p>
            <p className="mt-0.5 text-muted-foreground">
              상단의 <span className="font-semibold text-brand">‘나중에 할게요’</span>를 누르면 대시보드로 이동하고, 지점은 [설정]에서 언제든 추가할 수 있어요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormStep({
  name,
  address,
  phone,
  loading,
  onName,
  onAddress,
  onPhone,
  onSubmit,
}: {
  name: string;
  address: string;
  phone: string;
  loading: boolean;
  onName: (v: string) => void;
  onAddress: (v: string) => void;
  onPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-4">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-brand shadow-sm backdrop-blur">
        <Building2 className="h-3.5 w-3.5" /> 지점 정보
      </div>
      <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-tight text-foreground">
        지점 이름만 있으면
        <br />
        바로 시작할 수 있어요.
      </h2>
      <p className="mt-1.5 text-[13px] text-muted-foreground">
        주소·전화번호는 나중에 채워도 괜찮아요.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_60px_-30px_oklch(0.2_0.1_268/0.4)] backdrop-blur-xl"
      >
        <div className="space-y-1.5">
          <Label htmlFor="bname" className="text-[12.5px] font-semibold">
            지점 이름 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bname"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="예: 강남 1호점"
            className="h-12 rounded-xl bg-background"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="baddr" className="text-[12.5px] font-semibold">
            주소 <span className="text-muted-foreground/70">(선택)</span>
          </Label>
          <Input
            id="baddr"
            value={address}
            onChange={(e) => onAddress(e.target.value)}
            placeholder="서울시 강남구 …"
            className="h-12 rounded-xl bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bphone" className="text-[12.5px] font-semibold">
            대표 전화 <span className="text-muted-foreground/70">(선택)</span>
          </Label>
          <Input
            id="bphone"
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            placeholder="02-000-0000"
            className="h-12 rounded-xl bg-background"
            inputMode="tel"
          />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-brand/5 p-3 text-[12px] leading-relaxed text-brand">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            등록 즉시 대시보드·호실·청구서 메뉴가 활성화되고, 기본 설정 한 세트가 자동 생성돼요.
          </span>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="group h-13 w-full rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.34_0.16_262)] text-[15px] font-semibold shadow-[0_18px_40px_-18px_oklch(0.34_0.16_262/0.7)] transition active:scale-[0.99]"
        >
          {loading ? "등록 중…" : (
            <>
              지점 등록하고 시작하기
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </section>
  );
}

function Perk({
  Icon,
  title,
  tint,
  iconTint,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  tint: string;
  iconTint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 backdrop-blur">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: tint, color: iconTint }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-[12.5px] font-semibold text-foreground">{title}</p>
    </div>
  );
}
