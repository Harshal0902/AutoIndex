export interface Allocation {
    symbol: string;
    name: string;
    weight: number;
    value: number;
    chainId: number;
    chainName: string;
    tokenAddress: string;
    priceUsd: number;
    change24h: number;
    color: string;
}

export interface PerfPoint {
    date: string;
    vault: number;
    index: number;
    arb: number;
}

export interface ArbTrade {
    type: string;
    route: string;
    profit: string;
    profitNum: number;
    time: string;
    status: "Completed" | "Pending" | "Failed";
}

export interface AgentLog {
    time: string;
    level: "info" | "warn" | "error";
    msg: string;
    tag?: string;
    title?: string;
    badge?: string;
}

export interface RiskParams {
    maxDrawdown: number;
    maxSingleAsset: number;
    minStableAlloc: number;
    rebalanceThreshold: number;
    volatilityTarget: number;
    maxLeverage: number;
    arbMaxPerTrade: number;
    arbMinSpread: number;
}

export interface SupportedChain {
    id: number;
    name: string;
    logoURI: string;
}

export interface WalletBalance {
    name: string;
    balance: string;
    balanceRaw: number;
}

export interface AgentStatus {
    status: "idle" | "analyzing" | "rebalancing" | "executing" | "error";
    lastRun: string | null;
    nextRun: string | null;
    message: string;
}

export interface PortfolioState {
    totalValue: number;
    indexValue: number;
    yieldValue: number;
    depositedValue: number;
    depositedAt: string | null;
    allocations: Allocation[];
    agentStatus: AgentStatus;
    supportedChains: SupportedChain[];
    logs: AgentLog[];
    depositAddress: string;
    perfHistory: PerfPoint[];
    arbTrades: ArbTrade[];
    riskParams: RiskParams;
    indexPct: number;
    arbPct: number;
    totalProfit: number;
    totalProfitPct: number;
}