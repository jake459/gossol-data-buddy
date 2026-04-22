import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, DoorOpen, Filter, X } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({ meta: [{ title: "호실 현황 — Gossol" }] }),
  component: RoomsPage,
});

type RoomStatus = "vacant" | "occupied" | "cleaning" | "maintenance";
type Room = {
  id: string;
  room_number: string;
  floor: number | null;
  status: RoomStatus;
  room_type_id: string | null;
};
type RoomType = { id: string; name: string };

const STATUS_LABEL: Record<RoomStatus, string> = {
  vacant: "공실",
  occupied: "입실",
  cleaning: "청소",
  maintenance: "수리",
};
const STATUS_TONE: Record<RoomStatus, string> = {
  vacant: "bg-rose-50 text-rose-600 border-rose-200",
  occupied: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cleaning: "bg-amber-50 text-amber-600 border-amber-200",
  maintenance: "bg-slate-100 text-slate-600 border-slate-200",
};

function RoomsPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Room> | null>(null);

  const [fStatus, setFStatus] = useState<RoomStatus | "all">("all");
  const [fFloor, setFFloor] = useState<string>("all");
  const [fType, setFType] = useState<string>("all");

  const load = async () => {
    if (!selected) return;
    setLoading(true);
    const [r, t] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, room_number, floor, status, room_type_id")
        .eq("branch_id", selected.id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true }),
      supabase.from("room_types").select("id, name").eq("branch_id", selected.id),
    ]);
    setRooms((r.data ?? []) as Room[]);
    setTypes((t.data ?? []) as RoomType[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const floors = useMemo(
    () =>
      Array.from(new Set(rooms.map((r) => r.floor).filter((f): f is number => f != null))).sort(
        (a, b) => a - b,
      ),
    [rooms],
  );

  const filtered = rooms.filter(
    (r) =>
      (fStatus === "all" || r.status === fStatus) &&
      (fFloor === "all" || r.floor === Number(fFloor)) &&
      (fType === "all" || r.room_type_id === fType),
  );

  const counts = useMemo(() => {
    const c: Record<RoomStatus, number> = { vacant: 0, occupied: 0, cleaning: 0, maintenance: 0 };
    rooms.forEach((r) => (c[r.status] += 1));
    return c;
  }, [rooms]);

  const save = async () => {
    if (!selected || !user || !edit) return;
    if (!edit.room_number?.trim()) return toast.error("호실 번호를 입력해 주세요.");
    const payload = {
      room_number: edit.room_number.trim(),
      floor: edit.floor ?? null,
      status: edit.status ?? "vacant",
      room_type_id: edit.room_type_id ?? null,
      branch_id: selected.id,
      owner_id: user.id,
    };
    const res = edit.id
      ? await supabase.from("rooms").update(payload).eq("id", edit.id)
      : await supabase.from("rooms").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("저장되었습니다.");
    setEdit(null);
    load();
  };

  const cycleStatus = async (room: Room) => {
    const order: RoomStatus[] = ["vacant", "occupied", "cleaning", "maintenance"];
    const next = order[(order.indexOf(room.status) + 1) % order.length];
    const { error } = await supabase.from("rooms").update({ status: next }).eq("id", room.id);
    if (error) return toast.error(error.message);
    setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, status: next } : r)));
  };

  return (
    <MobileFrame>
      <TopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">호실 현황</h1>
          <div className="flex items-center gap-2">
            <Link to="/room-types" className="text-[12px] font-semibold text-brand">
              방 타입
            </Link>
            <Button size="sm" onClick={() => setEdit({ status: "vacant" })} className="h-9 rounded-xl">
              <Plus className="h-4 w-4" /> 호실
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
          {(["vacant", "occupied", "cleaning", "maintenance"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFStatus(fStatus === s ? "all" : s)}
              className={cn(
                "rounded-xl border px-2 py-2 font-semibold transition",
                STATUS_TONE[s],
                fStatus === s ? "ring-2 ring-foreground/15" : "opacity-90",
              )}
            >
              <div className="text-[15px] font-bold leading-none">{counts[s]}</div>
              <div className="mt-1">{STATUS_LABEL[s]}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-[12px]">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <FilterChip
            label={fStatus === "all" ? "상태 전체" : STATUS_LABEL[fStatus]}
            active={fStatus !== "all"}
            onClear={() => setFStatus("all")}
          />
          <Select value={fFloor} onValueChange={setFFloor}>
            <SelectTrigger className="h-8 w-auto min-w-[80px] rounded-full text-[12px]">
              <SelectValue placeholder="층 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">층 전체</SelectItem>
              {floors.map((f) => (
                <SelectItem key={f} value={String(f)}>
                  {f}층
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fType} onValueChange={setFType}>
            <SelectTrigger className="h-8 w-auto min-w-[100px] rounded-full text-[12px]">
              <SelectValue placeholder="타입 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">타입 전체</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="조건에 맞는 호실이 없어요"
            description="필터를 초기화하거나 새 호실을 추가해 보세요."
            actionLabel="호실 추가"
            onAction={() => setEdit({ status: "vacant" })}
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((r) => {
              const type = types.find((t) => t.id === r.room_type_id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(r)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-[13px] font-bold">
                      {r.room_number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">
                        {r.floor ? `${r.floor}층` : "—"} · {type?.name ?? "타입 없음"}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        탭하여 수정 · 우측 배지로 상태 전환
                      </p>
                    </div>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleStatus(r);
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                        STATUS_TONE[r.status],
                      )}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "호실 수정" : "호실 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>호실 번호</Label>
                <Input
                  value={edit?.room_number ?? ""}
                  onChange={(e) => setEdit({ ...edit, room_number: e.target.value })}
                  placeholder="예: 201"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>층</Label>
                <Input
                  type="number"
                  value={edit?.floor ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, floor: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="2"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>방 타입</Label>
              <Select
                value={edit?.room_type_id ?? "none"}
                onValueChange={(v) => setEdit({ ...edit, room_type_id: v === "none" ? null : v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안 함</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>상태</Label>
              <Select
                value={edit?.status ?? "vacant"}
                onValueChange={(v) => setEdit({ ...edit, status: v as RoomStatus })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">공실</SelectItem>
                  <SelectItem value="occupied">입실</SelectItem>
                  <SelectItem value="cleaning">청소</SelectItem>
                  <SelectItem value="maintenance">수리</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {edit?.id && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!confirm("삭제할까요?")) return;
                  const { error } = await supabase.from("rooms").delete().eq("id", edit.id!);
                  if (error) return toast.error(error.message);
                  toast.success("삭제되었습니다.");
                  setEdit(null);
                  load();
                }}
              >
                삭제
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setEdit(null)}>
              취소
            </Button>
            <Button onClick={save}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileFrame>
  );
}

function FilterChip({
  label,
  active,
  onClear,
}: {
  label: string;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-semibold",
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
      {active && (
        <button type="button" onClick={onClear} aria-label="초기화">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
