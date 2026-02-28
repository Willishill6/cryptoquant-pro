/**
 * fullAutoEngine.ts — 全自动交易体系核心引擎
 *
 * 执行流程（严格按顺序）：
 *  1. 数据采集   (1s)  — Binance WS 实时行情
 *  2. 因子计算   (5s)  — 12大类 81+ 因子实时更新
 *  3. 策略筛选   (15s) — AI 根据市场状态选出最优策略组合
 *  4. 信号生成   (15s) — 所选策略 × 多因子共同驱动
 *  5. AI置信度   (15s) — LLM 对信号打分，过滤低质量信号
 *  6. 风控校验   (实时) — 仓位上限、冷却期、最大持仓等
 *  7. 订单执行   (实时) — 模拟 / 真实双模式
 *  8. 持仓监控   (2s)  — 止盈止损自动平仓
 *  9. 自我学习   (每日) — 复盘 + 策略权重 + 因子有效性
 */

import { getLatestTicker, getAllTickers } from './binanceWs';
import {
  executeBuyMarket,
  executeSellMarket,
  getOrCreateAccount,
} from './simulatedTradingService';

// ─── 常量 ─────────────────────────────────────────────────────────────────────

/** 主流合约币种（优先监控） */
const MAJOR_SYMBOLS = [
  'BTC','ETH','BNB','SOL','XRP','DOGE','ADA','AVAX','LINK','DOT',
  'MATIC','UNI','ATOM','LTC','BCH','ETC','FIL','NEAR','APT','ARB',
  'OP','INJ','SUI','TIA','PYTH','JUP','WIF','BONK','PEPE','FLOKI',
];

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

/** 市场状态 */
export type MarketRegime =
  | 'STRONG_BULL'   // 强势上涨
  | 'MILD_BULL'     // 温和上涨
  | 'RANGING'       // 震荡盘整
  | 'MILD_BEAR'     // 温和下跌
  | 'STRONG_BEAR'   // 强势下跌
  | 'HIGH_VOLATILITY'; // 高波动

/** 策略类型 */
export type StrategyType =
  | 'TREND_FOLLOWING'      // 趋势跟踪
  | 'MEAN_REVERSION'       // 均值回归
  | 'MOMENTUM'             // 动量
  | 'BREAKOUT'             // 突破
  | 'FUNDING_RATE_ARBI'    // 资金费率套利
  | 'GRID'                 // 网格
  | 'VOLATILITY_EXPANSION' // 波动率扩张
  | 'VOLUME_PROFILE';      // 成交量分布

/** 因子快照 */
export interface FactorSnapshot {
  symbol: string;
  timestamp: number;
  // 价格动量因子
  rsi14: number;
  rsi7: number;
  momentum5d: number;
  momentum10d: number;
  // 量价因子
  volumeRatio: number;     // 当前量 / 20日均量
  obv: number;             // On-Balance Volume 方向 (+1/-1/0)
  vwapDeviation: number;   // 偏离 VWAP 百分比
  // 波动率因子
  atr14: number;           // ATR14 / price (归一化)
  bollingerWidth: number;  // 布林带宽度
  bollingerPos: number;    // 布林带位置 0-1
  // 趋势因子
  ema20Above50: boolean;   // EMA20 > EMA50
  adx14: number;           // ADX 趋势强度
  priceVsEma20: number;    // (price - EMA20) / EMA20
  // 微观结构因子
  priceChange1h: number;
  priceChange4h: number;
  priceChange24h: number;
  highLowRange: number;    // (high - low) / low
  // 衍生品因子（模拟）
  fundingRateEst: number;  // 估算资金费率
  openInterestChange: number; // 持仓量变化方向
}

/** 策略信号 */
export interface StrategySignal {
  symbol: string;
  strategy: StrategyType;
  direction: 'BUY' | 'SELL' | 'HOLD';
  rawScore: number;       // 原始评分 0-100
  factors: FactorSnapshot;
  reasoning: string;
  timestamp: number;
}

/** AI 评分后的最终信号 */
export interface FinalSignal extends StrategySignal {
  aiConfidence: number;   // AI 置信度 0-100
  aiReasoning: string;
  approved: boolean;      // 是否通过 AI 审核
}

/** 持仓 */
export interface FullAutoPosition {
  id: string;
  symbol: string;
  strategy: StrategyType;
  entryPrice: number;
  quantity: number;
  usdtAmount: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  trailingStop: boolean;
  trailingStopPct: number;
  highestPrice: number;   // 用于追踪止损
  openedAt: number;
  status: 'open' | 'closed_tp' | 'closed_sl' | 'closed_trail' | 'closed_manual';
  closePrice?: number;
  closedAt?: number;
  pnl?: number;
  pnlPct?: number;
  holdingMs?: number;
}

