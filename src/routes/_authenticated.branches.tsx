import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Building2, Trash2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmModal";
import { InfoModal } from "@/components/InfoModal";

export const Route = createFileRoute("/_authenticated/branches")({
  head: () => ({ meta: [{ title: "지점 관리 — Gossol" }] }),
  component: BranchesPage,
});

function BranchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branches, refresh, setSelectedId, selectedId } = useBranch();
  const { confirm, ConfirmDialog } = useConfirm();
  const [edit, setEdit] = useState<{ id?: string; name?: string; address?: string; phone?: string } | null>(null);
  const [nameWarnOpen, setNameWarnOpen] = useState(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!user) return;
    if (!edit?.name?.trim()) {
      setNameWarnOpen(true);
      return;
    }
    const payload = {
      name: edit.name.trim(),
      address: edit.address?.trim() || null,
      phone: edit.phone?.trim() || null,
      owner_id: user.id,
    };
    if (edit.id) {
      const { error } = await supabase.from("branches").update(payload).eq("id", edit.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("branches").insert(payload).select("id").single();
      if (error || !data) return toast.error(error?.message ?? "추가 실패");
      await supabase.from("branch_settings").insert({ branch_id: data.id, owner_id: user.id });
      setSelectedId(data.id);
    }
    toast.success("저장되었습니다.");
    setEdit(null);
    refresh();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "이 지점을 삭제할까요?",
      description: "지점과 연결된 모든 데이터(호실·입실자·청구서·일정)가 사라집니다. 되돌릴 수 없어요.",
      tone: "danger",
      confirmLabel: "삭제하기",
    });
    if (!ok) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("삭제되었습니다.");
    refresh();
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
        <h1 className="flex-1 text-[15px] font-bold">지점 관리</h1>
        <Button size="sm" onClick={() => setEdit({})} className="h-9 rounded-xl">
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </header>

      <main className="flex-1 space-y-2 px-4 py-4">
        {branches.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" />
            </span>
            <button
              type="button"
              onClick={() => setEdit({ id: b.id, name: b.name, address: b.address ?? "", phone: "" })}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-[14px] font-semibold">
                {b.name} {b.id === selectedId && <span className="text-[11px] text-brand">· 선택됨</span>}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">{b.address ?? "—"}</p>
            </button>
            <button
              type="button"
              onClick={() => remove(b.id)}
              className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </main>

      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "지점 수정" : "지점 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>지점 이름</Label>
              <Input value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>주소</Label>
              <Input value={edit?.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>대표 전화</Label>
              <Input value={edit?.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>취소</Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </MobileFrame>
  );
}
