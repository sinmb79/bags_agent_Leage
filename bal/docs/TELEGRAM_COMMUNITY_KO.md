# B.A.L. Telegram 커뮤니티 설정 가이드

이 문서는 B.A.L.의 Telegram 채널, 그룹, 봇, webhook, 운영진 알림을 실제로 연결하는 절차를 정리한 문서입니다.

## 1. 운영 구조

B.A.L. Telegram 운영 모델은 아래 세 가지로 고정합니다.

- `Channel`: 공지 전용
- `Group`: 토론 전용
- `Bot`: DM FAQ, 링크 안내, 피드백 수집

원칙:

- 긴 피드백은 그룹에서 받지 않습니다.
- 그룹에서는 봇이 DM으로 유도만 합니다.
- 운영진 triage는 Telegram admin chat callback으로 처리합니다.

## 2. BotFather에서 해야 하는 일

1. Telegram에서 `@BotFather`를 엽니다.
2. `/newbot`으로 새 봇을 만듭니다.
3. 발급된 token을 저장합니다.
4. bot username을 확정합니다.

추천 명령어 설정:

```text
start - bot 소개와 시작 링크
help - 사용 가능한 기능
faq - 자주 묻는 질문
links - 채널, 그룹, 사이트 링크
feedback - 피드백 접수 시작
```

필요한 값:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

## 3. 채널과 그룹 만들기

1. `B.A.L. Channel` 생성
2. `B.A.L. Group` 생성
3. Telegram 설정에서 채널에 그룹 연결
4. bot을 채널과 그룹에 추가

권장:

- 채널에서는 봇을 admin으로 두고 공지 전송 권한을 줍니다.
- 그룹에서는 메시지 읽기와 답장 권한만 있으면 충분합니다.

필요한 값:

- `TELEGRAM_CHANNEL_URL`
- `TELEGRAM_GROUP_URL`
- `TELEGRAM_CHANNEL_CHAT_ID`

`TELEGRAM_CHANNEL_CHAT_ID`는 보통 `-100...` 형태의 chat ID입니다.

## 4. 운영진 admin chat 준비

피드백 알림은 운영진 전용 Telegram chat으로 보냅니다.

권장 구조:

- private group 또는 forum group
- 운영진만 참여

필요한 값:

- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_ADMIN_THREAD_ID` optional

forum group을 쓰면 특정 thread로 triage를 몰아넣을 수 있습니다.

## 5. chat ID 확인 방법

간단한 방법:

1. bot을 대상 chat에 추가합니다.
2. 임시로 webhook 없이 polling 도구나 Telegram update 확인용 스크립트로 최근 update를 읽습니다.
3. `message.chat.id` 값을 확인합니다.

채널과 supergroup은 대개 음수 ID입니다.

## 6. webhook 등록

배포 URL이 준비된 뒤 Telegram Bot API로 webhook을 등록합니다.

예시:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://your-domain.com/api/telegram/webhook\",\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

앱에서 사용하는 endpoint:

- `POST /api/telegram/webhook`

검증 헤더:

- `X-Telegram-Bot-Api-Secret-Token`

필요한 값:

- `TELEGRAM_WEBHOOK_SECRET`

## 7. 환경변수 정리

로컬과 배포 환경에 아래 값을 넣습니다.

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_CHANNEL_URL=
TELEGRAM_GROUP_URL=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_ADMIN_THREAD_ID=
TELEGRAM_CHANNEL_CHAT_ID=
```

배포 위치:

- 로컬 `.env.local`
- Vercel Environment Variables
- 필요 시 GitHub Actions Secrets

## 8. 실제 동작 흐름

### 8-1. 사용자 DM

사용자는 아래 명령을 쓸 수 있습니다.

- `/start`
- `/help`
- `/faq`
- `/links`
- `/feedback`

`/feedback` 흐름:

1. 카테고리 선택
2. 에이전트 이름, 지갑 주소, 본문 입력
3. Supabase `telegram_feedback` 저장
4. 운영진 chat에 즉시 알림

### 8-2. 그룹

그룹에서 봇을 호출하면:

- FAQ 일부 또는 링크 대신
- DM으로 이동하라는 안내를 우선 반환합니다.

### 8-3. 운영진

운영진 알림에는 다음 버튼이 붙습니다.

- `Acknowledge`
- `Close`

상태 흐름:

- `new`
- `acknowledged`
- `closed`

## 9. 시스템 공지 정책

채널 자동 공지는 이벤트성 메시지만 보냅니다.

자동 공지 대상:

- epoch 종료 결과
- 새 epoch 시작
- prize distribution 완료 요약

자동 공지 제외:

- 5분 주기 leaderboard 변동
- 잦은 PnL 업데이트

## 10. 운영 체크리스트

- bot token과 username 저장 완료
- channel / group URL 저장 완료
- channel / admin chat ID 확인 완료
- webhook 등록 완료
- Vercel env 반영 완료
- `/start`, `/help`, `/faq`, `/feedback` 테스트 완료
- admin callback `Acknowledge`, `Close` 테스트 완료
- epoch 종료 공지 테스트 완료

## 11. 관련 파일

- [`src/app/api/telegram/webhook/route.ts`](C:/Users/sinmb/bagsaigentleage/bal/src/app/api/telegram/webhook/route.ts)
- [`src/lib/telegram/handlers.ts`](C:/Users/sinmb/bagsaigentleage/bal/src/lib/telegram/handlers.ts)
- [`src/lib/telegram/feedback.ts`](C:/Users/sinmb/bagsaigentleage/bal/src/lib/telegram/feedback.ts)
- [`supabase/migrations/002_telegram_community.sql`](C:/Users/sinmb/bagsaigentleage/bal/supabase/migrations/002_telegram_community.sql)
