import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type IconProps = { className?: string; active?: boolean };

/** 컬러풀 / 솔리드 느낌의 커스텀 아이콘 (참고 이미지 톤과 일치) */
function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.8Z" fill="#FF6A55"/>
      <path d="M3 11.5 12 3.2l9 8.3" stroke="#C2371F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14.5" y="5.5" width="2.2" height="3.4" rx="0.4" fill="#C2371F"/>
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" fill="#5B8DEF"/>
      <rect x="3.5" y="5.5" width="17" height="5" rx="2.5" fill="#3D6FD1"/>
      <rect x="7" y="3" width="2" height="4.5" rx="1" fill="#2A4FA0"/>
      <rect x="15" y="3" width="2" height="4.5" rx="1" fill="#2A4FA0"/>
      <g fill="#FFFFFF">
        <rect x="6.5" y="12.5" width="2.2" height="2.2" rx="0.4"/>
        <rect x="10.9" y="12.5" width="2.2" height="2.2" rx="0.4"/>
        <rect x="15.3" y="12.5" width="2.2" height="2.2" rx="0.4"/>
        <rect x="6.5" y="16.2" width="2.2" height="2.2" rx="0.4"/>
        <rect x="10.9" y="16.2" width="2.2" height="2.2" rx="0.4"/>
      </g>
    </svg>
  );
}

function TenantsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="8.5" r="3.2" fill="#7C5CE0"/>
      <circle cx="15.8" cy="9.2" r="2.6" fill="#9B7BFF"/>
      <path d="M3 19.2c.4-3 2.8-5 5.5-5s5.1 2 5.5 5v.3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-.3Z" fill="#7C5CE0"/>
      <path d="M14 20c.3-2.5 2-4.4 4-4.7 2.3-.3 4.2 1.4 4.5 3.7l.1.6a.4.4 0 0 1-.4.4h-7.8a.4.4 0 0 1-.4-.5Z" fill="#9B7BFF"/>
    </svg>
  );
}

function RoomsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20V8.5L12 4l8 4.5V20" fill="#22B8A6"/>
      <path d="M4 20V8.5L12 4l8 4.5V20" stroke="#0E7C6F" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="9.5" y="11" width="5" height="9" rx="0.6" fill="#0E7C6F"/>
      <circle cx="13.2" cy="15.6" r="0.55" fill="#FFD466"/>
      <line x1="4" y1="20" x2="20" y2="20" stroke="#0E7C6F" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.6 13.7 5l2.9-.4 1.1 2.7 2.6 1.4-.6 2.9 1.7 2.4-1.7 2.4.6 2.9-2.6 1.4-1.1 2.7-2.9-.4L12 21.4 10.3 19l-2.9.4-1.1-2.7L3.7 15.3l.6-2.9L2.6 10l1.7-2.4-.6-2.9 2.6-1.4L7.4 4.6l2.9.4L12 2.6Z" fill="#A87BFF"/>
      <circle cx="12" cy="12" r="3.4" fill="#FFFFFF"/>
      <circle cx="12" cy="12" r="1.8" fill="#6B3FD1"/>
    </svg>
  );
}

type Tab = {
  to: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
  /** Tailwind text color class for the active label */
  labelColor: string;
  /** Tailwind bg tint class for active state */
  activeBg: string;
};

const DEFAULT_TABS: Tab[] = [
  {
    to: "/dashboard",
    label: "대시보드",
    Icon: HomeIcon,
    labelColor: "text-[oklch(0.55_0.18_30)]",
    activeBg: "bg-[oklch(0.96_0.04_30)]",
  },
  {
    to: "/rooms",
    label: "호실",
    Icon: RoomsIcon,
    labelColor: "text-[oklch(0.5_0.12_180)]",
    activeBg: "bg-[oklch(0.96_0.04_180)]",
  },
  {
    to: "/tenants",
    label: "입실자",
    Icon: TenantsIcon,
    labelColor: "text-[oklch(0.5_0.18_295)]",
    activeBg: "bg-[oklch(0.96_0.04_295)]",
  },
  {
    to: "/schedule",
    label: "일정",
    Icon: CalendarIcon,
    labelColor: "text-[oklch(0.5_0.18_258)]",
    activeBg: "bg-[oklch(0.96_0.04_258)]",
  },
  {
    to: "/settings",
    label: "설정",
    Icon: SettingsIcon,
    labelColor: "text-[oklch(0.5_0.18_300)]",
    activeBg: "bg-[oklch(0.96_0.04_300)]",
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
        {items.map(({ to, label, Icon, color = FALLBACK_COLOR, activeBg = FALLBACK_ACTIVE_BG }) => {
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
