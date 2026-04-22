import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Megaphone, Pin } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { DemoTopBar } from "@/components/DemoTopBar";
import { DemoBottomTabs } from "@/components/DemoBottomTabs";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/community")({
  head: () => ({ meta: [{ title: "데모 커뮤니티 — Gossol" }] }),
  component: DemoCommunityPage,
});

const POSTS = [
  { id: "p1", category: "공지", title: "[필독] 12월 정기 점검 안내", excerpt: "12/15(일) 오전 2시~4시, 시스템 점검이 진행됩니다.", pinned: true, when: "어제" },
  { id: "p2", category: "팁", title: "월세 미납자 응대, 이렇게 해보세요", excerpt: "단호함과 친절함의 균형이 핵심입니다. 5가지 멘트 예시...", pinned: false, when: "3일 전" },
  { id: "p3", category: "이벤트", title: "원장님 소개 이벤트 — 가입비 50% 할인", excerpt: "추천 코드 공유 시 양쪽 모두 혜택!", pinned: false, when: "1주 전" },
  { id: "p4", category: "업데이트", title: "v1.4 업데이트 — 일정 캘린더 개선", excerpt: "월간 보기와 일별 보기가 더 빨라졌어요.", pinned: false, when: "2주 전" },
];

function DemoCommunityPage() {
  return (
    <MobileFrame>
      <DemoTopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link to="/demo/dashboard" className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[15px] font-bold">원장님 커뮤니티</h1>
      </header>
      <main className="flex-1 space-y-2 px-4 py-4">
        {POSTS.map((p) => (
          <button key={p.id} type="button" onClick={() => toast.info("데모: 게시글 상세 비활성화")} className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              {p.pinned ? <Pin className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{p.category}</span>
                <span className="text-[11px] text-muted-foreground">{p.when}</span>
              </div>
              <p className="mt-1 text-[14px] font-semibold">{p.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{p.excerpt}</p>
            </div>
          </button>
        ))}
      </main>
      <DemoBottomTabs />
    </MobileFrame>
  );
}
