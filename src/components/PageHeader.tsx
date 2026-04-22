import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  right?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, backTo, right, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-start gap-2 px-5 pb-3 pt-4", className)}>
      {backTo ? (
        <Link
          to={backTo}
          aria-label="뒤로"
          className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[20px] font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
