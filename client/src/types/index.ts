/* ─── CryptoQuant Pro 业务类型定义 ─── */

/** 投资组合持仓 */
export interface PortfolioPosition {
  symbol: string;
  allocation: number;
  amount: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  [key: string]: unknown;
}

/** 投资组合 */
export interface Portfolio {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  todayPnl: number;
  todayPnlPercent: number;
  positions: PortfolioPosition[];
  [key: string]: unknown;
}

/** 交易记录 */
export interface Trade {
  id: string | number;
  pair: string;
  side: string;
  price: number;
  amount: number;
  total: number;
  strategy: string;
  exchange: string;
  time: string;
  timestamp?: string;
  coinSymbol?: string;
  coin?: string;
  type?: string;
  status?: string;
  executedAt?: string;
  strategyName?: string;
  [key: string]: unknown;
}

/** 交易策略 (mockData格式) */
export interface Strategy {
  id: number;
  name: string;
  type: string;
  status: string;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  trades: number;
  sharpe: number;
  coins: string[];
  ai: string;
  risk: string;
  maxDrawdown?: number;
  allocation?: number;
  description?: string;
  sparkline?: number[];
  [key: string]: unknown;
}

/** 交易所 */
export interface Exchange {
  name: string;
  status: string;
  latency: number;
  pairs: number;
  volume24h: number;
  coins: number;
  [key: string]: unknown;
}

/** Alpha因子 */
export interface AlphaFactor {
  name: string;
  category: string;
  ic: number;
  sharpe: number;
  decay: string;
  status: string;
  ai: string;
  coins: string;
  [key: string]: unknown;
}

/** AI模型 */
export interface AIModel {
  name: string;
  type: string;
  status: string;
  accuracy: number;
  latency: number;
  tasks: string;
  generation: number;
  learningRate: number;
  [key: string]: unknown;
}

/** 风险指标 */
export interface RiskMetrics {
  var95: number;
  var99: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  beta: number;
  alpha: number;
  leverage: number;
  maxLeverage: number;
  positionConcentration: number;
  correlationRisk: string;
  totalRiskScore: number;
  [key: string]: unknown;
}

/** 饼图数据项 */
export interface AllocationDataItem {
  name: string;
  value: number;
}
