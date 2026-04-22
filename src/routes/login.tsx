import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { SocialButtons } from "@/components/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
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
  const [emailOpen, setEmailOpen] = useState(false);

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
        {/* Brand block */}
        <div className="mt-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[oklch(0.32_0.16_265)] text-2xl font-black text-primary-foreground shadow-lg shadow-brand/30">
            G
          </div>
          <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-tight">
            고시원 운영,
            <br />
            <span className="text-brand">고쏠</span>로 한 번에.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            3초 만에 시작하고 오늘부터 더 가볍게 운영하세요.
          </p>
        </div>

        {/* Social-first stack */}
        <div className="mt-10">
          <SocialButtons />
        </div>

        {/* Email login as a sheet — keeps social CTAs primary */}
        <Sheet open={emailOpen} onOpenChange={setEmailOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="mt-4 self-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              이메일로 로그인
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-0 px-6 pb-8 pt-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">이메일 로그인</SheetTitle>
              <SheetDescription>가입한 이메일과 비밀번호를 입력하세요.</SheetDescription>
            </SheetHeader>
            <EmailForm
              onDone={() => {
                setEmailOpen(false);
                navigate({ to: "/dashboard" });
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Footer link */}
        <div className="mt-auto pt-8 text-center text-sm">
          <span className="text-muted-foreground">아직 계정이 없으신가요? </span>
          <Link to="/signup" className="font-semibold text-brand">
            회원가입
          </Link>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          로그인 시 <a className="underline">이용약관</a>과{" "}
          <a className="underline">개인정보처리방침</a>에 동의한 것으로 간주됩니다.
        </p>
      </main>
    </MobileFrame>
  );
}

function EmailForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    onDone();
  };

  const handleReset = async () => {
    if (!email) {
      toast.error("이메일을 먼저 입력해 주세요.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("재설정 메일을 보냈습니다.");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl bg-muted/40"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-muted/40 pr-11"
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
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-2xl text-base font-semibold"
      >
        {loading ? "로그인 중..." : "로그인"}
      </Button>
      <button
        type="button"
        onClick={handleReset}
        className="block w-full text-center text-xs text-muted-foreground hover:underline"
      >
        비밀번호를 잊으셨나요?
      </button>
    </form>
  );
}
