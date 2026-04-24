import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, Sparkles, Mail } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LegalModal, type LegalKind } from "@/components/LegalModal";
import { InfoModal } from "@/components/InfoModal";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";
import { useAuth } from "@/hooks/useAuth";
import { toKoreanAuthError } from "@/lib/auth-errors";

const REMEMBER_KEY = "gossol:remember-me";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "로그인 — Gossol" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력하세요.").max(255),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다.").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  // 테스트 빌드: 예시 데이터가 연결된 데모 계정으로 자동 채움
  const [email, setEmail] = useState("demo@gossol.test");
  const [password, setPassword] = useState("demo1234!");
  const [loading, setLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);
  const [comingSoon, setComingSoon] = useState<null | "kakao" | "naver">(null);
  const [findIdOpen, setFindIdOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(REMEMBER_KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REMEMBER_KEY, rememberMe ? "1" : "0");
  }, [rememberMe]);

  useEffect(() => {
    if (!authLoading && session) {
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(toKoreanAuthError(error.message));
      return;
    }
    // navigation handled by useEffect watching session
  };

  const handleSocial = async (provider: "google" | "naver" | "kakao" | "apple") => {
    if (provider === "google" || provider === "apple") {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) toast.error(toKoreanAuthError(result.error.message));
      return;
    }
    setComingSoon(provider);
  };

  const handleResetId = () => {
    setFindIdOpen(true);
  };

  const handleResetPw = async () => {
    if (!email) {
      notifyValidation("이메일을 먼저 입력해 주세요.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("비밀번호 재설정 메일을 보냈습니다.");
  };

  return (
    <MobileFrame>
      <main className="relative flex flex-1 flex-col px-5 pb-8 pt-12">
        {/* Soft mesh backdrop */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh]"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 0%, oklch(0.85 0.14 268 / 0.45), transparent 70%), radial-gradient(60% 50% at 100% 0%, oklch(0.85 0.12 200 / 0.4), transparent 70%)",
          }}
        />
        {/* Brand */}
        <div className="relative mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.22_268)] to-[oklch(0.32_0.16_263)] text-2xl font-black text-primary-foreground shadow-[0_15px_30px_-10px_oklch(0.32_0.16_263/0.6)]">
            G
          </div>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-brand">Gossol</p>
        </div>

        {/* Glass card */}
        <section className="relative rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_20px_50px_-20px_oklch(0.2_0.1_268/0.25)] backdrop-blur-xl">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="example@gosol.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-background px-4 text-[15px] placeholder:text-muted-foreground/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-border bg-background px-4 text-[15px] placeholder:text-muted-foreground/70"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-[15px] font-semibold shadow-md shadow-brand/25 hover:opacity-95"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* Helper links */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[12px] text-muted-foreground">
            <button type="button" onClick={handleResetId} className="hover:text-foreground">
              아이디 찾기
            </button>
            <span className="text-border">·</span>
            <button type="button" onClick={handleResetPw} className="hover:text-foreground">
              비밀번호 찾기
            </button>
            <span className="text-border">·</span>
            <Link to="/signup" className="font-semibold text-brand hover:underline">
              회원가입
            </Link>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground">소셜 계정</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Social circle row */}
          <div className="flex items-center justify-center gap-3">
            <SocialCircle label="Google로 로그인" onClick={() => handleSocial("google")} kind="google" />
            <SocialCircle label="네이버로 로그인" onClick={() => handleSocial("naver")} kind="naver" />
            <SocialCircle label="카카오로 로그인" onClick={() => handleSocial("kakao")} kind="kakao" />
            <SocialCircle label="Apple로 로그인" onClick={() => handleSocial("apple")} kind="apple" />
          </div>
        </section>

        {/* Sign-up entry */}
        <Link
          to="/signup"
          className="mx-auto mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground/80 hover:text-brand"
        >
          계정 만들기 <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mx-auto mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <button type="button" onClick={() => setLegalOpen("terms")} className="hover:text-foreground hover:underline">
            이용약관
          </button>
          <span>·</span>
          <button type="button" onClick={() => setLegalOpen("privacy")} className="hover:text-foreground hover:underline">
            개인정보처리방침
          </button>
        </div>
      </main>

      <LegalModal
        kind={legalOpen ?? "terms"}
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
      />
      <InfoModal
        open={comingSoon !== null}
        onOpenChange={(o) => !o && setComingSoon(null)}
        title={comingSoon === "kakao" ? "카카오 로그인 준비 중" : "네이버 로그인 준비 중"}
        description="더 많은 소셜 로그인을 곧 지원할 예정이에요."
        icon={<Sparkles className="h-4 w-4" />}
        tone="warning"
        actionLabel="알겠어요"
      >
        <p>
          현재는 <b>Google</b>, <b>Apple</b>, 또는 <b>이메일</b>로 로그인할 수 있어요.
          {comingSoon === "kakao" ? " 카카오 알림톡 연동과 함께 곧 오픈됩니다." : " 네이버 OAuth 심사가 끝나는 대로 활성화됩니다."}
        </p>
      </InfoModal>
      <InfoModal
        open={findIdOpen}
        onOpenChange={setFindIdOpen}
        title="아이디(이메일) 찾기"
        description="가입 시 사용한 이메일이 기억나지 않으세요?"
        icon={<Mail className="h-4 w-4" />}
        tone="brand"
        actionLabel="고객센터 열기"
        onAction={() => toast.info("고객센터 채팅이 곧 연결됩니다.")}
      >
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
          <li>가입 시 받았던 환영 메일을 검색해 보세요. (제목: “Gossol에 오신 것을 환영합니다”)</li>
          <li>휴대폰 번호로 가입한 경우 SMS 인증 기록을 확인해 주세요.</li>
          <li>그래도 찾을 수 없다면 <b>1588-0000</b> 또는 <b>help@gossol.kr</b>로 문의하세요.</li>
        </ul>
      </InfoModal>
    </MobileFrame>
  );
}

