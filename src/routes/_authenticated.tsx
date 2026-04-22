import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { MobileFrame } from "@/components/MobileFrame";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, user } = useAuth();
  const { branches, loading: branchLoading } = useBranch();

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </MobileFrame>
    );
  }

  if (!user) {
    // Throw redirect via router on next tick
    throw redirect({ to: "/login" });
  }

  // First-time user → onboarding (no branches yet)
  if (!branchLoading && branches.length === 0) {
    const onOnboarding = window.location.pathname.startsWith("/onboarding");
    if (!onOnboarding) throw redirect({ to: "/onboarding" });
  }

  return <Outlet />;
}
