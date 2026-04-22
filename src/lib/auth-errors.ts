// Maps Supabase auth error messages to Korean user-friendly text.
export function toKoreanAuthError(message?: string | null): string {
  if (!message) return "알 수 없는 오류가 발생했습니다.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed")) return "이메일 인증을 완료해 주세요.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "이미 가입된 이메일입니다.";
  if (m.includes("password should be at least"))
    return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("rate limit")) return "잠시 후 다시 시도해 주세요.";
  if (m.includes("network")) return "네트워크 연결을 확인해 주세요.";
  return message;
}
