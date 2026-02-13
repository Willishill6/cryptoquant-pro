/**
 * Strategies - Enhanced strategy management system
 * DeFi strategy types, profit attribution analysis, full coin coverage,
 * AI strategy generation, comprehensive backtesting, strategy evolution
 * Design: Cyberpunk terminal dark theme
 */
import { useState, useMemo } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { motion, AnimatePresence } from "framer-motion";
import StrategyParamPanel from "@/components/StrategyParamPanel";
import SankeyChart from "@/components/SankeyChart";
import Sparkline from "@/components/Sparkline";
import AlertStream from "@/components/AlertStream";
import PortfolioOptimizer from "@/components/PortfolioOptimizer";
import { TrendingUp, Play, Pause, BarChart3, Code, Brain, Sparkles, Plus, GitBranch, Dna, Target, Layers, Activity, PieChart, ArrowUpDown, Droplets, Landmark, Coins, Wallet, ShieldCheck, Repeat, Zap, SlidersHorizontal, Workflow, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { strategies as mockStrategies, formatCurrency, allCoins as staticCoins } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { useDbStrategies } from "@/hooks/useDbData";
import type { Strategy } from "@/types";
import { toast } from "sonner";
import { ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, Cell, PieChart as RPieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

// ─── Strategy Categories (with expanded DeFi) ─────────────────────
const strategyCategories = [
  {
    name: "基础策略库", count: 5, icon: "📊", desc: "经典量化策略，适合稳健运行",
    items: [
      { name: "网格交易策略", coins: "全币种", risk: "低", sharpe: 1.85, desc: "在价格区间内自动挂单买卖" },
      { name: "趋势跟随策略", coins: "全币种", risk: "中", sharpe: 2.12, desc: "跟随市场趋势方向交易" },
      { name: "均值回归策略", coins: "全币种", risk: "中", sharpe: 1.95, desc: "价格偏离均值时反向交易" },
      { name: "做市商策略", coins: "主流币", risk: "低", sharpe: 2.45, desc: "双向挂单赚取买卖价差" },
      { name: "TWAP/VWAP执行", coins: "全币种", risk: "低", sharpe: 1.65, desc: "大额订单时间/成交量加权执行" },
    ],
  },
  {
    name: "DeFi策略库", count: 12, icon: "🔗", desc: "去中心化金融全链路策略，覆盖流动性、借贷、衍生品等",
    items: [
      { name: "流动性提供策略", coins: "DeFi全币种", risk: "中", sharpe: 2.35, desc: "Uniswap/Curve等DEX LP仓位管理，自动调整价格区间" },
      { name: "集中流动性优化", coins: "DeFi全币种", risk: "中", sharpe: 2.65, desc: "Uni V3集中流动性区间动态调整，最大化手续费收入" },
      { name: "借贷利率策略", coins: "稳定币+主流币", risk: "低", sharpe: 1.95, desc: "Aave/Compound跨协议利率差收益，自动搬砖" },
      { name: "杠杆循环借贷", coins: "ETH/stETH", risk: "高", sharpe: 2.85, desc: "利用stETH/ETH低利差循环借贷放大收益" },
      { name: "收益聚合策略", coins: "全DeFi", risk: "低", sharpe: 2.15, desc: "Yearn风格多协议收益自动聚合，最优路径选择" },
      { name: "稳定币收益策略", coins: "稳定币", risk: "低", sharpe: 1.85, desc: "USDT/USDC/DAI跨协议稳定收益，年化8-15%" },
      { name: "永续合约资金费率", coins: "全币种", risk: "中", sharpe: 3.15, desc: "dYdX/GMX资金费率收割，Delta中性对冲" },
      { name: "期权策略(DeFi)", coins: "BTC/ETH", risk: "高", sharpe: 2.45, desc: "Lyra/Dopex链上期权策略，波动率交易" },
      { name: "MEV保护策略", coins: "全币种", risk: "中", sharpe: 2.25, desc: "Flashbots集成，防三明治攻击，优化Gas" },
      { name: "跨链桥收益策略", coins: "多链资产", risk: "中", sharpe: 2.05, desc: "利用跨链桥流动性差异获取收益" },
      { name: "LSD收益策略", coins: "ETH/SOL", risk: "低", sharpe: 2.55, desc: "Lido/Rocket Pool质押衍生品收益优化" },
      { name: "RWA收益策略", coins: "RWA代币", risk: "低", sharpe: 1.75, desc: "真实世界资产代币化收益，国债/房产/商品" },
    ],
  },
  {
    name: "阿尔法策略库", count: 8, icon: "🎯", desc: "基于阿尔法因子的超额收益策略",
    items: [
      { name: "多因子动量策略", coins: "全币种", risk: "中", sharpe: 2.85, desc: "融合价格/成交量/波动率多因子" },
      { name: "价值因子策略", coins: "全币种", risk: "中", sharpe: 2.35, desc: "基于基本面价值因子选币" },
      { name: "质量因子策略", coins: "全币种", risk: "低", sharpe: 2.15, desc: "选择高质量项目长期持有" },
      { name: "技术因子策略", coins: "全币种", risk: "中", sharpe: 2.55, desc: "技术指标组合信号交易" },
      { name: "事件驱动策略", coins: "全币种", risk: "高", sharpe: 3.15, desc: "基于新闻/公告事件快速交易" },
      { name: "DeFi收益因子", coins: "DeFi币", risk: "中", sharpe: 2.75, desc: "DeFi协议TVL/收益率因子驱动" },
      { name: "链上因子策略", coins: "全币种", risk: "中", sharpe: 2.45, desc: "基于链上数据因子交易" },
      { name: "情绪因子策略", coins: "全币种", risk: "高", sharpe: 2.65, desc: "社交媒体情绪驱动交易" },
    ],
  },
  {
    name: "AI高级策略库", count: 10, icon: "🧠", desc: "AI驱动的自适应策略，自我学习进化",
    items: [
      { name: "深度学习预测策略", coins: "全币种", risk: "中", sharpe: 3.12, desc: "TFT/PatchTST价格预测" },
      { name: "强化学习自适应", coins: "全币种", risk: "中", sharpe: 2.89, desc: "RL Agent自动学习最优策略" },
      { name: "DeepSeek-V3策略生成", coins: "全币种", risk: "中", sharpe: 2.95, desc: "自然语言描述自动生成策略" },
      { name: "多模态融合策略", coins: "全币种", risk: "高", sharpe: 3.35, desc: "融合文本/图表/数据多模态" },
      { name: "元学习自适应", coins: "全币种", risk: "中", sharpe: 2.78, desc: "快速适应新市场环境" },
      { name: "GAN对抗训练策略", coins: "全币种", risk: "高", sharpe: 2.65, desc: "生成对抗网络优化策略" },
      { name: "图神经网络策略", coins: "全币种", risk: "中", sharpe: 2.92, desc: "币种关联图谱分析" },
      { name: "因果推断策略", coins: "全币种", risk: "中", sharpe: 2.55, desc: "因果关系驱动交易决策" },
      { name: "联邦学习策略", coins: "全币种", risk: "低", sharpe: 2.35, desc: "多数据源联合训练" },
      { name: "量子计算辅助策略", coins: "全币种", risk: "高", sharpe: 2.15, desc: "量子优化组合权重" },
    ],
  },
];

// ─── Backtest Results ──────────────────────────────────────────────
const backtestResults = [
  { name: "BTC网格策略(5年)", period: "2021-01 ~ 2026-02", coins: "BTC", totalReturn: 156.8, annReturn: 20.5, sharpe: 2.45, maxDrawdown: -12.3, winRate: 68.5, trades: 14520, profitFactor: 2.12, calmar: 1.67, status: "完成" },
  { name: "全币种动量策略(4年)", period: "2022-01 ~ 2026-02", coins: "全币种(180+)", totalReturn: 234.5, annReturn: 35.2, sharpe: 3.12, maxDrawdown: -8.7, winRate: 72.1, trades: 48920, profitFactor: 2.85, calmar: 4.05, status: "完成" },
  { name: "AI深度学习预测(3年)", period: "2023-01 ~ 2026-02", coins: "全币种(200+)", totalReturn: 189.2, annReturn: 42.5, sharpe: 2.89, maxDrawdown: -15.2, winRate: 71.3, trades: 23450, profitFactor: 2.45, calmar: 2.80, status: "完成" },
  { name: "DeFi流动性提供(2年)", period: "2024-01 ~ 2026-02", coins: "DeFi(45+)", totalReturn: 85.6, annReturn: 38.5, sharpe: 4.25, maxDrawdown: -3.2, winRate: 82.4, trades: 62500, profitFactor: 4.12, calmar: 12.03, status: "完成" },
  { name: "多因子Alpha策略(5年)", period: "2021-01 ~ 2026-02", coins: "全币种(150+)", totalReturn: 312.5, annReturn: 32.8, sharpe: 2.95, maxDrawdown: -18.5, winRate: 65.2, trades: 35800, profitFactor: 2.35, calmar: 1.77, status: "完成" },
  { name: "强化学习自适应(2年)", period: "2024-01 ~ 2026-02", coins: "全币种(250+)", totalReturn: 125.8, annReturn: 50.2, sharpe: 3.45, maxDrawdown: -10.5, winRate: 74.8, trades: 18200, profitFactor: 3.25, calmar: 4.78, status: "运行中" },
  { name: "LSD收益策略(1年)", period: "2025-01 ~ 2026-02", coins: "ETH/SOL", totalReturn: 42.5, annReturn: 36.8, sharpe: 5.12, maxDrawdown: -2.1, winRate: 88.5, trades: 45200, profitFactor: 5.85, calmar: 17.52, status: "运行中" },
  { name: "永续资金费率(1年)", period: "2025-01 ~ 2026-02", coins: "全币种(120+)", totalReturn: 52.3, annReturn: 45.2, sharpe: 4.85, maxDrawdown: -1.8, winRate: 91.2, trades: 38500, profitFactor: 6.25, calmar: 25.11, status: "运行中" },
];

// ─── Profit Attribution Data ───────────────────────────────────────
const profitAttributionByStrategy = [
  { name: "网格交易", value: 18500, color: "#00ff88" },
  { name: "趋势跟随", value: 12800, color: "#00d4ff" },
  { name: "DeFi流动性", value: 15200, color: "#f5a623" },
  { name: "资金费率", value: 8900, color: "#ff3388" },
  { name: "AI预测", value: 22500, color: "#9b59b6" },
  { name: "多因子Alpha", value: 16800, color: "#1abc9c" },
  { name: "LSD收益", value: 6500, color: "#e74c3c" },
  { name: "借贷利率", value: 4200, color: "#3498db" },
];

const profitAttributionBySource = [
  { name: "价格变动收益", value: 42500, pct: 40.2, color: "#00ff88" },
  { name: "手续费/利息收入", value: 22800, pct: 21.6, color: "#00d4ff" },
  { name: "资金费率收益", value: 15600, pct: 14.8, color: "#f5a623" },
  { name: "流动性提供收益", value: 12400, pct: 11.7, color: "#ff3388" },
  { name: "质押/LSD收益", value: 8200, pct: 7.8, color: "#9b59b6" },
  { name: "其他(空投等)", value: 4100, pct: 3.9, color: "#1abc9c" },
];

const profitAttributionByCoin = [
  { name: "BTC", value: 28500, pct: 27.0 },
  { name: "ETH", value: 22300, pct: 21.1 },
  { name: "SOL", value: 15800, pct: 15.0 },
  { name: "BNB", value: 8500, pct: 8.0 },
  { name: "LINK", value: 5200, pct: 4.9 },
  { name: "ARB", value: 4800, pct: 4.5 },
  { name: "AVAX", value: 3900, pct: 3.7 },
  { name: "DOGE", value: 3200, pct: 3.0 },
  { name: "其他(39币种)", value: 13400, pct: 12.7 },
];

const monthlyProfitAttribution = Array.from({ length: 12 }, (_, i) => {
  const base = 5000 + Math.random() * 3000;
  return {
    month: `${2025}/${String(i + 1).padStart(2, "0")}`,
    网格交易: Math.round(base * (0.15 + Math.random() * 0.1)),
    趋势跟随: Math.round(base * (0.1 + Math.random() * 0.08)),
    DeFi流动性: Math.round(base * (0.12 + Math.random() * 0.1)),
    资金费率: Math.round(base * (0.08 + Math.random() * 0.06)),
    AI预测: Math.round(base * (0.18 + Math.random() * 0.12)),
    多因子Alpha: Math.round(base * (0.13 + Math.random() * 0.08)),
  };
});

const strategyRiskReturn = [
  { name: "网格交易", return: 18.5, risk: 5.2, sharpe: 1.85, size: 15 },
  { name: "趋势跟随", return: 25.3, risk: 12.8, sharpe: 2.12, size: 12 },
  { name: "DeFi流动性", return: 32.5, risk: 8.5, sharpe: 2.65, size: 18 },
  { name: "资金费率", return: 45.2, risk: 1.8, sharpe: 4.85, size: 10 },
  { name: "AI预测", return: 42.5, risk: 15.2, sharpe: 2.89, size: 22 },
  { name: "多因子Alpha", return: 32.8, risk: 18.5, sharpe: 2.95, size: 16 },
  { name: "LSD收益", return: 36.8, risk: 2.1, sharpe: 5.12, size: 8 },
  { name: "借贷利率", return: 12.5, risk: 2.8, sharpe: 1.95, size: 6 },
  { name: "均值回归", return: 22.8, risk: 10.5, sharpe: 1.95, size: 10 },
];

const strategyCorrelation = [
  { strategy: "网格", 网格: 1.0, 趋势: -0.15, DeFi: 0.08, 费率: 0.05, AI: 0.12, Alpha: 0.18 },
  { strategy: "趋势", 网格: -0.15, 趋势: 1.0, DeFi: 0.22, 费率: -0.08, AI: 0.45, Alpha: 0.52 },
  { strategy: "DeFi", 网格: 0.08, 趋势: 0.22, DeFi: 1.0, 费率: 0.35, AI: 0.18, Alpha: 0.25 },
  { strategy: "费率", 网格: 0.05, 趋势: -0.08, DeFi: 0.35, 费率: 1.0, AI: -0.05, Alpha: 0.02 },
  { strategy: "AI", 网格: 0.12, 趋势: 0.45, DeFi: 0.18, 费率: -0.05, AI: 1.0, Alpha: 0.68 },
  { strategy: "Alpha", 网格: 0.18, 趋势: 0.52, DeFi: 0.25, 费率: 0.02, AI: 0.68, Alpha: 1.0 },
];

const radarData = [
  { metric: "收益率", 当前组合: 85, 基准: 45 },
  { metric: "Sharpe", 当前组合: 92, 基准: 50 },
  { metric: "胜率", 当前组合: 78, 基准: 55 },
  { metric: "回撤控制", 当前组合: 88, 基准: 40 },
  { metric: "稳定性", 当前组合: 82, 基准: 60 },
  { metric: "多样化", 当前组合: 90, 基准: 35 },
];

// Backtest equity curve
const equityCurve = Array.from({ length: 60 }, (_, i) => ({
  month: `M${i + 1}`,
  strategy: 100000 * Math.pow(1 + 0.025 + Math.random() * 0.02, i),
  benchmark: 100000 * Math.pow(1 + 0.008 + Math.random() * 0.015, i),
}));


export default function Strategies() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const { data: dbStrategies } = useDbStrategies();
  const strategies = dbStrategies as unknown as Strategy[];
  const [activeTab, setActiveTab] = useState("active");
  const [selectedStrategy, setSelectedStrategy] = useState<(typeof strategies)[0] | null>(null);

  // Generate stable sparkline data for each strategy (seeded by strategy id)
  const sparklineData = useMemo(() => {
    return strategies.map((s) => {
      const seed = s.id * 17 + s.name.charCodeAt(0) + s.name.charCodeAt(s.name.length - 1);
      const points: number[] = [];
      let val = 100;
      for (let i = 0; i < 30; i++) {
        const noise = Math.sin(seed * 13.7 + i * 2.3) * 8 + Math.cos(seed * 7.1 + i * 1.1) * 5;
        const trend = s.pnl >= 0 ? 0.3 : -0.2;
        val += trend + noise * 0.3;
        points.push(val);
      }
      // Ensure the final direction matches PnL sign
      if (s.pnl >= 0 && points[points.length - 1] < points[0]) {
        points.reverse();
      } else if (s.pnl < 0 && points[points.length - 1] > points[0]) {
        points.reverse();
      }
      return points;
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-cyber-green/20 flex items-center justify-center glow-green">
            <TrendingUp className="w-6 h-6 text-cyber-green" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wider">策略系统</h1>
            <p className="text-sm text-muted-foreground">全币种策略 · DeFi策略12种 · AI策略生成 · 5年回测 · 收益归因分析</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("AI策略生成器即将上线")}>
            <Sparkles className="w-4 h-4 mr-1" />AI生成策略
          </Button>
          <Button size="sm" className="bg-cyber-blue hover:bg-cyber-blue/80 text-background" onClick={() => toast.info("策略编辑器即将上线")}>
            <Plus className="w-4 h-4 mr-1" />新建策略
          </Button>
        </div>
      </motion.div>

      {/* Strategy Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "活跃策略", value: `${sys.activeStrategies}/${sys.totalStrategies}`, color: "green" },
          { label: "策略总数", value: "35", color: "blue" },
          { label: "DeFi策略", value: "12", color: "amber" },
          { label: "覆盖币种", value: `${allCoins.length}+`, color: "blue" },
          { label: "平均胜率", value: "72.3%", color: "green" },
          { label: "平均Sharpe", value: "2.85", color: "blue" },
          { label: "今日盈亏", value: `${sys.dailyPnl >= 0 ? '+' : ''}$${Math.abs(sys.dailyPnl).toLocaleString(undefined, {maximumFractionDigits: 0})}`, color: sys.dailyPnl >= 0 ? "green" : "magenta" },
          { label: "AI模型", value: sys.aiModel, color: "amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="bg-card border-border">
              <CardContent className="pt-3 pb-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`text-base font-heading font-bold mt-0.5 ${stat.color === "green" ? "text-cyber-green" : stat.color === "blue" ? "text-cyber-blue" : "text-cyber-amber"}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-border flex-wrap">
          <TabsTrigger value="active" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Activity className="w-4 h-4 mr-1" />活跃策略</TabsTrigger>
          <TabsTrigger value="defi" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Droplets className="w-4 h-4 mr-1" />DeFi策略(12)</TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Layers className="w-4 h-4 mr-1" />策略库(35)</TabsTrigger>
          <TabsTrigger value="attribution" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><PieChart className="w-4 h-4 mr-1" />收益归因</TabsTrigger>
          <TabsTrigger value="backtest" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><BarChart3 className="w-4 h-4 mr-1" />回测引擎</TabsTrigger>
          <TabsTrigger value="evolution" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Dna className="w-4 h-4 mr-1" />策略进化</TabsTrigger>
          <TabsTrigger value="editor" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Code className="w-4 h-4 mr-1" />编辑器</TabsTrigger>
          <TabsTrigger value="optimizer" className="data-[state=active]:bg-cyber-blue/15 data-[state=active]:text-cyber-blue"><Target className="w-4 h-4 mr-1" />组合优化</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-cyber-magenta/15 data-[state=active]:text-cyber-magenta"><Bell className="w-4 h-4 mr-1" />实时告警</TabsTrigger>
        </TabsList>

        {/* ═══ Active Strategies ═══ */}
        <TabsContent value="active">
          <div className="space-y-3">
            {strategies.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${s.status === "运行中" ? "bg-cyber-green/10" : "bg-cyber-amber/10"}`}>
                          {s.status === "运行中" ? <Play className="w-4 h-4 text-cyber-green" /> : <Pause className="w-4 h-4 text-cyber-amber" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-sm">{s.name}</h3>
                            <Badge variant="outline" className="text-[9px] py-0 border-cyber-blue/30 text-cyber-blue">{s.type}</Badge>
                            <Badge variant="outline" className={`text-[9px] py-0 ${s.risk === "高" ? "border-cyber-magenta/30 text-cyber-magenta" : s.risk === "中" ? "border-cyber-amber/30 text-cyber-amber" : "border-cyber-green/30 text-cyber-green"}`}>
                              风险:{s.risk}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>币种: {s.coins.join(", ")}</span>
                            <span>AI: <span className="text-cyber-amber">{s.ai}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px]">
                        {/* Mini PnL Sparkline */}
                        <div className="text-center">
                          <p className="text-muted-foreground mb-0.5">30日走势</p>
                          <Sparkline
                            data={sparklineData[i]}
                            width={100}
                            height={28}
                            showArea={true}
                            showDot={true}
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">盈亏</p>
                          <p className={`font-mono font-bold text-sm ${s.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {s.pnl >= 0 ? "+" : ""}{formatCurrency(s.pnl)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">胜率</p>
                          <p className="font-mono font-bold">{s.winRate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Sharpe</p>
                          <p className="font-mono font-bold text-cyber-blue">{s.sharpe}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">交易</p>
                          <p className="font-mono font-bold">{s.trades.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] border-cyber-blue/30 hover:bg-cyber-blue/10" onClick={() => setSelectedStrategy(s)}>
                            <SlidersHorizontal className="w-3 h-3 mr-1" />参数调节
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { setSelectedStrategy(s); }}>
                            <BarChart3 className="w-3 h-3 mr-1" />回测
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ DeFi Strategies (NEW) ═══ */}
        <TabsContent value="defi">
          <div className="space-y-4">
            {/* DeFi Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "DeFi策略数", value: "12", icon: Droplets, color: "blue" },
                { label: "活跃协议", value: "18", icon: Zap, color: "green" },
                { label: "覆盖链数", value: "8", icon: Repeat, color: "amber" },
                { label: "TVL监控", value: "$42.8B", icon: Landmark, color: "blue" },
                { label: "DeFi收益", value: "+$35,200", icon: Coins, color: "green" },
                { label: "平均APY", value: "18.5%", icon: TrendingUp, color: "amber" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="bg-card border-border">
                    <CardContent className="pt-3 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <stat.icon className={`w-3.5 h-3.5 ${stat.color === "green" ? "text-cyber-green" : stat.color === "blue" ? "text-cyber-blue" : "text-cyber-amber"}`} />
                      </div>
                      <p className={`text-base font-heading font-bold ${stat.color === "green" ? "text-cyber-green" : stat.color === "blue" ? "text-cyber-blue" : "text-cyber-amber"}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* DeFi Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {strategyCategories[1].items.map((item, i) => {
                const icons = [Droplets, Target, Landmark, ArrowUpDown, Layers, Coins, Repeat, ShieldCheck, Zap, Repeat, Wallet, Landmark];
                const Icon = icons[i % icons.length];
                const apys = [12.5, 18.2, 8.5, 22.8, 15.3, 9.8, 35.2, 28.5, 6.2, 11.5, 14.8, 7.2];
                const tvls = ["$580M", "$320M", "$2.1B", "$180M", "$1.5B", "$850M", "$420M", "$95M", "$250M", "$180M", "$3.2B", "$450M"];
                return (
                  <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="bg-card border-border hover:border-cyber-blue/30 transition-all group">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-md bg-cyber-blue/10 flex items-center justify-center shrink-0 group-hover:bg-cyber-blue/20 transition-colors">
                            <Icon className="w-4 h-4 text-cyber-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium truncate">{item.name}</h3>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                                item.risk === "低" ? "bg-cyber-green/10 text-cyber-green" :
                                item.risk === "中" ? "bg-cyber-amber/10 text-cyber-amber" :
                                "bg-cyber-magenta/10 text-cyber-magenta"
                              }`}>{item.risk}风险</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px] border-t border-border/50 pt-2">
                          <div>
                            <p className="text-muted-foreground">APY</p>
                            <p className="font-mono font-bold text-cyber-green">{apys[i]}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sharpe</p>
                            <p className="font-mono font-bold text-cyber-blue">{item.sharpe}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">TVL</p>
                            <p className="font-mono font-bold">{tvls[i]}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">币种</p>
                            <p className="font-mono font-bold text-cyber-amber">{item.coins.replace("全", "").replace("DeFi", "45+")}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => toast.info(`${item.name} - 详情即将上线`)}>
                            <Play className="w-3 h-3 mr-1" />启用
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => toast.info("功能开发中")}>
                            <BarChart3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* DeFi Protocol Coverage */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">DeFi协议覆盖 · 8条链 · 18个协议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { name: "Uniswap V3", chain: "Ethereum", tvl: "$5.8B", apy: "12.5%", status: "活跃" },
                    { name: "Aave V3", chain: "Multi-chain", tvl: "$12.5B", apy: "4.8%", status: "活跃" },
                    { name: "Curve Finance", chain: "Multi-chain", tvl: "$3.2B", apy: "8.2%", status: "活跃" },
                    { name: "Lido", chain: "Ethereum", tvl: "$32.5B", apy: "3.8%", status: "活跃" },
                    { name: "GMX", chain: "Arbitrum", tvl: "$580M", apy: "22.5%", status: "活跃" },
                    { name: "dYdX", chain: "Cosmos", tvl: "$980M", apy: "6.5%", status: "活跃" },
                    { name: "PancakeSwap", chain: "BSC", tvl: "$2.1B", apy: "15.8%", status: "活跃" },
                    { name: "Compound", chain: "Ethereum", tvl: "$2.8B", apy: "3.5%", status: "活跃" },
                    { name: "Rocket Pool", chain: "Ethereum", tvl: "$4.2B", apy: "3.2%", status: "活跃" },
                    { name: "Lyra", chain: "Optimism", tvl: "$95M", apy: "28.5%", status: "活跃" },
                    { name: "Yearn", chain: "Ethereum", tvl: "$450M", apy: "9.5%", status: "活跃" },
                    { name: "MakerDAO", chain: "Ethereum", tvl: "$8.5B", apy: "5.2%", status: "活跃" },
                  ].map((p, _i) => (
                    <div key={p.name} className="p-2.5 rounded border border-border/50 bg-secondary/20 hover:border-cyber-blue/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-medium">{p.name}</p>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                      </div>
                      <p className="text-[9px] text-muted-foreground">{p.chain}</p>
                      <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                        <span className="text-cyber-blue">{p.tvl}</span>
                        <span className="text-cyber-green">{p.apy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ Strategy Library ═══ */}
        <TabsContent value="library">
          <div className="space-y-4">
            {strategyCategories.map((cat, ci) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}>
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <div>
                          <span>{cat.name}</span>
                          <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{cat.desc}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{cat.count} 种</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {cat.items.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => toast.info(`${item.name} - 详情即将上线`)}
                          className="p-3 rounded-md border border-border hover:border-cyber-blue/30 bg-secondary/20 text-left transition-all hover:bg-secondary/40"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium">{item.name}</p>
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              item.risk === "低" ? "bg-cyber-green/10 text-cyber-green" :
                              item.risk === "中" ? "bg-cyber-amber/10 text-cyber-amber" :
                              "bg-cyber-magenta/10 text-cyber-magenta"
                            }`}>{item.risk}风险</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">{item.desc}</p>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-cyber-blue">{item.coins}</span>
                            <span className="text-cyber-green font-mono">Sharpe: {item.sharpe}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ Profit Attribution (NEW) ═══ */}
        <TabsContent value="attribution">
          <div className="space-y-4">
            {/* Attribution Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "总收益", value: "+$105,600", sub: "本月累计", color: "green" },
                { label: "策略贡献", value: "8类策略", sub: "分散化良好", color: "blue" },
                { label: "最大贡献", value: "AI预测", sub: "$22,500 (21.3%)", color: "amber" },
                { label: "组合Sharpe", value: "3.25", sub: "超越基准 +1.85", color: "green" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="bg-card border-border">
                    <CardContent className="pt-3 pb-2">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className={`text-lg font-heading font-bold mt-0.5 ${stat.color === "green" ? "text-cyber-green" : stat.color === "blue" ? "text-cyber-blue" : "text-cyber-amber"}`}>{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{stat.sub}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Attribution by Strategy (Pie) */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-cyber-blue" />
                    按策略类型归因
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={profitAttributionByStrategy}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name} $${(value / 1000).toFixed(1)}K`}
                          labelLine={{ stroke: "#555", strokeWidth: 1 }}
                        >
                          {profitAttributionByStrategy.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, "收益"]}
                        />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Attribution by Source (Bar) */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyber-amber" />
                    按收益来源归因
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitAttributionBySource} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#999" }} width={100} />
                        <Tooltip
                          contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, "收益"]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {profitAttributionBySource.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} fillOpacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Attribution (Stacked Area) */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyber-green" />
                    月度策略收益归因趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyProfitAttribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#666" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                        <Area type="monotone" dataKey="AI预测" stackId="1" stroke="#9b59b6" fill="#9b59b6" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="多因子Alpha" stackId="1" stroke="#1abc9c" fill="#1abc9c" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="DeFi流动性" stackId="1" stroke="#f5a623" fill="#f5a623" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="网格交易" stackId="1" stroke="#00ff88" fill="#00ff88" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="趋势跟随" stackId="1" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="资金费率" stackId="1" stroke="#ff3388" fill="#ff3388" fillOpacity={0.4} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", color: "#999" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Attribution by Coin */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-cyber-blue" />
                    按币种收益归因
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profitAttributionByCoin.map((coin, i) => (
                      <div key={coin.name} className="flex items-center gap-3">
                        <span className="text-[11px] font-mono font-bold w-20">{coin.name}</span>
                        <div className="flex-1 h-5 bg-secondary/30 rounded-sm overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${coin.pct}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="h-full rounded-sm"
                            style={{ background: `linear-gradient(90deg, rgba(0,212,255,0.3), rgba(0,255,136,${0.3 + coin.pct / 100}))` }}
                          />
                          <span className="absolute right-2 top-0.5 text-[9px] font-mono text-muted-foreground">${(coin.value / 1000).toFixed(1)}K ({coin.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Risk-Return Scatter */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyber-magenta" />
                    策略风险-收益散点图
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-0 w-full h-full border border-border/20 rounded">
                        <div className="border-r border-b border-border/20 flex items-center justify-center text-[9px] text-muted-foreground/30">低风险/高收益</div>
                        <div className="border-b border-border/20 flex items-center justify-center text-[9px] text-muted-foreground/30">高风险/高收益</div>
                        <div className="border-r border-border/20 flex items-center justify-center text-[9px] text-muted-foreground/30">低风险/低收益</div>
                        <div className="flex items-center justify-center text-[9px] text-muted-foreground/30">高风险/低收益</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 p-4">
                      {strategyRiskReturn.map((s, i) => {
                        const x = (s.risk / 20) * 100;
                        const y = 100 - (s.return / 55) * 100;
                        const colors = ["#00ff88", "#00d4ff", "#f5a623", "#ff3388", "#9b59b6", "#1abc9c", "#e74c3c", "#3498db", "#2ecc71"];
                        return (
                          <div
                            key={s.name}
                            className="absolute flex flex-col items-center group"
                            style={{ left: `${Math.min(90, Math.max(5, x))}%`, top: `${Math.min(85, Math.max(5, y))}%`, transform: "translate(-50%, -50%)" }}
                          >
                            <div
                              className="rounded-full border-2 transition-transform group-hover:scale-125"
                              style={{
                                width: `${s.size + 8}px`, height: `${s.size + 8}px`,
                                backgroundColor: `${colors[i]}30`, borderColor: colors[i],
                              }}
                            />
                            <span className="text-[8px] font-mono mt-0.5 text-muted-foreground whitespace-nowrap">{s.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/50">风险 (最大回撤%) →</div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] text-muted-foreground/50">收益率 (年化%) →</div>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Radar */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyber-green" />
                    组合综合评分 vs 基准
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#999" }} />
                        <PolarRadiusAxis tick={{ fontSize: 8, fill: "#666" }} domain={[0, 100]} />
                        <Radar name="当前组合" dataKey="当前组合" stroke="#00ff88" fill="#00ff88" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="基准" dataKey="基准" stroke="#666" fill="#666" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", color: "#999" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ Fund Flow Sankey Diagram ═══ */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-cyber-blue" />
                  资金流动路径 · 资金来源 → 策略类型 → 目标资产
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SankeyChart />
              </CardContent>
            </Card>

            {/* Strategy Correlation Matrix */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyber-amber" />
                  策略间相关性矩阵 · 低相关性 = 更好的分散化
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground">策略</th>
                        {["网格", "趋势", "DeFi", "费率", "AI", "Alpha"].map(h => (
                          <th key={h} className="text-center py-2 px-3 text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {strategyCorrelation.map(row => (
                        <tr key={row.strategy} className="border-b border-border/20">
                          <td className="py-2 px-2 font-medium">{row.strategy}</td>
                          {["网格", "趋势", "DeFi", "费率", "AI", "Alpha"].map(col => {
                            const val = row[col as keyof typeof row] as number;
                            const absVal = Math.abs(val);
                            const bg = val === 1 ? "bg-cyber-blue/20" :
                              absVal > 0.5 ? "bg-cyber-magenta/15" :
                              absVal > 0.2 ? "bg-cyber-amber/10" :
                              "bg-cyber-green/10";
                            const textColor = val === 1 ? "text-cyber-blue" :
                              absVal > 0.5 ? "text-cyber-magenta" :
                              absVal > 0.2 ? "text-cyber-amber" :
                              "text-cyber-green";
                            return (
                              <td key={col} className={`py-2 px-3 text-center ${bg} ${textColor}`}>
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-cyber-green/20" />低相关(&lt;0.2)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-cyber-amber/20" />中等(0.2-0.5)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-cyber-magenta/20" />高相关(&gt;0.5)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ Backtest Engine ═══ */}
        <TabsContent value="backtest">
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">5年回测资金曲线 · 策略 vs 基准(BTC Buy&Hold)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve}>
                      <defs>
                        <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`$${(v / 1000).toFixed(1)}K`, ""]} />
                      <Area type="monotone" dataKey="strategy" stroke="#00ff88" strokeWidth={2} fill="url(#stratGrad)" name="策略" />
                      <Line type="monotone" dataKey="benchmark" stroke="#666" strokeWidth={1} strokeDasharray="4 4" dot={false} name="基准" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">回测结果 · 全币种覆盖</CardTitle>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toast.info("新建回测即将上线")}>
                    <Plus className="w-3 h-3 mr-1" />新建回测
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground">策略名称</th>
                        <th className="text-left py-2 text-muted-foreground">币种</th>
                        <th className="text-left py-2 text-muted-foreground">回测期间</th>
                        <th className="text-right py-2 text-muted-foreground">总收益</th>
                        <th className="text-right py-2 text-muted-foreground">年化</th>
                        <th className="text-right py-2 text-muted-foreground">Sharpe</th>
                        <th className="text-right py-2 text-muted-foreground">回撤</th>
                        <th className="text-right py-2 text-muted-foreground">胜率</th>
                        <th className="text-right py-2 text-muted-foreground">盈亏比</th>
                        <th className="text-right py-2 text-muted-foreground">Calmar</th>
                        <th className="text-right py-2 text-muted-foreground">交易数</th>
                        <th className="text-center py-2 text-muted-foreground">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestResults.map((bt) => (
                        <tr key={bt.name} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="py-2 font-medium">{bt.name}</td>
                          <td className="py-2 text-cyber-blue text-[10px]">{bt.coins}</td>
                          <td className="py-2 font-mono text-muted-foreground text-[10px]">{bt.period}</td>
                          <td className="py-2 text-right font-mono text-cyber-green">+{bt.totalReturn}%</td>
                          <td className="py-2 text-right font-mono text-cyber-green">{bt.annReturn}%</td>
                          <td className="py-2 text-right font-mono text-cyber-blue">{bt.sharpe}</td>
                          <td className="py-2 text-right font-mono text-cyber-magenta">{bt.maxDrawdown}%</td>
                          <td className="py-2 text-right font-mono">{bt.winRate}%</td>
                          <td className="py-2 text-right font-mono text-cyber-amber">{bt.profitFactor}</td>
                          <td className="py-2 text-right font-mono">{bt.calmar}</td>
                          <td className="py-2 text-right font-mono">{bt.trades.toLocaleString()}</td>
                          <td className="py-2 text-center">
                            <Badge variant="outline" className={`text-[8px] py-0 ${bt.status === "完成" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                              {bt.status}
                            </Badge>
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

        {/* ═══ Strategy Evolution ═══ */}
        <TabsContent value="evolution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Dna className="w-4 h-4 text-cyber-amber" />策略自我进化系统
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "参数自动优化", desc: "贝叶斯优化 + 遗传算法自动搜索最优参数", progress: 92, gen: 2100, improvement: "+15.2% 收益" },
                  { name: "策略组合进化", desc: "自动调整策略权重，优化组合Sharpe比率", progress: 85, gen: 1850, improvement: "+0.35 Sharpe" },
                  { name: "新策略生成", desc: "DeepSeek-V3基于历史数据自动生成新策略候选", progress: 72, gen: 450, improvement: "+3个有效策略/月" },
                  { name: "策略淘汰机制", desc: "自动淘汰连续亏损策略，释放资金给优质策略", progress: 88, gen: 1200, improvement: "-8.5% 亏损策略" },
                  { name: "市场适应进化", desc: "检测市场状态变化，自动调整策略参数和权重", progress: 78, gen: 980, improvement: "适应时间 <2h" },
                  { name: "跨币种知识迁移", desc: "将主流币策略知识迁移至新上线币种", progress: 65, gen: 320, improvement: "迁移成功率 78%" },
                  { name: "DeFi协议适应", desc: "自动适应DeFi协议升级和参数变化", progress: 82, gen: 560, improvement: "协议适应 <30min" },
                ].map((evo, i) => (
                  <motion.div key={evo.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded border border-border/50 bg-secondary/20">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-medium">{evo.name}</h4>
                      <span className="text-[9px] font-mono text-cyber-green">{evo.improvement}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{evo.desc}</p>
                    <div className="flex items-center gap-3">
                      <Progress value={evo.progress} className="h-1.5 flex-1" />
                      <span className="text-[9px] font-mono text-cyber-blue">{evo.progress}%</span>
                      <span className="text-[9px] font-mono text-muted-foreground">Gen:{evo.gen}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyber-blue" />策略进化日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {[
                    { time: "14:35:22", type: "优化", msg: "BTC网格策略参数优化完成：网格间距从0.5%调整为0.42%，预期收益提升3.2%", delta: "+3.2%" },
                    { time: "14:28:15", type: "进化", msg: "第2,101代策略组合进化：SOL动量策略权重从12%提升至15%，AVAX策略降至8%", delta: "权重调整" },
                    { time: "14:22:08", type: "DeFi", msg: "Uniswap V3流动性策略区间调整：ETH/USDC价格区间从$3,500-$4,200调整为$3,700-$4,100", delta: "+2.5% APY" },
                    { time: "14:15:33", type: "淘汰", msg: "DOT均值回归策略连续15天亏损，自动暂停并释放$5,000资金至SOL动量策略", delta: "-1策略" },
                    { time: "14:08:45", type: "适应", msg: "检测到BTC进入震荡区间，网格策略参数自动切换至窄幅模式", delta: "模式切换" },
                    { time: "14:02:12", type: "DeFi", msg: "Aave V3借贷利率策略：检测到USDC存款利率升至5.2%，自动增加$50K存款", delta: "+$50K" },
                    { time: "13:55:30", type: "生成", msg: "DeepSeek-V3生成新DeFi策略：'LSD循环收益策略'，回测APY 18.5%，已加入候选池", delta: "+1策略" },
                    { time: "13:48:18", type: "进化", msg: "永续资金费率策略优化：增加SOL/AVAX资金费率监控，预期月收益+$2,800", delta: "+$2.8K" },
                    { time: "13:42:05", type: "DeFi", msg: "Curve稳定币池策略：检测到3pool APY下降，自动迁移至Convex crvUSD池", delta: "+1.2% APY" },
                    { time: "13:35:50", type: "优化", msg: "全币种情绪因子策略参数优化：情绪阈值从0.65调整为0.72，误报率降低18%", delta: "-18%误报" },
                  ].map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-2.5 rounded border border-border/50 bg-secondary/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            log.type === "优化" ? "bg-cyber-blue/15 text-cyber-blue" :
                            log.type === "进化" ? "bg-cyber-green/15 text-cyber-green" :
                            log.type === "生成" ? "bg-cyber-amber/15 text-cyber-amber" :
                            log.type === "淘汰" ? "bg-cyber-magenta/15 text-cyber-magenta" :
                            log.type === "DeFi" ? "bg-[#9b59b6]/15 text-[#9b59b6]" :
                            "bg-cyber-amber/15 text-cyber-amber"
                          }`}>{log.type}</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{log.time}</span>
                        </div>
                        <span className="text-[9px] font-mono text-cyber-green">{log.delta}</span>
                      </div>
                      <p className="text-[10px] text-foreground/80 leading-relaxed">{log.msg}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ Strategy Editor ═══ */}
        <TabsContent value="editor">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-cyber-blue" />策略编辑器 · 全币种支持 · DeFi策略模板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">Python</Badge>
                  <Badge variant="outline" className="text-[10px]">JavaScript</Badge>
                  <Badge variant="outline" className="text-[10px]">C++</Badge>
                  <Badge variant="outline" className="text-[10px] border-cyber-amber/30 text-cyber-amber">AI策略生成 (DeepSeek-V3)</Badge>
                  <Badge variant="outline" className="text-[10px] border-cyber-blue/30 text-cyber-blue">DeFi策略模板 (12种)</Badge>
                  <Badge variant="outline" className="text-[10px] border-cyber-green/30 text-cyber-green">全币种 ({allCoins.length}+)</Badge>
                </div>
                <div className="rounded-md border border-border bg-[#0a0e15] p-4 font-mono text-[11px] text-muted-foreground min-h-[350px] relative overflow-x-auto">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-magenta/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-amber/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyber-green/50" />
                  </div>
                  <pre className="text-cyber-blue/80 leading-relaxed">
{`# CryptoQuant Pro DeFi策略模板
# 流动性提供 + 借贷利率 + 收益聚合
# 覆盖: 全部 ${allCoins.length}+ 币种 · 18个DeFi协议

from cryptoquant import DeFiStrategy, AIOptimizer
from cryptoquant.defi import (
    LiquidityProvider, LendingOptimizer,
    YieldAggregator, FundingRateHarvester
)

class DeFiYieldStrategy(DeFiStrategy):
    """DeFi全链路收益策略 - AI自适应版"""
    
    def __init__(self):
        # 流动性提供配置
        self.lp = LiquidityProvider(
            protocols=["uniswap_v3", "curve", "pancakeswap"],
            chains=["ethereum", "arbitrum", "bsc", "optimism"],
            auto_rebalance=True,
            range_strategy="concentrated"  # 集中流动性
        )
        
        # 借贷利率优化
        self.lending = LendingOptimizer(
            protocols=["aave_v3", "compound", "maker"],
            assets=["USDT", "USDC", "DAI", "ETH", "BTC"],
            leverage_loop=True,  # 杠杆循环借贷
            max_ltv=0.75
        )
        
        # 收益聚合器
        self.aggregator = YieldAggregator(
            min_apy=5.0,
            max_gas_cost=50,  # USD
            auto_compound=True,
            rebalance_interval="4h"
        )
        
        # 资金费率收割
        self.funding = FundingRateHarvester(
            exchanges=["dydx", "gmx", "hyperliquid"],
            delta_neutral=True,  # Delta中性对冲
            min_rate=0.01  # 最低费率阈值
        )
        
        # AI优化器
        self.optimizer = AIOptimizer(
            model="DeepSeek-V3",
            evolution=True,
            protocol_monitor=True  # 监控协议升级
        )
    
    def execute(self, market_data):
        """执行DeFi策略组合"""
        # 1. 流动性提供收益
        lp_yield = self.lp.optimize_positions(market_data)
        
        # 2. 借贷利率收益
        lending_yield = self.lending.optimize_rates(market_data)
        
        # 3. 收益聚合
        agg_yield = self.aggregator.find_best_yield(market_data)
        
        # 4. 资金费率收割
        funding_yield = self.funding.harvest(market_data)
        
        # AI综合决策
        return self.optimizer.allocate(
            [lp_yield, lending_yield, agg_yield, funding_yield],
            risk_budget=self.risk_budget,
            target_apy=15.0
        )`}
                  </pre>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" className="bg-cyber-blue hover:bg-cyber-blue/80 text-background" onClick={() => toast.info("功能开发中")}>
                    <Play className="w-3 h-3 mr-1" />运行回测
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("功能开发中")}>
                    <Brain className="w-3 h-3 mr-1" />AI优化参数
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("功能开发中")}>
                    <Sparkles className="w-3 h-3 mr-1" />AI生成策略
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("功能开发中")}>
                    <Droplets className="w-3 h-3 mr-1" />DeFi模板库
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("功能开发中")}>
                    <Target className="w-3 h-3 mr-1" />全币种回测
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ═══ Portfolio Optimizer ═══ */}
        <TabsContent value="optimizer">
          <PortfolioOptimizer />
        </TabsContent>
        {/* ═══ Real-time Alert Stream ═══ */}
        <TabsContent value="alerts">
          <AlertStream />
        </TabsContent>
      </Tabs>

      {/* Strategy Parameter Panel Modal */}
      <AnimatePresence>
        {selectedStrategy && (
          <StrategyParamPanel
            strategy={selectedStrategy}
            onClose={() => setSelectedStrategy(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
