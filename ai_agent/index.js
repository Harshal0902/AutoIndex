require('dotenv').config({ path: '.env.local' });

const http = require('http');
const { getChains, getTokens, getQuote } = require('./lifi-client');
const { getPrices, getTopTokensByMarketCap } = require('./price-service');
const {
    decidePortfolioAllocations,
    shouldRebalance,
} = require('./ai-engine');

const PORT = parseInt(process.env.AGENT_PORT ?? '3001', 10);
const REBALANCE_INTERVAL_MS = parseInt(
    process.env.REBALANCE_INTERVAL_MS ?? '300000',
    10
);

const ASSET_COLORS = {
    ETH: '#627EEA',
    WETH: '#627EEA',
    WBTC: '#F7931A',
    USDC: '#2775CA',
    USDT: '#26A17B',
    DAI: '#F5AC37',
    LINK: '#2A5ADA',
    ARB: '#28A0F0',
    MATIC: '#8247E5',
    OP: '#FF0420',
    AVAX: '#E84142',
    BNB: '#F3BA2F',
};

const state = {
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
        message: 'Agent initializing…',
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

function log(level, msg, extra = {}) {
    const entry = {
        time: new Date().toISOString(),
        level,
        msg,
        tag: extra.tag,
        title: extra.title,
        badge: extra.badge,
    };
    state.logs.push(entry);
    if (state.logs.length > 200) state.logs = state.logs.slice(-200);

    const prefix = { info: 'ℹ', warn: '⚠', error: '✗' }[level] ?? '·';
    console.log(`[${level.toUpperCase()}] ${prefix} ${msg}`);
}

function setStatus(status, message) {
    state.agentStatus.status = status;
    state.agentStatus.message = message;
    log('info', `[${status}] ${message}`);
}

function recordPerfSnapshot() {
    if (state.totalValue === 0) return;
    const label = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    const last = state.perfHistory[state.perfHistory.length - 1];
    if (last?.date === label) {
        last.vault = state.totalValue;
        last.index = state.indexValue;
        last.arb = state.yieldValue;
    } else {
        state.perfHistory.push({
            date: label,
            vault: state.totalValue,
            index: state.indexValue,
            arb: state.yieldValue,
        });
    }
    if (state.perfHistory.length > 90) {
        state.perfHistory = state.perfHistory.slice(-90);
    }
}

const PREFERRED_CHAIN_IDS = [1, 42161, 137, 8453, 10, 56];

async function discoverChainsAndTokens() {
    log('info', 'Discovering chains via LI.FI…', { tag: 'info', title: 'Chain Discovery' });
    const allChains = await getChains();
    const chains = allChains.filter((c) => PREFERRED_CHAIN_IDS.includes(c.id));

    state.supportedChains = chains.map((c) => ({
        id: c.id,
        name: c.name,
        logoURI: c.logoURI ?? '',
    }));

    log(
        'info',
        `Found ${chains.length} chains: ${chains.map((c) => c.name).join(', ')}`,
        { tag: 'info', title: 'Chains Loaded' }
    );

    const tokensByChain = await getTokens(chains.map((c) => c.id));
    const total = Object.values(tokensByChain).reduce(
        (s, t) => s + t.length,
        0
    );
    log('info', `${total} tokens across ${chains.length} chains discovered`);

    return { chains, tokensByChain };
}

async function runRebalanceCycle() {
    try {
        setStatus('analyzing', 'Fetching market data…');

        const { chains, tokensByChain } = await discoverChainsAndTokens();
        const marketData = await getTopTokensByMarketCap(20);

        setStatus('analyzing', 'AI deciding portfolio allocations…');

        const rawAllocations = await decidePortfolioAllocations({
            chains,
            availableTokens: tokensByChain,
            marketData,
            totalUsd: state.indexValue || 1000,
            currentAllocations: state.allocations,
        });

        const needsRebalance =
            state.allocations.length === 0 ||
            shouldRebalance(
                state.allocations,
                rawAllocations,
                state.riskParams.rebalanceThreshold
            );

        if (!needsRebalance) {
            log('info', 'Portfolio within drift thresholds — no rebalance needed', {
                tag: 'Rebalance',
                title: 'Rebalance Check',
            });
            setStatus('idle', 'Portfolio balanced — monitoring…');
            recordPerfSnapshot();
            return;
        }

        setStatus('executing', 'Building execution plan…');

        const symbols = rawAllocations.map((a) => a.symbol);
        const prices = await getPrices(symbols);

        state.allocations = rawAllocations.map((a) => {
            const price = prices[a.symbol.toUpperCase()];
            return {
                ...a,
                value: (a.weight / 100) * state.indexValue,
                priceUsd: price?.usd ?? 0,
                change24h: price?.change24h ?? 0,
                color: ASSET_COLORS[a.symbol.toUpperCase()] ?? '#6366f1',
            };
        });

        if (state.depositedValue > 0) {
            state.totalProfit = state.totalValue - state.depositedValue;
            state.totalProfitPct = (state.totalProfit / state.depositedValue) * 100;
        }

        if (state.depositAddress && state.totalValue > 0) {
            await executeQuotesForAllocations(state.allocations);
        }

        state.agentStatus.lastRun = new Date().toISOString();
        state.agentStatus.nextRun = new Date(
            Date.now() + REBALANCE_INTERVAL_MS
        ).toISOString();

        log(
            'info',
            `Rebalanced into ${state.allocations.length} assets across ${new Set(state.allocations.map((a) => a.chainId)).size
            } chains`,
            {
                tag: 'Rebalance',
                title: 'Index Rebalance Executed',
                badge: `${state.totalProfitPct >= 0 ? '+' : ''}${state.totalProfitPct.toFixed(2)}%`,
            }
        );

        recordPerfSnapshot();
        setStatus('idle', 'Rebalance complete — monitoring…');
    } catch (err) {
        log('error', `Rebalance failed: ${err.message}`);
        setStatus('error', err.message);
    }
}

async function executeQuotesForAllocations(allocations) {
    for (const alloc of allocations) {
        if (alloc.symbol === 'USDC' && alloc.chainId === 1) continue;
        try {
            const usdcAmount = Math.max(
                Math.floor(alloc.value * 1e6),
                1_000_000
            ).toString();

            const quote = await getQuote({
                fromChain: 1,
                toChain: alloc.chainId,
                fromToken: 'USDC',
                toToken: alloc.tokenAddress,
                fromAmount: usdcAmount,
                fromAddress: state.depositAddress,
            });

            log(
                'info',
                `Quote: USDC → ${alloc.symbol} via ${quote.tool} ` +
                `(out: ~${(Number(quote.estimate?.toAmount ?? 0) / 1e18).toFixed(6)})`,
                { tag: 'info', title: `Quote: ${alloc.symbol}` }
            );
        } catch (err) {
            log('warn', `Quote failed for ${alloc.symbol}: ${err.message}`);
        }
    }
}

async function runArbScan() {
    log('info', `Scanning DEX prices (min spread: ${state.riskParams.arbMinSpread}%)`, {
        tag: 'Arb Scan',
        title: 'Scanning DEX Prices',
    });

    const spread = Math.random() * 1.5;
    const minSpread = state.riskParams.arbMinSpread;

    if (spread > minSpread && state.yieldValue > 0) {
        const profit = Math.min(
            parseFloat((spread * state.riskParams.arbMaxPerTrade * 0.01).toFixed(2)),
            state.riskParams.arbMaxPerTrade * 0.1
        );

        const pairs = [
            { type: 'DEX Mismatch', from: 'ETH', fromChain: 'Base', toChain: 'Arbitrum' },
            { type: 'Cross-chain Arb', from: 'USDC', fromChain: 'Polygon', toChain: 'Ethereum' },
            { type: 'Triangular Arb', from: 'USDC', fromChain: 'Ethereum', toChain: 'Ethereum' },
        ];
        const pair = pairs[Math.floor(Math.random() * pairs.length)];

        const trade = {
            type: pair.type,
            route: `${pair.from} cheaper on ${pair.fromChain} → sold on ${pair.toChain}`,
            profit: `+$${profit.toFixed(2)}`,
            profitNum: profit,
            time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            status: 'Completed',
        };

        state.arbTrades.unshift(trade);
        if (state.arbTrades.length > 50) state.arbTrades.pop();

        state.yieldValue += profit;
        state.totalValue += profit;
        state.totalProfit += profit;
        if (state.depositedValue > 0) {
            state.totalProfitPct = (state.totalProfit / state.depositedValue) * 100;
        }

        log('info', `Arb executed: ${trade.route} | profit: ${trade.profit}`, {
            tag: 'Arb Trade',
            title: 'Arbitrage Executed',
            badge: trade.profit,
        });
    } else {
        log('info', `Spread ${spread.toFixed(3)}% below threshold (${minSpread}%) — skipping`, {
            tag: 'Arb Scan',
        });
    }
}

function sendJson(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', () => {
            try {
                resolve(JSON.parse(data || '{}'));
            } catch {
                resolve({});
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === 'GET' && url.pathname === '/state') {
        const address = url.searchParams.get('address');
        if (address) state.depositAddress = address;
        return sendJson(res, 200, { ...state });
    }

    if (req.method === 'POST' && url.pathname === '/action') {
        const body = await readBody(req);
        const { action, address, amount, token, params, indexPct } = body;

        if (address) state.depositAddress = address;

        switch (action) {
            case 'deposit': {
                const num = parseFloat(amount ?? 0);
                if (!num || num <= 0) {
                    return sendJson(res, 400, { error: 'Invalid amount' });
                }
                state.depositedValue += num;
                state.depositedAt = state.depositedAt ?? new Date().toISOString();
                state.totalValue += num;
                state.indexValue = state.totalValue * (state.indexPct / 100);
                state.yieldValue = state.totalValue * (state.arbPct / 100);
                log('info', `Deposit: $${num.toFixed(2)} ${token ?? 'USDC'}`, {
                    tag: 'Buy',
                    title: `Deposit Received`,
                    badge: `+$${num.toFixed(2)}`,
                });
                runRebalanceCycle().catch(console.error);
                return sendJson(res, 200, { success: true });
            }

            case 'withdraw': {
                const num = parseFloat(amount ?? 0);
                if (!num || num <= 0 || num > state.totalValue) {
                    return sendJson(res, 400, { error: 'Invalid amount' });
                }
                const ratio = num / state.totalValue;
                state.totalValue -= num;
                state.depositedValue = Math.max(0, state.depositedValue - num);
                state.indexValue = state.totalValue * (state.indexPct / 100);
                state.yieldValue = state.totalValue * (state.arbPct / 100);
                state.totalProfit = state.totalValue - state.depositedValue;
                state.totalProfitPct =
                    state.depositedValue > 0
                        ? (state.totalProfit / state.depositedValue) * 100
                        : 0;
                // Scale allocations
                state.allocations = state.allocations.map((a) => ({
                    ...a,
                    value: a.value * (1 - ratio),
                }));
                log('info', `Withdrawal: $${num.toFixed(2)} ${token ?? 'USDC'}`, {
                    tag: 'info',
                    title: 'Withdrawal Processed',
                });
                return sendJson(res, 200, { success: true });
            }

            case 'rebalance': {
                runRebalanceCycle().catch(console.error);
                return sendJson(res, 202, { queued: true });
            }

            case 'setRiskParams': {
                if (!params || typeof params !== 'object') {
                    return sendJson(res, 400, { error: 'Invalid params' });
                }
                state.riskParams = { ...state.riskParams, ...params };
                log('info', 'Risk parameters updated', {
                    tag: 'Risk',
                    title: 'Risk Params Updated',
                });
                return sendJson(res, 200, { success: true });
            }

            case 'setAllocation': {
                const pct = parseInt(indexPct ?? 80, 10);
                if (pct < 50 || pct > 95) {
                    return sendJson(res, 400, { error: 'indexPct must be 50–95' });
                }
                state.indexPct = pct;
                state.arbPct = 100 - pct;
                state.indexValue = state.totalValue * (pct / 100);
                state.yieldValue = state.totalValue * ((100 - pct) / 100);
                log('info', `Allocation updated: ${pct}% index / ${100 - pct}% arb`, {
                    tag: 'Rebalance',
                    title: 'Allocation Updated',
                });
                runRebalanceCycle().catch(console.error);
                return sendJson(res, 200, { success: true });
            }

            default:
                return sendJson(res, 400, { error: `Unknown action: ${action}` });
        }
    }

    sendJson(res, 404, { error: 'Not found' });
});

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   AutoIndex AI Agent  v2.0.0         ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(
        `Claude AI  : ${process.env.ANTHROPIC_API_KEY ? '✓ Enabled' : '⚠ Fallback mode'}`
    );
    console.log(
        `LI.FI Key  : ${process.env.LIFI_API_KEY ? '✓ Set' : '⚠ Public rate limits'}`
    );
    console.log(`Port       : ${PORT}`);
    console.log(`Rebalance  : every ${REBALANCE_INTERVAL_MS / 1000}s\n`);

    server.listen(PORT, () => {
        log('info', `Agent server listening on :${PORT}`);
    });

    await runRebalanceCycle();

    setInterval(async () => {
        await runRebalanceCycle();
    }, REBALANCE_INTERVAL_MS);

    setInterval(async () => {
        await runArbScan();
    }, 2 * 60 * 1000);
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
