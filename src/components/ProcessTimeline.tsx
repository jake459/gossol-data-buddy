import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  /** 표시 라벨 (예: "호실 신청") */
  label: string;
  /** 보조 텍스트 (예: 날짜, 상태) */
  hint?: string;
  /** 단계 상태 */
  state: "done" | "current" | "pending";
};

export type TimelineTrack = {
  /** 트랙 이름 (예: "호실신청 상태") */
  name: string;
  /** 단계 라인 */
  steps: TimelineStep[];
  /** 트랙 색상 톤 */
  tone?: "owner" | "staff" | "tenant" | "invoice";
};

const TONE = {
  owner: { line: "bg-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700" },
  staff: { line: "bg-pink-200", dot: "bg-pink-500", text: "text-pink-700" },
  tenant: { line: "bg-sky-200", dot: "bg-sky-500", text: "text-sky-700" },
  invoice: { line: "bg-rose-200", dot: "bg-rose-500", text: "text-rose-700" },
} as const;

/**
 * 다이어그램의 트랙별 가로 타임라인 시각화.
 * 모바일 가로 스크롤 지원.
 */
export function ProcessTimeline({ tracks }: { tracks: TimelineTrack[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <div className="min-w-[640px] divide-y divide-border">
        {tracks.map((track) => {
          const tone = TONE[track.tone ?? "owner"];
          return (
            <div key={track.name} className="flex items-stretch gap-3 px-3 py-3">
              <div className="w-20 shrink-0 pt-2 text-[11px] font-semibold text-muted-foreground">
                {track.name}
              </div>
              <div className="relative flex-1">
                <div className={cn("absolute left-3 right-3 top-3 h-px", tone.line)} />
                <div className="relative flex items-start justify-between gap-1">
                  {track.steps.map((step, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "z-10 grid h-6 w-6 place-items-center rounded-full ring-2 ring-card",
                          step.state === "done"
                            ? cn(tone.dot, "text-white")
                            : step.state === "current"
                              ? cn("bg-white border-2", tone.text.replace("text-", "border-"))
                              : "bg-muted",
                        )}
                      >
                        {step.state === "done" ? (
                          <Check className="h-3 w-3" />
                        ) : step.state === "current" ? (
                          <Circle className={cn("h-2 w-2 fill-current", tone.text)} />
                        ) : null}
                      </div>
                      <div className="text-center">
                        <div
                          className={cn(
                            "text-[10.5px] font-semibold leading-tight",
                            step.state === "pending" ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {step.label}
                        </div>
                        {step.hint && (
                          <div className="mt-0.5 text-[9.5px] text-muted-foreground">{step.hint}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2 text-[10.5px] text-muted-foreground">
        <Legend color="bg-emerald-500" label="점주" />
        <Legend color="bg-pink-500" label="스탭" />
        <Legend color="bg-sky-500" label="입실자" />
        <Legend color="bg-rose-500" label="청구서" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
