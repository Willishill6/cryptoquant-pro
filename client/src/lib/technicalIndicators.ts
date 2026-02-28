/**
 * technicalIndicators.ts — 技术指标计算引擎
 * 
 * 基于真实价格数据计算多种技术指标，为AI策略提供决策依据。
 * 包含：RSI、MACD、EMA、布林带、ATR、成交量分析、动量指标等。
 * 
 * 所有计算均为纯函数，无副作用，可独立测试。
 */

// ============ 数据类型 ============

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface RSIResult {
  value: number;        // RSI值 0-100
  signal: "超买" | "超卖" | "中性";
  strength: number;     // 信号强度 0-1
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  crossover: "金叉" | "死叉" | "无";
  trend: "看涨" | "看跌" | "中性";
  strength: number;
}

export interface EMAResult {
  fast: number;         // 快线 EMA
  slow: number;         // 慢线 EMA
  crossover: "金叉" | "死叉" | "无";
  trend: "上升" | "下降" | "横盘";
  strength: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  width: number;        // 带宽百分比
  position: number;     // 价格在带中的位置 0-1
  signal: "突破上轨" | "突破下轨" | "回归中轨" | "中性";
  strength: number;
}

export interface VolumeResult {
  current: number;
  average: number;
  ratio: number;        // 当前/平均
  trend: "放量" | "缩量" | "正常";
  confirmation: boolean; // 是否确认价格趋势
  strength: number;
}

export interface ATRResult {
  value: number;
  percentage: number;   // ATR占价格的百分比
  volatility: "高" | "中" | "低";
}

export interface MomentumResult {
  roc: number;          // Rate of Change
  trend: "强势上涨" | "上涨" | "横盘" | "下跌" | "强势下跌";
  strength: number;
}

export interface StochasticResult {
  k: number;
  d: number;
  signal: "超买" | "超卖" | "中性";
  crossover: "金叉" | "死叉" | "无";
  strength: number;
}

export interface AllIndicators {
  rsi: RSIResult;
  macd: MACDResult;
  ema: EMAResult;
  bollinger: BollingerResult;
  volume: VolumeResult;
  atr: ATRResult;
  momentum: MomentumResult;
  stochastic: StochasticResult;
  timestamp: number;
}

// ============ 基础计算函数 ============

/** 计算简单移动平均线 SMA */
function sma(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

/** 计算指数移动平均线 EMA */
function ema(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const multiplier = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
  }
  return result;
}

/** 获取 EMA 序列的最后一个值 */
function emaLast(data: number[], period: number): number {
  const result = ema(data, period);
  return result[result.length - 1] || 0;
}

// ============ RSI 计算 ============

export function calculateRSI(closes: number[], period: number = 14): RSIResult {
  if (closes.length < period + 1) {
    return { value: 50, signal: "中性", strength: 0 };
  }

  let gains = 0;
  let losses = 0;

  // 初始平均涨跌幅
  for (let i = 1; i <= period; i++) {
    const change = closes[closes.length - period - 1 + i] - closes[closes.length - period - 1 + i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 使用 Wilder 平滑方法计算后续值
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  let signal: RSIResult["signal"] = "中性";
  let strength = 0;

  if (rsi >= 70) {
    signal = "超买";
    strength = Math.min(1, (rsi - 70) / 30);
  } else if (rsi <= 30) {
    signal = "超卖";
    strength = Math.min(1, (30 - rsi) / 30);
  } else {
    strength = 0;
  }

  return { value: Math.round(rsi * 100) / 100, signal, strength };
}

// ============ MACD 计算 ============

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (closes.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0, crossover: "无", trend: "中性", strength: 0 };
  }

  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }

  const signalLine = ema(macdLine, signalPeriod);
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentHistogram = currentMACD - currentSignal;

  // 检测交叉
  const prevMACD = macdLine[macdLine.length - 2] || 0;
  const prevSignal = signalLine[signalLine.length - 2] || 0;
  let crossover: MACDResult["crossover"] = "无";

  if (prevMACD <= prevSignal && currentMACD > currentSignal) {
    crossover = "金叉";
  } else if (prevMACD >= prevSignal && currentMACD < currentSignal) {
    crossover = "死叉";
  }

  let trend: MACDResult["trend"] = "中性";
  if (currentHistogram > 0 && currentMACD > 0) trend = "看涨";
  else if (currentHistogram < 0 && currentMACD < 0) trend = "看跌";

  // 信号强度基于柱状图的绝对值和变化率
  const price = closes[closes.length - 1];
  const histogramPct = price > 0 ? Math.abs(currentHistogram) / price * 100 : 0;
  const strength = Math.min(1, histogramPct / 0.5);

  return {
    macd: Math.round(currentMACD * 10000) / 10000,
    signal: Math.round(currentSignal * 10000) / 10000,
    histogram: Math.round(currentHistogram * 10000) / 10000,
    crossover,
    trend,
    strength: crossover !== "无" ? Math.max(strength, 0.7) : strength,
  };
}

