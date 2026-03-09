const axios = require('axios');
const config = require('./config');
const logger = require('./utils/logger');

const lifiClient = axios.create({
    baseURL: config.lifi.apiUrl,
    headers: {
        'x-lifi-api-key': config.lifi.apiKey,
        'Content-Type': 'application/json',
    },
    timeout: 15_000,
});

async function getTokens(chainIds = [1, 42161, 8453, 137]) {
    try {
        const { data } = await lifiClient.get('/tokens', {
            params: { chains: chainIds.join(',') },
        });
        return data.tokens;
    } catch (err) {
        logger.error(`LI.FI getTokens error: ${err.message}`);
        return {};
    }
}

async function getQuote({
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    fromAddress,
}) {
    try {
        const { data } = await lifiClient.get('/quote', {
            params: {
                fromChain,
                toChain,
                fromToken,
                toToken,
                fromAmount,
                fromAddress,
                slippage: 0.005,
                allowBridges: 'lifi,across,hop,stargate',
            },
        });
        return data;
    } catch (err) {
        logger.error(`LI.FI getQuote error: ${err.message}`);
        return null;
    }
}

async function getRoutes({
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    fromAddress,
    options = {},
}) {
    try {
        const { data } = await lifiClient.post('/advanced/routes', {
            fromChainId,
            toChainId,
            fromTokenAddress,
            toTokenAddress,
            fromAmount,
            fromAddress,
            options: {
                slippage: 0.005,
                allowSwitchChain: true,
                ...options,
            },
        });
        return data.routes || [];
    } catch (err) {
        logger.error(`LI.FI getRoutes error: ${err.message}`);
        return [];
    }
}

async function getTxStatus({ txHash, bridge, fromChain, toChain }) {
    try {
        const { data } = await lifiClient.get('/status', {
            params: { txHash, bridge, fromChain, toChain },
        });
        return data;
    } catch (err) {
        logger.error(`LI.FI getTxStatus error: ${err.message}`);
        return null;
    }
}

async function getTokenPrices(chainId, tokenAddresses) {
    try {
        const { data } = await lifiClient.get(`/token`, {
            params: { chain: chainId, token: tokenAddresses[0] },
        });
        return data;
    } catch (err) {
        logger.error(`LI.FI getTokenPrices error: ${err.message}`);
        return null;
    }
}

async function getPriceSpread(asset, fromChain, toChain, amountUsd = 100) {
    try {
        const fromToken = 'USDC';
        const amountIn = (amountUsd * 1e6).toString();

        const [quoteA, quoteB] = await Promise.all([
            getQuote({
                fromChain,
                toChain: fromChain,
                fromToken,
                toToken: asset,
                fromAmount: amountIn,
                fromAddress: config.wallet.address || '0x0000000000000000000000000000000000000001',
            }),
            getQuote({
                fromChain: toChain,
                toChain,
                fromToken,
                toToken: asset,
                fromAmount: amountIn,
                fromAddress: config.wallet.address || '0x0000000000000000000000000000000000000001',
            }),
        ]);

        if (!quoteA || !quoteB) return null;

        const priceA = parseFloat(quoteA.estimate?.toAmountUSD || 0);
        const priceB = parseFloat(quoteB.estimate?.toAmountUSD || 0);
        if (!priceA || !priceB) return null;

        const spread = Math.abs((priceA - priceB) / Math.min(priceA, priceB)) * 100;
        const cheaperChain = priceA > priceB ? toChain : fromChain;
        const expensiveChain = priceA > priceB ? fromChain : toChain;

        return { asset, spread, cheaperChain, expensiveChain, priceA, priceB };
    } catch (err) {
        logger.error(`getPriceSpread error: ${err.message}`);
        return null;
    }
}

module.exports = {
    getTokens,
    getQuote,
    getRoutes,
    getTxStatus,
    getTokenPrices,
    getPriceSpread,
};