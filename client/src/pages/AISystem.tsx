/**
 * AISystem - Enhanced AI intelligence system
 * Self-evolution timeline, 5-year historical learning, full coin prediction,
 * model management, NLP analysis, decision explanation
 */
import { motion } from "framer-motion";
import { Brain, Cpu, Zap, Activity, RefreshCw, Sparkles, Target, Database, GitBranch, Layers, Globe, Dna, FlaskConical, Trophy, Timer, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiModels as mockAIModels, allCoins as staticCoins, historicalDataStats, evolutionTimeline, generate5YearHistory, formatNumber } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { useDbAIModels } from "@/hooks/useDbData";
import type { AIModel } from "@/types";
import { toast } from "sonner";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTradingContext } from "@/contexts/TradingContext";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import AISchedulerPanel from "@/components/AISchedulerPanel";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, AreaChart, Area, BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

import { IMAGES } from "@/lib/images";
import AIDecisionExplainer from "@/components/AIDecisionExplainer";


// Mock accuracy history per model
const accuracyHistory: { day: string; gpt4o: number; claude: number; transformer: number; pattern: number; sentiment: number; lstm: number }[] = [];

// Self-evolution log entries
const evolutionLogs: { time: string; type: string; message: string; model: string; delta: string }[] = [];

// Model capability radar data
const modelCapabilities: Record<string, string | number>[] = [];

// Full coin AI prediction data
const fullCoinPredictions = staticCoins.filter(c => c.category !== "稳定币").map(coin => ({
  symbol: coin.symbol,
  name: coin.name,
  category: coin.category,
  currentPrice: coin.price,
  signal: coin.aiSignal,
  confidence: coin.aiConfidence,
  models: {
    gpt4o: coin.aiSignal.includes("看涨") ? "看涨" : coin.aiSignal.includes("看跌") ? "看跌" : "中性",
    claude: Math.random() > 0.5 ? "看涨" : Math.random() > 0.5 ? "中性" : "看跌",
    transformer: Math.random() > 0.4 ? "看涨" : Math.random() > 0.5 ? "中性" : "看跌",
    lstm: Math.random() > 0.45 ? "看涨" : Math.random() > 0.5 ? "中性" : "看跌",
  },
  targetPrice: coin.price * (1 + (Math.random() * 0.2 - 0.05)),
  risk: coin.riskLevel,
}));

