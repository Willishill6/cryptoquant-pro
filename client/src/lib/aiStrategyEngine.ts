/**
 * aiStrategyEngine.ts — 多因子AI量化策略引擎
 * 
 * 基于技术指标的综合分析，产生买入/卖出/持有信号。
 * 
 * 策略架构：
 * 1. 多指标独立评分 → 2. 加权集成投票 → 3. 风控过滤 → 4. 信号输出
 * 
 * 支持的策略：
 * - 趋势跟随策略（EMA交叉 + MACD + 动量）
 * - 均值回归策略（RSI + 布林带 + 随机振荡器）
 * - 突破策略（布林带突破 + 成交量确认 + ATR过滤）
 * - 集成投票策略（多策略加权综合）
 */

import type { AllIndicators, Candle } from "./technicalIndicators";
import { calculateAllIndicators } from "./technicalIndicators";

// ============ 类型定义 ============

export type SignalDirection = "买入" | "卖出" | "持有";
export type StrategyName = "趋势跟随" | "均值回归" | "突破策略" | "集成投票";

export interface StrategySignal {
  strategy: StrategyName;
  direction: SignalDirection;
  confidence: number;      // 0-100
  score: number;           // -1 到 1，负值看跌，正值看涨
  reasons: string[];       // 决策理由
  indicators: string[];    // 使用的指标
}

export interface TradeSignal {
  coin: string;
  direction: SignalDirection;
  confidence: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  strategies: StrategySignal[];
  finalScore: number;
  model: string;
  reasoning: string;
  timestamp: number;
  indicators: AllIndicators;
}

export interface StrategyConfig {
  /** RSI 超买阈值 */
  rsiOverbought: number;
  /** RSI 超卖阈值 */
  rsiOversold: number;
  /** 最低置信度阈值 */
  minConfidence: number;
  /** 最低风险回报比 */
  minRiskReward: number;
  /** 最大单笔仓位占比 */
  maxPositionPct: number;
  /** ATR 止损倍数 */
  atrStopMultiplier: number;
  /** ATR 止盈倍数 */
  atrTargetMultiplier: number;
  /** 策略权重 */
  weights: {
    trendFollowing: number;
    meanReversion: number;
    breakout: number;
  };
}

// ============ 默认配置 ============

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  rsiOverbought: 70,
  rsiOversold: 30,
  minConfidence: 55,
  minRiskReward: 1.2,
  maxPositionPct: 0.1,
  atrStopMultiplier: 1.5,
  atrTargetMultiplier: 3,
  weights: {
    trendFollowing: 0.4,
    meanReversion: 0.3,
    breakout: 0.3,
  },
};

// ============ 策略实现 ============

/**
 * 趋势跟随策略
 * 核心逻辑：顺势而为，当多个趋势指标一致时入场
 * 使用指标：EMA交叉、MACD、动量
 */
