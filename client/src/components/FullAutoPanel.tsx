/**
 * FullAutoPanel - 全自动交易体系控制面板
 * 流程：数据采集 → 因子计算 → 策略筛选 → 信号生成 → AI置信度评估 → 风控校验 → 订单执行 → 持仓监控 → 自我学习
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Brain, Zap, TrendingUp, TrendingDown, Shield, Activity,
  RefreshCw, Play, Square, BarChart2, Layers, Target,
  AlertTriangle, CheckCircle, Clock, ChevronRight, Cpu,
  Database, GitBranch, Sparkles, X
} from "lucide-react";
import { toast } from "sonner";

// ── 类型定义 ──────────────────────────────────────────────────────
interface EngineStatus {
  enabled: boolean;
  phase: string;
  marketRegime: string;
  activeStrategies: string[];
  factorCount: number;
  openPositions: number;
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  lastCycleMs: number;
  cycleCount: number;
  evolutionGeneration: number;
  strategyWeightUpdateCount: number;
  lastUpdateAt: number;
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPct: number;
  strategy: string;
  aiScore: number;
  openedAt: number;
  takeProfitPrice: number;
  stopLossPrice: number;
}

interface ClosedPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  strategy: string;
  closeReason: string;
  openedAt: number;
  closedAt: number;
}

interface LogEntry {
  time: number;
  level: 'info' | 'warn' | 'error' | 'success';
  phase: string;
  message: string;
}

interface StrategyWeight {
  name: string;
  weight: number;
  wins: number;
  losses: number;
  totalPnl: number;
  lastUsed: number;
}

interface FactorSnapshot {
  symbol: string;
  regime: string;
  factors: Record<string, number>;
  compositeScore: number;
  direction: 'long' | 'short' | 'neutral';
  aiConfidence: number;
  timestamp: number;
}

// ── 工具函数 ──────────────────────────────────────────────────────
const fmtPnl = (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
const phaseLabels: Record<string, string> = {
  idle: '空闲',
  collecting: '数据采集',
  factors: '因子计算',
  regime: '市场识别',
  strategy: '策略筛选',
  signal: '信号生成',
  ai_score: 'AI评分',
  risk: '风控校验',
  executing: '执行下单',
  monitoring: '持仓监控',
  learning: '自我学习',
};
const regimeLabels: Record<string, { label: string; color: string }> = {
  trending_up: { label: '上升趋势', color: 'text-cyber-green' },
  trending_down: { label: '下降趋势', color: 'text-red-400' },
  ranging: { label: '震荡盘整', color: 'text-yellow-400' },
  volatile: { label: '高波动', color: 'text-orange-400' },
  unknown: { label: '识别中...', color: 'text-gray-400' },
};

// ── 主组件 ────────────────────────────────────────────────────────
export default function FullAutoPanel() {
  const [tab, setTab] = useState<'overview' | 'positions' | 'strategies' | 'factors' | 'logs' | 'config'>('overview');
  const [confirmReset, setConfirmReset] = useState(false);

  // tRPC 查询
  const { data: status, refetch: refetchStatus } = trpc.fullAuto.getStatus.useQuery(undefined, { refetchInterval: 2000 });
  const { data: config, refetch: refetchConfig } = trpc.fullAuto.getConfig.useQuery();
  const { data: positions } = trpc.fullAuto.getPositions.useQuery(undefined, { refetchInterval: 2000 });
  const { data: closedPositions } = trpc.fullAuto.getClosedPositions.useQuery({ limit: 50 }, { refetchInterval: 5000 });
  const { data: logs } = trpc.fullAuto.getLogs.useQuery({ limit: 100 }, { refetchInterval: 3000 });
  const { data: strategyWeights } = trpc.fullAuto.getStrategyWeights.useQuery(undefined, { refetchInterval: 10000 });
  const { data: factorSnapshots } = trpc.fullAuto.getFactorSnapshots.useQuery(undefined, { refetchInterval: 5000 });

  // tRPC 变更
  const updateConfig = trpc.fullAuto.updateConfig.useMutation({
    onSuccess: () => { refetchConfig(); toast.success('配置已更新'); },
    onError: (e) => toast.error(`更新失败: ${e.message}`),
  });
  const manualClose = trpc.fullAuto.manualClose.useMutation({
    onSuccess: () => toast.success('已手动平仓'),
    onError: (e) => toast.error(`平仓失败: ${e.message}`),
  });
  const resetEngine = trpc.fullAuto.reset.useMutation({
    onSuccess: () => { setConfirmReset(false); refetchStatus(); refetchConfig(); toast.success('引擎已重置'); },
  });

  const s = status as EngineStatus | undefined;
  const cfg = config as any;
  const posArr = (positions as Position[]) ?? [];
  const closedArr = (closedPositions as ClosedPosition[]) ?? [];
  const logsArr = (logs as LogEntry[]) ?? [];
  const weightsArr = (strategyWeights as StrategyWeight[]) ?? [];
  const factorsArr = (factorSnapshots as FactorSnapshot[]) ?? [];

  const regime = s ? (regimeLabels[s.marketRegime] ?? regimeLabels.unknown) : regimeLabels.unknown;

  // ── 渲染 ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── 顶部控制栏 ── */}
      <div className="flex items-center justify-between bg-black/40 border border-cyber-blue/20 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-cyber-blue" />
          <span className="text-lg font-bold text-cyber-blue">全自动交易引擎</span>
          <Badge className={s?.enabled ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' : 'bg-gray-700/50 text-gray-400 border-gray-600/30'}>
            {s?.enabled ? '运行中' : '已停止'}
          </Badge>
          {s?.enabled && (
            <Badge className="bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20 text-xs">
              {phaseLabels[s.phase] ?? s.phase}
            </Badge>
          )}
          <Badge className={`${regime.color} bg-black/30 border-gray-700/30 text-xs`}>
            {regime.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">全自动交易</span>
          <Switch
            checked={s?.enabled ?? false}
            onCheckedChange={(v) => updateConfig.mutate({ enabled: v })}
            className="data-[state=checked]:bg-cyber-blue"
          />
          <Button
            variant="ghost" size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
            onClick={() => setConfirmReset(true)}
          >
            <RefreshCw className="w-3 h-3 mr-1" />重置
          </Button>
        </div>
      </div>

      {/* ── 确认重置弹窗 ── */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <span className="text-red-300 text-sm">确认重置全自动引擎？所有持仓、日志和学习数据将被清空。</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)} className="text-gray-400">取消</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => resetEngine.mutate()}>确认重置</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 核心指标卡片 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: '当前持仓', value: s?.openPositions ?? 0, icon: <Layers className="w-4 h-4" />, color: 'text-cyber-blue' },
          { label: '总交易数', value: s?.totalTrades ?? 0, icon: <Activity className="w-4 h-4" />, color: 'text-gray-300' },
          { label: '总盈亏', value: fmtPnl(s?.totalPnl ?? 0), icon: <TrendingUp className="w-4 h-4" />, color: (s?.totalPnl ?? 0) >= 0 ? 'text-cyber-green' : 'text-red-400' },
          { label: '胜率', value: `${((s?.winRate ?? 0) * 100).toFixed(1)}%`, icon: <Target className="w-4 h-4" />, color: 'text-yellow-400' },
          { label: '活跃策略', value: s?.activeStrategies?.length ?? 0, icon: <GitBranch className="w-4 h-4" />, color: 'text-purple-400' },
          { label: '进化代数', value: `G${s?.evolutionGeneration ?? 0}`, icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-400' },
        ].map((item, i) => (
          <Card key={i} className="bg-black/40 border-gray-700/30">
            <CardContent className="p-3">
              <div className={`flex items-center gap-1 text-xs text-gray-400 mb-1`}>
                {item.icon}{item.label}
              </div>
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 流程进度条 ── */}
      {s?.enabled && (
        <div className="bg-black/40 border border-cyber-blue/10 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-3">执行流程</div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {['collecting', 'factors', 'regime', 'strategy', 'signal', 'ai_score', 'risk', 'executing', 'monitoring', 'learning'].map((phase, i) => {
              const phases = ['collecting', 'factors', 'regime', 'strategy', 'signal', 'ai_score', 'risk', 'executing', 'monitoring', 'learning'];
              const currentIdx = phases.indexOf(s.phase);
              const thisIdx = i;
              const isActive = s.phase === phase;
              const isDone = thisIdx < currentIdx;
              return (
                <div key={phase} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`px-2 py-1 rounded text-xs font-medium transition-all ${isActive ? 'bg-cyber-blue text-black' : isDone ? 'bg-cyber-green/20 text-cyber-green' : 'bg-gray-800 text-gray-500'}`}>
                    {phaseLabels[phase]}
                  </div>
                  {i < 9 && <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 导航 ── */}
      <div className="flex gap-2 border-b border-gray-700/30 pb-0">
        {[
          { key: 'overview', label: '总览', icon: <BarChart2 className="w-3 h-3" /> },
          { key: 'positions', label: `持仓(${posArr.length})`, icon: <Layers className="w-3 h-3" /> },
          { key: 'strategies', label: '策略权重', icon: <GitBranch className="w-3 h-3" /> },
          { key: 'factors', label: '因子快照', icon: <Database className="w-3 h-3" /> },
          { key: 'logs', label: '操作日志', icon: <Activity className="w-3 h-3" /> },
          { key: 'config', label: '参数配置', icon: <Cpu className="w-3 h-3" /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1 px-3 py-2 text-xs rounded-t transition-all ${tab === t.key ? 'bg-cyber-blue/10 text-cyber-blue border-b-2 border-cyber-blue' : 'text-gray-400 hover:text-gray-200'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── 总览 Tab ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 市场状态 + 活跃策略 */}
          <Card className="bg-black/40 border-gray-700/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300 flex items-center gap-2"><Brain className="w-4 h-4 text-cyber-blue" />AI市场识别 & 策略组合</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">当前市场状态</span>
                <span className={`text-sm font-bold ${regime.color}`}>{regime.label}</span>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2">已激活策略（{s?.activeStrategies?.length ?? 0} 个）</div>
                <div className="flex flex-wrap gap-1">
                  {(s?.activeStrategies ?? []).map((st, i) => (
                    <Badge key={i} className="bg-purple-900/30 text-purple-300 border-purple-700/30 text-xs">{st}</Badge>
                  ))}
                  {(s?.activeStrategies?.length ?? 0) === 0 && <span className="text-xs text-gray-500">引擎未启动</span>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">因子数量</span>
                <span className="text-cyber-blue">{s?.factorCount ?? 0} 个</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">上次循环耗时</span>
                <span className="text-gray-300">{s?.lastCycleMs ?? 0} ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">总循环次数</span>
                <span className="text-gray-300">{s?.cycleCount ?? 0} 次</span>
              </div>
            </CardContent>
          </Card>

          {/* 自我学习统计 */}
          <Card className="bg-black/40 border-gray-700/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300 flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" />自我进化统计</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">进化代数</span>
                <span className="text-cyan-400 font-bold">第 {s?.evolutionGeneration ?? 0} 代</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">策略权重更新次数</span>
                <span className="text-gray-300">{s?.strategyWeightUpdateCount ?? 0} 次</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">综合胜率</span>
                <span className={`font-bold ${(s?.winRate ?? 0) >= 0.5 ? 'text-cyber-green' : 'text-red-400'}`}>{((s?.winRate ?? 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">累计盈亏</span>
                <span className={`font-bold ${(s?.totalPnl ?? 0) >= 0 ? 'text-cyber-green' : 'text-red-400'}`}>{fmtPnl(s?.totalPnl ?? 0)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 border-t border-gray-700/30 pt-2">
                每完成10笔交易自动复盘，动态调整策略权重和因子参数
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 持仓 Tab ── */}
      {tab === 'positions' && (
        <div className="space-y-3">
          {/* 当前持仓 */}
          <div className="text-xs text-gray-400 font-medium">当前持仓（{posArr.length} 个）</div>
          {posArr.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">暂无持仓</div>
          ) : (
            posArr.map(pos => (
              <Card key={pos.id} className="bg-black/40 border-gray-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{pos.symbol}</span>
                      <Badge className={pos.side === 'long' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' : 'bg-red-900/20 text-red-400 border-red-700/30'}>
                        {pos.side === 'long' ? '做多' : '做空'}
                      </Badge>
                      <Badge className="bg-purple-900/20 text-purple-300 border-purple-700/20 text-xs">{pos.strategy}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${pos.pnl >= 0 ? 'text-cyber-green' : 'text-red-400'}`}>{fmtPnl(pos.pnl)} ({fmtPct(pos.pnlPct)})</span>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-6 px-2 text-xs"
                        onClick={() => manualClose.mutate({ positionId: pos.id })}>平仓</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                    <div>开仓价 <span className="text-white">${pos.entryPrice.toFixed(4)}</span></div>
                    <div>现价 <span className="text-white">${pos.currentPrice.toFixed(4)}</span></div>
                    <div>止盈 <span className="text-cyber-green">${pos.takeProfitPrice.toFixed(4)}</span></div>
                    <div>止损 <span className="text-red-400">${pos.stopLossPrice.toFixed(4)}</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>AI置信度 <span className="text-cyber-blue">{(pos.aiScore * 100).toFixed(0)}%</span></span>
                    <span>开仓时间 {fmtTime(pos.openedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* 已平仓记录 */}
          {closedArr.length > 0 && (
            <>
              <div className="text-xs text-gray-400 font-medium mt-4">已平仓记录（最近 {closedArr.length} 笔）</div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {closedArr.map(pos => (
                    <div key={pos.id} className="flex items-center justify-between bg-black/20 border border-gray-700/20 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{pos.symbol}</span>
                        <Badge className={pos.side === 'long' ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/20 text-xs' : 'bg-red-900/10 text-red-400 border-red-700/20 text-xs'}>
                          {pos.side === 'long' ? '多' : '空'}
                        </Badge>
                        <span className="text-gray-500">{pos.strategy}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{pos.closeReason}</span>
                        <span className={pos.pnl >= 0 ? 'text-cyber-green font-bold' : 'text-red-400 font-bold'}>{fmtPnl(pos.pnl)}</span>
                        <span className="text-gray-500">{fmtTime(pos.closedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      )}

      {/* ── 策略权重 Tab ── */}
      {tab === 'strategies' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-3">策略权重由自我学习引擎动态调整，胜率高的策略权重自动提升</div>
          {weightsArr.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">暂无数据，启动引擎后自动生成</div>
          ) : (
            weightsArr.sort((a, b) => b.weight - a.weight).map((sw, i) => (
              <div key={i} className="bg-black/40 border border-gray-700/30 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{sw.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{sw.wins}胜 / {sw.losses}负</span>
                    <span className={sw.totalPnl >= 0 ? 'text-cyber-green' : 'text-red-400'}>{fmtPnl(sw.totalPnl)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="bg-cyber-blue h-2 rounded-full transition-all" style={{ width: `${(sw.weight * 100).toFixed(0)}%` }} />
                  </div>
                  <span className="text-cyber-blue text-xs w-10 text-right">{(sw.weight * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 因子快照 Tab ── */}
      {tab === 'factors' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 mb-2">每5秒更新一次，显示各币种的多因子计算结果</div>
          {factorsArr.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">暂无数据，启动引擎后自动生成</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {factorsArr.map((fs, i) => (
                <Card key={i} className="bg-black/40 border-gray-700/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{fs.symbol}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={fs.direction === 'long' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30 text-xs' : fs.direction === 'short' ? 'bg-red-900/20 text-red-400 border-red-700/30 text-xs' : 'bg-gray-700/30 text-gray-400 border-gray-600/30 text-xs'}>
                          {fs.direction === 'long' ? '做多' : fs.direction === 'short' ? '做空' : '中性'}
                        </Badge>
                        <span className="text-cyber-blue text-xs">AI {(fs.aiConfidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {Object.entries(fs.factors).slice(0, 9).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-500 truncate">{k}</span>
                          <span className={typeof v === 'number' && v > 0 ? 'text-cyber-green' : 'text-red-400'}>{typeof v === 'number' ? v.toFixed(2) : v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500">综合评分</span>
                      <span className={`font-bold ${fs.compositeScore > 0 ? 'text-cyber-green' : 'text-red-400'}`}>{fs.compositeScore.toFixed(3)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 日志 Tab ── */}
      {tab === 'logs' && (
        <ScrollArea className="h-96">
          <div className="space-y-1">
            {logsArr.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">暂无日志</div>
            ) : (
              logsArr.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 px-3 py-1.5 rounded text-xs ${log.level === 'error' ? 'bg-red-900/10' : log.level === 'warn' ? 'bg-yellow-900/10' : log.level === 'success' ? 'bg-green-900/10' : 'bg-black/20'}`}>
                  <span className="text-gray-500 flex-shrink-0">{fmtTime(log.time)}</span>
                  <Badge className={`text-xs flex-shrink-0 ${log.level === 'error' ? 'bg-red-900/30 text-red-400 border-red-700/30' : log.level === 'warn' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30' : log.level === 'success' ? 'bg-green-900/30 text-green-400 border-green-700/30' : 'bg-gray-800 text-gray-400 border-gray-700/30'}`}>
                    {phaseLabels[log.phase] ?? log.phase}
                  </Badge>
                  <span className={log.level === 'error' ? 'text-red-300' : log.level === 'warn' ? 'text-yellow-300' : log.level === 'success' ? 'text-green-300' : 'text-gray-300'}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* ── 参数配置 Tab ── */}
      {tab === 'config' && cfg && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/40 border-gray-700/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">资金与仓位参数</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: '单笔资金比例', key: 'capitalPctPerTrade', min: 1, max: 30, step: 1, fmt: (v: number) => `${v}%` },
                { label: '最大持仓数', key: 'maxPositions', min: 1, max: 20, step: 1, fmt: (v: number) => `${v} 个` },
                { label: '止盈比例', key: 'takeProfitPct', min: 0.5, max: 20, step: 0.5, fmt: (v: number) => `${v}%` },
                { label: '止损比例', key: 'stopLossPct', min: 0.5, max: 10, step: 0.5, fmt: (v: number) => `${v}%` },
              ].map(item => (
                <div key={item.key}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-cyber-blue">{item.fmt(cfg[item.key] ?? 0)}</span>
                  </div>
                  <Slider min={item.min} max={item.max} step={item.step} value={[cfg[item.key] ?? item.min]}
                    onValueChange={([v]) => updateConfig.mutate({ [item.key]: v })}
                    className="[&_[role=slider]]:bg-cyber-blue" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-gray-700/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-300">AI与策略参数</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">AI置信度阈值</span>
                  <span className="text-cyber-blue">{((cfg.minAiConfidence ?? 0) * 100).toFixed(0)}%</span>
                </div>
                <Slider min={0.5} max={0.95} step={0.05} value={[cfg.minAiConfidence ?? 0.7]}
                  onValueChange={([v]) => updateConfig.mutate({ minAiConfidence: v })}
                  className="[&_[role=slider]]:bg-cyber-blue" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">冷却期</span>
                  <span className="text-cyber-blue">{((cfg.cooldownMs ?? 0) / 1000).toFixed(0)} 秒</span>
                </div>
                <Slider min={10} max={300} step={10} value={[(cfg.cooldownMs ?? 60000) / 1000]}
                  onValueChange={([v]) => updateConfig.mutate({ cooldownMs: v * 1000 })}
                  className="[&_[role=slider]]:bg-cyber-blue" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-300">市场自适应模式</div>
                  <div className="text-xs text-gray-500">根据市场状态自动切换策略组合</div>
                </div>
                <Switch checked={cfg.regimeAdaptive ?? true}
                  onCheckedChange={(v) => updateConfig.mutate({ regimeAdaptive: v })}
                  className="data-[state=checked]:bg-cyber-blue" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-300">移动止损</div>
                  <div className="text-xs text-gray-500">盈利后自动上移止损线</div>
                </div>
                <Switch checked={cfg.trailingStop ?? false}
                  onCheckedChange={(v) => updateConfig.mutate({ trailingStop: v })}
                  className="data-[state=checked]:bg-cyber-blue" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
