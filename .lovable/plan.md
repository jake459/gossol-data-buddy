

# 로그인/소셜로그인 네비게이션 수정 계획

## 진단

1. **"Invalid login credentials"는 정상 응답**입니다 — 임의 비밀번호이므로 Supabase가 400을 반환합니다. 다만 영어 메시지가 그대로 노출되고, 일부 사용자는 회원가입 시 **이메일 확인** 절차 때문에 실제 가입 후에도 같은 오류를 봅니다.
2. **소셜 로그인 후 화면 미이동**의 진짜 원인:
   - `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`는 OAuth 성공 시 **랜딩 페이지(`/`)** 로 돌아갑니다 → `/dashboard`로 가지 않음
   - 로그인 페이지의 `useEffect`가 **`supabase.auth.getSession()` 한 번만** 호출하므로, OAuth 콜백으로 세션이 갱신되어도 페이지가 반응하지 않음 (race condition)
   - 회원가입 페이지도 같은 문제
3. `signup.tsx`의 `emailRedirectTo`도 `/dashboard`로 되어 있지만, 이메일 확인이 켜져 있으면 가입 직후 세션 없이 안내 메일만 발송됩니다.

## 수정 사항

### A. 이메일 확인 비활성화 (즉시 로그인 가능)
`supabase/config.toml`에 auth 블록 추가:
```toml
[auth]
enable_signup = true
enable_confirmations = false
```
→ 회원가입 즉시 세션 발급, 다음 로그인도 정상 작동.

### B. 로그인/회원가입 네비게이션을 `useAuth` 기반으로 전환
- `useEffect`에서 `getSession()` 대신 **`useAuth()`의 `session`을 watch** → 세션이 생기는 즉시 `/dashboard`로 이동
- OAuth 인라인 성공(토큰 즉시 수신) · 비밀번호 로그인 · OAuth 콜백 후 복귀 모두 한 경로로 처리
- 로딩 중에는 폼 비활성화

```ts
const { session, loading } = useAuth();
useEffect(() => {
  if (!loading && session) navigate({ to: "/dashboard" });
}, [loading, session, navigate]);
```

### C. 소셜 OAuth 리다이렉트 URI 수정
`redirect_uri`를 `${window.location.origin}/dashboard`로 변경하여, 외부 리다이렉트가 발생하더라도 콜백 후 곧바로 인증된 라우트로 진입하게 합니다 (`_authenticated` 가드가 onboarding/대시보드로 자동 분기).

### D. 한국어 오류 메시지 매핑
헬퍼 함수로 Supabase 오류를 한국어로 변환:
- `Invalid login credentials` → "이메일 또는 비밀번호가 올바르지 않습니다."
- `Email not confirmed` → "이메일 인증을 완료해 주세요."
- `User already registered` → "이미 가입된 이메일입니다."
- 그 외 → 원본 메시지

`src/lib/auth-errors.ts`로 분리하여 login/signup에서 재사용.

### E. 회원가입 후 처리
`emailRedirectTo`는 유지하되, `enable_confirmations = false`이므로 즉시 세션이 생성됨 → useEffect가 `/dashboard`로 이동시킴. 별도 명시적 navigate 호출 제거.

## 변경 파일

- `supabase/config.toml` — auth 섹션 추가
- `src/lib/auth-errors.ts` — 신규, 오류 메시지 한글 매핑
- `src/routes/login.tsx` — useAuth 기반 navigation, redirect_uri 수정, 한글 오류
- `src/routes/signup.tsx` — useAuth 기반 navigation, 한글 오류

## 기대 동작

1. 잘못된 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다." 토스트 (페이지 유지, 정상)
2. 올바른 자격증명 → 토스트 후 `/dashboard`로 자동 이동 (지점 없으면 `/onboarding`)
3. 구글 로그인 클릭 → 구글 인증 → 자동으로 `/dashboard` 진입
4. 회원가입 → 즉시 로그인되어 `/onboarding`으로 진입

