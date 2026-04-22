import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, DoorOpen, Users, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Tailwind text color class for the icon (colorful, distinct per tab) */
  color: string;
  /** Tailwind bg tint class for active state */
  activeBg: string;
};

const DEFAULT_TABS: Tab[] = [
  {
    to: "/dashboard",
    label: "대시보드",
    Icon: LayoutDashboard,
    color: "text-[oklch(0.55_0.2_258)]", // blue
    activeBg: "bg-[oklch(0.95_0.05_258)]",
  },
  {
    to: "/rooms",
    label: "호실",
    Icon: DoorOpen,
    color: "text-[oklch(0.62_0.18_195)]", // teal/cyan
    activeBg: "bg-[oklch(0.95_0.05_195)]",
  },
  {
    to: "/tenants",
    label: "입실자",
    Icon: Users,
    color: "text-[oklch(0.66_0.18_158)]", // green
    activeBg: "bg-[oklch(0.95_0.05_158)]",
  },
  {
    to: "/schedule",
    label: "일정",
    Icon: CalendarDays,
    color: "text-[oklch(0.7_0.18_55)]", // amber/orange
    activeBg: "bg-[oklch(0.96_0.05_70)]",
  },
  {
    to: "/settings",
    label: "설정",
    Icon: Settings,
    color: "text-[oklch(0.6_0.2_300)]", // violet
    activeBg: "bg-[oklch(0.95_0.04_300)]",
  },
];

export function BottomTabs({ tabs }: { tabs?: Tab[] }) {
  const location = useLocation();
  const items = tabs ?? DEFAULT_TABS;

  return (
    <div className="sticky bottom-0 z-30 mt-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
      <nav
        aria-label="주요 탐색"
        className="grid grid-cols-5 rounded-[22px] bg-white/85 p-1.5 shadow-[0_18px_45px_-18px_oklch(0.45_0.18_260/0.35)] ring-1 ring-[oklch(0.92_0.04_258)] backdrop-blur-xl"
      >
        {items.map(({ to, label, Icon, color, activeBg }) => {
          const path = location.pathname;
          const active =
            to === "/dashboard"
              ? path === "/" || path.startsWith("/dashboard")
              : path === to || path.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-all",
                active ? activeBg : "hover:bg-[oklch(0.97_0.01_258)]",
              )}
            >
              <Icon
                className={cn(
                  "h-[20px] w-[20px] transition-transform",
                  color,
                  active ? "scale-110" : "opacity-70 group-hover:opacity-100",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={cn(
                  "tracking-tight",
                  active ? color : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