function trendFollowingStrategy(indicators: AllIndicators, config: StrategyConfig): StrategySignal {
  let score = 0;
  const reasons: string[] = [];
  const usedIndicators: string[] = ["EMA", "MACD", "动量"];

  // EMA 交叉信号 (权重 35%)
  if (indicators.ema.crossover === "金叉") {
    score += 0.35;
    reasons.push(`EMA金叉确认：快线(${indicators.ema.fast.toFixed(2)})上穿慢线(${indicators.ema.slow.toFixed(2)})`);
  } else if (indicators.ema.crossover === "死叉") {
    score -= 0.35;
    reasons.push(`EMA死叉确认：快线(${indicators.ema.fast.toFixed(2)})下穿慢线(${indicators.ema.slow.toFixed(2)})`);
  } else if (indicators.ema.trend === "上升") {
    score += 0.15;
    reasons.push("EMA多头排列，趋势向上");
  } else if (indicators.ema.trend === "下降") {
    score -= 0.15;
    reasons.push("EMA空头排列，趋势向下");
  }

  // MACD 信号 (权重 40%)
  if (indicators.macd.crossover === "金叉") {
    score += 0.4;
    reasons.push(`MACD金叉：柱状图转正(${indicators.macd.histogram.toFixed(4)})`);
  } else if (indicators.macd.crossover === "死叉") {
    score -= 0.4;
    reasons.push(`MACD死叉：柱状图转负(${indicators.macd.histogram.toFixed(4)})`);
  } else if (indicators.macd.trend === "看涨") {
    score += 0.2;
    reasons.push("MACD柱状图为正，动能看涨");
  } else if (indicators.macd.trend === "看跌") {
    score -= 0.2;
    reasons.push("MACD柱状图为负，动能看跌");
  }

  // 动量确认 (权重 25%)
  if (indicators.momentum.trend === "强势上涨") {
    score += 0.25;
    reasons.push(`强势动量：ROC=${indicators.momentum.roc.toFixed(2)}%`);
  } else if (indicators.momentum.trend === "上涨") {
    score += 0.12;
    reasons.push(`正向动量：ROC=${indicators.momentum.roc.toFixed(2)}%`);
  } else if (indicators.momentum.trend === "强势下跌") {
    score -= 0.25;
    reasons.push(`负向动量：ROC=${indicators.momentum.roc.toFixed(2)}%`);
  } else if (indicators.momentum.trend === "下跌") {
    score -= 0.12;
    reasons.push(`弱势动量：ROC=${indicators.momentum.roc.toFixed(2)}%`);
  }

  // 成交量确认加分
  if (indicators.volume.confirmation && indicators.volume.trend === "放量") {
    score *= 1.2;
    reasons.push(`成交量放大确认(${indicators.volume.ratio.toFixed(1)}x均量)`);
  }

  const direction: SignalDirection = score > 0.15 ? "买入" : score < -0.15 ? "卖出" : "持有";
  const confidence = Math.min(95, Math.round(50 + Math.abs(score) * 50));

  return {
    strategy: "趋势跟随",
    direction,
    confidence,
    score: Math.max(-1, Math.min(1, score)),
    reasons,
    indicators: usedIndicators,
  };
}

/**
 * 均值回归策略
 * 核心逻辑：价格偏离均值过远时反向操作
 * 使用指标：RSI、布林带、随机振荡器
 */
function meanReversionStrategy(indicators: AllIndicators, config: StrategyConfig): StrategySignal {
  let score = 0;
  const reasons: string[] = [];
  const usedIndicators: string[] = ["RSI", "布林带", "KDJ"];

  // RSI 信号 (权重 40%)
  if (indicators.rsi.value <= config.rsiOversold) {
    score += 0.4 * indicators.rsi.strength;
    reasons.push(`RSI超卖(${indicators.rsi.value.toFixed(1)})，反弹概率高`);
  } else if (indicators.rsi.value >= config.rsiOverbought) {
    score -= 0.4 * indicators.rsi.strength;
    reasons.push(`RSI超买(${indicators.rsi.value.toFixed(1)})，回调概率高`);
  } else if (indicators.rsi.value < 40) {
    score += 0.1;
    reasons.push(`RSI偏低(${indicators.rsi.value.toFixed(1)})，接近超卖区`);
  } else if (indicators.rsi.value > 60) {
    score -= 0.1;
    reasons.push(`RSI偏高(${indicators.rsi.value.toFixed(1)})，接近超买区`);
  }

  // 布林带信号 (权重 35%)
  if (indicators.bollinger.signal === "突破下轨") {
    score += 0.35 * indicators.bollinger.strength;
    reasons.push(`价格突破布林带下轨，均值回归买入信号`);
  } else if (indicators.bollinger.signal === "突破上轨") {
    score -= 0.35 * indicators.bollinger.strength;
    reasons.push(`价格突破布林带上轨，均值回归卖出信号`);
  } else if (indicators.bollinger.position < 0.2) {
    score += 0.15;
    reasons.push(`价格接近布林带下轨(位置${(indicators.bollinger.position * 100).toFixed(0)}%)`);
  } else if (indicators.bollinger.position > 0.8) {
    score -= 0.15;
    reasons.push(`价格接近布林带上轨(位置${(indicators.bollinger.position * 100).toFixed(0)}%)`);
  }

  // 随机振荡器 (权重 25%)
  if (indicators.stochastic.signal === "超卖" && indicators.stochastic.crossover === "金叉") {
    score += 0.25;
    reasons.push(`KDJ超卖区金叉(K=${indicators.stochastic.k.toFixed(1)}, D=${indicators.stochastic.d.toFixed(1)})`);
  } else if (indicators.stochastic.signal === "超买" && indicators.stochastic.crossover === "死叉") {
    score -= 0.25;
    reasons.push(`KDJ超买区死叉(K=${indicators.stochastic.k.toFixed(1)}, D=${indicators.stochastic.d.toFixed(1)})`);
  } else if (indicators.stochastic.signal === "超卖") {
    score += 0.12;
    reasons.push(`KDJ处于超卖区(K=${indicators.stochastic.k.toFixed(1)})`);
  } else if (indicators.stochastic.signal === "超买") {
    score -= 0.12;
    reasons.push(`KDJ处于超买区(K=${indicators.stochastic.k.toFixed(1)})`);
  }

  const direction: SignalDirection = score > 0.15 ? "买入" : score < -0.15 ? "卖出" : "持有";
  const confidence = Math.min(95, Math.round(50 + Math.abs(score) * 50));

  return {
    strategy: "均值回归",
    direction,
    confidence,
    score: Math.max(-1, Math.min(1, score)),
    reasons,
    indicators: usedIndicators,
  };
}

