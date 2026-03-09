"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, RefreshCw, Bot, ArrowUpRight, ArrowDownRight, AlertTriangle, ShoppingCart, Search, Shield, Save, X, Sliders, Zap, ArrowRightLeft, PieChart as PieIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const vaultStats = [
    { label: 'VAULT NAV', value: '$1,034.00', sub: '+3.4% All Time', icon: DollarSign, color: 'text-success' },
    { label: 'YOUR DEPOSIT', value: '$1,000.00', sub: 'Deposited Feb 1', icon: Wallet, color: 'text-foreground' },
    { label: 'TOTAL PROFIT', value: '+$34.00', sub: '+3.4% Return', icon: TrendingUp, color: 'text-success' },
    { label: 'AGENT STATUS', value: 'Active', sub: '24/7 Monitoring', icon: Bot, color: 'text-success' },
];

const perfData = [
    { date: 'Feb 1', vault: 1000, index: 1000, arb: 1000 },
    { date: 'Feb 8', vault: 1005, index: 1003, arb: 1012 },
    { date: 'Feb 15', vault: 1012, index: 1008, arb: 1025 },
    { date: 'Feb 22', vault: 1018, index: 1012, arb: 1040 },
    { date: 'Mar 1', vault: 1027, index: 1018, arb: 1060 },
    { date: 'Mar 4', vault: 1034, index: 1025, arb: 1080 },
];

const indexHoldings = [
    { asset: 'ETH', chain: 'Ethereum', weight: 30, value: '$243.00', change24h: '+2.14%', positive: true, color: '#627EEA' },
    { asset: 'WBTC', chain: 'Bitcoin', weight: 20, value: '$162.00', change24h: '+1.37%', positive: true, color: '#F7931A' },
    { asset: 'SOL', chain: 'Solana', weight: 15, value: '$121.50', change24h: '-4.28%', positive: false, color: '#9945FF' },
    { asset: 'ARB', chain: 'Arbitrum', weight: 10, value: '$81.00', change24h: '+2.14%', positive: true, color: '#28A0F0' },
    { asset: 'LINK', chain: 'Chainlink', weight: 10, value: '$81.00', change24h: '-1.13%', positive: false, color: '#2A5ADA' },
    { asset: 'USDC', chain: 'Stablecoin', weight: 15, value: '$121.50', change24h: '+0.00%', positive: true, color: '#2775CA' },
];

const arbTrades = [
    { type: 'DEX Mismatch', route: 'ETH cheaper on Base → sold on Arbitrum', profit: '+$8.40', time: '2h ago', status: 'Completed' },
    { type: 'Cross-chain Arb', route: 'MATIC cheaper on Polygon → sold on Ethereum', profit: '+$5.20', time: '6h ago', status: 'Completed' },
    { type: 'Triangular Arb', route: 'USDC → ETH → WBTC → USDC', profit: '+$3.10', time: '14h ago', status: 'Completed' },
    { type: 'DEX Mismatch', route: 'SOL cheaper on Solana → sold on Base', profit: '+$4.80', time: '1d ago', status: 'Completed' },
    { type: 'Cross-chain Arb', route: 'ARB cheaper on Arbitrum → sold on Ethereum', profit: '+$2.50', time: '1d ago', status: 'Completed' },
];

const agentActivity = [
    { icon: Search, title: 'Scanning DEX Prices', desc: 'Monitoring 12 DEXs across 5 chains for price spreads > 0.3%. Currently tracking ETH spread between Base and Arbitrum.', time: 'Just now', tag: 'Arb Scan', tagColor: 'text-[hsl(270,70%,60%)]' },
    { icon: RefreshCw, title: 'Index Rebalance Executed', badge: '+0.12%', badgeColor: 'text-success', desc: 'ETH drifted +2.1% above target. Sold 0.02 ETH, bought LINK and ARB to restore weights. Gas cost: $1.87.', time: 'Mar 3, 08:15', tag: 'Rebalance', tagColor: 'text-primary' },
    { icon: Zap, title: 'Arbitrage Executed', badge: '+$8.40', badgeColor: 'text-success', desc: 'Detected ETH 0.4% cheaper on Base vs Arbitrum. Bought on Base, bridged via LI.FI, sold on Arbitrum. Net profit after gas: $8.40.', time: 'Mar 3, 06:22', tag: 'Arb Trade', tagColor: 'text-[hsl(270,70%,60%)]' },
    { icon: AlertTriangle, title: 'Risk Check: Volatility Spike', desc: '30-day volatility hit 28%. Within risk parameters (max 35%). No action needed. Continuing monitoring.', time: 'Mar 2, 14:00', tag: 'Risk', tagColor: 'text-warning' },
    { icon: ShoppingCart, title: 'Index Buy: SOL', badge: '+$12.00', badgeColor: 'text-success', desc: 'SOL dropped -6% in 24h, creating buying opportunity. Purchased to maintain 15% target weight. Entry: $168.30.', time: 'Mar 1, 09:45', tag: 'Buy', tagColor: 'text-success' },
];

