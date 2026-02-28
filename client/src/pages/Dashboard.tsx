/**
 * Dashboard - Main command center (Enhanced v3 - Performance Optimized)
 * Cyberpunk Terminal: scrolling price ticker, AI learning status, enhanced data density
 * Full coin coverage, 5-year+ history indicators, self-evolution metrics
 *
 * Performance optimizations:
 * - PriceTicker: CSS animation instead of 50ms setInterval + setState
 * - Coin heatmap: removed per-item AnimatePresence + motion.div (450+ items)
 * - AILearningStatus: memoized to prevent re-render on parent state change
 * - Recharts: stable data references via useMemo
 */
import { useState, useMemo, useEffect, memo, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Brain, Shield, Activity, Zap, Eye, BarChart3, Globe, Layers, Sparkles, Target, Dna, BookOpen, RefreshCw, Cpu, Database, Network } from "lucide-react";
import { IMAGES } from "@/lib/images";
import RealtimePnL from "@/components/RealtimePnL";
import EquityCurve from "@/components/EquityCurve";
import SignalFeed from "@/components/SignalFeed";
import TradingBrain from "@/components/TradingBrain";
import AutoTrader from "@/components/AutoTrader";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import {
  allCoins as staticCoins, coinCategories,
  formatNumber, formatCurrency, generatePortfolioHistory,
} from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { MarketStatusBadge } from "@/components/MarketStatusBadge";
import { useDbPortfolio, useDbTrades } from "@/hooks/useDbData";
import type { Portfolio, PortfolioPosition, Trade, AllocationDataItem } from "@/types";

const portfolioHistory = generatePortfolioHistory(30);
const COLORS = ["#00d4ff", "#00ff88", "#ffaa00", "#ff3388", "#8855ff", "#00ddaa", "#ff8800", "#dd44ff"];

const signalColors: Record<string, string> = {
  "强烈看涨": "text-cyber-green bg-cyber-green/15 border-cyber-green/30",
  "看涨": "text-cyber-green/80 bg-cyber-green/10 border-cyber-green/20",
  "中性": "text-cyber-amber bg-cyber-amber/10 border-cyber-amber/20",
  "看跌": "text-cyber-magenta/80 bg-cyber-magenta/10 border-cyber-magenta/20",
  "强烈看跌": "text-cyber-magenta bg-cyber-magenta/15 border-cyber-magenta/30",
};

const riskColors: Record<string, string> = {
  "低": "text-cyber-green",
  "中": "text-cyber-amber",
  "高": "text-cyber-magenta/80",
  "极高": "text-cyber-magenta",
};