export default function AISystem() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const { data: aiModels } = useDbAIModels();
  const fiveYearData = useMemo(() => generate5YearHistory(), []);
  const [predFilter, setPredFilter] = useState("全部");

  // ===== 连接真实交易数据 =====
  const trading = useTradingContext();
  const { aiModelPerformance, strategyPerformance, tradeRecords, paperAccount, aiEvolution, dataLearning } = trading;

  // 从真实交易数据计算AI模型统计
  const realModelStats = useMemo(() => {
    const stats: Record<string, { totalSignals: number; wins: number; losses: number; winRate: number; totalPnl: number; recentAccuracy: number }> = {};
    aiModelPerformance.forEach((perf, name) => {
      stats[name] = {
        totalSignals: perf.totalSignals,
        wins: perf.wins,
        losses: perf.losses,
        winRate: perf.winRate,
        totalPnl: perf.totalPnl,
        recentAccuracy: perf.recentAccuracy,
      };
    });
    return stats;
  }, [aiModelPerformance]);

  // 真实的整体准确率（基于实际交易）
  const realOverallAccuracy = useMemo(() => {
    if (tradeRecords.length === 0) return 0; // 无交易记录时显示0
    const wins = tradeRecords.filter(r => r.pnl > 0).length;
    return (wins / tradeRecords.length) * 100;
  }, [tradeRecords]);

  // 真实的进化代数
  const realEvolutionGen = aiEvolution.currentGeneration + aiEvolution.totalEvolutions;

  const filteredPredictions = predFilter === "全部"
    ? fullCoinPredictions
    : fullCoinPredictions.filter(p => p.category === predFilter);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-lg overflow-hidden h-44"
      >
        <img src={IMAGES.aiSystem} alt="AI System" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-cyber-amber/20 flex items-center justify-center glow-amber">
              <Brain className="w-6 h-6 text-cyber-amber" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-wider">AI自我进化系统</h1>
              <p className="text-sm text-muted-foreground">自我学习 · 持续进化 · 全币种预测 · 5年+历史数据训练 · {aiModels.length}个AI模型协同</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "在线模型", value: `${aiModels.filter(m => m.status === "在线").length}`, color: "green" },
          { label: "训练中", value: `${aiModels.filter(m => m.status === "训练中").length}`, color: "amber" },
          { label: "预测准确率", value: `${realOverallAccuracy.toFixed(1)}%`, color: "blue" },
          { label: "进化代数", value: `${realEvolutionGen.toLocaleString()}+`, color: "green" },
          { label: "AI推理延迟", value: `${sys.aiInferenceMs}ms`, color: sys.aiInferenceMs < 200 ? "blue" : "amber" },
          { label: "覆盖币种", value: `${allCoins.length}+`, color: "amber" },
          { label: "AI模型", value: sys.aiModel, color: "green" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="bg-card border-border">
              <CardContent className="pt-3 pb-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-heading font-bold mt-0.5 text-cyber-${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="evolution">自我进化</TabsTrigger>
          <TabsTrigger value="history">历史数据学习</TabsTrigger>
          <TabsTrigger value="prediction">全币种预测</TabsTrigger>
          <TabsTrigger value="models">模型管理</TabsTrigger>
          <TabsTrigger value="nlp">NLP分析</TabsTrigger>
          <TabsTrigger value="decision">决策解释</TabsTrigger>
          <TabsTrigger value="abtest"><FlaskConical className="w-3.5 h-3.5 mr-1" />A/B测试</TabsTrigger>
          <TabsTrigger value="scheduler"><Cpu className="w-3.5 h-3.5 mr-1" />智能调度</TabsTrigger>
        </TabsList>

        {/* ===== Self Evolution Tab ===== */}
        <TabsContent value="evolution">
          <div className="space-y-4">
            {/* Evolution Timeline Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Dna className="w-4 h-4 text-cyber-amber" />
                  AI进化时间线 · 暂无记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fiveYearData.filter((_, i) => i % 2 === 0)}>
                      <defs>
                        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="sharpeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis yAxisId="left" domain={[55, 100]} tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `${v}%`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 3]} tick={{ fontSize: 9, fill: "#666" }} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="#00d4ff" strokeWidth={2} fill="url(#accGrad)" name="准确率%" />
                      <Area yAxisId="right" type="monotone" dataKey="sharpe" stroke="#00ff88" strokeWidth={2} fill="url(#sharpeGrad)" name="Sharpe比率" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyber-blue rounded" />准确率</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyber-green rounded" />Sharpe比率</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Evolution Milestones */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyber-blue" />
                    进化里程碑
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {evolutionTimeline.map((milestone, i) => (
                      <motion.div
                        key={milestone.generation}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex gap-3 relative"
                      >
                        {i < evolutionTimeline.length - 1 && (
                          <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />
                        )}
                        <div className="w-6 h-6 rounded-full bg-cyber-blue/20 flex items-center justify-center shrink-0 z-10 border border-cyber-blue/30">
                          <span className="text-[8px] font-mono text-cyber-blue">{Math.round(milestone.generation / 100)}</span>
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{milestone.event}</p>
                            <span className="text-[9px] font-mono text-muted-foreground">{milestone.date}</span>
                          </div>
                          <div className="flex gap-3 mt-1 text-[10px]">
                            <span className="text-cyber-blue">准确率: {milestone.accuracy}%</span>
                            <span className="text-cyber-green">Sharpe: {milestone.sharpe}</span>
                            <span className="text-cyber-amber">币种: {milestone.coins}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Evolution Log */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyber-green animate-pulse" />
                    实时自我学习日志
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {evolutionLogs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-2.5 rounded border border-border/50 bg-secondary/20 hover:border-cyber-blue/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              log.type === "学习" ? "bg-cyber-blue/15 text-cyber-blue" :
                              log.type === "进化" ? "bg-cyber-green/15 text-cyber-green" :
                              log.type === "适应" ? "bg-cyber-amber/15 text-cyber-amber" :
                              "bg-cyber-magenta/15 text-cyber-magenta"
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">{log.time}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] py-0">{log.model}</Badge>
                        </div>
                        <p className="text-[11px] text-foreground/80 leading-relaxed">{log.message}</p>
                        <div className="mt-1 text-right">
                          <span className="text-[9px] font-mono text-cyber-green">{log.delta}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Self-learning subsystems */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyber-amber" />
                  自我学习子系统状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: "在线增量学习", code: "OnlineLearn-X 3.0", progress: 0, status: "未启动", desc: "实时市场数据持续学习，每5分钟更新模型权重", metrics: "学习率: -- | 批次: --" },
                    { name: "策略性能进化", code: "PerformanceGPT 2.0", progress: 0, status: "未启动", desc: "自动评估策略表现，淘汰低效策略，生成新策略", metrics: "进化代: 0 | 淘汰率: --" },
                    { name: "市场自适应", code: "MarketAdapt-X 2.5", progress: 0, status: "未启动", desc: "检测市场状态变化，自动切换策略模式和参数", metrics: "状态: -- | 切换次数: 0" },
                    { name: "多模型融合优化", code: "ModelEnsemble-X 3.0", progress: 0, status: "未启动", desc: "动态调整AI模型的融合权重，最大化预测准确率", metrics: "模型数: 0 | 最优权重更新: --" },
                    { name: "跨市场知识迁移", code: "TransferLearn-X 2.0", progress: 0, status: "未启动", desc: "将主流币策略知识迁移至小币种，加速新币种学习", metrics: "迁移成功率: -- | 目标币种: --" },
                    { name: "全币种因子挖掘", code: "FactorMine-X 1.5", progress: 0, status: "未启动", desc: "自动发现新的阿尔法因子，覆盖全部441+币种（币安全量）", metrics: "新因子/月: 0 | 有效因子: 0" },
                    { name: "异常模式学习", code: "AnomalyLearn-X 2.0", progress: 0, status: "未启动", desc: "从历史异常事件中学习，提前预警黑天鹅事件", metrics: "历史异常: 0 | 预警准确: --" },
                    { name: "情绪-价格关联学习", code: "SentiPrice-X 1.8", progress: 0, status: "未启动", desc: "学习社交媒体情绪与价格变动的因果关系", metrics: "数据源: 0 | 关联强度: --" },
                    { name: "量子计算辅助", code: "QuantumOpt-1.0", progress: 0, status: "实验中", desc: "利用量子计算优化组合权重和因子选择", metrics: "量子比特: -- | 加速比: --" },
                  ].map((sys, i) => (
                    <motion.div
                      key={sys.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-3 rounded border border-border bg-secondary/20 hover:border-cyber-blue/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-medium">{sys.name}</h4>
                        <Badge variant="outline" className={`text-[8px] py-0 ${
                          sys.status === "运行中" ? "border-cyber-green/30 text-cyber-green" :
                          sys.status === "训练中" ? "border-cyber-amber/30 text-cyber-amber" :
                          "border-cyber-magenta/30 text-cyber-magenta"
                        }`}>
                          {sys.status}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-mono text-cyber-blue mb-1">{sys.code}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{sys.desc}</p>
                      <p className="text-[9px] text-muted-foreground mb-1.5">{sys.metrics}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={sys.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-mono text-cyber-blue">{sys.progress}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Historical Data Learning Tab ===== */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* 5-Year Learning Progress Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyber-blue" />
                  5年历史数据学习进度 · 全币种覆盖
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fiveYearData.filter((_, i) => i % 3 === 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis yAxisId="left" domain={[55, 100]} tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `${v}%`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 500]} tick={{ fontSize: 9, fill: "#666" }} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#00d4ff" strokeWidth={2} dot={false} name="模型准确率%" />
                      <Line yAxisId="right" type="monotone" dataKey="coins" stroke="#ffaa00" strokeWidth={2} dot={false} name="覆盖币种数" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Data Collection Stats */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyber-green" />
                    数据采集与学习统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground">时间段</th>
                          <th className="text-left py-2 text-muted-foreground">币种</th>
                          <th className="text-right py-2 text-muted-foreground">记录数</th>
                          <th className="text-right py-2 text-muted-foreground">数据量</th>
                          <th className="text-center py-2 text-muted-foreground">学习</th>
                          <th className="text-right py-2 text-muted-foreground">准确率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalDataStats.map((d) => (
                          <tr key={d.period} className="border-b border-border/20 hover:bg-secondary/30">
                            <td className="py-2 font-mono font-medium">{d.period}</td>
                            <td className="py-2 text-cyber-blue text-[10px]">{d.coins}</td>
                            <td className="py-2 text-right font-mono">{d.records}条</td>
                            <td className="py-2 text-right font-mono text-cyber-amber">{d.dataSize}</td>
                            <td className="py-2 text-center">
                              <Badge variant="outline" className={`text-[8px] py-0 ${d.learningStatus === "已学习" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                                {d.learningStatus}
                              </Badge>
                            </td>
                            <td className="py-2 text-right font-mono text-cyber-green">{d.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-muted-foreground">
                    <span>总记录: <span className="text-cyber-blue font-mono font-bold">--</span></span>
                    <span>总存储: <span className="text-cyber-amber font-mono font-bold">--</span></span>
                    <span>全币种: <span className="text-cyber-green font-mono font-bold">{allCoins.length}+</span></span>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources & Types */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyber-amber" />
                    数据源与数据类型
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { source: "交易所行情数据", types: "K线、Tick、深度、成交", exchanges: "Binance/OKX/HTX/Coinbase/Bybit/Kraken", freq: "实时", coins: "全币种", size: "--" },
                    { source: "链上数据", types: "交易、地址、合约、DeFi", chains: "ETH/SOL/BSC/AVAX/ARB/OP", freq: "每区块", coins: "全币种", size: "--" },
                    { source: "社交媒体数据", types: "推文、帖子、评论、情绪", platforms: "Twitter/Reddit/Telegram/Discord", freq: "每分钟", coins: "全币种", size: "--" },
                    { source: "新闻与公告", types: "新闻、公告、报告、分析", sources: "Reuters/Bloomberg/CoinDesk/项目官网", freq: "实时", coins: "全币种", size: "--" },
                    { source: "基本面数据", types: "GitHub、TVL、用户数、收入", sources: "GitHub/DeFi Llama/Dune/Token Terminal", freq: "每小时", coins: "全币种", size: "--" },
                    { source: "宏观经济数据", types: "利率、CPI、就业、PMI", sources: "Fed/ECB/BLS/各国央行", freq: "每日", coins: "N/A", size: "--" },
                  ].map((ds) => (
                    <div key={ds.source} className="p-2.5 rounded border border-border/50 bg-secondary/20">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium">{ds.source}</h4>
                        <span className="text-[9px] font-mono text-cyber-amber">{ds.size}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">类型: {ds.types}</p>
                      <p className="text-[10px] text-muted-foreground">频率: <span className="text-cyber-blue">{ds.freq}</span> · 覆盖: <span className="text-cyber-green">{ds.coins}</span></p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Monthly PnL from 5-year data */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">5年月度盈亏分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 min-h-[192px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fiveYearData.filter((_, i) => i % 2 === 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#666" }} interval={5} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `$${(v / 1e3).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`$${formatNumber(v)}`, "月度盈亏"]} />
                      <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                        {fiveYearData.filter((_, i) => i % 2 === 0).map((entry, i) => (
                          <Cell key={i} fill={entry.pnl >= 0 ? "#00ff88" : "#ff3388"} fillOpacity={0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Full Coin Prediction Tab ===== */}
        <TabsContent value="prediction">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Accuracy Trend */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">多模型准确率趋势 (30天)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 min-h-[224px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={accuracyHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#666" }} />
                        <YAxis domain={[75, 100]} tick={{ fontSize: 9, fill: "#666" }} />
                        <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="deepseek" stroke="#00d4ff" strokeWidth={2} dot={false} name="DeepSeek-V3" />
                        <Line type="monotone" dataKey="gpt4o" stroke="#00ff88" strokeWidth={2} dot={false} name="DeepSeek-V3" />
                        <Line type="monotone" dataKey="tft" stroke="#ffaa00" strokeWidth={2} dot={false} name="TFT" />
                        <Line type="monotone" dataKey="pattern" stroke="#ff3388" strokeWidth={1.5} dot={false} name="PatchTST" />
                        <Line type="monotone" dataKey="sentiment" stroke="#8855ff" strokeWidth={1.5} dot={false} name="FinBERT-Crypto" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Model Capability Radar */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">模型能力雷达图</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 min-h-[224px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={modelCapabilities}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#999" }} />
                        <PolarRadiusAxis tick={{ fontSize: 8, fill: "#666" }} domain={[0, 100]} />
                        <Radar name="DeepSeek-V3" dataKey="DeepSeek" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} />
                        <Radar name="GPT-4o" dataKey="GPT4o" stroke="#00ff88" fill="#00ff88" fillOpacity={0.1} />
                        <Radar name="TFT" dataKey="TFT" stroke="#ffaa00" fill="#ffaa00" fillOpacity={0.1} />
                        <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Full Coin AI Prediction Matrix */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyber-amber" />
                    全币种AI预测矩阵 · {filteredPredictions.length} 种
                  </CardTitle>
                  <div className="flex gap-1 flex-wrap">
                    {["全部", "主流币", "二线币", "Layer2", "DeFi", "Meme币", "AI概念", "GameFi", "RWA"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPredFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                          predFilter === cat ? "bg-cyber-blue text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground">币种</th>
                        <th className="text-left py-2 text-muted-foreground">类别</th>
                        <th className="text-right py-2 text-muted-foreground">当前价格</th>
                        <th className="text-right py-2 text-muted-foreground">目标价格</th>
                        <th className="text-center py-2 text-muted-foreground">综合信号</th>
                        <th className="text-center py-2 text-muted-foreground">DeepSeek-V3</th>
                        <th className="text-center py-2 text-muted-foreground">GPT-4o</th>
                        <th className="text-center py-2 text-muted-foreground">TFT</th>
                        <th className="text-right py-2 text-muted-foreground">置信度</th>
                        <th className="text-center py-2 text-muted-foreground">风险</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.map((pred) => (
                        <tr key={pred.symbol} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-cyber-blue/10 flex items-center justify-center">
                                <span className="text-[7px] font-mono font-bold text-cyber-blue">{pred.symbol.slice(0, 3)}</span>
                              </div>
                              <span className="font-medium">{pred.symbol}</span>
                            </div>
                          </td>
                          <td className="py-2"><Badge variant="outline" className="text-[8px] py-0">{pred.category}</Badge></td>
                          <td className="py-2 text-right font-mono">${pred.currentPrice < 1 ? pred.currentPrice.toFixed(4) : formatNumber(pred.currentPrice, 2)}</td>
                          <td className={`py-2 text-right font-mono ${pred.targetPrice > pred.currentPrice ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            ${pred.targetPrice < 1 ? pred.targetPrice.toFixed(4) : formatNumber(pred.targetPrice, 2)}
                          </td>
                          <td className="py-2 text-center">
                            <SignalBadge signal={pred.signal} />
                          </td>
                          <td className="py-2 text-center"><SignalDot signal={pred.models.gpt4o} /></td>
                          <td className="py-2 text-center"><SignalDot signal={pred.models.claude} /></td>
                          <td className="py-2 text-center"><SignalDot signal={pred.models.transformer} /></td>
                          <td className="py-2 text-right font-mono text-cyber-blue">{pred.confidence.toFixed(1)}%</td>
                          <td className="py-2 text-center">
                            <span className={`text-[9px] px-1 py-0.5 rounded ${
                              pred.risk === "低" ? "bg-cyber-green/10 text-cyber-green" :
                              pred.risk === "中" ? "bg-cyber-amber/10 text-cyber-amber" :
                              pred.risk === "高" ? "bg-cyber-magenta/10 text-cyber-magenta" :
                              "bg-cyber-magenta/20 text-cyber-magenta"
                            }`}>
                              {pred.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Models Tab ===== */}
        <TabsContent value="models">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {(aiModels as unknown as AIModel[]).map((model: AIModel, i: number) => (
              <motion.div key={model.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-cyber-amber/10 flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-cyber-amber" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{model.name}</h3>
                          <div className="flex gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[9px] py-0">{model.type}</Badge>
                            <Badge variant="outline" className={`text-[9px] py-0 ${model.status === "在线" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                              {model.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => toast.info("模型重训练已加入队列")}>
                        <RefreshCw className="w-3 h-3 mr-1" />重训练
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                      <div>
                        <p className="text-muted-foreground">准确率</p>
                        <p className="font-mono font-bold text-cyber-green">{model.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">延迟</p>
                        <p className="font-mono font-bold text-cyber-blue">{model.latency}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">进化代</p>
                        <p className="font-mono font-bold text-cyber-amber">{(model.generation || model.tradesCount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">学习率</p>
                        <p className="font-mono font-bold">{model.learningRate || (typeof model.weight === 'number' ? model.weight : 0)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">任务: {model.tasks || model.type}</p>
                    <Progress value={model.accuracy} className="h-1" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ===== NLP Tab ===== */}
        <TabsContent value="nlp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { name: "新闻情绪分析", model: "FinBERT-Crypto", status: "待命中", sentiment: "--", score: 0, sources: "Reuters, Bloomberg, CoinDesk", coins: "全币种", articles: "--" },
              { name: "社交媒体监控", model: "FinBERT-Social", status: "待命中", sentiment: "--", score: 0, sources: "Twitter, Reddit, Telegram, Discord", coins: "全币种", articles: "--" },
              { name: "公告事件检测", model: "EventDetectorGPT", status: "待命中", sentiment: "--", score: 0, sources: "交易所公告, 项目官网, 治理论坛", coins: "全币种", articles: "--" },
              { name: "基本面分析", model: "GraphSAGE-Chain", status: "待命中", sentiment: "--", score: 0, sources: "GitHub, DeFi Llama, Dune, Token Terminal", coins: "全币种", articles: "--" },
              { name: "鲸鱼行为分析", model: "WhaleTracker-X", status: "待命中", sentiment: "--", score: 0, sources: "链上数据, 交易所流入流出", coins: "全币种", articles: "--" },
              { name: "监管政策追踪", model: "RegulatoryGPT", status: "待命中", sentiment: "--", score: 0, sources: "SEC, CFTC, 各国监管机构", coins: "N/A", articles: "--" },
            ].map((nlp, i) => (
              <motion.div key={nlp.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{nlp.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">模型: <span className="text-cyber-blue">{nlp.model}</span></p>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-cyber-green/30 text-cyber-green">{nlp.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[10px] mb-3">
                      <div>
                        <p className="text-muted-foreground">情绪判断</p>
                        <p className="font-medium text-cyber-green">{nlp.sentiment}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">置信度</p>
                        <p className="font-mono font-bold text-cyber-blue">{nlp.score}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">处理量</p>
                        <p className="font-mono font-bold text-cyber-amber">{nlp.articles}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">数据源: {nlp.sources}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">覆盖: <span className="text-cyber-green">{nlp.coins}</span></p>
                    <Progress value={nlp.score} className="h-1 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ===== Decision Explanation Tab ===== */}
        <TabsContent value="decision">
          <AIDecisionExplainer />
        </TabsContent>

        {/* ===== A/B Test Tab ===== */}
        <TabsContent value="abtest">
          <ABTestPanel />
        </TabsContent>

        {/* ===== AI Scheduler Tab ===== */}
        <TabsContent value="scheduler">
          <AISchedulerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// A/B Test Panel - DeepSeek-V3 vs GPT-4o vs LSTM-Attention
// Real-time comparison across coin categories
// ============================================================

type ABCoinResult = {
  symbol: string;
  name: string;
  category: string;
  deepseek: { accuracy: number; latency: number; signal: string; confidence: number; pnl: number };
  gpt4o: { accuracy: number; latency: number; signal: string; confidence: number; pnl: number };
  lstm: { accuracy: number; latency: number; signal: string; confidence: number; pnl: number };
};

const abWeightedSignal = () => {
  const r = Math.random();
  if (r < 0.12) return "强烈看涨";
  if (r < 0.42) return "看涨";
  if (r < 0.62) return "中性";
  if (r < 0.88) return "看跌";
  return "强烈看跌";
};

function generateABData(): ABCoinResult[] {
  return staticCoins.filter(c => c.category !== "稳定币").map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    category: coin.category,
    deepseek: {
      accuracy: 0,
      latency: 0,
      signal: "中性",
      confidence: 0,
      pnl: 0,
    },
    gpt4o: {
      accuracy: 0,
      latency: 0,
      signal: "中性",
      confidence: 0,
      pnl: 0,
    },
    lstm: {
      accuracy: 0,
      latency: 0,
      signal: "中性",
      confidence: 0,
      pnl: 0,
    },
  }));
}

function ABTestPanel() {
  const [abData] = useState<ABCoinResult[]>(() => generateABData());
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [sortBy, setSortBy] = useState<"accuracy" | "latency" | "pnl" | "confidence">("accuracy");
  const [sortModel, setSortModel] = useState<"deepseek" | "gpt4o" | "lstm">("deepseek");
  const [sortAsc, setSortAsc] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [liveDeltas, setLiveDeltas] = useState<Record<string, { d: number; g: number; l: number }>>({});
  const tickRef = useRef(0);

  // Live micro-updates to accuracy
  useEffect(() => {
    if (!liveUpdates) return;
    const iv = setInterval(() => {
      tickRef.current++;
      const deltas: Record<string, { d: number; g: number; l: number }> = {};
      abData.forEach(coin => {
        deltas[coin.symbol] = {
          d: (Math.random() - 0.48) * 0.3,
          g: (Math.random() - 0.50) * 0.3,
          l: (Math.random() - 0.47) * 0.3,
        };
      });
      setLiveDeltas(deltas);
    }, 2000);
    return () => clearInterval(iv);
  }, [liveUpdates, abData]);

  const categories = ["全部", ...Array.from(new Set(abData.map(c => c.category)))];

  const filtered = selectedCategory === "全部" ? abData : abData.filter(c => c.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortModel][sortBy];
    const vb = b[sortModel][sortBy];
    return sortAsc ? va - vb : vb - va;
  });

  // Aggregate stats per model
  const stats = useMemo(() => {
    const d = filtered.map(c => c.deepseek);
    const g = filtered.map(c => c.gpt4o);
    const l = filtered.map(c => c.lstm);
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    return {
      deepseek: { avgAcc: avg(d.map(x => x.accuracy)), avgLat: avg(d.map(x => x.latency)), avgPnl: avg(d.map(x => x.pnl)), avgConf: avg(d.map(x => x.confidence)), wins: d.filter(x => x.pnl > 0).length },
      gpt4o: { avgAcc: avg(g.map(x => x.accuracy)), avgLat: avg(g.map(x => x.latency)), avgPnl: avg(g.map(x => x.pnl)), avgConf: avg(g.map(x => x.confidence)), wins: g.filter(x => x.pnl > 0).length },
      lstm: { avgAcc: avg(l.map(x => x.accuracy)), avgLat: avg(l.map(x => x.latency)), avgPnl: avg(l.map(x => x.pnl)), avgConf: avg(l.map(x => x.confidence)), wins: l.filter(x => x.pnl > 0).length },
    };
  }, [filtered]);

  // Category comparison chart data
  const categoryChartData = useMemo(() => {
    const cats = Array.from(new Set(abData.map(c => c.category)));
    return cats.map(cat => {
      const coins = abData.filter(c => c.category === cat);
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      return {
        category: cat.length > 4 ? cat.slice(0, 4) : cat,
        fullCategory: cat,
        DeepSeek: +avg(coins.map(c => c.deepseek.accuracy)).toFixed(1),
        GPT4o: +avg(coins.map(c => c.gpt4o.accuracy)).toFixed(1),
        LSTM: +avg(coins.map(c => c.lstm.accuracy)).toFixed(1),
        count: coins.length,
      };
    });
  }, [abData]);

  // Time series comparison (simulated 24h)
  const timeSeriesData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = `${i.toString().padStart(2, "0")}:00`;
      const base = 90 + Math.sin(i / 4) * 3;
      return {
        hour,
        DeepSeek: +(base + 2 + Math.random() * 3).toFixed(1),
        GPT4o: +(base + 0.5 + Math.random() * 3.5).toFixed(1),
        LSTM: +(base + 1.5 + Math.random() * 3).toFixed(1),
      };
    });
  }, []);

  const bestModel = stats.deepseek.avgAcc >= stats.gpt4o.avgAcc && stats.deepseek.avgAcc >= stats.lstm.avgAcc
    ? "DeepSeek-V3" : stats.lstm.avgAcc >= stats.gpt4o.avgAcc ? "LSTM-Attention" : "GPT-4o";
  const fastestModel = stats.lstm.avgLat <= stats.deepseek.avgLat && stats.lstm.avgLat <= stats.gpt4o.avgLat
    ? "LSTM-Attention" : stats.deepseek.avgLat <= stats.gpt4o.avgLat ? "DeepSeek-V3" : "GPT-4o";

  const toggleSort = (field: typeof sortBy, model: typeof sortModel) => {
    if (sortBy === field && sortModel === model) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortModel(model); setSortAsc(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-cyber-blue/20 to-cyber-magenta/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-cyber-blue" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold tracking-wider">模型 A/B 测试面板</h2>
            <p className="text-[10px] text-muted-foreground">DeepSeek-V3 vs GPT-4o vs LSTM-Attention · {filtered.length}个币种实时对比</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[9px] py-0.5 ${liveUpdates ? "border-cyber-green/50 text-cyber-green" : "border-muted-foreground/30"}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${liveUpdates ? "bg-cyber-green animate-pulse" : "bg-muted-foreground"}`} />
            {liveUpdates ? "实时更新中" : "已暂停"}
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setLiveUpdates(!liveUpdates)}>
            {liveUpdates ? "暂停" : "恢复"}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => toast.success("A/B测试报告已导出")}>
            导出报告
          </Button>
        </div>
      </div>

      {/* Summary Cards - 3 models side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {([
          { key: "deepseek" as const, name: "DeepSeek-V3", color: "cyber-green", icon: "🧠", role: "主力LLM" },
          { key: "gpt4o" as const, name: "GPT-4o", color: "cyber-blue", icon: "🤖", role: "辅助LLM" },
          { key: "lstm" as const, name: "LSTM-Attention", color: "cyber-amber", icon: "🔄", role: "序列记忆" },
        ]).map(model => {
          const s = stats[model.key];
          const isBestAcc = s.avgAcc >= Math.max(stats.deepseek.avgAcc, stats.gpt4o.avgAcc, stats.lstm.avgAcc) - 0.01;
          const isFastest = s.avgLat <= Math.min(stats.deepseek.avgLat, stats.gpt4o.avgLat, stats.lstm.avgLat) + 0.1;
          return (
            <motion.div key={model.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`bg-card border-border hover:border-${model.color}/30 transition-all relative overflow-hidden`}>
                {isBestAcc && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-cyber-green/20 text-cyber-green text-[8px] px-2 py-0.5 rounded-bl font-medium flex items-center gap-1">
                      <Trophy className="w-2.5 h-2.5" /> 最高准确率
                    </div>
                  </div>
                )}
                {isFastest && !isBestAcc && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-cyber-amber/20 text-cyber-amber text-[8px] px-2 py-0.5 rounded-bl font-medium flex items-center gap-1">
                      <Timer className="w-2.5 h-2.5" /> 最低延迟
                    </div>
                  </div>
                )}
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{model.icon}</span>
                    <div>
                      <h3 className={`font-heading text-sm font-bold text-${model.color}`}>{model.name}</h3>
                      <p className="text-[9px] text-muted-foreground">{model.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                    <div>
                      <p className="text-muted-foreground">平均准确率</p>
                      <p className={`font-mono font-bold text-sm text-${model.color}`}>{s.avgAcc.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均延迟</p>
                      <p className="font-mono font-bold text-sm">{s.avgLat.toFixed(0)}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均盈亏</p>
                      <p className={`font-mono font-bold ${s.avgPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{s.avgPnl >= 0 ? "+" : ""}{s.avgPnl.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">胜率</p>
                      <p className="font-mono font-bold">{((s.wins / filtered.length) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均置信度</p>
                      <p className="font-mono font-bold">{s.avgConf.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">盈利币种</p>
                      <p className="font-mono font-bold text-cyber-green">{s.wins}/{filtered.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 24h Accuracy Trend */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-blue" />
              24小时准确率趋势对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#888" }} interval={3} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 9, fill: "#888" }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="DeepSeek" stroke="#00ff88" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="GPT4o" stroke="#00aaff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="LSTM" stroke="#ffaa00" strokeWidth={2} dot={false} />
                  <ReferenceLine y={93} stroke="#666" strokeDasharray="5 5" label={{ value: "基准线", fill: "#666", fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison Bar Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyber-amber" />
              板块准确率对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} barGap={1} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="category" tick={{ fontSize: 8, fill: "#888" }} interval={0} angle={-30} textAnchor="end" height={40} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 9, fill: "#888" }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="DeepSeek" fill="#00ff88" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="GPT4o" fill="#00aaff" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="LSTM" fill="#ffaa00" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            className={`h-6 text-[10px] ${selectedCategory === cat ? "bg-cyber-blue text-white" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
            {cat !== "全部" && <span className="ml-1 opacity-60">({abData.filter(c => c.category === cat).length})</span>}
          </Button>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-2 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium px-2">币种</th>
                <th className="text-left py-2 text-muted-foreground font-medium">板块</th>
                {/* DeepSeek columns */}
                <th className="text-center py-2 px-1 cursor-pointer hover:text-cyber-green transition-colors" onClick={() => toggleSort("accuracy", "deepseek")}>
                  <span className="text-cyber-green">DS-V3</span> 准确率 {sortBy === "accuracy" && sortModel === "deepseek" ? (sortAsc ? <ChevronUp className="w-2.5 h-2.5 inline" /> : <ChevronDown className="w-2.5 h-2.5 inline" />) : null}
                </th>
                <th className="text-center py-2 px-1 text-muted-foreground"><span className="text-cyber-green">DS</span> 信号</th>
                {/* GPT-4o columns */}
                <th className="text-center py-2 px-1 cursor-pointer hover:text-cyber-blue transition-colors" onClick={() => toggleSort("accuracy", "gpt4o")}>
                  <span className="text-cyber-blue">GPT-4o</span> 准确率 {sortBy === "accuracy" && sortModel === "gpt4o" ? (sortAsc ? <ChevronUp className="w-2.5 h-2.5 inline" /> : <ChevronDown className="w-2.5 h-2.5 inline" />) : null}
                </th>
                <th className="text-center py-2 px-1 text-muted-foreground"><span className="text-cyber-blue">GPT</span> 信号</th>
                {/* LSTM columns */}
                <th className="text-center py-2 px-1 cursor-pointer hover:text-cyber-amber transition-colors" onClick={() => toggleSort("accuracy", "lstm")}>
                  <span className="text-cyber-amber">LSTM</span> 准确率 {sortBy === "accuracy" && sortModel === "lstm" ? (sortAsc ? <ChevronUp className="w-2.5 h-2.5 inline" /> : <ChevronDown className="w-2.5 h-2.5 inline" />) : null}
                </th>
                <th className="text-center py-2 px-1 text-muted-foreground"><span className="text-cyber-amber">LSTM</span> 信号</th>
                {/* Winner */}
                <th className="text-center py-2 px-1 text-muted-foreground">胜出</th>
                <th className="text-center py-2 px-1 text-muted-foreground">差距</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map((coin, i) => {
                const delta = liveDeltas[coin.symbol] || { d: 0, g: 0, l: 0 };
                const dAcc = coin.deepseek.accuracy + delta.d;
                const gAcc = coin.gpt4o.accuracy + delta.g;
                const lAcc = coin.lstm.accuracy + delta.l;
                const winner = dAcc >= gAcc && dAcc >= lAcc ? "DS" : lAcc >= gAcc ? "LSTM" : "GPT";
                const maxAcc = Math.max(dAcc, gAcc, lAcc);
                const minAcc = Math.min(dAcc, gAcc, lAcc);
                const gap = maxAcc - minAcc;
                return (
                  <motion.tr
                    key={coin.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-1.5 px-2 font-mono font-bold">{coin.symbol}</td>
                    <td className="py-1.5">
                      <Badge variant="outline" className="text-[8px] py-0">{coin.category}</Badge>
                    </td>
                    <td className={`text-center font-mono font-bold ${winner === "DS" ? "text-cyber-green" : ""}`}>
                      {dAcc.toFixed(1)}%
                      {delta.d !== 0 && <span className={`ml-0.5 text-[8px] ${delta.d > 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{delta.d > 0 ? "↑" : "↓"}</span>}
                    </td>
                    <td className="text-center"><SignalBadge signal={coin.deepseek.signal} /></td>
                    <td className={`text-center font-mono font-bold ${winner === "GPT" ? "text-cyber-blue" : ""}`}>
                      {gAcc.toFixed(1)}%
                      {delta.g !== 0 && <span className={`ml-0.5 text-[8px] ${delta.g > 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{delta.g > 0 ? "↑" : "↓"}</span>}
                    </td>
                    <td className="text-center"><SignalBadge signal={coin.gpt4o.signal} /></td>
                    <td className={`text-center font-mono font-bold ${winner === "LSTM" ? "text-cyber-amber" : ""}`}>
                      {lAcc.toFixed(1)}%
                      {delta.l !== 0 && <span className={`ml-0.5 text-[8px] ${delta.l > 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{delta.l > 0 ? "↑" : "↓"}</span>}
                    </td>
                    <td className="text-center"><SignalBadge signal={coin.lstm.signal} /></td>
                    <td className="text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        winner === "DS" ? "bg-cyber-green/15 text-cyber-green" :
                        winner === "LSTM" ? "bg-cyber-amber/15 text-cyber-amber" :
                        "bg-cyber-blue/15 text-cyber-blue"
                      }`}>{winner === "DS" ? "DeepSeek" : winner === "LSTM" ? "LSTM" : "GPT-4o"}</span>
                    </td>
                    <td className="text-center font-mono text-[9px]">
                      <span className={gap > 3 ? "text-cyber-magenta" : gap > 1.5 ? "text-cyber-amber" : "text-muted-foreground"}>
                        {gap.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length > 50 && (
            <p className="text-center text-[9px] text-muted-foreground mt-2 py-1">
              显示前50个币种 / 共{sorted.length}个
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottom Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-card border-border border-l-2 border-l-cyber-green">
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">准确率最优模型</p>
                <p className="font-heading font-bold text-cyber-green">{bestModel}</p>
              </div>
              <Trophy className="w-5 h-5 text-cyber-green/40" />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">在{selectedCategory === "全部" ? "全部" : selectedCategory}板块{filtered.length}个币种中综合准确率最高</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-l-2 border-l-cyber-amber">
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">延迟最优模型</p>
                <p className="font-heading font-bold text-cyber-amber">{fastestModel}</p>
              </div>
              <Timer className="w-5 h-5 text-cyber-amber/40" />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">LSTM-Attention平均{stats.lstm.avgLat.toFixed(0)}ms，DeepSeek-V3 {stats.deepseek.avgLat.toFixed(0)}ms，GPT-4o {stats.gpt4o.avgLat.toFixed(0)}ms</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-l-2 border-l-cyber-blue">
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-muted-foreground">信号一致性</p>
                <p className="font-heading font-bold text-cyber-blue">
                  {((filtered.filter(c => c.deepseek.signal === c.gpt4o.signal && c.gpt4o.signal === c.lstm.signal).length / filtered.length) * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="w-5 h-5 text-cyber-blue/40" />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">三个模型对{filtered.length}个币种的方向判断完全一致的比例</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const cls = signal.includes("强烈看涨") ? "bg-cyber-green/20 text-cyber-green" :
    signal === "看涨" ? "bg-cyber-green/10 text-cyber-green" :
    signal === "中性" ? "bg-cyber-amber/10 text-cyber-amber" :
    signal === "看跌" ? "bg-cyber-magenta/10 text-cyber-magenta" :
    "bg-cyber-magenta/20 text-cyber-magenta";
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${cls}`}>{signal}</span>;
}

function SignalDot({ signal }: { signal: string }) {
  const color = signal.includes("看涨") ? "bg-cyber-green" : signal.includes("看跌") ? "bg-cyber-magenta" : "bg-cyber-amber";
  return (
    <div className="flex items-center justify-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[9px] text-muted-foreground">{signal}</span>
    </div>
  );
}
