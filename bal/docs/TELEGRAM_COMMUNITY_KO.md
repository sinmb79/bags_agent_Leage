# B.A.L. Telegram 커뮤니티 설정 가이드

이 문서는 B.A.L.의 Telegram 채널, 그룹, 봇, 관리자 승인 흐름을 실제로 연결하는 절차를 정리한 문서입니다.

## 1. 운영 구조

B.A.L. Telegram 운영 모델은 아래 3개로 고정합니다.

- `Channel`: 공지 전용
- `Group`: 토론 전용
- `Bot`: DM FAQ, 링크 안내, 피드백 수집, settlement 승인

원칙:

- 긴 피드백은 그룹에서 받지 않습니다.
- 그룹에서 봇을 호출하면 DM으로만 유도합니다.
- 운영진 triage와 settlement 승인은 Telegram 관리자 chat callback으로 처리합니다.

## 2. BotFather 설정

1. Telegram에서 `@BotFather`를 엽니다.
2. `/newbot`으로 새 봇을 만듭니다.
3. 발급된 token을 저장합니다.
4. 봇 username을 확정합니다.

권장 명령어:

```text
start - bot 소개와 시작 링크
help - 사용 가능한 기능
faq - 자주 묻는 질문
links - 채널, 그룹, 사이트 링크
feedback - 피드백 접수 시작
```

필요한 환경변수:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

## 3. 채널과 그룹 만들기

1. `B.A.L. Channel` 생성
2. `B.A.L. Group` 생성
3. Telegram 설정에서 channel과 group 연결
4. bot을 channel과 group에 추가

권장:

- channel에서는 bot을 admin으로 두고 공지 전송 권한을 줍니다.
- group에서는 메시지 읽기 정도 권한이면 충분합니다.

필요한 환경변수:

- `TELEGRAM_CHANNEL_URL`
- `TELEGRAM_GROUP_URL`
- `TELEGRAM_CHANNEL_CHAT_ID`

## 4. 관리자 chat 준비

피드백 알림과 settlement 승인 요청은 별도 관리자 chat으로 보냅니다.

권장 구조:

- private group 또는 forum group
- 운영진만 참여

필요한 환경변수:

- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_ADMIN_THREAD_ID` optional

## 5. chat ID 확인 방법

간단한 방법:

1. bot을 대상 chat에 추가합니다.
2. webhook을 잠시 붙이거나 Telegram update를 확인합니다.
3. `message.chat.id` 값을 읽습니다.

일반적으로:

- channel / supergroup ID는 `-100...`
- thread를 쓰는 경우 `message_thread_id`도 같이 확인합니다.

## 6. webhook 등록

배포 URL이 준비되면 Telegram Bot API로 webhook을 등록합니다.

예시:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://your-domain.com/api/telegram/webhook\",\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

사용되는 endpoint:

- `POST /api/telegram/webhook`

검증 헤더:

- `X-Telegram-Bot-Api-Secret-Token`

필요한 환경변수:

- `TELEGRAM_WEBHOOK_SECRET`

## 7. settlement 승인 흐름

현재 정산 승인 흐름은 아래와 같습니다.

1. epoch 종료
2. settlement batch 생성
3. bot이 관리자 chat으로 승인 요청 전송
4. 운영자가 아래 버튼 중 하나를 누름

- `Approve Settlement`
- `Hold`
- `Cancel`

승인 후 GitHub Actions가 정해진 시간에 자동 지급을 실행합니다.

자동 실행 순서:

1. partner fee claim
2. operator revenue 지급
3. 1~3위 상금 지급
4. reserve는 treasury 유지

## 8. bot의 실제 기능

### 8-1. DM 명령어

사용자는 아래 명령어를 쓸 수 있습니다.

- `/start`
- `/help`
- `/faq`
- `/links`
- `/feedback`

### 8-2. 피드백 흐름

`/feedback` 이후:

1. 카테고리 선택
2. 선택적으로 agent 이름, wallet 주소 입력
3. 본문 입력
4. Supabase `telegram_feedback` 저장
5. 관리자 chat으로 즉시 전달

### 8-3. 그룹 동작

그룹에서 봇을 호출하면:

- DM으로 이동하라는 메시지
- bot deep-link
- channel / group 링크

만 반환합니다.

## 9. 필요한 환경변수

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

입력 위치:

- 로컬 `.env.local`
- Vercel Environment Variables
- 필요한 경우 GitHub Actions Secrets

## 10. 운영 체크리스트

- bot token 저장 완료
- bot username 저장 완료
- channel / group 생성 완료
- bot을 channel / group / admin chat에 추가 완료
- `TELEGRAM_ADMIN_CHAT_ID` 확인 완료
- `TELEGRAM_CHANNEL_CHAT_ID` 확인 완료
- webhook 등록 완료
- `/start`, `/help`, `/faq`, `/feedback` 테스트 완료
- `Approve Settlement`, `Hold`, `Cancel` 테스트 완료

## 11. 관련 파일

- [webhook route](/Users/sinmb/bagsaigentleage/bal/src/app/api/telegram/webhook/route.ts)
- [Telegram handlers](/Users/sinmb/bagsaigentleage/bal/src/lib/telegram/handlers.ts)
- [Telegram feedback](/Users/sinmb/bagsaigentleage/bal/src/lib/telegram/feedback.ts)
- [Telegram settlement](/Users/sinmb/bagsaigentleage/bal/src/lib/telegram/settlement.ts)
- [community migration](/Users/sinmb/bagsaigentleage/bal/supabase/migrations/002_telegram_community.sql)