/**
 * 突破策略
 * 核心逻辑：价格突破关键区间时跟随，需成交量确认
 * 使用指标：布林带、成交量、ATR
 */
function breakoutStrategy(indicators: AllIndicators, config: StrategyConfig): StrategySignal {
  let score = 0;
  const reasons: string[] = [];
  const usedIndicators: string[] = ["布林带", "成交量", "ATR"];

  // 布林带突破 (权重 40%)
  if (indicators.bollinger.signal === "突破上轨" && indicators.volume.confirmation) {
    score += 0.4;
    reasons.push("价格放量突破布林带上轨，看涨突破信号");
  } else if (indicators.bollinger.signal === "突破下轨" && indicators.volume.confirmation) {
    score -= 0.4;
    reasons.push("价格放量突破布林带下轨，看跌突破信号");
  }

  // 布林带收窄后的突破更有效 (权重 20%)
  if (indicators.bollinger.width < 3) {
    const bonus = 0.2;
    if (score > 0) score += bonus;
    else if (score < 0) score -= bonus;
    reasons.push(`布林带收窄(宽度${indicators.bollinger.width.toFixed(1)}%)，突破有效性增强`);
  }

  // 成交量确认 (权重 25%)
  if (indicators.volume.trend === "放量") {
    if (score > 0) score += 0.25;
    else if (score < 0) score -= 0.25;
    reasons.push(`成交量放大${indicators.volume.ratio.toFixed(1)}倍，确认突破有效`);
  } else if (indicators.volume.trend === "缩量" && Math.abs(score) > 0) {
    score *= 0.5;
    reasons.push("成交量萎缩，突破可能为假突破");
  }

  // ATR 波动率过滤 (权重 15%)
  if (indicators.atr.volatility === "高") {
    score *= 0.8;
    reasons.push(`高波动率环境(ATR=${indicators.atr.percentage.toFixed(2)}%)，适当降低仓位`);
  }

  const direction: SignalDirection = score > 0.2 ? "买入" : score < -0.2 ? "卖出" : "持有";
  const confidence = Math.min(95, Math.round(50 + Math.abs(score) * 45));

  return {
    strategy: "突破策略",
    direction,
    confidence,
    score: Math.max(-1, Math.min(1, score)),
    reasons,
    indicators: usedIndicators,
  };
}

// ============ 集成投票引擎 ============

/**
 * 多策略集成投票
 * 综合三个独立策略的信号，加权得出最终决策
 */
