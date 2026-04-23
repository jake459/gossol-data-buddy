import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Pin, Megaphone, Lightbulb, Sparkles, CalendarDays } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pager } from "@/components/Pager";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "커뮤니티 — Gossol" }] }),
  component: CommunityPage,
});

type Post = {
  id: string;
  title: string;
  content: string;
  category: "notice" | "event" | "tip" | "update";
  pinned: boolean;
  published_at: string;
  cover_image: string | null;
};

const CATEGORY = {
  notice: { label: "공지", Icon: Megaphone, color: "bg-rose-100 text-rose-700" },
  event: { label: "이벤트", Icon: CalendarDays, color: "bg-amber-100 text-amber-700" },
  tip: { label: "운영 팁", Icon: Lightbulb, color: "bg-emerald-100 text-emerald-700" },
  update: { label: "업데이트", Icon: Sparkles, color: "bg-blue-100 text-blue-700" },
};

function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"all" | Post["category"]>("all");
  const [opened, setOpened] = useState<Post | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase
      .from("community_posts")
      .select("id, title, content, category, pinned, published_at, cover_image")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .then(({ data }) => setPosts((data ?? []) as Post[]));
  }, []);

  const filtered = useMemo(
    () => (tab === "all" ? posts : posts.filter((p) => p.category === tab)),
    [posts, tab],
  );
  useEffect(() => setPage(1), [tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MobileFrame>
      <TopBar />
      <header className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold">커뮤니티</h1>
      </header>

      <div className="px-4 pt-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="notice">공지</TabsTrigger>
            <TabsTrigger value="event">이벤트</TabsTrigger>
            <TabsTrigger value="tip">팁</TabsTrigger>
            <TabsTrigger value="update">업데이트</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 space-y-2 px-4 py-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
            게시글이 아직 없어요.
          </p>
        ) : (
          <>
            {pageItems.map((p) => {
              const cat = CATEGORY[p.category];
              const Icon = cat.Icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpened(p)}
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-accent/40"
                >
                  <div className="flex items-center gap-2">
                    {p.pinned && <Pin className="h-3.5 w-3.5 text-brand" />}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                        cat.color,
                      )}
                    >
                      <Icon className="h-3 w-3" /> {cat.label}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {p.published_at.slice(0, 10)}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-[14px] font-bold">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{p.content}</p>
                </button>
              );
            })}
            <Pager page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} />
          </>
        )}
      </main>

      {opened && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/50 backdrop-blur-sm"
          onClick={() => setOpened(null)}
        >
          <div
            className="max-h-[85%] w-full overflow-auto rounded-t-3xl bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                CATEGORY[opened.category].color,
              )}
            >
              {CATEGORY[opened.category].label}
            </span>
            <h2 className="mt-2 text-[18px] font-bold">{opened.title}</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">{opened.published_at.slice(0, 10)}</p>
            <p className="mt-4 whitespace-pre-wrap text-[13.5px] leading-relaxed">{opened.content}</p>
          </div>
        </div>
      )}

      <BottomTabs />
    </MobileFrame>
  );
}
