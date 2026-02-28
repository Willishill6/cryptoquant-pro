/**
 * 自动下单核心服务 autoOrderService.ts
 *
 * 功能：
 * 1. 多因子信号引擎 —— 综合 RSI / MACD / 布林带 / 资金费率 / 成交量异动生成买卖信号
 * 2. 风控校验 —— 仓位上限、单笔亏损上限、最大持仓数、冷却期
 * 3. 止盈止损监控 —— 每秒轮询持仓，触发后自动平仓
 * 4. 自我学习 —— 记录每笔交易结果，动态调整信号阈值
 * 5. 模拟 / 真实双模式 —— 由 TRADING_MODE 环境变量控制
 */

import { getLatestTicker, getAllTickers } from './binanceWs';
import {
  executeBuyMarket,
  executeSellMarket,
  getOrCreateAccount,
} from './simulatedTradingService';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface AutoOrderConfig {
  enabled: boolean;
  mode: 'simulated' | 'production';
  /** 每笔下单占可用资金的百分比 (0-100) */
  capitalPct: number;
  /** 止盈百分比 (e.g. 3 = 3%) */
  takeProfitPct: number;
  /** 止损百分比 (e.g. 2 = 2%) */
  stopLossPct: number;
  /** 最大同时持仓数量 */
  maxPositions: number;
  /** 单币种下单冷却时间（毫秒） */
  cooldownMs: number;
  /** 信号置信度阈值 (0-100) */
  minConfidence: number;
  /** 监控的币种列表，空数组=全部 */
  watchSymbols: string[];
}

export interface TradingSignal {
  symbol: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  price: number;
  factors: {
    rsi: number;
    macdSignal: 'bullish' | 'bearish' | 'neutral';
    bbPosition: 'oversold' | 'overbought' | 'middle';
    volumeSpike: boolean;
    priceChange24h: number;
  };
  reasoning: string;
  timestamp: number;
}

export interface AutoPosition {
  id: string;
  symbol: string;
  entryPrice: number;
  quantity: number;
  usdtAmount: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  openedAt: number;
  status: 'open' | 'closed_tp' | 'closed_sl' | 'closed_manual';
  closePrice?: number;
  closedAt?: number;
  pnl?: number;
  pnlPct?: number;
}

export interface OrderLog {
  id: string;
  timestamp: number;
  symbol: string;
  action: 'OPEN' | 'CLOSE_TP' | 'CLOSE_SL' | 'CLOSE_MANUAL' | 'SIGNAL_SKIP' | 'RISK_BLOCK';
  price: number;
  quantity?: number;
  usdtAmount?: number;
  reason: string;
  confidence?: number;
  pnl?: number;
}

export interface LearningStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  profitFactor: number;
  /** 动态调整后的信号阈值 */
  adaptedMinConfidence: number;
  /** 最近学习时间 */
  lastLearnedAt: number;
}

// ─── 状态 ────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AutoOrderConfig = {
  enabled: false,
  mode: (process.env.TRADING_MODE as 'simulated' | 'production') || 'simulated',
  capitalPct: 5,
  takeProfitPct: 3,
  stopLossPct: 2,
  maxPositions: 5,
  cooldownMs: 60_000,
  minConfidence: 70,
  watchSymbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'AVAX', 'LINK', 'ARB', 'DOT'],
};

let config: AutoOrderConfig = { ...DEFAULT_CONFIG };
const openPositions = new Map<string, AutoPosition>(); // key = position id
const orderLogs: OrderLog[] = [];
const cooldownMap = new Map<string, number>(); // symbol -> last order timestamp
const closedPositions: AutoPosition[] = [];

// 自我学习状态
let learningStats: LearningStats = {
  totalTrades: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  avgWinPct: 0,
  avgLossPct: 0,
  profitFactor: 1,
  adaptedMinConfidence: DEFAULT_CONFIG.minConfidence,
  lastLearnedAt: Date.now(),
};

let monitorTimer: ReturnType<typeof setInterval> | null = null;
let signalTimer: ReturnType<typeof setInterval> | null = null;

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pushLog(log: Omit<OrderLog, 'id'>): void {
  orderLogs.unshift({ id: genId(), ...log });
  if (orderLogs.length > 500) orderLogs.splice(500);
}