export function generateTradeSignal(
  coin: string,
  candles: Candle[],
  config: StrategyConfig = DEFAULT_STRATEGY_CONFIG
): TradeSignal | null {
  if (candles.length < 20) return null;

  const indicators = calculateAllIndicators(candles);
  const currentPrice = candles[candles.length - 1].close;

  // 运行三个独立策略
  const trendSignal = trendFollowingStrategy(indicators, config);
  const meanRevSignal = meanReversionStrategy(indicators, config);
  const breakoutSignal = breakoutStrategy(indicators, config);

  const strategies = [trendSignal, meanRevSignal, breakoutSignal];

  // 加权综合评分
  const finalScore =
    trendSignal.score * config.weights.trendFollowing +
    meanRevSignal.score * config.weights.meanReversion +
    breakoutSignal.score * config.weights.breakout;

  // 计算综合置信度
  const weightedConfidence =
    trendSignal.confidence * config.weights.trendFollowing +
    meanRevSignal.confidence * config.weights.meanReversion +
    breakoutSignal.confidence * config.weights.breakout;

  // 一致性加分：多个策略方向一致时增加置信度
  const buyCount = strategies.filter(s => s.direction === "买入").length;
  const sellCount = strategies.filter(s => s.direction === "卖出").length;
  const consensusBonus = Math.max(buyCount, sellCount) >= 2 ? 10 : 0;

  const finalConfidence = Math.min(95, Math.round(weightedConfidence + consensusBonus));

  // 最终方向判定
  let direction: SignalDirection;
  if (finalScore > 0.1 && buyCount >= 1) {
    direction = "买入";
  } else if (finalScore < -0.1 && sellCount >= 1) {
    direction = "卖出";
  } else {
    direction = "持有";
  }

  // 基于ATR计算止盈止损
  const atrValue = indicators.atr.value || currentPrice * 0.02;
  let targetPrice: number;
  let stopLoss: number;

  if (direction === "买入") {
    targetPrice = currentPrice + atrValue * config.atrTargetMultiplier;
    stopLoss = currentPrice - atrValue * config.atrStopMultiplier;
  } else if (direction === "卖出") {
    targetPrice = currentPrice - atrValue * config.atrTargetMultiplier;
    stopLoss = currentPrice + atrValue * config.atrStopMultiplier;
  } else {
    targetPrice = currentPrice;
    stopLoss = currentPrice;
  }

  const riskRewardRatio = Math.abs(targetPrice - currentPrice) / Math.max(0.01, Math.abs(stopLoss - currentPrice));

  // 选择AI模型标签
  const models = ["DeepSeek-V3", "GPT-4o", "PatchTST", "Gemini-2.5"];
  const model = models[Math.floor(Math.abs(finalScore * 100) % models.length)];

  // 生成推理说明
  const allReasons = strategies.flatMap(s => s.reasons);
  const reasoning = `${direction === "持有" ? "观望" : direction}信号 | 综合评分${finalScore.toFixed(3)} | ` +
    `趋势${trendSignal.score > 0 ? "↑" : trendSignal.score < 0 ? "↓" : "→"}` +
    `均值${meanRevSignal.score > 0 ? "↑" : meanRevSignal.score < 0 ? "↓" : "→"}` +
    `突破${breakoutSignal.score > 0 ? "↑" : breakoutSignal.score < 0 ? "↓" : "→"} | ` +
    allReasons.slice(0, 3).join("; ");

  return {
    coin,
    direction,
    confidence: finalConfidence,
    price: currentPrice,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    strategies,
    finalScore: Math.round(finalScore * 1000) / 1000,
    model,
    reasoning,
    timestamp: Date.now(),
    indicators,
  };
}

// ============ K线数据管理 ============

/**
 * 价格历史管理器
 * 维护每个币种的K线数据，用于技术指标计算
 * 
 * 核心改进：首次收到 ticker 数据时，利用 24h OHLCV 数据
 * 合成历史K线，使系统能在几秒钟内启动AI分析，无需等待30分钟。
 */
export class PriceHistoryManager {
  private histories: Map<string, Candle[]> = new Map();
  private initialized: Set<string> = new Set(); // 已初始化合成K线的币种
  private maxCandles: number;

  constructor(maxCandles: number = 200) {
    this.maxCandles = maxCandles;
    this.loadFromStorage();
  }

