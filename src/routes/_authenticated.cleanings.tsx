import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Sparkles, Check } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/hooks/useBranch";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cleanings")({
  head: () => ({ meta: [{ title: "청소 — Gossol" }] }),
  component: CleaningsPage,
});

type Cleaning = {
  id: string;
  room_id: string;
  status: "assigned" | "requested" | "completed";
  scheduled_date: string | null;
  requested_at: string | null;
  completed_at: string | null;
  memo: string | null;
};

const STATUS = { assigned: "배정", requested: "요청", completed: "완료" } as const;

function CleaningsPage() {
  const navigate = useNavigate();
  const { selected } = useBranch();
  const [items, setItems] = useState<Cleaning[]>([]);
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"assigned" | "requested" | "completed">("assigned");

  const load = async () => {
    if (!selected) return;
    const { data } = await supabase
      .from("cleanings")
      .select("id, room_id, status, scheduled_date, requested_at, completed_at, memo")
      .eq("branch_id", selected.id)
      .order("scheduled_date", { ascending: true, nullsFirst: false });
    const list = (data ?? []) as Cleaning[];
    setItems(list);
    const roomIds = [...new Set(list.map((i) => i.room_id).filter(Boolean))];
    if (roomIds.length) {
      const { data: r } = await supabase
        .from("rooms")
        .select("id, room_number")
        .in("id", roomIds);
      setRooms(Object.fromEntries((r ?? []).map((x) => [x.id, x.room_number])));
    }
  };

  useEffect(() => {
    load();
  }, [selected?.id]);

  const advance = async (it: Cleaning) => {
    const next: "requested" | "completed" = it.status === "assigned" ? "requested" : "completed";
    const patch: { status: typeof next; requested_at?: string } = { status: next };
    if (next === "requested") patch.requested_at = new Date().toISOString();
    await supabase.from("cleanings").update(patch).eq("id", it.id);
    toast.success(next === "requested" ? "청소 요청됨" : "청소 완료 처리");
    load();
  };

  const filtered = items.filter((i) => i.status === tab);

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
        <h1 className="flex-1 text-[15px] font-bold">청소</h1>
      </header>

      <div className="px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">청소 배정</TabsTrigger>
            <TabsTrigger value="requested">청소 요청</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState icon={Sparkles} title="해당 단계의 청소가 없어요" />
        ) : (
          filtered.map((it) => (
            <article key={it.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold">{rooms[it.room_id] ?? "-"}호</h3>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {it.scheduled_date ?? "일정 미정"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                    it.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : it.status === "requested"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700",
                  )}
                >
                  {STATUS[it.status]}
                </span>
              </div>
              {it.memo && <p className="mt-2 text-[12.5px] text-muted-foreground">{it.memo}</p>}
              {it.status !== "completed" && (
                <Button size="sm" className="mt-3 w-full rounded-xl" onClick={() => advance(it)}>
                  <Check className="h-3.5 w-3.5" />{" "}
                  {it.status === "assigned" ? "청소 요청 보내기" : "청소 완료"}
                </Button>
              )}
            </article>
          ))
        )}
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}