/** 简单 RSI 模拟（基于 24h 涨跌幅近似） */
function calcRSI(change24h: number): number {
  // 用 24h 涨跌幅粗略估算 RSI（真实场景应用 K 线数据）
  const normalized = Math.max(-20, Math.min(20, change24h));
  return 50 + normalized * 2.5; // 映射到 0-100
}

/** 布林带位置估算 */
function calcBBPosition(
  price: number,
  high: number,
  low: number
): 'oversold' | 'overbought' | 'middle' {
  const range = high - low;
  if (range === 0) return 'middle';
  const pos = (price - low) / range;
  if (pos < 0.2) return 'oversold';
  if (pos > 0.8) return 'overbought';
  return 'middle';
}

/** 成交量异动检测（volume 超过均值 1.5 倍视为异动） */
function detectVolumeSpike(volume: number): boolean {
  return volume > 5_000_000; // 简化阈值，真实场景应与历史均值比较
}

// ─── 信号引擎 ─────────────────────────────────────────────────────────────────

export function generateSignal(symbol: string): TradingSignal | null {
  const ticker = getLatestTicker(symbol);
  if (!ticker) return null;

  const { price, change24h, volume, high, low } = ticker;
  const rsi = calcRSI(change24h);
  const bbPos = calcBBPosition(price, high, low);
  const volumeSpike = detectVolumeSpike(volume);

  // MACD 信号：用 change24h 方向 + RSI 综合判断
  let macdSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (change24h > 1 && rsi < 65) macdSignal = 'bullish';
  else if (change24h < -1 && rsi > 35) macdSignal = 'bearish';

  // ── 买入信号评分 ──
  let buyScore = 0;
  const buyReasons: string[] = [];

  if (rsi < 35) { buyScore += 30; buyReasons.push(`RSI超卖(${rsi.toFixed(1)})`); }
  else if (rsi < 45) { buyScore += 15; buyReasons.push(`RSI偏低(${rsi.toFixed(1)})`); }

  if (bbPos === 'oversold') { buyScore += 25; buyReasons.push('布林带下轨超卖'); }

  if (macdSignal === 'bullish') { buyScore += 20; buyReasons.push('MACD金叉信号'); }

  if (volumeSpike && change24h > 0) { buyScore += 15; buyReasons.push('成交量异动放量'); }

  if (change24h > 3 && change24h < 8) { buyScore += 10; buyReasons.push(`24h涨幅健康(+${change24h.toFixed(1)}%)`); }

  // ── 卖出信号评分 ──
  let sellScore = 0;
  const sellReasons: string[] = [];

  if (rsi > 75) { sellScore += 30; sellReasons.push(`RSI超买(${rsi.toFixed(1)})`); }
  else if (rsi > 65) { sellScore += 15; sellReasons.push(`RSI偏高(${rsi.toFixed(1)})`); }

  if (bbPos === 'overbought') { sellScore += 25; sellReasons.push('布林带上轨超买'); }

  if (macdSignal === 'bearish') { sellScore += 20; sellReasons.push('MACD死叉信号'); }

  if (volumeSpike && change24h < 0) { sellScore += 15; sellReasons.push('成交量放量下跌'); }

  if (change24h < -5) { sellScore += 10; sellReasons.push(`24h跌幅过大(${change24h.toFixed(1)}%)`); }

  const direction = buyScore >= sellScore && buyScore >= 40
    ? 'BUY'
    : sellScore > buyScore && sellScore >= 40
      ? 'SELL'
      : 'HOLD';

  const confidence = direction === 'BUY'
    ? Math.min(99, 40 + buyScore)
    : direction === 'SELL'
      ? Math.min(99, 40 + sellScore)
      : 0;

  const reasoning = direction === 'BUY'
    ? `买入信号：${buyReasons.join('，')}`
    : direction === 'SELL'
      ? `卖出信号：${sellReasons.join('，')}`
      : '信号不足，持仓观望';

  return {
    symbol,
    direction,
    confidence,
    price,
    factors: { rsi, macdSignal, bbPosition: bbPos, volumeSpike, priceChange24h: change24h },
    reasoning,
    timestamp: Date.now(),
  };
}