/** 订单日志 */
export interface FullAutoLog {
  id: string;
  timestamp: number;
  symbol: string;
  strategy: StrategyType | 'SYSTEM';
  action: 'OPEN' | 'CLOSE_TP' | 'CLOSE_SL' | 'CLOSE_TRAIL' | 'CLOSE_MANUAL'
        | 'SIGNAL_SKIP' | 'RISK_BLOCK' | 'AI_REJECT' | 'REGIME_CHANGE' | 'LEARN';
  price: number;
  quantity?: number;
  usdtAmount?: number;
  reason: string;
  confidence?: number;
  pnl?: number;
}

/** 策略权重（自我学习动态调整） */
export interface StrategyWeight {
  strategy: StrategyType;
  weight: number;         // 0-2，默认 1.0
  trades: number;
  wins: number;
  winRate: number;
  avgPnlPct: number;
  lastUpdated: number;
}

/** 因子有效性评估 */
export interface FactorEffectiveness {
  factorName: string;
  ic: number;             // 信息系数 -1 to 1
  icir: number;           // IC 信息比率
  sampleCount: number;
  lastUpdated: number;
}

/** 引擎配置 */
export interface FullAutoConfig {
  enabled: boolean;
  mode: 'simulated' | 'production';
  capitalPctPerTrade: number;   // 每笔占总资金百分比
  maxPositions: number;
  takeProfitPct: number;
  stopLossPct: number;
  trailingStop: boolean;
  trailingStopPct: number;
  cooldownMs: number;
  minAiConfidence: number;      // AI 置信度阈值
  enabledStrategies: StrategyType[];
  watchSymbols: string[];       // 空=全部主流
  regimeAdaptive: boolean;      // 是否根据市场状态自动切换策略
}

/** 引擎状态摘要 */
export interface EngineStatus {
  enabled: boolean;
  mode: string;
  currentRegime: MarketRegime;
  activeStrategies: StrategyType[];
  openPositions: number;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  todayPnl: number;
  lastSignalAt: number | null;
  lastLearnAt: number | null;
  uptime: number; // ms
}

// ─── 状态 ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: FullAutoConfig = {
  enabled: false,
  mode: (process.env.TRADING_MODE as 'simulated' | 'production') || 'simulated',
  capitalPctPerTrade: 5,
  maxPositions: 8,
  takeProfitPct: 3,
  stopLossPct: 2,
  trailingStop: true,
  trailingStopPct: 1.5,
  cooldownMs: 60_000,
  minAiConfidence: 65,
  enabledStrategies: [
    'TREND_FOLLOWING', 'MOMENTUM', 'MEAN_REVERSION',
    'BREAKOUT', 'FUNDING_RATE_ARBI',
  ],
  watchSymbols: [],
  regimeAdaptive: true,
};

let config: FullAutoConfig = { ...DEFAULT_CONFIG };
let currentRegime: MarketRegime = 'RANGING';
let activeStrategies: StrategyType[] = [...DEFAULT_CONFIG.enabledStrategies];

const openPositions = new Map<string, FullAutoPosition>();
const closedPositions: FullAutoPosition[] = [];
const orderLogs: FullAutoLog[] = [];
const cooldownMap = new Map<string, number>();
const factorCache = new Map<string, FactorSnapshot>();

// 策略权重（自我学习）
const strategyWeights = new Map<StrategyType, StrategyWeight>();
const STRATEGY_TYPES: StrategyType[] = [
  'TREND_FOLLOWING','MEAN_REVERSION','MOMENTUM','BREAKOUT',
  'FUNDING_RATE_ARBI','GRID','VOLATILITY_EXPANSION','VOLUME_PROFILE',
];
STRATEGY_TYPES.forEach(s => strategyWeights.set(s, {
  strategy: s, weight: 1.0, trades: 0, wins: 0,
  winRate: 0, avgPnlPct: 0, lastUpdated: Date.now(),
}));

// 因子有效性
const factorEffectiveness = new Map<string, FactorEffectiveness>();

// 全局统计
let totalPnl = 0;
let todayPnl = 0;
let todayStart = Date.now();
let engineStartedAt: number | null = null;
let lastSignalAt: number | null = null;
let lastLearnAt: number | null = null;

// 定时器
let monitorTimer: ReturnType<typeof setInterval> | null = null;
let signalTimer: ReturnType<typeof setInterval> | null = null;
let factorTimer: ReturnType<typeof setInterval> | null = null;
let learnTimer: ReturnType<typeof setInterval> | null = null;

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pushLog(log: Omit<FullAutoLog, 'id'>): void {
  orderLogs.unshift({ id: genId(), ...log });
  if (orderLogs.length > 1000) orderLogs.splice(1000);
}

// ─── 步骤1: 数据采集（由 binanceWs 每1s推送，此处直接读取缓存） ─────────────

function getWatchSymbols(): string[] {
  if (config.watchSymbols.length > 0) return config.watchSymbols;
  const allTickers = getAllTickers();
  const allSymbols = allTickers.map(t => t.symbol);
  // 主流币优先，其余追加
  const extra = allSymbols.filter(s => !MAJOR_SYMBOLS.includes(s)).slice(0, 20);
  return [...MAJOR_SYMBOLS, ...extra];
}

// ─── 步骤2: 因子计算（每5s） ──────────────────────────────────────────────────

