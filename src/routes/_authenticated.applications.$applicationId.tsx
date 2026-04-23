import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, FileText, Receipt, UserPlus, X } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { Button } from "@/components/ui/button";
import { ProcessTimeline, type TimelineTrack } from "@/components/ProcessTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { notifyBranch } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/applications/$applicationId")({
  head: () => ({ meta: [{ title: "신청 상세 — Gossol" }] }),
  component: ApplicationDetailPage,
});

type Application = {
  id: string;
  applicant_name: string;
  applicant_phone: string | null;
  desired_date: string | null;
  kind: "room_tour" | "move_in";
  status: "pending" | "approved" | "rejected" | "completed";
  memo: string | null;
  approved_at: string | null;
  agreed_at: string | null;
  confirmed_at: string | null;
  deposit_invoice_id: string | null;
  first_rent_invoice_id: string | null;
  tenant_id: string | null;
  branch_id: string;
  desired_room_type_id: string | null;
};

type RoomType = { id: string; name: string; monthly_rent: number; deposit: number };

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const { applicationId } = Route.useParams();
  const { user } = useAuth();
  const { selected } = useBranch();
  const [app, setApp] = useState<Application | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    setApp(data as Application | null);
    if (data?.desired_room_type_id) {
      const { data: rt } = await supabase
        .from("room_types")
        .select("id, name, monthly_rent, deposit")
        .eq("id", data.desired_room_type_id)
        .maybeSingle();
      setRoomType(rt as RoomType | null);
    }
  };

  useEffect(() => {
    load();
  }, [applicationId]);

  if (!app) {
    return (
      <MobileFrame>
        <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      </MobileFrame>
    );
  }

  const tracks: TimelineTrack[] = [
    {
      name: "호실신청",
      tone: "owner",
      steps: [
        { label: "대기", state: "done", hint: "신규 접수" },
        {
          label: "수락",
          state: app.approved_at ? "done" : app.status === "pending" ? "current" : "pending",
          hint: app.approved_at?.slice(0, 10),
        },
        {
          label: "동의",
          state: app.agreed_at ? "done" : app.approved_at ? "current" : "pending",
          hint: app.agreed_at?.slice(0, 10),
        },
        {
          label: "입실확정",
          state: app.confirmed_at ? "done" : app.agreed_at ? "current" : "pending",
          hint: app.confirmed_at?.slice(0, 10),
        },
      ],
    },
    {
      name: "청구서",
      tone: "invoice",
      steps: [
        {
          label: "보증금",
          state: app.deposit_invoice_id ? "done" : app.agreed_at ? "current" : "pending",
        },
        {
          label: "첫월세",
          state: app.first_rent_invoice_id ? "done" : app.deposit_invoice_id ? "current" : "pending",
        },
        {
          label: "입금확인",
          state: app.confirmed_at ? "done" : "pending",
        },
      ],
    },
  ];

  const approve = async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from("applications")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", app.id);
    await notifyBranch({
      branchId: app.branch_id,
      ownerId: user.id,
      category: "application_approved",
      title: `${app.applicant_name} 신청 수락`,
      body: "신청자 동의를 기다리는 중입니다.",
      link: `/applications/${app.id}`,
    });
    setLoading(false);
    toast.success("수락 처리되었습니다.");
    load();
  };

  const reject = async () => {
    setLoading(true);
    await supabase.from("applications").update({ status: "rejected" }).eq("id", app.id);
    setLoading(false);
    toast.success("거절 처리되었습니다.");
    load();
  };

  const markAgreed = async () => {
    setLoading(true);
    await supabase
      .from("applications")
      .update({ agreed_at: new Date().toISOString() })
      .eq("id", app.id);
    setLoading(false);
    toast.success("동의 확인 처리되었습니다.");
    load();
  };

  const issueInvoices = async () => {
    if (!user || !selected) return;
    if (app.kind !== "move_in") return toast.info("입실 신청만 청구서 발행이 가능합니다.");
    if (!roomType) return toast.error("희망 방 타입을 먼저 지정해 주세요.");
    setLoading(true);

    // 입실자 먼저 생성 (없으면)
    let tenantId = app.tenant_id;
    if (!tenantId) {
      const { data: t, error } = await supabase
        .from("tenants")
        .insert({
          owner_id: user.id,
          branch_id: selected.id,
          name: app.applicant_name,
          phone: app.applicant_phone,
          move_in_date: app.desired_date ?? new Date().toISOString().slice(0, 10),
          monthly_rent: roomType.monthly_rent,
          deposit: roomType.deposit,
          status: "active",
        })
        .select("id")
        .single();
      if (error || !t) {
        setLoading(false);
        return toast.error(error?.message ?? "입실자 생성 실패");
      }
      tenantId = t.id;
    }

    const moveInDate = app.desired_date ?? new Date().toISOString().slice(0, 10);
    // 보증금 청구서
    const { data: dep } = await supabase
      .from("invoices")
      .insert({
        owner_id: user.id,
        branch_id: selected.id,
        tenant_id: tenantId,
        amount: roomType.deposit,
        due_date: moveInDate,
        kind: "deposit",
        status: "unpaid",
        memo: "보증금",
      })
      .select("id")
      .single();
    // 첫월세 청구서
    const { data: rent } = await supabase
      .from("invoices")
      .insert({
        owner_id: user.id,
        branch_id: selected.id,
        tenant_id: tenantId,
        amount: roomType.monthly_rent,
        due_date: moveInDate,
        kind: "first_rent",
        status: "unpaid",
        memo: "첫달 월 이용료",
        cycle_month: moveInDate.slice(0, 8) + "01",
      })
      .select("id")
      .single();

    await supabase
      .from("applications")
      .update({
        tenant_id: tenantId,
        deposit_invoice_id: dep?.id ?? null,
        first_rent_invoice_id: rent?.id ?? null,
      })
      .eq("id", app.id);

    await notifyBranch({
      branchId: selected.id,
      ownerId: user.id,
      category: "deposit_requested",
      title: `${app.applicant_name} 보증금·첫월세 청구서 발행`,
      body: `보증금 ${roomType.deposit.toLocaleString()}원 · 첫월세 ${roomType.monthly_rent.toLocaleString()}원`,
      link: `/applications/${app.id}`,
    });

    setLoading(false);
    toast.success("청구서가 발행되었습니다.");
    load();
  };

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/applications" })}
          className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold">{app.applicant_name} · 신청 상세</h1>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        <ProcessTimeline tracks={tracks} />

        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[13px] font-bold">기본 정보</h2>
          <Row label="유형" value={app.kind === "room_tour" ? "방 둘러보기" : "입실 신청"} />
          <Row label="연락처" value={app.applicant_phone ?? "-"} />
          <Row label="희망일" value={app.desired_date ?? "-"} />
          <Row label="희망 방타입" value={roomType?.name ?? "-"} />
          {app.memo && <Row label="메모" value={app.memo} />}
        </section>

        {/* 단계별 액션 */}
        <section className="space-y-2">
          {app.status === "pending" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" disabled={loading} onClick={reject}>
                <X className="h-4 w-4" /> 거절
              </Button>
              <Button className="flex-1 rounded-xl" disabled={loading} onClick={approve}>
                <Check className="h-4 w-4" /> 신청 수락
              </Button>
            </div>
          )}
          {app.status === "approved" && !app.agreed_at && (
            <Button className="w-full rounded-xl" disabled={loading} onClick={markAgreed}>
              <FileText className="h-4 w-4" /> 동의 확인
            </Button>
          )}
          {app.status === "approved" &&
            app.agreed_at &&
            !app.deposit_invoice_id &&
            app.kind === "move_in" && (
              <Button className="w-full rounded-xl" disabled={loading} onClick={issueInvoices}>
                <Receipt className="h-4 w-4" /> 보증금·첫월세 청구서 발행
              </Button>
            )}
          {app.tenant_id && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() =>
                navigate({ to: "/tenants/$tenantId", params: { tenantId: app.tenant_id! } })
              }
            >
              <UserPlus className="h-4 w-4" /> 입실자 카드 열기
            </Button>
          )}
        </section>
      </main>
    </MobileFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