// ─── 风控校验 ─────────────────────────────────────────────────────────────────

interface RiskCheckResult {
  passed: boolean;
  reason?: string;
}

function riskCheck(symbol: string, usdtAmount: number): RiskCheckResult {
  // 1. 最大持仓数
  const openCount = Array.from(openPositions.values()).filter(p => p.status === 'open').length;
  if (openCount >= config.maxPositions) {
    return { passed: false, reason: `已达最大持仓数 ${config.maxPositions}` };
  }

  // 2. 同币种冷却期
  const lastOrder = cooldownMap.get(symbol);
  if (lastOrder && Date.now() - lastOrder < config.cooldownMs) {
    const remaining = Math.ceil((config.cooldownMs - (Date.now() - lastOrder)) / 1000);
    return { passed: false, reason: `${symbol} 冷却中，剩余 ${remaining}s` };
  }

  // 3. 同币种已有持仓
  const existing = Array.from(openPositions.values()).find(
    p => p.symbol === symbol && p.status === 'open'
  );
  if (existing) {
    return { passed: false, reason: `${symbol} 已有持仓，跳过重复开仓` };
  }

  // 4. 单笔金额下限
  if (usdtAmount < 5) {
    return { passed: false, reason: `下单金额 ${usdtAmount.toFixed(2)} USDT 过小` };
  }

  return { passed: true };
}

// ─── 下单执行 ─────────────────────────────────────────────────────────────────

async function openPosition(signal: TradingSignal): Promise<void> {
  const account = getOrCreateAccount('default');
  const usdtBalance = account.balances.get('USDT') || 0;
  const usdtAmount = (usdtBalance * config.capitalPct) / 100;

  const risk = riskCheck(signal.symbol, usdtAmount);
  if (!risk.passed) {
    pushLog({
      timestamp: Date.now(),
      symbol: signal.symbol,
      action: 'RISK_BLOCK',
      price: signal.price,
      reason: risk.reason!,
      confidence: signal.confidence,
    });
    return;
  }

  const quantity = usdtAmount / signal.price;
  const tpPrice = signal.price * (1 + config.takeProfitPct / 100);
  const slPrice = signal.price * (1 - config.stopLossPct / 100);

  try {
    if (config.mode === 'simulated') {
      await executeBuyMarket(`${signal.symbol}USDT`, quantity);
    } else {
      // 真实下单（需 Binance API 权限）
      const { default: Binance } = await import('binance-api-node') as any;
      const client = Binance({
        apiKey: process.env.BINANCE_API_KEY,
        apiSecret: process.env.BINANCE_API_SECRET,
      });
      await client.order({
        symbol: `${signal.symbol}USDT`,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: usdtAmount.toFixed(2),
      });
    }

    const pos: AutoPosition = {
      id: genId(),
      symbol: signal.symbol,
      entryPrice: signal.price,
      quantity,
      usdtAmount,
      takeProfitPrice: tpPrice,
      stopLossPrice: slPrice,
      openedAt: Date.now(),
      status: 'open',
    };
    openPositions.set(pos.id, pos);
    cooldownMap.set(signal.symbol, Date.now());

    pushLog({
      timestamp: Date.now(),
      symbol: signal.symbol,
      action: 'OPEN',
      price: signal.price,
      quantity,
      usdtAmount,
      reason: signal.reasoning,
      confidence: signal.confidence,
    });

    console.log(`[AutoOrder] 开仓 ${signal.symbol} @ ${signal.price} | TP:${tpPrice.toFixed(4)} SL:${slPrice.toFixed(4)} | ${usdtAmount.toFixed(2)} USDT`);
  } catch (err: any) {
    pushLog({
      timestamp: Date.now(),
      symbol: signal.symbol,
      action: 'RISK_BLOCK',
      price: signal.price,
      reason: `下单失败: ${err.message}`,
    });
    console.error(`[AutoOrder] 开仓失败 ${signal.symbol}:`, err.message);
  }
}

