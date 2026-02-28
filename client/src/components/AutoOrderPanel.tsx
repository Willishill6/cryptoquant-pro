/**
 * AutoOrderPanel — 自动下单控制面板
 *
 * 功能区块：
 * 1. 引擎总开关 + 运行状态摘要
 * 2. 参数配置（资金比例、止盈止损、最大持仓、置信度阈值）
 * 3. 实时信号快照
 * 4. 当前持仓（含手动平仓）
 * 5. 已平仓记录
 * 6. 操作日志
 * 7. 自我学习统计
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Bot, TrendingUp, TrendingDown, Shield, Zap, Brain, BookOpen,
  RefreshCw, X, CheckCircle2, XCircle, AlertTriangle, Activity,
  DollarSign, Target, Minus, BarChart3, Cpu, Layers
} from "lucide-react";

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
  return n.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPrice(n: number) {
  return n >= 1000 ? fmt(n, 2) : n >= 1 ? fmt(n, 4) : fmt(n, 6);
}
function relTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s前`;
  if (s < 3600) return `${Math.floor(s / 60)}m前`;
  return `${Math.floor(s / 3600)}h前`;
}

// ─── 子组件 ──────────────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? "bg-cyber-green" : "bg-muted-foreground/40"}`} />
    </span>
  );
}

function SignalCard({ signal }: { signal: any }) {
  const isBuy = signal.direction === "BUY";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-2.5 rounded-lg border ${isBuy ? "border-cyber-green/20 bg-cyber-green/5" : "border-cyber-magenta/20 bg-cyber-magenta/5"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {isBuy
            ? <TrendingUp className="w-3.5 h-3.5 text-cyber-green" />
            : <TrendingDown className="w-3.5 h-3.5 text-cyber-magenta" />}
          <span className="font-bold text-[11px]">{signal.symbol}</span>
          <Badge variant="outline" className={`text-[8px] py-0 px-1 ${isBuy ? "border-cyber-green/30 text-cyber-green" : "border-cyber-magenta/30 text-cyber-magenta"}`}>
            {isBuy ? "买入" : "卖出"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">置信</span>
          <span className={`text-[10px] font-mono font-bold ${signal.confidence >= 80 ? "text-cyber-green" : signal.confidence >= 65 ? "text-cyber-amber" : "text-muted-foreground"}`}>
            {signal.confidence.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="text-[8px] text-muted-foreground leading-relaxed">{signal.reasoning}</div>
      <div className="flex gap-3 mt-1 text-[8px]">
        <span className="text-muted-foreground">价格 <span className="font-mono text-foreground">${fmtPrice(signal.price)}</span></span>
        <span className="text-muted-foreground">RSI <span className="font-mono">{signal.factors.rsi.toFixed(1)}</span></span>
        <span className="text-muted-foreground">BB <span className="font-mono">{signal.factors.bbPosition}</span></span>
        {signal.factors.volumeSpike && <Badge variant="outline" className="text-[7px] py-0 border-cyber-amber/30 text-cyber-amber">量能异动</Badge>}
      </div>
    </motion.div>
  );
}

function PositionRow({ pos, onClose }: { pos: any; onClose: (id: string) => void }) {
  const pnl = pos.pnl ?? 0;
  const pnlPct = pos.pnlPct ?? 0;
  const isOpen = pos.status === "open";
  return (
    <div className={`p-2.5 rounded-lg border ${isOpen ? "border-border/50 bg-card/50" : pnl >= 0 ? "border-cyber-green/15 bg-cyber-green/5" : "border-cyber-magenta/15 bg-cyber-magenta/5"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[11px]">{pos.symbol}</span>
          <Badge variant="outline" className={`text-[7px] py-0 ${isOpen ? "border-cyber-blue/30 text-cyber-blue" : pnl >= 0 ? "border-cyber-green/30 text-cyber-green" : "border-cyber-magenta/30 text-cyber-magenta"}`}>
            {isOpen ? "持仓中" : pos.status === "closed_tp" ? "止盈" : pos.status === "closed_sl" ? "止损" : "手动"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold ${pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
            {pnl >= 0 ? "+" : ""}${fmt(pnl)}
          </span>
          {isOpen && (
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-cyber-magenta" onClick={() => onClose(pos.id)}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1.5 text-[8px]">
        <span className="text-muted-foreground">开仓 <span className="font-mono text-foreground">${fmtPrice(pos.entryPrice)}</span></span>
        <span className="text-muted-foreground">止盈 <span className="font-mono text-cyber-green">${fmtPrice(pos.takeProfitPrice)}</span></span>
        <span className="text-muted-foreground">止损 <span className="font-mono text-cyber-magenta">${fmtPrice(pos.stopLossPrice)}</span></span>
        <span className="text-muted-foreground">数量 <span className="font-mono text-foreground">{pos.quantity.toFixed(6)}</span></span>
        <span className="text-muted-foreground">金额 <span className="font-mono text-foreground">${fmt(pos.usdtAmount)}</span></span>
        <span className={`font-mono font-bold ${pnlPct >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
          {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: any }) {
  const actionColor: Record<string, string> = {
    OPEN: "text-cyber-green",
    CLOSE_TP: "text-cyber-green",
    CLOSE_SL: "text-cyber-magenta",
    CLOSE_MANUAL: "text-cyber-amber",
    RISK_BLOCK: "text-muted-foreground",
    SIGNAL_SKIP: "text-muted-foreground/50",
  };
  const ActionIcon = {
    OPEN: TrendingUp,
    CLOSE_TP: CheckCircle2,
    CLOSE_SL: XCircle,
    CLOSE_MANUAL: Minus,
    RISK_BLOCK: Shield,
    SIGNAL_SKIP: Activity,
  }[log.action as string] ?? Activity;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
      <ActionIcon className={`w-3 h-3 mt-0.5 shrink-0 ${actionColor[log.action] ?? "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-[10px]">{log.symbol}</span>
          <Badge variant="outline" className={`text-[7px] py-0 px-1 ${actionColor[log.action] ?? "text-muted-foreground"}`}>{log.action}</Badge>
          {log.confidence !== undefined && (
            <span className="text-[8px] text-muted-foreground">置信 {log.confidence.toFixed(0)}%</span>
          )}
          {log.pnl !== undefined && (
            <span className={`text-[9px] font-mono font-bold ${log.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
              {log.pnl >= 0 ? "+" : ""}${fmt(log.pnl)}
            </span>
          )}
          <span className="text-[8px] text-muted-foreground ml-auto">{relTime(log.timestamp)}</span>
        </div>
        <div className="text-[8px] text-muted-foreground truncate">{log.reason}</div>
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function AutoOrderPanel() {
  const [activeTab, setActiveTab] = useState("signals");

  // ── tRPC 查询 ──
  const statusQ = trpc.autoOrder.getStatus.useQuery(undefined, { refetchInterval: 3000 });
  const configQ = trpc.autoOrder.getConfig.useQuery();
  const signalsQ = trpc.autoOrder.getSignals.useQuery(undefined, { refetchInterval: 10000 });
  const openPosQ = trpc.autoOrder.getOpenPositions.useQuery(undefined, { refetchInterval: 3000 });
  const closedPosQ = trpc.autoOrder.getClosedPositions.useQuery({ limit: 30 }, { refetchInterval: 5000 });
  const logsQ = trpc.autoOrder.getOrderLogs.useQuery({ limit: 80 }, { refetchInterval: 3000 });
  const learnQ = trpc.autoOrder.getLearningStats.useQuery(undefined, { refetchInterval: 10000 });

  // ── tRPC 变更 ──
  const updateCfg = trpc.autoOrder.updateConfig.useMutation({
    onSuccess: () => { configQ.refetch(); statusQ.refetch(); },
    onError: (e) => toast.error("配置更新失败", { description: e.message }),
  });
  const manualClose = trpc.autoOrder.manualClose.useMutation({
    onSuccess: (r) => { toast.success(r.message); openPosQ.refetch(); closedPosQ.refetch(); logsQ.refetch(); },
    onError: (e) => toast.error("平仓失败", { description: e.message }),
  });
  const resetAll = trpc.autoOrder.resetAll.useMutation({
    onSuccess: () => {
      statusQ.refetch(); openPosQ.refetch(); closedPosQ.refetch(); logsQ.refetch(); learnQ.refetch();
      toast.success("数据已清空", { description: "持仓、日志、学习统计已全部重置" });
    },
    onError: (e) => toast.error("清空失败", { description: e.message }),
  });
  const resetSimAccount = trpc.trading.resetSimulatedAccount.useMutation({
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error("模拟账户重置失败", { description: e.message }),
  });

  const status = statusQ.data;
  const cfg = configQ.data;
  const signals = signalsQ.data ?? [];
  const openPos = openPosQ.data ?? [];
  const closedPos = closedPosQ.data ?? [];
  const logs = logsQ.data ?? [];
  const learn = learnQ.data;

  const isEnabled = status?.enabled ?? false;

  function toggleEngine() {
    updateCfg.mutate({ enabled: !isEnabled });
    toast(isEnabled ? "自动下单已暂停" : "自动下单已启动", {
      description: isEnabled ? "引擎停止扫描信号" : "引擎开始扫描信号，每15秒检查一次",
    });
  }

  function setCfgVal(key: string, val: number | boolean) {
    updateCfg.mutate({ [key]: val } as any);
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? "bg-cyber-green/15" : "bg-muted/30"}`}>
              <Bot className={`w-4.5 h-4.5 ${isEnabled ? "text-cyber-green" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                自动下单引擎
                <StatusDot active={isEnabled} />
              </CardTitle>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {status ? `${status.mode === "simulated" ? "模拟" : "真实"}模式 · 持仓 ${status.openCount} · 总交易 ${status.totalTrades}` : "加载中..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[9px] px-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => {
                if (window.confirm("确定清空所有模拟数据？\n这将重置：持仓、日志、学习统计、模拟账户余额")) {
                  resetAll.mutate();
                  resetSimAccount.mutate({ balance: 10000 });
                }
              }}
              disabled={resetAll.isPending || resetSimAccount.isPending}
            >
              <RefreshCw className="w-2.5 h-2.5 mr-1" />
              清空数据
            </Button>
            <span className="text-[10px] text-muted-foreground">{isEnabled ? "运行中" : "已停止"}</span>
            <Switch checked={isEnabled} onCheckedChange={toggleEngine} className="data-[state=checked]:bg-cyber-green" />
          </div>
        </div>

        {/* 状态摘要条 */}
        {status && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "当前持仓", value: status.openCount, icon: Layers, color: "text-cyber-blue" },
              { label: "总交易", value: status.totalTrades, icon: Activity, color: "text-foreground" },
              { label: "胜率", value: `${status.winRate.toFixed(1)}%`, icon: Target, color: status.winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta" },
              { label: "信号阈值", value: `${status.adaptedMinConfidence.toFixed(0)}%`, icon: Brain, color: "text-cyber-amber" },
            ].map(item => (
              <div key={item.label} className="p-2 rounded-lg bg-card/60 border border-border/40 text-center">
                <item.icon className={`w-3 h-3 mx-auto mb-0.5 ${item.color}`} />
                <div className={`text-[12px] font-bold font-mono ${item.color}`}>{item.value}</div>
                <div className="text-[7px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* ── 参数配置 ── */}
        {cfg && (
          <div className="mb-4 p-3 rounded-xl border border-border/40 bg-card/30 space-y-3">
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
              <Cpu className="w-3 h-3" />参数配置
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* 资金比例 */}
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />单笔资金比例</span>
                  <span className="font-mono font-bold text-cyber-blue">{cfg.capitalPct}%</span>
                </div>
                <Slider
                  min={1} max={20} step={1}
                  value={[cfg.capitalPct]}
                  onValueChange={([v]) => setCfgVal("capitalPct", v)}
                  className="h-1"
                />
              </div>
              {/* 最大持仓 */}
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Layers className="w-2.5 h-2.5" />最大持仓数</span>
                  <span className="font-mono font-bold text-cyber-blue">{cfg.maxPositions}</span>
                </div>
                <Slider
                  min={1} max={20} step={1}
                  value={[cfg.maxPositions]}
                  onValueChange={([v]) => setCfgVal("maxPositions", v)}
                  className="h-1"
                />
              </div>
              {/* 止盈 */}
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-cyber-green" />止盈比例</span>
                  <span className="font-mono font-bold text-cyber-green">+{cfg.takeProfitPct}%</span>
                </div>
                <Slider
                  min={0.5} max={20} step={0.5}
                  value={[cfg.takeProfitPct]}
                  onValueChange={([v]) => setCfgVal("takeProfitPct", v)}
                  className="h-1"
                />
              </div>
              {/* 止损 */}
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="w-2.5 h-2.5 text-cyber-magenta" />止损比例</span>
                  <span className="font-mono font-bold text-cyber-magenta">-{cfg.stopLossPct}%</span>
                </div>
                <Slider
                  min={0.5} max={15} step={0.5}
                  value={[cfg.stopLossPct]}
                  onValueChange={([v]) => setCfgVal("stopLossPct", v)}
                  className="h-1"
                />
              </div>
              {/* 置信度阈值 */}
              <div className="col-span-2">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Brain className="w-2.5 h-2.5 text-cyber-amber" />最低信号置信度</span>
                  <span className="font-mono font-bold text-cyber-amber">{cfg.minConfidence}%</span>
                </div>
                <Slider
                  min={50} max={95} step={5}
                  value={[cfg.minConfidence]}
                  onValueChange={([v]) => setCfgVal("minConfidence", v)}
                  className="h-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 主 Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border w-full flex-wrap h-auto gap-0.5 p-1">
            <TabsTrigger value="signals" className="text-[9px] data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue flex-1">
              <Zap className="w-3 h-3 mr-1" />信号({signals.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="text-[9px] data-[state=active]:bg-cyber-green/15 data-[state=active]:text-cyber-green flex-1">
              <Activity className="w-3 h-3 mr-1" />持仓({openPos.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-[9px] data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue flex-1">
              <BarChart3 className="w-3 h-3 mr-1" />历史({closedPos.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-[9px] data-[state=active]:bg-cyber-amber/15 data-[state=active]:text-cyber-amber flex-1">
              <BookOpen className="w-3 h-3 mr-1" />日志
            </TabsTrigger>
            <TabsTrigger value="learn" className="text-[9px] data-[state=active]:bg-cyber-magenta/15 data-[state=active]:text-cyber-magenta flex-1">
              <Brain className="w-3 h-3 mr-1" />学习
            </TabsTrigger>
          </TabsList>

          {/* 信号快照 */}
          <TabsContent value="signals" className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-muted-foreground">实时多因子信号 · 每15秒更新</span>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-1" onClick={() => signalsQ.refetch()}>
                <RefreshCw className="w-2.5 h-2.5" />刷新
              </Button>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="space-y-2 pr-2">
                <AnimatePresence>
                  {signals.length === 0 ? (
                    <div className="text-center py-8 text-[10px] text-muted-foreground">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      暂无有效信号（等待行情数据...）
                    </div>
                  ) : (
                    signals.map((s: any) => <SignalCard key={s.symbol + s.timestamp} signal={s} />)
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 当前持仓 */}
          <TabsContent value="open" className="mt-2">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2 pr-2">
                {openPos.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground">
                    <Layers className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    暂无持仓
                  </div>
                ) : (
                  openPos.map((p: any) => (
                    <PositionRow key={p.id} pos={p} onClose={(id) => manualClose.mutate({ positionId: id })} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 已平仓 */}
          <TabsContent value="closed" className="mt-2">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2 pr-2">
                {closedPos.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    暂无历史记录
                  </div>
                ) : (
                  closedPos.map((p: any) => (
                    <PositionRow key={p.id} pos={p} onClose={() => {}} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 操作日志 */}
          <TabsContent value="logs" className="mt-2">
            <ScrollArea className="h-[320px]">
              <div className="pr-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    暂无日志
                  </div>
                ) : (
                  logs.map((l: any) => <LogRow key={l.id} log={l} />)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 自我学习 */}
          <TabsContent value="learn" className="mt-2">
            {learn ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "总交易次数", value: learn.totalTrades, color: "text-foreground" },
                    { label: "胜率", value: `${learn.winRate.toFixed(1)}%`, color: learn.winRate >= 50 ? "text-cyber-green" : "text-cyber-magenta" },
                    { label: "平均盈利", value: `+${learn.avgWinPct.toFixed(2)}%`, color: "text-cyber-green" },
                    { label: "平均亏损", value: `-${learn.avgLossPct.toFixed(2)}%`, color: "text-cyber-magenta" },
                    { label: "盈亏比", value: learn.profitFactor.toFixed(2), color: learn.profitFactor >= 1.5 ? "text-cyber-green" : learn.profitFactor >= 1 ? "text-cyber-amber" : "text-cyber-magenta" },
                    { label: "自适应阈值", value: `${learn.adaptedMinConfidence.toFixed(0)}%`, color: "text-cyber-amber" },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                      <div className="text-[8px] text-muted-foreground">{item.label}</div>
                      <div className={`text-[14px] font-bold font-mono mt-0.5 ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-blue/5 border border-cyber-blue/20 text-[9px] text-muted-foreground">
                  <Brain className="w-3 h-3 inline mr-1 text-cyber-blue" />
                  自我学习引擎根据历史胜率动态调整信号置信度阈值。
                  胜率 &gt; 65% 时降低门槛（捕获更多机会），胜率 &lt; 40% 时提高门槛（减少误判）。
                  最近学习：{relTime(learn.lastLearnedAt)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[10px] text-muted-foreground">
                <Brain className="w-6 h-6 mx-auto mb-2 opacity-30" />
                学习数据不足，至少需要完成 5 笔交易
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
