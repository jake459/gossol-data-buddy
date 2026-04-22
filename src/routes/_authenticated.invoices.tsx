import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Receipt, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { formatKRW, formatKRWShort } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({ meta: [{ title: "청구서 — Gossol" }] }),
  component: InvoicesPage,
});

type InvoiceStatus = "unpaid" | "paid" | "overdue" | "canceled";
type Invoice = {
  id: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_at: string | null;
  tenant_id: string | null;
};
type Tenant = { id: string; name: string; monthly_rent: number | null; payment_day: number | null };

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function InvoicesPage() {
  const { user } = useAuth();
  const { selected } = useBranch();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [month] = useState(new Date());

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const load = async () => {
    if (!selected) return;
    setLoading(true);
    const [iv, tn] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, amount, due_date, status, paid_at, tenant_id")
        .eq("branch_id", selected.id)
        .gte("due_date", monthStart.toISOString().slice(0, 10))
        .lte("due_date", monthEnd.toISOString().slice(0, 10))
        .order("due_date"),
      supabase
        .from("tenants")
        .select("id, name, monthly_rent, payment_day")
        .eq("branch_id", selected.id)
        .eq("status", "active"),
    ]);
    setInvoices((iv.data ?? []) as Invoice[]);
    setTenants((tn.data ?? []) as Tenant[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const totals = useMemo(() => {
    let billed = 0,
      collected = 0,
      unpaid = 0;
    invoices.forEach((iv) => {
      billed += iv.amount;
      if (iv.status === "paid") collected += iv.amount;
      else if (iv.status === "unpaid" || iv.status === "overdue") unpaid += iv.amount;
    });
    return { billed, collected, unpaid };
  }, [invoices]);

  const issueMonthly = async () => {
    if (!selected || !user) return;
    setIssuing(true);
    const existingTenantIds = new Set(invoices.map((i) => i.tenant_id));
    const toInsert = tenants
      .filter((t) => !existingTenantIds.has(t.id) && (t.monthly_rent ?? 0) > 0)
      .map((t) => {
        const day = Math.min(Math.max(t.payment_day ?? 1, 1), 28);
        const due = new Date(month.getFullYear(), month.getMonth(), day);
        return {
          owner_id: user.id,
          branch_id: selected.id,
          tenant_id: t.id,
          amount: t.monthly_rent ?? 0,
          due_date: due.toISOString().slice(0, 10),
          status: "unpaid" as const,
          memo: `${monthLabel} 월세`,
        };
      });
    if (toInsert.length === 0) {
      setIssuing(false);
      toast.info("이번 달 발행할 청구서가 없어요.");
      return;
    }
    const { error } = await supabase.from("invoices").insert(toInsert);
    setIssuing(false);
    if (error) return toast.error(error.message);
    toast.success(`${toInsert.length}건의 청구서를 발행했습니다.`);
    load();
  };

  const togglePaid = async (iv: Invoice) => {
    const next: InvoiceStatus = iv.status === "paid" ? "unpaid" : "paid";
    const { error } = await supabase
      .from("invoices")
      .update({ status: next, paid_at: next === "paid" ? new Date().toISOString() : null })
      .eq("id", iv.id);
    if (error) return toast.error(error.message);
    setInvoices((prev) =>
      prev.map((x) =>
        x.id === iv.id
          ? { ...x, status: next, paid_at: next === "paid" ? new Date().toISOString() : null }
          : x,
      ),
    );
  };

  return (
    <MobileFrame>
      <TopBar />
      <header className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-bold">청구서 · {monthLabel}</h1>
          <Button size="sm" onClick={issueMonthly} disabled={issuing} className="h-9 rounded-xl">
            <Sparkles className="h-4 w-4" />
            {issuing ? "발행 중..." : "이번 달 발행"}
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4">
        <section className="grid grid-cols-3 gap-2">
          <SumTile label="청구액" value={totals.billed} tone="brand" />
          <SumTile label="수금완료" value={totals.collected} tone="success" />
          <SumTile label="미수금" value={totals.unpaid} tone="danger" />
        </section>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="이번 달 청구서가 없어요"
            description='상단의 "이번 달 발행"을 누르면 활동 중인 입실자에게 자동으로 발행됩니다.'
            actionLabel={issuing ? "발행 중..." : "이번 달 발행"}
            onAction={issueMonthly}
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {invoices.map((iv) => {
              const t = tenants.find((x) => x.id === iv.tenant_id);
              const paid = iv.status === "paid";
              return (
                <li key={iv.id}>
                  <button
                    type="button"
                    onClick={() => togglePaid(iv)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                  >
                    {paid ? (
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-[14px] font-semibold", paid && "line-through opacity-60")}>
                        {t?.name ?? "—"}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {iv.due_date} {paid ? "· 수금완료" : "· 미납"}
                      </p>
                    </div>
                    <p className={cn("text-[15px] font-bold", paid ? "text-muted-foreground" : "text-foreground")}>
                      {formatKRW(iv.amount)}
                    </p>
                  </button>
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

function SumTile({ label, value, tone }: { label: string; value: number; tone: "brand" | "success" | "danger" }) {
  const toneClass =
    tone === "danger" ? "text-rose-600" : tone === "success" ? "text-emerald-600" : "text-brand";
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[16px] font-bold", toneClass)}>{formatKRWShort(value)}</p>
    </div>
  );
}
