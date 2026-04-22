import { Link, useLocation } from "@tanstack/react-router";
import { Home, DoorOpen, Users, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/demo/dashboard", label: "대시보드", Icon: Home, color: "text-[oklch(0.55_0.18_30)]", bg: "bg-[oklch(0.96_0.04_30)]" },
  { to: "/demo/rooms", label: "호실", Icon: DoorOpen, color: "text-[oklch(0.5_0.12_180)]", bg: "bg-[oklch(0.96_0.04_180)]" },
  { to: "/demo/tenants", label: "입실자", Icon: Users, color: "text-[oklch(0.5_0.18_295)]", bg: "bg-[oklch(0.96_0.04_295)]" },
  { to: "/demo/schedule", label: "일정", Icon: CalendarDays, color: "text-[oklch(0.5_0.18_258)]", bg: "bg-[oklch(0.96_0.04_258)]" },
  { to: "/demo/settings", label: "설정", Icon: Settings, color: "text-[oklch(0.5_0.18_300)]", bg: "bg-[oklch(0.96_0.04_300)]" },
] as const;

export function DemoBottomTabs() {
  const location = useLocation();
  return (
    <div className="sticky bottom-0 z-30 mt-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
      <nav
        aria-label="데모 탐색"
        className="grid grid-cols-5 rounded-[22px] bg-white/85 p-1.5 shadow-[0_18px_45px_-18px_oklch(0.45_0.18_260/0.35)] ring-1 ring-[oklch(0.92_0.04_258)] backdrop-blur-xl"
      >
        {TABS.map(({ to, label, Icon, color, bg }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-all",
                active ? bg : "hover:bg-[oklch(0.97_0.01_258)]",
              )}
            >
              <Icon className={cn("h-[22px] w-[22px] transition-transform", active ? `scale-110 ${color}` : "text-muted-foreground")} />
              <span className={cn("tracking-tight", active ? color : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
