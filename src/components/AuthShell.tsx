import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";

export function AuthShell({
  title,
  subtitle,
  children,
  backTo = "/",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backTo?: string;
}) {
  return (
    <MobileFrame>
      <header className="flex items-center px-2 py-3">
        <Link
          to={backTo}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex flex-1 flex-col px-6 pb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
        <div className="mt-7 flex flex-1 flex-col">{children}</div>
      </main>
    </MobileFrame>
  );
}
