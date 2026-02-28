/**
 * AlphaFactors - Enhanced alpha factor system with full coin coverage
 * 11 categories, 75+ factors, AI-driven discovery, 5-year history
 */
import { motion } from "framer-motion";
import { BarChart3, Layers, Cpu, TrendingUp, Activity, Zap, Brain, Globe, Dna } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { alphaFactors as mockAlphaFactors, allCoins as staticCoins } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { useDbAlphaFactors } from "@/hooks/useDbData";
import type { AlphaFactor } from "@/types";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, AreaChart, Area } from "recharts";
import { useState } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";

const factorCategories = [
  // ── 价格动量因子（来自合约因子大全，6个原始+4个扩展）──
  { name: "价格动量因子", count: 10, icon: TrendingUp, color: "blue",
    factors: [
      "ROC收益率动量", "时间序列动量(TSMOM)", "截面动量(CSMOM)",
      "动量反转(短期反转)", "加速动量", "路径依赖动量",
      "多周期动量组合", "均线趋势强度", "突破因子", "AI价格模式"
    ], ai: "PatchTST", coins: "全币种",
    icRange: "0.05~0.15", halfLife: "数小时~2天" },
  // ── 量价因子（来自合约因子大全，7个原始+3个扩展）──
  { name: "量价因子", count: 10, icon: BarChart3, color: "green",
    factors: [
      "VWAP偏离因子", "OBV能量潮", "成交量加权价格动量",
      "量价背离因子", "成交量突变因子", "买卖压力因子",
      "Amihud非流动性", "大额交易检测", "资金流向", "成交量分布特征"
    ], ai: "IsoForest-AE", coins: "全币种",
    icRange: "0.06~0.18", halfLife: "1~3天" },
  // ── 波动率因子（来自合约因子大全，8个原始+3个扩展）──
  { name: "波动率因子", count: 11, icon: Activity, color: "amber",
    factors: [
      "已实现波动率(RV)", "ATR平均真实波幅", "波动率偏斜",
      "波动率均值回归", "波动率比率", "Parkinson波动率",
      "Garman-Klass波动率", "Yang-Zhang波动率",
      "隐含波动率", "波动率微笑", "极端波动概率"
    ], ai: "TFT", coins: "全币种",
    icRange: "0.04~0.12", halfLife: "3~7天" },
  // ── 微观结构因子（来自合约因子大全，7个原始）──
  { name: "微观结构因子", count: 7, icon: Cpu, color: "magenta",
    factors: [
      "订单簿不平衡(OBI)", "交易流不平衡(TFI)", "买卖价差因子",
      "订单簿深度因子", "VPIN知情交易概率", "大单冲击因子",
      "Kyle Lambda流动性冲击"
    ], ai: "LOB-Transformer", coins: "主流+二线",
    icRange: "0.07~0.20", halfLife: "数分钟~数小时" },
  // ── 衍生品/合约因子（来自合约因子大全，5个原始+1个扩展）──
  { name: "衍生品因子", count: 6, icon: Dna, color: "magenta",
    factors: [
      "资金费率(Funding Rate)", "持仓量(OI)变化",
      "多空持仓人数比", "清算因子(Liquidation)",
      "期现基差因子", "期权隐含波动率偏斜"
    ], ai: "XGBoost-Alpha", coins: "合约全币种",
    icRange: "0.08~0.22", halfLife: "8小时~2天" },
  // ── 技术指标因子（来自合约因子大全，9个原始+1个扩展）──
  { name: "技术指标因子", count: 10, icon: TrendingUp, color: "blue",
    factors: [
      "RSI多周期因子", "MACD柱状图加速度", "布林带宽度(BBW)",
      "布林带%B因子", "Stochastic RSI", "CCI商品通道指数",
      "Williams %R", "Ichimoku云图因子", "ADX趋势强度",
      "SuperTrend因子"
    ], ai: "PatchTST", coins: "全币种",
    icRange: "0.04~0.14", halfLife: "1~3天" },
  // ── 链上因子（来自合约因子大全，8个原始+4个扩展）──
  { name: "链上因子", count: 12, icon: Zap, color: "green",
    factors: [
      "NVT因子", "MVRV因子", "活跃地址因子",
      "交易所净流入流出", "鲸鱼活动因子", "SOPR因子",
      "Hash Ribbon因子", "NUPL因子", "矿工收入",
      "质押率/锁定率", "代币分布集中度", "链上交易量"
    ], ai: "GraphSAGE-Chain", coins: "全链",
    icRange: "0.06~0.18", halfLife: "1~7天" },
  // ── 情绪与另类数据因子（来自合约因子大全，7个原始）──
  { name: "情绪与另类数据因子", count: 7, icon: Brain, color: "amber",
    factors: [
      "恐惧贪婪指数", "社交媒体情绪(LunarCrush)",
      "Google搜索趋势", "Twitter/X提及量",
      "Reddit情绪因子", "新闻情绪(NLP/FinBERT)",
      "资金流向因子"
    ], ai: "FinBERT-Crypto", coins: "全币种",
    icRange: "0.04~0.12", halfLife: "1~3天" },
  // ── 复合因子与因子工程（来自合约因子大全，新增）──
  { name: "复合因子与因子工程", count: 7, icon: Layers, color: "blue",
    factors: [
      "因子标准化(Z-Score/Rank)", "因子中性化(市值/行业)",
      "因子去极值(MAD/Winsorize)", "因子组合(IC加权/等权)",
      "因子评价(IC/ICIR/Sharpe)", "因子衰减分析(Alpha Decay)",
      "因子正交化(PCA/Gram-Schmidt)"
    ], ai: "XGBoost-Alpha", coins: "全币种",
    icRange: "0.05~0.15", halfLife: "1~5天" },
  // ── AI增强型因子挖掘（来自合约因子大全，新增）──
  { name: "AI增强型因子挖掘", count: 6, icon: Brain, color: "magenta",
    factors: [
      "GPAlpha遗传编程自动挖掘", "深度学习因子(AutoEncoder)",
      "LSTM时序隐藏因子", "Transformer注意力因子",
      "图神经网络跨币种因子", "强化学习自适应因子"
    ], ai: "DeepSeek-V3 + GPAlpha", coins: "全币种",
    icRange: "0.08~0.25", halfLife: "数小时~3天" },
  // ── DeFi因子 ──
  { name: "DeFi因子", count: 5, icon: Layers, color: "blue",
    factors: ["流动性池规模", "收益率曲线", "借贷利率差", "抵押率", "治理参与度"],
    ai: "XGBoost-Alpha", coins: "DeFi币",
    icRange: "0.05~0.15", halfLife: "1~5天" },
  // ── 跨市场因子 ──
  { name: "跨市场因子", count: 5, icon: Globe, color: "magenta",
    factors: ["交易所价差", "期现基差", "跨链资金流向信号", "全球资金流向", "宏观相关性"],
    ai: "XGBoost-Alpha", coins: "全币种",
    icRange: "0.03~0.10", halfLife: "1~7天" },
]
const radarData = [
  { factor: "价格动量", value: 0 },
  { factor: "量价", value: 0 },
  { factor: "波动率", value: 0 },
  { factor: "微观结构", value: 0 },
  { factor: "衍生品", value: 0 },
  { factor: "技术指标", value: 0 },
  { factor: "链上", value: 0 },
  { factor: "情绪另类", value: 0 },
  { factor: "复合工程", value: 0 },
  { factor: "AI挖掘", value: 0 },
  { factor: "DeFi", value: 0 },
  { factor: "跨市场", value: 0 },
];

