import { cn } from "@/lib/utils";

/**
 * 페이지네이션 공통 컴포넌트.
 * - 모든 페이지에서 동일한 크기 유지 (이전/다음/총건수 박스 높이 고정 h-8, whitespace-nowrap)
 * - 가로 레이아웃 강제 (flex-nowrap) — 좁은 화면에서 세로로 줄바꿈되지 않도록.
 */
export function Pager({
  page,
  totalPages,
  onChange,
  total,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  total: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-3 flex flex-nowrap items-center justify-between gap-1.5 text-[11.5px]">
      <span className="shrink-0 whitespace-nowrap text-muted-foreground">
        총 {total}건 · {page}/{totalPages}
      </span>
      <div className="flex flex-nowrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-7 shrink-0 whitespace-nowrap rounded-md border border-border bg-card px-2 text-[11.5px] font-semibold disabled:opacity-40"
        >
          이전
        </button>
        {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const num = start + i;
          if (num > totalPages) return null;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={cn(
                "h-7 w-7 shrink-0 rounded-md text-[11.5px] font-semibold",
                num === page
                  ? "bg-foreground text-background"
                  : "border border-border bg-card hover:bg-accent",
              )}
            >
              {num}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-7 shrink-0 whitespace-nowrap rounded-md border border-border bg-card px-2 text-[11.5px] font-semibold disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </nav>
  );
}
