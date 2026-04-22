import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Sparkles, ArrowRight } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "환영합니다 — Gossol" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = useAuth();
  const { refresh, setSelectedId } = useBranch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("지점 이름을 입력해 주세요.");
      return;
    }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("branches")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
      })
      .select("id")
      .single();
    if (!error && data) {
      // Create default settings row
      await supabase.from("branch_settings").insert({ branch_id: data.id, owner_id: user.id });
      setSelectedId(data.id);
    }
    await refresh();
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "지점 등록에 실패했습니다.");
      return;
    }
    toast.success("첫 지점이 등록되었어요!");
    navigate({ to: "/dashboard" });
  };

  return (
    <MobileFrame>
      <main className="relative flex flex-1 flex-col px-6 pb-8 pt-10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[36vh]"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 0%, oklch(0.85 0.14 268 / 0.45), transparent 70%), radial-gradient(60% 50% at 100% 0%, oklch(0.85 0.12 200 / 0.4), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-semibold text-brand backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> 환영합니다
          </div>
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">
            첫 지점부터 등록해 볼까요?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            지점을 만들면 호실, 입실자, 청구서를 한 곳에서 관리할 수 있어요.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="relative mt-7 space-y-4 rounded-[24px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_50px_-20px_oklch(0.2_0.1_268/0.25)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">지점 정보</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bname">지점 이름 *</Label>
            <Input
              id="bname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 강남 1호점"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="baddr">주소</Label>
            <Input
              id="baddr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="서울시 강남구 …"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bphone">대표 전화</Label>
            <Input
              id="bphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-000-0000"
              className="h-12 rounded-xl"
              inputMode="tel"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-[15px] font-semibold"
          >
            {loading ? "등록 중..." : (
              <>
                지점 등록하고 시작하기 <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          나중에 [지점] 탭에서 추가·수정할 수 있어요.
        </p>
      </main>
    </MobileFrame>
  );
}
