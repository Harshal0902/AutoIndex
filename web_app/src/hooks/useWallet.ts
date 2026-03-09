/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { useState, useCallback, useEffect } from 'react';

interface WalletState {
    address: string | null;
    chainId: number | null;
    connecting: boolean;
    error: string | null;
}

export function useWallet() {
    const [state, setState] = useState<WalletState>({
        address: null,
        chainId: null,
        connecting: false,
        error: null,
    });

    const connect = useCallback(async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setState((s) => ({ ...s, error: 'MetaMask not found' }));
            return null;
        }
        setState((s) => ({ ...s, connecting: true, error: null }));
        try {
            // @ts-expect-error
            const accounts: string[] = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            // @ts-expect-error
            const chainIdHex: string = await window.ethereum.request({
                method: 'eth_chainId',
            });
            const address = accounts[0] ?? null;
            const chainId = parseInt(chainIdHex, 16);
            setState({ address, chainId, connecting: false, error: null });
            return address;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Connection failed';
            setState((s) => ({ ...s, connecting: false, error: msg }));
            return null;
        }
    }, []);

    const disconnect = useCallback(() => {
        setState({ address: null, chainId: null, connecting: false, error: null });
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum) return;

        window.ethereum
            .request({ method: 'eth_accounts' })
            // @ts-expect-error
            .then((accounts: string[]) => {
                if (accounts[0]) {
                    setState((s) => ({ ...s, address: accounts[0] }));
                }
            })
            .catch(() => { });

        const handleAccountsChanged = (accounts: string[]) => {
            setState((s) => ({ ...s, address: accounts[0] ?? null }));
        };
        const handleChainChanged = (chainIdHex: string) => {
            setState((s) => ({ ...s, chainId: parseInt(chainIdHex, 16) }));
        };

        // @ts-expect-error
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // @ts-expect-error
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            // @ts-expect-error
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            // @ts-expect-error
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    return { ...state, connect, disconnect };
}
