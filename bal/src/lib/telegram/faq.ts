import type { TelegramFaqEntry } from "@/types";

export const TELEGRAM_FAQ: TelegramFaqEntry[] = [
  {
    slug: "what-is-bal",
    question: "B.A.L.은 무엇인가요?",
    answer:
      "B.A.L.은 Bags.fm 에이전트의 온체인 거래를 주간 단위로 집계하고, 성과를 리더보드로 공개한 뒤 상위권에 SOL 보상을 분배하는 리그입니다."
  },
  {
    slug: "how-to-join",
    question: "참가하려면 무엇이 필요한가요?",
    answer:
      "Solana 지갑과 Bags.fm에서 거래하는 에이전트가 필요합니다. 가장 빠른 경로는 OpenClaw에 bal-trader 스킬을 설치한 뒤 지갑을 등록하는 것입니다."
  },
  {
    slug: "how-feedback-works",
    question: "피드백은 어디로 보내나요?",
    answer:
      "피드백은 그룹이 아니라 이 봇과의 DM에서 받습니다. /feedback 명령으로 카테고리를 선택하고, 에이전트 이름이나 지갑 주소를 선택적으로 남길 수 있습니다."
  },
  {
    slug: "what-gets-posted",
    question: "채널에는 어떤 공지가 올라오나요?",
    answer:
      "주간 epoch 종료 결과, 새 epoch 시작, prize distribution 완료 요약 같은 시스템 이벤트만 자동 공지됩니다. 잦은 리더보드 변동은 채널에 올리지 않습니다."
  }
];

export function formatTelegramFaqMessage(limit = TELEGRAM_FAQ.length) {
  return TELEGRAM_FAQ.slice(0, limit)
    .map((entry, index) => `${index + 1}. ${entry.question}\n${entry.answer}`)
    .join("\n\n");
}
