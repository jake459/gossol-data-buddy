import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Phone, Calendar, Check, X } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "입주 신청 — Gossol" }] }),
  component: ApplicationsPage,
});

type Application = {
  id: string;
  applicant_name: string;
  applicant_phone: string | null;
  desired_date: string | null;
  kind: "room_tour" | "move_in";
  status: "pending" | "approved" | "rejected" | "completed";
  memo: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Application["status"], string> = {
  pending: "검토중",
  approved: "승인",
  rejected: "거절",
  completed: "완료",
};

function ApplicationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selected } = useBranch();
  const [items, setItems] = useState<Application[]>([]);
  const [tab, setTab] = useState<"all" | Application["status"]>("pending");
  const [edit, setEdit] = useState<Partial<Application> | null>(null);

  const load = async () => {
    if (!selected) return;
    const { data, error } = await supabase
      .from("applications")
      .select("id, applicant_name, applicant_phone, desired_date, kind, status, memo, created_at")
      .eq("branch_id", selected.id)
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Application[]);
  };

  useEffect(() => {
    load();
  }, [selected?.id]);

  const save = async () => {
    if (!user || !selected || !edit?.applicant_name?.trim()) {
      return toast.error("이름을 입력해 주세요.");
    }
    const payload = {
      applicant_name: edit.applicant_name.trim(),
      applicant_phone: edit.applicant_phone?.trim() || null,
      desired_date: edit.desired_date || null,
      kind: (edit.kind ?? "room_tour") as Application["kind"],
      memo: edit.memo?.trim() || null,
      branch_id: selected.id,
      owner_id: user.id,
    };
    const { error } = await supabase.from("applications").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("신청이 등록되었습니다.");
    setEdit(null);
    load();
  };

  const updateStatus = async (id: string, status: Application["status"]) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(STATUS_LABEL[status] + " 처리됨");
    load();
  };

  const filtered = tab === "all" ? items : items.filter((i) => i.status === tab);

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
        <h1 className="flex-1 text-[15px] font-bold">입주 신청</h1>
        <Button size="sm" onClick={() => setEdit({ kind: "room_tour" })} className="h-9 rounded-xl">
          <Plus className="h-4 w-4" /> 신규
        </Button>
      </header>

      <div className="px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">검토중</TabsTrigger>
            <TabsTrigger value="approved">승인</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="신청 내역이 없어요"
            description="새 입주 문의나 방 보기 신청을 등록해 관리해 보세요."
            actionLabel="신청 등록"
            onAction={() => setEdit({ kind: "room_tour" })}
          />
        ) : (
          filtered.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold">{a.applicant_name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-semibold",
                        a.kind === "room_tour"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700",
                      )}
                    >
                      {a.kind === "room_tour" ? "방 보기" : "입주 신청"}
                    </span>
                    <StatusBadge kind="application" value={a.status} />
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-[12.5px] text-muted-foreground">
                {a.applicant_phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {a.applicant_phone}
                  </p>
                )}
                {a.desired_date && (
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {a.desired_date}
                  </p>
                )}
                {a.memo && <p className="text-[12px]">{a.memo}</p>}
              </div>
              {a.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => updateStatus(a.id, "rejected")}
                  >
                    <X className="h-3.5 w-3.5" /> 거절
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => updateStatus(a.id, "approved")}
                  >
                    <Check className="h-3.5 w-3.5" /> 승인
                  </Button>
                </div>
              )}
              {a.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => updateStatus(a.id, "completed")}
                >
                  완료 처리
                </Button>
              )}
            </article>
          ))
        )}
      </main>
      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>입주 신청 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>신청자 이름</Label>
              <Input
                value={edit?.applicant_name ?? ""}
                onChange={(e) => setEdit({ ...edit, applicant_name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>연락처</Label>
              <Input
                value={edit?.applicant_phone ?? ""}
                onChange={(e) => setEdit({ ...edit, applicant_phone: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>유형</Label>
              <Select
                value={edit?.kind ?? "room_tour"}
                onValueChange={(v) => setEdit({ ...edit, kind: v as Application["kind"] })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_tour">방 보기</SelectItem>
                  <SelectItem value="move_in">입주 신청</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>희망 일자</Label>
              <Input
                type="date"
                value={edit?.desired_date ?? ""}
                onChange={(e) => setEdit({ ...edit, desired_date: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Textarea
                value={edit?.memo ?? ""}
                onChange={(e) => setEdit({ ...edit, memo: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              취소
            </Button>
            <Button onClick={save}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileFrame>
  );
}
