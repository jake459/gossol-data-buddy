import { supabase } from "@/integrations/supabase/client";

type Audience = "owner" | "staff" | "tenant";

type NotifyArgs = {
  recipientId: string;
  branchId?: string | null;
  audience: Audience;
  category: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

/** 단일 알림 발송. 실패는 무시(best-effort). */
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
    console.warn("notify failed", e);
  }
}

type BranchNotifyArgs = {
  branchId: string;
  ownerId: string;
  category: string;
  title: string;
  body?: string | null;
  link?: string | null;
  /** 입실자에게도 보내려면 user_id 전달 */
  tenantUserId?: string | null;
  /** 어떤 청중에게 보낼지 (기본 owner+staff) */
  audiences?: Audience[];
};

/**
 * 지점의 점주 + 모든 스탭 + (옵션) 입실자에게 동시 발송.
 * 다이어그램의 "점주에게/스탭에게/입실자에게 알림" 3채널 자동 분기.
 */
export async function notifyBranch(args: BranchNotifyArgs) {
  const targets = args.audiences ?? ["owner", "staff"];
  const inserts: Array<{
    recipient_id: string;
    branch_id: string;
    audience: Audience;
    category: string;
    title: string;
    body: string | null;
    link: string | null;
  }> = [];

  // 점주
  if (targets.includes("owner")) {
    inserts.push({
      recipient_id: args.ownerId,
      branch_id: args.branchId,
      audience: "owner",
      category: args.category,
      title: args.title,
      body: args.body ?? null,
      link: args.link ?? null,
    });
  }

  // 스탭 (branch_members 조회)
  if (targets.includes("staff")) {
    const { data: members } = await supabase
      .from("branch_members")
      .select("user_id")
      .eq("branch_id", args.branchId)
      .eq("role", "staff");
    for (const m of members ?? []) {
      if (m.user_id === args.ownerId) continue;
      inserts.push({
        recipient_id: m.user_id,
        branch_id: args.branchId,
        audience: "staff",
        category: args.category,
        title: args.title,
        body: args.body ?? null,
        link: args.link ?? null,
      });
    }
  }

  // 입실자
  if (targets.includes("tenant") && args.tenantUserId) {
    inserts.push({
      recipient_id: args.tenantUserId,
      branch_id: args.branchId,
      audience: "tenant",
      category: args.category,
      title: args.title,
      body: args.body ?? null,
      link: args.link ?? null,
    });
  }

  if (inserts.length === 0) return;
  try {
    await supabase.from("notifications").insert(inserts);
  } catch (e) {
    console.warn("notifyBranch failed", e);
  }
}
