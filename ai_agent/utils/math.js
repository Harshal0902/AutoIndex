function calcDrift(currentPct, targetPct) {
    return Math.abs(currentPct - targetPct);
}

function calcPortfolioValue(holdings, prices) {
    return Object.entries(holdings).reduce((total, [asset, amount]) => {
        const price = prices[asset] || 0;
        return total + amount * price;
    }, 0);
}

function calcWeights(holdings, prices) {
    const totalValue = calcPortfolioValue(holdings, prices);
    if (totalValue === 0) return {};

    return Object.fromEntries(
        Object.entries(holdings).map(([asset, amount]) => {
            const value = amount * (prices[asset] || 0);
            return [asset, (value / totalValue) * 100];
        })
    );
}

function calcRebalanceTrades(holdings, prices, targetAllocation, totalUsd) {
    const trades = [];
    const currentWeights = calcWeights(holdings, prices);

    for (const [asset, config] of Object.entries(targetAllocation)) {
        const target = config.weight;
        const current = currentWeights[asset] || 0;
        const drift = current - target;

        if (Math.abs(drift) > 0.5) {
            const targetValueUsd = (target / 100) * totalUsd;
            const currentValueUsd = (current / 100) * totalUsd;
            const deltaUsd = targetValueUsd - currentValueUsd;

            trades.push({
                asset,
                action: deltaUsd > 0 ? "BUY" : "SELL",
                deltaUsd: Math.abs(deltaUsd),
                currentWeight: parseFloat(current.toFixed(2)),
                targetWeight: target,
                drift: parseFloat(drift.toFixed(2)),
            });
        }
    }

    return trades.sort((a, b) => b.deltaUsd - a.deltaUsd);
}

module.exports = { calcDrift, calcPortfolioValue, calcWeights, calcRebalanceTrades };