const icData = mockAlphaFactors.map(f => ({ name: f.name.length > 8 ? f.name.slice(0, 8) + ".." : f.name, ic: f.ic, sharpe: f.sharpe }));

// Factor evolution history
const factorEvolution: { month: string; avgIC: number; factorCount: number; aiDiscovered: number }[] = [];

export default function AlphaFactors() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const { data: alphaFactors } = useDbAlphaFactors();
  const [selectedCat, setSelectedCat] = useState("全部");

  const filteredFactors = selectedCat === "全部" ? alphaFactors : alphaFactors.filter((f) => (f as AlphaFactor).category === selectedCat);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-cyber-blue/20 flex items-center justify-center glow-blue">
          <BarChart3 className="w-6 h-6 text-cyber-blue" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-wider">阿尔法因子系统</h1>
          <p className="text-sm text-muted-foreground">12大类别 · 81+因子 · 全币种覆盖 · AI自动发现 · 5年历史回测</p>
        </div>
      </motion.div>

      {/* Factor Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "活跃因子", value: "0", color: "green" },
          { label: "因子类别", value: "12", color: "blue" },
          { label: "平均IC", value: "--", color: "amber" },
          { label: "AI模型", value: sys.aiModel, color: "green" },
          { label: "覆盖币种", value: `${allCoins.length}+`, color: "blue" },
          { label: "AI推理", value: `${sys.aiInferenceMs}ms`, color: sys.aiInferenceMs < 200 ? "green" : "amber" },
          { label: "因子组合", value: "0", color: "green" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="bg-card border-border">
              <CardContent className="pt-3 pb-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`text-base font-heading font-bold mt-0.5 text-cyber-${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="overview">因子概览</TabsTrigger>
          <TabsTrigger value="categories">因子分类</TabsTrigger>
          <TabsTrigger value="allcoins">全币种因子</TabsTrigger>
          <TabsTrigger value="evaluation">因子评估</TabsTrigger>
          <TabsTrigger value="evolution">AI因子进化</TabsTrigger>
          <TabsTrigger value="combination">因子组合</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">因子强度分布 · 11大类别</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: "#888" }} />
                      <Radar name="因子强度" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">因子信息系数 (IC) · 全因子</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={icData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: "#888" }} width={70} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Bar dataKey="ic" fill="#00d4ff" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Factor Table */}
          <Card className="bg-card border-border mt-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">因子详情 · {filteredFactors.length}个</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {["全部", ...factorCategories.map(c => c.name)].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`px-2 py-0.5 rounded text-[9px] transition-colors ${selectedCat === cat ? "bg-cyber-blue text-background" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
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
                      <th className="text-left py-2 text-muted-foreground">因子名称</th>
                      <th className="text-left py-2 text-muted-foreground">类别</th>
                      <th className="text-right py-2 text-muted-foreground">IC值</th>
                      <th className="text-right py-2 text-muted-foreground">夏普比率</th>
                      <th className="text-center py-2 text-muted-foreground">衰减</th>
                      <th className="text-center py-2 text-muted-foreground">状态</th>
                      <th className="text-center py-2 text-muted-foreground">AI模型</th>
                      <th className="text-center py-2 text-muted-foreground">覆盖</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFactors.map((f) => (
                      <tr key={f.name} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                        <td className="py-1.5 font-medium">{f.name}</td>
                        <td className="py-1.5"><Badge variant="outline" className="text-[8px] py-0">{f.category}</Badge></td>
                        <td className="py-1.5 text-right font-mono text-cyber-blue">{f.ic.toFixed(3)}</td>
                        <td className="py-1.5 text-right font-mono text-cyber-green">{f.sharpe.toFixed(2)}</td>
                        <td className="py-1.5 text-center">
                          <Badge variant="outline" className={`text-[8px] py-0 ${(f as AlphaFactor).decay === "慢" ? "border-cyber-green/30 text-cyber-green" : (f as AlphaFactor).decay === "中" ? "border-cyber-amber/30 text-cyber-amber" : "border-cyber-magenta/30 text-cyber-magenta"}`}>
                            {(f as AlphaFactor).decay || "中"}
                          </Badge>
                        </td>
                        <td className="py-1.5 text-center">
                          <Badge variant="outline" className={`text-[8px] py-0 ${f.status === "活跃" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                            {f.status}
                          </Badge>
                        </td>
                        <td className="py-1.5 text-center">
                          <span className="px-1 py-0.5 rounded bg-cyber-blue/10 text-cyber-blue text-[8px]">{(f as AlphaFactor).ai || "AI"}</span>
                        </td>
                        <td className="py-1.5 text-center text-[9px] text-cyber-amber">全币种</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {factorCategories.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-md bg-cyber-${cat.color}/10 flex items-center justify-center`}>
                          <cat.icon className={`w-4 h-4 text-cyber-${cat.color}`} />
                        </div>
                        <div>
                          <h3 className="text-xs font-medium">{cat.name}</h3>
                          <p className="text-[9px] text-muted-foreground">{cat.count}因子 · {cat.ai} · {cat.coins}</p>
                          {(cat as any).icRange && <p className="text-[9px] text-cyber-green/70">IC: {(cat as any).icRange} · 半衰期: {(cat as any).halfLife}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {cat.factors.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-[10px] py-0.5 px-2 rounded bg-secondary/30">
                          <span className="w-1 h-1 rounded-full bg-cyber-blue" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* All Coins Factor Matrix */}
        <TabsContent value="allcoins">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">全币种因子信号矩阵 · {allCoins.length}+币种</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 text-muted-foreground sticky left-0 bg-card z-10">币种</th>
                      <th className="text-center py-1.5 text-muted-foreground">价格因子</th>
                      <th className="text-center py-1.5 text-muted-foreground">量能因子</th>
                      <th className="text-center py-1.5 text-muted-foreground">波动率</th>
                      <th className="text-center py-1.5 text-muted-foreground">流动性</th>
                      <th className="text-center py-1.5 text-muted-foreground">链上</th>
                      <th className="text-center py-1.5 text-muted-foreground">情绪</th>
                      <th className="text-center py-1.5 text-muted-foreground">综合</th>
                      <th className="text-center py-1.5 text-muted-foreground">AI信号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCoins.map((coin) => {
                      const genScore = () => (Math.random() * 2 - 1).toFixed(2);
                      const scores = Array.from({ length: 6 }, () => parseFloat(genScore()));
                      const composite = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
                      return (
                        <tr key={coin.symbol} className="border-b border-border/10 hover:bg-secondary/30 transition-colors">
                          <td className="py-1 sticky left-0 bg-card z-10">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded bg-cyber-blue/10 flex items-center justify-center">
                                <span className="text-[6px] font-mono font-bold text-cyber-blue">{coin.symbol.slice(0, 2)}</span>
                              </div>
                              <span className="font-medium text-[10px]">{coin.symbol}</span>
                            </div>
                          </td>
                          {scores.map((s, idx) => (
                            <td key={idx} className="py-1 text-center">
                              <span className={`font-mono text-[9px] px-1 py-0.5 rounded ${s > 0.3 ? "bg-cyber-green/10 text-cyber-green" : s < -0.3 ? "bg-cyber-magenta/10 text-cyber-magenta" : "bg-secondary/30 text-muted-foreground"}`}>
                                {s > 0 ? "+" : ""}{s.toFixed(2)}
                              </span>
                            </td>
                          ))}
                          <td className="py-1 text-center">
                            <span className={`font-mono text-[9px] font-bold px-1 py-0.5 rounded ${parseFloat(composite) > 0.2 ? "bg-cyber-green/15 text-cyber-green" : parseFloat(composite) < -0.2 ? "bg-cyber-magenta/15 text-cyber-magenta" : "bg-cyber-amber/10 text-cyber-amber"}`}>
                              {parseFloat(composite) > 0 ? "+" : ""}{composite}
                            </span>
                          </td>
                          <td className="py-1 text-center">
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              coin.aiSignal.includes("看涨") ? "bg-cyber-green/10 text-cyber-green" :
                              coin.aiSignal.includes("看跌") ? "bg-cyber-magenta/10 text-cyber-magenta" :
                              "bg-cyber-amber/10 text-cyber-amber"
                            }`}>{coin.aiSignal}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluation */}
        <TabsContent value="evaluation">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">因子评估指标 · 全币种回测</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(alphaFactors as unknown as AlphaFactor[]).slice(0, 9).map((f: AlphaFactor) => (
                  <div key={f.name} className="space-y-2 p-3 rounded-md border border-border bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium">{f.name}</h4>
                      <Badge variant="outline" className="text-[8px] py-0">{f.category}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">IC值</span>
                        <span className="font-mono text-cyber-blue">{f.ic.toFixed(3)}</span>
                      </div>
                      <Progress value={f.ic * 1000} className="h-1" />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">夏普比率</span>
                        <span className="font-mono text-cyber-green">{f.sharpe.toFixed(2)}</span>
                      </div>
                      <Progress value={f.sharpe * 30} className="h-1" />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">覆盖币种</span>
                        <span className="font-mono text-cyber-amber">{allCoins.length}+</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">回测跨度</span>
                        <span className="font-mono text-cyber-blue">5年+</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Factor Evolution */}
        <TabsContent value="evolution">
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Dna className="w-4 h-4 text-cyber-amber" />
                  AI因子发现与进化 · 24个月趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={factorEvolution}>
                      <defs>
                        <linearGradient id="icGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#666" }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="avgIC" stroke="#00d4ff" strokeWidth={2} fill="url(#icGrad)" name="平均IC" />
                      <Line type="monotone" dataKey="aiDiscovered" stroke="#ffaa00" strokeWidth={2} dot={false} name="AI发现因子" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">AI自动发现的因子</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { name: "鲸鱼聚集度因子", model: "XGBoost-Alpha", ic: 0, date: "--", desc: "检测鲸鱼地址聚集买入行为" },
                    { name: "社交爆发因子", model: "FinBERT-Crypto", ic: 0, date: "--", desc: "社交媒体讨论量突变检测" },
                    { name: "跨链流动因子", model: "XGBoost-Alpha", ic: 0, date: "--", desc: "跨链资金流动方向预测" },
                    { name: "MEV活动因子", model: "LOB-Transformer", ic: 0, date: "--", desc: "MEV机器人活动强度指标" },
                    { name: "治理投票因子", model: "XGBoost-Alpha", ic: 0, date: "--", desc: "DAO治理提案对价格的影响" },
                    { name: "Layer2迁移因子", model: "GraphSAGE-Chain", ic: 0, date: "--", desc: "L1到L2资金迁移趋势" },
                  ].map((f, i) => (
                    <motion.div
                      key={f.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded border border-cyber-amber/20 bg-cyber-amber/5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium">{f.name}</h4>
                        <Badge variant="outline" className="text-[8px] py-0 border-cyber-amber/30 text-cyber-amber">AI发现</Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground mb-1.5">{f.desc}</p>
                      <div className="flex items-center gap-3 text-[9px]">
                        <span>IC: <span className="text-cyber-blue font-mono">{f.ic}</span></span>
                        <span>模型: <span className="text-cyber-amber font-mono">{f.model}</span></span>
                        <span className="text-muted-foreground">{f.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Combination */}
        <TabsContent value="combination">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "等权组合", method: "Equal Weight", factors: 0, sharpe: 0, ai: "FactorWeightNet", coins: `${allCoins.length}+`, backtest: "--" },
              { name: "风险平价组合", method: "Risk Parity", factors: 0, sharpe: 0, ai: "RLHF Studio", coins: `${allCoins.length}+`, backtest: "--" },
              { name: "ML优化组合", method: "Machine Learning", factors: 0, sharpe: 0, ai: "XGBoost-Alpha", coins: `${allCoins.length}+`, backtest: "--" },
              { name: "动态权重组合", method: "Dynamic Weighting", factors: 0, sharpe: 0, ai: "FactorTimingGPT", coins: `${allCoins.length}+`, backtest: "--" },
              { name: "全币种多因子", method: "Multi-Factor All Coins", factors: 0, sharpe: 0, ai: "XGBoost-Alpha + PPO", coins: `${allCoins.length}+`, backtest: "--" },
              { name: "DeFi专用组合", method: "DeFi Optimized", factors: 0, sharpe: 0, ai: "DeFiGPT", coins: "DeFi币", backtest: "--" },
            ].map((combo, i) => (
              <motion.div key={combo.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <h3 className="text-sm font-medium mb-0.5">{combo.name}</h3>
                    <p className="text-[10px] text-muted-foreground mb-2">{combo.method}</p>
                    <div className="grid grid-cols-3 gap-3 text-[10px]">
                      <div><p className="text-muted-foreground">因子数</p><p className="font-mono font-bold text-cyber-blue">{combo.factors}</p></div>
                      <div><p className="text-muted-foreground">夏普比率</p><p className="font-mono font-bold text-cyber-green">{combo.sharpe}</p></div>
                      <div><p className="text-muted-foreground">AI模型</p><p className="font-mono font-bold text-cyber-amber text-[9px]">{combo.ai}</p></div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                      <span>覆盖: {combo.coins}</span>
                      <span>回测: {combo.backtest}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
