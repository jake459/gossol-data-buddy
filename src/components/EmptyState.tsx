import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-[260px] text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && (actionTo || onAction) ? (
        <div className="mt-4">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-[12.5px] font-semibold text-brand-foreground shadow-sm transition hover:opacity-90"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-[12.5px] font-semibold text-brand-foreground shadow-sm transition hover:opacity-90"
            >
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
