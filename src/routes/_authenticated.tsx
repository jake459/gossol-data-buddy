import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { MobileFrame } from "@/components/MobileFrame";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, user } = useAuth();
  const { branches, loading: branchLoading } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!branchLoading && branches.length === 0) {
      if (!location.pathname.startsWith("/onboarding")) {
        navigate({ to: "/onboarding", replace: true });
      }
    }
  }, [loading, user, branchLoading, branches.length, location.pathname, navigate]);

  if (loading || !user || (branchLoading && branches.length === 0)) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </MobileFrame>
    );
  }

  return <Outlet />;
}
