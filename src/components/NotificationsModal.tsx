import { useEffect, useState } from "react";
import { Bell, AlertCircle, CalendarClock, DoorOpen, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type DbNotification = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type Kind = "overdue" | "schedule" | "room" | "done";

function categoryToKind(c: string): Kind {
  if (c === "overdue" || c === "invoice_overdue") return "overdue";
  if (c === "move_in" || c === "move_out" || c === "extension" || c === "schedule") return "schedule";
  if (c === "room_tour" || c === "application" || c === "inspection" || c === "cleaning") return "room";
  return "done";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

const ICONS = {
  overdue: { Icon: AlertCircle, tone: "bg-[oklch(0.95_0.06_30)] text-[oklch(0.5_0.18_30)]" },
  schedule: { Icon: CalendarClock, tone: "bg-[oklch(0.95_0.05_258)] text-[oklch(0.45_0.18_258)]" },
  room: { Icon: DoorOpen, tone: "bg-[oklch(0.95_0.05_180)] text-[oklch(0.4_0.13_180)]" },
  done: { Icon: CheckCircle2, tone: "bg-[oklch(0.95_0.06_158)] text-[oklch(0.4_0.15_158)]" },
} as const;

export function NotificationsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("notifications")
      .select("id, category, title, body, link, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setItems((data ?? []) as DbNotification[]);
        setLoading(false);
      });
  }, [open, user]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const toggleRead = async (n: DbNotification) => {
    const nextReadAt = n.read_at ? null : new Date().toISOString();
    // optimistic
    setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read_at: nextReadAt } : p)));
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: nextReadAt })
      .eq("id", n.id);
    if (error) {
      // revert on failure
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read_at: n.read_at } : p)));
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read_at);
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((p) => (p.read_at ? p : { ...p, read_at: now })));
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .in(
        "id",
        unread.map((n) => n.id),
      );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-1 border-b bg-gradient-to-br from-[oklch(0.97_0.03_258)] to-white px-6 py-5 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[oklch(0.32_0.16_263)]">
              <Bell className="h-4 w-4" />
              <DialogTitle className="text-base font-bold">
                알림{" "}
                {unreadCount > 0 && (
                  <span className="ml-1 text-[11px] font-bold text-[oklch(0.55_0.2_30)]">
                    {unreadCount}
                  </span>
                )}
              </DialogTitle>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.45_0.18_258)] hover:bg-[oklch(0.95_0.04_258)]"
              >
                모두 읽음
              </button>
            )}
          </div>
          <DialogDescription className="break-keep text-[12.5px] leading-relaxed text-muted-foreground">
            입퇴실·청구·점검 등 운영 알림을 한곳에서 확인하세요.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Bell className="mx-auto h-7 w-7 text-muted-foreground/60" />
            <p className="mt-2 text-[13px] font-semibold">받은 알림이 없어요</p>
            <p className="mt-1 break-keep text-[11.5px] text-muted-foreground">
              입실 등록·퇴실·청구서 등 활동이 발생하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {items.map((n) => {
              const kind = categoryToKind(n.category);
              const { Icon, tone } = ICONS[kind];
              const unread = !n.read_at;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-5 py-3.5 transition hover:bg-accent/40",
                    unread && "bg-[oklch(0.985_0.012_258)]",
                  )}
                >
                  <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold">{n.title}</p>
                      {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[oklch(0.6_0.2_30)]" />}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 break-keep text-[12px] text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[10.5px] text-muted-foreground/80">{timeAgo(n.created_at)}</p>
                      <button
                        type="button"
                        onClick={() => toggleRead(n)}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-[oklch(0.45_0.18_258)] hover:bg-[oklch(0.96_0.04_258)]"
                      >
                        {unread ? "읽음 표시" : "안읽음으로"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t px-5 py-3 text-center text-[11px] text-muted-foreground">
          최근 30개 알림을 표시합니다.
        </div>
      </DialogContent>
    </Dialog>
  );
}
