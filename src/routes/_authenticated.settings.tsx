import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Building2,
  Bell,
  LogOut,
  HelpCircle,
  Megaphone,
  TrendingUp,
  ClipboardList,
  ChevronRight,
  UserPlus,
  Copy,
} from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "설정 — Gossol" }] }),
  component: SettingsPage,
});

type AutoSendSettings = {
  auto_send_movein: boolean;
  auto_send_moveout: boolean;
  auto_send_invoice: boolean;
  auto_send_contract: boolean;
};

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { selected } = useBranch();
  const [settings, setSettings] = useState<AutoSendSettings>({
    auto_send_movein: true,
    auto_send_moveout: true,
    auto_send_invoice: true,
    auto_send_contract: false,
  });

  useEffect(() => {
    if (!selected) return;
    supabase
      .from("branch_settings")
      .select("auto_send_movein, auto_send_moveout, auto_send_invoice, auto_send_contract")
      .eq("branch_id", selected.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as AutoSendSettings);
      });
  }, [selected?.id]);

  const toggle = async (key: keyof AutoSendSettings, value: boolean) => {
    if (!selected || !user) return;
    setSettings((s) => ({ ...s, [key]: value }));
    const next = { ...settings, [key]: value };
    const { error } = await supabase
      .from("branch_settings")
      .upsert(
        {
          branch_id: selected.id,
          owner_id: user.id,
          auto_send_movein: next.auto_send_movein,
          auto_send_moveout: next.auto_send_moveout,
          auto_send_invoice: next.auto_send_invoice,
          auto_send_contract: next.auto_send_contract,
        },
        { onConflict: "branch_id" },
      );
    if (error) {
      toast.error("저장 실패");
      setSettings((s) => ({ ...s, [key]: !value }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <MobileFrame>
      <TopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold">설정</h1>
      </header>

      <main className="flex-1 space-y-3 px-3 py-3">
        <section className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand text-[15px] font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "G"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user?.email}</p>
              <p className="text-[11px] text-muted-foreground">현재 지점: {selected?.name ?? "—"}</p>
            </div>
          </div>
        </section>

        <NavSection title="운영">
          <NavItem to="/branches" icon={Building2} label="지점 관리" />
          <NavItem to="/applications" icon={ClipboardList} label="입실 신청서" />
          <StaffInviteRow />
          <NavItem to="/community" icon={Megaphone} label="커뮤니티" />
          <NavItem to="/stats" icon={TrendingUp} label="운영 통계" />
        </NavSection>

        <NavSection title="자동 발송 알림">
          <ToggleRow
            icon={Bell}
            label="입실 안내"
            description="입실 등록 시 자동 안내"
            value={settings.auto_send_movein}
            onChange={(v) => toggle("auto_send_movein", v)}
          />
          <ToggleRow
            icon={Bell}
            label="퇴실 안내"
            description="퇴실일 도래 시 안내"
            value={settings.auto_send_moveout}
            onChange={(v) => toggle("auto_send_moveout", v)}
          />
          <ToggleRow
            icon={Bell}
            label="청구서 발송"
            description="매월 청구서 자동 생성"
            value={settings.auto_send_invoice}
            onChange={(v) => toggle("auto_send_invoice", v)}
          />
          <ToggleRow
            icon={Bell}
            label="이용 계약서 발송"
            description="입실 승인 후 자동 전송"
            value={settings.auto_send_contract}
            onChange={(v) => toggle("auto_send_contract", v)}
          />
        </NavSection>

        <NavSection title="기타">
          <NavItem to="/community" icon={HelpCircle} label="도움말" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </NavSection>
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] font-semibold transition hover:bg-accent/40"
    >
      <Icon className="h-4 w-4 text-brand" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{label}</p>
        <p className="text-[11.5px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function StaffInviteRow() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [invites, setInvites] = useState<{ id: string; email: string; token: string; accepted_at: string | null; expires_at: string }[]>([]);
  const { user } = useAuth();
  const { selected } = useBranch();

  useEffect(() => {
    if (!open || !selected) return;
    supabase
      .from("staff_invites")
      .select("id, email, token, accepted_at, expires_at")
      .eq("branch_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setInvites(data ?? []));
  }, [open, selected?.id]);

  const submit = async () => {
    if (!user || !selected) return;
    if (!email.trim() || !email.includes("@")) return notifyValidation("올바른 이메일을 입력해 주세요.");
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_invites")
      .insert({ owner_id: user.id, branch_id: selected.id, email: email.trim().toLowerCase() })
      .select("id, email, token, accepted_at, expires_at")
      .single();
    setLoading(false);
    if (error || !data) return toast.error(error?.message ?? "초대 발급 실패");
    const url = `${window.location.origin}/signup?invite=${data.token}&type=staff`;
    setLink(url);
    setEmail("");
    setInvites((prev) => [data, ...prev]);
    toast.success("스탭 초대 링크를 발급했어요.");
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/signup?invite=${token}&type=staff`;
    navigator.clipboard?.writeText(url);
    toast.success("초대 링크가 복사되었어요.");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13.5px] font-semibold transition hover:bg-accent/40"
      >
        <UserPlus className="h-4 w-4 text-brand" />
        <span className="flex-1">스탭 초대</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>스탭 초대</DialogTitle>
            <DialogDescription>
              초대 링크를 받은 사람은 회원가입 후 이 지점의 스탭으로 자동 등록됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12.5px]">이메일</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="h-11 rounded-xl"
                />
                <Button onClick={submit} disabled={loading} className="h-11 rounded-xl">
                  발급
                </Button>
              </div>
            </div>

            {link && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-[12px]">
                <p className="font-semibold">초대 링크</p>
                <p className="mt-1 truncate text-muted-foreground">{link}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(link);
                    toast.success("복사되었어요.");
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-[11px] font-semibold"
                >
                  <Copy className="h-3 w-3" /> 복사
                </button>
              </div>
            )}

            {invites.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">발급 내역</p>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {invites.map((iv) => (
                    <li key={iv.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-[12.5px]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{iv.email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {iv.accepted_at ? "수락됨" : `만료 ${new Date(iv.expires_at).toLocaleDateString("ko-KR")}`}
                        </p>
                      </div>
                      {!iv.accepted_at && (
                        <button
                          type="button"
                          onClick={() => copyLink(iv.token)}
                          className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
                          aria-label="복사"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
