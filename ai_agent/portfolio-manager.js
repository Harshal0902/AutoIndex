class PortfolioManager {
    constructor() {
        this.state = {
            totalValue: 0,
            indexValue: 0,
            yieldValue: 0,
            allocations: [],
            agentStatus: {
                status: 'idle',
                lastRun: null,
                nextRun: null,
                message: 'Agent initializing...',
            },
            supportedChains: [],
            logs: [],
            depositAddress: '',
            deposits: [],
        };
    }

    log(level, msg) {
        const entry = { time: new Date().toISOString(), level, msg };
        this.state.logs.push(entry);
        if (this.state.logs.length > 100) {
            this.state.logs = this.state.logs.slice(-100);
        }
        const prefix = { info: 'ℹ', warn: '⚠', error: '✗' }[level] ?? '·';
        console.log(`[${level.toUpperCase()}] ${prefix} ${msg}`);
    }

    setStatus(status, message) {
        this.state.agentStatus.status = status;
        this.state.agentStatus.message = message;
        this.log('info', `Status → ${status}: ${message}`);
    }

    updateAllocations(allocations, prices) {
        this.state.allocations = allocations.map((a) => {
            const price = prices[a.symbol.toUpperCase()];
            const value =
                (a.weight / 100) * this.state.indexValue;
            return {
                ...a,
                value,
                priceUsd: price?.usd ?? 0,
                change24h: price?.change24h ?? 0,
            };
        });
    }

    recordRebalance(allocations) {
        this.state.agentStatus.lastRun = new Date().toISOString();
        const next = new Date(Date.now() + 5 * 60 * 1000);
        this.state.agentStatus.nextRun = next.toISOString();
        this.log(
            'info',
            `Rebalanced into ${allocations.length} assets across ${new Set(allocations.map((a) => a.chainId)).size
            } chains`
        );
    }

    deposit(amountUsd) {
        this.state.deposits.push({ amount: amountUsd, time: new Date().toISOString() });
        this.state.totalValue += amountUsd;
        this.state.indexValue = this.state.totalValue * 0.8;
        this.state.yieldValue = this.state.totalValue * 0.2;
        this.log('info', `Deposit detected: $${amountUsd.toFixed(2)}`);
    }

    getState() {
        return { ...this.state };
    }
}

module.exports = PortfolioManager;
