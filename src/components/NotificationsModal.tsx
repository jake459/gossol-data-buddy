import { Bell, AlertCircle, CalendarClock, DoorOpen, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Notice = {
  id: string;
  kind: "overdue" | "schedule" | "room" | "done";
  title: string;
  desc: string;
  time: string;
  unread?: boolean;
};

const ICONS = {
  overdue: { Icon: AlertCircle, tone: "bg-[oklch(0.95_0.06_30)] text-[oklch(0.5_0.18_30)]" },
  schedule: { Icon: CalendarClock, tone: "bg-[oklch(0.95_0.05_258)] text-[oklch(0.45_0.18_258)]" },
  room: { Icon: DoorOpen, tone: "bg-[oklch(0.95_0.05_180)] text-[oklch(0.4_0.13_180)]" },
  done: { Icon: CheckCircle2, tone: "bg-[oklch(0.95_0.06_158)] text-[oklch(0.4_0.15_158)]" },
} as const;

/**
 * 원장님용 알림 센터.
 * 데모/실서비스 모두에서 동일한 UX를 제공하기 위해 props로 알림 목록을 주입받지 않고
 * 운영 안내성 더미 데이터로 시작합니다. (추후 Supabase notifications 테이블 연동 예정)
 */
export function NotificationsModal({
  open,
  onOpenChange,
  notices,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notices?: Notice[];
}) {
  const items: Notice[] = notices ?? DEFAULT_NOTICES;
  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-1 border-b bg-gradient-to-br from-[oklch(0.97_0.03_258)] to-white px-6 py-5 text-left">
          <div className="flex items-center gap-2 text-[oklch(0.32_0.16_263)]">
            <Bell className="h-4 w-4" />
            <DialogTitle className="text-base font-bold">
              알림 {unreadCount > 0 && <span className="ml-1 text-[11px] font-bold text-[oklch(0.55_0.2_30)]">{unreadCount}</span>}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            월세 미납·일정·문의 등 운영 알림을 한곳에서 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
          {items.map((n) => {
            const { Icon, tone } = ICONS[n.kind];
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-5 py-3.5 transition hover:bg-accent/40",
                  n.unread && "bg-[oklch(0.985_0.012_258)]",
                )}
              >
                <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-semibold">{n.title}</p>
                    {n.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[oklch(0.6_0.2_30)]" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{n.desc}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground/80">{n.time}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t px-5 py-3 text-center text-[11px] text-muted-foreground">
          최근 7일간 받은 알림을 표시합니다.
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DEFAULT_NOTICES: Notice[] = [
  {
    id: "1",
    kind: "overdue",
    title: "월세 미납 알림",
    desc: "302호 김민수 님의 월세가 3일째 미납 상태입니다.",
    time: "오늘 09:12",
    unread: true,
  },
  {
    id: "2",
    kind: "schedule",
    title: "내일 입실 예정",
    desc: "박지영 님이 내일 오후 2시 405호로 입실할 예정입니다.",
    time: "어제 18:40",
    unread: true,
  },
  {
    id: "3",
    kind: "room",
    title: "룸투어 문의 도착",
    desc: "이서연 님이 1인실 룸투어를 신청했습니다.",
    time: "2일 전",
  },
  {
    id: "4",
    kind: "done",
    title: "월세 수납 완료",
    desc: "201호 정현우 님의 이번 달 월세가 입금되었습니다.",
    time: "3일 전",
  },
];
