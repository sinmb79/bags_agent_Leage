export type EpochStatus = "active" | "calculating" | "completed";
export type TradeAction = "buy" | "sell";
export type TelegramFeedbackSource = "bot_dm" | "group_redirect";
export type TelegramFeedbackCategory = "bug" | "idea" | "question" | "report" | "other";
export type TelegramFeedbackStatus = "new" | "acknowledged" | "closed";
export type TelegramBotState = "idle" | "awaiting_category" | "awaiting_message";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EpochSummary {
  id: string;
  epochNumber: number;
  weekStart: string;
  weekEnd: string;
  totalFeesSol: number;
  operatingCostsSol: number;
  prizePoolSol: number;
  status: EpochStatus;
}

export interface RankingMetrics {
  pnlSol: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradeEfficiency: number;
  compositeScore: number;
  estimatedPrizeSol: number;
}

export interface LeaderboardEntry extends RankingMetrics {
  rank: number;
  agentId: string;
  agentName: string;
  avatarLabel: string;
  walletAddress: string;
  trades: number;
  winRate: number;
  trend: number[];
}

export interface AgentSummary {
  id: string;
  name: string;
  avatarLabel: string;
  walletAddress: string;
  registeredAt: string;
  totalTrades: number;
  totalPnlSol: number;
  winRate: number;
  bestEpochRank: number | null;
}

export interface AgentTradeView {
  id: string;
  epochId: string;
  tokenMint: string;
  tokenSymbol: string;
  action: TradeAction;
  amountSol: number;
  tokenAmount: number;
  pricePerToken: number;
  txSignature: string;
  tradedAt: string;
  pnlContributionSol: number;
}

export interface AgentEpochHistory {
  epochId: string;
  epochNumber: number;
  rank: number;
  pnlSol: number;
  prizeSol: number;
}

export interface PnlPoint {
  date: string;
  pnlSol: number;
}

export interface AgentProfile extends AgentSummary {
  bestEpochRank: number | null;
  epochHistory: AgentEpochHistory[];
  pnlHistory: PnlPoint[];
  tradeHistory: AgentTradeView[];
}

export interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  bagsUrl: string;
}

export interface PositionSnapshot {
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  unrealizedPnlSol: number;
}

export interface TelegramFeedback {
  id: string;
  telegramUserId: string;
  telegramUsername: string | null;
  telegramChatId: string;
  source: TelegramFeedbackSource;
  category: TelegramFeedbackCategory;
  message: string;
  agentName: string | null;
  walletAddress: string | null;
  linkedAgentId: string | null;
  status: TelegramFeedbackStatus;
  adminMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramFaqEntry {
  slug: string;
  question: string;
  answer: string;
}
