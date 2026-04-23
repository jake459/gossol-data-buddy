import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { MobileFrame } from "@/components/MobileFrame";

export const Route = createFileRoute("/")({
  component: RootRedirect,
});

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </MobileFrame>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}
