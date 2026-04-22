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
    <nav
      aria-label="주요 탐색"
      className="sticky bottom-0 z-30 mt-auto grid grid-cols-4 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur"
    >
      {items.map(({ to, label, Icon }) => {
        const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              active ? "text-brand" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
