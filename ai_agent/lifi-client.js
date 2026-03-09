const LIFI_API = 'https://li.quest/v1';
const API_KEY = process.env.LIFI_API_KEY || '';

const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'x-lifi-api-key': API_KEY }),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { ...options, headers });

            if (res.status === 429) {
                const wait = Math.pow(2, i) * 1500;
                console.log(`[LI.FI] Rate limited — waiting ${wait}ms`);
                await sleep(wait);
                continue;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(
                    `LI.FI API ${res.status}: ${err.message || res.statusText}`
                );
            }

            return res.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            await sleep(1000 * (i + 1));
        }
    }
}

async function getChains() {
    const data = await fetchWithRetry(
        `${LIFI_API}/chains?chainTypes=EVM`
    );
    return data.chains;
}

async function getTokens(chainIds) {
    const data = await fetchWithRetry(
        `${LIFI_API}/tokens?chains=${chainIds.join(',')}`
    );
    return data.tokens;
}

async function getQuote({
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount,
    fromAddress,
    slippage = 0.005,
}) {
    const url = new URL(`${LIFI_API}/quote`);
    url.searchParams.set('fromChain', fromChain);
    url.searchParams.set('toChain', toChain);
    url.searchParams.set('fromToken', fromToken);
    url.searchParams.set('toToken', toToken);
    url.searchParams.set('fromAmount', fromAmount);
    url.searchParams.set('fromAddress', fromAddress);
    url.searchParams.set('slippage', slippage);
    return fetchWithRetry(url.toString());
}

async function getRoutes({
    fromChainId,
    toChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    fromAddress,
}) {
    return fetchWithRetry(`${LIFI_API}/advanced/routes`, {
        method: 'POST',
        body: JSON.stringify({
            fromChainId,
            toChainId,
            fromTokenAddress,
            toTokenAddress,
            fromAmount,
            fromAddress,
            options: { slippage: 0.005, order: 'RECOMMENDED' },
        }),
    });
}

async function pollStatus(txHash, bridge, fromChain, toChain, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        const status = await fetchWithRetry(
            `${LIFI_API}/status?txHash=${txHash}&bridge=${bridge}&fromChain=${fromChain}&toChain=${toChain}`
        );

        if (status.status === 'DONE') return { success: true, status };
        if (status.status === 'FAILED') return { success: false, status };

        await sleep(10_000);
    }
    throw new Error('Status polling timeout');
}

module.exports = { getChains, getTokens, getQuote, getRoutes, pollStatus };
