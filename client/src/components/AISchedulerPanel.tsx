/**
 * AISchedulerPanel — AI模型自动调度面板
 * 实时排行榜 + 调度日志 + 权重分配 + 融合信号 + 配置
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Minus, Zap, Shield, Clock, ArrowUpRight, ArrowDownRight, RotateCcw, Settings2, Activity, Target, AlertTriangle, ChevronUp, ChevronDown, Gauge, Brain, Layers, Timer, Trophy, Cpu, Radio } from "lucide-react";
import { useAIScheduler } from "@/hooks/useAIScheduler";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "主力": "bg-cyber-green/15 text-cyber-green border-cyber-green/30",
  "辅助": "bg-cyber-blue/15 text-cyber-blue border-cyber-blue/30",
  "备用": "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
  "降级": "bg-cyber-magenta/15 text-cyber-magenta border-cyber-magenta/30",
  "观察": "bg-cyber-amber/15 text-cyber-amber border-cyber-amber/30",
};

const EVENT_ICONS: Record<string, { icon: typeof Zap; color: string }> = {
  promote: { icon: ArrowUpRight, color: "text-cyber-green" },
  demote: { icon: ArrowDownRight, color: "text-cyber-magenta" },
  rebalance: { icon: RotateCcw, color: "text-cyber-blue" },
  alert: { icon: AlertTriangle, color: "text-cyber-amber" },
  cooldown: { icon: Clock, color: "text-muted-foreground" },
  emergency: { icon: Zap, color: "text-cyber-magenta" },
};

const PIE_COLORS = ["#00ff88", "#00aaff", "#ffaa00", "#ff4488", "#aa66ff", "#44ddff", "#ff8844", "#88ff44", "#ff44aa"];

export default function AISchedulerPanel() {
  const {
    models, events, config, primaryModel, totalSwitches,
    schedulerUptime, ensembleSignal, setMode, toggleEnabled, forceSwitch,
  } = useAIScheduler();

  const [showConfig, setShowConfig] = useState(false);
  const [_selectedModel, _setSelectedModel] = useState<string | null>(null);

  // Weight distribution pie data
  const pieData = useMemo(() =>
    models.map(m => ({ name: m.name, value: +(m.weight * 100).toFixed(1) })),
  [models]);

  // Score comparison bar data
  const barData = useMemo(() =>
    models.slice(0, 9).map(m => ({
      name: m.name.length > 8 ? m.name.slice(0, 8) : m.name,
      fullName: m.name,
      score: +m.score.toFixed(1),
      accuracy: +m.accuracy.toFixed(1),
      winRate: +m.winRate.toFixed(1),
    })),
  [models]);

  // Radar data for top 5
  const radarData = useMemo(() => {
    const top5 = models.slice(0, 5);
    return [
      { metric: "准确率", ...Object.fromEntries(top5.map(m => [m.name, +m.accuracy.toFixed(1)])) },
      { metric: "胜率", ...Object.fromEntries(top5.map(m => [m.name, +m.winRate.toFixed(1)])) },
      { metric: "夏普比率", ...Object.fromEntries(top5.map(m => [m.name, +(m.sharpe * 30).toFixed(1)])) },
      { metric: "速度", ...Object.fromEntries(top5.map(m => [m.name, +(100 - m.latency * 0.5).toFixed(1)])) },
      { metric: "盈利", ...Object.fromEntries(top5.map(m => [m.name, +Math.min(100, m.pnl / 300).toFixed(1)])) },
    ];
  }, [models]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-cyber-green/20 to-cyber-blue/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold tracking-wider">AI 智能调度引擎</h2>
            <p className="text-[10px] text-muted-foreground">
              基于胜率+准确率综合评分自动切换主力模型 · {models.length}个模型 · 运行{formatUptime(schedulerUptime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[9px] py-0.5 ${config.enabled ? "border-cyber-green/50 text-cyber-green" : "border-cyber-magenta/50 text-cyber-magenta"}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${config.enabled ? "bg-cyber-green animate-pulse" : "bg-cyber-magenta"}`} />
            {config.enabled ? "自动调度中" : "已暂停"}
          </Badge>
          <Badge variant="outline" className="text-[9px] py-0.5">
            模式: {config.mode === "aggressive" ? "激进" : config.mode === "balanced" ? "均衡" : "保守"}
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={toggleEnabled}>
            {config.enabled ? "暂停" : "启动"}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setShowConfig(!showConfig)}>
            <Settings2 className="w-3 h-3 mr-1" />配置
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: "当前主力", value: primaryModel, icon: Crown, color: "text-cyber-green" },
          { label: "综合评分", value: models[0]?.score.toFixed(1) || "—", icon: Gauge, color: "text-cyber-blue" },
          { label: "累计切换", value: `${totalSwitches}次`, icon: RotateCcw, color: "text-cyber-amber" },
          { label: "融合信号", value: ensembleSignal.direction, icon: Radio, color: ensembleSignal.direction === "看涨" ? "text-cyber-green" : ensembleSignal.direction === "看跌" ? "text-cyber-magenta" : "text-cyber-amber" },
          { label: "信号置信度", value: `${ensembleSignal.confidence.toFixed(0)}%`, icon: Target, color: "text-cyber-blue" },
          { label: "评估间隔", value: `${config.evalInterval}s`, icon: Timer, color: "text-muted-foreground" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card border-border">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`font-mono font-bold text-sm ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Config Panel (collapsible) */}
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="bg-card border-border border-l-2 border-l-cyber-amber">
              <CardContent className="pt-4 pb-3">
                <h3 className="text-xs font-heading font-bold mb-3 flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-cyber-amber" />
                  调度策略配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {(["aggressive", "balanced", "conservative"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setMode(mode)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        config.mode === mode ? "border-cyber-blue bg-cyber-blue/10" : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {mode === "aggressive" ? <Zap className="w-3.5 h-3.5 text-cyber-magenta" /> :
                         mode === "balanced" ? <Shield className="w-3.5 h-3.5 text-cyber-blue" /> :
                         <Clock className="w-3.5 h-3.5 text-cyber-green" />}
                        <span className="text-xs font-bold">{mode === "aggressive" ? "激进模式" : mode === "balanced" ? "均衡模式" : "保守模式"}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        {mode === "aggressive" ? "30s评估，快速切换，最大权重调整8%" :
                         mode === "balanced" ? "60s评估，稳健切换，最大权重调整5%" :
                         "120s评估，谨慎切换，最大权重调整3%"}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                  <div>
                    <label className="text-muted-foreground">准确率权重</label>
                    <p className="font-mono font-bold">{(config.accuracyWeight * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">胜率权重</label>
                    <p className="font-mono font-bold">{(config.winRateWeight * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">夏普比率权重</label>
                    <p className="font-mono font-bold">{(config.sharpeWeight * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">延迟权重</label>
                    <p className="font-mono font-bold">{(config.latencyWeight * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">紧急降级阈值</label>
                    <p className="font-mono font-bold text-cyber-magenta">{config.emergencyThreshold}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">冷却期</label>
                    <p className="font-mono font-bold">{config.cooldownPeriod}s</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">最小评估交易数</label>
                    <p className="font-mono font-bold">{config.minTradesForEval}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">自动再平衡</label>
                    <Badge variant="outline" className={`text-[8px] py-0 ${config.autoRebalance ? "text-cyber-green border-cyber-green/30" : ""}`}>
                      {config.autoRebalance ? "开启" : "关闭"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Leaderboard + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyber-amber" />
                实时模型排行榜 · 综合评分排名
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-1 text-muted-foreground">#</th>
                    <th className="text-left py-2 text-muted-foreground">模型</th>
                    <th className="text-center py-2 text-muted-foreground">状态</th>
                    <th className="text-center py-2 text-muted-foreground">综合评分</th>
                    <th className="text-center py-2 text-muted-foreground">准确率</th>
                    <th className="text-center py-2 text-muted-foreground">胜率</th>
                    <th className="text-center py-2 text-muted-foreground">夏普</th>
                    <th className="text-center py-2 text-muted-foreground">延迟</th>
                    <th className="text-center py-2 text-muted-foreground">权重</th>
                    <th className="text-center py-2 text-muted-foreground">趋势</th>
                    <th className="text-center py-2 text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <motion.tr
                      key={m.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-border/30 hover:bg-secondary/30 transition-colors ${
                        m.name === primaryModel ? "bg-cyber-green/5" : ""
                      }`}
                    >
                      <td className="py-2 px-1">
                        <div className="flex items-center gap-1">
                          {i === 0 ? <Crown className="w-3 h-3 text-cyber-amber" /> :
                           <span className="font-mono text-muted-foreground">{m.rank}</span>}
                          {m.trend === "up" ? <ChevronUp className="w-2.5 h-2.5 text-cyber-green" /> :
                           m.trend === "down" ? <ChevronDown className="w-2.5 h-2.5 text-cyber-magenta" /> :
                           <Minus className="w-2.5 h-2.5 text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="py-2">
                        <div>
                          <span className={`font-bold ${m.name === primaryModel ? "text-cyber-green" : ""}`}>{m.name}</span>
                          <p className="text-[8px] text-muted-foreground">{m.type}</p>
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge variant="outline" className={`text-[8px] py-0 ${STATUS_COLORS[m.status] || ""}`}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="text-center font-mono font-bold text-cyber-blue">{m.score.toFixed(1)}</td>
                      <td className="text-center font-mono">{m.accuracy.toFixed(1)}%</td>
                      <td className="text-center font-mono">{m.winRate.toFixed(1)}%</td>
                      <td className="text-center font-mono">{m.sharpe.toFixed(2)}</td>
                      <td className="text-center font-mono text-muted-foreground">{m.latency}ms</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-cyber-blue" style={{ width: `${m.weight * 100}%` }} />
                          </div>
                          <span className="font-mono text-[9px]">{(m.weight * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`font-mono text-[9px] ${m.streak > 0 ? "text-cyber-green" : m.streak < 0 ? "text-cyber-magenta" : "text-muted-foreground"}`}>
                          {m.streak > 0 ? `W${m.streak}` : m.streak < 0 ? `L${Math.abs(m.streak)}` : "—"}
                        </span>
                      </td>
                      <td className="text-center">
                        {m.name !== primaryModel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 text-[8px] px-1.5"
                            onClick={() => forceSwitch(m.name)}
                            disabled={m.cooldown}
                          >
                            {m.cooldown ? "冷却中" : "切换"}
                          </Button>
                        )}
                        {m.name === primaryModel && (
                          <Badge className="text-[8px] py-0 bg-cyber-green/20 text-cyber-green border-0">当前主力</Badge>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Weight Pie + Ensemble Signal */}
        <div className="space-y-4">
          {/* Weight Distribution */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyber-blue" />
                实时权重分配
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44 min-h-[176px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                      formatter={(value: number) => [`${value}%`, "权重"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {pieData.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-[8px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ensemble Signal */}
          <Card className={`bg-card border-border border-l-2 ${
            ensembleSignal.direction === "看涨" ? "border-l-cyber-green" :
            ensembleSignal.direction === "看跌" ? "border-l-cyber-magenta" : "border-l-cyber-amber"
          }`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Radio className={`w-4 h-4 ${
                  ensembleSignal.direction === "看涨" ? "text-cyber-green" :
                  ensembleSignal.direction === "看跌" ? "text-cyber-magenta" : "text-cyber-amber"
                }`} />
                <h3 className="text-xs font-heading font-bold">模型融合信号</h3>
              </div>
              <div className="text-center mb-3">
                <p className={`text-2xl font-heading font-bold ${
                  ensembleSignal.direction === "看涨" ? "text-cyber-green" :
                  ensembleSignal.direction === "看跌" ? "text-cyber-magenta" : "text-cyber-amber"
                }`}>
                  {ensembleSignal.direction}
                </p>
                <p className="text-[10px] text-muted-foreground">置信度 {ensembleSignal.confidence.toFixed(0)}%</p>
              </div>
              <div className="space-y-1.5">
                {ensembleSignal.contributors.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-[9px]">
                    <span className="text-muted-foreground">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={
                        c.signal === "看涨" ? "text-cyber-green" :
                        c.signal === "看跌" ? "text-cyber-magenta" : "text-cyber-amber"
                      }>{c.signal}</span>
                      <span className="font-mono text-muted-foreground">{(c.weight * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score Bar Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyber-green" />
              综合评分对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#888" }} interval={0} angle={-20} textAnchor="end" height={35} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: "#888" }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="score" fill="#00ff88" radius={[3, 3, 0, 0]} name="综合评分" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-amber" />
              Top 5 模型能力雷达
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 min-h-[192px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#888" }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  {models.slice(0, 5).map((m, i) => (
                    <Radar
                      key={m.name}
                      name={m.name}
                      dataKey={m.name}
                      stroke={PIE_COLORS[i]}
                      fill={PIE_COLORS[i]}
                      fillOpacity={0.1}
                    />
                  ))}
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduling Event Log */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyber-blue" />
            调度事件日志 · 最近{events.length}条
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {events.slice(0, 15).map((evt, i) => {
                const evtMeta = EVENT_ICONS[evt.type] || EVENT_ICONS.alert;
                const Icon = evtMeta.icon;
                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-2 p-2 rounded border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                  >
                    <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${evtMeta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className={`text-[7px] py-0 ${
                          evt.type === "promote" ? "border-cyber-green/30 text-cyber-green" :
                          evt.type === "demote" || evt.type === "emergency" ? "border-cyber-magenta/30 text-cyber-magenta" :
                          evt.type === "rebalance" ? "border-cyber-blue/30 text-cyber-blue" :
                          "border-cyber-amber/30 text-cyber-amber"
                        }`}>
                          {evt.type === "promote" ? "提升" : evt.type === "demote" ? "降级" :
                           evt.type === "rebalance" ? "再平衡" : evt.type === "emergency" ? "紧急" :
                           evt.type === "alert" ? "告警" : "冷却"}
                        </Badge>
                        <span className="text-[8px] text-muted-foreground font-mono">{formatTime(evt.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-foreground/80 leading-relaxed">{evt.reason}</p>
                      {evt.metrics.score > 0 && (
                        <div className="flex gap-3 mt-1 text-[8px] text-muted-foreground">
                          <span>准确率: <span className="text-cyber-green font-mono">{evt.metrics.accuracy.toFixed(1)}%</span></span>
                          <span>胜率: <span className="text-cyber-blue font-mono">{evt.metrics.winRate.toFixed(1)}%</span></span>
                          <span>评分: <span className="text-cyber-amber font-mono">{evt.metrics.score.toFixed(1)}</span></span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
