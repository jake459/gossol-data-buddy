import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabaseServer } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // SSR: check session and route appropriately. If unauthenticated → /login.
    try {
      const supabase = await supabaseServer();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      throw redirect({ to: session ? "/dashboard" : "/login", replace: true });
    } catch (e) {
      // Fallback for client-side: send to login
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      throw redirect({ to: "/login", replace: true });
    }
  },
});