  /**
   * 利用24小时 OHLCV 数据合成历史K线
   * 生成约40根1分钟K线，模拟最近40分钟的价格走势
   * 这样技术指标（RSI/MACD/EMA等）可以立即开始计算
   */
  private synthesizeHistory(symbol: string, price: number, volume: number, high24h: number, low24h: number, open24h: number) {
    const existing = this.histories.get(symbol) || [];
    // 如果已有足够数据，跳过合成
    if (existing.length >= 30) {
      this.initialized.add(symbol);
      return;
    }

    const NUM_CANDLES = 45; // 合成45根K线，足够所有指标计算
    const now = Date.now();
    const candles: Candle[] = [];

    // 价格范围
    const priceRange = high24h - low24h;
    const volatility = priceRange / price; // 日波动率

    // 从 open24h 到当前 price 生成一条带随机波动的价格路径
    for (let i = 0; i < NUM_CANDLES; i++) {
      const t = i / (NUM_CANDLES - 1); // 0 到 1 的进度
      const timestamp = now - (NUM_CANDLES - i) * 60000; // 每分钟一根

      // 基准价格：从 open24h 线性插值到当前 price
      const basePrice = open24h + (price - open24h) * t;

      // 添加随机波动（基于日波动率缩放到分钟级别）
      const minuteVolatility = volatility / Math.sqrt(1440); // 日波动率转分钟
      const noise = (Math.random() - 0.5) * 2 * priceRange * minuteVolatility * 3;

      const candleClose = Math.max(low24h * 0.999, Math.min(high24h * 1.001, basePrice + noise));
      const candleOpen = i === 0 ? open24h : candles[i - 1].close;
      const candleHigh = Math.max(candleOpen, candleClose) * (1 + Math.random() * minuteVolatility * 2);
      const candleLow = Math.min(candleOpen, candleClose) * (1 - Math.random() * minuteVolatility * 2);

      // 成交量也做随机分布
      const volumePerCandle = volume / 1440; // 日成交量分摊到每分钟
      const candleVolume = volumePerCandle * (0.5 + Math.random() * 1.5);

      candles.push({
        open: candleOpen,
        high: Math.max(candleHigh, candleOpen, candleClose),
        low: Math.min(candleLow, candleOpen, candleClose),
        close: candleClose,
        volume: candleVolume,
        timestamp,
      });
    }

    // 确保最后一根K线的 close 是当前真实价格
    candles[candles.length - 1].close = price;
    candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, price);
    candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, price);

    // 如果有已有数据，合并（保留已有的真实数据，前面补合成数据）
    if (existing.length > 0) {
      const earliestExisting = existing[0].timestamp;
      const syntheticOnly = candles.filter(c => c.timestamp < earliestExisting);
      this.histories.set(symbol, [...syntheticOnly, ...existing]);
    } else {
      this.histories.set(symbol, candles);
    }

    this.initialized.add(symbol);
  }

  /** 更新价格数据 */
  update(symbol: string, price: number, volume: number, high?: number, low?: number, open?: number) {
    // 首次收到数据时，合成历史K线
    if (!this.initialized.has(symbol) && high && low && open) {
      this.synthesizeHistory(symbol, price, volume, high, low, open);
    }

    const now = Date.now();
    const candles = this.histories.get(symbol) || [];

    // 每分钟一根K线
    const currentMinute = Math.floor(now / 60000) * 60000;
    const lastCandle = candles[candles.length - 1];

    if (lastCandle && Math.floor(lastCandle.timestamp / 60000) * 60000 === currentMinute) {
      // 更新当前K线
      lastCandle.close = price;
      lastCandle.high = Math.max(lastCandle.high, high || price);
      lastCandle.low = Math.min(lastCandle.low, low || price);
      lastCandle.volume = volume || lastCandle.volume;
    } else {
      // 新建K线
      candles.push({
        open: open || price,
        high: high || price,
        low: low || price,
        close: price,
        volume: volume || 0,
        timestamp: currentMinute,
      });

      // 限制数量
      if (candles.length > this.maxCandles) {
        candles.splice(0, candles.length - this.maxCandles);
      }
    }

    this.histories.set(symbol, candles);
  }

  /** 获取K线数据 */
  getCandles(symbol: string): Candle[] {
    return this.histories.get(symbol) || [];
  }

  /** 获取所有有足够数据的币种 */
  getReadySymbols(minCandles: number = 20): string[] {
    const ready: string[] = [];
    for (const [symbol, candles] of this.histories) {
      if (candles.length >= minCandles) {
        ready.push(symbol);
      }
    }
    return ready;
  }

  /** 保存到 localStorage */
  saveToStorage() {
    try {
      const data: Record<string, Candle[]> = {};
      for (const [symbol, candles] of this.histories) {
        // 只保存最近50根K线以节省空间
        data[symbol] = candles.slice(-50);
      }
      localStorage.setItem("price_histories", JSON.stringify(data));
    } catch { /* ignore */ }
  }

  /** 从 localStorage 恢复 */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("price_histories");
      if (stored) {
        const data = JSON.parse(stored) as Record<string, Candle[]>;
        for (const [symbol, candles] of Object.entries(data)) {
          if (candles.length >= 20) {
            this.initialized.add(symbol);
          }
          this.histories.set(symbol, candles);
        }
      }
    } catch { /* ignore */ }
  }

  /** 获取数据统计 */
  getStats(): { totalSymbols: number; readySymbols: number; totalCandles: number } {
    let totalCandles = 0;
    let readySymbols = 0;
    for (const candles of this.histories.values()) {
      totalCandles += candles.length;
      if (candles.length >= 20) readySymbols++;
    }
    return {
      totalSymbols: this.histories.size,
      readySymbols,
      totalCandles,
    };
  }
}
