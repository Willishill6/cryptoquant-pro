import { Candle, Signal, Strategy } from "./types";
import { AiStrategyEngine } from "./aiStrategyEngine";

interface BacktestResult {
  equityCurve: { timestamp: number; value: number }[];
  pnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
}

export class BacktestEngine {
  private historicalData: Candle[];
  private aiStrategyEngine: AiStrategyEngine;

  constructor(historicalData: Candle[], aiStrategyEngine: AiStrategyEngine) {
    this.historicalData = historicalData;
    this.aiStrategyEngine = aiStrategyEngine;
  }

  public runBacktest(strategyId: string, initialCapital: number): BacktestResult {
    let currentCapital = initialCapital;
    const equityCurve: { timestamp: number; value: number }[] = [];
    let peakCapital = initialCapital;
    let maxDrawdown = 0;
    let trades = 0;
    let wins = 0;
    let losses = 0;
    let position = 0; // 0: no position, 1: long, -1: short
    let entryPrice = 0;

    const strategy = this.aiStrategyEngine.getStrategyById(strategyId);
    if (!strategy) {
      throw new Error(`Strategy with ID ${strategyId} not found.`);
    }

    for (let i = 0; i < this.historicalData.length; i++) {
      const currentCandle = this.historicalData[i];
      const historicalSlice = this.historicalData.slice(0, i + 1);

      const signal = strategy.execute(historicalSlice);

      // Update equity curve at each step
      let currentEquity = currentCapital;
      if (position !== 0) {
        currentEquity = currentCapital + position * (currentCandle.close - entryPrice);
      }
      equityCurve.push({ timestamp: currentCandle.timestamp, value: currentEquity });

      if (signal === Signal.BUY && position === 0) {
        // Enter long position
        position = currentCapital / currentCandle.close; // Simplified: use all capital
        entryPrice = currentCandle.close;
        currentCapital = 0; // Capital is now in position
        trades++;
      } else if (signal === Signal.SELL && position === 0) {
        // Enter short position (simplified: assume we can short with initial capital)
        position = - (initialCapital / currentCandle.close); // Simplified: short with initial capital value
        entryPrice = currentCandle.close;
        currentCapital = initialCapital * 2; // Assume margin for short selling
        trades++;
      } else if (signal === Signal.SELL && position > 0) {
        // Close long position
        const profit = (currentCandle.close - entryPrice) * position;
        currentCapital += (position * currentCandle.close);
        if (profit > 0) wins++; else losses++;
        position = 0;
        entryPrice = 0;
      } else if (signal === Signal.BUY && position < 0) {
        // Close short position
        const profit = (entryPrice - currentCandle.close) * Math.abs(position);
        currentCapital += (Math.abs(position) * entryPrice) + profit; // Recover initial capital + profit
        if (profit > 0) wins++; else losses++;
        position = 0;
        entryPrice = 0;
      }

      // Calculate max drawdown
      if (currentEquity > peakCapital) {
        peakCapital = currentEquity;
      }
      const drawdown = (peakCapital - currentEquity) / peakCapital;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Close any open positions at the end of backtest
    if (position !== 0) {
      if (position > 0) { // Long position
        const profit = (this.historicalData[this.historicalData.length - 1].close - entryPrice) * position;
        currentCapital += (position * this.historicalData[this.historicalData.length - 1].close);
        if (profit > 0) wins++; else losses++;
      } else { // Short position
        const profit = (entryPrice - this.historicalData[this.historicalData.length - 1].close) * Math.abs(position);
        currentCapital += (Math.abs(position) * entryPrice) + profit; // Recover initial capital + profit
        if (profit > 0) wins++; else losses++;
      }
    }

    const pnl = currentCapital - initialCapital;
    const winRate = trades > 0 ? wins / trades : 0;

    // Simplified Sharpe Ratio calculation (needs more data for proper calculation)
    const returns = equityCurve.map((eq, idx, arr) => idx === 0 ? 0 : (eq.value - arr[idx - 1].value) / arr[idx - 1].value);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDevReturn = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpeRatio = stdDevReturn !== 0 ? avgReturn / stdDevReturn * Math.sqrt(252) : 0; // Assuming daily data, 252 trading days

    return {
      equityCurve,
      pnl,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades: trades,
    };
  }
}
