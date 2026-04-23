import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { InfoModal } from "@/components/InfoModal";

type Provider = "kakao" | "naver" | "google" | "apple";

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <path
      fill="#191919"
      d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.85 5.31 4.65 6.74-.2.7-.73 2.55-.84 2.95-.13.5.18.49.39.36.16-.1 2.59-1.76 3.64-2.47.71.1 1.43.16 2.16.16 5.52 0 10-3.58 10-8s-4.48-8-10-8Z"
    />
  </svg>
);

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#fff" d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
    <path
      fill="#fff"
      d="M16.365 12.79c-.024-2.43 1.985-3.595 2.075-3.652-1.131-1.654-2.892-1.88-3.515-1.906-1.495-.151-2.92.881-3.68.881-.762 0-1.93-.86-3.176-.836-1.633.024-3.14.95-3.98 2.412-1.7 2.945-.434 7.298 1.218 9.69.808 1.171 1.77 2.487 3.034 2.44 1.219-.05 1.679-.79 3.152-.79 1.473 0 1.886.79 3.176.766 1.31-.024 2.14-1.193 2.94-2.37.928-1.358 1.31-2.674 1.334-2.742-.029-.013-2.558-.982-2.583-3.893ZM13.97 5.71c.673-.815 1.126-1.948.999-3.071-.967.04-2.137.643-2.832 1.456-.622.722-1.166 1.876-1.018 2.984 1.078.083 2.178-.547 2.851-1.369Z"
    />
  </svg>
);

export function SocialButtons({ redirectTo }: { redirectTo?: string }) {
  const [comingSoon, setComingSoon] = useState<null | "kakao" | "naver" | "apple">(null);

  const onClick = async (provider: Provider) => {
    if (provider === "google") {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: (redirectTo ?? window.location.origin) as string,
      });
      if (result.error) toast.error(result.error.message ?? "로그인에 실패했습니다.");
      return;
    }
    setComingSoon(provider);
  };

  const base =
    "flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition active:scale-[0.96]";

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Google로 계속하기"
        onClick={() => onClick("google")}
        className={`${base} border border-border bg-card hover:bg-accent`}
      >
        <GoogleIcon />
      </button>
      <button
        type="button"
        aria-label="카카오로 계속하기"
        onClick={() => onClick("kakao")}
        className={`${base} bg-[#FEE500] hover:brightness-105`}
      >
        <KakaoIcon />
      </button>
      <button
        type="button"
        aria-label="네이버로 계속하기"
        onClick={() => onClick("naver")}
        className={`${base} bg-[#03C75A] hover:brightness-110`}
      >
        <NaverIcon />
      </button>
      <button
        type="button"
        aria-label="Apple로 계속하기"
        onClick={() => onClick("apple")}
        className={`${base} bg-black hover:bg-neutral-800`}
      >
        <AppleIcon />
      </button>

      <InfoModal
        open={comingSoon !== null}
        onOpenChange={(o) => !o && setComingSoon(null)}
        title={
          comingSoon === "kakao"
            ? "카카오 로그인 준비 중"
            : comingSoon === "naver"
              ? "네이버 로그인 준비 중"
              : "Apple 로그인 준비 중"
        }
        description="더 많은 소셜 로그인을 곧 지원할 예정이에요."
        icon={<Sparkles className="h-4 w-4" />}
        tone="warning"
        actionLabel="알겠어요"
      >
        <p>
          현재는 <b>Google</b> 또는 <b>이메일</b>로 가입할 수 있어요.
        </p>
      </InfoModal>
    </div>
  );
}