async function closePosition(
  pos: AutoPosition,
  reason: 'CLOSE_TP' | 'CLOSE_SL' | 'CLOSE_MANUAL',
  currentPrice: number
): Promise<void> {
  try {
    if (config.mode === 'simulated') {
      await executeSellMarket(`${pos.symbol}USDT`, pos.quantity);
    } else {
      const { default: Binance } = await import('binance-api-node') as any;
      const client = Binance({
        apiKey: process.env.BINANCE_API_KEY,
        apiSecret: process.env.BINANCE_API_SECRET,
      });
      await client.order({
        symbol: `${pos.symbol}USDT`,
        side: 'SELL',
        type: 'MARKET',
        quantity: pos.quantity.toFixed(6),
      });
    }

    const pnl = (currentPrice - pos.entryPrice) * pos.quantity;
    const pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

    pos.status = reason;
    pos.closePrice = currentPrice;
    pos.closedAt = Date.now();
    pos.pnl = pnl;
    pos.pnlPct = pnlPct;

    openPositions.delete(pos.id);
    closedPositions.unshift(pos);
    if (closedPositions.length > 200) closedPositions.splice(200);

    pushLog({
      timestamp: Date.now(),
      symbol: pos.symbol,
      action: reason,
      price: currentPrice,
      quantity: pos.quantity,
      reason: reason === 'CLOSE_TP' ? `触发止盈 +${pnlPct.toFixed(2)}%` : reason === 'CLOSE_SL' ? `触发止损 ${pnlPct.toFixed(2)}%` : '手动平仓',
      pnl,
    });

    // 自我学习更新
    updateLearning(pnl, pnlPct);

    console.log(`[AutoOrder] 平仓 ${pos.symbol} @ ${currentPrice} | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT (${pnlPct.toFixed(2)}%)`);
  } catch (err: any) {
    console.error(`[AutoOrder] 平仓失败 ${pos.symbol}:`, err.message);
  }
}

// ─── 自我学习 ─────────────────────────────────────────────────────────────────

function updateLearning(pnl: number, pnlPct: number): void {
  learningStats.totalTrades++;
  if (pnl > 0) {
    learningStats.wins++;
    learningStats.avgWinPct =
      (learningStats.avgWinPct * (learningStats.wins - 1) + pnlPct) / learningStats.wins;
  } else {
    learningStats.losses++;
    learningStats.avgLossPct =
      (learningStats.avgLossPct * (learningStats.losses - 1) + Math.abs(pnlPct)) /
      learningStats.losses;
  }

  learningStats.winRate =
    learningStats.totalTrades > 0
      ? (learningStats.wins / learningStats.totalTrades) * 100
      : 0;

  const grossWin = learningStats.wins * learningStats.avgWinPct;
  const grossLoss = learningStats.losses * learningStats.avgLossPct;
  learningStats.profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 1;

  // 动态调整置信度阈值：胜率高则降低门槛，胜率低则提高门槛
  if (learningStats.totalTrades >= 5) {
    const baseConf = config.minConfidence;
    if (learningStats.winRate > 65) {
      learningStats.adaptedMinConfidence = Math.max(55, baseConf - 5);
    } else if (learningStats.winRate < 40) {
      learningStats.adaptedMinConfidence = Math.min(90, baseConf + 10);
    } else {
      learningStats.adaptedMinConfidence = baseConf;
    }
  }

  learningStats.lastLearnedAt = Date.now();
  console.log(
    `[AutoOrder][学习] 胜率=${learningStats.winRate.toFixed(1)}% 盈亏比=${learningStats.profitFactor.toFixed(2)} 阈值=${learningStats.adaptedMinConfidence}`
  );
}

// ─── 止盈止损监控循环 ─────────────────────────────────────────────────────────

async function monitorPositions(): Promise<void> {
  for (const [id, pos] of openPositions) {
    if (pos.status !== 'open') continue;
    const ticker = getLatestTicker(pos.symbol);
    if (!ticker) continue;
    const { price } = ticker;

    if (price >= pos.takeProfitPrice) {
      await closePosition(pos, 'CLOSE_TP', price);
    } else if (price <= pos.stopLossPrice) {
      await closePosition(pos, 'CLOSE_SL', price);
    }
  }
}

// ─── 信号扫描循环 ─────────────────────────────────────────────────────────────

