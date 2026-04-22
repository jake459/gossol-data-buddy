import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { InfoModal } from "@/components/InfoModal";

type Provider = "kakao" | "naver" | "google";

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path
      fill="currentColor"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.85 5.31 4.65 6.74-.2.7-.73 2.55-.84 2.95-.13.5.18.49.39.36.16-.1 2.59-1.76 3.64-2.47.71.1 1.43.16 2.16.16 5.52 0 10-3.58 10-8s-4.48-8-10-8Z"
    />
  </svg>
);

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="currentColor" d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
  </svg>
);

export function SocialButtons({ redirectTo }: { redirectTo?: string }) {
  const onClick = async (provider: Provider) => {
    if (provider === "google") {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: (redirectTo ?? window.location.origin) as string,
      });
      if (result.error) {
        toast.error(result.error.message ?? "로그인에 실패했습니다.");
      }
      return;
    }
    toast.info(
      provider === "kakao" ? "카카오 로그인은 곧 지원됩니다." : "네이버 로그인은 곧 지원됩니다.",
      { description: "현재는 Google 또는 이메일로 로그인할 수 있어요." },
    );
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => onClick("kakao")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-kakao text-[15px] font-semibold text-kakao-foreground shadow-sm transition active:scale-[0.99]"
      >
        <KakaoIcon />
        카카오로 3초 만에 시작
      </button>
      <button
        type="button"
        onClick={() => onClick("naver")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-naver text-[15px] font-semibold text-naver-foreground shadow-sm transition active:scale-[0.99]"
      >
        <NaverIcon />
        네이버로 시작
      </button>
      <button
        type="button"
        onClick={() => onClick("google")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-foreground shadow-sm transition hover:bg-accent active:scale-[0.99]"
      >
        <GoogleIcon />
        Google로 시작
      </button>
    </div>
  );
}
