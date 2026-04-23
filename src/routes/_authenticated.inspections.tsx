import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ClipboardCheck, Check } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/inspections")({
  head: () => ({ meta: [{ title: "퇴실 검수 — Gossol" }] }),
  component: InspectionsPage,
});

type Inspection = {
  id: string;
  room_id: string;
  tenant_id: string | null;
  status: "assigned" | "requested" | "completed";
  scheduled_date: string | null;
  requested_at: string | null;
  completed_at: string | null;
  memo: string | null;
  rooms?: { room_number: string } | null;
  tenants?: { name: string } | null;
};

function InspectionsPage() {
  const navigate = useNavigate();
  const { selected } = useBranch();
  const [items, setItems] = useState<Inspection[]>([]);
  const [tab, setTab] = useState<"assigned" | "requested" | "completed">("assigned");

  const load = async () => {
    if (!selected) return;
    const { data } = await supabase
      .from("inspections")
      .select("*, rooms(room_number), tenants(name)")
      .eq("branch_id", selected.id)
      .order("scheduled_date", { ascending: true, nullsFirst: false });
    setItems((data ?? []) as Inspection[]);
  };

  useEffect(() => {
    load();
  }, [selected?.id]);

  const advance = async (it: Inspection) => {
    const next = it.status === "assigned" ? "requested" : "completed";
    const patch: Partial<Inspection> = { status: next };
    if (next === "requested") patch.requested_at = new Date().toISOString();
    await supabase.from("inspections").update(patch).eq("id", it.id);
    toast.success(next === "requested" ? "검수 요청됨" : "검수 완료 처리");
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
        <h1 className="flex-1 text-[15px] font-bold">퇴실 검수</h1>
      </header>

      <div className="px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">검수 배정</TabsTrigger>
            <TabsTrigger value="requested">검수 요청</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="해당 단계의 검수가 없어요" />
        ) : (
          filtered.map((it) => (
            <article key={it.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold">
                    {it.rooms?.room_number ?? "-"}호 · {it.tenants?.name ?? "퇴실자 미연결"}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {it.scheduled_date ?? "일정 미정"} · {STATUS[it.status]}
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
                  {it.status === "assigned" ? "검수 요청 보내기" : "검수 완료"}
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

const STATUS = { assigned: "배정", requested: "요청", completed: "완료" } as const;
