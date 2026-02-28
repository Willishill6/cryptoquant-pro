/**
 * AIDecisionExplainer - AI决策解释器 + 模拟交易
 * Shows SHAP-like feature importance, reasoning chain, confidence breakdown,
 * and allows one-click simulated trading based on AI analysis results
 * Design: Cyberpunk terminal aesthetic
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronRight, Zap, Target, AlertTriangle, CheckCircle2, ShoppingCart, DollarSign, ArrowRightLeft, BarChart3, X, Play, Loader2, Check, ArrowUpRight, ArrowDownRight, History, Filter, ArrowUpDown, Calendar, Coins, SlidersHorizontal, RotateCcw, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { allCoins as allCoinsData, coinCategories } from "@/lib/mockData";

/* ── helpers ── */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ── types ── */
interface Decision {
  id: number;
  coin: string;
  action: "买入" | "卖出" | "持有" | "加仓" | "减仓";
  confidence: number;
  timestamp: string;
  model: string;
  price: number;
  features: { name: string; value: number; impact: "positive" | "negative"; weight: number }[];
  reasoning: string[];
  outcome?: { pnl: number; accuracy: boolean };
}

interface SimTrade {
  id: string;
  decisionId: number;
  coin: string;
  action: string;
  entryPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  status: "pending" | "executing" | "filled" | "completed";
  timestamp: Date;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

/* ── 暂无真实AI决策数据 ── */
const decisions: Decision[] = [];

/* ── Simulated Trade Order Panel ── */
function SimTradePanel({
  decision,
  onClose,
  onExecute,
}: {
  decision: Decision;
  onClose: () => void;
  onExecute: (trade: SimTrade) => void;
}) {
  const isBuy = decision.action === "买入" || decision.action === "加仓";
  const [quantity, setQuantity] = useState(isBuy ? 1000 : 500);
  const [leverage, setLeverage] = useState(3);
  const [stopLossPercent, setStopLossPercent] = useState(isBuy ? 5 : 5);
  const [takeProfitPercent, setTakeProfitPercent] = useState(isBuy ? 10 : 10);
  const [_executing, _setExecuting] = useState(false);
  const [stage, setStage] = useState<"config" | "confirm" | "executing" | "done">("config");
  const [progress, setProgress] = useState(0);

  const totalValue = quantity * leverage;
  const stopLoss = isBuy
    ? decision.price * (1 - stopLossPercent / 100)
    : decision.price * (1 + stopLossPercent / 100);
  const takeProfit = isBuy
    ? decision.price * (1 + takeProfitPercent / 100)
    : decision.price * (1 - takeProfitPercent / 100);
  const maxLoss = quantity * (stopLossPercent / 100) * leverage;
  const maxProfit = quantity * (takeProfitPercent / 100) * leverage;
  const riskReward = takeProfitPercent / stopLossPercent;

  const handleExecute = useCallback(() => {
    setStage("executing");
    setProgress(0);

    // Simulate execution stages
    const stages = [
      { p: 15, delay: 300 },
      { p: 35, delay: 600 },
      { p: 55, delay: 400 },
      { p: 75, delay: 500 },
      { p: 90, delay: 300 },
      { p: 100, delay: 200 },
    ];

    let cumDelay = 0;
    stages.forEach(({ p, delay }) => {
      cumDelay += delay;
      setTimeout(() => setProgress(p), cumDelay);
    });

    setTimeout(() => {
      setStage("done");
      const simPnl = (seededRandom(decision.id * 17 + Date.now() % 1000) - 0.35) * quantity * 0.08;
      const trade: SimTrade = {
        id: `SIM-${Date.now().toString(36).toUpperCase()}`,
        decisionId: decision.id,
        coin: decision.coin,
        action: decision.action,
        entryPrice: decision.price,
        quantity,
        leverage,
        stopLoss,
        takeProfit,
        status: "filled",
        timestamp: new Date(),
        currentPrice: decision.price * (1 + (seededRandom(decision.id * 31) - 0.4) * 0.03),
        pnl: Math.round(simPnl * 100) / 100,
        pnlPercent: Math.round((simPnl / quantity) * 10000) / 100,
      };
      onExecute(trade);
    }, cumDelay + 400);
  }, [decision, quantity, leverage, stopLoss, takeProfit, onExecute]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-3 rounded-lg border border-cyber-blue/40 bg-gradient-to-br from-cyber-blue/5 to-transparent overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyber-blue/20 bg-cyber-blue/5">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-cyber-blue" />
          <span className="text-xs font-heading tracking-wider text-cyber-blue">模拟交易下单</span>
          <Badge variant="outline" className="text-[9px] py-0 border-cyber-amber/30 text-cyber-amber">模拟模式</Badge>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* ── Stage: Config ── */}
          {stage === "config" && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Trade Info Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border/50">
                  <p className="text-[9px] text-muted-foreground mb-0.5">交易币种</p>
                  <p className="text-sm font-mono font-bold">{decision.coin}/USDT</p>
                </div>
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border/50">
                  <p className="text-[9px] text-muted-foreground mb-0.5">AI建议方向</p>
                  <p className={`text-sm font-bold ${isBuy ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {decision.action} {isBuy ? "↑" : "↓"}
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border/50">
                  <p className="text-[9px] text-muted-foreground mb-0.5">当前价格</p>
                  <p className="text-sm font-mono font-bold">${decision.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Parameter Sliders */}
              <div className="space-y-3">
                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> 投入金额 (USDT)
                    </label>
                    <span className="text-xs font-mono text-cyber-blue">${quantity.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={50000}
                    step={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-cyber-blue"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>$100</span>
                    <div className="flex gap-2">
                      {[500, 1000, 5000, 10000].map((v) => (
                        <button key={v} onClick={() => setQuantity(v)} className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${quantity === v ? "bg-cyber-blue/20 text-cyber-blue" : "hover:bg-secondary"}`}>
                          ${v >= 1000 ? `${v / 1000}K` : v}
                        </button>
                      ))}
                    </div>
                    <span>$50K</span>
                  </div>
                </div>

                {/* Leverage */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3" /> 杠杆倍数
                    </label>
                    <span className="text-xs font-mono text-cyber-amber">{leverage}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-cyber-amber"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>1x</span>
                    <div className="flex gap-2">
                      {[1, 3, 5, 10, 20].map((v) => (
                        <button key={v} onClick={() => setLeverage(v)} className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${leverage === v ? "bg-cyber-amber/20 text-cyber-amber" : "hover:bg-secondary"}`}>
                          {v}x
                        </button>
                      ))}
                    </div>
                    <span>20x</span>
                  </div>
                </div>

                {/* Stop Loss */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 止损比例
                    </label>
                    <span className="text-xs font-mono text-cyber-magenta">{stopLossPercent}% → ${stopLoss.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={stopLossPercent}
                    onChange={(e) => setStopLossPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-[#ff0080]"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" /> 止盈比例
                    </label>
                    <span className="text-xs font-mono text-cyber-green">{takeProfitPercent}% → ${takeProfit.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={takeProfitPercent}
                    onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-[#00ff88]"
                  />
                </div>
              </div>

              {/* Risk Summary */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-md bg-secondary/20 border border-border/50">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">总仓位价值</p>
                  <p className="text-xs font-mono font-bold text-cyber-blue">${totalValue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">最大亏损</p>
                  <p className="text-xs font-mono font-bold text-cyber-magenta">-${maxLoss.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">最大盈利</p>
                  <p className="text-xs font-mono font-bold text-cyber-green">+${maxProfit.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">风险收益比</p>
                  <p className={`text-xs font-mono font-bold ${riskReward >= 2 ? "text-cyber-green" : riskReward >= 1 ? "text-cyber-amber" : "text-cyber-magenta"}`}>
                    1:{riskReward.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* AI Confidence Meter */}
              <div className="p-3 rounded-md bg-secondary/20 border border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI置信度评估
                  </span>
                  <span className={`text-xs font-mono font-bold ${decision.confidence > 85 ? "text-cyber-green" : decision.confidence > 70 ? "text-cyber-amber" : "text-cyber-magenta"}`}>
                    {decision.confidence}%
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${decision.confidence}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: decision.confidence > 85
                        ? "linear-gradient(90deg, #00ff88, #00cc6a)"
                        : decision.confidence > 70
                        ? "linear-gradient(90deg, #ffaa00, #ff8800)"
                        : "linear-gradient(90deg, #ff0080, #cc0066)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>低置信度</span>
                  <span>中等</span>
                  <span>高置信度</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setStage("confirm")}
                  className={`flex-1 text-xs font-heading tracking-wider ${
                    isBuy
                      ? "bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green border border-cyber-green/30"
                      : "bg-cyber-magenta/20 hover:bg-cyber-magenta/30 text-cyber-magenta border border-cyber-magenta/30"
                  }`}
                  variant="outline"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  模拟{decision.action} {decision.coin}
                </Button>
                <Button variant="outline" onClick={onClose} className="text-xs border-border text-muted-foreground">
                  取消
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Stage: Confirm ── */}
          {stage === "confirm" && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center py-2">
                <AlertTriangle className="w-8 h-8 text-cyber-amber mx-auto mb-2" />
                <p className="text-sm font-heading tracking-wider">确认模拟交易</p>
                <p className="text-[10px] text-muted-foreground mt-1">请确认以下交易参数，此为模拟交易不涉及真实资金</p>
              </div>

              <div className="space-y-2 p-3 rounded-md bg-secondary/20 border border-border/50">
                {[
                  { label: "交易对", value: `${decision.coin}/USDT` },
                  { label: "方向", value: decision.action, color: isBuy ? "text-cyber-green" : "text-cyber-magenta" },
                  { label: "入场价格", value: `$${decision.price.toLocaleString()}` },
                  { label: "投入金额", value: `$${quantity.toLocaleString()} USDT` },
                  { label: "杠杆倍数", value: `${leverage}x`, color: "text-cyber-amber" },
                  { label: "总仓位价值", value: `$${totalValue.toLocaleString()}`, color: "text-cyber-blue" },
                  { label: "止损价格", value: `$${stopLoss.toFixed(2)} (-${stopLossPercent}%)`, color: "text-cyber-magenta" },
                  { label: "止盈价格", value: `$${takeProfit.toFixed(2)} (+${takeProfitPercent}%)`, color: "text-cyber-green" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-mono font-medium ${row.color || ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleExecute}
                  className="flex-1 text-xs font-heading tracking-wider bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue border border-cyber-blue/30"
                  variant="outline"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  确认执行
                </Button>
                <Button variant="outline" onClick={() => setStage("config")} className="text-xs border-border text-muted-foreground">
                  返回修改
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Stage: Executing ── */}
          {stage === "executing" && (
            <motion.div key="executing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-4">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 mx-auto mb-3"
                >
                  <Loader2 className="w-12 h-12 text-cyber-blue" />
                </motion.div>
                <p className="text-sm font-heading tracking-wider text-cyber-blue">正在执行模拟交易...</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "连接交易引擎", threshold: 15 },
                  { label: "验证风控参数", threshold: 35 },
                  { label: "计算最优路由", threshold: 55 },
                  { label: "提交模拟订单", threshold: 75 },
                  { label: "撮合确认", threshold: 90 },
                  { label: "记录交易日志", threshold: 100 },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      progress >= step.threshold
                        ? "bg-cyber-green/20"
                        : progress >= step.threshold - 15
                        ? "bg-cyber-blue/20"
                        : "bg-secondary/30"
                    }`}>
                      {progress >= step.threshold ? (
                        <Check className="w-2.5 h-2.5 text-cyber-green" />
                      ) : progress >= step.threshold - 15 ? (
                        <Loader2 className="w-2.5 h-2.5 text-cyber-blue animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <span className={`text-[11px] ${
                      progress >= step.threshold ? "text-cyber-green" : progress >= step.threshold - 15 ? "text-cyber-blue" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground text-center font-mono">{progress}% 完成</p>
            </motion.div>
          )}

          {/* ── Stage: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-cyber-green mx-auto mb-2" />
                </motion.div>
                <p className="text-sm font-heading tracking-wider text-cyber-green">模拟交易已成交</p>
                <p className="text-[10px] text-muted-foreground mt-1">订单已提交至模拟交易引擎，可在交易管理页面查看详情</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-md bg-secondary/20 border border-border/50 text-center">
                  <p className="text-[9px] text-muted-foreground">成交价格</p>
                  <p className="text-sm font-mono font-bold">${decision.price.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/20 border border-border/50 text-center">
                  <p className="text-[9px] text-muted-foreground">仓位价值</p>
                  <p className="text-sm font-mono font-bold text-cyber-blue">${totalValue.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => { setStage("config"); onClose(); }}
                  variant="outline"
                  className="flex-1 text-xs border-border"
                >
                  完成
                </Button>
                <Button
                  onClick={() => { setStage("config"); }}
                  variant="outline"
                  className="flex-1 text-xs border-cyber-blue/30 text-cyber-blue"
                >
                  继续下单
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Preset historical sim trades for demo ── */
// Use ALL coins from the platform (441 coins across 14 categories (Binance full universe) including altcoins)
const tradableCoins = allCoinsData.filter(c => c.category !== "稳定币");
const tradableCoinCategories = coinCategories.filter(c => c !== "全部" && c !== "稳定币");

function generateHistoricalTrades(): SimTrade[] {
  const actions: ("买入" | "卖出" | "加仓" | "减仓")[] = ["买入", "卖出", "加仓", "减仓"];
  const now = Date.now();
  const trades: SimTrade[] = [];

  // Generate 60+ trades covering all tradable coins to demonstrate full coverage
  const tradeCount = Math.max(60, tradableCoins.length * 2);
  for (let i = 0; i < tradeCount; i++) {
    const seed = i * 137 + 42;
    // Ensure each coin gets at least 1 trade, then distribute randomly
    const coinData = i < tradableCoins.length
      ? tradableCoins[i]
      : tradableCoins[Math.floor(seededRandom(seed) * tradableCoins.length)];
    const action = actions[Math.floor(seededRandom(seed + 1) * actions.length)];
    const qty = Math.round((seededRandom(seed + 2) * 9000 + 500) / 100) * 100;
    const lev = [1, 2, 3, 5, 10][Math.floor(seededRandom(seed + 3) * 5)];
    const base = coinData.price;
    const entry = base * (1 + (seededRandom(seed + 4) - 0.5) * 0.08);
    const pnlVal = (seededRandom(seed + 5) - 0.4) * qty * 0.12;
    // Spread timestamps across last 14 days for richer history
    const hoursAgo = seededRandom(seed + 6) * 336; // 0-336 hours (14 days)
    const ts = new Date(now - hoursAgo * 3600000);

    trades.push({
      id: `SIM-${(now - i * 100000).toString(36).toUpperCase().slice(0, 8)}`,
      decisionId: (i % 5) + 1,
      coin: coinData.symbol,
      action,
      entryPrice: Math.round(entry * 100) / 100,
      quantity: qty,
      leverage: lev,
      stopLoss: entry * (action === "买入" || action === "加仓" ? 0.95 : 1.05),
      takeProfit: entry * (action === "买入" || action === "加仓" ? 1.10 : 0.90),
      status: "filled",
      timestamp: ts,
      currentPrice: entry * (1 + (seededRandom(seed + 7) - 0.45) * 0.05),
      pnl: Math.round(pnlVal * 100) / 100,
      pnlPercent: Math.round((pnlVal / qty) * 10000) / 100,
    });
  }
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const HISTORICAL_TRADES = generateHistoricalTrades();

/* ── Sort types ── */
type SortField = "time" | "pnl" | "pnlPercent" | "quantity" | "coin";
type SortDir = "asc" | "desc";
type PnlFilter = "all" | "profit" | "loss";
type TimeRange = "all" | "1h" | "4h" | "24h" | "3d" | "7d" | "14d";
type CategoryFilter = string; // "all" or a category name

/* ── Trade History Mini Panel ── */
function TradeHistoryMini({ trades }: { trades: SimTrade[] }) {
  // Merge real-time trades with historical demo data
  const allTrades = useMemo(() => {
    const merged = [...trades, ...HISTORICAL_TRADES];
    // Deduplicate by id
    const seen = new Set<string>();
    return merged.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [trades]);

  const [showFilters, setShowFilters] = useState(true);
  const [coinFilter, setCoinFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Derive unique coins from all trades, grouped by category
  const uniqueCoins = useMemo(() => {
    const coins = Array.from(new Set(allTrades.map((t) => t.coin)));
    return coins.sort();
  }, [allTrades]);

  // Coins filtered by category selection
  const categoryFilteredCoins = useMemo(() => {
    if (categoryFilter === "all") return uniqueCoins;
    const catCoins = allCoinsData.filter(c => c.category === categoryFilter).map(c => c.symbol);
    return uniqueCoins.filter(c => catCoins.includes(c));
  }, [uniqueCoins, categoryFilter]);

  // Category stats for display
  const categoryStats = useMemo(() => {
    return tradableCoinCategories.map(cat => {
      const catCoins = allCoinsData.filter(c => c.category === cat).map(c => c.symbol);
      const count = allTrades.filter(t => catCoins.includes(t.coin)).length;
      return { name: cat, count };
    });
  }, [allTrades]);

  // Filtered and sorted trades
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const rangeMs: Record<TimeRange, number> = {
      all: Infinity,
      "1h": 3600000,
      "4h": 4 * 3600000,
      "24h": 24 * 3600000,
      "3d": 3 * 24 * 3600000,
      "7d": 7 * 24 * 3600000,
      "14d": 14 * 24 * 3600000,
    };

    let result = allTrades.filter((t) => {
      // Time filter
      if (timeRange !== "all" && now - t.timestamp.getTime() > rangeMs[timeRange]) return false;
      // Category filter
      if (categoryFilter !== "all") {
        const catCoins = allCoinsData.filter(c => c.category === categoryFilter).map(c => c.symbol);
        if (!catCoins.includes(t.coin)) return false;
      }
      // Coin filter
      if (coinFilter !== "all" && t.coin !== coinFilter) return false;
      // PnL filter
      if (pnlFilter === "profit" && t.pnl < 0) return false;
      if (pnlFilter === "loss" && t.pnl >= 0) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "time":
          cmp = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case "pnl":
          cmp = a.pnl - b.pnl;
          break;
        case "pnlPercent":
          cmp = a.pnlPercent - b.pnlPercent;
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        case "coin":
          cmp = a.coin.localeCompare(b.coin);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [allTrades, coinFilter, categoryFilter, pnlFilter, timeRange, sortField, sortDir]);

  // Stats for filtered trades
  const stats = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter((t) => t.pnl >= 0).length;
    const totalPnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const totalVolume = filteredTrades.reduce((s, t) => s + t.quantity * t.leverage, 0);
    const avgPnl = total > 0 ? totalPnl / total : 0;
    const maxWin = filteredTrades.length > 0 ? Math.max(...filteredTrades.map((t) => t.pnl)) : 0;
    const maxLoss = filteredTrades.length > 0 ? Math.min(...filteredTrades.map((t) => t.pnl)) : 0;
    return { total, wins, winRate: total > 0 ? (wins / total) * 100 : 0, totalPnl, totalVolume, avgPnl, maxWin, maxLoss };
  }, [filteredTrades]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const resetFilters = () => {
    setCoinFilter("all");
    setCategoryFilter("all");
    setPnlFilter("all");
    setTimeRange("all");
    setSortField("time");
    setSortDir("desc");
  };

  const hasActiveFilters = coinFilter !== "all" || categoryFilter !== "all" || pnlFilter !== "all" || timeRange !== "all";

  const formatTime = (d: Date) => {
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 text-cyber-blue" />
      : <ChevronUp className="w-3 h-3 text-cyber-blue" />;
  };

  if (allTrades.length === 0) return null;

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-cyber-amber" /> 模拟交易记录
            <Badge variant="outline" className="text-[9px] py-0 border-cyber-blue/30 text-cyber-blue ml-2">
              {filteredTrades.length}/{allTrades.length}笔
            </Badge>
            {hasActiveFilters && (
              <Badge variant="outline" className="text-[9px] py-0 border-cyber-amber/30 text-cyber-amber">
                已筛选
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-cyber-amber"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> 重置
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-6 px-2 text-[10px] ${showFilters ? "text-cyber-blue" : "text-muted-foreground"}`}
            >
              <SlidersHorizontal className="w-3 h-3 mr-1" /> 筛选
              {showFilters ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 p-3 rounded-lg bg-secondary/10 border border-border/50">
                {/* Time Range */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 时间范围
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "1h", "4h", "24h", "3d", "7d", "14d"] as TimeRange[]).map((r) => {
                      const labels: Record<TimeRange, string> = { all: "全部", "1h": "1小时", "4h": "4小时", "24h": "24小时", "3d": "3天", "7d": "7天", "14d": "14天" };
                      return (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                            timeRange === r
                              ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                              : "bg-secondary/30 text-muted-foreground border border-transparent hover:bg-secondary/50"
                          }`}
                        >
                          {labels[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> 币种板块 · {tradableCoins.length}+币种全覆盖
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => { setCategoryFilter("all"); setCoinFilter("all"); }}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all border ${
                        categoryFilter === "all"
                          ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                          : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                      }`}
                    >
                      全部板块
                      <span className="text-[8px] opacity-60 ml-1">({allTrades.length})</span>
                    </button>
                    {categoryStats.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => { setCategoryFilter(cat.name); setCoinFilter("all"); }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1 border ${
                          categoryFilter === cat.name
                            ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                            : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                        }`}
                      >
                        {cat.name}
                        <span className="text-[8px] opacity-60">({cat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coin Filter (within selected category) */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> 交易对{categoryFilter !== "all" ? ` · ${categoryFilter}` : " · 全部币种"}
                    <span className="text-[9px] text-cyber-blue/70">({categoryFilteredCoins.length}种)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,217,255,0.2) transparent" }}>
                    <button
                      onClick={() => setCoinFilter("all")}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all border ${
                        coinFilter === "all"
                          ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                          : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                      }`}
                    >
                      全部
                    </button>
                    {categoryFilteredCoins.map((c) => {
                      const count = allTrades.filter((t) => t.coin === c).length;
                      return (
                        <button
                          key={c}
                          onClick={() => setCoinFilter(c)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 border ${
                            coinFilter === c
                              ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                              : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                          }`}
                        >
                          {c}
                          <span className="text-[8px] opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PnL Filter */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> 盈亏状态
                  </p>
                  <div className="flex gap-1.5">
                    {(["all", "profit", "loss"] as PnlFilter[]).map((f) => {
                      const labels: Record<PnlFilter, string> = { all: "全部", profit: "盈利", loss: "亏损" };
                      const colors: Record<PnlFilter, string> = {
                        all: pnlFilter === "all" ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30" : "",
                        profit: pnlFilter === "profit" ? "bg-cyber-green/20 text-cyber-green border-cyber-green/30" : "",
                        loss: pnlFilter === "loss" ? "bg-cyber-magenta/20 text-cyber-magenta border-cyber-magenta/30" : "",
                      };
                      const active = pnlFilter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setPnlFilter(f)}
                          className={`px-3 py-1 rounded text-[10px] font-mono transition-all border ${
                            active
                              ? `${colors[f]} shadow-[0_0_6px_rgba(0,217,255,0.1)]`
                              : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                          }`}
                        >
                          {f === "profit" && "↑ "}{f === "loss" && "↓ "}{labels[f]}
                          <span className="text-[8px] opacity-60 ml-1">
                            ({f === "all" ? allTrades.length : f === "profit" ? allTrades.filter((t) => t.pnl >= 0).length : allTrades.filter((t) => t.pnl < 0).length})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Controls */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> 排序方式
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { field: "time" as SortField, label: "时间" },
                      { field: "pnl" as SortField, label: "盈亏金额" },
                      { field: "pnlPercent" as SortField, label: "盈亏比例" },
                      { field: "quantity" as SortField, label: "投入金额" },
                      { field: "coin" as SortField, label: "币种" },
                    ]).map(({ field, label }) => (
                      <button
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1 border ${
                          sortField === field
                            ? "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 shadow-[0_0_6px_rgba(0,217,255,0.15)]"
                            : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                        }`}
                      >
                        {label}
                        <SortIcon field={field} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Summary Bar ── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-md bg-secondary/20 border border-border/50 text-center">
            <p className="text-[9px] text-muted-foreground">筛选结果</p>
            <p className="text-xs font-mono font-bold">{stats.total}笔</p>
          </div>
          <div className="p-2 rounded-md bg-secondary/20 border border-border/50 text-center">
            <p className="text-[9px] text-muted-foreground">胜率</p>
            <p className={`text-xs font-mono font-bold ${stats.winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta"}`}>
              {stats.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-2 rounded-md bg-secondary/20 border border-border/50 text-center">
            <p className="text-[9px] text-muted-foreground">总盈亏</p>
            <p className={`text-xs font-mono font-bold ${stats.totalPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)}
            </p>
          </div>
          <div className="p-2 rounded-md bg-secondary/20 border border-border/50 text-center">
            <p className="text-[9px] text-muted-foreground">总交易量</p>
            <p className="text-xs font-mono font-bold text-cyber-blue">
              ${stats.totalVolume >= 1000000 ? `${(stats.totalVolume / 1000000).toFixed(1)}M` : `${(stats.totalVolume / 1000).toFixed(0)}K`}
            </p>
          </div>
        </div>

        {/* ── Extended Stats Row ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-md bg-secondary/10 border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground">平均盈亏</p>
            <p className={`text-[11px] font-mono font-bold ${stats.avgPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
              {stats.avgPnl >= 0 ? "+" : ""}${stats.avgPnl.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-md bg-secondary/10 border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground">最大盈利</p>
            <p className="text-[11px] font-mono font-bold text-cyber-green">
              +${stats.maxWin.toFixed(2)}
            </p>
          </div>
          <div className="p-2 rounded-md bg-secondary/10 border border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground">最大亏损</p>
            <p className="text-[11px] font-mono font-bold text-cyber-magenta">
              ${stats.maxLoss.toFixed(2)}
            </p>
          </div>
        </div>

        {/* ── Trade List ── */}
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,217,255,0.2) transparent" }}>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">当前筛选条件下无交易记录</p>
              <button onClick={resetFilters} className="text-[10px] text-cyber-blue hover:underline mt-1">
                重置筛选条件
              </button>
            </div>
          ) : (
            filteredTrades.map((t, idx) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/20 border border-border/50 hover:bg-secondary/30 transition-colors group"
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  t.action === "买入" || t.action === "加仓" ? "bg-cyber-green/10" : "bg-cyber-magenta/10"
                }`}>
                  {t.action === "买入" || t.action === "加仓" ? (
                    <ArrowUpRight className="w-4 h-4 text-cyber-green" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-cyber-magenta" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold">{t.coin}</span>
                    <Badge variant="outline" className={`text-[9px] py-0 ${
                      t.action === "买入" || t.action === "加仓" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-magenta/30 text-cyber-magenta"
                    }`}>
                      {t.action}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">{t.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span>入场 ${t.entryPrice.toLocaleString()}</span>
                    <span>{t.leverage}x</span>
                    <span>${t.quantity.toLocaleString()}</span>
                    <span className="opacity-60">{formatTime(t.timestamp)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-mono font-bold ${t.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                  </p>
                  <p className={`text-[10px] font-mono ${t.pnl >= 0 ? "text-cyber-green/70" : "text-cyber-magenta/70"}`}>
                    {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent.toFixed(2)}%
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] py-0 border-cyber-green/30 text-cyber-green shrink-0">
                  已成交
                </Badge>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Bottom Summary ── */}
        {filteredTrades.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-md bg-cyber-blue/5 border border-cyber-blue/20">
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-muted-foreground">
                显示 <span className="text-foreground font-bold">{filteredTrades.length}</span> / {allTrades.length} 笔
              </span>
              <span className="text-muted-foreground">
                胜率 <span className={`font-mono font-bold ${stats.winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                  {stats.winRate.toFixed(0)}%
                </span>
              </span>
              <span className="text-muted-foreground">
                盈 <span className="text-cyber-green font-mono">{stats.wins}</span> / 亏 <span className="text-cyber-magenta font-mono">{stats.total - stats.wins}</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground">筛选盈亏 </span>
              <span className={`text-xs font-mono font-bold ${
                stats.totalPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"
              }`}>
                {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */
export default function AIDecisionExplainer() {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [tradingDecisionId, setTradingDecisionId] = useState<number | null>(null);
  const [simTrades, setSimTrades] = useState<SimTrade[]>([]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "买入": case "加仓": return "text-cyber-green border-cyber-green/30";
      case "卖出": case "减仓": return "text-cyber-magenta border-cyber-magenta/30";
      default: return "text-cyber-amber border-cyber-amber/30";
    }
  };

  const handleExecuteTrade = useCallback((trade: SimTrade) => {
    setSimTrades((prev) => [trade, ...prev]);
    toast.success(`模拟交易已成交: ${trade.action} ${trade.coin} $${trade.quantity.toLocaleString()}`, {
      description: `订单号 ${trade.id} · ${trade.leverage}x杠杆 · 入场价 $${trade.entryPrice.toLocaleString()}`,
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyber-amber" /> AI决策解释器
                <Badge variant="outline" className="text-[9px] py-0 border-cyber-green/30 text-cyber-green ml-2">实时</Badge>
                {simTrades.length > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 border-cyber-blue/30 text-cyber-blue">
                    {simTrades.length}笔模拟交易
                  </Badge>
                )}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">每笔AI交易决策的因子权重、SHAP解释和推理链路 · 支持一键模拟下单</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {decisions.map((d) => (
            <motion.div
              key={d.id}
              className={`rounded-lg border transition-all ${expandedId === d.id ? "border-cyber-blue/40 bg-cyber-blue/5" : "border-border bg-secondary/20 hover:bg-secondary/30"}`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {expandedId === d.id ? <ChevronDown className="w-3.5 h-3.5 text-cyber-blue shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="font-mono font-bold text-sm">{d.coin}</span>
                  <Badge variant="outline" className={`text-[10px] py-0 ${getActionColor(d.action)}`}>{d.action}</Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">${d.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{d.model}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.confidence}%`,
                          backgroundColor: d.confidence > 85 ? "#00ff88" : d.confidence > 70 ? "#ffaa00" : "#ff0080",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${d.confidence > 85 ? "text-cyber-green" : d.confidence > 70 ? "text-cyber-amber" : "text-cyber-magenta"}`}>
                      {d.confidence}%
                    </span>
                  </div>
                  {d.outcome && (
                    <span className={`text-[10px] font-mono ${d.outcome.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                      {d.outcome.pnl >= 0 ? "+" : ""}{d.outcome.pnl.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{d.timestamp}</span>
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedId === d.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                      {/* Feature Importance (SHAP-like) */}
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> 因子贡献度 (SHAP值)
                        </p>
                        <div className="space-y-1.5">
                          {d.features.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[10px] w-28 truncate text-muted-foreground">{f.name}</span>
                              <div className="flex-1 h-4 relative flex items-center">
                                <div className="w-full flex items-center">
                                  <div className="w-1/2 flex justify-end">
                                    {f.weight < 0 && (
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.abs(f.weight) * 400}%` }}
                                        className="h-3 rounded-l-sm bg-cyber-magenta/60"
                                        style={{ maxWidth: "100%" }}
                                      />
                                    )}
                                  </div>
                                  <div className="w-px h-4 bg-muted-foreground/30 shrink-0" />
                                  <div className="w-1/2">
                                    {f.weight > 0 && (
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${f.weight * 400}%` }}
                                        className="h-3 rounded-r-sm bg-cyber-green/60"
                                        style={{ maxWidth: "100%" }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[10px] font-mono w-10 text-right ${f.weight >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                                {f.weight >= 0 ? "+" : ""}{f.weight.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reasoning Chain */}
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> 推理链路
                        </p>
                        <div className="space-y-1.5 pl-2 border-l border-cyber-blue/20">
                          {d.reasoning.map((r, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <div className="w-4 h-4 rounded-full bg-cyber-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[8px] text-cyber-blue font-mono">{i + 1}</span>
                              </div>
                              <p className="text-[11px] text-foreground/80 leading-relaxed">{r}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Outcome */}
                      {d.outcome && (
                        <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 border border-border/50">
                          {d.outcome.accuracy ? (
                            <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-cyber-magenta" />
                          )}
                          <span className="text-[11px]">
                            决策结果: <span className={d.outcome.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}>
                              {d.outcome.pnl >= 0 ? "+" : ""}${d.outcome.pnl.toLocaleString()}
                            </span>
                          </span>
                          <Badge variant="outline" className={`text-[9px] py-0 ${d.outcome.accuracy ? "border-cyber-green/30 text-cyber-green" : "border-cyber-magenta/30 text-cyber-magenta"}`}>
                            {d.outcome.accuracy ? "预测正确" : "预测偏差"}
                          </Badge>
                        </div>
                      )}

                      {/* Sim Trade Button */}
                      {tradingDecisionId !== d.id && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); setTradingDecisionId(d.id); }}
                          variant="outline"
                          className={`w-full text-xs font-heading tracking-wider ${
                            d.action === "买入" || d.action === "加仓"
                              ? "border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                              : "border-cyber-magenta/30 text-cyber-magenta hover:bg-cyber-magenta/10"
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                          基于此分析 · 一键模拟{d.action}
                        </Button>
                      )}

                      {/* Sim Trade Panel */}
                      <AnimatePresence>
                        {tradingDecisionId === d.id && (
                          <SimTradePanel
                            decision={d}
                            onClose={() => setTradingDecisionId(null)}
                            onExecute={handleExecuteTrade}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Trade History */}
      <TradeHistoryMini trades={simTrades} />
    </div>
  );
}