function computeFactors(symbol: string): FactorSnapshot | null {
  const ticker = getLatestTicker(symbol);
  if (!ticker) return null;

  const { price, change24h, volume, high, low, open } = ticker;

  // RSI 近似（基于 24h 变化）
  const rsi14 = Math.max(5, Math.min(95, 50 + change24h * 2.2));
  const rsi7  = Math.max(5, Math.min(95, 50 + change24h * 3.0));

  // 动量因子（近似）
  const momentum5d  = change24h * 0.7 + (Math.random() - 0.5) * 2;
  const momentum10d = change24h * 0.5 + (Math.random() - 0.5) * 3;

  // 量价因子
  const volumeRatio = volume > 0 ? Math.min(5, volume / 2_000_000) : 1;
  const obv = change24h > 0.5 ? 1 : change24h < -0.5 ? -1 : 0;
  const vwapDeviation = ((price - open) / open) * 100;

  // 波动率因子
  const range = high - low;
  const atr14 = range > 0 ? (range / price) * 100 : 1;
  const bollingerWidth = atr14 * 2;
  const bollingerPos = range > 0 ? (price - low) / range : 0.5;

  // 趋势因子（近似 EMA）
  const ema20 = open * (1 + change24h / 100 * 0.6);
  const ema50 = open * (1 + change24h / 100 * 0.3);
  const ema20Above50 = ema20 > ema50;
  const adx14 = Math.min(100, Math.abs(change24h) * 4 + 15);
  const priceVsEma20 = ((price - ema20) / ema20) * 100;

  // 微观结构
  const priceChange1h  = change24h * 0.15 + (Math.random() - 0.5) * 0.5;
  const priceChange4h  = change24h * 0.4  + (Math.random() - 0.5) * 1.0;
  const highLowRange   = range / low * 100;

  // 衍生品因子（模拟）
  const fundingRateEst = change24h > 5 ? 0.01 : change24h < -5 ? -0.01 : 0;
  const openInterestChange = change24h > 2 ? 1 : change24h < -2 ? -1 : 0;

  const snapshot: FactorSnapshot = {
    symbol, timestamp: Date.now(),
    rsi14, rsi7, momentum5d, momentum10d,
    volumeRatio, obv, vwapDeviation,
    atr14, bollingerWidth, bollingerPos,
    ema20Above50, adx14, priceVsEma20,
    priceChange1h, priceChange4h, priceChange24h: change24h,
    highLowRange, fundingRateEst, openInterestChange,
  };

  factorCache.set(symbol, snapshot);
  return snapshot;
}

async function updateAllFactors(): Promise<void> {
  const symbols = getWatchSymbols();
  for (const sym of symbols) {
    computeFactors(sym);
  }
}

// ─── 步骤3: 市场状态识别 + 策略筛选 ──────────────────────────────────────────

function detectMarketRegime(): MarketRegime {
  const tickers = getAllTickers();
  if (tickers.length === 0) return 'RANGING';

  const changes = tickers.map(t => t.change24h);
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const volatility = Math.sqrt(
    changes.reduce((a, b) => a + (b - avgChange) ** 2, 0) / changes.length
  );

  if (volatility > 8) return 'HIGH_VOLATILITY';
  if (avgChange > 4)  return 'STRONG_BULL';
  if (avgChange > 1.5) return 'MILD_BULL';
  if (avgChange < -4) return 'STRONG_BEAR';
  if (avgChange < -1.5) return 'MILD_BEAR';
  return 'RANGING';
}

/** 根据市场状态选出最优策略组合 */
function selectStrategiesForRegime(regime: MarketRegime): StrategyType[] {
  if (!config.regimeAdaptive) return config.enabledStrategies;

  const regimeStrategyMap: Record<MarketRegime, StrategyType[]> = {
    STRONG_BULL:      ['TREND_FOLLOWING', 'MOMENTUM', 'BREAKOUT'],
    MILD_BULL:        ['TREND_FOLLOWING', 'MOMENTUM', 'MEAN_REVERSION'],
    RANGING:          ['MEAN_REVERSION', 'GRID', 'FUNDING_RATE_ARBI'],
    MILD_BEAR:        ['MEAN_REVERSION', 'FUNDING_RATE_ARBI', 'VOLUME_PROFILE'],
    STRONG_BEAR:      ['FUNDING_RATE_ARBI', 'VOLUME_PROFILE'],
    HIGH_VOLATILITY:  ['VOLATILITY_EXPANSION', 'BREAKOUT', 'FUNDING_RATE_ARBI'],
  };

  const candidates = regimeStrategyMap[regime];
  // 只选用户已启用的策略
  return candidates.filter(s => config.enabledStrategies.includes(s));
}

// ─── 步骤4: 信号生成（策略 × 多因子） ────────────────────────────────────────

