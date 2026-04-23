import { useState } from "react";
import { HeadphonesIcon, Mail, Phone, MessageCircle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { notifyValidation } from "@/components/ValidationModal";

/**
 * 고시원 원장님을 위한 고객센터 모달.
 * - 빠른 연결 채널(전화/이메일/카카오) 안내
 * - 1:1 문의 작성 → support_inquiries 테이블에 저장
 */
export function SupportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"home" | "inquiry">("home");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode("home");
    setSubject("");
    setMessage("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("로그인 후 이용해 주세요.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      notifyValidation("제목과 내용을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("support_inquiries").insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("문의 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    toast.success("문의가 접수되었어요. 영업일 기준 1일 내에 답변 드릴게요.");
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-1 border-b bg-gradient-to-br from-[oklch(0.97_0.03_258)] to-white px-6 py-5 text-left">
          <div className="flex items-center gap-2 text-[oklch(0.32_0.16_263)]">
            <HeadphonesIcon className="h-4 w-4" />
            <DialogTitle className="text-base font-bold">고객센터</DialogTitle>
          </div>
          <DialogDescription className="break-keep text-[12.5px] leading-relaxed text-muted-foreground">
            운영 중 궁금한 점이나 불편한 점을 빠르게 도와드릴게요.
          </DialogDescription>
        </DialogHeader>

        {mode === "home" ? (
          <div className="space-y-3 px-5 py-5">
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:1588-0000"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition hover:bg-accent/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.95_0.05_158)] text-[oklch(0.4_0.15_158)]">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="text-[11.5px] font-semibold">전화 상담</span>
                <span className="text-[10.5px] text-muted-foreground">1588-0000</span>
              </a>
              <a
                href="mailto:help@gossol.kr"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition hover:bg-accent/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.95_0.05_258)] text-[oklch(0.4_0.18_258)]">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="text-[11.5px] font-semibold">이메일</span>
                <span className="text-[10.5px] text-muted-foreground">help@gossol.kr</span>
              </a>
              <button
                type="button"
                onClick={() => toast.info("카카오 채널 연동을 준비 중이에요.")}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition hover:bg-accent/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.95_0.08_95)] text-[oklch(0.4_0.15_85)]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="text-[11.5px] font-semibold">카톡 상담</span>
                <span className="text-[10.5px] text-muted-foreground">평일 9–18시</span>
              </button>
            </div>

            <div className="break-keep rounded-xl border border-dashed border-border bg-muted/30 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
              <b className="text-foreground">운영시간</b> 평일 09:00–18:00
              <br />
              (점심 12:30–13:30) · 주말/공휴일 휴무
            </div>

            <Button
              type="button"
              onClick={() => setMode("inquiry")}
              className="h-11 w-full rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-sm font-semibold"
            >
              <Send className="h-4 w-4" /> 1:1 문의 남기기
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="sup-subject">제목</Label>
              <Input
                id="sup-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="예: 입실자 등록이 안 돼요"
                className="h-11 rounded-xl"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-message">내용</Label>
              <Textarea
                id="sup-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="겪고 계신 상황을 자세히 적어주세요. 지점/호실 번호를 함께 알려주시면 빠르게 도와드릴 수 있어요."
                className="min-h-[120px] rounded-xl"
                maxLength={1000}
              />
              <p className="text-right text-[10.5px] text-muted-foreground">{message.length}/1000</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("home")}
                className="h-11 flex-1 rounded-xl"
              >
                뒤로
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 flex-1 rounded-xl bg-gradient-to-b from-[oklch(0.46_0.18_258)] to-[oklch(0.36_0.16_262)] text-sm font-semibold"
              >
                {submitting ? "접수 중…" : "문의 보내기"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
