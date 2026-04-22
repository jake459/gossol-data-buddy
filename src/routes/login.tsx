import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.error(error.message ?? "로그인에 실패했습니다.");
      return;
    }
    toast.success("환영합니다!");
    navigate({ to: "/dashboard" });
  };

  const handleSocial = async (provider: "google" | "naver" | "kakao" | "apple") => {
    if (provider === "google") {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) toast.error(result.error.message ?? "로그인에 실패했습니다.");
      return;
    }
    if (provider === "apple") {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) toast.error(result.error.message ?? "로그인에 실패했습니다.");
      return;
    }
    toast.info(
      provider === "kakao" ? "카카오 로그인은 곧 지원됩니다." : "네이버 로그인은 곧 지원됩니다.",
      { description: "현재 Google · Apple · 이메일로 로그인할 수 있어요." },
    );
  };

  const handleResetId = () => {
    toast.info("가입한 이메일이 기억나지 않으면 고객센터로 문의해 주세요.");
  };

  const handleResetPw = async () => {
    if (!email) {
      toast.error("이메일을 먼저 입력해 주세요.");
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
      <main className="flex flex-1 flex-col bg-app-shell px-5 pb-8 pt-10">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[oklch(0.32_0.16_265)] text-2xl font-black text-primary-foreground shadow-lg shadow-brand/30">
            G
          </div>
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">고시원 관리, 더 가볍게</p>
        </div>

        {/* Card */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
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
            <span className="text-[11px] font-medium text-muted-foreground">또는 소셜 계정으로</span>
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

        {/* Demo entry */}
        <Link
          to="/demo/dashboard"
          className="mx-auto mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground/80 hover:text-brand"
        >
          로그인 없이 체험하기 <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
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
