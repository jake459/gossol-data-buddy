import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Trash2, Pencil, BedDouble } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";
import { useConfirm } from "@/components/ConfirmModal";

export const Route = createFileRoute("/_authenticated/room-types")({
  head: () => ({ meta: [{ title: "방 타입 관리 — Gossol" }] }),
  component: RoomTypesPage,
});

type RoomType = {
  id: string;
  name: string;
  monthly_rent: number;
  deposit: number;
};

function RoomTypesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selected } = useBranch();
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<RoomType> | null>(null);

  const load = async () => {
    if (!selected) return;
    setLoading(true);
    const { data } = await supabase
      .from("room_types")
      .select("id, name, monthly_rent, deposit")
      .eq("branch_id", selected.id)
      .order("created_at", { ascending: true });
    setItems((data ?? []) as RoomType[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const save = async () => {
    if (!selected || !user || !edit) return;
    if (!edit.name?.trim()) {
      notifyValidation("타입 이름을 입력해 주세요.");
      return;
    }
    const payload = {
      name: edit.name!.trim(),
      monthly_rent: Number(edit.monthly_rent ?? 0),
      deposit: Number(edit.deposit ?? 0),
      branch_id: selected.id,
      owner_id: user.id,
    };
    const res = edit.id
      ? await supabase.from("room_types").update(payload).eq("id", edit.id)
      : await supabase.from("room_types").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("저장되었습니다.");
    setEdit(null);
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "이 방 타입을 삭제할까요?",
      description: "타입을 사용 중인 호실은 '타입 없음'으로 변경됩니다.",
      tone: "warning",
      confirmLabel: "삭제",
    });
    if (!ok) return;
    const { error } = await supabase.from("room_types").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("삭제되었습니다.");
    load();
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
        <h1 className="flex-1 text-[15px] font-bold">방 타입</h1>
        <Button size="sm" onClick={() => setEdit({})} className="h-9 rounded-xl">
          <Plus className="h-4 w-4" /> 추가
        </Button>
      </header>

      <main className="flex-1 space-y-2 px-4 py-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : items.length === 0 ? (
          <EmptyState onAdd={() => setEdit({})} />
        ) : (
          items.map((rt) => (
            <div
              key={rt.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <BedDouble className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{rt.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  월 이용료 {rt.monthly_rent.toLocaleString()}원 · 선납금{" "}
                  {rt.deposit.toLocaleString()}원
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEdit(rt)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(rt.id)}
                className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
        <Link to="/rooms" className="block pt-2 text-center text-[12px] font-semibold text-brand">
          호실 관리로 가기 →
        </Link>
      </main>

      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "방 타입 수정" : "방 타입 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>이름</Label>
              <Input
                value={edit?.name ?? ""}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                placeholder="예: 1인실 / 2인실"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>월 이용료(원)</Label>
                <Input
                  type="number"
                  value={edit?.monthly_rent ?? 0}
                  onChange={(e) => setEdit({ ...edit, monthly_rent: Number(e.target.value) })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>선납금(원)</Label>
                <Input
                  type="number"
                  value={edit?.deposit ?? 0}
                  onChange={(e) => setEdit({ ...edit, deposit: Number(e.target.value) })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              취소
            </Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </MobileFrame>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <BedDouble className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">아직 등록된 방 타입이 없어요.</p>
      <Button onClick={onAdd} className="mt-3 h-10 rounded-xl">
        <Plus className="h-4 w-4" /> 첫 타입 추가
      </Button>
    </div>
  );
}
