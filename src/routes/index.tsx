import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { LegalModal, type LegalKind } from "@/components/LegalModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gossol" },
      { name: "description", content: "Gossol — 모바일 고시원 운영 OS" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);
  return (
    <MobileFrame>
      <main className="mesh-hero relative flex flex-1 flex-col overflow-hidden px-6 py-10 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[oklch(0.7_0.2_205)]/30 blur-3xl" />

        {/* Brand */}
        <header className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-base font-black text-[oklch(0.32_0.16_263)] shadow-lg shadow-black/20">
            G
          </div>
          <span className="text-[16px] font-semibold tracking-tight">Gossol</span>
        </header>

        {/* Centered hero */}
        <section className="relative my-auto py-12">
          <h1 className="text-[2.6rem] font-bold leading-[1.05] tracking-[-0.03em]">
            운영의 무게,
            <br />
            <span className="shimmer-text">가볍게</span> 덜다.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/70">
            로그인하고 바로 시작하세요.
          </p>

          <div className="mt-10 space-y-2.5">
            <Link
              to="/signup"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-white text-[15px] font-semibold text-[oklch(0.22_0.12_268)] shadow-[0_10px_30px_-8px_oklch(0_0_0/0.45)] transition active:scale-[0.99]"
            >
              회원가입
            </Link>
            <Link
              to="/login"
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              로그인
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative mt-auto flex items-center justify-between text-[11px] text-white/55">
          <span>© 2026 Gossol</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setLegalOpen("terms")} className="hover:text-white hover:underline">
              이용약관
            </button>
            <button type="button" onClick={() => setLegalOpen("privacy")} className="hover:text-white hover:underline">
              개인정보처리방침
            </button>
          </div>
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