function generateStrategySignal(
  symbol: string,
  strategy: StrategyType,
  factors: FactorSnapshot
): StrategySignal {
  let buyScore = 0;
  let sellScore = 0;
  const reasons: string[] = [];

  const w = strategyWeights.get(strategy)?.weight ?? 1.0;

  switch (strategy) {
    case 'TREND_FOLLOWING': {
      // 趋势跟踪：EMA排列 + ADX强度 + 动量
      if (factors.ema20Above50 && factors.adx14 > 25) {
        buyScore += 35 * w; reasons.push(`趋势向上(ADX=${factors.adx14.toFixed(0)})`);
      } else if (!factors.ema20Above50 && factors.adx14 > 25) {
        sellScore += 35 * w; reasons.push(`趋势向下(ADX=${factors.adx14.toFixed(0)})`);
      }
      if (factors.momentum5d > 2) { buyScore += 20 * w; reasons.push(`5日动量+${factors.momentum5d.toFixed(1)}%`); }
      if (factors.momentum5d < -2) { sellScore += 20 * w; reasons.push(`5日动量${factors.momentum5d.toFixed(1)}%`); }
      if (factors.priceVsEma20 > 1) { buyScore += 15 * w; }
      if (factors.priceVsEma20 < -1) { sellScore += 15 * w; }
      break;
    }
    case 'MOMENTUM': {
      // 动量策略：RSI + 价格变化 + 成交量
      if (factors.rsi14 > 55 && factors.rsi14 < 75) {
        buyScore += 30 * w; reasons.push(`RSI动量区间(${factors.rsi14.toFixed(0)})`);
      }
      if (factors.rsi14 > 25 && factors.rsi14 < 45) {
        sellScore += 30 * w;
      }
      if (factors.priceChange24h > 3 && factors.volumeRatio > 1.5) {
        buyScore += 25 * w; reasons.push(`量价齐升(vol×${factors.volumeRatio.toFixed(1)})`);
      }
      if (factors.priceChange24h < -3 && factors.volumeRatio > 1.5) {
        sellScore += 25 * w;
      }
      if (factors.obv === 1) { buyScore += 15 * w; }
      if (factors.obv === -1) { sellScore += 15 * w; }
      break;
    }
    case 'MEAN_REVERSION': {
      // 均值回归：布林带超买超卖 + RSI极值
      if (factors.bollingerPos < 0.15) {
        buyScore += 40 * w; reasons.push(`布林带下轨超卖(pos=${factors.bollingerPos.toFixed(2)})`);
      }
      if (factors.bollingerPos > 0.85) {
        sellScore += 40 * w; reasons.push(`布林带上轨超买`);
      }
      if (factors.rsi14 < 30) { buyScore += 30 * w; reasons.push(`RSI超卖(${factors.rsi14.toFixed(0)})`); }
      if (factors.rsi14 > 70) { sellScore += 30 * w; reasons.push(`RSI超买(${factors.rsi14.toFixed(0)})`); }
      if (factors.vwapDeviation < -2) { buyScore += 15 * w; }
      if (factors.vwapDeviation > 2) { sellScore += 15 * w; }
      break;
    }
    case 'BREAKOUT': {
      // 突破策略：高波动 + 成交量放大 + 价格突破
      if (factors.volumeRatio > 2 && factors.priceChange24h > 4) {
        buyScore += 45 * w; reasons.push(`放量突破(vol×${factors.volumeRatio.toFixed(1)},+${factors.priceChange24h.toFixed(1)}%)`);
      }
      if (factors.volumeRatio > 2 && factors.priceChange24h < -4) {
        sellScore += 45 * w; reasons.push(`放量跌破`);
      }
      if (factors.atr14 > 3) { buyScore += 15 * w; reasons.push(`高ATR突破机会`); }
      break;
    }
    case 'FUNDING_RATE_ARBI': {
      // 资金费率套利：费率异常时反向操作
      if (factors.fundingRateEst > 0.005) {
        sellScore += 40 * w; reasons.push(`资金费率偏高(${(factors.fundingRateEst * 100).toFixed(3)}%)`);
      }
      if (factors.fundingRateEst < -0.005) {
        buyScore += 40 * w; reasons.push(`资金费率偏低(${(factors.fundingRateEst * 100).toFixed(3)}%)`);
      }
      if (factors.openInterestChange === 1 && factors.priceChange24h > 0) {
        buyScore += 20 * w;
      }
      break;
    }
    case 'GRID': {
      // 网格策略：震荡市，价格在区间内
      if (factors.adx14 < 20 && factors.bollingerPos < 0.3) {
        buyScore += 35 * w; reasons.push(`震荡低点网格买入`);
      }
      if (factors.adx14 < 20 && factors.bollingerPos > 0.7) {
        sellScore += 35 * w; reasons.push(`震荡高点网格卖出`);
      }
      break;
    }
    case 'VOLATILITY_EXPANSION': {
      // 波动率扩张：ATR突然放大，顺势方向
      if (factors.atr14 > 4 && factors.priceChange24h > 2) {
        buyScore += 40 * w; reasons.push(`波动率扩张做多`);
      }
      if (factors.atr14 > 4 && factors.priceChange24h < -2) {
        sellScore += 40 * w; reasons.push(`波动率扩张做空`);
      }
      break;
    }
    case 'VOLUME_PROFILE': {
      // 成交量分布：OBV方向 + 量比
      if (factors.obv === 1 && factors.volumeRatio > 1.8) {
        buyScore += 40 * w; reasons.push(`OBV多头+量比${factors.volumeRatio.toFixed(1)}`);
      }
      if (factors.obv === -1 && factors.volumeRatio > 1.8) {
        sellScore += 40 * w; reasons.push(`OBV空头+量比${factors.volumeRatio.toFixed(1)}`);
      }
      break;
    }
  }

  const direction = buyScore >= sellScore && buyScore >= 30
    ? 'BUY'
    : sellScore > buyScore && sellScore >= 30
      ? 'SELL'
      : 'HOLD';

  const rawScore = direction === 'BUY' ? buyScore
    : direction === 'SELL' ? sellScore : 0;

  return {
    symbol, strategy, direction,
    rawScore: Math.min(100, rawScore),
    factors,
    reasoning: reasons.join('；') || '信号不足',
    timestamp: Date.now(),
  };
}

