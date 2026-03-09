const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

async function decidePortfolioAllocations(context) {
    const { chains, availableTokens, marketData, totalUsd, currentAllocations } =
        context;

    const chainSummary = chains
        .slice(0, 10)
        .map((c) => `${c.name} (chainId: ${c.id})`)
        .join(', ');

    const topMarket = marketData
        .slice(0, 15)
        .map(
            (t) =>
                `${t.symbol.toUpperCase()}: $${t.current_price?.toFixed(2) ?? '?'} ` +
                `(mcap rank #${t.market_cap_rank}, 24h: ${t.price_change_percentage_24h?.toFixed(1) ?? '?'}%)`
        )
        .join('\n');

    const prompt = `You are an AI portfolio manager for AutoIndex, a cross-chain crypto index fund.

## Available Infrastructure
Chains available via LI.FI: ${chainSummary}

## Current Market Data (top assets by market cap)
${topMarket}

## Portfolio Context
Total portfolio value: $${totalUsd.toFixed(2)}
Current allocations: ${currentAllocations.length > 0
            ? JSON.stringify(currentAllocations.map((a) => ({
                symbol: a.symbol,
                weight: a.weight,
                chainId: a.chainId,
            })))
            : 'None (new portfolio)'
        }

## Your Task
Create an optimal diversified index portfolio allocation. Requirements:
- Use ONLY tokens available on the listed LI.FI chains
- Weights must sum to exactly 100
- Include 5-8 assets
- At least 15% in stablecoins (USDC/DAI/USDT) for stability
- Spread across at least 2-3 different chains
- Prefer assets with strong market cap and liquidity
- Consider recent 24h performance trends
- 80% of funds go to index, 20% to yield (handled separately)

Respond with ONLY valid JSON, no explanation:
{
  'reasoning': 'brief 1-2 sentence explanation',
  'allocations': [
    {
      'symbol': 'ETH',
      'name': 'Ethereum',
      'weight': 30,
      'chainId': 1,
      'chainName': 'Ethereum',
      'tokenAddress': '0x0000000000000000000000000000000000000000'
    }
  ]
}`;

    if (ANTHROPIC_KEY) {
        try {
            const res = await fetch(CLAUDE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.content[0]?.text ?? '';
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('[AI] Reasoning:', parsed.reasoning);
                    return parsed.allocations;
                }
            }
        } catch (err) {
            console.warn('[AI] Claude API failed, using fallback:', err.message);
        }
    }

    return buildRuleBasedPortfolio(chains, availableTokens, marketData);
}

function buildRuleBasedPortfolio(chains, availableTokens, marketData) {
    const PREFERRED = [
        { symbol: 'ETH', chainId: 1, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'WBTC', chainId: 1, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
        { symbol: 'USDC', chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { symbol: 'LINK', chainId: 1, address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
        { symbol: 'ARB', chainId: 42161, address: '0x912ce59144191c1204e64559fe8253a0e49e6548' },
        { symbol: 'MATIC', chainId: 137, address: '0x0000000000000000000000000000000000001010' },
        { symbol: 'DAI', chainId: 1, address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    ];

    const chainIds = new Set(chains.map((c) => c.id));
    const weights = [28, 22, 18, 12, 8, 7, 5];

    return PREFERRED.filter((t) => chainIds.has(t.chainId))
        .slice(0, 7)
        .map((t, i) => ({
            symbol: t.symbol,
            name: t.symbol,
            weight: weights[i] ?? 5,
            chainId: t.chainId,
            chainName: chains.find((c) => c.id === t.chainId)?.name ?? 'Unknown',
            tokenAddress: t.address,
        }));
}

function shouldRebalance(current, target, driftThreshold = 5) {
    for (const targetAlloc of target) {
        const currentAlloc = current.find((c) => c.symbol === targetAlloc.symbol);
        const currentWeight = currentAlloc?.weight ?? 0;
        const drift = Math.abs(currentWeight - targetAlloc.weight);
        if (drift > driftThreshold) return true;
    }
    return false;
}

module.exports = { decidePortfolioAllocations, shouldRebalance };
