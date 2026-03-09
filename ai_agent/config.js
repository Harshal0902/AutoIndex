require('dotenv').config();

const config = {
    port: process.env.PORT || 3001,
    simulationMode: process.env.SIMULATION_MODE !== 'false',

    lifi: {
        apiUrl: 'https://li.quest/v1',
        apiKey: process.env.LIFI_API_KEY || '',
    },

    coingecko: {
        apiUrl: 'https://api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY || '',
    },

    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
    },

    wallet: {
        privateKey: process.env.PRIVATE_KEY || '',
        address: process.env.WALLET_ADDRESS || '',
    },

    chains: {
        ethereum: {
            id: 1,
            name: 'Ethereum',
            rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
            nativeToken: 'ETH',
        },
        arbitrum: {
            id: 42161,
            name: 'Arbitrum',
            rpcUrl: process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc',
            nativeToken: 'ETH',
        },
        base: {
            id: 8453,
            name: 'Base',
            rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
            nativeToken: 'ETH',
        },
        polygon: {
            id: 137,
            name: 'Polygon',
            rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
            nativeToken: 'MATIC',
        },
    },

    tokens: {
        ETH: {
            1: '0x0000000000000000000000000000000000000000',
            42161: '0x0000000000000000000000000000000000000000',
            8453: '0x0000000000000000000000000000000000000000',
        },
        WBTC: {
            1: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            42161: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        },
        USDC: {
            1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        },
        ARB: {
            42161: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        },
        LINK: {
            1: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
            42161: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        },
    },

    vault: {
        targetAllocation: {
            ETH: { weight: 30, preferredChain: 1, coingeckoId: 'ethereum' },
            WBTC: { weight: 20, preferredChain: 1, coingeckoId: 'wrapped-bitcoin' },
            SOL: { weight: 15, preferredChain: null, coingeckoId: 'solana' },
            ARB: { weight: 10, preferredChain: 42161, coingeckoId: 'arbitrum' },
            LINK: { weight: 10, preferredChain: 1, coingeckoId: 'chainlink' },
            USDC: { weight: 15, preferredChain: 1, coingeckoId: 'usd-coin' },
        },
        indexAllocationPct: 80,
        arbAllocationPct: 20,
        rebalanceThresholdPct: 5,
        minArbSpreadPct: 0.3,
        maxArbTradeUsd: 50,
        maxDrawdownPct: 20,
        maxSingleAssetPct: 35,
    },

    intervals: {
        priceRefresh: 30_000,      // 30s
        rebalanceCheck: 300_000,   // 5min
        arbScan: 60_000,           // 1min
        healthCheck: 10_000,       // 10s
    },
};

module.exports = config;
