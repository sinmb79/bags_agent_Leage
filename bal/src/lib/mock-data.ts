import type {
  AgentEpochHistory,
  AgentProfile,
  AgentSummary,
  AgentTradeView,
  EpochSummary,
  LeaderboardEntry,
  PnlPoint,
  TreasurySummary,
  TokenData
} from "@/types";
import { DEFAULT_PARTNER_CONFIG_PDA } from "@/lib/constants";

const baseDate = "2026-03-02T00:00:00.000Z";

export const mockActiveEpoch: EpochSummary = {
  id: "epoch-active-2026-03-02",
  epochNumber: 3,
  weekStart: "2026-03-02T00:00:00.000Z",
  weekEnd: "2026-03-09T23:59:59.000Z",
  totalFeesSol: 14.267,
  grossFeesClaimedSol: 14.267,
  operatingCostsSol: 1.42,
  prizePoolSol: 9.987,
  operatorRevenueSol: 2.8534,
  reserveSol: 1.4267,
  netDistributableSol: 12.8404,
  reserveBalanceAfterEpoch: 3.1981,
  status: "active"
};

export const mockEpochs: EpochSummary[] = [
  {
    id: "epoch-completed-2026-02-24",
    epochNumber: 2,
    weekStart: "2026-02-24T00:00:00.000Z",
    weekEnd: "2026-03-01T23:59:59.000Z",
    totalFeesSol: 11.14,
    grossFeesClaimedSol: 11.14,
    operatingCostsSol: 1.1,
    prizePoolSol: 7.798,
    operatorRevenueSol: 2.228,
    reserveSol: 1.114,
    netDistributableSol: 10.026,
    reserveBalanceAfterEpoch: 1.7714,
    status: "completed"
  },
  mockActiveEpoch
];

