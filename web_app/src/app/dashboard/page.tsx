"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Wallet, RefreshCw, Bot, ArrowUpRight, ArrowDownRight, AlertTriangle, ShoppingCart, Search, Shield, Save, X, Sliders, Zap, ArrowRightLeft, PieChart as PieIcon, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useWallet } from '@/hooks/useWallet';
import { useAutoIndex } from '@/hooks/useAutoIndex';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import type { RiskParams } from '@/lib/types';

const TAG_ICONS: Record<string, React.ElementType> = {
    'Arb Scan': Search,
    Rebalance: RefreshCw,
    'Arb Trade': Zap,
    Risk: AlertTriangle,
    Buy: ShoppingCart,
    info: Bot,
    warn: AlertTriangle,
    error: X,
};

const ASSET_COLORS: Record<string, string> = {
    ETH: '#627EEA',
    WETH: '#627EEA',
    WBTC: '#F7931A',
    BTC: '#F7931A',
    SOL: '#9945FF',
    ARB: '#28A0F0',
    LINK: '#2A5ADA',
    USDC: '#2775CA',
    USDT: '#26A17B',
    DAI: '#F5AC37',
    MATIC: '#8247E5',
    OP: '#FF0420',
    AVAX: '#E84142',
    BNB: '#F3BA2F',
};

function getAssetColor(symbol: string) {
    return ASSET_COLORS[symbol.toUpperCase()] ?? '#6366f1';
}

const RISK_FIELDS: {
    key: keyof RiskParams;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    desc: string;
}[] = [
        {
            key: 'maxDrawdown',
            label: 'Max Drawdown',
            unit: '%',
            min: 5,
            max: 50,
            step: 1,
            desc: 'Max portfolio loss from peak',
        },
        {
            key: 'maxSingleAsset',
            label: 'Max Single Asset',
            unit: '%',
            min: 5,
            max: 50,
            step: 5,
            desc: 'Max weight for any single asset',
        },
        {
            key: 'minStableAlloc',
            label: 'Min Stablecoin',
            unit: '%',
            min: 0,
            max: 50,
            step: 5,
            desc: 'Min stablecoin reserve',
        },
        {
            key: 'rebalanceThreshold',
            label: 'Rebalance Trigger',
            unit: '%',
            min: 1,
            max: 20,
            step: 1,
            desc: 'Drift threshold for auto-rebalance',
        },
        {
            key: 'volatilityTarget',
            label: 'Volatility Target',
            unit: '%',
            min: 5,
            max: 60,
            step: 5,
            desc: 'Target annualized volatility',
        },
        {
            key: 'maxLeverage',
            label: 'Max Leverage',
            unit: 'x',
            min: 1,
            max: 3,
            step: 0.5,
            desc: 'Maximum leverage ratio',
        },
        {
            key: 'arbMaxPerTrade',
            label: 'Arb Max/Trade',
            unit: '$',
            min: 10,
            max: 200,
            step: 10,
            desc: 'Max capital per arb trade',
        },
        {
            key: 'arbMinSpread',
            label: 'Min Arb Spread',
            unit: '%',
            min: 0.1,
            max: 2,
            step: 0.1,
            desc: 'Min price spread for arb',
        },
    ];

function fmtUsd(
    val: number,
    opts?: { sign?: boolean; decimals?: number }
) {
    const decimals = opts?.decimals ?? 2;
    const formatted = val.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    if (opts?.sign && val >= 0) return `+$${formatted}`;
    return `$${formatted}`;
}

function fmtPct(val: number, sign = false) {
    const s = val.toFixed(2);
    return sign && val >= 0 ? `+${s}%` : `${s}%`;
}

