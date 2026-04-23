import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, Check } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { SocialButtons } from "@/components/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LegalModal, type LegalKind } from "@/components/LegalModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";
import { useAuth } from "@/hooks/useAuth";
import { toKoreanAuthError } from "@/lib/auth-errors";

type SignupSearch = { invite?: string; type?: "staff" | "tenant" };

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "회원가입 — Gossol" }] }),
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
    type: search.type === "tenant" ? "tenant" : search.type === "staff" ? "staff" : undefined,
  }),
  component: SignupPage,
});

async function consumeInvite(opts: { token: string; type: "staff" | "tenant"; userId: string }) {
  if (opts.type === "staff") {
    const { data: inv } = await supabase
      .from("staff_invites")
      .select("id, branch_id, accepted_at, expires_at")
      .eq("token", opts.token)
      .maybeSingle();
    if (!inv || inv.accepted_at || new Date(inv.expires_at) < new Date()) return;
    await supabase.from("branch_members").insert({
      branch_id: inv.branch_id,
      user_id: opts.userId,
      role: "staff",
    });
    await supabase.from("user_roles").insert({ user_id: opts.userId, role: "staff" });
    await supabase.from("staff_invites").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
  } else {
    const { data: inv } = await supabase
      .from("tenant_invites")
      .select("id, tenant_id, accepted_at, expires_at")
      .eq("token", opts.token)
      .maybeSingle();
    if (!inv || inv.accepted_at || new Date(inv.expires_at) < new Date()) return;
    await supabase.from("tenants").update({ user_id: opts.userId }).eq("id", inv.tenant_id);
    await supabase.from("user_roles").insert({ user_id: opts.userId, role: "tenant" });
    await supabase.from("tenant_invites").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
  }
}

const schema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요.").max(60),
  email: z.string().trim().email("올바른 이메일을 입력하세요.").max(255),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다.").max(72),
});

function SignupPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;
    (async () => {
      if (search.invite && search.type) {
        await consumeInvite({ token: search.invite, type: search.type, userId: session.user.id });
      }
      navigate({ to: "/dashboard" });
    })();
  }, [authLoading, session, navigate, search.invite, search.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAll) {
      notifyValidation("약관에 동의해 주세요.");
      return;
    }
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      notifyValidation(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
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
      toast.error(toKoreanAuthError(error.message));
      return;
    }
    toast.success("회원가입이 완료되었습니다.");
    // navigation handled by useEffect watching session
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
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight">
          회원가입
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <button
              type="button"
              onClick={() => setAgreeAll((v) => !v)}
              className="flex w-full items-center gap-3 text-left"
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
            <div className="mt-2 flex gap-3 pl-9 text-[12px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setLegalOpen("terms")}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                이용약관 보기
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLegalOpen("privacy")}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                개인정보처리방침 보기
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            {loading ? "가입 중..." : "가입 완료"}
          </Button>
        </form>

        <div className="my-7 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          소셜 계정
          <div className="h-px flex-1 bg-border" />
        </div>

        <SocialButtons />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-semibold text-brand">
            로그인
          </Link>
        </p>
      </main>
      <LegalModal
        kind={legalOpen ?? "terms"}
        open={legalOpen !== null}
        onOpenChange={(o) => !o && setLegalOpen(null)}
      />
    </MobileFrame>
  );
}
