import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/AuthShell";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error(error.message);
  };

  return (
    <AuthShell title="고쏠을 시작해 보세요" subtitle="30초면 가입 완료. 첫 지점부터 등록해 보세요." backTo="/">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">이름</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="홍길동" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" placeholder="6자 이상" />
        </div>
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
          {loading ? "가입 중..." : "회원가입"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        또는
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" onClick={handleGoogle} className="h-12 w-full rounded-xl text-sm font-semibold">
        Google로 계속하기
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">로그인</Link>
      </p>
    </AuthShell>
  );
}
