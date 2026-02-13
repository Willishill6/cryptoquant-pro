/**
 * AIEvolutionLab - AI进化实验室
 * AI自我进化时间线、代际对比、自我学习日志流、知识图谱、元学习
 * Design: Cyberpunk terminal dark theme with electric blue accents
 */
import { useState, useEffect, useMemo } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IMAGES } from "@/lib/images";
import { allCoins } from "@/lib/mockData";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Brain, Dna, Sparkles, GitBranch, Clock, RefreshCw, Shield, Lightbulb, Network, Award, Crown, Swords, FlaskConical, Atom } from "lucide-react";

// ============ AI MODELS DATA ============
const aiModels = [
  { name: "DeepSeek-V3", type: "大语言模型", version: "v3.1", accuracy: 94.8, sharpe: 2.55, latency: 95, status: "主力", coins: 441, speciality: "策略生成+推理", winRate: 74.2 },
  { name: "GPT-4o", type: "大语言模型", version: "v4.2", accuracy: 93.5, sharpe: 2.42, latency: 180, status: "辅助", coins: 441, speciality: "多模态分析", winRate: 71.5 },
  { name: "TFT", type: "时序预测", version: "v3.2", accuracy: 93.2, sharpe: 2.62, latency: 18, status: "主力", coins: 441, speciality: "多尺度价格预测", winRate: 73.5 },
  { name: "PatchTST", type: "时序预测", version: "v2.1", accuracy: 91.8, sharpe: 2.48, latency: 12, status: "主力", coins: 441, speciality: "长序列模式识别", winRate: 72.8 },
  { name: "PPO-Portfolio", type: "强化学习", version: "v5.3", accuracy: 89.8, sharpe: 2.28, latency: 8, status: "主力", coins: 441, speciality: "动态仓位管理", winRate: 68.5 },
  { name: "FinBERT-Crypto", type: "金融NLP", version: "v4.1", accuracy: 87.5, sharpe: 1.95, latency: 25, status: "辅助", coins: 441, speciality: "情绪分析", winRate: 65.2 },
  { name: "GraphSAGE-Chain", type: "图神经网络", version: "v3.2", accuracy: 86.2, sharpe: 1.88, latency: 35, status: "辅助", coins: 320, speciality: "链上分析", winRate: 63.8 },
  { name: "MetaLearner-X", type: "元学习", version: "v2.0", accuracy: 88.5, sharpe: 2.15, latency: 50, status: "进化中", coins: 441, speciality: "快速适应", winRate: 67.2 },
  { name: "LSTM-Attention", type: "序列记忆", version: "v3.5", accuracy: 92.5, sharpe: 2.52, latency: 15, status: "主力", coins: 441, speciality: "趋势记忆+波动率", winRate: 70.1 },
];

// ============ EVOLUTION GENERATIONS ============
const generations = [
  { gen: "Gen-1", period: "2021 Q1-Q2", models: 2, accuracy: 62.5, sharpe: 0.85, coins: 15, breakthrough: "基础LSTM价格预测 → 进化为LSTM-Attention", status: "已淘汰" },
  { gen: "Gen-2", period: "2021 Q3-Q4", models: 3, accuracy: 68.2, sharpe: 1.12, coins: 35, breakthrough: "Transformer架构引入", status: "已淘汰" },
  { gen: "Gen-3", period: "2022 Q1-Q2", models: 4, accuracy: 73.5, sharpe: 1.35, coins: 60, breakthrough: "多因子融合模型", status: "已淘汰" },
  { gen: "Gen-4", period: "2022 Q3-Q4", models: 5, accuracy: 78.8, sharpe: 1.58, coins: 85, breakthrough: "强化学习仓位管理", status: "已淘汰" },
  { gen: "Gen-5", period: "2023 Q1-Q2", models: 5, accuracy: 82.1, sharpe: 1.78, coins: 120, breakthrough: "GPT-4集成+链上分析", status: "已淘汰" },
  { gen: "Gen-6", period: "2023 Q3-Q4", models: 6, accuracy: 85.5, sharpe: 1.95, coins: 180, breakthrough: "自适应强化学习", status: "已淘汰" },
  { gen: "Gen-7", period: "2024 Q1-Q2", models: 7, accuracy: 88.8, sharpe: 2.12, coins: 250, breakthrough: "全币种覆盖+图神经网络", status: "已退役" },
  { gen: "Gen-8", period: "2024 Q3-Q4", models: 7, accuracy: 91.2, sharpe: 2.28, coins: 320, breakthrough: "多模态融合分析", status: "已退役" },
  { gen: "Gen-9", period: "2025 Q1-Q2", models: 8, accuracy: 93.2, sharpe: 2.35, coins: 380, breakthrough: "元学习能力上线", status: "活跃" },
  { gen: "Gen-10", period: "2025 Q3-Q4", models: 8, accuracy: 93.8, sharpe: 2.42, coins: 420, breakthrough: "量子计算辅助优化", status: "活跃" },
  { gen: "Gen-11", period: "2026 Q1", models: 9, accuracy: 94.5, sharpe: 2.48, coins: 441, breakthrough: "LSTM-Attention回归+跨市场知识迁移", status: "当前" },
];

