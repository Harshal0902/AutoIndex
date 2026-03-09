/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState, useEffect } from 'react';
import type { WalletBalance } from '@/lib/types';

const STABLECOINS: { name: string; address: string; decimals: number }[] = [
    {
        name: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
    },
    {
        name: 'USDT',
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
    },
    {
        name: 'DAI',
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
    },
];

export function useWalletBalances(address: string | null) {
    const [balances, setBalances] = useState<WalletBalance[]>(
        STABLECOINS.map((s) => ({
            name: s.name,
            balance: '$0.00',
            balanceRaw: 0,
        }))
    );

    useEffect(() => {
        if (!address || typeof window === 'undefined' || !window.ethereum) return;

        let cancelled = false;

        async function fetchBalances() {
            const results: WalletBalance[] = [];

            for (const coin of STABLECOINS) {
                try {
                    const data =
                        '0x70a08231' +
                        address!.replace('0x', '').toLowerCase().padStart(64, '0');

                    // @ts-expect-error
                    const raw: string = await window.ethereum.request({
                        method: 'eth_call',
                        params: [{ to: coin.address, data }, 'latest'],
                    });

                    const bn = BigInt(raw);
                    const divisor = BigInt(10 ** coin.decimals);
                    const whole = Number(bn / divisor);
                    const frac = Number(bn % divisor) / 10 ** coin.decimals;
                    const amount = whole + frac;

                    results.push({
                        name: coin.name,
                        balance: `$${amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}`,
                        balanceRaw: amount,
                    });
                } catch {
                    results.push({ name: coin.name, balance: '$0.00', balanceRaw: 0 });
                }
            }

            if (!cancelled) setBalances(results);
        }

        fetchBalances();
        return () => {
            cancelled = true;
        };
    }, [address]);

    return balances;
}
