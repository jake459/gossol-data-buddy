import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function BottomTabs({ tabs, basePath = "" }: { tabs?: Tab[]; basePath?: string }) {
  const location = useLocation();
  const items: Tab[] =
    tabs ?? [
      { to: `${basePath}/dashboard`, label: "대시보드", Icon: LayoutDashboard },
      { to: `${basePath}/schedule`, label: "일정", Icon: CalendarDays },
      { to: `${basePath}/tenants`, label: "입실자", Icon: Users },
      { to: `${basePath}/branches`, label: "지점", Icon: Building2 },
    ];

  return (
    <div className="sticky bottom-0 z-30 mt-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
      <nav
        aria-label="주요 탐색"
        className="grid grid-cols-4 rounded-2xl border border-white/50 bg-white/80 p-1.5 shadow-[0_15px_40px_-10px_oklch(0.2_0.05_260/0.25)] backdrop-blur-xl"
      >
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-all",
                active
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.4]")} />
              <span className="tracking-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