export default function Page() {
    const wallet = useWallet();
    const { state, loading, actionPending, deposit, withdraw, saveRiskParams, saveAllocation } = useAutoIndex(wallet.address);

    const walletBalances = useWalletBalances(wallet.address);

    const [depositTab, setDepositTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [selectedStable, setSelectedStable] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [chartRange, setChartRange] = useState('1M');
    const [editingRisk, setEditingRisk] = useState(false);
    const [editingAlloc, setEditingAlloc] = useState(false);
    const [tempIndexPct, setTempIndexPct] = useState(state.indexPct);
    const [tempRiskParams, setTempRiskParams] = useState<RiskParams>(state.riskParams);

    const syncedIndexPct = editingAlloc ? tempIndexPct : state.indexPct;
    const syncedRisk = editingRisk ? tempRiskParams : state.riskParams;
    const arbPct = 100 - state.indexPct;
    const tempArbPct = 100 - tempIndexPct;

    const vaultStats = useMemo(
        () => [
            {
                label: 'VAULT NAV',
                value: fmtUsd(state.totalValue),
                sub: `${fmtPct(state.totalProfitPct, true)} All Time`,
                icon: DollarSign,
                color:
                    state.totalProfitPct >= 0
                        ? 'text-success'
                        : 'text-destructive',
            },
            {
                label: 'YOUR DEPOSIT',
                value: fmtUsd(state.depositedValue),
                sub: state.depositedAt
                    ? `Deposited ${new Date(state.depositedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'No deposit yet',
                icon: Wallet,
                color: 'text-foreground',
            },
            {
                label: 'TOTAL PROFIT',
                value: fmtUsd(state.totalProfit, { sign: true }),
                sub: `${fmtPct(state.totalProfitPct, true)} Return`,
                icon: TrendingUp,
                color: state.totalProfit >= 0 ? 'text-success' : 'text-destructive',
            },
            {
                label: 'AGENT STATUS',
                value:
                    state.agentStatus.status.charAt(0).toUpperCase() +
                    state.agentStatus.status.slice(1),
                sub: state.agentStatus.message,
                icon: Bot,
                color:
                    state.agentStatus.status === 'error'
                        ? 'text-destructive'
                        : state.agentStatus.status === 'idle'
                            ? 'text-success'
                            : 'text-primary',
            },
        ],
        [state]
    );

    const holdings = useMemo(
        () =>
            state.allocations.map((a) => ({
                ...a,
                color: a.color || getAssetColor(a.symbol),
            })),
        [state.allocations]
    );

    const agentActivity = useMemo(
        () =>
            [...state.logs]
                .reverse()
                .slice(0, 8)
                .map((log) => {
                    const tag = log.tag ?? log.level;
                    const Icon = TAG_ICONS[tag] ?? Bot;
                    return {
                        icon: Icon,
                        title: log.title ?? log.msg.split(':')[0] ?? 'Agent Event',
                        desc: log.msg,
                        time: new Date(log.time).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        tag,
                        tagColor:
                            tag === 'Arb Trade' || tag === 'Arb Scan'
                                ? 'text-[hsl(270,70%,60%)]'
                                : tag === 'Risk' || log.level === 'warn'
                                    ? 'text-warning'
                                    : tag === 'Buy'
                                        ? 'text-success'
                                        : 'text-primary',
                        badge: log.badge,
                        badgeColor: log.badge?.startsWith('+')
                            ? 'text-success'
                            : 'text-destructive',
                    };
                }),
        [state.logs]
    );

    const handleDeposit = async () => {
        const num = parseFloat(amount.replace(',', ''));
        if (!num || num <= 0 || !wallet.address) return;
        if (depositTab === 'deposit') {
            await deposit(num, selectedStable);
        } else {
            await withdraw(num, selectedStable);
        }
        setAmount('');
    };

    const handleSaveRisk = async () => {
        await saveRiskParams(tempRiskParams);
        setEditingRisk(false);
    };
    const handleCancelRisk = () => {
        setTempRiskParams(state.riskParams);
        setEditingRisk(false);
    };

    const handleSaveAlloc = async () => {
        await saveAllocation(tempIndexPct);
        setEditingAlloc(false);
    };
    const handleCancelAlloc = () => {
        setTempIndexPct(state.indexPct);
        setEditingAlloc(false);
    };

    const maxBalance = walletBalances.find((b) => b.name === selectedStable)?.balanceRaw ?? 0;

    return (
        <div className='container py-6 space-y-4'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                {vaultStats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className='card-glass p-4'
                    >
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-[10px] uppercase tracking-wider text-muted-foreground font-medium'>
                                {s.label}
                            </span>
                            <s.icon className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='text-xl font-bold'>
                            {loading ? (
                                <div className='h-6 w-24 bg-secondary/50 rounded animate-pulse' />
                            ) : (
                                s.value
                            )}
                        </div>
                        <div className={`text-xs mt-0.5 ${s.color} truncate`}>{s.sub}</div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <Layers className='h-4 w-4 text-primary' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            VAULT STRATEGY ALLOCATION
                        </span>
                    </div>
                    {!editingAlloc && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='text-xs gap-1.5'
                            onClick={() => {
                                setTempIndexPct(state.indexPct);
                                setEditingAlloc(true);
                            }}
                        >
                            <Sliders className='h-3 w-3' /> Customize
                        </Button>
                    )}
                </div>

                <AnimatePresence mode='wait'>
                    {editingAlloc ? (
                        <motion.div
                            key='alloc-edit'
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='space-y-4'
                        >
                            <div className='p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium'>AI Index Fund</span>
                                    <span className='text-lg font-bold text-primary font-mono'>
                                        {syncedIndexPct}%
                                    </span>
                                </div>
                                <Slider
                                    value={[tempIndexPct]}
                                    onValueChange={(v) => setTempIndexPct(v[0])}
                                    min={50}
                                    max={95}
                                    step={5}
                                    className='w-full'
                                />
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium'>
                                        DEX Arbitrage Engine
                                    </span>
                                    <span className='text-lg font-bold text-[hsl(270,70%,60%)] font-mono'>
                                        {tempArbPct}%
                                    </span>
                                </div>
                                <div className='flex rounded-full overflow-hidden h-3 bg-secondary/30'>
                                    <div
                                        className='h-full bg-primary transition-all'
                                        style={{ width: `${tempIndexPct}%` }}
                                    />
                                    <div
                                        className='h-full bg-[hsl(270,70%,60%)] transition-all'
                                        style={{ width: `${tempArbPct}%` }}
                                    />
                                </div>
                                <p className='text-[10px] text-muted-foreground'>
                                    Index range: 50-95%. Higher index = lower risk. Higher arb =
                                    higher yield potential.
                                </p>
                                <div className='flex gap-2 justify-end'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        className='text-xs'
                                        onClick={() => setTempIndexPct(80)}
                                    >
                                        Reset Default
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='text-xs'
                                        onClick={handleCancelAlloc}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size='sm'
                                        className='text-xs'
                                        disabled={actionPending}
                                        onClick={handleSaveAlloc}
                                    >
                                        {actionPending ? (
                                            <Loader2 className='h-3 w-3 animate-spin mr-1' />
                                        ) : (
                                            <Save className='h-3 w-3 mr-1' />
                                        )}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key='alloc-view'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className='grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center'>
                                <div className='p-4 rounded-xl bg-primary/5 border border-primary/20'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <PieIcon className='h-4 w-4 text-primary' />
                                        <span className='text-sm font-bold'>AI Index Fund</span>
                                        <span className='ml-auto text-lg font-bold text-primary'>
                                            {state.indexPct}%
                                        </span>
                                    </div>
                                    <p className='text-xs text-muted-foreground mb-2'>
                                        Long-term diversified crypto portfolio. Cross-chain
                                        rebalancing via LI.FI.
                                    </p>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='text-muted-foreground'>
                                            Value:{' '}
                                            <span className='text-foreground font-mono font-semibold'>
                                                {fmtUsd(state.indexValue)}
                                            </span>
                                        </span>
                                        <span
                                            className={
                                                state.totalProfit >= 0
                                                    ? 'text-success font-mono'
                                                    : 'text-destructive font-mono'
                                            }
                                        >
                                            {fmtUsd(state.totalProfit * (state.indexPct / 100), {
                                                sign: true,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className='hidden md:flex flex-col items-center gap-1'>
                                    <div className='h-8 w-px bg-border/50' />
                                    <ArrowRightLeft className='h-4 w-4 text-muted-foreground' />
                                    <div className='h-8 w-px bg-border/50' />
                                </div>

                                <div className='p-4 rounded-xl bg-[hsl(270,70%,60%)]/5 border border-[hsl(270,70%,60%)]/20'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <Zap className='h-4 w-4 text-[hsl(270,70%,60%)]' />
                                        <span className='text-sm font-bold'>
                                            DEX Arbitrage Engine
                                        </span>
                                        <span className='ml-auto text-lg font-bold text-[hsl(270,70%,60%)]'>
                                            {arbPct}%
                                        </span>
                                    </div>
                                    <p className='text-xs text-muted-foreground mb-2'>
                                        Short-lived cross-chain and cross-DEX arbitrage. Profits
                                        return to vault.
                                    </p>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='text-muted-foreground'>
                                            Value:{' '}
                                            <span className='text-foreground font-mono font-semibold'>
                                                {fmtUsd(state.yieldValue)}
                                            </span>
                                        </span>
                                        <span
                                            className={
                                                state.totalProfit >= 0
                                                    ? 'text-success font-mono'
                                                    : 'text-destructive font-mono'
                                            }
                                        >
                                            {fmtUsd(state.totalProfit * (arbPct / 100), {
                                                sign: true,
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-4 flex rounded-full overflow-hidden h-3 bg-secondary/30'>
                                <div
                                    className='h-full bg-primary transition-all'
                                    style={{ width: `${state.indexPct}%` }}
                                />
                                <div
                                    className='h-full bg-[hsl(270,70%,60%)] transition-all'
                                    style={{ width: `${arbPct}%` }}
                                />
                            </div>
                            <div className='flex justify-between mt-1.5 text-[10px] text-muted-foreground'>
                                <span>{state.indexPct}% → Index Portfolio</span>
                                <span>{arbPct}% → Arbitrage Engine</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className='grid lg:grid-cols-3 gap-4'>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className='card-glass p-5'
                >
                    <div className='flex items-center gap-2 mb-1'>
                        <Wallet className='h-4 w-4 text-primary' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            AutoIndex Vault
                        </span>
                    </div>
                    <p className='text-xs text-muted-foreground mb-4'>
                        Deposit tokens into the vault. AI splits automatically:{' '}
                        {state.indexPct}% Index, {arbPct}% Arbitrage.
                    </p>

                    {!wallet.address && (
                        <div className='mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-center text-muted-foreground'>
                            Connect your wallet to deposit
                        </div>
                    )}

                    <div className='flex rounded-lg bg-secondary/50 p-0.5 mb-4'>
                        {(['deposit', 'withdraw'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setDepositTab(tab)}
                                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors capitalize ${depositTab === tab
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider'>
                        SELECT STABLECOIN
                    </div>
                    <div className='grid grid-cols-3 gap-2 mb-4'>
                        {walletBalances.map((s) => (
                            <button
                                key={s.name}
                                onClick={() => setSelectedStable(s.name)}
                                className={`p-3 rounded-lg border text-center transition-all ${selectedStable === s.name
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border/30 bg-secondary/20 hover:border-border/60'
                                    }`}
                            >
                                <div className='text-sm font-bold'>{s.name}</div>
                                <div className='text-[10px] text-muted-foreground'>
                                    {wallet.address ? s.balance : '—'}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider flex justify-between'>
                        <span>AMOUNT</span>
                        {wallet.address && (
                            <button
                                className='hover:text-foreground transition-colors'
                                onClick={() => setAmount(maxBalance.toFixed(2))}
                            >
                                Max: {fmtUsd(maxBalance)}
                            </button>
                        )}
                    </div>
                    <div className='flex items-center gap-2 bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 mb-3'>
                        <span className='text-muted-foreground text-sm'>$</span>
                        <input
                            type='number'
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder='0.00'
                            min='0'
                            className='flex-1 bg-transparent outline-none text-sm font-mono'
                        />
                    </div>

                    <AnimatePresence>
                        {amount && Number(amount) > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className='mb-3 p-3 rounded-lg bg-secondary/20 border border-border/20 text-xs space-y-1'
                            >
                                <div className='text-[10px] uppercase text-muted-foreground mb-1'>
                                    Vault will allocate:
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        → AI Index Fund ({state.indexPct}%)
                                    </span>
                                    <span className='font-mono font-semibold'>
                                        {fmtUsd((Number(amount) * state.indexPct) / 100)}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                        → DEX Arbitrage ({arbPct}%)
                                    </span>
                                    <span className='font-mono font-semibold'>
                                        {fmtUsd((Number(amount) * arbPct) / 100)}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className='grid grid-cols-4 gap-2 mb-4'>
                        {[100, 500, 1000, 5000].map((a) => (
                            <button
                                key={a}
                                onClick={() => setAmount(String(a))}
                                className='py-1.5 rounded-md bg-secondary/30 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors'
                            >
                                ${a >= 1000 ? `${a / 1000}K` : a}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant='hero'
                        className='w-full'
                        disabled={
                            !wallet.address ||
                            actionPending ||
                            !amount ||
                            Number(amount) <= 0
                        }
                        onClick={handleDeposit}
                    >
                        {actionPending ? (
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        ) : null}
                        {depositTab === 'deposit'
                            ? `Deposit ${selectedStable}`
                            : `Withdraw ${selectedStable}`}
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className='lg:col-span-2 card-glass p-5'
                >
                    <div className='flex items-center justify-between mb-4'>
                        <div>
                            <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                                VAULT PERFORMANCE
                            </span>
                            {state.perfHistory.length > 0 && (
                                <div className='flex items-center gap-4 mt-1'>
                                    <span className='flex items-center gap-1 text-xs'>
                                        <span className='h-2 w-2 rounded-full bg-primary inline-block' />
                                        Vault NAV{' '}
                                        <span className='text-success'>
                                            {fmtPct(state.totalProfitPct, true)}
                                        </span>
                                    </span>
                                    <span className='flex items-center gap-1 text-xs'>
                                        <span className='h-2 w-2 rounded-full bg-[hsl(270,70%,60%)] inline-block' />
                                        Arb Engine
                                    </span>
                                    <span className='flex items-center gap-1 text-xs'>
                                        <span className='h-2 w-2 rounded-full bg-muted-foreground inline-block' />
                                        Index
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className='flex gap-1'>
                            {['1W', '1M', 'ALL'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setChartRange(r)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${chartRange === r
                                        ? 'bg-primary/20 text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {state.perfHistory.length === 0 ? (
                        <div className='h-60 flex items-center justify-center text-muted-foreground text-sm'>
                            {loading ? (
                                <div className='flex flex-col items-center gap-2'>
                                    <Loader2 className='h-5 w-5 animate-spin' />
                                    <span>Loading performance data…</span>
                                </div>
                            ) : (
                                <div className='text-center space-y-1'>
                                    <p>No performance history yet</p>
                                    <p className='text-xs'>Deposit to start tracking</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <ResponsiveContainer width='100%' height={240}>
                            <AreaChart data={state.perfHistory}>
                                <defs>
                                    <linearGradient id='vaultGrad' x1='0' y1='0' x2='0' y2='1'>
                                        <stop
                                            offset='5%'
                                            stopColor='hsl(175, 80%, 50%)'
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset='95%'
                                            stopColor='hsl(175, 80%, 50%)'
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                    <linearGradient id='arbGrad' x1='0' y1='0' x2='0' y2='1'>
                                        <stop
                                            offset='5%'
                                            stopColor='hsl(270, 70%, 60%)'
                                            stopOpacity={0.2}
                                        />
                                        <stop
                                            offset='95%'
                                            stopColor='hsl(270, 70%, 60%)'
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='hsl(220, 14%, 16%)'
                                />
                                <XAxis
                                    dataKey='date'
                                    tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['dataMin - 5', 'dataMax + 10']}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(220, 18%, 8%)',
                                        border: '1px solid hsl(220, 14%, 16%)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(v: number) => [`$${v.toFixed(2)}`]}
                                />
                                <Area
                                    type='monotone'
                                    dataKey='vault'
                                    stroke='hsl(175, 80%, 50%)'
                                    fill='url(#vaultGrad)'
                                    strokeWidth={2}
                                    name='Vault NAV'
                                />
                                <Area
                                    type='monotone'
                                    dataKey='arb'
                                    stroke='hsl(270, 70%, 60%)'
                                    fill='url(#arbGrad)'
                                    strokeWidth={1.5}
                                    name='Arb Engine'
                                />
                                <Area
                                    type='monotone'
                                    dataKey='index'
                                    stroke='hsl(215, 12%, 50%)'
                                    fill='transparent'
                                    strokeWidth={1.5}
                                    strokeDasharray='4 4'
                                    name='Index Fund'
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <PieIcon className='h-4 w-4 text-primary' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            AI INDEX HOLDINGS
                        </span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium'>
                            {state.indexPct}% of Vault
                        </span>
                    </div>
                    <span className='text-sm font-bold font-mono'>
                        {fmtUsd(state.indexValue)}
                    </span>
                </div>

                {holdings.length === 0 ? (
                    <div className='py-12 text-center text-muted-foreground text-sm'>
                        {loading ? (
                            <Loader2 className='h-5 w-5 animate-spin mx-auto' />
                        ) : (
                            <>
                                <p>No holdings yet</p>
                                <p className='text-xs mt-1'>
                                    Deposit funds — the AI agent will build your index
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className='grid lg:grid-cols-[1fr_220px] gap-6'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-xs'>
                                <thead>
                                    <tr className='text-muted-foreground border-b border-border/30'>
                                        <th className='text-left py-2 font-medium'>ASSET</th>
                                        <th className='text-left py-2 font-medium'>WEIGHT</th>
                                        <th className='text-right py-2 font-medium'>VALUE</th>
                                        <th className='text-right py-2 font-medium'>24H</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...holdings]
                                        .sort((a, b) => b.weight - a.weight)
                                        .map((h) => (
                                            <tr
                                                key={`${h.symbol}-${h.chainId}`}
                                                className='border-b border-border/10 hover:bg-secondary/20 transition-colors'
                                            >
                                                <td className='py-2.5'>
                                                    <div className='flex items-center gap-2'>
                                                        <div
                                                            className='h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold'
                                                            style={{
                                                                backgroundColor: h.color + '22',
                                                                color: h.color,
                                                            }}
                                                        >
                                                            {h.symbol.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className='font-semibold'>{h.symbol}</div>
                                                            <div className='text-[10px] text-muted-foreground'>
                                                                {h.chainName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='py-2.5'>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-16 h-1.5 rounded-full bg-secondary/50'>
                                                            <div
                                                                className='h-full rounded-full'
                                                                style={{
                                                                    width: `${Math.min((h.weight / 35) * 100, 100)}%`,
                                                                    backgroundColor: h.color,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className='font-mono'>{h.weight}%</span>
                                                    </div>
                                                </td>
                                                <td className='py-2.5 text-right font-mono'>
                                                    {fmtUsd(h.value)}
                                                </td>
                                                <td
                                                    className={`py-2.5 text-right font-mono ${h.change24h >= 0
                                                        ? 'text-success'
                                                        : 'text-destructive'
                                                        }`}
                                                >
                                                    <span className='inline-flex items-center gap-0.5'>
                                                        {h.change24h >= 0 ? (
                                                            <ArrowUpRight className='h-3 w-3' />
                                                        ) : (
                                                            <ArrowDownRight className='h-3 w-3' />
                                                        )}
                                                        {fmtPct(Math.abs(h.change24h))}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <div className='flex flex-col items-center justify-center'>
                            <div className='relative'>
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie
                                            data={holdings}
                                            dataKey='weight'
                                            nameKey='symbol'
                                            cx='50%'
                                            cy='50%'
                                            innerRadius={48}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {holdings.map((h) => (
                                                <Cell key={h.symbol} fill={h.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                                    <span className='text-[10px] text-muted-foreground'>
                                        Index
                                    </span>
                                    <span className='text-lg font-bold'>{holdings.length}</span>
                                    <span className='text-[10px] text-muted-foreground'>
                                        Assets
                                    </span>
                                </div>
                            </div>
                            <div className='mt-2 space-y-0.5'>
                                {holdings.map((h) => (
                                    <div
                                        key={h.symbol}
                                        className='flex items-center gap-1.5 text-[10px]'
                                    >
                                        <div
                                            className='h-1.5 w-1.5 rounded-full'
                                            style={{ backgroundColor: h.color }}
                                        />
                                        <span className='text-muted-foreground'>{h.symbol}</span>
                                        <span className='font-mono ml-auto'>{h.weight}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
            \
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <Zap className='h-4 w-4 text-[hsl(270,70%,60%)]' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            DEX ARBITRAGE ENGINE
                        </span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-[hsl(270,70%,60%)]/10 border border-[hsl(270,70%,60%)]/20 text-[hsl(270,70%,60%)] font-medium'>
                            {arbPct}% of Vault
                        </span>
                    </div>
                    <div className='text-right'>
                        <div className='text-sm font-bold font-mono'>
                            {fmtUsd(state.yieldValue)}
                        </div>
                        <div className='text-[10px] text-success'>
                            {fmtUsd(state.totalProfit * (arbPct / 100), { sign: true })} profit
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/20 border border-border/20 text-xs text-muted-foreground overflow-x-auto'>
                    {['Scan DEX Prices', 'Find Spread', 'Execute Swap', 'Return Profit'].map(
                        (step, i, arr) => (
                            <div key={step} className='flex items-center gap-2 shrink-0'>
                                <span
                                    className={`px-2 py-1 rounded font-medium ${i === arr.length - 1
                                        ? 'bg-success/20 text-success'
                                        : 'bg-secondary/50 text-foreground'
                                        }`}
                                >
                                    {step}
                                </span>
                                {i < arr.length - 1 && <span>→</span>}
                            </div>
                        )
                    )}
                </div>

                <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider'>
                    RECENT ARBITRAGE TRADES
                </div>

                {state.arbTrades.length === 0 ? (
                    <div className='py-8 text-center text-muted-foreground text-sm'>
                        <p>No arbitrage trades yet</p>
                        <p className='text-xs mt-1'>
                            Agent will execute trades when spreads {'>'} {syncedRisk.arbMinSpread}%
                        </p>
                    </div>
                ) : (
                    <div className='space-y-2'>
                        {state.arbTrades.slice(0, 5).map((t, i) => (
                            <div
                                key={i}
                                className='flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-border/10 hover:bg-secondary/20 transition-colors'
                            >
                                <div className='h-8 w-8 rounded-lg bg-[hsl(270,70%,60%)]/10 flex items-center justify-center shrink-0'>
                                    <ArrowRightLeft className='h-4 w-4 text-[hsl(270,70%,60%)]' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs font-semibold'>{t.type}</span>
                                        <span className='text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-mono'>
                                            {t.profit}
                                        </span>
                                    </div>
                                    <div className='text-[10px] text-muted-foreground mt-0.5 truncate'>
                                        {t.route}
                                    </div>
                                </div>
                                <div className='text-right shrink-0'>
                                    <div className='text-[10px] text-muted-foreground'>
                                        {t.time}
                                    </div>
                                    <div
                                        className={`text-[10px] ${t.status === 'Completed'
                                            ? 'text-success'
                                            : t.status === 'Failed'
                                                ? 'text-destructive'
                                                : 'text-primary'
                                            }`}
                                    >
                                        {t.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <Shield className='h-4 w-4 text-primary' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            RISK PARAMETERS
                        </span>
                    </div>
                    {!editingRisk ? (
                        <button
                            onClick={() => {
                                setTempRiskParams(state.riskParams);
                                setEditingRisk(true);
                            }}
                            className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors'
                        >
                            <Sliders className='h-3.5 w-3.5' />
                            Customize
                        </button>
                    ) : (
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={() => setTempRiskParams(state.riskParams)}
                                className='text-[10px] text-muted-foreground hover:text-foreground transition-colors'
                            >
                                Reset Defaults
                            </button>
                            <button
                                onClick={handleCancelRisk}
                                className='p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors'
                            >
                                <X className='h-3.5 w-3.5' />
                            </button>
                            <button
                                onClick={handleSaveRisk}
                                disabled={actionPending}
                                className='p-1 rounded hover:bg-primary/20 text-primary transition-colors'
                            >
                                {actionPending ? (
                                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                ) : (
                                    <Save className='h-3.5 w-3.5' />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <AnimatePresence mode='wait'>
                    {!editingRisk ? (
                        <motion.div
                            key='view'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'
                        >
                            {RISK_FIELDS.map((f) => (
                                <div
                                    key={f.key}
                                    className='bg-secondary/20 rounded-lg p-3 border border-border/20'
                                >
                                    <div className='text-[10px] uppercase tracking-wider text-muted-foreground mb-1'>
                                        {f.label}
                                    </div>
                                    <div className='text-lg font-bold font-mono'>
                                        {f.unit === 'x'
                                            ? `${state.riskParams[f.key]}x`
                                            : f.unit === '$'
                                                ? `$${state.riskParams[f.key]}`
                                                : `${state.riskParams[f.key]}%`}
                                    </div>
                                    <div className='text-[10px] text-muted-foreground mt-0.5'>
                                        {f.desc}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key='edit'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
                        >
                            {RISK_FIELDS.map((f) => (
                                <div
                                    key={f.key}
                                    className='bg-secondary/20 rounded-lg p-4 border border-primary/20'
                                >
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-xs font-medium'>{f.label}</span>
                                        <span className='text-sm font-bold font-mono text-primary'>
                                            {f.unit === 'x'
                                                ? `${tempRiskParams[f.key]}x`
                                                : f.unit === '$'
                                                    ? `$${tempRiskParams[f.key]}`
                                                    : `${tempRiskParams[f.key]}%`}
                                        </span>
                                    </div>
                                    <div className='text-[10px] text-muted-foreground mb-3'>
                                        {f.desc}
                                    </div>
                                    <Slider
                                        value={[tempRiskParams[f.key]]}
                                        onValueChange={([v]) =>
                                            setTempRiskParams((prev) => ({ ...prev, [f.key]: v }))
                                        }
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                    />
                                    <div className='flex justify-between text-[10px] text-muted-foreground mt-1'>
                                        <span>
                                            {f.min}
                                            {f.unit}
                                        </span>
                                        <span>
                                            {f.max}
                                            {f.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <Bot className='h-4 w-4 text-primary' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>
                            AI AGENT ACTIVITY
                        </span>
                    </div>
                    <span className='flex items-center gap-1.5 text-xs text-primary font-mono'>
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${state.agentStatus.status !== 'idle' &&
                                state.agentStatus.status !== 'error'
                                ? 'bg-primary animate-pulse'
                                : state.agentStatus.status === 'error'
                                    ? 'bg-destructive'
                                    : 'bg-success'
                                }`}
                        />
                        {state.agentStatus.status === 'idle'
                            ? 'MONITORING'
                            : state.agentStatus.status.toUpperCase()}
                    </span>
                </div>

                {agentActivity.length === 0 ? (
                    <div className='py-12 text-center text-muted-foreground text-sm'>
                        {loading ? (
                            <Loader2 className='h-5 w-5 animate-spin mx-auto' />
                        ) : (
                            <>
                                <p>No activity yet</p>
                                <p className='text-xs mt-1'>
                                    Agent is running and monitoring markets
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {agentActivity.map((a, i) => (
                            <div
                                key={i}
                                className='flex gap-3 pb-4 border-b border-border/20 last:border-0 last:pb-0'
                            >
                                <div className='h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5'>
                                    <a.icon className='h-4 w-4 text-muted-foreground' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2 flex-wrap'>
                                        <span className='text-sm font-semibold'>{a.title}</span>
                                        {a.badge && (
                                            <span className={`text-xs font-mono ${a.badgeColor}`}>
                                                {a.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                                        {a.desc}
                                    </p>
                                    <div className='flex items-center gap-3 mt-2'>
                                        <span className='text-[10px] text-muted-foreground'>
                                            {a.time}
                                        </span>
                                        <span className={`text-[10px] font-medium ${a.tagColor}`}>
                                            {a.tag}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
