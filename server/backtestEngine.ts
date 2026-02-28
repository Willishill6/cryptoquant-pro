
import { Candle } from './_core/types';

export interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  totalTrades: number;
  equityCurve: { timestamp: number; value: number }[];
}

export async function runBacktest(
  symbol: string,
  candles: Candle[],
  strategyConfig: any
): Promise<BacktestResult> {
  // 简单的回测逻辑实现
  let balance = 10000;
  let position = 0;
  const equityCurve = [];
  let trades = 0;
  let wins = 0;
  let peak = balance;
  let maxDD = 0;

  // 模拟策略执行
  for (let i = 20; i < candles.length; i++) {
    const currentCandle = candles[i];
    // 这里可以集成 aiStrategyEngine 的逻辑
    // 简化模拟：随机生成一些买卖点
    const signal = Math.random();
    
    if (signal > 0.95 && position === 0) {
      // 买入
      position = balance / currentCandle.close;
      balance = 0;
      trades++;
    } else if (signal < 0.05 && position > 0) {
      // 卖出
      balance = position * currentCandle.close;
      if (balance > 10000) wins++;
      position = 0;
      trades++;
    }

    const currentEquity = balance + (position * currentCandle.close);
    equityCurve.push({ timestamp: currentCandle.timestamp, value: currentEquity });
    
    if (currentEquity > peak) peak = currentEquity;
    const dd = (peak - currentEquity) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  const finalEquity = balance + (position * candles[candles.length - 1].close);
  
  return {
    totalReturn: (finalEquity - 10000) / 10000,
    annualizedReturn: 0.15, // 模拟值
    maxDrawdown: maxDD,
    sharpeRatio: 2.1, // 模拟值
    winRate: trades > 0 ? wins / trades : 0,
    totalTrades: trades,
    equityCurve
  };
}

export async function optimizeParams(strategyId: number) {
  // 模拟参数优化过程
  return {
    optimizedParams: {
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      emaFast: 12,
      emaSlow: 26
    },
    improvement: 0.12
  };
}
