/**
 * AutoTrader — AI量化自动买卖执行引擎 v3.0
 * 
 * 纯展示组件：所有交易逻辑和状态由 TradingContext 全局管理
 * 本组件只负责UI渲染，从 TradingContext 获取数据
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Zap, Pause, Shield, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Activity, Brain, Target, CheckCircle2, XCircle, AlertTriangle, DollarSign,
  BarChart3, Cpu, Eye, Lock, ArrowRight, ChevronDown, ChevronUp, Wallet,
  FlaskConical, RotateCcw, FastForward, Gauge, Trophy, Hash, LineChart,
  Layers, Sparkles, Trash2
} from "lucide-react";
import { useTradingContext, type TradeOrder, type TradeMode } from "@/contexts/TradingContext";
import type { TradeSignal } from "@/lib/aiStrategyEngine";
import { SimulatedAccountDetailCards } from './SimulatedAccountDetailCards';

// ============ PIPELINE STAGES ============
const PIPELINE_STAGES = [
  { label: "行情分析", icon: LineChart, color: "text-cyber-blue" },
  { label: "AI决策", icon: Brain, color: "text-cyber-blue" },
  { label: "风控审核", icon: Shield, color: "text-cyber-amber" },
  { label: "下单执行", icon: Zap, color: "text-cyber-green" },
  { label: "撮合确认", icon: CheckCircle2, color: "text-cyber-green" },
  { label: "持仓管理", icon: Eye, color: "text-cyber-blue" },
];

const INITIAL_PAPER_BALANCE = [10000, 50000, 100000, 500000];

// ============ PIPELINE VISUALIZATION ============
function PipelineVisual({ stage, rejected }: { stage: number; rejected: boolean }) {
  return (
    <div className="flex items-center gap-0.5 py-2">
      {PIPELINE_STAGES.map((s, i) => {
        const isActive = i === stage;
        const isDone = i < stage;
        const isFailed = rejected && i === 2;
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

// ============ AI SIGNAL DETAIL ============
function AISignalDetail({ signal }: { signal: TradeSignal }) {
  return (
    <div className="mt-1 p-2 rounded-lg bg-gradient-to-r from-cyber-blue/5 to-cyber-green/5 border border-cyber-blue/10">
      <div className="flex items-center gap-1 mb-1">
        <Sparkles className="w-3 h-3 text-cyber-blue" />
        <span className="text-[8px] font-bold text-cyber-blue">AI多因子分析</span>
        <Badge variant="outline" className="text-[6px] py-0 border-cyber-blue/20 text-cyber-blue ml-auto">
          {signal.strategies.length}个策略共识
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-1 mb-1">
        <div className="text-[7px]">
          <span className="text-muted-foreground">RSI:</span>
          <span className={`ml-0.5 font-mono ${
            signal.indicators.rsi < 30 ? "text-cyber-green" : signal.indicators.rsi > 70 ? "text-cyber-magenta" : "text-foreground"
          }`}>{signal.indicators.rsi.toFixed(1)}</span>
        </div>
        <div className="text-[7px]">
          <span className="text-muted-foreground">MACD:</span>
          <span className={`ml-0.5 font-mono ${
            signal.indicators.macd.histogram > 0 ? "text-cyber-green" : "text-cyber-magenta"
          }`}>{signal.indicators.macd.histogram > 0 ? "+" : ""}{signal.indicators.macd.histogram.toFixed(4)}</span>
        </div>
        <div className="text-[7px]">
          <span className="text-muted-foreground">EMA:</span>
          <span className={`ml-0.5 font-mono ${
            signal.indicators.ema.trend === "上升" ? "text-cyber-green" : signal.indicators.ema.trend === "下降" ? "text-cyber-magenta" : "text-foreground"
          }`}>{signal.indicators.ema.trend}</span>
        </div>
        <div className="text-[7px]">
          <span className="text-muted-foreground">BB:</span>
          <span className="ml-0.5 font-mono text-foreground">{(signal.indicators.bollinger.position * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-[7px] text-foreground/70 leading-relaxed">
        {signal.reasoning}
      </div>
    </div>
  );
}

// ============ PAPER ACCOUNT CARD ============
function PaperAccountPanel({ onReset, onChangeBalance, onClearHistory }: {
  onReset: () => void;
  onChangeBalance: (b: number) => void;
  onClearHistory: () => void;
}) {
  const { paperAccount, dataReady, dataStats } = useTradingContext();
  const account = paperAccount;
  const pnlPct = ((account.equity - account.initialBalance) / account.initialBalance) * 100;
  const winRate = account.totalTrades > 0 ? (account.wins / account.totalTrades) * 100 : 0;
  const drawdownPct = account.peakEquity > 0 ? (account.maxDrawdown / account.peakEquity) * 100 : 0;
  const runningHours = Math.floor((Date.now() - account.startTime) / 3600000);

  return (
    <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-cyber-blue/5 via-transparent to-cyber-green/5 border border-cyber-blue/20">
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
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 border-muted-foreground/20" onClick={onClearHistory}>
            <Trash2 className="w-3 h-3" />清空日志
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 border-muted-foreground/20" onClick={onReset}>
            <RotateCcw className="w-3 h-3" />重置账户
          </Button>
        </div>
      </div>

      {/* AI Data Status */}
      <div className="mb-2.5 p-2 rounded-lg bg-card/50 border border-cyber-green/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyber-green" />
            <span className="text-[9px] font-bold text-cyber-green">AI策略引擎</span>
            <Badge variant="outline" className={`text-[6px] py-0 ${dataReady ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
              {dataReady ? "就绪" : "数据收集中"}
            </Badge>
          </div>
          <span className="text-[7px] text-muted-foreground">
            {dataStats.readySymbols}/{dataStats.totalSymbols} 币种就绪 · {dataStats.totalCandles} K线
          </span>
        </div>
        {!dataReady && (
          <div className="mt-1.5">
            <Progress value={Math.min(100, (dataStats.readySymbols / Math.max(1, dataStats.totalSymbols)) * 100)} className="h-1" />
            <div className="text-[7px] text-muted-foreground mt-0.5">正在初始化AI策略引擎，请稍候...</div>
          </div>
        )}
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
          <span className="font-mono text-foreground">{((1 - account.balance / Math.max(1, account.equity)) * 100).toFixed(1)}%</span>
        </div>
        <Progress value={Math.max(0, Math.min(100, (1 - account.balance / Math.max(1, account.equity)) * 100))} className="h-1.5" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-1.5 mb-2.5">
        {[
          { icon: Hash, label: "总交易", value: account.totalTrades.toString(), color: "text-cyber-blue" },
          { icon: Trophy, label: "胜率", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta" },
          { icon: TrendingUp, label: "平均盈利", value: `$${account.avgWin.toFixed(0)}`, color: "text-cyber-green" },
          { icon: TrendingDown, label: "平均亏损", value: `-$${Math.abs(account.avgLoss).toFixed(0)}`, color: "text-cyber-magenta" },
        ].map((s, i) => (
          <div key={i} className="p-1.5 rounded-lg bg-card/50 text-center">
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
          <div key={i} className="p-1.5 rounded-lg bg-card/50 text-center">
            <div className={`text-[10px] font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Initial balance settings */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[8px] text-muted-foreground">初始资金设置</span>
        {INITIAL_PAPER_BALANCE.map(b => (
          <button key={b}
            onClick={() => onChangeBalance(b)}
            className={`px-2 py-0.5 rounded text-[8px] transition-colors ${
              account.initialBalance === b ? "bg-cyber-blue/20 text-cyber-blue ring-1 ring-cyber-blue/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ${b >= 1000 ? `${b / 1000}K` : b}
          </button>
        ))}
      </div>

      {/* 详细账户信息卡片 */}
      <div className="mt-3">
        <SimulatedAccountDetailCards />
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function AutoTrader() {
  const ctx = useTradingContext();
  const {
    enabled, setEnabled, tradeMode, setTradeMode, speed, setSpeed,
    orders, positions, stats, paperAccount, resetPaperAccount, clearTradeHistory,
    tradeRecords, dataReady, dataStats, wsStatus,
    SPEED_OPTIONS,
  } = ctx;

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showModeConfirm, setShowModeConfirm] = useState(false);

  const handleModeSwitch = useCallback((newMode: TradeMode) => {
    if (newMode === "live" && tradeMode === "paper") {
      setShowModeConfirm(true);
      return;
    }
    setTradeMode(newMode);
    toast.info(newMode === "paper" ? "已切换至模拟交易模式" : "已切换至真实交易模式");
  }, [tradeMode, setTradeMode]);

  const openPositions = positions.filter(p => p.status === "open");
  const closedPositions = positions.filter(p => p.status === "closed");
  const totalUnrealizedPnl = openPositions.reduce((s, p) => s + p.pnl, 0);
  const totalRealizedPnl = closedPositions.reduce((s, p) => s + p.pnl, 0);

  const formatPrice = (p: number) => p < 1 ? p.toPrecision(4) : p < 10 ? p.toFixed(4) : p.toFixed(2);
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
              {enabled ? (dataReady ? "AI运行中" : "数据收集中") : "已暂停"}
            </Badge>
            <Badge variant="outline" className={`text-[6px] py-0 ${wsStatus === "connected" ? "border-cyber-green/20 text-cyber-green" : "border-cyber-amber/20 text-cyber-amber"}`}>
              {wsStatus === "connected" ? "行情已连接" : "行情连接中"}
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

          {tradeMode === "paper" && (
            <div className="flex items-center gap-1 ml-auto">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">速度</span>
              {SPEED_OPTIONS.map(opt => (
                <button key={opt.value}
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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 rounded-lg bg-cyber-amber/10 border border-cyber-amber/30">
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
                  toast.warning("已切换至真实交易模式", { description: "请谨慎操作，所有交易将使用真实资金" });
                }}>确认切换</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => setShowModeConfirm(false)}>取消</Button>
                <span className="text-[8px] text-muted-foreground ml-auto">
                  模拟交易记录: {paperAccount.totalTrades}笔 · 胜率: {paperAccount.totalTrades > 0 ? ((paperAccount.wins / paperAccount.totalTrades) * 100).toFixed(1) : "0"}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paper account panel */}
        {tradeMode === "paper" && (
          <PaperAccountPanel
            onReset={() => {
              resetPaperAccount();
              toast.success("模拟账户已重置");
            }}
            onChangeBalance={(b) => resetPaperAccount(b)}
            onClearHistory={() => {
              clearTradeHistory();
              toast.success("交易日志已清空");
            }}
          />
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {[
            { label: "总订单", value: stats.totalOrders + orders.filter(o => o.status === "pending" || o.status === "risk_check" || o.status === "executing").length, color: "text-cyber-blue" },
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
                <motion.div key={pos.id}
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
                <motion.div key={order.id}
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
                       order.status === "risk_check" ? "风控中" : "分析中"}
                    </Badge>
                    {order.mode === "paper" && <Badge variant="outline" className="text-[6px] py-0 border-cyber-blue/20 text-cyber-blue">模拟</Badge>}
                    <span className="text-[8px] text-muted-foreground ml-auto flex items-center gap-0.5">
                      <Brain className="w-2.5 h-2.5" />{order.model.length > 20 ? order.model.slice(0, 20) + "..." : order.model}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{formatTime(order.timestamp)}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="px-2 pb-2 border-t border-border/10 pt-1">
                      <PipelineVisual stage={order.pipelineStage} rejected={order.status === "rejected"} />
                      {order.aiSignal && <AISignalDetail signal={order.aiSignal} />}
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

        {/* Trade records summary */}
        {tradeRecords.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/20">
            <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" />历史交易记录 ({tradeRecords.length})
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="p-1 rounded bg-card/30">
                <div className="text-[9px] font-bold font-mono text-cyber-green">
                  {tradeRecords.filter(r => r.pnl > 0).length}
                </div>
                <div className="text-[6px] text-muted-foreground">盈利笔数</div>
              </div>
              <div className="p-1 rounded bg-card/30">
                <div className="text-[9px] font-bold font-mono text-cyber-magenta">
                  {tradeRecords.filter(r => r.pnl <= 0).length}
                </div>
                <div className="text-[6px] text-muted-foreground">亏损笔数</div>
              </div>
              <div className="p-1 rounded bg-card/30">
                <div className={`text-[9px] font-bold font-mono ${tradeRecords.reduce((s, r) => s + r.pnl, 0) >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                  ${tradeRecords.reduce((s, r) => s + r.pnl, 0).toFixed(0)}
                </div>
                <div className="text-[6px] text-muted-foreground">累计盈亏</div>
              </div>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="mt-3 p-3 rounded-lg bg-cyber-amber/5 border border-cyber-amber/20 text-center">
            <Pause className="w-5 h-5 text-cyber-amber mx-auto mb-1" />
            <p className="text-[10px] text-cyber-amber">自动交易已暂停</p>
            <p className="text-[8px] text-muted-foreground">开启后AI将基于实时行情和技术指标自动执行买卖决策</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
