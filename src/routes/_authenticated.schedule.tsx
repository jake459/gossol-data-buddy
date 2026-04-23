import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
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
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmModal";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({ meta: [{ title: "일정 — Gossol" }] }),
  component: SchedulePage,
});

type EventKind = "move_in" | "move_out" | "inspection" | "room_tour" | "memo";
type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  kind: EventKind;
  memo: string | null;
  /** synthetic: tenants 테이블에서 자동 생성된 항목은 편집 불가 */
  readonly?: boolean;
};

const KIND_LABEL: Record<EventKind, string> = {
  move_in: "입실",
  move_out: "퇴실",
  inspection: "점검",
  room_tour: "방투어",
  memo: "메모",
};
const KIND_TONE: Record<EventKind, string> = {
  move_in: "bg-emerald-500",
  move_out: "bg-rose-500",
  inspection: "bg-amber-500",
  room_tour: "bg-sky-500",
  memo: "bg-slate-400",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function SchedulePage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const { confirm, ConfirmDialog } = useConfirm();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(ymd(today));
  const [events, setEvents] = useState<EventRow[]>([]);
  const [edit, setEdit] = useState<Partial<EventRow> | null>(null);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const load = async () => {
    if (!selected) return;
    const monthStartStr = ymd(monthStart);
    const monthEndStr = ymd(monthEnd);

    const [eventsRes, tenantsRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, event_date, event_time, kind, memo")
        .eq("branch_id", selected.id)
        .gte("event_date", monthStartStr)
        .lte("event_date", monthEndStr)
        .order("event_date"),
      supabase
        .from("tenants")
        .select("id, name, move_in_date, move_out_date, status, room_id, rooms(room_number)")
        .eq("branch_id", selected.id),
    ]);

    const merged: EventRow[] = ((eventsRes.data ?? []) as EventRow[]).slice();

    type TenantRow = {
      id: string;
      name: string;
      move_in_date: string | null;
      move_out_date: string | null;
      status: string;
      room_id: string | null;
      rooms: { room_number: string } | null;
    };
    const tenants = (tenantsRes.data ?? []) as unknown as TenantRow[];
    for (const t of tenants) {
      const roomLabel = t.rooms?.room_number ? `${t.rooms.room_number}호 · ` : "";
      if (t.move_in_date && t.move_in_date >= monthStartStr && t.move_in_date <= monthEndStr) {
        merged.push({
          id: `tenant-in-${t.id}`,
          title: `${t.name} 입실`,
          event_date: t.move_in_date,
          event_time: null,
          kind: "move_in",
          memo: `${roomLabel}입실 예정`,
          readonly: true,
        });
      }
      if (
        t.move_out_date &&
        t.move_out_date >= monthStartStr &&
        t.move_out_date <= monthEndStr &&
        t.status !== "moved_out"
      ) {
        merged.push({
          id: `tenant-out-${t.id}`,
          title: `${t.name} 퇴실`,
          event_date: t.move_out_date,
          event_time: null,
          kind: "move_out",
          memo: `${roomLabel}퇴실 예정`,
          readonly: true,
        });
      }
    }

    merged.sort((a, b) => a.event_date.localeCompare(b.event_date));
    setEvents(merged);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, cursor.getTime()]);

  const cells = useMemo(() => {
    const firstDow = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const arr: ({ date: string; day: number } | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) {
      arr.push({
        date: ymd(new Date(cursor.getFullYear(), cursor.getMonth(), d)),
        day: d,
      });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    events.forEach((e) => {
      const list = map.get(e.event_date) ?? [];
      list.push(e);
      map.set(e.event_date, list);
    });
    return map;
  }, [events]);

  const dayEvents = eventsByDate.get(selectedDate) ?? [];

  const save = async () => {
    if (!user || !selected || !edit) return;
    if (!edit.title?.trim()) return notifyValidation("제목을 입력해 주세요.");
    const payload = {
      title: edit.title!.trim(),
      event_date: edit.event_date ?? selectedDate,
      event_time: edit.event_time || null,
      kind: (edit.kind ?? "memo") as EventKind,
      memo: edit.memo?.trim() || null,
      owner_id: user.id,
      branch_id: selected.id,
    };
    const res = edit.id
      ? await supabase.from("events").update(payload).eq("id", edit.id)
      : await supabase.from("events").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("일정이 저장되었습니다.");
    setEdit(null);
    load();
  };

  return (
    <MobileFrame>
      <TopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[15px] font-bold">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h1>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-3 py-3">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[10.5px] font-semibold text-muted-foreground">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={cn("py-1.5", i === 0 && "text-rose-500", i === 6 && "text-sky-500")}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c, idx) => {
              if (!c)
                return <div key={idx} className="aspect-square border-b border-r border-border/60 bg-muted/20 last:border-r-0" />;
              const evs = eventsByDate.get(c.date) ?? [];
              const hasEvents = evs.length > 0;
              const isSel = c.date === selectedDate;
              const isToday = c.date === ymd(today);
              const col = idx % 7;
              return (
                <button
                  key={c.date}
                  type="button"
                  onClick={() => setSelectedDate(c.date)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-start border-b border-r border-border/60 p-1 text-[11.5px] transition last:border-r-0",
                    col === 6 && "border-r-0",
                    isSel
                      ? "bg-foreground text-background"
                      : hasEvents
                        ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                        : isToday
                          ? "bg-brand/10 text-brand"
                          : "hover:bg-accent",
                  )}
                >
                  <span className={cn("font-semibold", isToday && !isSel && "underline")}>{c.day}</span>
                  <div className="mt-auto flex gap-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("h-1 w-1 rounded-full", KIND_TONE[e.kind])} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">{selectedDate}</h2>
            <Button size="sm" onClick={() => setEdit({ event_date: selectedDate, kind: "memo" })} className="h-9 rounded-xl">
              <Plus className="h-4 w-4" /> 일정
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {dayEvents.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
                <CalendarDays className="mx-auto mb-1.5 h-5 w-5" />
                예정된 일정이 없어요.
              </li>
            ) : (
              dayEvents.map((e) => (
                <li
                  key={e.id}
                  onClick={() => {
                    if (e.readonly) {
                      toast.info("입실/퇴실 일정은 입실자 화면에서 수정할 수 있어요.");
                      return;
                    }
                    setEdit(e);
                  }}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5"
                >
                  <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", KIND_TONE[e.kind])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{e.title}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {KIND_LABEL[e.kind]}
                      {e.event_time ? ` · ${e.event_time.slice(0, 5)}` : ""}
                      {e.memo ? ` · ${e.memo}` : ""}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>

      <BottomTabs />

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "일정 수정" : "일정 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input
                value={edit?.title ?? ""}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={edit?.event_date ?? selectedDate}
                  onChange={(e) => setEdit({ ...edit, event_date: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>시간</Label>
                <Input
                  type="time"
                  value={edit?.event_time ?? ""}
                  onChange={(e) => setEdit({ ...edit, event_time: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>분류</Label>
              <Select
                value={edit?.kind ?? "memo"}
                onValueChange={(v) => setEdit({ ...edit, kind: v as EventKind })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as EventKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>메모</Label>
              <Input
                value={edit?.memo ?? ""}
                onChange={(e) => setEdit({ ...edit, memo: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            {edit?.id && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: "이 일정을 삭제할까요?",
                    tone: "danger",
                    confirmLabel: "삭제",
                  });
                  if (!ok) return;
                  const { error } = await supabase.from("events").delete().eq("id", edit.id!);
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
