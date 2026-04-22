import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, Check } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { SocialButtons } from "@/components/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "회원가입 — Gossol" }] }),
  component: SignupPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요.").max(60),
  email: z.string().trim().email("올바른 이메일을 입력하세요.").max(255),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다.").max(72),
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAll) {
      toast.error("약관에 동의해 주세요.");
      return;
    }
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "회원가입에 실패했습니다.");
      return;
    }
    toast.success("회원가입이 완료되었습니다.");
    navigate({ to: "/dashboard" });
  };

  return (
    <MobileFrame>
      <header className="flex items-center px-2 py-3">
        <Link
          to="/"
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-8">
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight">
          고쏠 시작하기
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          소셜로 30초 만에 가입하거나 이메일로 직접 시작하세요.
        </p>

        <div className="mt-7">
          <SocialButtons />
        </div>

        <div className="my-7 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          이메일로 가입
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-muted/40"
              placeholder="홍길동"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-muted/40"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-muted/40 pr-11"
                placeholder="6자 이상"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="비밀번호 표시 전환"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAgreeAll((v) => !v)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                agreeAll ? "bg-brand text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">
              이용약관·개인정보처리방침 전체 동의
            </span>
          </button>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            {loading ? "가입 중..." : "가입 완료"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-semibold text-brand">
            로그인
          </Link>
        </p>
      </main>
    </MobileFrame>
  );
}
