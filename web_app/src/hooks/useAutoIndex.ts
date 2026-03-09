"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortfolioState, RiskParams } from '@/lib/types';

const DEFAULT_RISK: RiskParams = {
    maxDrawdown: 20,
    maxSingleAsset: 35,
    minStableAlloc: 10,
    rebalanceThreshold: 5,
    volatilityTarget: 25,
    maxLeverage: 1,
    arbMaxPerTrade: 50,
    arbMinSpread: 0.3,
};

const EMPTY_STATE: PortfolioState = {
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
        message: 'Start the agent: node agent/index.js',
    },
    supportedChains: [],
    logs: [],
    depositAddress: '',
    perfHistory: [],
    arbTrades: [],
    riskParams: DEFAULT_RISK,
    indexPct: 80,
    arbPct: 20,
    totalProfit: 0,
    totalProfitPct: 0,
};

export function useAutoIndex(address: string | null) {
    const [state, setState] = useState<PortfolioState>(EMPTY_STATE);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchState = useCallback(async (addr?: string | null) => {
        try {
            const a = addr ?? address;
            const url = `/api/agent${a ? `?address=${encodeURIComponent(a)}` : ''}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: PortfolioState = await res.json();
            setState(data);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchState();
        intervalRef.current = setInterval(() => fetchState(), 10_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchState]);

    useEffect(() => {
        if (address) fetchState(address);
    }, [address, fetchState]);

    const postAction = useCallback(
        async (body: Record<string, unknown>) => {
            setActionPending(true);
            try {
                const res = await fetch('/api/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...body, address }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                await fetchState();
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Action failed');
            } finally {
                setActionPending(false);
            }
        },
        [address, fetchState]
    );

    const deposit = useCallback(
        (amount: number, token: string) =>
            postAction({ action: 'deposit', amount, token }),
        [postAction]
    );

    const withdraw = useCallback(
        (amount: number, token: string) =>
            postAction({ action: 'withdraw', amount, token }),
        [postAction]
    );

    const forceRebalance = useCallback(
        () => postAction({ action: 'rebalance' }),
        [postAction]
    );

    const saveRiskParams = useCallback(
        (params: RiskParams) =>
            postAction({ action: 'setRiskParams', params }),
        [postAction]
    );

    const saveAllocation = useCallback(
        (indexPct: number) =>
            postAction({ action: 'setAllocation', indexPct }),
        [postAction]
    );

    return { state, loading, error, actionPending, deposit, withdraw, forceRebalance, saveRiskParams, saveAllocation, refetch: fetchState };
}
