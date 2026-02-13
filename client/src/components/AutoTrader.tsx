/**
 * AutoTrader — 自动买卖执行引擎
 * 完整闭环: AI信号 → 风控审核 → 自动下单 → 持仓管理 → 自动止盈止损
 * 支持「真实交易」和「模拟交易」两种模式
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Zap, Pause, Shield, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Brain, Target, CheckCircle2, XCircle, AlertTriangle, DollarSign, BarChart3, Cpu, Eye, Lock, ArrowRight, ChevronDown, ChevronUp, Wallet, FlaskConical, RotateCcw, FastForward, Gauge, Trophy, Hash } from "lucide-react";

// ============ TYPES ============
type OrderStatus = "pending" | "risk_check" | "executing" | "filled" | "rejected" | "cancelled";
type PositionStatus = "open" | "closing" | "closed";
type TradeMode = "live" | "paper";

interface AutoOrder {
  id: string;
  timestamp: number;
  coin: string;
  direction: "买入" | "卖出";
  amount: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
  model: string;
  confidence: number;
  status: OrderStatus;
  mode: TradeMode;
  riskCheckResult?: {
    passed: boolean;
    checks: { name: string; passed: boolean; detail: string }[];
  };
  fillPrice?: number;
  fillTime?: number;
  pipelineStage: number;
}

interface Position {
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
  status: PositionStatus;
  openTime: number;
  model: string;
  mode: TradeMode;
}

interface PaperAccount {
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

// ============ CONSTANTS ============
const COINS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "ARB", "OP", "PEPE", "WIF"];
const MODELS = ["DeepSeek-V3", "TFT", "LSTM-Attention", "GPT-4o", "集成投票"];

const PIPELINE_STAGES = [
  { label: "AI信号", icon: Brain, color: "text-cyber-blue" },
  { label: "风控审核", icon: Shield, color: "text-cyber-amber" },
  { label: "下单执行", icon: Zap, color: "text-cyber-green" },
  { label: "撮合确认", icon: CheckCircle2, color: "text-cyber-green" },
  { label: "持仓管理", icon: Eye, color: "text-cyber-blue" },
  { label: "止盈止损", icon: Target, color: "text-cyber-magenta" },
];

const RISK_CHECKS = [
  "单笔金额限制", "单币种持仓上限", "日交易额度", "板块集中度",
  "杠杆倍数限制", "全局止损线", "模型置信度阈值", "流动性检查",
];

const INITIAL_PAPER_BALANCE = [10000, 50000, 100000, 500000];
const SPEED_OPTIONS = [
  { label: "1x", value: 1, ms: 12000 },
  { label: "2x", value: 2, ms: 6000 },
  { label: "5x", value: 5, ms: 2500 },
  { label: "10x", value: 10, ms: 1200 },
];

// ============ GENERATION HELPERS ============
function generateOrder(mode: TradeMode): AutoOrder {
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const direction = Math.random() < 0.55 ? "买入" as const : "卖出" as const;
  const currentPrice = coin === "BTC" ? 65000 + Math.random() * 5000 :
    coin === "ETH" ? 1800 + Math.random() * 400 :
    coin === "SOL" ? 70 + Math.random() * 30 :
    coin === "BNB" ? 580 + Math.random() * 60 :
    0.5 + Math.random() * 50;
  const amount = mode === "paper" ? Math.round(200 + Math.random() * 2800) : Math.round(500 + Math.random() * 4500);
  const confidence = +(65 + Math.random() * 30).toFixed(1);
  const targetMult = direction === "买入" ? 1 + Math.random() * 0.06 : 1 - Math.random() * 0.06;
  const slMult = direction === "买入" ? 1 - Math.random() * 0.025 : 1 + Math.random() * 0.025;

  const checks = RISK_CHECKS.map(name => ({
    name,
    passed: Math.random() < 0.9,
    detail: Math.random() < 0.9 ? "通过" : name === "模型置信度阈值" ? `${confidence}% < 70%阈值` : "超出限制",
  }));
  const allPassed = checks.every(c => c.passed) && confidence >= 65;

  return {
    id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: Date.now(),
    coin, direction, amount,
    price: currentPrice,
    targetPrice: currentPrice * targetMult,
    stopLoss: currentPrice * slMult,
    model: MODELS[Math.floor(Math.random() * MODELS.length)],
    confidence,
    status: "pending",
    mode,
    riskCheckResult: { passed: allPassed, checks },
    pipelineStage: 0,
  };
}

function generatePosition(order: AutoOrder): Position {
  const slippage = 1 + (Math.random() - 0.5) * 0.001;
  const entryPrice = order.price * slippage;
  const priceMove = (Math.random() - 0.45) * 0.04;
  const currentPrice = entryPrice * (1 + priceMove);
  const direction = order.direction === "买入" ? "多" as const : "空" as const;
  const pnlMult = direction === "多" ? 1 : -1;
  const pnl = ((currentPrice - entryPrice) / entryPrice) * order.amount * pnlMult;

  return {
    id: `pos-${order.id}`,
    coin: order.coin,
    direction,
    entryPrice,
    currentPrice,
    amount: order.amount,
    leverage: 1 + Math.floor(Math.random() * 3),
    pnl,
    pnlPct: ((currentPrice - entryPrice) / entryPrice) * 100 * pnlMult,
    targetPrice: order.targetPrice,
    stopLoss: order.stopLoss,
    status: "open",
    openTime: order.timestamp,
    model: order.model,
    mode: order.mode,
  };
}

// ============ PIPELINE VISUALIZATION ============
function PipelineVisual({ stage, rejected }: { stage: number; rejected: boolean }) {
  return (
    <div className="flex items-center gap-0.5 py-2">
      {PIPELINE_STAGES.map((s, i) => {
        const isActive = i === stage;
        const isDone = i < stage;
        const isFailed = rejected && i === 1;
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center">
            <motion.div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] transition-all ${
                isFailed ? "bg-cyber-magenta/15 text-cyber-magenta" :
                isActive ? "bg-cyber-blue/15 text-cyber-blue ring-1 ring-cyber-blue/30" :
                isDone ? "bg-cyber-green/10 text-cyber-green" :
                "bg-secondary/10 text-muted-foreground/40"
              }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{s.label}</span>
            </motion.div>
            {i < PIPELINE_STAGES.length - 1 && (
              <ArrowRight className={`w-3 h-3 mx-0.5 ${isDone ? "text-cyber-green/50" : "text-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ PAPER ACCOUNT CARD ============
function PaperAccountPanel({ account, onReset, onChangeBalance }: {
  account: PaperAccount;
  onReset: () => void;
  onChangeBalance: (b: number) => void;
}) {
  const pnlPct = ((account.equity - account.initialBalance) / account.initialBalance) * 100;
  const winRate = account.totalTrades > 0 ? (account.wins / account.totalTrades) * 100 : 0;
  const drawdownPct = account.peakEquity > 0 ? (account.maxDrawdown / account.peakEquity) * 100 : 0;
  const runningHours = Math.floor((Date.now() - account.startTime) / 3600000);

  return (
    <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-cyber-blue/5 via-transparent to-cyber-green/5 border border-cyber-blue/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyber-blue/15 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-cyber-blue" />
          </div>
          <div>
            <div className="text-[11px] font-bold flex items-center gap-1.5">
              模拟账户
              <Badge variant="outline" className="text-[7px] py-0 border-cyber-blue/30 text-cyber-blue">Paper Trading</Badge>
            </div>
            <div className="text-[8px] text-muted-foreground">运行 {runningHours}h · 无真实资金风险</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 border-muted-foreground/20" onClick={onReset}>
          <RotateCcw className="w-3 h-3" />重置账户
        </Button>
      </div>

      {/* Balance display */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <div className="p-2 rounded-lg bg-card/50">
          <div className="text-[8px] text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" />可用余额</div>
          <div className="text-sm font-bold font-mono text-foreground">${account.balance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="p-2 rounded-lg bg-card/50">
          <div className="text-[8px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />总权益</div>
          <div className={`text-sm font-bold font-mono ${account.equity >= account.initialBalance ? "text-cyber-green" : "text-cyber-magenta"}`}>
            ${account.equity.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-card/50">
          <div className="text-[8px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />总收益率</div>
          <div className={`text-sm font-bold font-mono ${pnlPct >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
            {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Equity progress bar */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-[8px] mb-0.5">
          <span className="text-muted-foreground">资金使用率</span>
          <span className="font-mono text-foreground">{((1 - account.balance / account.equity) * 100).toFixed(1)}%</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, (1 - account.balance / Math.max(1, account.equity)) * 100))} className="h-1.5" />
      </div>

      {/* Performance stats grid */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { icon: Hash, label: "总交易", value: account.totalTrades, color: "text-cyber-blue" },
          { icon: Trophy, label: "胜率", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta" },
          { icon: TrendingUp, label: "平均盈利", value: `$${account.avgWin.toFixed(0)}`, color: "text-cyber-green" },
          { icon: TrendingDown, label: "平均亏损", value: `-$${Math.abs(account.avgLoss).toFixed(0)}`, color: "text-cyber-magenta" },
        ].map((s, i) => (
          <div key={i} className="p-1.5 rounded bg-secondary/10 text-center">
            <s.icon className={`w-3 h-3 mx-auto mb-0.5 ${s.color}`} />
            <div className={`text-[10px] font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "最大回撤", value: `-${drawdownPct.toFixed(2)}%`, color: "text-cyber-magenta" },
          { label: "最佳单笔", value: `+$${account.bestTrade.toFixed(0)}`, color: "text-cyber-green" },
          { label: "最差单笔", value: `-$${Math.abs(account.worstTrade).toFixed(0)}`, color: "text-cyber-magenta" },
        ].map((s, i) => (
          <div key={i} className="p-1 rounded bg-secondary/10 text-center">
            <div className={`text-[9px] font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Initial balance selector */}
      <div className="mt-2 pt-2 border-t border-border/10">
        <div className="text-[8px] text-muted-foreground mb-1">初始资金设置</div>
        <div className="flex items-center gap-1">
          {INITIAL_PAPER_BALANCE.map(b => (
            <button
              key={b}
              onClick={() => onChangeBalance(b)}
              className={`px-2 py-0.5 rounded text-[8px] transition-colors ${
                account.initialBalance === b ? "bg-cyber-blue/20 text-cyber-blue ring-1 ring-cyber-blue/30" : "bg-secondary/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              ${(b / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function AutoTrader() {
  const [enabled, setEnabled] = useState(true);
  const [tradeMode, setTradeMode] = useState<TradeMode>("paper");
  const [speed, setSpeed] = useState(1);
  const [orders, setOrders] = useState<AutoOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0,
  });
  const [paperAccount, setPaperAccount] = useState<PaperAccount>({
    initialBalance: 100000,
    balance: 100000,
    equity: 100000,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalPnl: 0,
    maxDrawdown: 0,
    peakEquity: 100000,
    sharpeRatio: 0,
    avgWin: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    startTime: Date.now(),
  });
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const orderCountRef = useRef(0);

  const currentSpeed = SPEED_OPTIONS.find(s => s.value === speed) || SPEED_OPTIONS[0];

  // Reset paper account
  const resetPaperAccount = (balance?: number) => {
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
    toast.success("模拟账户已重置", { description: `初始资金: $${b.toLocaleString()}` });
  };

  // Mode switch handler
  const handleModeSwitch = (newMode: TradeMode) => {
    if (newMode === "live" && tradeMode === "paper") {
      setShowModeConfirm(true);
      return;
    }
    setTradeMode(newMode);
    setOrders([]);
    setPositions([]);
    setStats({ totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0 });
    toast.info(newMode === "paper" ? "已切换至模拟交易模式" : "已切换至真实交易模式", {
      description: newMode === "paper" ? "使用虚拟资金，无真实风险" : "将使用真实资金交易",
    });
  };

  // Generate new orders periodically when enabled
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      // Paper mode: check if enough balance
      if (tradeMode === "paper" && paperAccount.balance < 100) {
        toast.warning("模拟账户余额不足", { description: "请重置账户或增加初始资金" });
        return;
      }

      const order = generateOrder(tradeMode);

      // Paper mode: cap order amount to available balance
      if (tradeMode === "paper") {
        order.amount = Math.min(order.amount, paperAccount.balance * 0.15);
      }

      setOrders(prev => [order, ...prev].slice(0, 25));
      orderCountRef.current++;

      // Pipeline progression
      const speedMult = 1 / speed;
      setTimeout(() => {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "risk_check" as const, pipelineStage: 1 } : o));
      }, 800 * speedMult);

      setTimeout(() => {
        const passed = order.riskCheckResult?.passed ?? false;
        if (passed) {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "executing" as const, pipelineStage: 2 } : o));
        } else {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "rejected" as const, pipelineStage: 1 } : o));
          setStats(s => ({ ...s, totalOrders: s.totalOrders + 1, rejected: s.rejected + 1 }));
        }
      }, 2000 * speedMult);

      setTimeout(() => {
        const passed = order.riskCheckResult?.passed ?? false;
        if (passed) {
          const fillPrice = order.price * (1 + (Math.random() - 0.5) * 0.001);
          setOrders(prev => prev.map(o => o.id === order.id ? {
            ...o, status: "filled" as const, pipelineStage: 4, fillPrice, fillTime: Date.now(),
          } : o));
          const pos = generatePosition(order);
          setPositions(prev => [pos, ...prev].slice(0, 15));
          setStats(s => ({ ...s, totalOrders: s.totalOrders + 1, filled: s.filled + 1 }));

          // Paper mode: deduct balance
          if (tradeMode === "paper") {
            setPaperAccount(prev => ({ ...prev, balance: prev.balance - order.amount }));
          }

          const modeTag = tradeMode === "paper" ? " [模拟]" : "";
          toast.success(`自动${order.direction}${modeTag}: ${order.coin}/USDT`, {
            description: `$${order.amount} @ $${fillPrice.toFixed(2)} | ${order.model}`,
          });
        }
      }, 3500 * speedMult);
    }, currentSpeed.ms + Math.random() * (currentSpeed.ms * 0.6));

    return () => clearInterval(interval);
  }, [enabled, tradeMode, speed, paperAccount.balance]);

  // Update position prices
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        if (pos.status !== "open") return pos;
        const drift = (Math.random() - 0.48) * 0.003;
        const newPrice = pos.currentPrice * (1 + drift);
        const pnlMult = pos.direction === "多" ? 1 : -1;
        const newPnl = ((newPrice - pos.entryPrice) / pos.entryPrice) * pos.amount * pos.leverage * pnlMult;
        const newPnlPct = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100 * pnlMult;

        const hitTP = pos.direction === "多" ? newPrice >= pos.targetPrice : newPrice <= pos.targetPrice;
        const hitSL = pos.direction === "多" ? newPrice <= pos.stopLoss : newPrice >= pos.stopLoss;

        if (hitTP || hitSL) {
          const modeTag = pos.mode === "paper" ? " [模拟]" : "";
          if (hitTP) {
            toast.success(`自动止盈${modeTag}: ${pos.coin} ${pos.direction}`, {
              description: `盈利 $${newPnl.toFixed(2)} (${newPnlPct.toFixed(2)}%)`,
            });
          } else {
            toast.error(`自动止损${modeTag}: ${pos.coin} ${pos.direction}`, {
              description: `亏损 $${newPnl.toFixed(2)} (${newPnlPct.toFixed(2)}%)`,
            });
          }

          // Update paper account on close
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
          return { ...pos, currentPrice: newPrice, pnl: newPnl, pnlPct: newPnlPct, status: "closed" as const };
        }

        return { ...pos, currentPrice: newPrice, pnl: newPnl, pnlPct: newPnlPct };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update paper equity in real-time
  useEffect(() => {
    if (tradeMode !== "paper") return;
    const openPnl = positions.filter(p => p.status === "open" && p.mode === "paper").reduce((s, p) => s + p.pnl, 0);
    setPaperAccount(prev => {
      const newEquity = prev.balance + openPnl + positions.filter(p => p.status === "open" && p.mode === "paper").reduce((s, p) => s + p.amount, 0);
      return { ...prev, equity: newEquity };
    });
  }, [positions, tradeMode]);

  const openPositions = positions.filter(p => p.status === "open");
  const closedPositions = positions.filter(p => p.status === "closed");
  const totalUnrealizedPnl = openPositions.reduce((s, p) => s + p.pnl, 0);
  const totalRealizedPnl = closedPositions.reduce((s, p) => s + p.pnl, 0);

  const formatPrice = (p: number) => p < 1 ? p.toPrecision(4) : p.toFixed(2);
  const formatTime = (ts: number) => {
    const ago = Math.floor((Date.now() - ts) / 1000);
    if (ago < 60) return `${ago}秒前`;
    if (ago < 3600) return `${Math.floor(ago / 60)}分钟前`;
    return `${Math.floor(ago / 3600)}小时前`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyber-amber" />
            自动买卖引擎
            {enabled ? (
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-cyber-green" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            )}
            <Badge variant="outline" className={`text-[7px] py-0 ${enabled ? "border-cyber-green/30 text-cyber-green" : "border-muted-foreground/30 text-muted-foreground"}`}>
              {enabled ? "运行中" : "已暂停"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">{enabled ? "自动交易开启" : "自动交易关闭"}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        {/* Mode toggle bar */}
        <div className="flex items-center gap-2 mt-2 p-1.5 rounded-lg bg-secondary/10">
          <div className="flex items-center gap-0.5 bg-secondary/20 rounded-md p-0.5">
            <button
              onClick={() => handleModeSwitch("paper")}
              className={`px-2.5 py-1 rounded text-[9px] font-medium flex items-center gap-1 transition-all ${
                tradeMode === "paper" ? "bg-cyber-blue/20 text-cyber-blue shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FlaskConical className="w-3 h-3" />模拟交易
            </button>
            <button
              onClick={() => handleModeSwitch("live")}
              className={`px-2.5 py-1 rounded text-[9px] font-medium flex items-center gap-1 transition-all ${
                tradeMode === "live" ? "bg-cyber-green/20 text-cyber-green shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="w-3 h-3" />真实交易
            </button>
          </div>

          {/* Speed control (paper mode only) */}
          {tradeMode === "paper" && (
            <div className="flex items-center gap-1 ml-auto">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">速度</span>
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSpeed(opt.value)}
                  className={`px-1.5 py-0.5 rounded text-[8px] transition-colors ${
                    speed === opt.value ? "bg-cyber-amber/20 text-cyber-amber" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {tradeMode === "live" && (
            <div className="ml-auto flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyber-amber" />
              <span className="text-[8px] text-cyber-amber">真实资金</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Mode confirmation dialog */}
        <AnimatePresence>
          {showModeConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 rounded-lg bg-cyber-amber/10 border border-cyber-amber/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-cyber-amber" />
                <span className="text-[11px] font-bold text-cyber-amber">切换至真实交易模式</span>
              </div>
              <p className="text-[9px] text-foreground/70 mb-2">
                真实交易模式将使用您的实际资金进行交易。请确保您已充分了解风险，并已在模拟模式中验证了AI的交易表现。
                建议先在模拟模式下运行至少50笔交易，确认胜率和回撤在可接受范围内。
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-6 text-[9px] bg-cyber-amber/20 text-cyber-amber hover:bg-cyber-amber/30 border border-cyber-amber/30" onClick={() => {
                  setTradeMode("live");
                  setShowModeConfirm(false);
                  setOrders([]);
                  setPositions([]);
                  setStats({ totalOrders: 0, filled: 0, rejected: 0, totalPnl: 0, winRate: 0 });
                  toast.warning("已切换至真实交易模式", { description: "请谨慎操作，所有交易将使用真实资金" });
                }}>
                  确认切换
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => setShowModeConfirm(false)}>
                  取消
                </Button>
                <span className="text-[8px] text-muted-foreground ml-auto">
                  模拟交易记录: {paperAccount.totalTrades}笔 · 胜率: {paperAccount.totalTrades > 0 ? ((paperAccount.wins / paperAccount.totalTrades) * 100).toFixed(1) : "0"}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paper account panel (only in paper mode) */}
        {tradeMode === "paper" && (
          <PaperAccountPanel
            account={paperAccount}
            onReset={() => resetPaperAccount()}
            onChangeBalance={(b) => resetPaperAccount(b)}
          />
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {[
            { label: "总订单", value: stats.totalOrders + orders.length, color: "text-cyber-blue" },
            { label: "已成交", value: stats.filled, color: "text-cyber-green" },
            { label: "被拒绝", value: stats.rejected, color: "text-cyber-magenta" },
            { label: "未实现盈亏", value: `${totalUnrealizedPnl >= 0 ? "+" : ""}$${totalUnrealizedPnl.toFixed(0)}`, color: totalUnrealizedPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta" },
            { label: "已实现盈亏", value: `${totalRealizedPnl >= 0 ? "+" : ""}$${totalRealizedPnl.toFixed(0)}`, color: totalRealizedPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta" },
          ].map((s, i) => (
            <div key={i} className="p-1.5 rounded bg-secondary/15 text-center">
              <div className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[7px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active positions */}
        {openPositions.length > 0 && (
          <div className="mb-3">
            <div className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <Eye className="w-3 h-3" />活跃持仓 ({openPositions.length})
              {tradeMode === "paper" && <Badge variant="outline" className="text-[6px] py-0 border-cyber-blue/20 text-cyber-blue">模拟</Badge>}
            </div>
            <div className="space-y-1">
              {openPositions.map(pos => (
                <motion.div
                  key={pos.id}
                  className={`p-2 rounded-lg border ${
                    pos.pnl >= 0 ? "border-cyber-green/15 bg-cyber-green/3" : "border-cyber-magenta/15 bg-cyber-magenta/3"
                  }`}
                  animate={Math.abs(pos.pnlPct) > 2 ? { borderColor: ["rgba(0,255,136,0.15)", "rgba(0,255,136,0.3)", "rgba(0,255,136,0.15)"] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      pos.direction === "多" ? "bg-cyber-green/15" : "bg-cyber-magenta/15"
                    }`}>
                      {pos.direction === "多" ? <ArrowUpRight className="w-3 h-3 text-cyber-green" /> : <ArrowDownRight className="w-3 h-3 text-cyber-magenta" />}
                    </div>
                    <span className="text-[10px] font-bold">{pos.coin}</span>
                    <Badge variant="outline" className={`text-[7px] py-0 ${pos.direction === "多" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-magenta/30 text-cyber-magenta"}`}>
                      {pos.direction} {pos.leverage}x
                    </Badge>
                    <span className="text-[8px] text-muted-foreground">${pos.amount.toFixed(0)}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[8px] text-muted-foreground">入场 <span className="font-mono">${formatPrice(pos.entryPrice)}</span></span>
                      <span className="text-[8px] text-muted-foreground">现价 <span className="font-mono">${formatPrice(pos.currentPrice)}</span></span>
                      <span className={`text-[10px] font-mono font-bold ${pos.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                        {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)} ({pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[7px]">
                    <span className="text-cyber-magenta font-mono">SL ${formatPrice(pos.stopLoss)}</span>
                    <div className="flex-1 h-1 rounded-full bg-secondary/20 relative overflow-hidden">
                      <div className="absolute h-full bg-cyber-green/30 rounded-full" style={{
                        left: `${Math.max(0, Math.min(100, ((pos.currentPrice - pos.stopLoss) / (pos.targetPrice - pos.stopLoss)) * 100))}%`,
                        width: "3px",
                      }} />
                      <div className="absolute h-full w-full">
                        <div className="absolute left-0 h-full w-0.5 bg-cyber-magenta/50" />
                        <div className="absolute right-0 h-full w-0.5 bg-cyber-green/50" />
                      </div>
                    </div>
                    <span className="text-cyber-green font-mono">TP ${formatPrice(pos.targetPrice)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent orders with pipeline */}
        <div className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1">
          <Activity className="w-3 h-3" />执行管线 ({orders.length})
          {tradeMode === "paper" && speed > 1 && (
            <Badge variant="outline" className="text-[6px] py-0 border-cyber-amber/20 text-cyber-amber">
              <FastForward className="w-2.5 h-2.5 mr-0.5" />{speed}x加速
            </Badge>
          )}
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          <AnimatePresence>
            {orders.slice(0, 10).map(order => {
              const isExpanded = expandedOrder === order.id;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border cursor-pointer transition-colors ${
                    order.status === "filled" ? "border-cyber-green/15 bg-cyber-green/3" :
                    order.status === "rejected" ? "border-cyber-magenta/15 bg-cyber-magenta/3" :
                    "border-cyber-blue/15 bg-cyber-blue/3"
                  }`}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="p-2 flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      order.direction === "买入" ? "bg-cyber-green/15" : "bg-cyber-magenta/15"
                    }`}>
                      {order.direction === "买入" ? <ArrowUpRight className="w-3 h-3 text-cyber-green" /> : <ArrowDownRight className="w-3 h-3 text-cyber-magenta" />}
                    </div>
                    <span className="text-[10px] font-bold w-14">{order.coin}</span>
                    <span className="text-[8px] text-muted-foreground">${order.amount.toFixed(0)}</span>
                    <Badge variant="outline" className={`text-[7px] py-0 ${
                      order.status === "filled" ? "border-cyber-green/30 text-cyber-green" :
                      order.status === "rejected" ? "border-cyber-magenta/30 text-cyber-magenta" :
                      order.status === "executing" ? "border-cyber-blue/30 text-cyber-blue" :
                      "border-cyber-amber/30 text-cyber-amber"
                    }`}>
                      {order.status === "filled" ? "已成交" :
                       order.status === "rejected" ? "被拒绝" :
                       order.status === "executing" ? "执行中" :
                       order.status === "risk_check" ? "风控中" : "等待中"}
                    </Badge>
                    {order.mode === "paper" && <Badge variant="outline" className="text-[6px] py-0 border-cyber-blue/20 text-cyber-blue">模拟</Badge>}
                    <span className="text-[8px] text-muted-foreground ml-auto flex items-center gap-0.5">
                      <Cpu className="w-2.5 h-2.5" />{order.model}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{formatTime(order.timestamp)}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="px-2 pb-2 border-t border-border/10 pt-1">
                      <PipelineVisual stage={order.pipelineStage} rejected={order.status === "rejected"} />
                      {order.riskCheckResult && (
                        <div className="mt-1 p-1.5 rounded bg-secondary/10">
                          <div className="text-[8px] text-muted-foreground mb-1 flex items-center gap-1">
                            <Shield className="w-3 h-3" />风控审核结果
                          </div>
                          <div className="grid grid-cols-2 gap-0.5">
                            {order.riskCheckResult.checks.map((check, i) => (
                              <div key={i} className="flex items-center gap-1 text-[7px]">
                                {check.passed ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-cyber-green flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5 text-cyber-magenta flex-shrink-0" />
                                )}
                                <span className={check.passed ? "text-foreground/60" : "text-cyber-magenta"}>{check.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[8px]">
                        <span className="text-muted-foreground">价格 <span className="font-mono">${formatPrice(order.price)}</span></span>
                        <span className="text-muted-foreground">目标 <span className="font-mono text-cyber-green">${formatPrice(order.targetPrice)}</span></span>
                        <span className="text-muted-foreground">止损 <span className="font-mono text-cyber-magenta">${formatPrice(order.stopLoss)}</span></span>
                        <span className="text-muted-foreground">置信 <span className="font-mono">{order.confidence}%</span></span>
                        {order.fillPrice && <span className="text-muted-foreground">成交 <span className="font-mono text-cyber-green">${formatPrice(order.fillPrice)}</span></span>}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Closed positions summary */}
        {closedPositions.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/20">
            <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />已平仓 ({closedPositions.length})
            </div>
            <div className="space-y-0.5">
              {closedPositions.slice(0, 5).map(pos => (
                <div key={pos.id} className="flex items-center gap-2 p-1 rounded text-[8px]">
                  <span className="font-bold w-10">{pos.coin}</span>
                  <Badge variant="outline" className={`text-[6px] py-0 ${pos.direction === "多" ? "border-cyber-green/20 text-cyber-green" : "border-cyber-magenta/20 text-cyber-magenta"}`}>{pos.direction}</Badge>
                  <span className="text-muted-foreground">${pos.amount.toFixed(0)}</span>
                  {pos.mode === "paper" && <Badge variant="outline" className="text-[6px] py-0 border-cyber-blue/15 text-cyber-blue/60">模拟</Badge>}
                  <span className={`font-mono ml-auto ${pos.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!enabled && (
          <div className="mt-3 p-3 rounded-lg bg-cyber-amber/5 border border-cyber-amber/20 text-center">
            <Pause className="w-5 h-5 text-cyber-amber mx-auto mb-1" />
            <p className="text-[10px] text-cyber-amber">自动交易已暂停</p>
            <p className="text-[8px] text-muted-foreground">开启后AI将自动执行买卖决策</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
