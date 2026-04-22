import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export type LegalKind = "terms" | "privacy";

const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "제1조 (목적)",
    body:
      "본 약관은 Gossol Inc.(이하 '회사')가 제공하는 고시원 운영 관리 서비스 'Gossol'(이하 '서비스')의 이용 조건과 절차, 회원과 회사의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.",
  },
  {
    title: "제2조 (용어의 정의)",
    body:
      "‘회원’이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다. ‘지점’이란 회원이 운영·관리하는 단위 사업장을 의미하며, ‘입실자’란 지점에 거주 또는 거주 예정인 사용자를 말합니다.",
  },
  {
    title: "제3조 (서비스의 제공)",
    body:
      "회사는 호실·입실자·청구·일정·신청 관리, 통계 리포트, 알림 발송, 커뮤니티 게시 등 운영에 필요한 기능을 제공합니다. 일부 기능은 유료 플랜으로 제공될 수 있으며, 사전 고지 후 변경될 수 있습니다.",
  },
  {
    title: "제4조 (회원가입 및 계정관리)",
    body:
      "회원가입은 이메일 또는 소셜 계정을 통해 신청할 수 있으며, 회사가 정한 절차에 따라 가입이 완료됩니다. 회원은 본인의 계정 정보를 안전하게 관리할 책임이 있으며, 제3자에게 양도·대여할 수 없습니다.",
  },
  {
    title: "제5조 (서비스 이용의 제한)",
    body:
      "회원이 본 약관 또는 관련 법령을 위반한 경우, 회사는 사전 통지 없이 서비스 이용을 제한하거나 계약을 해지할 수 있습니다. 부정 결제, 타인 정보 도용, 서비스 운영 방해 행위 등이 이에 해당합니다.",
  },
  {
    title: "제6조 (책임의 제한)",
    body:
      "회사는 천재지변, 통신장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다. 회원이 입력한 데이터의 정확성·합법성에 대한 책임은 회원 본인에게 있습니다.",
  },
  {
    title: "제7조 (분쟁의 해결)",
    body:
      "본 약관과 관련한 분쟁은 대한민국 법령에 따라 해결하며, 관할 법원은 회사 본점 소재지를 관할하는 법원으로 합니다.",
  },
];

const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. 수집하는 개인정보 항목",
    body:
      "필수: 이메일, 비밀번호(암호화 저장), 휴대폰 번호, 사업자명. 선택: 프로필 이미지, 사업자등록번호, 정산 계좌. 자동 수집: 접속 IP, 쿠키, 서비스 이용 기록.",
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    body:
      "회원 식별 및 본인 확인, 서비스 제공·운영·개선, 청구서 발송 및 정산, 고객 지원, 부정 이용 방지, 법령 준수 및 분쟁 해결을 위해 사용합니다.",
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    body:
      "회원 탈퇴 시 즉시 파기를 원칙으로 하며, 관련 법령(전자상거래법·국세기본법 등)에 따라 보존이 필요한 경우 해당 기간 동안 분리 보관합니다.",
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body:
      "회사는 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 의해 요구되거나 수사기관의 적법한 요청이 있는 경우 예외로 합니다.",
  },
  {
    title: "5. 개인정보 처리의 위탁",
    body:
      "안정적인 서비스 운영을 위해 클라우드 인프라(AWS·Supabase 등) 및 알림 발송(이메일·카카오 알림톡) 업체에 일부 처리를 위탁하며, 위탁 계약을 통해 안전하게 관리됩니다.",
  },
  {
    title: "6. 정보주체의 권리",
    body:
      "회원은 언제든지 본인의 개인정보 열람·수정·삭제·처리정지를 요청할 수 있으며, 회사는 지체 없이 조치합니다. 요청은 앱 내 ‘설정 > 개인정보’ 또는 고객센터를 통해 가능합니다.",
  },
  {
    title: "7. 개인정보 보호책임자",
    body:
      "성명: 개인정보보호책임자 / 이메일: privacy@gossol.kr / 전화: 1588-0000. 개인정보 관련 문의·신고는 위 연락처로 접수해 주세요.",
  },
];

export function LegalModal({
  kind,
  open,
  onOpenChange,
}: {
  kind: LegalKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isTerms = kind === "terms";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const title = isTerms ? "이용약관" : "개인정보처리방침";
  const subtitle = isTerms
    ? "Gossol 서비스 이용에 관한 약관입니다."
    : "회원의 개인정보를 어떻게 수집·이용·보호하는지 설명합니다.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-1 border-b bg-gradient-to-br from-[oklch(0.97_0.03_258)] to-white px-6 py-5 text-left">
          <DialogTitle className="text-lg font-bold text-[oklch(0.32_0.16_263)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            {subtitle} · 최종 개정일 2026.04.01
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6 py-5">
          <div className="space-y-5 pb-2">
            {sections.map((s) => (
              <section key={s.title}>
                <h3 className="mb-1 text-[13px] font-bold text-foreground">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
              </section>
            ))}
            <p className="pt-2 text-[11px] text-muted-foreground/80">
              본 문서는 프로토타입용 예시이며, 실제 서비스 운영 시 법무 검토 후 최종본이 게시됩니다.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
