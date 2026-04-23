import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Receipt,
  CalendarCheck,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { LegalModal, type LegalKind } from "@/components/LegalModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gossol — 가장 쉬운 고시원 관리" },
      {
        name: "description",
        content: "고쏠은 호실·입실자·청구·일정까지 한 손에 잡히는 모바일 고시원 관리 OS입니다.",
      },
      { property: "og:title", content: "Gossol — 가장 쉬운 고시원 관리" },
      {
        property: "og:description",
        content: "엑셀과 카톡 메모는 그만. 2026년형 모바일 운영 OS, 고쏠.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);
  return (
    <MobileFrame>
      <main className="relative flex flex-1 flex-col">
        {/* HERO — mesh + glass */}
        <section className="mesh-hero relative overflow-hidden px-5 pb-10 pt-8 text-white">
          {/* Floating orbs */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[oklch(0.7_0.2_205)]/30 blur-3xl" />

          {/* Top bar */}
          <header className="relative flex items-center">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-base font-black text-[oklch(0.32_0.16_263)] shadow-lg shadow-black/20">
                G
              </div>
              <span className="text-[15px] font-semibold tracking-tight">Gossol</span>
            </div>
          </header>

          {/* Headline */}
          <div className="relative mt-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> 2026 · 고시원 운영 OS
            </span>
            <h1 className="mt-4 text-[2.4rem] font-bold leading-[1.05] tracking-[-0.03em]">
              운영의 무게,
              <br />
              <span className="shimmer-text">가볍게</span> 덜다.
            </h1>
            <p className="mt-3 max-w-[20rem] text-[14px] leading-relaxed text-white/75">
              호실·입실자·청구서·일정까지. 한 화면에서 완성하는 모바일 고시원 운영.
            </p>
          </div>

          {/* Primary CTA */}
          <div className="relative mt-8 space-y-2.5">
            <Link
              to="/signup"
              className="group flex h-14 w-full items-center justify-between rounded-2xl bg-white px-5 text-[15px] font-semibold text-[oklch(0.22_0.12_268)] shadow-[0_10px_30px_-8px_oklch(0_0_0/0.45)] transition active:scale-[0.99]"
            >
              <span>30초 만에 무료 가입</span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.32_0.16_263)] text-white transition group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[14px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              로그인
            </Link>
          </div>

          {/* Live preview card — glass */}
          <div className="relative mt-8">
            <div className="glass-dark relative rounded-3xl p-4 text-white shadow-2xl">
              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>강남 1호점 · LIVE</span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  운영중
                </span>
              </div>
              <p className="mt-2 text-[11px] text-white/60">이번 달 매출</p>
              <p className="text-[28px] font-bold tracking-tight">₩ 12,480,000</p>
              <div className="mt-2 flex items-center gap-1 text-[12px] text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" /> +8.2% 전월 대비
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="입실" value="38" tone="default" />
                <MiniStat label="공실" value="4" tone="warn" />
                <MiniStat label="미납" value="3" tone="danger" />
              </div>
            </div>
            <div className="animate-float absolute -right-2 -top-3 rounded-2xl bg-white px-3 py-2 text-[11px] font-semibold text-[oklch(0.22_0.12_268)] shadow-xl">
              🏠 302호 입실 완료
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="bg-background px-5 pt-7">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-1 text-[12px] font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-brand" />
              안전한 클라우드 보관
            </div>
            <div className="flex items-center gap-1 text-[12px] font-medium text-foreground">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span>4.9</span>
              <span className="text-muted-foreground">· 사장님 평점</span>
            </div>
          </div>
        </section>

        {/* BENTO FEATURES */}
        <section className="bg-background px-5 pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">FEATURES</p>
          <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight">
            엑셀·메모장은
            <br />
            이제 그만.
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Big tile */}
            <div className="col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.16_263)] to-[oklch(0.22_0.12_268)] p-5 text-white">
              <div className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                <Building2 className="h-3.5 w-3.5" />
                호실 현황 보드
              </div>
              <p className="mt-2 text-[20px] font-bold leading-tight">
                42개 호실, 한눈에.
              </p>
              <p className="mt-1 text-[12px] text-white/70">
                공실·입실·청소중을 컬러 카드로 즉시 파악하세요.
              </p>
              <div className="mt-4 flex gap-1.5">
                {[
                  "bg-emerald-400",
                  "bg-emerald-400",
                  "bg-amber-300",
                  "bg-rose-400",
                  "bg-emerald-400",
                  "bg-emerald-400",
                  "bg-emerald-400",
                  "bg-amber-300",
                  "bg-emerald-400",
                  "bg-rose-400",
                ].map((c, i) => (
                  <div key={i} className={`h-7 w-5 rounded-md ${c} opacity-90`} />
                ))}
              </div>
            </div>

            <BentoTile Icon={Users} title="입실자 흐름" desc="신청부터 퇴실까지 자동" tone="indigo" />
            <BentoTile Icon={Receipt} title="청구서 자동" desc="기한 경과 시 미납 표시" tone="rose" />
            <BentoTile Icon={CalendarCheck} title="월간 일정" desc="입퇴실·점검·룸투어" tone="emerald" />
            <BentoTile Icon={Sparkles} title="AI 도우미" desc="공지·문자 1초 작성" tone="amber" />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-background px-5 py-10">
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted to-background p-6 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">
              START FREE
            </p>
            <p className="mt-2 text-[20px] font-bold leading-tight tracking-tight text-foreground">
              지금 바로,
              <br />
              운영을 새로 디자인하세요.
            </p>
            <Link
              to="/signup"
              className="mt-5 inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-foreground px-6 text-[14px] font-semibold text-background shadow-lg transition hover:opacity-90"
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto bg-[oklch(0.16_0.02_260)] px-5 py-8 text-[11px] text-white/55">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[12px] font-black text-white">
              G
            </div>
            <p className="text-[13px] font-semibold text-white">Gossol Inc.</p>
          </div>
          <p className="mt-3">사업자등록번호 000-00-00000 · 대표 홍길동</p>
          <p>서울특별시 강남구 테헤란로 000</p>
          <div className="mt-3 flex gap-3 text-white/70">
            <button type="button" onClick={() => setLegalOpen("terms")} className="hover:text-white hover:underline">
              이용약관
            </button>
            <button type="button" onClick={() => setLegalOpen("privacy")} className="hover:text-white hover:underline">
              개인정보처리방침
            </button>
          </div>
          <p className="mt-4 text-white/30">© 2026 Gossol</p>
        </footer>
      </main>
      <LegalModal
        kind={legalOpen ?? "terms"}
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
      />
    </MobileFrame>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warn" | "danger";
}) {
  const color =
    tone === "danger" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <p className="text-[10px] text-white/55">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function BentoTile({
  Icon,
  title,
  desc,
  tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tone: "indigo" | "rose" | "emerald" | "amber";
}) {
  const tones: Record<typeof tone, string> = {
    indigo: "bg-[oklch(0.94_0.04_268)] text-[oklch(0.32_0.16_263)]",
    rose: "bg-[oklch(0.94_0.05_18)] text-[oklch(0.5_0.18_22)]",
    emerald: "bg-[oklch(0.94_0.05_158)] text-[oklch(0.42_0.14_158)]",
    amber: "bg-[oklch(0.95_0.06_85)] text-[oklch(0.45_0.13_75)]",
  };
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[14px] font-bold text-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