const stablecoins = [
    { name: 'USDC', balance: '$12,450.00' },
    { name: 'USDT', balance: '$8,323.50' },
    { name: 'DAI', balance: '$3,150.00' },
];

export default function Page() {
    const [depositTab, setDepositTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [selectedStable, setSelectedStable] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [chartRange, setChartRange] = useState('1M');
    const [editingRisk, setEditingRisk] = useState(false);
    const [editingAlloc, setEditingAlloc] = useState(false);
    const [indexPct, setIndexPct] = useState(80);
    const [tempIndexPct, setTempIndexPct] = useState(80);
    const arbPct = 100 - indexPct;
    const tempArbPct = 100 - tempIndexPct;

    const defaultRiskParams = {
        maxDrawdown: 20,
        maxSingleAsset: 35,
        minStableAlloc: 10,
        rebalanceThreshold: 5,
        volatilityTarget: 25,
        maxLeverage: 1,
        arbMaxPerTrade: 50,
        arbMinSpread: 0.3,
    };

    const [riskParams, setRiskParams] = useState(defaultRiskParams);
    const [tempRiskParams, setTempRiskParams] = useState(defaultRiskParams);

    const riskFields = [
        { key: 'maxDrawdown' as const, label: 'Max Drawdown', unit: '%', min: 5, max: 50, step: 1, desc: 'Max portfolio loss from peak' },
        { key: 'maxSingleAsset' as const, label: 'Max Single Asset', unit: '%', min: 5, max: 50, step: 5, desc: 'Max weight for any single asset' },
        { key: 'minStableAlloc' as const, label: 'Min Stablecoin', unit: '%', min: 0, max: 50, step: 5, desc: 'Min stablecoin reserve' },
        { key: 'rebalanceThreshold' as const, label: 'Rebalance Trigger', unit: '%', min: 1, max: 20, step: 1, desc: 'Drift threshold for auto-rebalance' },
        { key: 'volatilityTarget' as const, label: 'Volatility Target', unit: '%', min: 5, max: 60, step: 5, desc: 'Target annualized volatility' },
        { key: 'maxLeverage' as const, label: 'Max Leverage', unit: 'x', min: 1, max: 3, step: 0.5, desc: 'Maximum leverage ratio' },
        { key: 'arbMaxPerTrade' as const, label: 'Arb Max/Trade', unit: '$', min: 10, max: 200, step: 10, desc: 'Max capital per arb trade' },
        { key: 'arbMinSpread' as const, label: 'Min Arb Spread', unit: '%', min: 0.1, max: 2, step: 0.1, desc: 'Min price spread for arb' },
    ];

    const handleSaveRisk = () => { setRiskParams(tempRiskParams); setEditingRisk(false); };
    const handleCancelRisk = () => { setTempRiskParams(riskParams); setEditingRisk(false); };
    const handleResetRisk = () => { setTempRiskParams(defaultRiskParams); };

    const handleSaveAlloc = () => { setIndexPct(tempIndexPct); setEditingAlloc(false); };
    const handleCancelAlloc = () => { setTempIndexPct(indexPct); setEditingAlloc(false); };
    const handleResetAlloc = () => { setTempIndexPct(80); };

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
                            <span className='text-[10px] uppercase tracking-wider text-muted-foreground font-medium'>{s.label}</span>
                            <s.icon className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='text-xl font-bold'>{s.value}</div>
                        <div className={`text-xs ${s.color}`}>{s.sub}</div>
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
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>VAULT STRATEGY ALLOCATION</span>
                    </div>
                    {!editingAlloc && (
                        <Button variant='ghost' size='sm' className='text-xs gap-1.5' onClick={() => { setTempIndexPct(indexPct); setEditingAlloc(true); }}>
                            <Sliders className='h-3 w-3' /> Customize
                        </Button>
                    )}
                </div>

                <AnimatePresence mode='wait'>
                    {editingAlloc ? (
                        <motion.div key='alloc-edit' initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className='space-y-4'>
                            <div className='p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium'>AI Index Fund</span>
                                    <span className='text-lg font-bold text-primary font-mono'>{tempIndexPct}%</span>
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
                                    <span className='text-sm font-medium'>DEX Arbitrage Engine</span>
                                    <span className='text-lg font-bold text-[hsl(270,70%,60%)] font-mono'>{tempArbPct}%</span>
                                </div>
                                <div className='flex rounded-full overflow-hidden h-3 bg-secondary/30'>
                                    <div className='h-full bg-primary transition-all' style={{ width: `${tempIndexPct}%` }} />
                                    <div className='h-full bg-[hsl(270,70%,60%)] transition-all' style={{ width: `${tempArbPct}%` }} />
                                </div>
                                <p className='text-[10px] text-muted-foreground'>Index range: 50-95%. Higher index = lower risk, lower yield. Higher arb = higher yield potential with more volatility.</p>
                                <div className='flex gap-2 justify-end'>
                                    <Button variant='ghost' size='sm' className='text-xs' onClick={handleResetAlloc}>Reset Default</Button>
                                    <Button variant='outline' size='sm' className='text-xs' onClick={handleCancelAlloc}>Cancel</Button>
                                    <Button size='sm' className='text-xs' onClick={handleSaveAlloc}><Save className='h-3 w-3 mr-1' />Save</Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key='alloc-view' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className='grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center'>
                                <div className='p-4 rounded-xl bg-primary/5 border border-primary/20'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <PieIcon className='h-4 w-4 text-primary' />
                                        <span className='text-sm font-bold'>AI Index Fund</span>
                                        <span className='ml-auto text-lg font-bold text-primary'>{indexPct}%</span>
                                    </div>
                                    <p className='text-xs text-muted-foreground mb-2'>Long-term diversified crypto portfolio. Cross-chain rebalancing via LI.FI.</p>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='text-muted-foreground'>Value: <span className='text-foreground font-mono font-semibold'>$810.00</span></span>
                                        <span className='text-success font-mono'>+$10.00</span>
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
                                        <span className='text-sm font-bold'>DEX Arbitrage Engine</span>
                                        <span className='ml-auto text-lg font-bold text-[hsl(270,70%,60%)]'>{arbPct}%</span>
                                    </div>
                                    <p className='text-xs text-muted-foreground mb-2'>Short-lived cross-chain and cross-DEX arbitrage trades. Profits return to vault.</p>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='text-muted-foreground'>Value: <span className='text-foreground font-mono font-semibold'>$224.00</span></span>
                                        <span className='text-success font-mono'>+$24.00</span>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-4 flex rounded-full overflow-hidden h-3 bg-secondary/30'>
                                <div className='h-full bg-primary transition-all' style={{ width: `${indexPct}%` }} />
                                <div className='h-full bg-[hsl(270,70%,60%)] transition-all' style={{ width: `${arbPct}%` }} />
                            </div>
                            <div className='flex justify-between mt-1.5 text-[10px] text-muted-foreground'>
                                <span>{indexPct}% → Index Portfolio</span>
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
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>AutoIndex Vault</span>
                    </div>
                    <p className='text-xs text-muted-foreground mb-4'>Deposit tokens into the vault. AI splits automatically: {indexPct}% Index, {arbPct}% Arbitrage.</p>

                    <div className='flex rounded-lg bg-secondary/50 p-0.5 mb-4'>
                        <button
                            onClick={() => setDepositTab('deposit')}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${depositTab === 'deposit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setDepositTab('withdraw')}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${depositTab === 'withdraw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Withdraw
                        </button>
                    </div>

                    <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider'>SELECT STABLECOIN</div>
                    <div className='grid grid-cols-3 gap-2 mb-4'>
                        {stablecoins.map(s => (
                            <button
                                key={s.name}
                                onClick={() => setSelectedStable(s.name)}
                                className={`p-3 rounded-lg border text-center transition-all ${selectedStable === s.name
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border/30 bg-secondary/20 hover:border-border/60'
                                    }`}
                            >
                                <div className='text-sm font-bold'>{s.name}</div>
                                <div className='text-[10px] text-muted-foreground'>{s.balance}</div>
                            </button>
                        ))}
                    </div>

                    <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider flex justify-between'>
                        <span>AMOUNT</span>
                        <span>Max: $12,450.00</span>
                    </div>
                    <div className='flex items-center gap-2 bg-secondary/30 border border-border/30 rounded-lg px-3 py-2 mb-3'>
                        <span className='text-muted-foreground text-sm'>$</span>
                        <input
                            type='text'
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder='0.00'
                            className='flex-1 bg-transparent outline-none text-sm font-mono'
                        />
                    </div>

                    {amount && Number(amount) > 0 && (
                        <div className='mb-3 p-3 rounded-lg bg-secondary/20 border border-border/20 text-xs space-y-1'>
                            <div className='text-[10px] uppercase text-muted-foreground mb-1'>Vault will allocate:</div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>→ AI Index Fund ({indexPct}%)</span>
                                <span className='font-mono font-semibold'>${(Number(amount) * indexPct / 100).toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>→ DEX Arbitrage ({arbPct}%)</span>
                                <span className='font-mono font-semibold'>${(Number(amount) * arbPct / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className='grid grid-cols-4 gap-2 mb-4'>
                        {['$100', '$500', '$1,000', '$5,000'].map(a => (
                            <button
                                key={a}
                                onClick={() => setAmount(a.replace('$', '').replace(',', ''))}
                                className='py-1.5 rounded-md bg-secondary/30 border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors'
                            >
                                {a}
                            </button>
                        ))}
                    </div>

                    <Button variant='hero' className='w-full'>
                        {depositTab === 'deposit' ? `Deposit ${selectedStable}` : `Withdraw ${selectedStable}`}
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
                            <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>VAULT PERFORMANCE</span>
                            <div className='flex items-center gap-4 mt-1'>
                                <span className='flex items-center gap-1 text-xs'><span className='h-2 w-2 rounded-full bg-primary inline-block' /> Vault NAV <span className='text-success'>+3.4%</span></span>
                                <span className='flex items-center gap-1 text-xs'><span className='h-2 w-2 rounded-full bg-[hsl(270,70%,60%)] inline-block' /> Arb Engine <span className='text-success'>+8.0%</span></span>
                                <span className='flex items-center gap-1 text-xs'><span className='h-2 w-2 rounded-full bg-muted-foreground inline-block' /> Index <span className='text-success'>+2.5%</span></span>
                            </div>
                        </div>
                        <div className='flex gap-1'>
                            {['1W', '1M', 'ALL'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setChartRange(r)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${chartRange === r ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width='100%' height={240}>
                        <AreaChart data={perfData}>
                            <defs>
                                <linearGradient id='vaultGrad' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='hsl(175, 80%, 50%)' stopOpacity={0.3} />
                                    <stop offset='95%' stopColor='hsl(175, 80%, 50%)' stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id='arbGrad' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='hsl(270, 70%, 60%)' stopOpacity={0.2} />
                                    <stop offset='95%' stopColor='hsl(270, 70%, 60%)' stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray='3 3' stroke='hsl(220, 14%, 16%)' />
                            <XAxis dataKey='date' tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 10']} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 18%, 8%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                            <Area type='monotone' dataKey='vault' stroke='hsl(175, 80%, 50%)' fill='url(#vaultGrad)' strokeWidth={2} name='Vault NAV' />
                            <Area type='monotone' dataKey='arb' stroke='hsl(270, 70%, 60%)' fill='url(#arbGrad)' strokeWidth={1.5} name='Arb Engine' />
                            <Area type='monotone' dataKey='index' stroke='hsl(215, 12%, 50%)' fill='transparent' strokeWidth={1.5} strokeDasharray='4 4' name='Index Fund' />
                        </AreaChart>
                    </ResponsiveContainer>
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
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>AI INDEX HOLDINGS</span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium'>80% of Vault</span>
                    </div>
                    <span className='text-sm font-bold font-mono'>$810.00</span>
                </div>

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
                                {indexHoldings.map(h => (
                                    <tr key={h.asset} className='border-b border-border/10 hover:bg-secondary/20 transition-colors'>
                                        <td className='py-2.5'>
                                            <div className='flex items-center gap-2'>
                                                <div className='h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold' style={{ backgroundColor: h.color + '22', color: h.color }}>
                                                    {h.asset.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className='font-semibold'>{h.asset}</div>
                                                    <div className='text-[10px] text-muted-foreground'>{h.chain}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='py-2.5'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-16 h-1.5 rounded-full bg-secondary/50'>
                                                    <div className='h-full rounded-full' style={{ width: `${(h.weight / 30) * 100}%`, backgroundColor: h.color }} />
                                                </div>
                                                <span className='font-mono'>{h.weight}%</span>
                                            </div>
                                        </td>
                                        <td className='py-2.5 text-right font-mono'>{h.value}</td>
                                        <td className={`py-2.5 text-right font-mono ${h.positive ? 'text-success' : 'text-destructive'}`}>
                                            <span className='inline-flex items-center gap-0.5'>
                                                {h.positive ? <ArrowUpRight className='h-3 w-3' /> : <ArrowDownRight className='h-3 w-3' />}
                                                {h.change24h}
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
                                    <Pie data={indexHoldings} dataKey='weight' nameKey='asset' cx='50%' cy='50%' innerRadius={48} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                                        {indexHoldings.map(h => <Cell key={h.asset} fill={h.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className='absolute inset-0 flex flex-col items-center justify-center'>
                                <span className='text-[10px] text-muted-foreground'>Index</span>
                                <span className='text-lg font-bold'>6</span>
                                <span className='text-[10px] text-muted-foreground'>Assets</span>
                            </div>
                        </div>
                        <div className='mt-2 space-y-0.5'>
                            {indexHoldings.map(h => (
                                <div key={h.asset} className='flex items-center gap-1.5 text-[10px]'>
                                    <div className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: h.color }} />
                                    <span className='text-muted-foreground'>{h.asset}</span>
                                    <span className='font-mono ml-auto'>{h.weight}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='card-glass p-5'
            >
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <Zap className='h-4 w-4 text-[hsl(270,70%,60%)]' />
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>DEX ARBITRAGE ENGINE</span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-[hsl(270,70%,60%)]/10 border border-[hsl(270,70%,60%)]/20 text-[hsl(270,70%,60%)] font-medium'>20% of Vault</span>
                    </div>
                    <div className='text-right'>
                        <div className='text-sm font-bold font-mono'>$224.00</div>
                        <div className='text-[10px] text-success'>+$24.00 profit</div>
                    </div>
                </div>

                <div className='flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/20 border border-border/20 text-xs text-muted-foreground'>
                    <span className='px-2 py-1 rounded bg-secondary/50 text-foreground font-medium'>Scan DEX Prices</span>
                    <span>→</span>
                    <span className='px-2 py-1 rounded bg-secondary/50 text-foreground font-medium'>Find Spread</span>
                    <span>→</span>
                    <span className='px-2 py-1 rounded bg-secondary/50 text-foreground font-medium'>Execute Swap</span>
                    <span>→</span>
                    <span className='px-2 py-1 rounded bg-success/20 text-success font-medium'>Return Profit</span>
                </div>

                <div className='text-[10px] uppercase text-muted-foreground mb-2 tracking-wider'>RECENT ARBITRAGE TRADES</div>
                <div className='space-y-2'>
                    {arbTrades.map((t, i) => (
                        <div key={i} className='flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-border/10 hover:bg-secondary/20 transition-colors'>
                            <div className='h-8 w-8 rounded-lg bg-[hsl(270,70%,60%)]/10 flex items-center justify-center shrink-0'>
                                <ArrowRightLeft className='h-4 w-4 text-[hsl(270,70%,60%)]' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                    <span className='text-xs font-semibold'>{t.type}</span>
                                    <span className='text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success font-mono'>{t.profit}</span>
                                </div>
                                <div className='text-[10px] text-muted-foreground mt-0.5 truncate'>{t.route}</div>
                            </div>
                            <div className='text-right shrink-0'>
                                <div className='text-[10px] text-muted-foreground'>{t.time}</div>
                                <div className='text-[10px] text-success'>{t.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
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
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>RISK PARAMETERS</span>
                    </div>
                    {!editingRisk ? (
                        <button
                            onClick={() => { setTempRiskParams(riskParams); setEditingRisk(true); }}
                            className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors'
                        >
                            <Sliders className='h-3.5 w-3.5' />
                            Customize
                        </button>
                    ) : (
                        <div className='flex items-center gap-2'>
                            <button onClick={handleResetRisk} className='text-[10px] text-muted-foreground hover:text-foreground transition-colors'>Reset Defaults</button>
                            <button onClick={handleCancelRisk} className='p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors'><X className='h-3.5 w-3.5' /></button>
                            <button onClick={handleSaveRisk} className='p-1 rounded hover:bg-primary/20 text-primary transition-colors'><Save className='h-3.5 w-3.5' /></button>
                        </div>
                    )}
                </div>

                <AnimatePresence mode='wait'>
                    {!editingRisk ? (
                        <motion.div key='view' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'>
                            {riskFields.map(f => (
                                <div key={f.key} className='bg-secondary/20 rounded-lg p-3 border border-border/20'>
                                    <div className='text-[10px] uppercase tracking-wider text-muted-foreground mb-1'>{f.label}</div>
                                    <div className='text-lg font-bold font-mono'>
                                        {f.unit === 'x' ? `${riskParams[f.key]}x` : f.unit === '$' ? `$${riskParams[f.key]}` : `${riskParams[f.key]}%`}
                                    </div>
                                    <div className='text-[10px] text-muted-foreground mt-0.5'>{f.desc}</div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key='edit' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {riskFields.map(f => (
                                <div key={f.key} className='bg-secondary/20 rounded-lg p-4 border border-primary/20'>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-xs font-medium'>{f.label}</span>
                                        <span className='text-sm font-bold font-mono text-primary'>
                                            {f.unit === 'x' ? `${tempRiskParams[f.key]}x` : f.unit === '$' ? `$${tempRiskParams[f.key]}` : `${tempRiskParams[f.key]}%`}
                                        </span>
                                    </div>
                                    <div className='text-[10px] text-muted-foreground mb-3'>{f.desc}</div>
                                    <Slider
                                        value={[tempRiskParams[f.key]]}
                                        onValueChange={([v]) => setTempRiskParams(prev => ({ ...prev, [f.key]: v }))}
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                    />
                                    <div className='flex justify-between text-[10px] text-muted-foreground mt-1'>
                                        <span>{f.min}{f.unit}</span>
                                        <span>{f.max}{f.unit}</span>
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
                        <span className='text-xs uppercase tracking-wider text-muted-foreground font-medium'>AI AGENT ACTIVITY</span>
                    </div>
                    <span className='flex items-center gap-1.5 text-xs text-primary font-mono'>
                        <span className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
                        LIVE
                    </span>
                </div>
                <div className='space-y-4'>
                    {agentActivity.map((a, i) => (
                        <div key={i} className='flex gap-3 pb-4 border-b border-border/20 last:border-0 last:pb-0'>
                            <div className='h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5'>
                                <a.icon className='h-4 w-4 text-muted-foreground' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 flex-wrap'>
                                    <span className='text-sm font-semibold'>{a.title}</span>
                                    {a.badge && <span className={`text-xs font-mono ${a.badgeColor}`}>{a.badge}</span>}
                                </div>
                                <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{a.desc}</p>
                                <div className='flex items-center gap-3 mt-2'>
                                    <span className='text-[10px] text-muted-foreground'>{a.time}</span>
                                    <span className={`text-[10px] font-medium ${a.tagColor}`}>{a.tag}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