// ============ SCROLLING TICKER COMPONENT (CSS Animation - no setState) ============
const PriceTicker = memo(function PriceTicker({ allCoins }: { allCoins: typeof staticCoins }) {
  // Show top 50 by volume for the ticker
  const topCoins = useMemo(() => {
    return [...allCoins]
      .filter(c => c.category !== "稳定币")
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 50);
  }, [allCoins]);

  // Duplicate for seamless loop
  const tickerCoins = useMemo(() => [...topCoins, ...topCoins], [topCoins]);

  // Calculate total width for animation (approx 140px per item)
  const halfWidth = topCoins.length * 140;

  return (
    <div className="relative overflow-hidden bg-card/80 border-y border-border/50 py-1.5">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
      <div
        className="flex gap-6 whitespace-nowrap ticker-scroll"
        style={{
          // CSS animation: smooth, GPU-accelerated, zero JS overhead
          animation: `ticker-scroll ${topCoins.length * 2.5}s linear infinite`,
          willChange: "transform",
        }}
      >
        {tickerCoins.map((coin, i) => (
          <span key={`${coin.symbol}-${i}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono shrink-0">
            <span className="font-bold text-foreground">{coin.symbol}</span>
            <span className="text-muted-foreground">${coin.price < 1 ? coin.price.toPrecision(4) : formatNumber(coin.price, 2)}</span>
            <span className={`font-bold ${coin.change24h >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
              {coin.change24h >= 0 ? "▲" : "▼"}{Math.abs(coin.change24h).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      {/* Inject keyframes for ticker animation */}
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${halfWidth}px); }
        }
      `}</style>
    </div>
  );
});

// ============ AI LEARNING STATUS COMPONENT (Memoized) ============
const AILearningStatus = memo(function AILearningStatus() {
  const [gen, setGen] = useState(0);
  const [learningRate, setLearningRate] = useState(0);

  // 暂停假进化代数和学习率自动增长，等待真实AI训练数据
  // useEffect(() => { ... }, []);

  const learningMetrics = useMemo(() => [
    { label: "进化代数", value: gen > 0 ? `#${gen}` : "未开始", icon: Dna, color: "text-cyber-blue", detail: gen > 0 ? "持续进化中" : "等待启动" },
    { label: "模型准确率", value: learningRate > 0 ? `${learningRate.toFixed(1)}%` : "0.0%", icon: Brain, color: "text-cyber-green", detail: learningRate > 0 ? "学习中" : "未训练" },
    { label: "学习数据量", value: "0", icon: Database, color: "text-cyber-amber", detail: "等待数据" },
    { label: "活跃模型", value: "0个", icon: Cpu, color: "text-cyber-blue", detail: "未加载" },
    { label: "知识节点", value: "0", icon: Network, color: "text-cyber-green", detail: "未构建" },
    { label: "适应速度", value: "--", icon: RefreshCw, color: "text-cyber-amber", detail: "未测定" },
  ], [gen, learningRate]);

  const recentLearning = useMemo(() => [], []);

  return (
    <Card className="bg-card border-border card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyber-blue" />
          AI自我学习实时状态
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <Badge variant="outline" className="text-[9px] text-cyber-green border-cyber-green/30 bg-cyber-green/10 ml-auto">
            LEARNING ACTIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-2">
            {learningMetrics.map((m) => (
              <div key={m.label} className="bg-secondary/20 border border-border/50 rounded-md p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <span className="text-[9px] text-muted-foreground">{m.label}</span>
                </div>
                <p className="text-sm font-mono font-bold text-foreground">{m.value}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">{m.detail}</p>
              </div>
            ))}
          </div>

          {/* Recent learning events - no motion.div, use CSS transitions */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> 最近学习事件
            </p>
            {recentLearning.map((event, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[10px] py-1 px-2 rounded bg-secondary/10 hover:bg-secondary/20 transition-colors"
              >
                <span className="text-muted-foreground w-14 shrink-0">{event.time}</span>
                <span className="flex-1 text-foreground truncate">{event.event}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] ${
                  event.type === "模型更新" ? "bg-cyber-blue/10 text-cyber-blue" :
                  event.type === "因子发现" ? "bg-cyber-amber/10 text-cyber-amber" :
                  event.type === "自我进化" ? "bg-cyber-green/10 text-cyber-green" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {event.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============ MAIN DASHBOARD ============
export default function Dashboard() {
  const [coinFilter, setCoinFilter] = useState("全部");
  const { coins: allCoins, status: wsStatus, liveCount } = useLiveCoins();
  const { data: portfolio } = useDbPortfolio();
  const { data: recentTrades } = useDbTrades(10);

  const filteredCoins = useMemo(() => {
    if (coinFilter === "全部") return allCoins;
    return allCoins.filter(c => c.category === coinFilter);
  }, [coinFilter, allCoins]);

  const sys = useSystemStatusCtx();

  const categoryStats = useMemo(() => {
    const cats = ["主流币", "基础设施", "Layer2", "DeFi", "Meme币", "AI概念", "GameFi", "RWA"];
    return cats.map(cat => {
      const catCoins = allCoins.filter(c => c.category === cat);
      const avgChange = catCoins.reduce((s, c) => s + c.change24h, 0) / (catCoins.length || 1);
      return { name: cat, count: catCoins.length, avgChange: Math.round(avgChange * 100) / 100 };
    });
  }, [allCoins]);

  const allocationData = useMemo(() => {
    const p = portfolio as unknown as Portfolio | null;
    if (!p?.positions) return [];
    return p.positions.slice(0, 8).map((pos: PortfolioPosition) => ({ name: pos.symbol, value: pos.allocation }));
  }, [portfolio]);

  // 5-year data coverage stats
  const dataCoverage = useMemo(() => [
    { period: "2021", records: "--", coins: 0, accuracy: 0 },
    { period: "2022", records: "--", coins: 0, accuracy: 0 },
    { period: "2023", records: "--", coins: 0, accuracy: 0 },
    { period: "2024", records: "--", coins: 0, accuracy: 0 },
    { period: "2025", records: "--", coins: 0, accuracy: 0 },
  ], []);

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-lg overflow-hidden h-44 lg:h-48">
        <img src={IMAGES.heroBanner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 lg:px-8">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-cyber-blue text-glow-blue tracking-wider">CRYPTOQUANT PRO</h1>
          <p className="text-muted-foreground mt-1 text-sm">AI驱动的全币种量化交易系统 · 自我学习 · 持续进化 · 覆盖{allCoins.length}+币种 · 5年+历史数据</p>
          <div className="flex gap-3 mt-3 flex-wrap text-xs font-mono">
            <span className="px-2 py-1 rounded bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20">总资产 {formatCurrency(portfolio.totalValue)}</span>
            <span className={`px-2 py-1 rounded border ${sys.dailyPnl >= 0 ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/20' : 'bg-cyber-magenta/10 text-cyber-magenta border-cyber-magenta/20'}`}>今日盈亏 {sys.dailyPnl >= 0 ? '+' : ''}{formatCurrency(sys.dailyPnl)}</span>
            <span className="px-2 py-1 rounded bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20">活跃策略 {sys.activeStrategies}/{sys.totalStrategies}</span>
            <span className="px-2 py-1 rounded bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20">覆盖币种 {allCoins.length}+</span>
            {wsStatus === "connected" && <span className="px-2 py-1 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/20">实时行情 {liveCount}币种</span>}
            <span className="px-2 py-1 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/20">AI模型 {sys.aiModel}</span>
            <span className="px-2 py-1 rounded bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20">API {sys.apiLatency}ms</span>
          </div>
        </div>
      </motion.div>

      {/* Scrolling Price Ticker - CSS animation, no JS timer */}
      <PriceTicker allCoins={allCoins} />

      {/* KPI Cards - simplified animation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: DollarSign, label: "总资产价值", value: formatCurrency(portfolio.totalValue), change: portfolio.totalPnlPercent, color: "blue" },
          { icon: TrendingUp, label: "累计盈亏", value: `+${formatCurrency(portfolio.totalPnl)}`, change: portfolio.totalPnlPercent, color: "green" },
          { icon: Activity, label: "今日交易量", value: `${sys.ordersToday.toLocaleString()}笔`, change: 0, color: "amber" },
          { icon: Brain, label: "AI预测准确率", value: "0.0%", change: 0, color: "blue" },
          { icon: Globe, label: "全币种覆盖", value: `${allCoins.length}种`, change: 0, color: "green" },
          { icon: Shield, label: "风险评分", value: "--", change: 0, color: "green" },
        ].map((m) => (
          <Card key={m.label} className="bg-card border-border card-hover">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <p className="text-base lg:text-lg font-heading font-bold mt-0.5">{m.value}</p>
                </div>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${m.color === "blue" ? "bg-cyber-blue/10" : m.color === "green" ? "bg-cyber-green/10" : "bg-cyber-amber/10"}`}>
                  <m.icon className={`w-4 h-4 ${m.color === "blue" ? "text-cyber-blue" : m.color === "green" ? "text-cyber-green" : "text-cyber-amber"}`} />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono ${m.change >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                {m.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}% <span className="text-muted-foreground ml-1">vs 昨日</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Learning Status Panel */}
      <AILearningStatus />

      {/* 5-Year Data Coverage Bar */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyber-amber" />
            5年+历史数据学习覆盖
            <Badge variant="outline" className="text-[9px] text-cyber-blue border-cyber-blue/30 bg-cyber-blue/10 ml-2">暂无数据</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            {dataCoverage.map((d, i) => (
              <div key={d.period} className="flex-1 text-center">
                <div className="relative h-24 flex items-end justify-center mb-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.accuracy / 100) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="w-full rounded-t-md bg-gradient-to-t from-cyber-blue/30 to-cyber-blue/60 relative"
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyber-green">{d.accuracy}%</span>
                  </motion.div>
                </div>
                <p className="text-[10px] font-mono font-bold text-foreground">{d.period}</p>
                <p className="text-[8px] text-muted-foreground">{d.records}</p>
                <p className="text-[8px] text-cyber-blue">{d.coins}币种</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Coin Heatmap - NO AnimatePresence, use CSS transitions for 450+ items */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-blue" />全币种实时行情 · {allCoins.length}种
              <MarketStatusBadge />
            </CardTitle>
            <div className="flex gap-1 flex-wrap">
              {coinCategories.map(cat => (
                <button key={cat} onClick={() => setCoinFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${coinFilter === cat ? "bg-cyber-blue text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5">
            {filteredCoins.map((coin) => {
              const intensity = Math.min(1, Math.abs(coin.change24h) / 10);
              const bgColor = coin.change24h >= 0
                ? `rgba(0, 255, 136, ${0.08 + intensity * 0.25})`
                : `rgba(255, 51, 136, ${0.08 + intensity * 0.25})`;
              return (
                <div key={coin.symbol}
                  className="p-2 rounded border border-border/50 hover:border-cyber-blue/40 transition-all cursor-pointer group" style={{ background: bgColor }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono font-bold">{coin.symbol}</span>
                    {coin.tracked && <Eye className="w-2.5 h-2.5 text-cyber-blue opacity-60" />}
                  </div>
                  <p className="text-[10px] font-mono">${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : formatNumber(coin.price, 2)}</p>
                  <p className={`text-[10px] font-mono font-bold ${coin.change24h >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                  </p>
                  <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-[8px] px-1 py-0.5 rounded ${coin.aiSignal.includes("看涨") ? "bg-cyber-green/20 text-cyber-green" : coin.aiSignal.includes("看跌") ? "bg-cyber-magenta/20 text-cyber-magenta" : "bg-cyber-amber/20 text-cyber-amber"}`}>
                      AI:{coin.aiSignal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-5 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyber-blue" />资产组合走势 (30天)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioHistory}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#666" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number) => [formatCurrency(value), "资产价值"]} />
                  <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-cyber-amber" />板块涨跌幅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#999" }} width={55} />
                  <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${v.toFixed(2)}%`, "平均涨幅"]} />
                  <Bar dataKey="avgChange" radius={[0, 4, 4, 0]}>
                    {categoryStats.map((entry, i) => (
                      <Cell key={i} fill={entry.avgChange >= 0 ? "#00ff88" : "#ff3388"} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">持仓分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 min-h-[208px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                    {allocationData.map((_: AllocationDataItem, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${v}%`, "占比"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {allocationData.map((d: AllocationDataItem, i: number) => (
                <span key={d.name} className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name} {d.value}%
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve + Signal Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EquityCurve />
        <SignalFeed />
      </div>

      {/* AI Trading Brain + Auto Trader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TradingBrain />
        <AutoTrader />
      </div>

      {/* Real-time PnL Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RealtimePnL />
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-magenta" />策略执行状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "网格交易-BTC/USDT", status: "运行中", uptime: "99.8%", orders: 847 + Math.floor(sys.ordersToday * 0.02), latency: `${Math.max(3, sys.apiLatency - 4)}ms`, color: "#00d4ff" },
              { name: "趋势跟随-ETH/USDT", status: "运行中", uptime: "99.5%", orders: 124 + Math.floor(sys.ordersToday * 0.005), latency: `${Math.max(5, sys.apiLatency + 2)}ms`, color: "#00ff88" },
              { name: "AI预测-SOL/USDT", status: "学习中", uptime: "98.2%", orders: 56 + Math.floor(sys.ordersToday * 0.002), latency: `${Math.round(sys.aiInferenceMs / 4)}ms`, color: "#ffaa00" },
              { name: "DeFi流动性挖矿", status: "运行中", uptime: "99.9%", orders: 312 + Math.floor(sys.ordersToday * 0.01), latency: `${Math.max(2, sys.apiLatency - 6)}ms`, color: "#8b5cf6" },
              { name: "动量策略-AVAX", status: "运行中", uptime: "99.1%", orders: 78 + Math.floor(sys.ordersToday * 0.003), latency: `${Math.max(8, sys.apiLatency + 5)}ms`, color: "#f43f5e" },
              { name: "资金费率策略", status: "运行中", uptime: "100%", orders: 1024 + Math.floor(sys.ordersToday * 0.04), latency: `${Math.max(2, sys.apiLatency - 8)}ms`, color: "#06b6d4" },
              { name: "多因子Alpha", status: "运行中", uptime: "99.7%", orders: 203 + Math.floor(sys.ordersToday * 0.008), latency: `${Math.max(5, sys.apiLatency)}ms`, color: "#84cc16" },
              { name: "均值回归-LINK", status: sys.activeStrategies >= 9 ? "运行中" : "暂停", uptime: "95.3%", orders: 34, latency: sys.activeStrategies >= 9 ? `${sys.apiLatency + 10}ms` : "--", color: "#f97316" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-secondary/20 row-interactive">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] font-medium w-32 truncate">{s.name}</span>
                <Badge variant="outline" className={`text-[9px] py-0 h-4 ${s.status === '运行中' ? 'border-cyber-green/30 text-cyber-green' : s.status === '学习中' ? 'border-cyber-amber/30 text-cyber-amber' : 'border-muted-foreground/30 text-muted-foreground'}`}>{s.status}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">可用 <span className="text-cyber-green font-mono">{s.uptime}</span></span>
                <span className="text-[10px] text-muted-foreground">延迟 <span className="text-cyber-blue font-mono">{s.latency}</span></span>
                <span className="text-[10px] text-muted-foreground">订单 <span className="font-mono">{s.orders}</span></span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Prediction Matrix */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-amber" />全币种AI预测信号矩阵
            <Badge variant="outline" className="text-[9px] text-cyber-green border-cyber-green/30 bg-cyber-green/10 ml-2">实时更新</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            <table className="w-full text-[11px] font-mono">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">币种</th>
                  <th className="text-left py-2 px-2">类别</th>
                  <th className="text-right py-2 px-2">价格</th>
                  <th className="text-right py-2 px-2">24h</th>
                  <th className="text-center py-2 px-2">AI信号</th>
                  <th className="text-right py-2 px-2">置信度</th>
                  <th className="text-center py-2 px-2">风险</th>
                  <th className="text-center py-2 px-2">建议</th>
                </tr>
              </thead>
              <tbody>
                {allCoins.map(coin => (
                  <tr key={coin.symbol} className="border-b border-border/50 row-interactive cursor-pointer">
                    <td className="py-2 px-2"><span className="font-bold text-foreground">{coin.symbol}</span> <span className="text-muted-foreground text-[10px]">{coin.name}</span></td>
                    <td className="py-2 px-2 text-muted-foreground">{coin.category}</td>
                    <td className="py-2 px-2 text-right text-foreground">${coin.price < 1 ? coin.price.toPrecision(4) : formatNumber(coin.price)}</td>
                    <td className={`py-2 px-2 text-right ${coin.change24h >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{coin.change24h >= 0 ? "+" : ""}{coin.change24h}%</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${signalColors[coin.aiSignal]}`}>{coin.aiSignal}</span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className={coin.aiConfidence > 75 ? "text-cyber-green" : coin.aiConfidence > 60 ? "text-cyber-amber" : "text-muted-foreground"}>{coin.aiConfidence}%</span>
                    </td>
                    <td className={`py-2 px-2 text-center ${riskColors[coin.riskLevel]}`}>{coin.riskLevel}</td>
                    <td className="py-2 px-2 text-center">
                      {coin.aiSignal.includes("看涨") ? <span className="text-cyber-green flex items-center justify-center gap-0.5"><Eye className="w-3 h-3" />关注</span>
                        : coin.aiSignal.includes("看跌") ? <span className="text-cyber-magenta flex items-center justify-center gap-0.5"><Shield className="w-3 h-3" />规避</span>
                        : <span className="text-muted-foreground">观望</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyber-amber" />实时订单流
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2">时间</th>
                <th className="text-left py-2">交易对</th>
                <th className="text-center py-2">方向</th>
                <th className="text-right py-2">价格</th>
                <th className="text-right py-2">数量</th>
                <th className="text-right py-2">金额</th>
                <th className="text-left py-2">策略</th>
                <th className="text-left py-2">交易所</th>
              </tr>
            </thead>
            <tbody>
              {(recentTrades as unknown as Trade[]).map((trade) => {
                const side = trade.side || trade.type;
                const pair = trade.pair || `${trade.coin}/USDT`;
                const time = trade.time || (trade.executedAt ? new Date(trade.executedAt).toLocaleTimeString("zh-CN") : "");
                const strategy = trade.strategy || trade.strategyName || "";
                return (
                <tr key={trade.id} className="border-b border-border/50 row-interactive">
                  <td className="py-2 text-muted-foreground">{time}</td>
                  <td className="py-2 font-bold text-foreground">{pair}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${side === "买入" ? "text-cyber-green bg-cyber-green/10" : "text-cyber-magenta bg-cyber-magenta/10"}`}>{side}</span>
                  </td>
                  <td className="py-2 text-right text-foreground">${formatNumber(trade.price)}</td>
                  <td className="py-2 text-right text-foreground">{trade.amount}</td>
                  <td className="py-2 text-right text-cyber-blue">${formatNumber(trade.total)}</td>
                  <td className="py-2 text-cyber-amber">{strategy}</td>
                  <td className="py-2 text-muted-foreground">{trade.exchange}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
