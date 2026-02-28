/**
 * Strategies - Enhanced strategy management system
 * DeFi strategy types, profit attribution analysis, full coin coverage,
 * AI strategy generation, comprehensive backtesting, strategy evolution
 * Design: Cyberpunk terminal dark theme
 */
import { useState, useMemo } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { useTradingContext } from "@/contexts/TradingContext";
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

// ─── Strategy Categories (来自合约策略大全，全量补充) ─────────────────────
const strategyCategories = [
  {
    name: "趋势跟踪策略库", count: 8, icon: "📈", desc: "来自合约策略大全，经典趋势跟踪策略体系",
    items: [
      { name: "双均线交叉策略(EMA12/26)", coins: "全币种", risk: "中", sharpe: 2.12, desc: "EMA12/EMA26金叉死叉，山寨币合约特殊调整" },
      { name: "SuperTrend超级趋势策略", coins: "全币种", risk: "中", sharpe: 2.35, desc: "ATR动态止损，高波动币种适用性强" },
      { name: "海龟交易法则(Donchian通道突破)", coins: "全币种", risk: "中", sharpe: 2.25, desc: "N日高低点通道突破，自动止损跟踪" },
      { name: "MACD趋势确认策略", coins: "全币种", risk: "中", sharpe: 2.18, desc: "MACD柱状图加速度+信号线交叉确认趋势" },
      { name: "ADX趋势强度过滤策略", coins: "全币种", risk: "中", sharpe: 2.42, desc: "ADX>25才开仓，过滤震荡市场假信号" },
      { name: "网格交易策略", coins: "全币种", risk: "低", sharpe: 1.85, desc: "在价格区间内自动挂单买卖" },
      { name: "趋势跟随策略(经典)", coins: "全币种", risk: "中", sharpe: 2.05, desc: "跟随市场趋势方向，动态止损跟踪" },
      { name: "TWAP/VWAP执行", coins: "全币种", risk: "低", sharpe: 1.65, desc: "大额订单时间/成交量加权执行" },
    ],
  },
  {
    name: "均值回归策略库", count: 5, icon: "🔄", desc: "来自合约策略大全，统计均值回归策略体系",
    items: [
      { name: "布林带回归策略(BB均值回归)", coins: "全币种", risk: "中", sharpe: 1.95, desc: "价格触及布林带上下轨时反向交易" },
      { name: "RSI超买超卖策略", coins: "全币种", risk: "中", sharpe: 2.05, desc: "RSI>70做空，RSI<30做多，山寨币适用性强" },
      { name: "Z-Score统计偏离策略", coins: "全币种", risk: "中", sharpe: 2.15, desc: "价格偏离均值超过Z分数阈值时入场" },
      { name: "协整配对交易策略", coins: "相关币种对", risk: "中", sharpe: 2.45, desc: "协整币种对价差回归，市场中性" },
      { name: "Ornstein-Uhlenbeck模型策略", coins: "相关币种对", risk: "中", sharpe: 2.35, desc: "OU过程均值回归建模，动态入场出场" },
    ],
  },
  {
    name: "资金费率套利策略库", count: 3, icon: "💰", desc: "来自合约策略大全，合约资金费率套利与预测策略",
    items: [
      { name: "资金费率套利策略(期现对冲)", coins: "全币种", risk: "低", sharpe: 3.15, desc: "资金费率正时做空现货，对冲合约，Delta中性" },
      { name: "资金费率预测策略", coins: "全币种", risk: "中", sharpe: 2.85, desc: "预测下一期资金费率方向，提前布局" },
      { name: "极端资金费率反转策略", coins: "全币种", risk: "中", sharpe: 2.65, desc: "资金费率极端值出现时反向交易，均值回归" },
    ],
  },
  {
    name: "链上数据策略库", count: 5, icon: "⛓️", desc: "来自合约策略大全，基于链上指标的交易策略",
    items: [
      { name: "鲸鱼异动追踪策略(Whale Alert)", coins: "主流币", risk: "中", sharpe: 2.75, desc: "监控鲸鱼地址大额转移，跟随鲸鱼操作" },
      { name: "交易所净流入流出策略", coins: "主流币", risk: "中", sharpe: 2.55, desc: "交易所净流入增加做空，净流出做多" },
      { name: "NVT信号策略", coins: "主流币", risk: "中", sharpe: 2.35, desc: "NVT高低判断价格高低估，均值回归交易" },
      { name: "活跃地址增长策略", coins: "主流币", risk: "中", sharpe: 2.25, desc: "活跃地址数快速增长时做多，预示需求上升" },
      { name: "矿工投降策略(Hash Ribbon)", coins: "BTC", risk: "高", sharpe: 2.95, desc: "Hash Ribbon矿工投降信号自底部入场" },
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
      { name: "强化学习自适应(DRL-PPO/SAC)", coins: "全币种", risk: "中", sharpe: 2.89, desc: "RL Agent自动学习最优策略" },
      { name: "DeepSeek-V3策略生成", coins: "全币种", risk: "中", sharpe: 2.95, desc: "自然语言描述自动生成策略" },
      { name: "情绪分析NLP策略(FinBERT)", coins: "全币种", risk: "中", sharpe: 2.72, desc: "FinBERT情绪分析，新闻/社交信号驱动" },
      { name: "多因子机器学习选币(XGBoost/LightGBM)", coins: "全币种", risk: "中", sharpe: 3.05, desc: "XGBoost/LightGBM多因子选币模型" },
      { name: "GNN图神经网络跨币种关联策略", coins: "全币种", risk: "中", sharpe: 2.92, desc: "币种关联图谱分析，跨币种信号传播" },
      { name: "Transformer时序预测策略", coins: "全币种", risk: "中", sharpe: 3.08, desc: "Transformer架构长短期价格预测" },
      { name: "多模态融合策略", coins: "全币种", risk: "高", sharpe: 3.35, desc: "融合文本/图表/数据多模态" },
      { name: "GAN对抗训练策略", coins: "全币种", risk: "高", sharpe: 2.65, desc: "生成对抗网络优化策略" },
      { name: "元学习自适应策略", coins: "全币种", risk: "中", sharpe: 2.78, desc: "快速适应新市场环境，少样本学习" },
    ],
  },
  {
    name: "动量策略库", count: 5, icon: "⚡", desc: "来自合约策略大全，多维度动量策略体系",
    items: [
      { name: "价格动量策略(ROC变化率)", coins: "全币种", risk: "中", sharpe: 2.45, desc: "ROC计算N天价格变化率，排名选币做多" },
      { name: "成交量动量策略(OBV能量潮)", coins: "全币种", risk: "中", sharpe: 2.28, desc: "OBV量价共振，量能潮突破确认走势" },
      { name: "相对强弱动量策略(RSI动量)", coins: "全币种", risk: "中", sharpe: 2.35, desc: "RSI多周期动量排名，强强弱弱轮动选币" },
      { name: "跨币种动量排序策略", coins: "全币种", risk: "中", sharpe: 2.62, desc: "每周重新排序，做多强势币种做空弱势币种" },
      { name: "加速动量策略(Momentum Acceleration)", coins: "全币种", risk: "中", sharpe: 2.55, desc: "动量加速度增强时入场，捕捉动量爆发初期" },
    ],
  },
  {
    name: "网格交易策略库", count: 5, icon: "▦", desc: "来自合约策略大全，全类型网格交易策略体系",
    items: [
      { name: "等差网格策略", coins: "全币种", risk: "低", sharpe: 1.75, desc: "固定间距网格，适合震荡行情" },
      { name: "等比网格策略", coins: "全币种", risk: "低", sharpe: 1.85, desc: "按百分比设置网格间距，正常分布市场更适用" },
      { name: "自适应网格策略(ATR动态调整)", coins: "全币种", risk: "低", sharpe: 2.05, desc: "ATR动态调整网格间距，适应市场波动率变化" },
      { name: "多空双向网格策略", coins: "全币种", risk: "中", sharpe: 2.15, desc: "同时在多空两个方向挂单，捕捉双向波动" },
      { name: "智能网格策略(结合趋势判断)", coins: "全币种", risk: "中", sharpe: 2.35, desc: "趋势向上时只挂买单，趋势向下时只挂卖单" },
    ],
  },
  {
    name: "订单簿与微观结构策略库", count: 5, icon: "📊", desc: "来自合约策略大全，基于订单簿微观结构的高频策略",
    items: [
      { name: "订单簿不平衡策略(OBI)", coins: "主流+二线", risk: "高", sharpe: 2.85, desc: "订单簿买卖力量不平衡时入场，短期预测价格方向" },
      { name: "交易流毒性指标策略(VPIN)", coins: "主流+二线", risk: "高", sharpe: 2.72, desc: "VPIN识别知情交易者活动，预警大幅波动" },
      { name: "大单追踪策略", coins: "主流+二线", risk: "高", sharpe: 2.65, desc: "检测并跟随市场大单方向，判断机构意图" },
      { name: "清算热力图策略(Liquidation Cascade)", coins: "全币种", risk: "高", sharpe: 2.55, desc: "预测清算集中区域，提前布局或回避大幅波动" },
      { name: "Kyle Lambda流动性冲击策略", coins: "主流+二线", risk: "高", sharpe: 2.48, desc: "利用价格冲击系数识别市场冲击成本，判断流动性" },
    ],
  },
  {
    name: "波动率策略库", count: 5, icon: "🌊", desc: "来自合约策略大全，基于波动率特征的交易策略",
    items: [
      { name: "波动率突破策略(BB Squeeze)", coins: "全币种", risk: "中", sharpe: 2.45, desc: "布林带收窄后突破，捕捉波动率爆发行情" },
      { name: "波动率均值回归策略", coins: "全币种", risk: "中", sharpe: 2.25, desc: "高波动率后均值回归，卖出高波动率资产" },
      { name: "隐含波动率策略(IV驱动)", coins: "主流币种", risk: "中", sharpe: 2.65, desc: "高IV时卖出期权，低波动率时布局多头" },
      { name: "波动率偏尾策略(Volatility Skew)", coins: "全币种", risk: "中", sharpe: 2.38, desc: "波动率偏尾变化预测市场情绪转局" },
      { name: "Parkinson波动率策略", coins: "全币种", risk: "中", sharpe: 2.18, desc: "基于高低价的更精确波动率估计，优化入场时机" },
    ],
  },
  {
    name: "持仓量与清算数据策略库", count: 5, icon: "📈", desc: "来自合约策略大全，基于合约持仓量和清算数据的策略",
    items: [
      { name: "持仓量变化趋势策略(OI Trend)", coins: "全币种", risk: "中", sharpe: 2.55, desc: "持仓量与价格同向上涨确认趋势，背离时警惕" },
      { name: "持仓量与价格背离策略", coins: "全币种", risk: "中", sharpe: 2.42, desc: "价格创新高但持仓量下降，反转信号" },
      { name: "清算级联策略(Liquidation Cascade)", coins: "全币种", risk: "高", sharpe: 2.78, desc: "预测清算级联区域，提前布局或回避大幅波动" },
      { name: "多空持仓量比策略", coins: "全币种", risk: "中", sharpe: 2.35, desc: "多空比达到极端值时反向交易，市场情绪反转" },
      { name: "资金费率与持仓量共振策略", coins: "全币种", risk: "中", sharpe: 2.68, desc: "资金费率和持仓量同时向上时做多，双重确认" },
    ],
  },
];