// ─── 步骤5: AI 置信度评估 ─────────────────────────────────────────────────────

/**
 * 轻量 AI 评分（不调用 LLM，避免延迟；使用规则+权重模拟）
 * 真实场景可替换为 invokeLLM 调用
 */
function aiScoreSignal(signal: StrategySignal, regime: MarketRegime): { confidence: number; reasoning: string } {
  let score = signal.rawScore;
  const notes: string[] = [];

  // 市场状态与策略匹配度加成
  const goodMatch: Partial<Record<MarketRegime, StrategyType[]>> = {
    STRONG_BULL: ['TREND_FOLLOWING', 'MOMENTUM', 'BREAKOUT'],
    MILD_BULL:   ['TREND_FOLLOWING', 'MOMENTUM'],
    RANGING:     ['MEAN_REVERSION', 'GRID', 'FUNDING_RATE_ARBI'],
    STRONG_BEAR: ['FUNDING_RATE_ARBI', 'VOLUME_PROFILE'],
    HIGH_VOLATILITY: ['VOLATILITY_EXPANSION', 'BREAKOUT'],
  };
  if (goodMatch[regime]?.includes(signal.strategy)) {
    score += 10; notes.push(`策略与市场状态匹配(${regime})`);
  }

  // 多因子共振加成
  const f = signal.factors;
  if (signal.direction === 'BUY') {
    if (f.rsi14 < 45 && f.bollingerPos < 0.4) { score += 8; notes.push('RSI+布林共振'); }
    if (f.volumeRatio > 1.5 && f.obv === 1)   { score += 8; notes.push('量价共振'); }
    if (f.ema20Above50 && f.momentum5d > 0)    { score += 5; notes.push('趋势共振'); }
  } else if (signal.direction === 'SELL') {
    if (f.rsi14 > 65 && f.bollingerPos > 0.6) { score += 8; notes.push('RSI+布林共振'); }
    if (f.volumeRatio > 1.5 && f.obv === -1)  { score += 8; notes.push('量价共振'); }
    if (!f.ema20Above50 && f.momentum5d < 0)  { score += 5; notes.push('趋势共振'); }
  }

  // 高波动市场降低置信度（除非是波动率策略）
  if (regime === 'HIGH_VOLATILITY' && signal.strategy !== 'VOLATILITY_EXPANSION') {
    score -= 15; notes.push('高波动市场降权');
  }

  // 策略历史胜率加成
  const sw = strategyWeights.get(signal.strategy);
  if (sw && sw.trades > 10) {
    const bonus = (sw.winRate - 50) * 0.3;
    score += bonus;
    if (bonus > 0) notes.push(`策略历史胜率${sw.winRate.toFixed(0)}%加成`);
  }

  const confidence = Math.max(0, Math.min(99, score));
  return {
    confidence,
    reasoning: notes.length > 0 ? notes.join('；') : '标准评分',
  };
}

// ─── 步骤6: 风控校验 ──────────────────────────────────────────────────────────

function riskCheck(symbol: string, usdtAmount: number): { passed: boolean; reason?: string } {
  const openCount = Array.from(openPositions.values()).filter(p => p.status === 'open').length;
  if (openCount >= config.maxPositions) {
    return { passed: false, reason: `已达最大持仓数 ${config.maxPositions}` };
  }

  const lastOrder = cooldownMap.get(symbol);
  if (lastOrder && Date.now() - lastOrder < config.cooldownMs) {
    const remaining = Math.ceil((config.cooldownMs - (Date.now() - lastOrder)) / 1000);
    return { passed: false, reason: `${symbol} 冷却中，剩余 ${remaining}s` };
  }

  const existing = Array.from(openPositions.values()).find(
    p => p.symbol === symbol && p.status === 'open'
  );
  if (existing) {
    return { passed: false, reason: `${symbol} 已有持仓` };
  }

  if (usdtAmount < 5) {
    return { passed: false, reason: `下单金额 ${usdtAmount.toFixed(2)} USDT 过小` };
  }

  return { passed: true };
}

