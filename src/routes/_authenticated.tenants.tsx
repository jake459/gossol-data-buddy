import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search, UserRound, Phone } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, formatKRW } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/hooks/useBranch";

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

const PAGE_SIZE = 10;

function TenantsPage() {
  const { selected } = useBranch();
  const [items, setItems] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<RoomMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

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

  useEffect(() => setPage(1), [q, selected?.id]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MobileFrame>
      <TopBar />
      <header className="bg-gradient-to-b from-white/85 to-transparent px-4 pb-3 pt-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">입실자</h1>
          <Link to="/tenants/new">
            <Button size="sm" className="h-9 rounded-xl">
              <Plus className="h-4 w-4" /> 입실 등록
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
          <EmptyState
            icon={UserRound}
            title={q ? "검색 결과가 없어요" : "아직 등록된 입실자가 없어요"}
            description={q ? "다른 이름이나 연락처로 검색해 보세요." : "첫 입실자를 등록해 운영을 시작해 보세요."}
            actionLabel="입실 등록"
            actionTo="/tenants/new"
          />
        ) : (
          <>
            <ul className="space-y-2">
              {pageItems.map((t) => {
                const room = rooms.find((r) => r.id === t.room_id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:bg-accent/40"
                  >
                    <Link
                      to="/tenants/$tenantId"
                      params={{ tenantId: t.id }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-[13px] font-bold text-brand">
                        {t.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[14px] font-semibold">{t.name}</p>
                          <StatusBadge kind="tenant" value={t.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {room ? `${room.room_number}호` : "미배정"} · 월 {formatKRW(t.monthly_rent ?? 0)}
                          {t.payment_day ? ` · 매달 ${t.payment_day}일` : ""}
                        </p>
                      </div>
                    </Link>
                    {t.phone && (
                      <a
                        href={`tel:${t.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
                        aria-label="전화"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <Pager page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} />
            )}
          </>
        )}
      </main>

      <BottomTabs />
    </MobileFrame>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
  total,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  total: number;
}) {
  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-[12px]">
      <span className="text-muted-foreground">
        총 {total}건 · {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8 rounded-lg border border-border bg-card px-2.5 font-semibold disabled:opacity-40"
        >
          이전
        </button>
        {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const num = start + i;
          if (num > totalPages) return null;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={
                "h-8 min-w-8 rounded-lg px-2 text-[12px] font-semibold " +
                (num === page
                  ? "bg-foreground text-background"
                  : "border border-border bg-card hover:bg-accent")
              }
            >
              {num}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-8 rounded-lg border border-border bg-card px-2.5 font-semibold disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </nav>
  );
}
