import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { DEMO_EVENTS } from "@/lib/demoData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/schedule")({
  head: () => ({ meta: [{ title: "데모 일정 — Gossol" }] }),
  component: DemoSchedulePage,
});

const KIND_LABEL = { move_in: "입실", move_out: "퇴실", inspection: "점검", room_tour: "룸투어", memo: "메모" } as const;
const KIND_TONE = { move_in: "bg-emerald-500", move_out: "bg-rose-500", inspection: "bg-amber-500", room_tour: "bg-sky-500", memo: "bg-slate-400" } as const;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function DemoSchedulePage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(ymd(today));

  const cells = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const firstDow = monthStart.getDay();
    const arr: ({ date: string; day: number } | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      arr.push({ date: ymd(new Date(cursor.getFullYear(), cursor.getMonth(), d)), day: d });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof DEMO_EVENTS>();
    DEMO_EVENTS.forEach((e) => {
      const list = map.get(e.event_date) ?? [];
      list.push(e);
      map.set(e.event_date, list);
    });
    return map;
  }, []);

  const dayEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[15px] font-bold">{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</h1>
          <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 px-4 py-3">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} className={cn("py-1.5", i === 0 && "text-rose-500", i === 6 && "text-sky-500")}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, idx) => {
            if (!c) return <div key={idx} />;
            const evs = eventsByDate.get(c.date) ?? [];
            const isSel = c.date === selectedDate;
            const isToday = c.date === ymd(today);
            return (
              <button key={c.date} type="button" onClick={() => setSelectedDate(c.date)} className={cn(
                "flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-[12px] transition",
                isSel ? "bg-foreground text-background" : isToday ? "bg-brand/10 text-brand" : "hover:bg-accent",
              )}>
                <span className="font-semibold">{c.day}</span>
                <div className="mt-auto flex gap-0.5">
                  {evs.slice(0, 3).map((e) => <span key={e.id} className={cn("h-1 w-1 rounded-full", KIND_TONE[e.kind])} />)}
                </div>
              </button>
            );
          })}
        </div>

        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">{selectedDate}</h2>
            <button type="button" onClick={() => toast.info("데모: 일정 추가는 비활성화")} className="inline-flex h-9 items-center gap-1 rounded-xl bg-foreground px-3 text-[12px] font-semibold text-background">
              <Plus className="h-3.5 w-3.5" /> 일정
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {dayEvents.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
                <CalendarDays className="mx-auto mb-1.5 h-5 w-5" />예정된 일정이 없어요.
              </li>
            ) : dayEvents.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
                <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", KIND_TONE[e.kind])} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{e.title}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {KIND_LABEL[e.kind]}{e.event_time ? ` · ${e.event_time}` : ""}{e.memo ? ` · ${e.memo}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