// ============ SELF-LEARNING LOG ============
function generateLearningLogs() {
  const types = [
    { type: "模型更新", icon: "🧠", color: "cyber-blue" },
    { type: "因子发现", icon: "💡", color: "cyber-amber" },
    { type: "策略优化", icon: "⚡", color: "cyber-green" },
    { type: "异常检测", icon: "🔍", color: "cyber-magenta" },
    { type: "知识迁移", icon: "🔄", color: "cyber-blue" },
    { type: "自我修复", icon: "🛠️", color: "cyber-green" },
  ];
  const messages = [
    "BTC/USDT 4小时模型权重更新完成，准确率提升0.3%",
    "发现新的链上因子：大户钱包30日净流入与价格相关性IC=0.42",
    "ETH网格策略参数自动优化：网格间距从1.2%调整至0.95%",
    "检测到SOL/USDT订单簿异常：买卖比突变，触发风控预警",
    "将BTC市场周期知识迁移至ETH/SOL等主流币模型",
    "PatchTST v2.1 梯度异常自动修复，恢复正常推理",
    "DOGE情绪因子权重动态调整：Twitter情绪权重从0.3提升至0.45",
    "全币种相关性矩阵更新：发现AI概念币板块新的联动模式",
    "DeFi协议TVL预测模型精度提升：Aave预测误差降至2.1%",
    "元学习器完成第2100代进化：新市场适应时间缩短至15分钟",
    "Layer2 Gas费预测模型更新：Arbitrum预测准确率达96.5%",
    "Meme币情绪爆发检测模型优化：提前预警时间从5分钟提升至12分钟",
    "跨交易所价差模式学习完成：识别出3个新的价差收敛模式",
    "RWA代币基本面评估模型更新：纳入链下资产审计数据",
    "多模型集成权重自动再平衡：DeepSeek-V3权重从35%调整至38%",
  ];
  return Array.from({ length: 50 }, (_, i) => {
    const t = types[Math.floor(Math.random() * types.length)];
    const mins = i * 3 + Math.floor(Math.random() * 3);
    return {
      id: i,
      timestamp: `${Math.floor(mins / 60)}小时${mins % 60}分钟前`,
      ...t,
      message: messages[Math.floor(Math.random() * messages.length)],
      confidence: 75 + Math.floor(Math.random() * 25),
      affectedCoins: Math.floor(Math.random() * 50) + 5,
    };
  });
}