function SocialCircle({
  kind,
  label,
  onClick,
}: {
  kind: "google" | "naver" | "kakao" | "apple";
  label: string;
  onClick: () => void;
}) {
  const base =
    "flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition active:scale-[0.96]";
  const styles: Record<typeof kind, string> = {
    google: "border border-border bg-card hover:bg-accent",
    naver: "bg-[#03C75A] hover:brightness-110",
    kakao: "bg-[#FEE500] hover:brightness-105",
    apple: "bg-black hover:bg-neutral-800",
  };

  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${base} ${styles[kind]}`}>
      {kind === "google" && <GoogleGlyph />}
      {kind === "naver" && <NaverGlyph />}
      {kind === "kakao" && <KakaoGlyph />}
      {kind === "apple" && <AppleGlyph />}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function NaverGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#fff" d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727z" />
    </svg>
  );
}

function KakaoGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.85 5.31 4.65 6.74-.2.7-.73 2.55-.84 2.95-.13.5.18.49.39.36.16-.1 2.59-1.76 3.64-2.47.71.1 1.43.16 2.16.16 5.52 0 10-3.58 10-8s-4.48-8-10-8Z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#fff"
        d="M16.365 12.79c-.024-2.43 1.985-3.595 2.075-3.652-1.131-1.654-2.892-1.88-3.515-1.906-1.495-.151-2.92.881-3.68.881-.762 0-1.93-.86-3.176-.836-1.633.024-3.14.95-3.98 2.412-1.7 2.945-.434 7.298 1.218 9.69.808 1.171 1.77 2.487 3.034 2.44 1.219-.05 1.679-.79 3.152-.79 1.473 0 1.886.79 3.176.766 1.31-.024 2.14-1.193 2.94-2.37.928-1.358 1.31-2.674 1.334-2.742-.029-.013-2.558-.982-2.583-3.893ZM13.97 5.71c.673-.815 1.126-1.948.999-3.071-.967.04-2.137.643-2.832 1.456-.622.722-1.166 1.876-1.018 2.984 1.078.083 2.178-.547 2.851-1.369Z"
      />
    </svg>
  );
}