// ============ EMA 交叉 ============

export function calculateEMACross(
  closes: number[],
  fastPeriod: number = 9,
  slowPeriod: number = 21
): EMAResult {
  if (closes.length < slowPeriod + 2) {
    return { fast: 0, slow: 0, crossover: "无", trend: "横盘", strength: 0 };
  }

  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);

  const currentFast = fastEMA[fastEMA.length - 1];
  const currentSlow = slowEMA[slowEMA.length - 1];
  const prevFast = fastEMA[fastEMA.length - 2];
  const prevSlow = slowEMA[slowEMA.length - 2];

  let crossover: EMAResult["crossover"] = "无";
  if (prevFast <= prevSlow && currentFast > currentSlow) crossover = "金叉";
  else if (prevFast >= prevSlow && currentFast < currentSlow) crossover = "死叉";

  let trend: EMAResult["trend"] = "横盘";
  const diff = (currentFast - currentSlow) / currentSlow * 100;
  if (diff > 0.1) trend = "上升";
  else if (diff < -0.1) trend = "下降";

  const strength = Math.min(1, Math.abs(diff) / 1);

  return {
    fast: Math.round(currentFast * 100) / 100,
    slow: Math.round(currentSlow * 100) / 100,
    crossover,
    trend,
    strength: crossover !== "无" ? Math.max(strength, 0.6) : strength,
  };
}

// ============ 布林带 ============

