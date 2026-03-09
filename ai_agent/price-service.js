const CG_API = 'https://api.coingecko.com/api/v3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYMBOL_TO_CG_ID = {
    ETH: 'ethereum',
    WETH: 'weth',
    WBTC: 'wrapped-bitcoin',
    BTC: 'bitcoin',
    USDC: 'usd-coin',
    USDT: 'tether',
    DAI: 'dai',
    MATIC: 'matic-network',
    ARB: 'arbitrum',
    OP: 'optimism',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    SOL: 'solana',
    AVAX: 'avalanche-2',
    BNB: 'binancecoin',
};

async function getPrices(symbols) {
    const ids = symbols
        .map((s) => SYMBOL_TO_CG_ID[s.toUpperCase()])
        .filter(Boolean)
        .join(',');

    if (!ids) return {};

    try {
        const res = await fetch(
            `${CG_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) throw new Error('CoinGecko error');
        const data = await res.json();

        const result = {};
        for (const symbol of symbols) {
            const id = SYMBOL_TO_CG_ID[symbol.toUpperCase()];
            if (id && data[id]) {
                result[symbol.toUpperCase()] = {
                    usd: data[id].usd,
                    change24h: data[id].usd_24h_change ?? 0,
                };
            }
        }
        return result;
    } catch (err) {
        console.error('[Prices] Failed to fetch prices:', err.message);
        return {};
    }
}

async function getTopTokensByMarketCap(limit = 20) {
    await sleep(300);
    try {
        const res = await fetch(
            `${CG_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
        );
        if (!res.ok) throw new Error('CoinGecko markets error');
        return res.json();
    } catch (err) {
        console.error('[Prices] Failed to fetch market data:', err.message);
        return [];
    }
}

module.exports = { getPrices, getTopTokensByMarketCap };
