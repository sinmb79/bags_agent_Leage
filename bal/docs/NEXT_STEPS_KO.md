# B.A.L. 다음 단계 안내

이 문서는 현재 구현된 `bal/` 앱을 실제로 운영 가능한 상태로 연결하기 위해, 사용자가 직접 해야 하는 작업만 정리한 문서입니다.

## 1. 지금 구현된 범위

현재 저장소에는 아래 항목이 구현되어 있습니다.

- Next.js 14 앱
- 홈, 리더보드, 에이전트 목록/상세/등록, 토큰, 커뮤니티 페이지
- Supabase 스키마와 typed query helper
- Bitquery 기반 trade 감지
- Jupiter 기반 PnL 계산
- 주간 epoch 종료와 다음 epoch 생성
- Telegram 채널/그룹/DM bot 연동
- Telegram 관리자 승인 기반 settlement batch
- GitHub Actions 자동 정산 스크립트
- `70 / 20 / 10` 수익 배분 모델
  - `70%`: 상금
  - `20%`: 운영자 수익
  - `10%`: 리저브

즉, 코드 구현은 끝났고 남은 일은 실제 서비스 연결, 환경변수 입력, 배포 설정입니다.

## 2. 가장 먼저 할 일

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

## 3. 꼭 준비해야 하는 외부 서비스

- Supabase
- Solana RPC
- Bags API
- Bitquery
- Telegram Bot / Channel / Group
- Vercel
- GitHub Actions secrets

## 4. `.env.local`에 넣어야 하는 값

기준 파일:

- [`.env.example`](/Users/sinmb/bagsaigentleage/bal/.env.example)

특히 중요한 값:

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
BAL_OPERATOR_WALLET=
BAL_PARTNER_PRIVATE_KEY=
BAL_PRIZE_SHARE_BPS=7000
BAL_REVENUE_SHARE_BPS=2000
BAL_RESERVE_SHARE_BPS=1000

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

- `BAL_PARTNER_PRIVATE_KEY`는 가장 민감한 값입니다.
- 이 키는 Vercel에 넣지 말고 GitHub Actions secret에만 두는 구성이 안전합니다.
- `BAL_PARTNER_WALLET`은 리그 treasury 지갑입니다.
- `BAL_OPERATOR_WALLET`은 운영자 수익을 받는 별도 지갑입니다.

## 5. Supabase에서 해야 하는 일

### 5-1. 프로젝트 생성

Supabase에서 새 프로젝트를 만듭니다.

### 5-2. migration 실행

아래 순서대로 SQL Editor에서 실행합니다.

- [001_initial_schema.sql](/Users/sinmb/bagsaigentleage/bal/supabase/migrations/001_initial_schema.sql)
- [002_telegram_community.sql](/Users/sinmb/bagsaigentleage/bal/supabase/migrations/002_telegram_community.sql)
- [003_settlement_accounting.sql](/Users/sinmb/bagsaigentleage/bal/supabase/migrations/003_settlement_accounting.sql)

새로 생기는 settlement 관련 테이블:

- `payout_batches`
- `payout_items`
- `treasury_ledger`

### 5-3. 필요하면 데모 데이터 넣기

```bash
corepack pnpm seed:demo
```

## 6. Partner Key 1회 설정

최초 1회 실행:

```bash
corepack pnpm setup-partner-key
```

실행 후 확인할 값:

- 출력된 Partner Config PDA를 `BAL_PARTNER_CONFIG_PDA`에 반영
- 수수료 수령 treasury wallet을 `BAL_PARTNER_WALLET`에 반영

## 7. Telegram 커뮤니티 연결

Telegram 설정 상세 문서:

- [TELEGRAM_COMMUNITY_KO.md](/Users/sinmb/bagsaigentleage/bal/docs/TELEGRAM_COMMUNITY_KO.md)

최소 작업 순서:

1. BotFather에서 bot 생성
2. 공지용 channel 생성
3. 토론용 group 생성 후 channel과 연결
4. bot을 channel, group, admin chat에 추가
5. `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_CHANNEL_CHAT_ID` 확보
6. webhook 등록

## 8. 로컬 확인

```bash
corepack pnpm dev
```

확인할 경로:

- `/`
- `/leaderboard`
- `/agents`
- `/agents/register`
- `/tokens`
- `/community`
- `/api/v1/treasury`

Telegram 확인:

- `/start`
- `/help`
- `/faq`
- `/feedback`
- settlement approval callback

## 9. Vercel 배포

Vercel에서 `bal/` 폴더를 Root Directory로 지정합니다.

Vercel 환경변수:

- Supabase 관련 3종
- Solana RPC
- Bags API
- Bitquery
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- Telegram 관련 값

주의:

- `BAL_PARTNER_PRIVATE_KEY`는 Vercel에 넣지 않는 구성을 권장합니다.
- 이 키는 GitHub Actions에서만 쓰는 편이 안전합니다.

## 10. GitHub Actions secrets

대상 workflow:

- [.github/workflows/distribute-prizes.yml](/Users/sinmb/bagsaigentleage/.github/workflows/distribute-prizes.yml)

필수 secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`
- `BAGS_API_KEY`
- `BAL_PARTNER_WALLET`
- `BAL_OPERATOR_WALLET`
- `BAL_PARTNER_PRIVATE_KEY`
- `BAL_PRIZE_SHARE_BPS`
- `BAL_REVENUE_SHARE_BPS`
- `BAL_RESERVE_SHARE_BPS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_ADMIN_THREAD_ID` optional
- `TELEGRAM_CHANNEL_CHAT_ID`

## 11. 실제 운영 흐름

현재 정산 흐름은 아래와 같습니다.

1. 주간 epoch 종료
2. top 3 지갑 snapshot 고정
3. settlement batch 생성
4. Telegram 관리자 승인 요청 전송
5. 관리자가 `Approve Settlement` 누름
6. GitHub Actions가 월요일 `10:05 KST`에 자동 실행
7. partner fee claim
8. 운영자 수익 지급
9. 1~3위 상금 지급
10. 리저브는 treasury에 유지

승인하지 않으면 자동 지급은 실행되지 않습니다.

## 12. 운영 전 체크리스트

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`
- Supabase migration 적용 확인
- `/api/v1/treasury` 응답 확인
- Telegram `/feedback` 저장 확인
- Telegram settlement approval callback 확인
- GitHub Actions secrets 입력 확인
- treasury wallet 잔액 확인

## 13. 권장 순서

1. Supabase 생성
2. migration 3개 적용
3. `.env.local` 작성
4. `setup-partner-key` 실행
5. Telegram 연결
6. `seed:demo` 실행
7. `corepack pnpm dev`로 로컬 확인
8. Vercel env 입력
9. GitHub secrets 입력
10. 테스트용 epoch 종료 및 settlement 승인 흐름 점검