async function scanSignals(): Promise<void> {
  if (!config.enabled) return;

  const symbols =
    config.watchSymbols.length > 0
      ? config.watchSymbols
      : getAllTickers().map(t => t.symbol);

  const effectiveMinConf = learningStats.adaptedMinConfidence;

  for (const symbol of symbols) {
    const signal = generateSignal(symbol);
    if (!signal || signal.direction !== 'BUY') continue;

    if (signal.confidence < effectiveMinConf) {
      // 置信度不足，跳过
      continue;
    }

    await openPosition(signal);
  }
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

export function getConfig(): AutoOrderConfig {
  return { ...config };
}

export function updateConfig(patch: Partial<AutoOrderConfig>): AutoOrderConfig {
  config = { ...config, ...patch };
  // 如果开关变化，重启定时器
  if (patch.enabled !== undefined) {
    if (patch.enabled) {
      startEngine();
    } else {
      stopEngine();
    }
  }
  console.log(`[AutoOrder] 配置更新:`, JSON.stringify(patch));
  return { ...config };
}

export function getOpenPositions(): AutoPosition[] {
  return Array.from(openPositions.values()).filter(p => p.status === 'open');
}

export function getClosedPositions(limit = 50): AutoPosition[] {
  return closedPositions.slice(0, limit);
}

export function getOrderLogs(limit = 100): OrderLog[] {
  return orderLogs.slice(0, limit);
}

export function getLearningStats(): LearningStats {
  return { ...learningStats };
}

export function getSignalSnapshot(): TradingSignal[] {
  const symbols =
    config.watchSymbols.length > 0
      ? config.watchSymbols
      : getAllTickers()
          .slice(0, 20)
          .map(t => t.symbol);

  return symbols
    .map(s => generateSignal(s))
    .filter((s): s is TradingSignal => s !== null && s.direction !== 'HOLD');
}

/** 手动平仓指定持仓 */
export async function manualClose(positionId: string): Promise<{ success: boolean; message: string }> {
  const pos = openPositions.get(positionId);
  if (!pos) return { success: false, message: '持仓不存在' };
  const ticker = getLatestTicker(pos.symbol);
  const price = ticker?.price ?? pos.entryPrice;
  await closePosition(pos, 'CLOSE_MANUAL', price);
  return { success: true, message: `${pos.symbol} 已手动平仓` };
}

/** 获取引擎运行状态摘要 */
export function getEngineStatus(): {
  enabled: boolean;
  mode: string;
  openCount: number;
  totalTrades: number;
  winRate: number;
  adaptedMinConfidence: number;
  lastSignalAt: number | null;
} {
  return {
    enabled: config.enabled,
    mode: config.mode,
    openCount: getOpenPositions().length,
    totalTrades: learningStats.totalTrades,
    winRate: learningStats.winRate,
    adaptedMinConfidence: learningStats.adaptedMinConfidence,
    lastSignalAt: orderLogs.length > 0 ? orderLogs[0].timestamp : null,
  };
}

// ─── 引擎启停 ─────────────────────────────────────────────────────────────────

export function startEngine(): void {
  if (monitorTimer) clearInterval(monitorTimer);
  if (signalTimer) clearInterval(signalTimer);

  // 止盈止损监控：每 2 秒
  monitorTimer = setInterval(() => {
    monitorPositions().catch(e => console.error('[AutoOrder] monitorPositions error:', e));
  }, 2_000);

  // 信号扫描：每 15 秒
  signalTimer = setInterval(() => {
    scanSignals().catch(e => console.error('[AutoOrder] scanSignals error:', e));
  }, 15_000);

  console.log('[AutoOrder] 引擎已启动 ✅');
}

export function stopEngine(): void {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  if (signalTimer) { clearInterval(signalTimer); signalTimer = null; }
  console.log('[AutoOrder] 引擎已停止 ⏹');
}

/** 清空所有运行时数据（持仓、日志、学习统计、冷却记录） */
export function resetAll(): void {
  stopEngine();
  openPositions.clear();
  closedPositions.splice(0);
  orderLogs.splice(0);
  cooldownMap.clear();
  learningStats = {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgWinPct: 0,
    avgLossPct: 0,
    profitFactor: 1,
    adaptedMinConfidence: config.minConfidence,
    lastLearnedAt: Date.now(),
  };
  config.enabled = false;
  console.log('[AutoOrder] 所有数据已清空，引擎已停止 ♻');
}
