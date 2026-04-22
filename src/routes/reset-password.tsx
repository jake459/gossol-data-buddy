import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "비밀번호 재설정 — Gossol" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    // Supabase puts type=recovery in the URL hash on email link click
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setRecoveryReady(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col px-6 pb-8 pt-10">
        <h1 className="text-[24px] font-bold tracking-tight">비밀번호 재설정</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {recoveryReady
            ? "새 비밀번호를 입력해 주세요."
            : "이메일로 받은 재설정 링크를 통해 이 페이지에 접근해 주세요."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">새 비밀번호</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="6자 이상"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">비밀번호 확인</Label>
            <Input
              id="pw2"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="다시 한 번 입력"
            />
          </div>
          <Button type="submit" disabled={loading || !recoveryReady} className="h-12 w-full rounded-xl">
            {loading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </main>
    </MobileFrame>
  );
}
