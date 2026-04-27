
## 개요

Claude(클루드)에서 작업하신 18개 화면 시안(`gossol-01` ~ `gossol-19`)을 분석한 결과:
- **JSX + 인라인 스타일** 기반 순수 UI 시안 (Supabase 연동 없음, 목 데이터 사용)
- 공통 디자인 토큰: `oklch` 색상(brand=cobalt 톤), Pretendard 폰트, 라운드 위계(card 8px / input 10px / button 12px / pill 9999px)
- 기존 프로젝트의 모든 라우트가 이미 존재 → **UI만 시안대로 교체**, 기존 Supabase 데이터/라우팅/인증은 그대로 유지

## 적용 전략

**디자인 토큰을 Tailwind/CSS로 변환**하여 시안의 인라인 스타일을 프로젝트의 shadcn/ui + Tailwind 체계로 옮깁니다 (인라인 스타일을 그대로 가져오면 유지보수가 어렵고 다크모드/일관성이 깨집니다).

### 1단계 — 디자인 시스템 정착
- `src/styles.css`에 시안의 컬러 팔레트(`--brand`, `--success`, `--danger`, `--surface`, `--border`)를 oklch 토큰으로 추가
- 라운드 위계 유틸 클래스(`rounded-card`, `rounded-input`, `rounded-button`, `rounded-pill`) 정의
- Pretendard 폰트 import (이미 system 스택에 있는지 확인 후 필요 시 `<link>` 추가)
- 공통 컴포넌트(`MobileFrame`, `TopBar`, `BottomTabs`, `PageHeader`, `StatusBadge`, `EmptyState`)를 시안 톤에 맞춰 리팩터

### 2단계 — 인증/온보딩 (3개)
| 시안 | 라우트 |
|---|---|
| `01-login-v3` | `src/routes/login.tsx` (자동 로그인 체크박스 유지) |
| `02-signup-v2` | `src/routes/signup.tsx` |
| `03-reset-password-v2` | `src/routes/reset-password.tsx` |
| `04-onboarding-v2` | `src/routes/_authenticated.onboarding.tsx` |

### 3단계 — 메인 화면 (4개)
| 시안 | 라우트 |
|---|---|
| `05-dashboard-v2` | `_authenticated.dashboard.tsx` (가동률 Hero, 미납자 연체일수, 입·퇴실 D-day, 무한 스크롤) |
| `06-rooms-v2` | `_authenticated.rooms.tsx` (호실 그리드 + 디테일 모달) |
| `07-tenants-list-v2` | `_authenticated.tenants.tsx` |
| `13-invoices-v2` | `_authenticated.invoices.tsx` |

### 4단계 — 입실자/지원서 상세 (5개)
| 시안 | 라우트 |
|---|---|
| `08-tenant-detail-v2` | `_authenticated.tenants.$tenantId.tsx` |
| `09-tenant-edit-v2` | `_authenticated.tenants.$tenantId.edit.tsx` (이미 v1 존재 → 시안에 맞춰 정리) |
| `10-tenant-new-v2` | `_authenticated.tenants.new.tsx` |
| `11-applications-v2` | `_authenticated.applications.tsx` |
| `12-application-detail-v2` | `_authenticated.applications.$applicationId.tsx` |

### 5단계 — 운영 화면 (5개)
| 시안 | 라우트 |
|---|---|
| `14-schedule-v2` | `_authenticated.schedule.tsx` |
| `15-cleanings-v2` | `_authenticated.cleanings.tsx` |
| `16-inspections-v2` | `_authenticated.inspections.tsx` |
| `17-community-v2` | `_authenticated.community.tsx` |
| `19-room-types-v2` | `_authenticated.room-types.tsx` |

## 데이터 연동 원칙

- **시안의 목 데이터는 무시**, 기존 라우트의 Supabase 쿼리(useEffect/select 패턴)는 그대로 유지
- 시안에서 새로 보이는 파생 값(가동률, 연체일수, D-day 등)은 기존 데이터에서 클라이언트에서 계산
- 시안에 있지만 DB에 없는 필드(생년월일, 성별, 환불계좌 등)는 현재 v1 입실자 수정 페이지의 `__GS_EXTRA__` JSON 패턴을 유지
- 페이지네이션/정렬/필터링 같은 기존 동작(예: 알림 4개씩, 수익 6명씩)은 보존

## 진행 방식

작업량이 매우 크기 때문에(18개 화면, 평균 600줄/파일):
1. **디자인 토큰 + 공통 컴포넌트** 먼저 (1메시지)
2. **인증/온보딩 4화면** 묶음 (1메시지)  
3. **대시보드/호실/입실자 목록/청구서** 4화면 (2메시지로 분할)
4. **입실자/지원서 상세 5화면** (2메시지)
5. **운영 5화면** (2메시지)

각 단계 후 빌드/프리뷰로 시각적 확인을 권장드립니다. 한 번의 응답으로 모든 화면을 다 바꾸면 빌드 오류 발생 시 원인 추적이 어렵기 때문입니다.

## 변경하지 않는 것
- DB 스키마, RLS 정책 (스키마 변경 불필요)
- 라우팅/인증 가드 (`_authenticated.tsx`)
- Supabase 클라이언트, useAuth/useBranch 훅
- `src/components/ui/*` (shadcn 원본)
- `src/integrations/supabase/*` (자동 생성)
