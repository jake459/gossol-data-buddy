import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Trash2, Pencil, BedDouble, Copy, Sparkles } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";
import { useConfirm } from "@/components/ConfirmModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/room-types")({
  head: () => ({ meta: [{ title: "방 타입 관리 — Gossol" }] }),
  component: RoomTypesPage,
});

// 방 타입 = 규격화된 템플릿(Deluxe A, Standard B 등). 호실 추가 시 빠르게 적용.
type RoomTypeOptions = {
  cleaning_fee?: number;
  maintenance_fee?: number;
  amenities?: string[]; // ['bed','desk','tv',...]
  description?: string;
};

type RoomType = {
  id: string;
  name: string;
  monthly_rent: number;
  deposit: number;
  options: RoomTypeOptions;
};

const AMENITIES: { value: string; label: string; icon: string }[] = [
  { value: "bed", label: "침대", icon: "🛏" },
  { value: "desk", label: "책상", icon: "🪑" },
  { value: "tv", label: "TV", icon: "📺" },
  { value: "bathroom", label: "화장실", icon: "🚽" },
  { value: "shower", label: "샤워실", icon: "🚿" },
  { value: "wardrobe", label: "옷장", icon: "👔" },
  { value: "aircon", label: "에어컨", icon: "❄️" },
  { value: "fridge", label: "냉장고", icon: "🧊" },
  { value: "washer", label: "세탁기", icon: "🌀" },
  { value: "wifi", label: "와이파이", icon: "📶" },
];

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
      .select("id, name, monthly_rent, deposit, options")
      .eq("branch_id", selected.id)
      .order("created_at", { ascending: true });
    setItems(
      ((data ?? []) as Array<{
        id: string;
        name: string;
        monthly_rent: number;
        deposit: number;
        options: unknown;
      }>).map((r) => ({
        ...r,
        options: (r.options ?? {}) as RoomTypeOptions,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const toggleAmenity = (value: string) => {
    setEdit((prev) => {
      if (!prev) return prev;
      const cur = prev.options?.amenities ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, options: { ...prev.options, amenities: next } };
    });
  };

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
      options: edit.options ?? {},
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

  const duplicate = async (rt: RoomType) => {
    if (!selected || !user) return;
    const { error } = await supabase.from("room_types").insert({
      name: `${rt.name} 사본`,
      monthly_rent: rt.monthly_rent,
      deposit: rt.deposit,
      options: rt.options ?? {},
      branch_id: selected.id,
      owner_id: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("복제되었습니다.");
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
        <div className="flex-1">
          <h1 className="text-[15px] font-bold">등록된 방 타입</h1>
        </div>
        <Button size="sm" onClick={() => setEdit({ options: { amenities: [] } })} className="h-9 rounded-xl">
          <Plus className="h-4 w-4" /> 방 타입 추가
        </Button>
      </header>

      <main className="flex-1 space-y-2 px-4 py-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : items.length === 0 ? (
          <EmptyState onAdd={() => setEdit({ options: { amenities: [] } })} />
        ) : (
          <ul className="grid grid-cols-2 gap-2.5">
            {items.map((rt) => (
              <li
                key={rt.id}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="line-clamp-2 break-keep text-[13.5px] font-bold leading-tight">{rt.name}</p>
                  <div className="flex shrink-0 -mt-1 -mr-1">
                    <button
                      type="button"
                      onClick={() => duplicate(rt)}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                      aria-label="복제"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdit(rt)}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                      aria-label="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(rt.id)}
                      className="grid h-7 w-7 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[11.5px] leading-snug">
                  <p className="font-semibold text-brand">월 {Math.round(rt.monthly_rent / 10000)}만원</p>
                  <p className="text-muted-foreground">보증금 {Math.round(rt.deposit / 10000)}만원</p>
                  {rt.options.cleaning_fee ? (
                    <p className="text-muted-foreground">청소비 {Math.round(rt.options.cleaning_fee / 10000)}만원</p>
                  ) : null}
                </div>
                {rt.options.amenities && rt.options.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rt.options.amenities.slice(0, 6).map((a) => {
                      const meta = AMENITIES.find((x) => x.value === a);
                      if (!meta) return null;
                      return (
                        <span
                          key={a}
                          className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "방 타입 수정" : "방 타입 추가"}</DialogTitle>
            <DialogDescription className="text-[12px]">
              방 타입 정보를 등록하면 호실 추가 시 한 번에 적용할 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">타입명 <span className="text-rose-500">*</span></Label>
                <Input
                  value={edit?.name ?? ""}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  placeholder="ex) Deluxe A"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">월 이용료 (원) <span className="text-rose-500">*</span></Label>
                <Input
                  type="number"
                  value={edit?.monthly_rent ?? ""}
                  onChange={(e) => setEdit({ ...edit, monthly_rent: Number(e.target.value) })}
                  placeholder="ex) 470000"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">보증금 (원)</Label>
                <Input
                  type="number"
                  value={edit?.deposit ?? ""}
                  onChange={(e) => setEdit({ ...edit, deposit: Number(e.target.value) })}
                  placeholder="ex) 100000"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">청소비 (원)</Label>
                <Input
                  type="number"
                  value={edit?.options?.cleaning_fee ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      options: { ...edit?.options, cleaning_fee: Number(e.target.value) },
                    })
                  }
                  placeholder="ex) 30000"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[12px]">관리비 (원)</Label>
                <Input
                  type="number"
                  value={edit?.options?.maintenance_fee ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      options: { ...edit?.options, maintenance_fee: Number(e.target.value) },
                    })
                  }
                  placeholder="ex) 50000"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">설명</Label>
              <Textarea
                value={edit?.options?.description ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    options: { ...edit?.options, description: e.target.value },
                  })
                }
                placeholder="방 타입에 대한 설명…"
                className="min-h-[64px] rounded-xl text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-[12px] font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-brand" /> 개인 시설
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.map((a) => {
                  const active = (edit?.options?.amenities ?? []).includes(a.value);
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => toggleAmenity(a.value)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11.5px] font-medium transition",
                        active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              취소
            </Button>
            <Button onClick={save}>
              <Plus className="h-4 w-4" /> {edit?.id ? "저장" : "추가"}
            </Button>
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
      <p className="mt-2 text-sm text-muted-foreground break-keep">
        아직 등록된 방 타입이 없어요.
        <br />
        규격화된 타입을 만들어두면 호실 추가가 빨라져요.
      </p>
      <Button onClick={onAdd} className="mt-3 h-10 rounded-xl">
        <Plus className="h-4 w-4" /> 첫 타입 추가
      </Button>
    </div>
  );
}