// ============ KNOWLEDGE GRAPH NODES ============
const knowledgeDomains = [
  { name: "价格模式", connections: 45, maturity: 95, subdomains: ["趋势识别", "支撑阻力", "形态识别", "波动率建模"] },
  { name: "链上行为", connections: 38, maturity: 88, subdomains: ["大户追踪", "资金流向", "合约交互", "MEV分析"] },
  { name: "市场情绪", connections: 32, maturity: 85, subdomains: ["社交媒体", "新闻分析", "恐贪指数", "资金费率"] },
  { name: "DeFi生态", connections: 28, maturity: 78, subdomains: ["TVL分析", "收益率曲线", "协议风险", "流动性深度"] },
  { name: "宏观经济", connections: 22, maturity: 82, subdomains: ["利率政策", "通胀数据", "美元指数", "地缘政治"] },
  { name: "技术指标", connections: 50, maturity: 98, subdomains: ["均线系统", "动量指标", "波动率", "成交量"] },
  { name: "跨市场", connections: 18, maturity: 72, subdomains: ["股币联动", "商品相关", "外汇影响", "债券利差"] },
  { name: "元学习", connections: 15, maturity: 65, subdomains: ["快速适应", "知识迁移", "自我修复", "架构搜索"] },
];

export default function AIEvolutionLab() {
  const sys = useSystemStatusCtx();
  const [activeTab, setActiveTab] = useState("evolution");
  const learningLogs = useMemo(() => generateLearningLogs(), []);
  const [logFilter, setLogFilter] = useState("全部");
  const [liveGeneration, setLiveGeneration] = useState(2100);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Simulate live evolution counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveGeneration((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredLogs = logFilter === "全部"
    ? learningLogs
    : learningLogs.filter((l) => l.type === logFilter);

  // Model comparison radar data
  const modelRadarData = [
    { metric: "准确率", ...Object.fromEntries(aiModels.slice(0, 5).map((m) => [m.name, m.accuracy])) },
    { metric: "Sharpe", ...Object.fromEntries(aiModels.slice(0, 5).map((m) => [m.name, m.sharpe * 40])) },
    { metric: "胜率", ...Object.fromEntries(aiModels.slice(0, 5).map((m) => [m.name, m.winRate])) },
    { metric: "币种覆盖", ...Object.fromEntries(aiModels.slice(0, 5).map((m) => [m.name, m.coins / 5])) },
    { metric: "速度", ...Object.fromEntries(aiModels.slice(0, 5).map((m) => [m.name, 100 - Math.min(100, m.latency / 2)])) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-48">
        <img src={IMAGES.aiSystem} alt="AI Evolution" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-3xl font-bold text-cyber-blue text-glow-blue tracking-wider">
              AI 进化实验室
            </h1>
            <span className="px-2 py-0.5 rounded-sm bg-cyber-green/20 text-cyber-green text-xs font-mono animate-pulse">
              GEN-{liveGeneration} EVOLVING
            </span>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            AI自我进化 · 自我学习 · 多模型竞技 · 知识图谱 · 元学习能力 · 币安全币种441+覆盖
          </p>
          <div className="flex gap-4 mt-4">
            {[
              { label: "当前代际", value: `Gen-11 (#${liveGeneration})`, icon: Dna },
              { label: "AI模型", value: sys.aiModel, icon: Brain },
              { label: "总进化代数", value: `${liveGeneration}+`, icon: GitBranch },
              { label: "API延迟", value: `${sys.apiLatency}ms`, icon: Network },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-md px-3 py-1.5">
                <stat.icon className="w-3.5 h-3.5 text-cyber-blue" />
                <div>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                  <p className="text-xs font-mono font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="evolution">进化时间线</TabsTrigger>
          <TabsTrigger value="models">模型竞技场</TabsTrigger>
          <TabsTrigger value="learning">自我学习日志</TabsTrigger>
          <TabsTrigger value="knowledge">知识图谱</TabsTrigger>
          <TabsTrigger value="meta">元学习能力</TabsTrigger>
          <TabsTrigger value="coins">全币种AI覆盖</TabsTrigger>
        </TabsList>

        {/* ============ TAB: 进化时间线 ============ */}
        <TabsContent value="evolution" className="space-y-6">
          {/* Generation evolution chart */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyber-blue" />
              AI代际进化曲线 · Gen-1 到 Gen-11
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generations}>
                <defs>
                  <linearGradient id="evoAccGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="gen" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#888", fontSize: 10 }} domain={[50, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#888", fontSize: 10 }} domain={[0, 500]} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="#00d4ff" fill="url(#evoAccGrad)" strokeWidth={2} name="准确率(%)" />
                <Line yAxisId="right" type="monotone" dataKey="coins" stroke="#ffc107" strokeWidth={2} dot={{ r: 3 }} name="币种覆盖" />
                <Line yAxisId="left" type="monotone" dataKey="sharpe" stroke="#00ff88" strokeWidth={1.5} dot={false} name="Sharpe×40" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Generation cards */}
          <div className="space-y-3">
            {generations.slice().reverse().map((gen, i) => (
              <motion.div
                key={gen.gen}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-card border rounded-lg p-4 flex items-center gap-6 ${
                  gen.status === "当前"
                    ? "border-cyber-blue/40 glow-blue"
                    : gen.status === "活跃"
                      ? "border-cyber-green/30"
                      : "border-border"
                }`}
              >
                {/* Gen badge */}
                <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center shrink-0 ${
                  gen.status === "当前" ? "bg-cyber-blue/20" : gen.status === "活跃" ? "bg-cyber-green/10" : "bg-secondary/30"
                }`}>
                  <span className={`text-lg font-heading font-bold ${
                    gen.status === "当前" ? "text-cyber-blue" : gen.status === "活跃" ? "text-cyber-green" : "text-muted-foreground"
                  }`}>
                    {gen.gen.replace("Gen-", "")}
                  </span>
                  <span className="text-[8px] text-muted-foreground">GEN</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-foreground">{gen.gen}</span>
                    <span className="text-[10px] text-muted-foreground">{gen.period}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${
                      gen.status === "当前" ? "bg-cyber-blue/20 text-cyber-blue" :
                      gen.status === "活跃" ? "bg-cyber-green/20 text-cyber-green" :
                      gen.status === "已退役" ? "bg-cyber-amber/20 text-cyber-amber" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {gen.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    <Sparkles className="w-3 h-3 inline mr-1 text-cyber-amber" />
                    突破: {gen.breakthrough}
                  </p>
                  <div className="flex gap-6 text-[10px]">
                    <span className="text-muted-foreground">模型数: <span className="font-mono text-foreground">{gen.models}</span></span>
                    <span className="text-muted-foreground">准确率: <span className="font-mono text-cyber-green">{gen.accuracy}%</span></span>
                    <span className="text-muted-foreground">Sharpe: <span className="font-mono text-cyber-blue">{gen.sharpe}</span></span>
                    <span className="text-muted-foreground">币种: <span className="font-mono text-cyber-amber">{gen.coins}</span></span>
                  </div>
                </div>

                {/* Accuracy bar */}
                <div className="w-32 shrink-0 hidden lg:block">
                  <div className="text-[9px] text-muted-foreground mb-1 text-right">{gen.accuracy}%</div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${gen.accuracy}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        gen.status === "当前" ? "bg-cyber-blue" : gen.status === "活跃" ? "bg-cyber-green" : "bg-muted-foreground/50"
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ============ TAB: 模型竞技场 ============ */}
        <TabsContent value="models" className="space-y-6">
          {/* Model comparison radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyber-blue" />
                Top 5 模型多维对比
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={modelRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#888", fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: "#666", fontSize: 8 }} domain={[0, 100]} />
                  {aiModels.slice(0, 5).map((model, i) => {
                    const colors = ["#00d4ff", "#00ff88", "#ffc107", "#e74c8c", "#a855f7"];
                    return (
                      <Radar key={model.name} name={model.name} dataKey={model.name}
                        stroke={colors[i]} fill={colors[i]} fillOpacity={0.08} strokeWidth={1.5} />
                    );
                  })}
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Model leaderboard */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-cyber-amber" />
                模型排行榜 · 按综合评分
              </h4>
              <div className="space-y-2">
                {aiModels.sort((a, b) => b.accuracy - a.accuracy).map((model, i) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all ${
                      selectedModel === model.name
                        ? "bg-cyber-blue/10 border border-cyber-blue/30"
                        : "hover:bg-secondary/30"
                    }`}
                    onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? "bg-cyber-amber/20 text-cyber-amber" :
                      i === 1 ? "bg-gray-400/20 text-gray-400" :
                      i === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{model.name}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded-sm ${
                          model.status === "主力" ? "bg-cyber-green/20 text-cyber-green" :
                          model.status === "进化中" ? "bg-cyber-amber/20 text-cyber-amber" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {model.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{model.type} · {model.speciality}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-cyber-green">{model.accuracy}%</p>
                      <p className="text-[9px] text-muted-foreground">胜率 {model.winRate}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Model detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {aiModels.map((model, i) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border rounded-lg p-4 ${
                  model.status === "主力" ? "border-cyber-blue/30" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{model.name}</h4>
                    <p className="text-[9px] text-muted-foreground">{model.type} · {model.version}</p>
                  </div>
                  {model.status === "主力" && <Crown className="w-4 h-4 text-cyber-amber" />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-muted-foreground">准确率</span><p className="font-mono text-cyber-green">{model.accuracy}%</p></div>
                  <div><span className="text-muted-foreground">Sharpe</span><p className="font-mono text-cyber-blue">{model.sharpe}</p></div>
                  <div><span className="text-muted-foreground">胜率</span><p className="font-mono text-foreground">{model.winRate}%</p></div>
                  <div><span className="text-muted-foreground">延迟</span><p className="font-mono text-foreground">{model.latency}ms</p></div>
                  <div><span className="text-muted-foreground">币种覆盖</span><p className="font-mono text-cyber-amber">{model.coins}</p></div>
                  <div><span className="text-muted-foreground">专长</span><p className="font-mono text-foreground">{model.speciality}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ============ TAB: 自我学习日志 ============ */}
        <TabsContent value="learning" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {["全部", "模型更新", "因子发现", "策略优化", "异常检测", "知识迁移", "自我修复"].map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  logFilter === f
                    ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Log stream */}
          <div className="bg-card border border-border rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <div className="space-y-2">
              {filteredLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 p-3 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-lg shrink-0">{log.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm bg-${log.color}/10 text-${log.color}`}>
                        {log.type}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{log.timestamp}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        置信度: <span className="font-mono text-foreground">{log.confidence}%</span>
                      </span>
                    </div>
                    <p className="text-xs text-foreground">{log.message}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      影响币种: {log.affectedCoins}个
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: 知识图谱 ============ */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {knowledgeDomains.map((domain, i) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-4 hover:border-cyber-blue/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-foreground">{domain.name}</h4>
                  <span className="text-[9px] font-mono text-cyber-blue">{domain.connections}个连接</span>
                </div>

                {/* Maturity bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-muted-foreground">成熟度</span>
                    <span className={`font-mono ${
                      domain.maturity >= 90 ? "text-cyber-green" : domain.maturity >= 75 ? "text-cyber-blue" : "text-cyber-amber"
                    }`}>{domain.maturity}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${domain.maturity}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${
                        domain.maturity >= 90 ? "bg-cyber-green" : domain.maturity >= 75 ? "bg-cyber-blue" : "bg-cyber-amber"
                      }`}
                    />
                  </div>
                </div>

                {/* Subdomains */}
                <div className="flex flex-wrap gap-1">
                  {domain.subdomains.map((sub) => (
                    <span key={sub} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-secondary text-muted-foreground">
                      {sub}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Knowledge connections radar */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="text-xs font-bold text-foreground mb-3">知识领域连接强度</h4>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={knowledgeDomains.map((d) => ({
                domain: d.name,
                connections: d.connections,
                maturity: d.maturity,
              }))}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: "#888", fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: "#666", fontSize: 8 }} />
                <Radar name="连接数" dataKey="connections" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="成熟度" dataKey="maturity" stroke="#00ff88" fill="#00ff88" fillOpacity={0.1} strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ============ TAB: 元学习能力 ============ */}
        <TabsContent value="meta" className="space-y-6">
          {/* Meta-learning stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "新市场适应时间", value: "15分钟", prev: "45分钟", icon: Clock, color: "cyber-green" },
              { label: "知识迁移成功率", value: "92.3%", prev: "78.5%", icon: RefreshCw, color: "cyber-blue" },
              { label: "自我修复次数", value: "1,247", prev: "月均", icon: Shield, color: "cyber-amber" },
              { label: "架构自动优化", value: "38次", prev: "本季度", icon: Atom, color: "cyber-blue" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 text-${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-xl font-mono font-bold text-foreground">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{stat.prev}</p>
              </div>
            ))}
          </div>

          {/* Meta-learning capabilities */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyber-blue" />
              元学习能力矩阵
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Few-Shot Learning", desc: "仅需少量样本即可学习新币种的价格模式", level: 88, examples: "新上线币种3天内建立有效模型" },
                { name: "Transfer Learning", desc: "将已学知识迁移到新市场和新币种", level: 92, examples: "BTC模式→ETH/SOL迁移准确率92%" },
                { name: "Self-Healing", desc: "检测并自动修复模型退化和异常", level: 85, examples: "月均自动修复1,247次模型异常" },
                { name: "Architecture Search", desc: "自动搜索最优模型架构和超参数", level: 78, examples: "本季度发现38个更优架构配置" },
                { name: "Continual Learning", desc: "持续学习新数据而不遗忘旧知识", level: 90, examples: "5年数据累积学习，遗忘率<2%" },
                { name: "Multi-Task Learning", desc: "同时学习多个相关任务提升整体性能", level: 86, examples: "价格预测+风险评估+情绪分析联合学习" },
              ].map((cap) => (
                <div key={cap.name} className="bg-secondary/20 border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-foreground">{cap.name}</h5>
                    <span className={`text-xs font-mono font-bold ${
                      cap.level >= 90 ? "text-cyber-green" : cap.level >= 80 ? "text-cyber-blue" : "text-cyber-amber"
                    }`}>{cap.level}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{cap.desc}</p>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cap.level}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        cap.level >= 90 ? "bg-cyber-green" : cap.level >= 80 ? "bg-cyber-blue" : "bg-cyber-amber"
                      }`}
                    />
                  </div>
                  <p className="text-[9px] text-cyber-blue">
                    <Lightbulb className="w-3 h-3 inline mr-1" />
                    {cap.examples}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: 全币种AI覆盖 ============ */}
        <TabsContent value="coins" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyber-blue" />
              全币种AI模型覆盖状态 · {allCoins.length}+ 币种
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">币种</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">类别</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">AI模型数</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">预测准确率</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">学习进度</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">数据年限</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">最新信号</th>
                  </tr>
                </thead>
                <tbody>
                  {allCoins.map((coin, _i) => {
                    const models = coin.category === "主流币" ? 8 : coin.category === "二线币" ? 6 : 4;
                    const accuracy = coin.category === "主流币" ? 90 + Math.random() * 5 : coin.category === "二线币" ? 82 + Math.random() * 8 : 70 + Math.random() * 12;
                    const progress = Math.min(100, accuracy + Math.random() * 5);
                    const years = coin.category === "主流币" ? "5年+" : coin.category === "二线币" ? "4年+" : "2-3年";
                    const signals = ["强烈看多", "看多", "中性", "看空", "强烈看空"];
                    const signal = signals[Math.floor(Math.random() * signals.length)];
                    const signalColor = signal.includes("看多") ? "text-cyber-green" : signal === "中性" ? "text-muted-foreground" : "text-cyber-magenta";
                    return (
                      <tr key={coin.symbol} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold text-foreground">{coin.symbol}</span>
                          <span className="text-muted-foreground ml-1">{coin.name}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded-sm bg-cyber-blue/10 text-cyber-blue text-[9px]">{coin.category}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-foreground">{models}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`font-mono ${accuracy >= 90 ? "text-cyber-green" : accuracy >= 80 ? "text-cyber-blue" : "text-cyber-amber"}`}>
                            {accuracy.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-cyber-blue rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-muted-foreground">{years}</td>
                        <td className={`py-2 px-3 text-center font-mono text-[10px] ${signalColor}`}>{signal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
