import { NextRequest, NextResponse } from 'next/server';
import type { PortfolioState } from '@/lib/types';

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 5_000;

async function agentFetch(
    path: string,
    init?: RequestInit
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        return await fetch(`${AGENT_URL}${path}`, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

const EMPTY: PortfolioState = {
    totalValue: 0,
    indexValue: 0,
    yieldValue: 0,
    depositedValue: 0,
    depositedAt: null,
    allocations: [],
    agentStatus: {
        status: 'idle',
        lastRun: null,
        nextRun: null,
        message: 'Agent offline — run: node agent/index.js',
    },
    supportedChains: [],
    logs: [],
    depositAddress: '',
    perfHistory: [],
    arbTrades: [],
    riskParams: {
        maxDrawdown: 20,
        maxSingleAsset: 35,
        minStableAlloc: 10,
        rebalanceThreshold: 5,
        volatilityTarget: 25,
        maxLeverage: 1,
        arbMaxPerTrade: 50,
        arbMinSpread: 0.3,
    },
    indexPct: 80,
    arbPct: 20,
    totalProfit: 0,
    totalProfitPct: 0,
};

export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address');
    try {
        const res = await agentFetch(
            `/state${address ? `?address=${encodeURIComponent(address)}` : ''}`
        );
        if (!res.ok) throw new Error(`Agent ${res.status}`);
        const data: PortfolioState = await res.json();
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch {
        const fallback = { ...EMPTY, depositAddress: address ?? '' };
        return NextResponse.json(fallback, {
            headers: { 'Cache-Control': 'no-store' },
        });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const res = await agentFetch('/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.ok ? 200 : 400 });
    } catch {
        return NextResponse.json(
            { error: 'Agent unreachable' },
            { status: 503 }
        );
    }
}

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (
                event: string,
                handler: (...args: unknown[]) => void
            ) => void;
        };
    }
}