export const mockTreasurySummary: TreasurySummary = {
  treasuryWallet: "TrEa5uRy1111111111111111111111111111111111",
  treasuryBalanceSol: 16.482,
  currentPrizePoolSol: mockActiveEpoch.prizePoolSol,
  reserveBalanceSol: mockActiveEpoch.reserveBalanceAfterEpoch,
  nextPayoutDate: "2026-03-10T01:05:00.000Z",
  lastPayoutStatus: "pending_approval",
  currentPayoutBatchStatus: "pending_approval"
};

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    agentId: "agent-alpha-hunter",
    agentName: "AlphaHunter",
    avatarLabel: "AH",
    walletAddress: "AhuN8s5vXh9A2ZTQ1YPwQnS4ZssBAL1111",
    pnlSol: 4.82,
    sharpeRatio: 2.34,
    maxDrawdown: -8.2,
    tradeEfficiency: 1.42,
    compositeScore: 92.4,
    estimatedPrizeSol: 6.4235,
    trades: 156,
    winRate: 68.5,
    trend: [0.2, 0.8, 1.4, 1.7, 2.8, 3.5, 4.82]
  },
  {
    rank: 2,
    agentId: "agent-momentum-bot",
    agentName: "MomentumBot",
    avatarLabel: "MB",
    walletAddress: "MoBTp9rYc2F7aK1Q5Yt5oNnZ2ssBAL2222",
    pnlSol: 3.15,
    sharpeRatio: 1.89,
    maxDrawdown: -12.1,
    tradeEfficiency: 1.17,
    compositeScore: 84.7,
    estimatedPrizeSol: 3.8541,
    trades: 203,
    winRate: 61.2,
    trend: [0.1, 0.6, 1.2, 1.5, 2.1, 2.8, 3.15]
  },
  {
    rank: 3,
    agentId: "agent-degen-trader",
    agentName: "DegenTrader",
    avatarLabel: "DT",
    walletAddress: "DeGn7m9kW4Qp2zT9TAb2kWsm2ssBAL3333",
    pnlSol: 2.91,
    sharpeRatio: 1.52,
    maxDrawdown: -15.3,
    tradeEfficiency: 1.03,
    compositeScore: 78.3,
    estimatedPrizeSol: 2.5694,
    trades: 312,
    winRate: 55.8,
    trend: [-0.3, 0.2, 0.9, 0.7, 1.8, 2.1, 2.91]
  },
  {
    rank: 4,
    agentId: "agent-smart-swap-ai",
    agentName: "SmartSwap AI",
    avatarLabel: "SS",
    walletAddress: "SmSw2h7nA9rP7yV2QeV3uAs11ssBAL4444",
    pnlSol: 1.74,
    sharpeRatio: 1.41,
    maxDrawdown: -9.8,
    tradeEfficiency: 0.94,
    compositeScore: 71.2,
    estimatedPrizeSol: 0,
    trades: 89,
    winRate: 62.1,
    trend: [0.3, 0.5, 0.7, 0.8, 1.1, 1.4, 1.74]
  },
  {
    rank: 5,
    agentId: "agent-bags-maxi",
    agentName: "BagsMaxi",
    avatarLabel: "BM",
    walletAddress: "BaMx8r1cP5dL4oZ5WqR4bXt11ssBAL5555",
    pnlSol: 1.23,
    sharpeRatio: 1.15,
    maxDrawdown: -18.4,
    tradeEfficiency: 0.82,
    compositeScore: 65.8,
    estimatedPrizeSol: 0,
    trades: 145,
    winRate: 52.3,
    trend: [0.4, 0.6, 0.9, 0.8, 1.0, 1.1, 1.23]
  },
  {
    rank: 6,
    agentId: "agent-trend-rider",
    agentName: "TrendRider",
    avatarLabel: "TR",
    walletAddress: "TrRd9m4sL1cF7nB3BzT4jVw11ssBAL6666",
    pnlSol: 0.87,
    sharpeRatio: 0.92,
    maxDrawdown: -22.1,
    tradeEfficiency: 0.66,
    compositeScore: 58.4,
    estimatedPrizeSol: 0,
    trades: 78,
    winRate: 49.7,
    trend: [-0.2, -0.1, 0.1, 0.2, 0.5, 0.7, 0.87]
  },
  {
    rank: 7,
    agentId: "agent-night-owl",
    agentName: "NightOwl",
    avatarLabel: "NO",
    walletAddress: "NiOw2m3yQ6pV8qL3CnY1xDo11ssBAL7777",
    pnlSol: 0.45,
    sharpeRatio: 0.78,
    maxDrawdown: -14.5,
    tradeEfficiency: 0.54,
    compositeScore: 52.1,
    estimatedPrizeSol: 0,
    trades: 167,
    winRate: 47.2,
    trend: [-0.4, -0.2, 0.0, 0.1, 0.3, 0.4, 0.45]
  },
  {
    rank: 8,
    agentId: "agent-sol-surfer",
    agentName: "SolSurfer",
    avatarLabel: "SS",
    walletAddress: "SoSf4m5uK3lP6zQ4CtV5eFr11ssBAL8888",
    pnlSol: -0.12,
    sharpeRatio: 0.34,
    maxDrawdown: -25.8,
    tradeEfficiency: 0.32,
    compositeScore: 41.3,
    estimatedPrizeSol: 0,
    trades: 234,
    winRate: 43.1,
    trend: [0.3, 0.2, 0.1, 0.0, -0.1, -0.08, -0.12]
  }
];

export const mockAgents: AgentSummary[] = mockLeaderboard.map((entry, index) => ({
  id: entry.agentId,
  name: entry.agentName,
  avatarLabel: entry.avatarLabel,
  walletAddress: entry.walletAddress,
  registeredAt: new Date(Date.parse(baseDate) - (index + 1) * 86_400_000).toISOString(),
  totalTrades: entry.trades + 120,
  totalPnlSol: Number((entry.pnlSol * 3.4).toFixed(2)),
  winRate: entry.winRate,
  bestEpochRank: entry.rank <= 4 ? entry.rank : null
}));

export const mockTokens: TokenData[] = [
  {
    mint: "HENRY1111111111111111111111111111111111111",
    symbol: "HENRY",
    name: "Henry",
    priceUsd: 0.0234,
    change24h: 18.5,
    volume24h: 45200,
    marketCap: 2_340_000,
    bagsUrl: "https://bags.fm/token/henry"
  },
  {
    mint: "FINN11111111111111111111111111111111111111",
    symbol: "FINN",
    name: "Finn on Bags",
    priceUsd: 0.0089,
    change24h: -5.2,
    volume24h: 23100,
    marketCap: 870_000,
    bagsUrl: "https://bags.fm/token/finn"
  },
  {
    mint: "ELIZA1111111111111111111111111111111111111",
    symbol: "ELIZA",
    name: "Eliza Town",
    priceUsd: 0.0012,
    change24h: 42.1,
    volume24h: 67800,
    marketCap: 1_920_000,
    bagsUrl: "https://bags.fm/token/eliza"
  },
  {
    mint: "GAS111111111111111111111111111111111111111",
    symbol: "GAS",
    name: "Gas Town",
    priceUsd: 0.0045,
    change24h: -12.3,
    volume24h: 15400,
    marketCap: 540_000,
    bagsUrl: "https://bags.fm/token/gas"
  },
  {
    mint: "OMNIRA111111111111111111111111111111111111",
    symbol: "OMNIRA",
    name: "Omnira AI",
    priceUsd: 0.0178,
    change24h: 7.8,
    volume24h: 31200,
    marketCap: 1_430_000,
    bagsUrl: "https://bags.fm/token/omnira"
  },
  {
    mint: "GOBLIN111111111111111111111111111111111111",
    symbol: "GOBLIN",
    name: "Crypto Goblin",
    priceUsd: 0.0067,
    change24h: 3.2,
    volume24h: 18900,
    marketCap: 780_000,
    bagsUrl: "https://bags.fm/token/goblin"
  }
];

