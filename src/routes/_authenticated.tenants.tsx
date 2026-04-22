import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search, UserRound, Phone } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/hooks/useBranch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "입실자 — Gossol" }] }),
  component: TenantsPage,
});

type TenantStatus = "active" | "overdue" | "moved_out";
type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  status: TenantStatus;
  monthly_rent: number | null;
  payment_day: number | null;
  room_id: string | null;
};
type RoomMini = { id: string; room_number: string };

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "정상",
  overdue: "미납",
  moved_out: "퇴실",
};
const STATUS_TONE: Record<TenantStatus, string> = {
  active: "bg-emerald-50 text-emerald-600",
  overdue: "bg-rose-50 text-rose-600",
  moved_out: "bg-slate-100 text-slate-500",
};

function TenantsPage() {
  const { selected } = useBranch();
  const [items, setItems] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<RoomMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("tenants")
        .select("id, name, phone, status, monthly_rent, payment_day, room_id")
        .eq("branch_id", selected.id)
        .order("created_at", { ascending: false }),
      supabase.from("rooms").select("id, room_number").eq("branch_id", selected.id),
    ]).then(([t, r]) => {
      setItems((t.data ?? []) as Tenant[]);
      setRooms((r.data ?? []) as RoomMini[]);
      setLoading(false);
    });
  }, [selected?.id]);

  const filtered = items.filter(
    (t) => !q || t.name.includes(q) || (t.phone ?? "").includes(q),
  );

  return (
    <MobileFrame>
      <TopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">입실자</h1>
          <Link to="/tenants/new">
            <Button size="sm" className="h-9 rounded-xl">
              <Plus className="h-4 w-4" /> 입주 등록
            </Button>
          </Link>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·연락처 검색"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">아직 등록된 입실자가 없어요.</p>
            <Link to="/tenants/new">
              <Button className="mt-3 h-10 rounded-xl">
                <Plus className="h-4 w-4" /> 입주 등록
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => {
              const room = rooms.find((r) => r.id === t.room_id);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-[13px] font-bold text-brand">
                    {t.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-semibold">{t.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                          STATUS_TONE[t.status],
                        )}
                      >
                        {STATUS_LABEL[t.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {room ? `${room.room_number}호` : "미배정"} · 월 {(t.monthly_rent ?? 0).toLocaleString()}원
                      {t.payment_day ? ` · 매달 ${t.payment_day}일` : ""}
                    </p>
                  </div>
                  {t.phone && (
                    <a
                      href={`tel:${t.phone}`}
                      className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
                      aria-label="전화"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomTabs />
    </MobileFrame>
  );
}
