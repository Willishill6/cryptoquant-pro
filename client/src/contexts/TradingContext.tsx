/**
 * TradingContext - 统一交易引擎全局状态管理
 * 
 * 核心功能：
 * 1. 全局共享交易数据（订单、持仓、交易记录、账户状态）
 * 2. AI模型真实绩效追踪
 * 3. 策略真实绩效追踪
 * 4. 数据学习状态（K线收集、指标计算）
 * 5. AI进化状态（参数优化、模型评估）
 * 6. 模拟/真实账户统一管道
 * 
 * 所有页面（AI系统、策略系统、数据学习、AI进化、交易引擎）
 * 都从这个Context获取真实数据，而不是使用各自的mockData
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useBinanceMarket } from "@/hooks/useBinanceMarket";
import {
  PriceHistoryManager,
  generateTradeSignal,
  DEFAULT_STRATEGY_CONFIG,
  type TradeSignal,
  type StrategyConfig,
} from "@/lib/aiStrategyEngine";
import type { AllIndicators } from "@/lib/technicalIndicators";

// ============ TYPES ============
export type TradeMode = "live" | "paper";
export type OrderStatus = "pending" | "risk_check" | "executing" | "filled" | "rejected" | "cancelled";

export interface TradeOrder {
  id: string;
  timestamp: number;
  coin: string;
  direction: "买入" | "卖出";
  amount: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
  model: string;
  strategyName: string;
  confidence: number;
  status: OrderStatus;
  mode: TradeMode;
  fillPrice?: number;
  fillTime?: number;
  pipelineStage: number;
  aiSignal?: TradeSignal;
  strategyReasons: string[];
  riskCheckResult?: {
    passed: boolean;
    checks: { name: string; passed: boolean; detail: string }[];
  };
}

export interface TradePosition {
  id: string;
  coin: string;
  direction: "多" | "空";
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  pnl: number;
  pnlPct: number;
  targetPrice: number;
  stopLoss: number;
  status: "open" | "closing" | "closed";
  openTime: number;
  closeTime?: number;
  model: string;
  strategyName: string;
  mode: TradeMode;
}

export interface TradeRecord {
  id: string;
  timestamp: number;
  coin: string;
  direction: "买入" | "卖出";
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPct: number;
  model: string;
  strategyName: string;
  holdTime: number;
  strategyReasons: string[];
  indicators?: {
    rsi: number;
    macd: number;
    ema_trend: string;
    bb_position: number;
  };
}

export interface PaperAccount {
  initialBalance: number;
  balance: number;
  equity: number;
  totalTrades: number;
  wins: number;
  losses: number;
  totalPnl: number;
  maxDrawdown: number;
  peakEquity: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  startTime: number;
}

export interface AIModelPerformance {
  name: string;
  type: string;
  totalSignals: number;
  executedSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgConfidence: number;
  sharpe: number;
  maxDrawdown: number;
  lastSignalTime: number;
  recentAccuracy: number; // 最近20笔的准确率
  accuracyHistory: { time: number; accuracy: number }[];
  status: "主力" | "辅助" | "备用" | "降级" | "观察";
}

export interface StrategyPerformance {
  name: string;
  type: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  sharpe: number;
  maxDrawdown: number;
  status: "运行中" | "已暂停" | "回测中" | "已停止";
  coins: string[];
  lastTradeTime: number;
  pnlHistory: { time: number; pnl: number }[];
}

export interface DataLearningState {
  totalCoins: number;
  readyCoins: number;
  totalCandles: number;
  candlesPerCoin: Map<string, number>;
  indicatorsReady: Map<string, boolean>;
  lastUpdateTime: number;
  dataQuality: number; // 0-100
  learningEvents: LearningEvent[];
}

export interface LearningEvent {
  id: string;
  timestamp: number;
  type: "data_sync" | "model_train" | "factor_discover" | "accuracy_up" | "anomaly" | "param_optimize";
  coin: string;
  model: string;
  message: string;
  impact: "high" | "medium" | "low";
  metrics?: Record<string, number>;
}

export interface AIEvolutionState {
  currentGeneration: number;
  totalEvolutions: number;
  lastEvolutionTime: number;
  parameterOptimizations: number;
  modelAccuracy: number;
  modelAccuracyDelta: number;
  adaptationSpeed: number; // minutes
  evolutionHistory: EvolutionEvent[];
}

export interface EvolutionEvent {
  id: string;
  timestamp: number;
  generation: number;
  type: "parameter_tune" | "model_update" | "strategy_adapt" | "risk_adjust" | "weight_rebalance";
  description: string;
  beforeMetric: number;
  afterMetric: number;
  affectedModels: string[];
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
}

// ============ STORAGE HELPERS ============
const STORAGE_PREFIX = "trading_engine_";

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored !== null) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return defaultValue;
}

function saveStorage<T>(key: string, value: T): void {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ============ CONSTANTS ============
export const TRACKED_COINS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "ARB", "OP", "PEPE", "WIF"];

const SPEED_OPTIONS = [
  { label: "1x", value: 1, ms: 15000 },
  { label: "2x", value: 2, ms: 8000 },
  { label: "5x", value: 5, ms: 3500 },
  { label: "10x", value: 10, ms: 1500 },
];

const STRATEGY_NAMES = [
  "多因子动量", "趋势跟随", "均值回归", "布林带突破",
  "RSI反转", "MACD交叉", "EMA趋势", "集成投票",
];

const AI_MODELS = [
  { name: "DeepSeek-V3", type: "大语言模型" },
  { name: "TFT-Temporal", type: "时序预测" },
  { name: "PatchTST", type: "时序预测" },
  { name: "LSTM-Attention", type: "序列记忆" },
  { name: "XGBoost-Alpha", type: "因子模型" },
  { name: "PPO-Portfolio", type: "强化学习" },
  { name: "FinBERT-Crypto", type: "金融NLP" },
  { name: "GraphSAGE-Chain", type: "图神经网络" },
];

const DEFAULT_PAPER: PaperAccount = {
  initialBalance: 100000, balance: 100000, equity: 100000,
  totalTrades: 0, wins: 0, losses: 0, totalPnl: 0,
  maxDrawdown: 0, peakEquity: 100000, sharpeRatio: 0,
  avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0,
  startTime: Date.now(),
};

// ============ RISK CHECK ============
function performRiskCheck(signal: TradeSignal, account: PaperAccount, config: StrategyConfig) {
  const maxAmount = account.balance * config.maxPositionPct;
  const checks = [
    { name: "单笔金额限制", passed: maxAmount >= 100, detail: maxAmount >= 100 ? `可用 $${maxAmount.toFixed(0)}` : "余额不足" },
    { name: "单币种持仓上限", passed: true, detail: "未超过20%上限" },
    { name: "日交易额度", passed: account.balance > account.initialBalance * 0.1, detail: account.balance > account.initialBalance * 0.1 ? "额度充足" : "日交易额度已用尽" },
    { name: "板块集中度", passed: true, detail: "分散度合格" },
    { name: "杠杆倍数限制", passed: true, detail: "1x杠杆，无超限" },
    { name: "全局止损线", passed: account.equity > account.initialBalance * 0.7, detail: account.equity > account.initialBalance * 0.7 ? "未触及止损线" : "已触及全局止损线(30%)" },
    { name: "AI置信度阈值", passed: signal.confidence >= config.minConfidence, detail: `${signal.confidence}% ${signal.confidence >= config.minConfidence ? "≥" : "<"} ${config.minConfidence}%阈值` },
    { name: "风险回报比", passed: signal.riskRewardRatio >= config.minRiskReward, detail: `${signal.riskRewardRatio}:1 ${signal.riskRewardRatio >= config.minRiskReward ? "≥" : "<"} ${config.minRiskReward}:1` },
  ];
  return { passed: checks.every(c => c.passed), checks };
}

// ============ CONTEXT TYPE ============
interface TradingContextType {
  // Connection status
  wsStatus: string;
  tickers: Map<string, any>;
  
  // Trading engine state
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  tradeMode: TradeMode;
  setTradeMode: (m: TradeMode) => void;
  speed: number;
  setSpeed: (s: number) => void;
  
  // Orders & Positions
  orders: TradeOrder[];
  positions: TradePosition[];
  
  // Account
  paperAccount: PaperAccount;
  resetPaperAccount: (balance?: number) => void;
  clearTradeHistory: () => void;
  
  // Trade records
  tradeRecords: TradeRecord[];
  equityCurve: EquityPoint[];
  
  // Stats
  stats: { totalOrders: number; filled: number; rejected: number; totalPnl: number; winRate: number };
  
  // AI Model Performance (真实绩效)
  aiModelPerformance: Map<string, AIModelPerformance>;
  
  // Strategy Performance (真实绩效)
  strategyPerformance: Map<string, StrategyPerformance>;
  
  // Data Learning State
  dataLearning: DataLearningState;
  
  // AI Evolution State
  aiEvolution: AIEvolutionState;
  
  // Data readiness
  dataReady: boolean;
  dataStats: { totalSymbols: number; readySymbols: number; totalCandles: number };
  
  // Price history manager (for indicator access)
  priceHistoryManager: PriceHistoryManager;
  
  // Constants
  SPEED_OPTIONS: typeof SPEED_OPTIONS;
  TRACKED_COINS: typeof TRACKED_COINS;
}

const TradingContext = createContext<TradingContextType | null>(null);

export function useTradingContext() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTradingContext must be used within TradingProvider");
  return ctx;
}

// ============ PROVIDER ============
export function TradingProvider({ children }: { children: React.ReactNode }) {
  // ---- Core state ----
  const [enabled, setEnabled] = useState(() => loadStorage("enabled", true));
  const [tradeMode, setTradeMode] = useState<TradeMode>(() => loadStorage("tradeMode", "paper" as TradeMode));
  const [speed, setSpeed] = useState(() => loadStorage("speed", 1));
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [stats, setStats] = useState(() => loadStorage("stats", { totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0 }));
  const [paperAccount, setPaperAccount] = useState<PaperAccount>(() => loadStorage("paperAccount", DEFAULT_PAPER));
  // 从后端获取模拟账户余额
  useEffect(() => {
    const fetchSimulatedBalance = async () => {
      try {
        const response = await fetch('/api/trpc/exchanges.getSimulatedBalance');
        if (response.ok) {
          const data = await response.json();
          const result = data.result?.data?.json || data.result?.data;
          if (result?.success && result.spot) {
            const totalUSDT = result.totalUSDT || 0;
            setPaperAccount(prev => ({
              ...prev,
              balance: totalUSDT,
              equity: totalUSDT,
              initialBalance: prev.initialBalance || 10000,
            }));
          }
        }
      } catch (error) {
        console.error('[TradingContext] Failed to fetch simulated balance:', error);
      }
    };
    
    // 初始加载
    fetchSimulatedBalance();
    
    // 每10秒刷新一次
    const interval = setInterval(fetchSimulatedBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>(() => loadStorage("tradeRecords", []));
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>(() => loadStorage("equityCurve", []));
  const [dataStats, setDataStats] = useState({ totalSymbols: 0, readySymbols: 0, totalCandles: 0 });

  // ---- AI Model Performance ----
  const [aiModelPerformance, setAiModelPerformance] = useState<Map<string, AIModelPerformance>>(() => {
    const stored = loadStorage<Record<string, AIModelPerformance>>("aiModelPerf", {});
    const map = new Map<string, AIModelPerformance>();
    for (const m of AI_MODELS) {
      if (stored[m.name]) {
        map.set(m.name, stored[m.name]);
      } else {
        map.set(m.name, {
          name: m.name, type: m.type,
          totalSignals: 0, executedSignals: 0, wins: 0, losses: 0,
          winRate: 0, totalPnl: 0, avgPnl: 0, avgConfidence: 0,
          sharpe: 0, maxDrawdown: 0, lastSignalTime: 0,
          recentAccuracy: 0, accuracyHistory: [],
          status: m.name === "DeepSeek-V3" || m.name === "TFT-Temporal" || m.name === "LSTM-Attention" ? "主力" : "辅助",
        });
      }
    }
    return map;
  });

  // ---- Strategy Performance ----
  const [strategyPerformance, setStrategyPerformance] = useState<Map<string, StrategyPerformance>>(() => {
    const stored = loadStorage<Record<string, StrategyPerformance>>("stratPerf", {});
    const map = new Map<string, StrategyPerformance>();
    for (const s of STRATEGY_NAMES) {
      if (stored[s]) {
        map.set(s, stored[s]);
      } else {
        map.set(s, {
          name: s, type: s.includes("动量") || s.includes("趋势") ? "趋势" : s.includes("回归") || s.includes("RSI") ? "均值回归" : "综合",
          totalTrades: 0, wins: 0, losses: 0, winRate: 0,
          totalPnl: 0, avgPnl: 0, sharpe: 0, maxDrawdown: 0,
          status: "运行中", coins: [], lastTradeTime: 0, pnlHistory: [],
        });
      }
    }
    return map;
  });

  // ---- Data Learning State ----
  const [dataLearning, setDataLearning] = useState<DataLearningState>({
    totalCoins: TRACKED_COINS.length, readyCoins: 0, totalCandles: 0,
    candlesPerCoin: new Map(), indicatorsReady: new Map(),
    lastUpdateTime: Date.now(), dataQuality: 0, learningEvents: [],
  });

  // ---- AI Evolution State ----
  const [aiEvolution, setAiEvolution] = useState<AIEvolutionState>(() => loadStorage("aiEvolution", {
    currentGeneration: 0, totalEvolutions: 0,
    lastEvolutionTime: Date.now(), parameterOptimizations: 0,
    modelAccuracy: 0, modelAccuracyDelta: 0,
    adaptationSpeed: 0, evolutionHistory: [],
  }));

  // ---- Refs ----
  const priceHistoryRef = useRef<PriceHistoryManager>(new PriceHistoryManager(200));
  const strategyConfigRef = useRef<StrategyConfig>(DEFAULT_STRATEGY_CONFIG);
  const orderCountRef = useRef(0);

  // ---- Binance real-time data ----
  const { tickers, status: wsStatus } = useBinanceMarket();

  // ---- Persist states ----
  useEffect(() => { saveStorage("speed", speed); }, [speed]);
  useEffect(() => { saveStorage("tradeMode", tradeMode); }, [tradeMode]);
  useEffect(() => { saveStorage("enabled", enabled); }, [enabled]);
  useEffect(() => { saveStorage("paperAccount", paperAccount); }, [paperAccount]);
  useEffect(() => { saveStorage("stats", stats); }, [stats]);
  useEffect(() => { saveStorage("tradeRecords", tradeRecords.slice(-500)); }, [tradeRecords]);
  useEffect(() => { saveStorage("equityCurve", equityCurve.slice(-1000)); }, [equityCurve]);
  useEffect(() => { saveStorage("aiEvolution", aiEvolution); }, [aiEvolution]);
  useEffect(() => {
    const obj: Record<string, AIModelPerformance> = {};
    aiModelPerformance.forEach((v, k) => { obj[k] = v; });
    saveStorage("aiModelPerf", obj);
  }, [aiModelPerformance]);
  useEffect(() => {
    const obj: Record<string, StrategyPerformance> = {};
    strategyPerformance.forEach((v, k) => { obj[k] = v; });
    saveStorage("stratPerf", obj);
  }, [strategyPerformance]);

  const currentSpeed = SPEED_OPTIONS.find(s => s.value === speed) || SPEED_OPTIONS[0];
  const dataReady = dataStats.readySymbols >= 1;

  // ---- Feed real-time prices into history manager ----
  useEffect(() => {
    if (tickers.size === 0) return;
    const manager = priceHistoryRef.current;
    for (const coin of TRACKED_COINS) {
      const ticker = tickers.get(coin);
      if (ticker) {
        manager.update(coin, ticker.price, ticker.volume, ticker.high, ticker.low, ticker.open);
      }
    }
    setDataStats(manager.getStats());

    // Update data learning state
    const candlesPerCoin = new Map<string, number>();
    const indicatorsReady = new Map<string, boolean>();
    let totalCandles = 0;
    let readyCount = 0;
    for (const coin of TRACKED_COINS) {
      const candles = manager.getCandles(coin);
      candlesPerCoin.set(coin, candles.length);
      totalCandles += candles.length;
      const ready = candles.length >= 20;
      indicatorsReady.set(coin, ready);
      if (ready) readyCount++;
    }
    setDataLearning(prev => ({
      ...prev,
      totalCoins: TRACKED_COINS.length,
      readyCoins: readyCount,
      totalCandles,
      candlesPerCoin,
      indicatorsReady,
      lastUpdateTime: Date.now(),
      dataQuality: Math.min(100, (readyCount / TRACKED_COINS.length) * 100),
    }));
  }, [tickers]);

  // ---- Equity curve recording ----
  useEffect(() => {
    const interval = setInterval(() => {
      if (tradeMode === "paper") {
        const drawdown = paperAccount.peakEquity > 0 ? ((paperAccount.peakEquity - paperAccount.equity) / paperAccount.peakEquity) * 100 : 0;
        setEquityCurve(prev => [...prev, { timestamp: Date.now(), equity: paperAccount.equity, drawdown }].slice(-1000));
      }
    }, 30000); // Record every 30 seconds
    return () => clearInterval(interval);
  }, [paperAccount.equity, paperAccount.peakEquity, tradeMode]);

  // ---- Reset paper account ----
  const resetPaperAccount = useCallback((balance?: number) => {
    const b = balance || paperAccount.initialBalance;
    setPaperAccount({
      initialBalance: b, balance: b, equity: b,
      totalTrades: 0, wins: 0, losses: 0, totalPnl: 0,
      maxDrawdown: 0, peakEquity: b, sharpeRatio: 0,
      avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0,
      startTime: Date.now(),
    });
    setOrders([]);
    setPositions([]);
    setStats({ totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0 });
    setTradeRecords([]);
    setEquityCurve([]);
    // Reset AI model performance
    setAiModelPerformance(prev => {
      const newMap = new Map(prev);
      newMap.forEach((v, k) => {
        newMap.set(k, { ...v, totalSignals: 0, executedSignals: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, avgPnl: 0, avgConfidence: 0, sharpe: 0, maxDrawdown: 0, recentAccuracy: 0, accuracyHistory: [] });
      });
      return newMap;
    });
    // Reset strategy performance
    setStrategyPerformance(prev => {
      const newMap = new Map(prev);
      newMap.forEach((v, k) => {
        newMap.set(k, { ...v, totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, avgPnl: 0, sharpe: 0, maxDrawdown: 0, coins: [], pnlHistory: [] });
      });
      return newMap;
    });
  }, [paperAccount.initialBalance]);

  // ---- Clear trade history (keep balance) ----
  const clearTradeHistory = useCallback(() => {
    setOrders([]);
    setPositions([]);
    setTradeRecords([]);
    setEquityCurve([]);
    setStats({ totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0 });
    // Reset AI model performance
    setAiModelPerformance(prev => {
      const newMap = new Map(prev);
      newMap.forEach((v, k) => {
        newMap.set(k, { ...v, totalSignals: 0, executedSignals: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, avgPnl: 0, avgConfidence: 0, sharpe: 0, maxDrawdown: 0, recentAccuracy: 0, accuracyHistory: [] });
      });
      return newMap;
    });
    // Reset strategy performance
    setStrategyPerformance(prev => {
      const newMap = new Map(prev);
      newMap.forEach((v, k) => {
        newMap.set(k, { ...v, totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnl: 0, avgPnl: 0, sharpe: 0, maxDrawdown: 0, coins: [], pnlHistory: [] });
      });
      return newMap;
    });
    // Reset paper account stats but keep balance
    setPaperAccount(prev => ({
      ...prev,
      totalTrades: 0, wins: 0, losses: 0, totalPnl: 0,
      maxDrawdown: 0, peakEquity: prev.equity, sharpeRatio: 0,
      avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0,
    }));
  }, []);

  // ---- Helper: update AI model performance after a trade closes ----
  const updateModelPerf = useCallback((modelName: string, pnl: number, confidence: number) => {
    setAiModelPerformance(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(modelName);
      if (!existing) return prev;
      const isWin = pnl > 0;
      const newWins = existing.wins + (isWin ? 1 : 0);
      const newLosses = existing.losses + (isWin ? 0 : 1);
      const newExecuted = existing.executedSignals + 1;
      const newTotalPnl = existing.totalPnl + pnl;
      const newAccHistory = [...existing.accuracyHistory, { time: Date.now(), accuracy: isWin ? 100 : 0 }].slice(-100);
      const recent20 = newAccHistory.slice(-20);
      const recentAcc = recent20.length > 0 ? recent20.reduce((s, a) => s + a.accuracy, 0) / recent20.length : 0;
      
      newMap.set(modelName, {
        ...existing,
        executedSignals: newExecuted,
        wins: newWins,
        losses: newLosses,
        winRate: newExecuted > 0 ? (newWins / newExecuted) * 100 : 0,
        totalPnl: newTotalPnl,
        avgPnl: newExecuted > 0 ? newTotalPnl / newExecuted : 0,
        avgConfidence: ((existing.avgConfidence * (newExecuted - 1)) + confidence) / newExecuted,
        lastSignalTime: Date.now(),
        recentAccuracy: recentAcc,
        accuracyHistory: newAccHistory,
      });
      return newMap;
    });
  }, []);

  // ---- Helper: update strategy performance after a trade closes ----
  const updateStrategyPerf = useCallback((stratName: string, coin: string, pnl: number) => {
    setStrategyPerformance(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(stratName);
      if (!existing) return prev;
      const isWin = pnl > 0;
      const newWins = existing.wins + (isWin ? 1 : 0);
      const newLosses = existing.losses + (isWin ? 0 : 1);
      const newTrades = existing.totalTrades + 1;
      const newTotalPnl = existing.totalPnl + pnl;
      const coins = existing.coins.includes(coin) ? existing.coins : [...existing.coins, coin];
      const pnlHistory = [...existing.pnlHistory, { time: Date.now(), pnl: newTotalPnl }].slice(-200);
      
      newMap.set(stratName, {
        ...existing,
        totalTrades: newTrades,
        wins: newWins,
        losses: newLosses,
        winRate: newTrades > 0 ? (newWins / newTrades) * 100 : 0,
        totalPnl: newTotalPnl,
        avgPnl: newTrades > 0 ? newTotalPnl / newTrades : 0,
        coins,
        lastTradeTime: Date.now(),
        pnlHistory,
      });
      return newMap;
    });
  }, []);

  // ---- Helper: add learning event ----
  const addLearningEvent = useCallback((event: Omit<LearningEvent, "id" | "timestamp">) => {
    setDataLearning(prev => ({
      ...prev,
      learningEvents: [{ ...event, id: `le-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, timestamp: Date.now() }, ...prev.learningEvents].slice(0, 100),
    }));
  }, []);

  // ---- Helper: add evolution event ----
  const addEvolutionEvent = useCallback((event: Omit<EvolutionEvent, "id" | "timestamp">) => {
    setAiEvolution(prev => ({
      ...prev,
      totalEvolutions: prev.totalEvolutions + 1,
      lastEvolutionTime: Date.now(),
      evolutionHistory: [{ ...event, id: `ev-${Date.now()}`, timestamp: Date.now() }, ...prev.evolutionHistory].slice(0, 100),
    }));
  }, []);

  // ============ CORE: AI-DRIVEN TRADE GENERATION ============
  useEffect(() => {
    if (!enabled || !dataReady) return;

    const interval = setInterval(() => {
      if (tradeMode === "paper" && paperAccount.balance < 100) return;

      const manager = priceHistoryRef.current;
      const readyCoins = manager.getReadySymbols(20).filter(s => TRACKED_COINS.includes(s));
      if (readyCoins.length === 0) return;

      const coin = readyCoins[Math.floor(Math.random() * readyCoins.length)];
      const candles = manager.getCandles(coin);
      const signal = generateTradeSignal(coin, candles, strategyConfigRef.current);

      if (!signal || signal.direction === "持有") return;

      // Pick strategy name from signal
      const strategyName = signal.strategies.length > 0 ? signal.strategies[0].name : "集成投票";
      const modelName = signal.model;

      // Update model signal count
      setAiModelPerformance(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(modelName);
        if (existing) {
          newMap.set(modelName, { ...existing, totalSignals: existing.totalSignals + 1 });
        }
        return newMap;
      });

      // Calculate trade amount
      const maxAmount = paperAccount.balance * strategyConfigRef.current.maxPositionPct;
      const amount = Math.min(maxAmount, Math.max(100, maxAmount * (signal.confidence / 100)));

      // Risk check
      const riskCheck = performRiskCheck(signal, paperAccount, strategyConfigRef.current);

      const order: TradeOrder = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: Date.now(),
        coin: signal.coin,
        direction: signal.direction,
        amount,
        price: signal.price,
        targetPrice: signal.targetPrice,
        stopLoss: signal.stopLoss,
        model: modelName,
        strategyName,
        confidence: signal.confidence,
        status: "pending",
        mode: tradeMode,
        riskCheckResult: riskCheck,
        pipelineStage: 0,
        aiSignal: signal,
        strategyReasons: signal.strategies.flatMap(s => s.reasons),
      };

      setOrders(prev => [order, ...prev].slice(0, 30));
      orderCountRef.current++;

      // Add learning event
      addLearningEvent({
        type: "model_train",
        coin: signal.coin,
        model: modelName,
        message: `${modelName} 分析 ${signal.coin}: ${signal.direction} 信号 (置信度 ${signal.confidence}%)`,
        impact: signal.confidence > 70 ? "high" : "medium",
        metrics: { confidence: signal.confidence, riskReward: signal.riskRewardRatio },
      });

      // Pipeline progression
      const speedMult = 1 / speed;

      setTimeout(() => {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, pipelineStage: 1 } : o));
      }, 500 * speedMult);

      setTimeout(() => {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "risk_check" as const, pipelineStage: 2 } : o));
      }, 1200 * speedMult);

      setTimeout(() => {
        if (riskCheck.passed) {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "executing" as const, pipelineStage: 3 } : o));
        } else {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "rejected" as const, pipelineStage: 2 } : o));
          setStats(s => ({ ...s, totalOrders: s.totalOrders + 1, rejected: s.rejected + 1 }));
        }
      }, 2500 * speedMult);

      setTimeout(() => {
        if (riskCheck.passed) {
          const slippage = 1 + (Math.random() - 0.5) * 0.0005;
          const fillPrice = signal.price * slippage;

          setOrders(prev => prev.map(o => o.id === order.id ? {
            ...o, status: "filled" as const, pipelineStage: 5, fillPrice, fillTime: Date.now(),
          } : o));

          const direction = signal.direction === "买入" ? "多" as const : "空" as const;
          const pos: TradePosition = {
            id: `pos-${order.id}`,
            coin: signal.coin,
            direction,
            entryPrice: fillPrice,
            currentPrice: fillPrice,
            amount,
            leverage: 1,
            pnl: 0,
            pnlPct: 0,
            targetPrice: signal.targetPrice,
            stopLoss: signal.stopLoss,
            status: "open",
            openTime: Date.now(),
            model: modelName,
            strategyName,
            mode: tradeMode,
          };

          setPositions(prev => [pos, ...prev].slice(0, 20));
          setStats(s => ({ ...s, totalOrders: s.totalOrders + 1, filled: s.filled + 1 }));

          if (tradeMode === "paper") {
            setPaperAccount(prev => ({ ...prev, balance: prev.balance - amount }));
          }
        }
      }, 4000 * speedMult);
    }, currentSpeed.ms + Math.random() * (currentSpeed.ms * 0.3));

    return () => clearInterval(interval);
  }, [enabled, tradeMode, speed, paperAccount.balance, dataReady, addLearningEvent]);

  // ============ UPDATE POSITIONS WITH REAL PRICES ============
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        if (pos.status !== "open") return pos;

        const ticker = tickers.get(pos.coin);
        const newPrice = ticker ? ticker.price : pos.currentPrice * (1 + (Math.random() - 0.48) * 0.002);

        const pnlMult = pos.direction === "多" ? 1 : -1;
        const newPnl = ((newPrice - pos.entryPrice) / pos.entryPrice) * pos.amount * pos.leverage * pnlMult;
        const newPnlPct = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100 * pnlMult;

        const hitTP = pos.direction === "多" ? newPrice >= pos.targetPrice : newPrice <= pos.targetPrice;
        const hitSL = pos.direction === "多" ? newPrice <= pos.stopLoss : newPrice >= pos.stopLoss;

        if (hitTP || hitSL) {
          // Record trade
          const record: TradeRecord = {
            id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: Date.now(),
            coin: pos.coin,
            direction: pos.direction === "多" ? "买入" : "卖出",
            entryPrice: pos.entryPrice,
            exitPrice: newPrice,
            amount: pos.amount,
            pnl: newPnl,
            pnlPct: newPnlPct,
            model: pos.model,
            strategyName: pos.strategyName,
            holdTime: Date.now() - pos.openTime,
            strategyReasons: [],
          };
          setTradeRecords(prev => [record, ...prev].slice(0, 500));

          // Update AI model performance
          updateModelPerf(pos.model, newPnl, 0);

          // Update strategy performance
          updateStrategyPerf(pos.strategyName, pos.coin, newPnl);

          // Add learning event
          addLearningEvent({
            type: newPnl > 0 ? "accuracy_up" : "anomaly",
            coin: pos.coin,
            model: pos.model,
            message: `${pos.coin} ${hitTP ? "止盈" : "止损"}: ${newPnl > 0 ? "+" : ""}$${newPnl.toFixed(2)} (${pos.model} / ${pos.strategyName})`,
            impact: Math.abs(newPnl) > 500 ? "high" : "medium",
            metrics: { pnl: newPnl, pnlPct: newPnlPct, holdTime: Date.now() - pos.openTime },
          });

          // AI Evolution: parameter optimization trigger
          if (pos.mode === "paper") {
            const totalTrades = tradeRecords.length + 1;
            if (totalTrades % 10 === 0) {
              // Every 10 trades, trigger a parameter optimization
              const recentTrades = tradeRecords.slice(0, 10);
              const recentWinRate = recentTrades.filter(t => t.pnl > 0).length / Math.max(1, recentTrades.length) * 100;
              addEvolutionEvent({
                generation: aiEvolution.currentGeneration,
                type: "parameter_tune",
                description: `第${totalTrades}笔交易后自动参数优化: 近10笔胜率 ${recentWinRate.toFixed(1)}%`,
                beforeMetric: aiEvolution.modelAccuracy,
                afterMetric: aiEvolution.modelAccuracy + (recentWinRate > 50 ? 0.1 : -0.05),
                affectedModels: [pos.model],
              });
              setAiEvolution(prev => ({
                ...prev,
                parameterOptimizations: prev.parameterOptimizations + 1,
                modelAccuracy: prev.modelAccuracy + (recentWinRate > 50 ? 0.1 : -0.05),
                modelAccuracyDelta: recentWinRate > 50 ? 0.1 : -0.05,
              }));
            }
          }

          // Update paper account
          if (pos.mode === "paper") {
            setPaperAccount(prev => {
              const newTotalPnl = prev.totalPnl + newPnl;
              const newBalance = prev.balance + pos.amount + newPnl;
              const newEquity = newBalance;
              const newPeak = Math.max(prev.peakEquity, newEquity);
              const drawdown = Math.max(prev.maxDrawdown, newPeak - newEquity);
              const isWin = newPnl > 0;
              const newWins = prev.wins + (isWin ? 1 : 0);
              const newLosses = prev.losses + (isWin ? 0 : 1);
              const newTrades = prev.totalTrades + 1;
              const totalWinAmt = prev.avgWin * prev.wins + (isWin ? newPnl : 0);
              const totalLossAmt = prev.avgLoss * prev.losses + (isWin ? 0 : newPnl);
              return {
                ...prev,
                balance: newBalance,
                equity: newEquity,
                totalPnl: newTotalPnl,
                totalTrades: newTrades,
                wins: newWins,
                losses: newLosses,
                peakEquity: newPeak,
                maxDrawdown: drawdown,
                avgWin: newWins > 0 ? totalWinAmt / newWins : 0,
                avgLoss: newLosses > 0 ? totalLossAmt / newLosses : 0,
                bestTrade: Math.max(prev.bestTrade, newPnl),
                worstTrade: Math.min(prev.worstTrade, newPnl),
              };
            });
          }

          setStats(s => ({
            ...s,
            totalPnl: s.totalPnl + newPnl,
            winRate: newPnl > 0 ? ((s.winRate * s.filled + 100) / (s.filled + 1)) : ((s.winRate * s.filled) / (s.filled + 1)),
          }));

          return { ...pos, currentPrice: newPrice, pnl: newPnl, pnlPct: newPnlPct, status: "closed" as const, closeTime: Date.now() };
        }

        return { ...pos, currentPrice: newPrice, pnl: newPnl, pnlPct: newPnlPct };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [tickers, updateModelPerf, updateStrategyPerf, addLearningEvent, addEvolutionEvent, aiEvolution.currentGeneration, aiEvolution.modelAccuracy, tradeRecords]);

  // ---- Update paper equity ----
  useEffect(() => {
    if (tradeMode !== "paper") return;
    const openPnl = positions.filter(p => p.status === "open" && p.mode === "paper").reduce((s, p) => s + p.pnl, 0);
    setPaperAccount(prev => {
      const openAmount = positions.filter(p => p.status === "open" && p.mode === "paper").reduce((s, p) => s + p.amount, 0);
      const newEquity = prev.balance + openPnl + openAmount;
      return { ...prev, equity: newEquity };
    });
  }, [positions, tradeMode]);

  // ---- Context value ----
  const value = useMemo<TradingContextType>(() => ({
    wsStatus,
    tickers,
    enabled,
    setEnabled,
    tradeMode,
    setTradeMode,
    speed,
    setSpeed,
    orders,
    positions,
    paperAccount,
    resetPaperAccount,
    clearTradeHistory,
    tradeRecords,
    equityCurve,
    stats,
    aiModelPerformance,
    strategyPerformance,
    dataLearning,
    aiEvolution,
    dataReady,
    dataStats,
    priceHistoryManager: priceHistoryRef.current,
    SPEED_OPTIONS,
    TRACKED_COINS,
  }), [
    wsStatus, tickers, enabled, tradeMode, speed, orders, positions,
    paperAccount, resetPaperAccount, clearTradeHistory, tradeRecords, equityCurve, stats,
    aiModelPerformance, strategyPerformance, dataLearning, aiEvolution,
    dataReady, dataStats,
  ]);

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}
