import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, TrendingUp, Wallet, DoorClosed } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { useBranch } from "@/hooks/useBranch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "통계 — Gossol" }] }),
  component: StatsPage,
});

type MonthRow = { month: string; revenue: number; collected: number; billed: number };

function StatsPage() {
  const navigate = useNavigate();
  const { selected } = useBranch();
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [vacancy, setVacancy] = useState({ vacant: 0, occupied: 0, total: 0 });

  useEffect(() => {
    if (!selected) return;
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    const sinceStr = since.toISOString().slice(0, 10);

    Promise.all([
      supabase
        .from("invoices")
        .select("amount, status, due_date, paid_at")
        .eq("branch_id", selected.id)
        .gte("due_date", sinceStr),
      supabase.from("rooms").select("status").eq("branch_id", selected.id),
    ]).then(([inv, rm]) => {
      const buckets = new Map<string, MonthRow>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets.set(key, { month: `${d.getMonth() + 1}월`, revenue: 0, collected: 0, billed: 0 });
      }
      ((inv.data ?? []) as { amount: number; status: string; due_date: string }[]).forEach((i) => {
        const key = i.due_date.slice(0, 7);
        const b = buckets.get(key);
        if (!b) return;
        b.billed += i.amount;
        if (i.status === "paid") {
          b.collected += i.amount;
          b.revenue += i.amount;
        }
      });
      setMonths(Array.from(buckets.values()));

      const rs = (rm.data ?? []) as { status: string }[];
      let vacant = 0,
        occupied = 0;
      rs.forEach((r) => {
        if (r.status === "vacant") vacant++;
        if (r.status === "occupied") occupied++;
      });
      setVacancy({ vacant, occupied, total: rs.length });
    });
  }, [selected?.id]);

  const totals = useMemo(() => {
    const billed = months.reduce((s, m) => s + m.billed, 0);
    const collected = months.reduce((s, m) => s + m.collected, 0);
    return {
      billed,
      collected,
      rate: billed === 0 ? 0 : Math.round((collected / billed) * 100),
    };
  }, [months]);

  const occupancyRate = vacancy.total === 0 ? 0 : Math.round((vacancy.occupied / vacancy.total) * 100);

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
        <h1 className="flex-1 text-[15px] font-bold">운영 통계</h1>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        <section className="grid grid-cols-3 gap-2">
          <KPI icon={Wallet} label="6개월 매출" value={`${(totals.collected / 10000).toFixed(0)}만`} />
          <KPI icon={TrendingUp} label="수금률" value={`${totals.rate}%`} />
          <KPI icon={DoorClosed} label="가동률" value={`${occupancyRate}%`} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-bold">월별 매출</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 260)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip
                  formatter={(v: number) => `${v.toLocaleString()}원`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="oklch(0.46 0.18 258)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-bold">청구 vs 수금</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 260)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip
                  formatter={(v: number) => `${v.toLocaleString()}원`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="billed" stroke="oklch(0.7 0.15 250)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="collected" stroke="oklch(0.55 0.18 150)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.7_0.15_250)]" /> 청구
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.18_150)]" /> 수금
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-bold">호실 현황</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full bg-brand transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <span className="text-[12px] font-semibold text-muted-foreground">{occupancyRate}%</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
            <div className="rounded-xl bg-muted/50 py-2">
              <div className="text-[11px] text-muted-foreground">전체</div>
              <div className="font-bold">{vacancy.total}</div>
            </div>
            <div className="rounded-xl bg-emerald-100 py-2">
              <div className="text-[11px] text-emerald-700">입실</div>
              <div className="font-bold text-emerald-700">{vacancy.occupied}</div>
            </div>
            <div className="rounded-xl bg-rose-100 py-2">
              <div className="text-[11px] text-rose-700">공실</div>
              <div className="font-bold text-rose-700">{vacancy.vacant}</div>
            </div>
          </div>
        </section>
      </main>
      <BottomTabs />
    </MobileFrame>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 text-brand" /> {label}
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