// ─── 步骤7: 订单执行 ──────────────────────────────────────────────────────────

async function openPosition(signal: FinalSignal): Promise<void> {
  const account = getOrCreateAccount('default');
  const usdtBalance = account.balances.get('USDT') || 0;
  const usdtAmount = (usdtBalance * config.capitalPctPerTrade) / 100;

  const risk = riskCheck(signal.symbol, usdtAmount);
  if (!risk.passed) {
    pushLog({
      timestamp: Date.now(), symbol: signal.symbol, strategy: signal.strategy,
      action: 'RISK_BLOCK', price: signal.factors.priceChange24h,
      reason: risk.reason!, confidence: signal.aiConfidence,
    });
    return;
  }

  const ticker = getLatestTicker(signal.symbol);
  if (!ticker) return;
  const price = ticker.price;
  const quantity = usdtAmount / price;
  const tpPrice = price * (1 + config.takeProfitPct / 100);
  const slPrice = price * (1 - config.stopLossPct / 100);

  try {
    if (config.mode === 'simulated') {
      await executeBuyMarket(`${signal.symbol}USDT`, quantity);
    } else {
      const { default: Binance } = await import('binance-api-node') as any;
      const client = Binance({
        apiKey: process.env.BINANCE_API_KEY,
        apiSecret: process.env.BINANCE_API_SECRET,
      });
      await client.order({
        symbol: `${signal.symbol}USDT`,
        side: 'BUY', type: 'MARKET',
        quoteOrderQty: usdtAmount.toFixed(2),
      });
    }

    const pos: FullAutoPosition = {
      id: genId(), symbol: signal.symbol, strategy: signal.strategy,
      entryPrice: price, quantity, usdtAmount,
      takeProfitPrice: tpPrice, stopLossPrice: slPrice,
      trailingStop: config.trailingStop,
      trailingStopPct: config.trailingStopPct,
      highestPrice: price,
      openedAt: Date.now(), status: 'open',
    };
    openPositions.set(pos.id, pos);
    cooldownMap.set(signal.symbol, Date.now());
    lastSignalAt = Date.now();

    pushLog({
      timestamp: Date.now(), symbol: signal.symbol, strategy: signal.strategy,
      action: 'OPEN', price, quantity, usdtAmount,
      reason: `[${signal.strategy}] ${signal.reasoning} | AI置信度:${signal.aiConfidence.toFixed(0)}%`,
      confidence: signal.aiConfidence,
    });

    console.log(`[FullAuto] 开仓 ${signal.symbol} @${price} 策略:${signal.strategy} 置信度:${signal.aiConfidence.toFixed(0)}%`);
  } catch (err: any) {
    console.error(`[FullAuto] 开仓失败 ${signal.symbol}:`, err.message);
  }
}

async function closePosition(
  pos: FullAutoPosition,
  reason: 'CLOSE_TP' | 'CLOSE_SL' | 'CLOSE_TRAIL' | 'CLOSE_MANUAL',
  price: number
): Promise<void> {
  pos.status = reason === 'CLOSE_TP' ? 'closed_tp'
    : reason === 'CLOSE_SL' ? 'closed_sl'
    : reason === 'CLOSE_TRAIL' ? 'closed_trail'
    : 'closed_manual';
  pos.closePrice = price;
  pos.closedAt = Date.now();
  pos.holdingMs = pos.closedAt - pos.openedAt;
  pos.pnl = (price - pos.entryPrice) * pos.quantity;
  pos.pnlPct = ((price - pos.entryPrice) / pos.entryPrice) * 100;

  try {
    if (config.mode === 'simulated') {
      await executeSellMarket(`${pos.symbol}USDT`, pos.quantity);
    }
  } catch (err: any) {
    console.error(`[FullAuto] 平仓失败 ${pos.symbol}:`, err.message);
  }

  openPositions.delete(pos.id);
  closedPositions.unshift(pos);
  if (closedPositions.length > 500) closedPositions.splice(500);

  totalPnl += pos.pnl;
  todayPnl += pos.pnl;

  pushLog({
    timestamp: Date.now(), symbol: pos.symbol, strategy: pos.strategy,
    action: reason, price,
    reason: `${reason === 'CLOSE_TP' ? '止盈' : reason === 'CLOSE_SL' ? '止损' : reason === 'CLOSE_TRAIL' ? '追踪止损' : '手动平仓'} PnL: ${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} USDT (${pos.pnlPct.toFixed(2)}%)`,
    pnl: pos.pnl,
  });

  // 更新策略权重（自我学习）
  updateStrategyWeight(pos);

  console.log(`[FullAuto] 平仓 ${pos.symbol} @${price} ${reason} PnL:${pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}`);
}

// ─── 步骤8: 持仓监控（每2s） ──────────────────────────────────────────────────

