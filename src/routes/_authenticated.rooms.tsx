import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, DoorOpen, Filter, X, Sparkles } from "lucide-react";
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
import { useConfirm } from "@/components/ConfirmModal";
import {
  ROOM_CATEGORIES,
  WINDOW_TYPES,
  ROOM_SIZES,
  ROOM_OPTIONS,
  ROOM_TAGS,
  buildAutoRoomName,
  type RoomCategory,
  type WindowKind,
  type RoomSize,
} from "@/lib/roomTemplate";

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
  room_category: RoomCategory | null;
  window_type: WindowKind | null;
  size_type: RoomSize | null;
  extra_options: string[];
  tags: string[];
  auto_name: string | null;
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

type EditState = Partial<Room> & { extra_options?: string[]; tags?: string[] };

function RoomsPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const { confirm, ConfirmDialog } = useConfirm();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);

  const [fStatus, setFStatus] = useState<RoomStatus | "all">("all");
  const [fCategory, setFCategory] = useState<string>("all");

  const load = async () => {
    if (!selected) return;
    setLoading(true);
    const [r, t] = await Promise.all([
      supabase
        .from("rooms")
        .select(
          "id, room_number, floor, status, room_type_id, room_category, window_type, size_type, extra_options, tags, auto_name",
        )
        .eq("branch_id", selected.id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true }),
      supabase.from("room_types").select("id, name").eq("branch_id", selected.id),
    ]);
    setRooms((r.data ?? []) as unknown as Room[]);
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
      (fCategory === "all" || r.room_category === fCategory),
  );

  const counts = useMemo(() => {
    const c: Record<RoomStatus, number> = { vacant: 0, occupied: 0, cleaning: 0, maintenance: 0 };
    rooms.forEach((r) => (c[r.status] += 1));
    return c;
  }, [rooms]);

  // 자동 명명 미리보기
  const previewName = edit ? buildAutoRoomName({
    category: edit.room_category ?? null,
    window_type: edit.window_type ?? null,
    size_type: edit.size_type ?? null,
  }) : "";

  const save = async () => {
    if (!selected || !user || !edit) return;
    if (!edit.room_number?.trim()) return toast.error("호실 번호를 입력해 주세요.");
    if (!edit.room_category) return toast.error("대분류를 선택해 주세요.");
    if (!edit.window_type) return toast.error("창문 종류를 선택해 주세요.");

    const auto_name = buildAutoRoomName({
      category: edit.room_category,
      window_type: edit.window_type,
      size_type: edit.size_type ?? "standard",
    });

    const payload = {
      room_number: edit.room_number.trim(),
      floor: edit.floor ?? null,
      status: edit.status ?? "vacant",
      room_type_id: edit.room_type_id ?? null,
      room_category: edit.room_category,
      window_type: edit.window_type,
      size_type: edit.size_type ?? "standard",
      extra_options: edit.extra_options ?? [],
      tags: edit.tags ?? [],
      auto_name,
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

  const toggleArr = (key: "extra_options" | "tags", value: string) => {
    setEdit((prev) => {
      if (!prev) return prev;
      const cur = (prev[key] as string[] | undefined) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  return (
    <MobileFrame>
      <TopBar />
      <header className="bg-gradient-to-b from-white/85 to-transparent px-4 pb-3 pt-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">호실 현황</h1>
          <div className="flex items-center gap-2">
            <Link to="/room-types" className="text-[12px] font-semibold text-brand">
              가격표
            </Link>
            <Button
              size="sm"
              onClick={() =>
                setEdit({ status: "vacant", size_type: "standard", extra_options: [], tags: [] })
              }
              className="h-9 rounded-xl"
            >
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
          <Select value={fCategory} onValueChange={setFCategory}>
            <SelectTrigger className="h-8 w-auto min-w-[100px] rounded-full text-[12px]">
              <SelectValue placeholder="타입 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">타입 전체</SelectItem>
              {ROOM_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
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
            onAction={() =>
              setEdit({ status: "vacant", size_type: "standard", extra_options: [], tags: [] })
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((r) => {
              const type = types.find((t) => t.id === r.room_type_id);
              const auto = r.auto_name ?? buildAutoRoomName({
                category: r.room_category,
                window_type: r.window_type,
                size_type: r.size_type,
              });
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
                        {auto || "타입 미설정"}
                      </p>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {r.floor ? `${r.floor}층` : "—"}
                        {type ? ` · ${type.name}` : ""}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "호실 수정" : "호실 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

            {/* STEP 1: 대분류 */}
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold">
                <span className="mr-1 inline-block h-4 w-4 rounded-full bg-brand text-center text-[10px] leading-4 text-white">1</span>
                대분류 <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ROOM_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setEdit({ ...edit, room_category: c.value })}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-left transition",
                      edit?.room_category === c.value
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <p className="text-[12px] font-bold">{c.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: 창문 */}
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold">
                <span className="mr-1 inline-block h-4 w-4 rounded-full bg-brand text-center text-[10px] leading-4 text-white">2</span>
                창문 종류 <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {WINDOW_TYPES.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setEdit({ ...edit, window_type: w.value })}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      edit?.window_type === w.value
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <p className="text-[12px] font-bold">{w.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{w.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: 소분류 — 크기 */}
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold">
                <span className="mr-1 inline-block h-4 w-4 rounded-full bg-brand text-center text-[10px] leading-4 text-white">3</span>
                방 크기
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ROOM_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setEdit({ ...edit, size_type: s.value })}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-center text-[12px] font-semibold transition",
                      (edit?.size_type ?? "standard") === s.value
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    {s.label}
                    {"desc" in s && (
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">{s.desc}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 옵션 */}
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold">개별 옵션</Label>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_OPTIONS.map((o) => {
                  const active = (edit?.extra_options ?? []).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleArr("extra_options", o.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                        active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 특수 태그 */}
            <div className="space-y-2">
              <Label className="text-[12.5px] font-semibold">특수 태그</Label>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_TAGS.map((o) => {
                  const active = (edit?.tags ?? []).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleArr("tags", o.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                        active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 자동 이름 미리보기 */}
            {previewName && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand/40 bg-brand/5 px-3 py-2.5 text-[12.5px]">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span className="text-muted-foreground">자동 이름</span>
                <span className="font-semibold text-brand">{previewName}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>가격표(선택)</Label>
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
              <Label>호실 상태</Label>
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
                  const ok = await confirm({
                    title: "이 호실을 삭제할까요?",
                    description:
                      "삭제하면 호실 정보가 사라집니다. 입실자가 배정되어 있다면 먼저 호실 변경을 해주세요.",
                    tone: "danger",
                    confirmLabel: "삭제",
                  });
                  if (!ok) return;
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
      <ConfirmDialog />
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