// ─── Backtest Results ──────────────────────────────────────────────
const backtestResults: { name: string; period: string; coins: string; totalReturn: number; annReturn: number; sharpe: number; maxDrawdown: number; winRate: number; trades: number; profitFactor: number; calmar: number; status: string }[] = [];

// ─── Profit Attribution Data ───────────────────────────────────────
const profitAttributionByStrategy: { name: string; value: number; color: string }[] = [];
const profitAttributionBySource: { name: string; value: number; pct: number; color: string }[] = [];
const profitAttributionByCoin: { name: string; value: number; pct: number }[] = [];

const monthlyProfitAttribution: Record<string, string | number>[] = [];
const strategyRiskReturn: { name: string; return: number; risk: number; sharpe: number; size: number }[] = [];
const strategyCorrelation: Record<string, string | number>[] = [];
const radarData: { metric: string; 当前组合: number; 基准: number }[] = [];
const equityCurve: { month: string; strategy: number; benchmark: number }[] = [];


export default function Strategies() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const { data: dbStrategies } = useDbStrategies();
  const strategies = dbStrategies as unknown as Strategy[];
  const [activeTab, setActiveTab] = useState("active");
  const [selectedStrategy, setSelectedStrategy] = useState<(typeof strategies)[0] | null>(null);

  // ===== 连接真实交易数据 =====
  const trading = useTradingContext();
  const { strategyPerformance, tradeRecords, paperAccount } = trading;

  // 从真实数据计算策略统计
  const realStrategyStats = useMemo(() => {
    let totalWins = 0, totalTrades = 0, totalSharpe = 0, stratCount = 0;
    strategyPerformance.forEach(perf => {
      if (perf.totalTrades > 0) {
        totalWins += perf.wins;
        totalTrades += perf.totalTrades;
        totalSharpe += perf.sharpe;
        stratCount++;
      }
    });
    return {
      avgWinRate: totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : "--",
      avgSharpe: stratCount > 0 ? (totalSharpe / stratCount).toFixed(2) : "--",
      todayPnl: paperAccount.totalPnl,
    };
  }, [strategyPerformance, paperAccount.totalPnl]);

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
            <p className="text-sm text-muted-foreground">12大类别·76种策略 · DeFi策略12种 · AI策略生成 · 5年回测 · 收益归因分析</p>
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
          { label: "策略总数", value: "76", color: "blue" },
          { label: "DeFi策略", value: "12", color: "amber" },
          { label: "覆盖币种", value: `${allCoins.length}+`, color: "blue" },
          { label: "平均胜率", value: `${realStrategyStats.avgWinRate}%`, color: "green" },
          { label: "平均Sharpe", value: realStrategyStats.avgSharpe, color: "blue" },
          { label: "模拟盈亏", value: `${realStrategyStats.todayPnl >= 0 ? '+' : ''}$${Math.abs(realStrategyStats.todayPnl).toLocaleString(undefined, {maximumFractionDigits: 0})}`, color: realStrategyStats.todayPnl >= 0 ? "green" : "magenta" },
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
                { label: "TVL监控", value: "--", icon: Landmark, color: "blue" },
                { label: "DeFi收益", value: "+$0", icon: Coins, color: "green" },
                { label: "平均APY", value: "0.0%", icon: TrendingUp, color: "amber" },
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
                { label: "总收益", value: "+$0", sub: "本月累计", color: "green" },
                { label: "策略贡献", value: "--", sub: "暂无交易数据", color: "blue" },
                { label: "最大贡献", value: "--", sub: "暂无数据", color: "amber" },
                { label: "组合Sharpe", value: "--", sub: "暂无数据", color: "green" },
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
                  { name: "参数自动优化", desc: "贝叶斯优化 + 遗传算法自动搜索最优参数", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "策略组合进化", desc: "自动调整策略权重，优化组合Sharpe比率", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "新策略生成", desc: "DeepSeek-V3基于历史数据自动生成新策略候选", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "策略淘汰机制", desc: "自动淘汰连续亏损策略，释放资金给优质策略", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "市场适应进化", desc: "检测市场状态变化，自动调整策略参数和权重", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "跨币种知识迁移", desc: "将主流币策略知识迁移至新上线币种", progress: 0, gen: 0, improvement: "未启动" },
                  { name: "DeFi协议适应", desc: "自动适应DeFi协议升级和参数变化", progress: 0, gen: 0, improvement: "未启动" },
                ].map((evo, i) => (
                  <motion.div key={evo.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded border border-border/50 bg-secondary/20">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-medium">{evo.name}</h4>
                      <span className="text-[9px] font-mono text-muted-foreground">{evo.improvement}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{evo.desc}</p>
                    <div className="flex items-center gap-3">
                      <Progress value={evo.progress} className="h-1.5 flex-1" />
                      <span className="text-[9px] font-mono text-muted-foreground">{evo.progress}%</span>
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
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <GitBranch className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">暂无进化记录</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">启动全自动引擎后，策略进化日志将在此显示</p>
                  </div>
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