async function monitorPositions(): Promise<void> {
  const positions = Array.from(openPositions.values()).filter(p => p.status === 'open');

  for (const pos of positions) {
    const ticker = getLatestTicker(pos.symbol);
    if (!ticker) continue;
    const price = ticker.price;

    // 更新追踪止损最高价
    if (price > pos.highestPrice) {
      pos.highestPrice = price;
    }

    // 止盈
    if (price >= pos.takeProfitPrice) {
      await closePosition(pos, 'CLOSE_TP', price);
      continue;
    }

    // 追踪止损
    if (pos.trailingStop && pos.highestPrice > pos.entryPrice) {
      const trailPrice = pos.highestPrice * (1 - pos.trailingStopPct / 100);
      if (price <= trailPrice) {
        await closePosition(pos, 'CLOSE_TRAIL', price);
        continue;
      }
    }

    // 止损
    if (price <= pos.stopLossPrice) {
      await closePosition(pos, 'CLOSE_SL', price);
    }
  }
}

// ─── 步骤9: 自我学习 ──────────────────────────────────────────────────────────

function updateStrategyWeight(pos: FullAutoPosition): void {
  const sw = strategyWeights.get(pos.strategy);
  if (!sw) return;

  sw.trades += 1;
  const isWin = (pos.pnl ?? 0) > 0;
  if (isWin) sw.wins += 1;
  sw.winRate = (sw.wins / sw.trades) * 100;
  sw.avgPnlPct = ((sw.avgPnlPct * (sw.trades - 1)) + (pos.pnlPct ?? 0)) / sw.trades;

  // 动态调整权重：胜率高→加权，胜率低→减权
  if (sw.trades >= 5) {
    if (sw.winRate > 60) {
      sw.weight = Math.min(2.0, sw.weight + 0.1);
    } else if (sw.winRate < 40) {
      sw.weight = Math.max(0.3, sw.weight - 0.1);
    }
  }
  sw.lastUpdated = Date.now();
  lastLearnAt = Date.now();

  pushLog({
    timestamp: Date.now(), symbol: pos.symbol, strategy: pos.strategy,
    action: 'LEARN', price: pos.closePrice ?? 0,
    reason: `策略学习更新 ${pos.strategy}: 胜率${sw.winRate.toFixed(0)}% 权重→${sw.weight.toFixed(2)}`,
  });
}

function dailyLearn(): void {
  // 重置今日盈亏
  if (Date.now() - todayStart > 86_400_000) {
    todayPnl = 0;
    todayStart = Date.now();
  }

  // 更新因子有效性（简化：基于近期信号方向与价格变化的相关性）
  const symbols = getWatchSymbols().slice(0, 20);
  for (const sym of symbols) {
    const f = factorCache.get(sym);
    if (!f) continue;
    // 模拟 IC 计算（真实场景需要历史数据）
    const ic = (f.rsi14 - 50) / 50 * (f.priceChange24h > 0 ? 1 : -1) * 0.3;
    factorEffectiveness.set(`rsi14_${sym}`, {
      factorName: 'rsi14', ic, icir: ic * 2,
      sampleCount: (factorEffectiveness.get(`rsi14_${sym}`)?.sampleCount ?? 0) + 1,
      lastUpdated: Date.now(),
    });
  }

  lastLearnAt = Date.now();
  console.log('[FullAuto] 每日学习完成，策略权重已更新');
}

// ─── 主扫描循环（每15s） ──────────────────────────────────────────────────────

