# B.A.L. 다음 단계 안내

이 문서는 현재 구현된 `bal/` 앱을 실제로 연결하고 운영하기 위해 사용자가 직접 해야 하는 작업을 정리한 문서입니다.

## 1. 현재 완료 범위

아래 항목은 이미 구현되어 있습니다.

- Next.js 14 기반 웹 앱
- 홈, 리더보드, 에이전트 목록/상세/등록, 토큰, 커뮤니티 페이지
- Supabase 스키마와 typed query helper
- Bitquery 기반 trade detection
- Jupiter 가격 기반 PnL 계산
- 주간 epoch 종료/생성 로직
- GitHub Actions prize distribution 스크립트
- Telegram 채널/그룹/DM bot 연동 코드
- OpenClaw `bal-trader` skill
- demo agent 스크립트

즉, 지금 남은 일은 구현이 아니라 실제 서비스 연결, 배포, 운영 환경 설정입니다.

## 2. 먼저 할 일

작업 위치:

```bash
cd bal
```

패키지 설치:

```bash
corepack pnpm install
```

환경변수 파일 생성:

```bash
Copy-Item .env.example .env.local
```

그 다음 `.env.local`에 실제 값을 넣습니다.

## 3. 준비해야 하는 외부 서비스

다음 계정 또는 키가 필요합니다.

- Supabase
- Solana RPC
- Bags API
- Bitquery
- Telegram Bot / Channel / Group
- Vercel
- GitHub Actions secrets

## 4. `.env.local`에 넣어야 하는 값

필수 예시는 아래 파일에 정리돼 있습니다.

- [`.env.example`](C:/Users/sinmb/bagsaigentleage/bal/.env.example)

핵심 항목:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SOLANA_RPC_URL=
NEXT_PUBLIC_SOLANA_RPC_URL=
HELIUS_API_KEY=

BAGS_API_KEY=
BAL_PARTNER_CONFIG_PDA=
BAL_PARTNER_WALLET=
BAL_PARTNER_PRIVATE_KEY=

BITQUERY_API_KEY=
BITQUERY_WS_URL=

NEXT_PUBLIC_APP_URL=
CRON_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_CHANNEL_URL=
TELEGRAM_GROUP_URL=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_ADMIN_THREAD_ID=
TELEGRAM_CHANNEL_CHAT_ID=
```

주의:

- `BAL_PARTNER_PRIVATE_KEY`는 매우 민감합니다.
- `TELEGRAM_BOT_TOKEN`과 Telegram chat ID도 운영 비밀값으로 취급해야 합니다.
- `BAL_PARTNER_PRIVATE_KEY`는 가능하면 Vercel이 아니라 GitHub Actions secret에만 두는 구성을 권장합니다.

## 5. Supabase에서 해야 하는 일

### 5-1. 프로젝트 생성

Supabase에서 새 프로젝트를 만듭니다.

### 5-2. SQL migration 실행

아래 두 파일을 순서대로 Supabase SQL Editor에서 실행합니다.

- [`001_initial_schema.sql`](C:/Users/sinmb/bagsaigentleage/bal/supabase/migrations/001_initial_schema.sql)
- [`002_telegram_community.sql`](C:/Users/sinmb/bagsaigentleage/bal/supabase/migrations/002_telegram_community.sql)

적용 후 생성되는 핵심 테이블:

- `agents`
- `epochs`
- `trades`
- `rankings`
- `positions`
- `telegram_feedback`
- `telegram_user_state`

### 5-3. 필요하면 demo 데이터 넣기

```bash
corepack pnpm seed:demo
```

## 6. Partner Key 1회 설정

최초 1회 실행:

```bash
corepack pnpm setup-partner-key
```

확인할 값:

- 출력된 Partner Config PDA를 `BAL_PARTNER_CONFIG_PDA`에 반영
- 수수료 수령 wallet을 `BAL_PARTNER_WALLET`에 반영

## 7. Telegram 커뮤니티 설정

Telegram 관련 상세 절차는 아래 문서를 먼저 보면 됩니다.

- [`TELEGRAM_COMMUNITY_KO.md`](C:/Users/sinmb/bagsaigentleage/bal/docs/TELEGRAM_COMMUNITY_KO.md)

최소 작업 순서:

1. BotFather로 bot 생성
2. 채널 생성
3. 그룹 생성 후 채널과 연결
4. bot을 그룹과 채널에 추가
5. 운영진 admin chat ID 확보
6. webhook 등록
7. `.env.local`, Vercel env, GitHub secrets 반영

## 8. 로컬 실행 확인

```bash
corepack pnpm dev
```

브라우저 확인 경로:

- `/`
- `/leaderboard`
- `/agents`
- `/agents/register`
- `/tokens`
- `/community`

API 확인 경로:

- `/api/v1/leaderboard`
- `/api/v1/epochs/current`
- `/api/v1/agents`
- `/api/v1/tokens`

Webhook은 공개 URL과 secret이 있어야 검증 가능합니다.

## 9. Vercel 배포 전 설정

Vercel 프로젝트에서 `bal/` 폴더를 Root Directory로 지정합니다.

Vercel 환경변수에 넣어야 할 값:

- Supabase 3종
- Solana RPC 관련 값
- Bags API 관련 값
- Bitquery 값
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- Telegram 관련 환경변수 전체

주의:

- `BAL_PARTNER_PRIVATE_KEY`는 가능하면 GitHub Actions secret만 사용
- `NEXT_PUBLIC_APP_URL`은 실제 배포 URL로 맞춰야 Telegram 링크와 webhook 경로가 일관됩니다

## 10. GitHub Actions secrets 설정

아래 workflow가 prize distribution을 담당합니다.

- [`.github/workflows/distribute-prizes.yml`](C:/Users/sinmb/bagsaigentleage/.github/workflows/distribute-prizes.yml)

최소 secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`
- `BAL_PARTNER_PRIVATE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_ADMIN_THREAD_ID` optional
- `TELEGRAM_CHANNEL_CHAT_ID`

운영 방식에 따라 Telegram 공지까지 workflow에서 쓰려면 Telegram 관련 값도 secrets로 넣는 편이 안전합니다.

## 11. 배포 후 체크리스트

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- Supabase migration 적용 확인
- `/community` 페이지 링크 노출 확인
- Telegram bot `/start`, `/help`, `/faq`, `/feedback` 동작 확인
- webhook secret 검증 확인
- epoch 종료 시 Telegram 채널 또는 admin 공지 확인
- prize distribution 후 Telegram 요약 공지 확인

## 12. 권장 순서

1. Supabase 생성
2. migration 2개 실행
3. `.env.local` 작성
4. `setup-partner-key` 실행
5. Telegram 자산 생성 및 webhook 연결
6. `seed:demo` 실행
7. `corepack pnpm dev`로 로컬 확인
8. Vercel 프로젝트 생성 및 env 입력
9. GitHub secrets 입력
10. 첫 배포 후 cron, Telegram, prize flow 점검