function buildTradeHistory(agentId: string): AgentTradeView[] {
  return [
    {
      id: `${agentId}-trade-1`,
      epochId: mockActiveEpoch.id,
      tokenMint: mockTokens[0].mint,
      tokenSymbol: mockTokens[0].symbol,
      action: "buy",
      amountSol: 0.42,
      tokenAmount: 18.2,
      pricePerToken: 0.023,
      txSignature: `${agentId}-sig-1`,
      tradedAt: "2026-03-03T04:30:00.000Z",
      pnlContributionSol: 0.18
    },
    {
      id: `${agentId}-trade-2`,
      epochId: mockActiveEpoch.id,
      tokenMint: mockTokens[2].mint,
      tokenSymbol: mockTokens[2].symbol,
      action: "sell",
      amountSol: 0.66,
      tokenAmount: 540,
      pricePerToken: 0.00122,
      txSignature: `${agentId}-sig-2`,
      tradedAt: "2026-03-05T11:15:00.000Z",
      pnlContributionSol: 0.41
    },
    {
      id: `${agentId}-trade-3`,
      epochId: mockActiveEpoch.id,
      tokenMint: mockTokens[4].mint,
      tokenSymbol: mockTokens[4].symbol,
      action: "buy",
      amountSol: 0.29,
      tokenAmount: 16.3,
      pricePerToken: 0.0177,
      txSignature: `${agentId}-sig-3`,
      tradedAt: "2026-03-07T21:00:00.000Z",
      pnlContributionSol: 0.12
    }
  ];
}

function buildPnlHistory(total: number): PnlPoint[] {
  return [
    { date: "Mar 2", pnlSol: Number((total * 0.08).toFixed(2)) },
    { date: "Mar 3", pnlSol: Number((total * 0.19).toFixed(2)) },
    { date: "Mar 4", pnlSol: Number((total * 0.34).toFixed(2)) },
    { date: "Mar 5", pnlSol: Number((total * 0.52).toFixed(2)) },
    { date: "Mar 6", pnlSol: Number((total * 0.63).toFixed(2)) },
    { date: "Mar 7", pnlSol: Number((total * 0.84).toFixed(2)) },
    { date: "Mar 8", pnlSol: Number(total.toFixed(2)) }
  ];
}

function buildEpochHistory(entry: LeaderboardEntry): AgentEpochHistory[] {
  return [
    {
      epochId: "epoch-completed-2026-02-24",
      epochNumber: 2,
      rank: Math.max(1, entry.rank - 1),
      pnlSol: Number((entry.pnlSol * 0.78).toFixed(2)),
      prizeSol: entry.rank <= 4 ? Number((entry.estimatedPrizeSol * 0.7).toFixed(2)) : 0
    },
    {
      epochId: mockActiveEpoch.id,
      epochNumber: mockActiveEpoch.epochNumber,
      rank: entry.rank,
      pnlSol: entry.pnlSol,
      prizeSol: entry.estimatedPrizeSol
    }
  ];
}

export const mockProfiles: AgentProfile[] = mockLeaderboard.map((entry) => {
  const summary = mockAgents.find((agent) => agent.id === entry.agentId)!;

  return {
    ...summary,
    tradeHistory: buildTradeHistory(entry.agentId),
    pnlHistory: buildPnlHistory(entry.pnlSol),
    epochHistory: buildEpochHistory(entry)
  };
});

export const mockStats = {
  totalAgents: 47,
  totalTrades: 3842,
  volumeSol: 189420,
  partnerConfigPda: DEFAULT_PARTNER_CONFIG_PDA
};
