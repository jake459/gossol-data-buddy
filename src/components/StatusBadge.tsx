import { cn } from "@/lib/utils";

type Tone = "brand" | "success" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  muted: "bg-muted text-muted-foreground",
};

const ROOM_STATUS: Record<string, { label: string; tone: Tone }> = {
  vacant: { label: "공실", tone: "danger" },
  occupied: { label: "입실", tone: "brand" },
  cleaning: { label: "청소중", tone: "warning" },
  maintenance: { label: "수리중", tone: "muted" },
};

const TENANT_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "정상", tone: "success" },
  overdue: { label: "연체", tone: "danger" },
  moved_out: { label: "퇴실", tone: "muted" },
};

const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "납부", tone: "success" },
  unpaid: { label: "미납", tone: "warning" },
  overdue: { label: "연체", tone: "danger" },
  canceled: { label: "취소", tone: "muted" },
};

const APPLICATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "대기", tone: "warning" },
  approved: { label: "승인", tone: "success" },
  rejected: { label: "거절", tone: "danger" },
  completed: { label: "완료", tone: "muted" },
};

const MAPS = {
  room: ROOM_STATUS,
  tenant: TENANT_STATUS,
  invoice: INVOICE_STATUS,
  application: APPLICATION_STATUS,
} as const;

type Kind = keyof typeof MAPS;

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: Kind;
  value: string;
  className?: string;
}) {
  const meta = MAPS[kind][value] ?? { label: value, tone: "muted" as Tone };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        toneClasses[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function formatKRW(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function formatKRWShort(amount: number) {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만`;
  }
  return amount.toLocaleString("ko-KR");
}
