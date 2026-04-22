import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Building2, Users, Receipt, CalendarCheck } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gossol — 가장 쉬운 고시원 관리" },
      {
        name: "description",
        content: "고쏠(Gossol)은 호실·입실자·청구·일정까지 한 손에 잡히는 모바일 고시원 관리 앱입니다.",
      },
      { property: "og:title", content: "Gossol — 가장 쉬운 고시원 관리" },
      { property: "og:description", content: "호실·입실자·청구·일정을 한 번에. 무료 체험으로 지금 시작하세요." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.42_0.17_258)] via-[oklch(0.36_0.16_262)] to-[oklch(0.28_0.12_268)] px-6 pb-10 pt-12 text-primary-foreground">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> 고시원 사장님을 위한 단 하나의 앱
            </span>
            <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.15] tracking-tight">
              고쏠로
              <br />
              운영을 더 가볍게.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              호실 현황·입실자·청구서·일정까지 한 손 안에서.
              <br />
              지금 무료로 체험해 보세요.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-white text-base font-semibold text-[oklch(0.32_0.15_262)] shadow-lg hover:bg-white/90"
              >
                <Link to="/demo/dashboard">
                  무료로 시작하기 (체험)
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 flex-1 rounded-xl bg-white/15 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
                >
                  <Link to="/login">로그인</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 flex-1 rounded-xl bg-white/15 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
                >
                  <Link to="/signup">회원가입</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-10">
          <h2 className="text-lg font-bold text-foreground">왜 고쏠인가요?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            엑셀과 메모장은 이제 그만. 필요한 모든 기능을 한 화면에서.
          </p>

          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <f.Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-auto bg-[oklch(0.22_0.02_260)] px-6 py-8 text-xs text-white/70">
          <p className="font-semibold text-white">Gossol Inc.</p>
          <p className="mt-1">사업자등록번호 000-00-00000 · 대표 홍길동</p>
          <p>서울특별시 강남구 테헤란로 000</p>
          <div className="mt-3 flex gap-3">
            <a href="#" className="underline-offset-2 hover:underline">이용약관</a>
            <a href="#" className="underline-offset-2 hover:underline">개인정보처리방침</a>
          </div>
          <p className="mt-4 text-white/40">© 2026 Gossol</p>
        </footer>
      </main>
    </MobileFrame>
  );
}

const features = [
  {
    Icon: Building2,
    title: "호실 현황 한눈에",
    desc: "공실·입실·청소중 상태를 컬러 카드로 즉시 파악하고, 호실 복제로 빠르게 등록하세요.",
  },
  {
    Icon: Users,
    title: "입실자·룸투어 관리",
    desc: "신청부터 입실, 퇴실까지 모든 단계를 자동 흐름으로 처리합니다.",
  },
  {
    Icon: Receipt,
    title: "청구서·미납 자동 알림",
    desc: "기한 경과 시 미납 표시와 자동 발송으로 수금 누락을 막아드려요.",
  },
  {
    Icon: CalendarCheck,
    title: "월간 일정 캘린더",
    desc: "입퇴실·점검·룸투어 일정을 한 캘린더에서 관리합니다.",
  },
];
