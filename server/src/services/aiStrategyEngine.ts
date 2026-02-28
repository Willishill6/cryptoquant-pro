import { Candle, Signal, Strategy } from "./types";

export class AiStrategyEngine {
  private strategies: Strategy[] = [];

  constructor() {
    // Initialize with some basic strategies as per context description
    // Trend Following
    this.strategies.push({
      id: "trend_following",
      name: "趋势跟踪",
      description: "基于移动平均线的趋势跟踪策略",
      parameters: { shortPeriod: 10, longPeriod: 30 },
      execute: (candles: Candle[]): Signal => {
        if (candles.length < 30) return Signal.HOLD;
        const closes = candles.map(c => c.close);
        const shortMA = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
        const longMA = closes.slice(-30).reduce((a, b) => a + b, 0) / 30;
        if (shortMA > longMA) return Signal.BUY;
        if (shortMA < longMA) return Signal.SELL;
        return Signal.HOLD;
      },
    });

    // Mean Reversion
    this.strategies.push({
      id: "mean_reversion",
      name: "均值回归",
      description: "基于布林带的均值回归策略",
      parameters: { period: 20, stdDev: 2 },
      execute: (candles: Candle[]): Signal => {
        if (candles.length < 20) return Signal.HOLD;
        const closes = candles.map(c => c.close);
        const lastClose = closes[closes.length - 1];
        const sma = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const stdDev = Math.sqrt(closes.slice(-20).map(x => Math.pow(x - sma, 2)).reduce((a, b) => a + b, 0) / 20);
        const upperBand = sma + stdDev * 2;
        const lowerBand = sma - stdDev * 2;

        if (lastClose < lowerBand) return Signal.BUY;
        if (lastClose > upperBand) return Signal.SELL;
        return Signal.HOLD;
      },
    });

    // Breakout
    this.strategies.push({
      id: "breakout",
      name: "突破策略",
      description: "基于价格突破的策略",
      parameters: { lookbackPeriod: 20 },
      execute: (candles: Candle[]): Signal => {
        if (candles.length < 20) return Signal.HOLD;
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const lastClose = closes[closes.length - 1];
        const highestHigh = Math.max(...highs.slice(-20, -1));
        const lowestLow = Math.min(...lows.slice(-20, -1));

        if (lastClose > highestHigh) return Signal.BUY;
        if (lastClose < lowestLow) return Signal.SELL;
        return Signal.HOLD;
      },
    });

    // Ensemble Voting (simplified)
    this.strategies.push({
      id: "ensemble_voting",
      name: "集成投票",
      description: "多种策略的集成投票",
      parameters: {}, // No specific parameters for this simplified version
      execute: (candles: Candle[]): Signal => {
        const signals = this.strategies.slice(0, 3).map(s => s.execute(candles)); // Use first 3 strategies
        const buyVotes = signals.filter(s => s === Signal.BUY).length;
        const sellVotes = signals.filter(s => s === Signal.SELL).length;

        if (buyVotes > sellVotes) return Signal.BUY;
        if (sellVotes > buyVotes) return Signal.SELL;
        return Signal.HOLD;
      },
    });
  }

  public getStrategies(): Strategy[] {
    return this.strategies;
  }

  public getStrategyById(id: string): Strategy | undefined {
    return this.strategies.find(s => s.id === id);
  }

  public executeStrategy(strategyId: string, candles: Candle[]): Signal {
    const strategy = this.getStrategyById(strategyId);
    if (!strategy) {
      throw new Error(`Strategy with ID ${strategyId} not found.`);
    }
    return strategy.execute(candles);
  }
}
