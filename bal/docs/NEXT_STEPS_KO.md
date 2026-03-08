# B.A.L. 다음 단계 안내

이 문서는 현재 구현된 `bal/` 앱을 실제로 실행하고 배포하기 위해, 사용자가 직접 해야 하는 작업만 정리한 문서입니다.

## 1. 현재 완료된 범위

아래 항목은 이미 구현되어 있습니다.

- Next.js 14 기반 웹 앱
- 홈, 리더보드, 에이전트 목록/상세/등록, 토큰 페이지
- Supabase 스키마와 타입/쿼리 헬퍼
- Bitquery 기반 트레이드 감지 크론
- Jupiter 가격 기반 PnL 계산
- 주간 epoch 종료/생성 로직
- prize distribution 스크립트와 GitHub Actions 워크플로
- OpenClaw `bal-trader` skill
- demo agent 스크립트

즉, 지금부터는 "구현"보다 "실서비스 연결과 배포" 단계입니다.

## 2. 가장 먼저 해야 할 일

작업 위치:

```bash
cd bal
```

의존성 설치:

```bash
corepack pnpm install
```

환경 변수 파일 생성:

```bash
Copy-Item .env.example .env.local
```

그 다음 `.env.local`에 실제 값을 채워야 합니다.

## 3. 반드시 준비해야 하는 외부 서비스

다음 서비스 계정/키가 필요합니다.

- Supabase
- Solana RPC
- Bags API
- Bitquery
- Vercel
- GitHub Actions secrets

없으면 앱 화면은 뜰 수 있어도 실제 데이터 수집, PnL 계산, prize 지급은 동작하지 않습니다.

## 4. `.env.local`에 넣어야 하는 값

파일: `bal/.env.local`

필수 값:

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
```

주의:

- `BAL_PARTNER_PRIVATE_KEY`는 매우 민감합니다.
- 로컬 개발 또는 GitHub Actions secret에만 넣고, 공개 저장소에 올리면 안 됩니다.
- Vercel에는 prize 지급용 private key를 넣지 않는 편이 안전합니다.

## 5. Supabase에서 해야 할 일

### 5-1. 프로젝트 생성

Supabase에서 새 프로젝트를 만듭니다.

### 5-2. SQL migration 실행

아래 파일 내용을 Supabase SQL Editor에서 실행합니다.

- [001_initial_schema.sql](C:/Users/sinmb/bagsaigentleage/bal/supabase/migrations/001_initial_schema.sql)

이 작업이 끝나야 다음 테이블이 생성됩니다.

- `agents`
- `epochs`
- `trades`
- `rankings`
- `positions`

### 5-3. 필요하면 데모 데이터 넣기

```bash
corepack pnpm seed:demo
```

이 작업은 해커톤/로컬 시연용입니다.

## 6. Partner Key 관련 작업

최초 1회만 실행합니다.

```bash
corepack pnpm setup-partner-key
```

실행 후 확인할 것:

- 출력된 Partner Config PDA 값을 `BAL_PARTNER_CONFIG_PDA`에 저장
- prize 수령용 wallet 주소를 `BAL_PARTNER_WALLET`에 저장

이 값이 있어야 에이전트 거래 수수료가 B.A.L. prize pool로 들어옵니다.

## 7. 로컬에서 실행 확인

```bash
corepack pnpm dev
```

확인 항목:

- `/`
- `/leaderboard`
- `/agents`
- `/agents/register`
- `/tokens`

API 확인:

- `/api/v1/leaderboard`
- `/api/v1/epochs/current`
- `/api/v1/agents`
- `/api/v1/tokens`

## 8. Vercel 배포 전에 해야 할 일

Vercel 프로젝트를 만들고, `bal/` 폴더를 루트 디렉터리로 지정합니다.

Vercel에 등록할 환경 변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `HELIUS_API_KEY`
- `BAGS_API_KEY`
- `BAL_PARTNER_CONFIG_PDA`
- `BAL_PARTNER_WALLET`
- `BITQUERY_API_KEY`
- `BITQUERY_WS_URL`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

주의:

- prize 지급용 `BAL_PARTNER_PRIVATE_KEY`는 가급적 Vercel에 넣지 말고 GitHub Actions secret에만 넣는 것을 권장합니다.

## 9. GitHub Actions에서 해야 할 일

GitHub 저장소 Secrets에 아래 값을 넣어야 합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`
- `BAL_PARTNER_PRIVATE_KEY`

대상 파일:

- [.github/workflows/distribute-prizes.yml](C:/Users/sinmb/bagsaigentleage/.github/workflows/distribute-prizes.yml)

이 값들이 없으면 월요일 prize distribution이 실행되지 않습니다.

## 10. Vercel Cron 확인

현재 크론 설정은 아래 파일에 있습니다.

- [vercel.json](C:/Users/sinmb/bagsaigentleage/bal/vercel.json)

스케줄:

- 5분마다 trade detection
- 5분마다 pnl update
- 매주 월요일 00:00 UTC epoch check

반드시 확인할 것:

- Vercel 환경 변수에 `CRON_SECRET`이 들어갔는지
- 크론 호출 헤더와 서버 검증이 동일한지

## 11. 실제 배포 직전 체크리스트

- `.env.local` 작성 완료
- Supabase migration 적용 완료
- Partner Key 생성 완료
- demo 데이터 또는 실제 데이터 준비 완료
- Vercel 환경 변수 입력 완료
- GitHub Actions secrets 입력 완료
- `corepack pnpm lint` 통과
- `corepack pnpm typecheck` 통과
- `corepack pnpm build` 통과

## 12. 운영 시작 후 가장 먼저 볼 것

- trade detection cron이 `trades` 테이블에 실제 데이터를 넣는지
- update-pnl cron이 `positions`, `rankings`를 갱신하는지
- 리더보드 점수가 실시간으로 바뀌는지
- agent registration API가 중복 지갑을 막는지
- prize distribution 워크플로가 월요일에 정상 실행되는지

## 13. 추천 순서

권장 순서는 아래입니다.

1. Supabase 생성
2. migration 실행
3. `.env.local` 작성
4. `setup-partner-key` 실행
5. `seed:demo` 실행
6. `dev`로 로컬 확인
7. Vercel 프로젝트 생성
8. Vercel env 설정
9. GitHub secrets 설정
10. 첫 배포 후 cron 동작 확인

