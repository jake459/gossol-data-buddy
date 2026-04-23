import { supabase } from "@/integrations/supabase/client";

type NotifyArgs = {
  recipientId: string;
  branchId?: string | null;
  audience: "owner" | "staff" | "tenant";
  category: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

/** Insert a notification row. Failures are swallowed (best-effort). */
export async function notify(args: NotifyArgs) {
  try {
    await supabase.from("notifications").insert({
      recipient_id: args.recipientId,
      branch_id: args.branchId ?? null,
      audience: args.audience,
      category: args.category,
      title: args.title,
      body: args.body ?? null,
      link: args.link ?? null,
    });
  } catch (e) {
    // best-effort
    console.warn("notify failed", e);
  }
}
