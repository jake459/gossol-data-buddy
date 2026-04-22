import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "로그인 — Gossol" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "올바른 이메일을 입력하세요." }).max(255),
  password: z.string().min(6, { message: "비밀번호는 6자 이상이어야 합니다." }).max(72),
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

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(error.message);
  };

  return (
    <AuthShell title="다시 만나서 반가워요" subtitle="이메일로 로그인하거나 소셜 계정을 사용하세요.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        또는
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        className="h-12 w-full rounded-xl text-sm font-semibold"
      >
        Google로 계속하기
      </Button>

      <div className="mt-6 flex justify-between text-xs text-muted-foreground">
        <Link to="/signup" className="font-medium text-brand hover:underline">
          회원가입
        </Link>
        <button
          type="button"
          onClick={async () => {
            if (!email) {
              toast.error("이메일을 먼저 입력해 주세요.");
              return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + "/reset-password",
            });
            if (error) toast.error(error.message);
            else toast.success("비밀번호 재설정 메일을 보냈습니다.");
          }}
          className="hover:underline"
        >
          비밀번호 찾기
        </button>
      </div>
    </AuthShell>
  );
}
