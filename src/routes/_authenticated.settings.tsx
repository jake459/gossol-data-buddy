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

      <main className="flex-1 space-y-5 px-4 py-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand text-[18px] font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "G"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{user?.email}</p>
              <p className="text-[12px] text-muted-foreground">현재 지점: {selected?.name ?? "—"}</p>
            </div>
          </div>
        </section>

        <NavSection title="운영">
          <NavItem to="/branches" icon={Building2} label="지점 관리" />
          <NavItem to="/applications" icon={ClipboardList} label="입실 신청서" />
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
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13.5px] font-semibold text-rose-600 hover:bg-rose-50"
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
      className="flex items-center gap-3 px-4 py-3 text-[13.5px] font-semibold transition hover:bg-accent/40"
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