export function calculateBollinger(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerResult {
  if (closes.length < period) {
    const price = closes[closes.length - 1] || 0;
    return { upper: price, middle: price, lower: price, width: 0, position: 0.5, signal: "中性", strength: 0 };
  }

  const slice = closes.slice(-period);
  const middle = slice.reduce((s, v) => s + v, 0) / period;
  const variance = slice.reduce((s, v) => s + Math.pow(v - middle, 2), 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const currentPrice = closes[closes.length - 1];
  const width = middle > 0 ? ((upper - lower) / middle) * 100 : 0;
  const position = upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5;

  let signal: BollingerResult["signal"] = "中性";
  let strength = 0;

  if (currentPrice > upper) {
    signal = "突破上轨";
    strength = Math.min(1, (currentPrice - upper) / (upper - middle) + 0.3);
  } else if (currentPrice < lower) {
    signal = "突破下轨";
    strength = Math.min(1, (lower - currentPrice) / (middle - lower) + 0.3);
  } else if (Math.abs(position - 0.5) < 0.1) {
    signal = "回归中轨";
    strength = 0.3;
  }

  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    width: Math.round(width * 100) / 100,
    position: Math.round(position * 1000) / 1000,
    signal,
    strength,
  };
}

// ============ 成交量分析 ============

export function calculateVolume(volumes: number[], period: number = 20): VolumeResult {
  if (volumes.length < 2) {
    return { current: 0, average: 0, ratio: 1, trend: "正常", confirmation: false, strength: 0 };
  }

  const current = volumes[volumes.length - 1];
  const avg = sma(volumes.slice(0, -1), Math.min(period, volumes.length - 1));
  const ratio = avg > 0 ? current / avg : 1;

  let trend: VolumeResult["trend"] = "正常";
  if (ratio > 1.5) trend = "放量";
  else if (ratio < 0.5) trend = "缩量";

  // 成交量确认：放量且方向一致
  const confirmation = ratio > 1.2;
  const strength = Math.min(1, Math.abs(ratio - 1) / 1.5);

  return {
    current,
    average: Math.round(avg * 100) / 100,
    ratio: Math.round(ratio * 100) / 100,
    trend,
    confirmation,
    strength,
  };
}

// ============ ATR (Average True Range) ============

export function calculateATR(candles: Candle[], period: number = 14): ATRResult {
  if (candles.length < period + 1) {
    return { value: 0, percentage: 0, volatility: "低" };
  }

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  const atr = sma(trueRanges, period);
  const currentPrice = candles[candles.length - 1].close;
  const percentage = currentPrice > 0 ? (atr / currentPrice) * 100 : 0;

  let volatility: ATRResult["volatility"] = "中";
  if (percentage > 3) volatility = "高";
  else if (percentage < 1) volatility = "低";

  return {
    value: Math.round(atr * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    volatility,
  };
}

// ============ 动量指标 (ROC) ============

export function calculateMomentum(closes: number[], period: number = 10): MomentumResult {
  if (closes.length < period + 1) {
    return { roc: 0, trend: "横盘", strength: 0 };
  }

  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - period];
  const roc = past > 0 ? ((current - past) / past) * 100 : 0;

  let trend: MomentumResult["trend"] = "横盘";
  if (roc > 3) trend = "强势上涨";
  else if (roc > 0.5) trend = "上涨";
  else if (roc < -3) trend = "强势下跌";
  else if (roc < -0.5) trend = "下跌";

  const strength = Math.min(1, Math.abs(roc) / 5);

  return {
    roc: Math.round(roc * 100) / 100,
    trend,
    strength,
  };
}

// ============ 随机振荡器 (Stochastic) ============

export function calculateStochastic(
  candles: Candle[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  if (candles.length < kPeriod + dPeriod) {
    return { k: 50, d: 50, signal: "中性", crossover: "无", strength: 0 };
  }

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map(c => c.high));
    const lowestLow = Math.min(...slice.map(c => c.low));
    const k = highestHigh !== lowestLow
      ? ((candles[i].close - lowestLow) / (highestHigh - lowestLow)) * 100
      : 50;
    kValues.push(k);
  }

  const dValues: number[] = [];
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const avg = kValues.slice(i - dPeriod + 1, i + 1).reduce((s, v) => s + v, 0) / dPeriod;
    dValues.push(avg);
  }

  const currentK = kValues[kValues.length - 1];
  const currentD = dValues[dValues.length - 1];
  const prevK = kValues[kValues.length - 2] || currentK;
  const prevD = dValues[dValues.length - 2] || currentD;

  let signal: StochasticResult["signal"] = "中性";
  let strength = 0;
  if (currentK > 80) { signal = "超买"; strength = Math.min(1, (currentK - 80) / 20); }
  else if (currentK < 20) { signal = "超卖"; strength = Math.min(1, (20 - currentK) / 20); }

  let crossover: StochasticResult["crossover"] = "无";
  if (prevK <= prevD && currentK > currentD) crossover = "金叉";
  else if (prevK >= prevD && currentK < currentD) crossover = "死叉";

  return {
    k: Math.round(currentK * 100) / 100,
    d: Math.round(currentD * 100) / 100,
    signal,
    crossover,
    strength: crossover !== "无" ? Math.max(strength, 0.5) : strength,
  };
}

// ============ 综合计算所有指标 ============

export function calculateAllIndicators(candles: Candle[]): AllIndicators {
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    ema: calculateEMACross(closes),
    bollinger: calculateBollinger(closes),
    volume: calculateVolume(volumes),
    atr: calculateATR(candles),
    momentum: calculateMomentum(closes),
    stochastic: calculateStochastic(candles),
    timestamp: Date.now(),
  };
}