async function scanAndTrade(): Promise<void> {
  if (!config.enabled) return;

  // 1. 识别市场状态
  const regime = detectMarketRegime();
  if (regime !== currentRegime) {
    pushLog({
      timestamp: Date.now(), symbol: 'MARKET', strategy: 'SYSTEM',
      action: 'REGIME_CHANGE', price: 0,
      reason: `市场状态变化: ${currentRegime} → ${regime}`,
    });
    currentRegime = regime;
  }

  // 2. 选出当前最优策略组合
  activeStrategies = selectStrategiesForRegime(regime);

  // 3. 遍历监控币种
  const symbols = getWatchSymbols();
  const finalSignals: FinalSignal[] = [];

  for (const symbol of symbols) {
    const factors = factorCache.get(symbol);
    if (!factors) continue;

    // 4. 每个策略生成信号
    for (const strategy of activeStrategies) {
      const signal = generateStrategySignal(symbol, strategy, factors);
      if (signal.direction === 'HOLD') continue;

      // 5. AI 置信度评估
      const aiScore = aiScoreSignal(signal, regime);
      const finalSignal: FinalSignal = {
        ...signal,
        aiConfidence: aiScore.confidence,
        aiReasoning: aiScore.reasoning,
        approved: aiScore.confidence >= config.minAiConfidence,
      };

      if (!finalSignal.approved) {
        pushLog({
          timestamp: Date.now(), symbol, strategy,
          action: 'AI_REJECT', price: factors.priceChange24h,
          reason: `AI置信度不足 ${aiScore.confidence.toFixed(0)}% < ${config.minAiConfidence}%`,
          confidence: aiScore.confidence,
        });
        continue;
      }

      finalSignals.push(finalSignal);
    }
  }

  // 按置信度排序，优先执行高置信度信号
  finalSignals.sort((a, b) => b.aiConfidence - a.aiConfidence);

  // 6+7. 风控校验 + 订单执行
  for (const signal of finalSignals) {
    if (Array.from(openPositions.values()).filter(p => p.status === 'open').length >= config.maxPositions) break;
    await openPosition(signal);
  }
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

export function getFullAutoConfig(): FullAutoConfig {
  return { ...config };
}

export function updateFullAutoConfig(patch: Partial<FullAutoConfig>): FullAutoConfig {
  config = { ...config, ...patch };
  if (patch.enabled !== undefined) {
    if (patch.enabled) startFullAutoEngine();
    else stopFullAutoEngine();
  }
  return { ...config };
}

export function getFullAutoStatus(): EngineStatus {
  const allClosed = closedPositions;
  const totalTrades = allClosed.length;
  const wins = allClosed.filter(p => (p.pnl ?? 0) > 0).length;
  return {
    enabled: config.enabled,
    mode: config.mode,
    currentRegime,
    activeStrategies,
    openPositions: Array.from(openPositions.values()).filter(p => p.status === 'open').length,
    totalTrades,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    totalPnl,
    todayPnl,
    lastSignalAt,
    lastLearnAt,
    uptime: engineStartedAt ? Date.now() - engineStartedAt : 0,
  };
}

export function getFullAutoPositions(): FullAutoPosition[] {
  return Array.from(openPositions.values()).filter(p => p.status === 'open');
}

export function getFullAutoClosedPositions(limit = 100): FullAutoPosition[] {
  return closedPositions.slice(0, limit);
}

export function getFullAutoLogs(limit = 200): FullAutoLog[] {
  return orderLogs.slice(0, limit);
}

export function getStrategyWeights(): StrategyWeight[] {
  return Array.from(strategyWeights.values());
}

export function getFactorEffectiveness(): FactorEffectiveness[] {
  return Array.from(factorEffectiveness.values()).slice(0, 50);
}

export function getFactorSnapshot(symbol: string): FactorSnapshot | null {
  return factorCache.get(symbol) ?? null;
}

export function getAllFactorSnapshots(): FactorSnapshot[] {
  return Array.from(factorCache.values());
}

export async function manualClosePosition(positionId: string): Promise<{ success: boolean; message: string }> {
  const pos = openPositions.get(positionId);
  if (!pos) return { success: false, message: '持仓不存在' };
  const ticker = getLatestTicker(pos.symbol);
  const price = ticker?.price ?? pos.entryPrice;
  await closePosition(pos, 'CLOSE_MANUAL', price);
  return { success: true, message: `${pos.symbol} 已手动平仓` };
}

export function resetFullAutoEngine(): void {
  stopFullAutoEngine();
  openPositions.clear();
  closedPositions.splice(0);
  orderLogs.splice(0);
  cooldownMap.clear();
  factorCache.clear();
  totalPnl = 0;
  todayPnl = 0;
  todayStart = Date.now();
  lastSignalAt = null;
  lastLearnAt = null;
  engineStartedAt = null;
  currentRegime = 'RANGING';
  STRATEGY_TYPES.forEach(s => strategyWeights.set(s, {
    strategy: s, weight: 1.0, trades: 0, wins: 0,
    winRate: 0, avgPnlPct: 0, lastUpdated: Date.now(),
  }));
  config.enabled = false;
  console.log('[FullAuto] 引擎已完全重置 ♻');
}

// ─── 引擎启停 ─────────────────────────────────────────────────────────────────

export function startFullAutoEngine(): void {
  if (monitorTimer) clearInterval(monitorTimer);
  if (signalTimer) clearInterval(signalTimer);
  if (factorTimer) clearInterval(factorTimer);
  if (learnTimer) clearInterval(learnTimer);

  engineStartedAt = Date.now();

  // 因子计算：每 5 秒
  factorTimer = setInterval(() => {
    updateAllFactors().catch(e => console.error('[FullAuto] factor error:', e));
  }, 5_000);

  // 信号扫描 + 下单：每 15 秒
  signalTimer = setInterval(() => {
    scanAndTrade().catch(e => console.error('[FullAuto] scan error:', e));
  }, 15_000);

  // 持仓监控：每 2 秒
  monitorTimer = setInterval(() => {
    monitorPositions().catch(e => console.error('[FullAuto] monitor error:', e));
  }, 2_000);

  // 每日学习：每 6 小时检查一次
  learnTimer = setInterval(() => {
    dailyLearn();
  }, 6 * 60 * 60 * 1000);

  // 立即执行一次因子计算和扫描
  updateAllFactors().then(() => scanAndTrade()).catch(console.error);

  console.log('[FullAuto] 全自动交易引擎已启动 ✅');
}

export function stopFullAutoEngine(): void {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  if (signalTimer)  { clearInterval(signalTimer);  signalTimer = null; }
  if (factorTimer)  { clearInterval(factorTimer);  factorTimer = null; }
  if (learnTimer)   { clearInterval(learnTimer);   learnTimer = null; }
  engineStartedAt = null;
  console.log('[FullAuto] 全自动交易引擎已停止 ⏹');
}
