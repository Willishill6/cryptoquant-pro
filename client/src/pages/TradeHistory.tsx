/**
 * TradeHistory - 全币种交易历史与持仓明细
 * Design: Cyberpunk terminal aesthetic
 * Features: Trade history table, order tracking, position details, AI trade analysis
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Search, Download, Clock, CheckCircle2, XCircle, Loader2, Eye, TrendingUp, TrendingDown, Wallet, BarChart3, RefreshCw, FileText, Calendar, Coins, Brain, Percent, ShieldCheck, Zap, AlertTriangle, PieChart, Target, ArrowRightLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allCoins as staticCoins } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { IMAGES } from "@/lib/images";
import { toast } from "sonner";

// Generate deterministic mock trades
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const tradeTypes = ["买入", "卖出"] as const;
const orderStatuses = ["已成交", "部分成交", "待成交", "已取消", "已过期"] as const;
const strategyNames = ["网格交易", "趋势跟随", "动量策略", "AI预测", "DeFi流动性", "资金费率", "多因子Alpha", "均值回归"];
const exchanges = ["Binance", "OKX", "HTX", "Bybit", "Coinbase", "KuCoin"];

interface Trade {
  id: string;
  time: string;
  coin: string;
  type: "买入" | "卖出";
  price: number;
  amount: number;
  total: number;
  fee: number;
  strategy: string;
  exchange: string;
  status: string;
  pnl: number;
  aiConfidence: number;
}

interface Position {
  coin: string;
  name: string;
  amount: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
  strategy: string;
  exchange: string;
  aiSignal: string;
  riskLevel: string;
}

interface Order {
  id: string;
  time: string;
  coin: string;
  type: "买入" | "卖出";
  orderType: string;
  price: number;
  amount: number;
  filled: number;
  status: string;
  strategy: string;
  exchange: string;
}

// Generate 200 mock trades
const mockTrades: Trade[] = Array.from({ length: 200 }, (_, i) => {
  const seed = i * 17 + 42;
  const coinIdx = Math.floor(seededRandom(seed) * Math.min(staticCoins.length, 30));
  const coin = staticCoins[coinIdx];
  const type = tradeTypes[Math.floor(seededRandom(seed + 1) * 2)];
  const price = coin.price * (0.95 + seededRandom(seed + 2) * 0.1);
  const amount = (seededRandom(seed + 3) * 10 + 0.01) * (coin.price > 1000 ? 0.1 : coin.price > 100 ? 1 : coin.price > 1 ? 100 : 10000);
  const total = price * amount;
  const fee = total * 0.001;
  const pnl = (seededRandom(seed + 4) - 0.4) * total * 0.05;
  const hoursAgo = Math.floor(seededRandom(seed + 5) * 720);
  const date = new Date(Date.now() - hoursAgo * 3600000);

  return {
    id: `TRD-${String(10000 + i).slice(1)}`,
    time: date.toISOString().replace("T", " ").slice(0, 19),
    coin: coin.symbol,
    type,
    price,
    amount,
    total,
    fee,
    strategy: strategyNames[Math.floor(seededRandom(seed + 6) * strategyNames.length)],
    exchange: exchanges[Math.floor(seededRandom(seed + 7) * exchanges.length)],
    status: orderStatuses[Math.floor(seededRandom(seed + 8) * 2)] as string, // mostly filled
    pnl,
    aiConfidence: 50 + seededRandom(seed + 9) * 45,
  };
}).sort((a, b) => b.time.localeCompare(a.time));

// Generate positions from tracked coins
const mockPositions: Position[] = staticCoins
  .filter(c => c.tracked && c.category !== "稳定币")
  .map((coin, i) => {
    const seed = i * 31 + 7;
    const amount = (seededRandom(seed) * 50 + 1) * (coin.price > 1000 ? 0.5 : coin.price > 100 ? 5 : coin.price > 1 ? 500 : 50000);
    const avgCost = coin.price * (0.85 + seededRandom(seed + 1) * 0.2);
    const value = coin.price * amount;
    const pnl = (coin.price - avgCost) * amount;
    const pnlPercent = ((coin.price - avgCost) / avgCost) * 100;
    return {
      coin: coin.symbol,
      name: coin.name,
      amount,
      avgCost,
      currentPrice: coin.price,
      value,
      pnl,
      pnlPercent,
      allocation: 0,
      strategy: strategyNames[Math.floor(seededRandom(seed + 2) * strategyNames.length)],
      exchange: exchanges[Math.floor(seededRandom(seed + 3) * exchanges.length)],
      aiSignal: coin.aiSignal,
      riskLevel: coin.riskLevel,
    };
  });

const totalValue = mockPositions.reduce((s, p) => s + p.value, 0);
mockPositions.forEach(p => { p.allocation = (p.value / totalValue) * 100; });
mockPositions.sort((a, b) => b.value - a.value);

// Generate pending orders
const mockOrders: Order[] = Array.from({ length: 25 }, (_, i) => {
  const seed = i * 23 + 99;
  const coinIdx = Math.floor(seededRandom(seed) * 20);
  const coin = staticCoins[coinIdx];
  const type = tradeTypes[Math.floor(seededRandom(seed + 1) * 2)];
  const price = coin.price * (type === "买入" ? (0.9 + seededRandom(seed + 2) * 0.05) : (1.05 + seededRandom(seed + 2) * 0.1));
  const amount = (seededRandom(seed + 3) * 5 + 0.1) * (coin.price > 1000 ? 0.1 : coin.price > 100 ? 1 : coin.price > 1 ? 100 : 10000);
  const filled = seededRandom(seed + 4) < 0.3 ? amount * seededRandom(seed + 5) : 0;
  const status = filled > 0 ? "部分成交" : seededRandom(seed + 6) < 0.7 ? "待成交" : "已取消";
  const hoursAgo = Math.floor(seededRandom(seed + 7) * 48);
  const date = new Date(Date.now() - hoursAgo * 3600000);

  return {
    id: `ORD-${String(20000 + i).slice(1)}`,
    time: date.toISOString().replace("T", " ").slice(0, 19),
    coin: coin.symbol,
    type,
    orderType: seededRandom(seed + 8) < 0.5 ? "限价单" : seededRandom(seed + 8) < 0.8 ? "止损单" : "条件单",
    price,
    amount,
    filled,
    status,
    strategy: strategyNames[Math.floor(seededRandom(seed + 9) * strategyNames.length)],
    exchange: exchanges[Math.floor(seededRandom(seed + 10) * exchanges.length)],
  };
}).sort((a, b) => b.time.localeCompare(a.time));

function formatNum(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.001) return n.toFixed(6);
  return n.toFixed(8);
}

export default function TradeHistory() {
  const { coins: allCoins } = useLiveCoins();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "买入" | "卖出">("all");
  const [filterExchange, setFilterExchange] = useState("all");
  const [filterStrategy, setFilterStrategy] = useState("all");
  const [tradeDetailId, setTradeDetailId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // === 仓位自动管理 状态 ===
  const [posEnabled, setPosEnabled] = useState(true);
  const [globalMaxPct, setGlobalMaxPct] = useState(70);       // AI最多可用总资金%
  const [singleMaxPct, setSingleMaxPct] = useState(15);       // 单币种最大占比%
  const [singleOrderPct, setSingleOrderPct] = useState(5);    // 单笔下单最大占比%
  const [dailyMaxPct, setDailyMaxPct] = useState(30);         // 每日最大交易额占比%
  const [reserveCash, setReserveCash] = useState(20);         // 强制保留现金%
  const [memeMaxPct, setMemeMaxPct] = useState(10);           // Meme币板块上限%
  const [altMaxPct, setAltMaxPct] = useState(25);             // 山寨币板块上限%
  const [defiMaxPct, setDefiMaxPct] = useState(20);           // DeFi板块上限%
  const [leverageMax, setLeverageMax] = useState(3);          // 最大杠杆
  const [stopLossPct, setStopLossPct] = useState(8);          // 全局止损线%
  const [autoRebalance, setAutoRebalance] = useState(true);   // 自动再平衡
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5); // 再平衡偏离阈值%
  const totalFund = 2458932.50; // 模拟总资金

  // Summary stats
  const totalTrades = mockTrades.length;
  const totalPnl = mockTrades.reduce((s, t) => s + t.pnl, 0);
  const totalVolume = mockTrades.reduce((s, t) => s + t.total, 0);
  const totalFees = mockTrades.reduce((s, t) => s + t.fee, 0);
  const winRate = (mockTrades.filter(t => t.pnl > 0).length / totalTrades * 100);
  const totalPositionValue = mockPositions.reduce((s, p) => s + p.value, 0);
  const totalPositionPnl = mockPositions.reduce((s, p) => s + p.pnl, 0);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return mockTrades.filter(t => {
      if (searchTerm && !t.coin.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterExchange !== "all" && t.exchange !== filterExchange) return false;
      if (filterStrategy !== "all" && t.strategy !== filterStrategy) return false;
      return true;
    });
  }, [searchTerm, filterType, filterExchange, filterStrategy]);

  const pagedTrades = filteredTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredTrades.length / pageSize);

  return (
    <div className="space-y-5">
      {/* Header with hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-lg overflow-hidden h-32">
        <img src={IMAGES.tradingEngine} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 p-5 flex items-center gap-3 h-full">
          <div className="w-10 h-10 rounded-md bg-cyber-blue/20 flex items-center justify-center glow-blue">
            <FileText className="w-6 h-6 text-cyber-blue" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wider">交易管理</h1>
            <p className="text-sm text-muted-foreground">全币种交易历史 · 订单跟踪 · 持仓明细 · AI交易分析</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "总交易数", value: totalTrades.toString(), icon: BarChart3, color: "text-cyber-blue" },
          { label: "总盈亏", value: `${totalPnl >= 0 ? "+" : ""}$${formatNum(totalPnl)}`, icon: totalPnl >= 0 ? TrendingUp : TrendingDown, color: totalPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta" },
          { label: "胜率", value: `${winRate.toFixed(1)}%`, icon: CheckCircle2, color: "text-cyber-green" },
          { label: "总交易量", value: `$${formatNum(totalVolume)}`, icon: Coins, color: "text-cyber-blue" },
          { label: "总手续费", value: `$${formatNum(totalFees)}`, icon: Wallet, color: "text-cyber-amber" },
          { label: "持仓价值", value: `$${formatNum(totalPositionValue)}`, icon: Wallet, color: "text-cyber-blue" },
          { label: "持仓盈亏", value: `${totalPositionPnl >= 0 ? "+" : ""}$${formatNum(totalPositionPnl)}`, icon: totalPositionPnl >= 0 ? TrendingUp : TrendingDown, color: totalPositionPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`font-mono text-sm font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="history">交易历史</TabsTrigger>
          <TabsTrigger value="orders">订单跟踪</TabsTrigger>
          <TabsTrigger value="positions">持仓明细</TabsTrigger>
          <TabsTrigger value="autoPosition">仓位自动管理</TabsTrigger>
          <TabsTrigger value="analysis">AI交易分析</TabsTrigger>
        </TabsList>

        {/* Trade History Tab */}
        <TabsContent value="history">
          {/* Filters */}
          <Card className="bg-card border-border mb-3">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索币种或交易ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary border border-border rounded-md focus:border-cyber-blue/50 focus:outline-none"
                  />
                </div>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value as typeof filterType); setCurrentPage(1); }} className="text-xs bg-secondary border border-border rounded-md px-2 py-1.5 focus:border-cyber-blue/50 focus:outline-none">
                  <option value="all">全部方向</option>
                  <option value="买入">买入</option>
                  <option value="卖出">卖出</option>
                </select>
                <select value={filterExchange} onChange={(e) => { setFilterExchange(e.target.value); setCurrentPage(1); }} className="text-xs bg-secondary border border-border rounded-md px-2 py-1.5 focus:border-cyber-blue/50 focus:outline-none">
                  <option value="all">全部交易所</option>
                  {exchanges.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select value={filterStrategy} onChange={(e) => { setFilterStrategy(e.target.value); setCurrentPage(1); }} className="text-xs bg-secondary border border-border rounded-md px-2 py-1.5 focus:border-cyber-blue/50 focus:outline-none">
                  <option value="all">全部策略</option>
                  {strategyNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast.success("交易记录已导出")}>
                  <Download className="w-3 h-3 mr-1" /> 导出
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trade Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-2.5 font-mono text-muted-foreground">时间</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">交易ID</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">币种</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">方向</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">价格</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">数量</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">金额</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">盈亏</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">策略</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">交易所</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">AI置信度</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTrades.map((trade, i) => (
                      <motion.tr
                        key={trade.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">{trade.time.slice(5)}</td>
                        <td className="p-2.5 font-mono text-cyber-blue">{trade.id}</td>
                        <td className="p-2.5 font-mono font-bold">{trade.coin}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className={`text-[10px] ${trade.type === "买入" ? "text-cyber-green border-cyber-green/30" : "text-cyber-magenta border-cyber-magenta/30"}`}>
                            {trade.type === "买入" ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                            {trade.type}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono">${formatPrice(trade.price)}</td>
                        <td className="p-2.5 text-right font-mono">{trade.amount.toFixed(4)}</td>
                        <td className="p-2.5 text-right font-mono">${formatNum(trade.total)}</td>
                        <td className={`p-2.5 text-right font-mono font-bold ${trade.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                          {trade.pnl >= 0 ? "+" : ""}${formatNum(trade.pnl)}
                        </td>
                        <td className="p-2.5">
                          <Badge variant="secondary" className="text-[10px]">{trade.strategy}</Badge>
                        </td>
                        <td className="p-2.5 font-mono text-muted-foreground">{trade.exchange}</td>
                        <td className="p-2.5 text-center">
                          <span className={`font-mono text-[10px] ${trade.aiConfidence > 75 ? "text-cyber-green" : trade.aiConfidence > 60 ? "text-cyber-amber" : "text-muted-foreground"}`}>
                            {trade.aiConfidence.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setTradeDetailId(tradeDetailId === trade.id ? null : trade.id)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between p-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  共 {filteredTrades.length} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="text-xs h-6 px-2" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                    if (page < 1 || page > totalPages) return null;
                    return (
                      <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="text-xs h-6 w-6 p-0" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" className="text-xs h-6 px-2" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Tracking Tab */}
        <TabsContent value="orders">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyber-amber" /> 活跃订单 ({mockOrders.filter(o => o.status !== "已取消").length})
                </CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast.info("正在刷新订单状态...")}>
                  <RefreshCw className="w-3 h-3 mr-1" /> 刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-2.5 font-mono text-muted-foreground">时间</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">订单ID</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">币种</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">方向</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">类型</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">委托价</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">数量</th>
                      <th className="text-right p-2.5 font-mono text-muted-foreground">已成交</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">状态</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">策略</th>
                      <th className="text-left p-2.5 font-mono text-muted-foreground">交易所</th>
                      <th className="text-center p-2.5 font-mono text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrders.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${order.status === "已取消" ? "opacity-50" : ""}`}
                      >
                        <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">{order.time.slice(5)}</td>
                        <td className="p-2.5 font-mono text-cyber-blue">{order.id}</td>
                        <td className="p-2.5 font-mono font-bold">{order.coin}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className={`text-[10px] ${order.type === "买入" ? "text-cyber-green border-cyber-green/30" : "text-cyber-magenta border-cyber-magenta/30"}`}>
                            {order.type}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          <Badge variant="secondary" className="text-[10px]">{order.orderType}</Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono">${formatPrice(order.price)}</td>
                        <td className="p-2.5 text-right font-mono">{order.amount.toFixed(4)}</td>
                        <td className="p-2.5 text-right font-mono">
                          {order.filled > 0 ? (
                            <span className="text-cyber-amber">{order.filled.toFixed(4)}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className={`text-[10px] ${
                            order.status === "待成交" ? "text-cyber-amber border-cyber-amber/30" :
                            order.status === "部分成交" ? "text-cyber-blue border-cyber-blue/30" :
                            order.status === "已取消" ? "text-muted-foreground border-border" :
                            "text-cyber-green border-cyber-green/30"
                          }`}>
                            {order.status === "待成交" && <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />}
                            {order.status === "已取消" && <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                            {order.status === "部分成交" && <Clock className="w-2.5 h-2.5 mr-0.5" />}
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          <Badge variant="secondary" className="text-[10px]">{order.strategy}</Badge>
                        </td>
                        <td className="p-2.5 font-mono text-muted-foreground">{order.exchange}</td>
                        <td className="p-2.5 text-center">
                          {order.status !== "已取消" && (
                            <Button variant="ghost" size="sm" className="h-5 text-[10px] text-cyber-magenta hover:text-cyber-magenta px-1" onClick={() => toast.info(`订单 ${order.id} 已撤销`)}>
                              撤销
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <div className="space-y-3">
            {/* Position Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">持仓币种数</p>
                  <p className="font-mono text-lg font-bold text-cyber-blue">{mockPositions.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">总持仓价值</p>
                  <p className="font-mono text-lg font-bold">${formatNum(totalPositionValue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">未实现盈亏</p>
                  <p className={`font-mono text-lg font-bold ${totalPositionPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {totalPositionPnl >= 0 ? "+" : ""}${formatNum(totalPositionPnl)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">盈利持仓占比</p>
                  <p className="font-mono text-lg font-bold text-cyber-green">
                    {(mockPositions.filter(p => p.pnl > 0).length / mockPositions.length * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Position Table */}
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left p-2.5 font-mono text-muted-foreground">币种</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">持仓量</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">均价</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">现价</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">市值</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">盈亏</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">盈亏%</th>
                        <th className="text-right p-2.5 font-mono text-muted-foreground">占比</th>
                        <th className="text-left p-2.5 font-mono text-muted-foreground">策略</th>
                        <th className="text-center p-2.5 font-mono text-muted-foreground">AI信号</th>
                        <th className="text-center p-2.5 font-mono text-muted-foreground">风险</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPositions.map((pos, i) => (
                        <motion.tr
                          key={pos.coin}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="p-2.5">
                            <div>
                              <span className="font-mono font-bold">{pos.coin}</span>
                              <span className="text-muted-foreground ml-1 text-[10px]">{pos.name}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono">{pos.amount.toFixed(4)}</td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">${formatPrice(pos.avgCost)}</td>
                          <td className="p-2.5 text-right font-mono">${formatPrice(pos.currentPrice)}</td>
                          <td className="p-2.5 text-right font-mono">${formatNum(pos.value)}</td>
                          <td className={`p-2.5 text-right font-mono font-bold ${pos.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {pos.pnl >= 0 ? "+" : ""}${formatNum(pos.pnl)}
                          </td>
                          <td className={`p-2.5 text-right font-mono font-bold ${pos.pnlPercent >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-blue rounded-full" style={{ width: `${Math.min(pos.allocation, 100)}%` }} />
                              </div>
                              <span className="font-mono text-[10px] w-8 text-right">{pos.allocation.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-2.5">
                            <Badge variant="secondary" className="text-[10px]">{pos.strategy}</Badge>
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge variant="outline" className={`text-[10px] ${
                              pos.aiSignal.includes("看涨") ? "text-cyber-green border-cyber-green/30" :
                              pos.aiSignal.includes("看跌") ? "text-cyber-magenta border-cyber-magenta/30" :
                              "text-muted-foreground border-border"
                            }`}>
                              {pos.aiSignal}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge variant="outline" className={`text-[10px] ${
                              pos.riskLevel === "低" ? "text-cyber-green border-cyber-green/30" :
                              pos.riskLevel === "中" ? "text-cyber-amber border-cyber-amber/30" :
                              "text-cyber-magenta border-cyber-magenta/30"
                            }`}>
                              {pos.riskLevel}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ 仓位自动管理 Tab ============ */}
        <TabsContent value="autoPosition">
          <div className="space-y-4">
            {/* 顶部警告 + 总开关 */}
            <Card className="bg-card border-cyber-amber/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-cyber-amber mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-bold tracking-wider mb-1">仓位资金百分比限制 — 防止AI全仓买入</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      如果不设置资金使用上限，AI可能在高置信度信号下将全部资金投入单一币种，导致极端风险。
                      启用此功能后，AI的每笔交易和总持仓都将受到严格的百分比限制，确保资金安全。
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-mono ${posEnabled ? "text-cyber-green" : "text-muted-foreground"}`}>
                      {posEnabled ? "已启用" : "已关闭"}
                    </span>
                    <Switch checked={posEnabled} onCheckedChange={setPosEnabled} />
                  </div>
                </div>
                {!posEnabled && (
                  <div className="mt-3 p-2 rounded bg-cyber-magenta/10 border border-cyber-magenta/30">
                    <p className="text-xs text-cyber-magenta flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <strong>危险：</strong>仓位限制已关闭，AI可能使用100%资金进行单笔交易，极端行情下可能导致重大损失！
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 资金使用概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "总资金", value: `$${formatNum(totalFund)}`, sub: "账户净值", icon: Wallet, color: "text-cyber-blue" },
                { label: "AI可用资金", value: `$${formatNum(totalFund * globalMaxPct / 100)}`, sub: `总资金的 ${globalMaxPct}%`, icon: Zap, color: "text-cyber-green" },
                { label: "强制保留现金", value: `$${formatNum(totalFund * reserveCash / 100)}`, sub: `锁定 ${reserveCash}%`, icon: Lock, color: "text-cyber-amber" },
                { label: "单笔最大下单", value: `$${formatNum(totalFund * singleOrderPct / 100)}`, sub: `总资金的 ${singleOrderPct}%`, icon: Target, color: "text-cyber-magenta" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                        <span className="text-[10px] text-muted-foreground">{s.label}</span>
                      </div>
                      <p className={`font-mono text-base font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* 资金分配可视化条 */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyber-blue" /> 资金分配总览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-6 rounded-md overflow-hidden flex bg-secondary">
                    <div className="bg-cyber-green/70 flex items-center justify-center" style={{ width: `${globalMaxPct - reserveCash}%` }}>
                      <span className="text-[9px] font-mono text-white font-bold">AI可交易 {globalMaxPct - reserveCash}%</span>
                    </div>
                    <div className="bg-cyber-amber/70 flex items-center justify-center" style={{ width: `${reserveCash}%` }}>
                      <span className="text-[9px] font-mono text-white font-bold">保留现金 {reserveCash}%</span>
                    </div>
                    <div className="bg-secondary flex items-center justify-center" style={{ width: `${100 - globalMaxPct}%` }}>
                      <span className="text-[9px] font-mono text-muted-foreground font-bold">禁用 {100 - globalMaxPct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-green/70" />AI可交易区</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-amber/70" />强制保留现金</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-secondary border border-border" />禁止使用</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 左列：全局资金限制 */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyber-green" /> 全局资金限制
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* AI最大可用资金 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <Percent className="w-3 h-3 text-cyber-blue" /> AI最大可用资金比例
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-green">{globalMaxPct}%</span>
                      </div>
                      <Slider value={[globalMaxPct]} onValueChange={([v]) => setGlobalMaxPct(v)} min={10} max={90} step={5} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">AI最多可使用总资金的 {globalMaxPct}%（${formatNum(totalFund * globalMaxPct / 100)}）进行交易</p>
                    </div>

                    {/* 强制保留现金 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-cyber-amber" /> 强制保留现金比例
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-amber">{reserveCash}%</span>
                      </div>
                      <Slider value={[reserveCash]} onValueChange={([v]) => setReserveCash(v)} min={5} max={50} step={5} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">无论任何情况，至少保留 {reserveCash}%（${formatNum(totalFund * reserveCash / 100)}）现金不参与交易</p>
                    </div>

                    {/* 单币种最大持仓 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <Coins className="w-3 h-3 text-cyber-blue" /> 单币种最大持仓比例
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-blue">{singleMaxPct}%</span>
                      </div>
                      <Slider value={[singleMaxPct]} onValueChange={([v]) => setSingleMaxPct(v)} min={2} max={40} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">任何单个币种的持仓不得超过总资金的 {singleMaxPct}%（${formatNum(totalFund * singleMaxPct / 100)}）</p>
                    </div>

                    {/* 单笔下单上限 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-cyber-magenta" /> 单笔下单最大比例
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-magenta">{singleOrderPct}%</span>
                      </div>
                      <Slider value={[singleOrderPct]} onValueChange={([v]) => setSingleOrderPct(v)} min={1} max={20} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">AI每笔交易金额不超过总资金的 {singleOrderPct}%（${formatNum(totalFund * singleOrderPct / 100)}），防止单笔重仓</p>
                    </div>

                    {/* 每日交易额上限 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-cyber-amber" /> 每日交易额上限
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-amber">{dailyMaxPct}%</span>
                      </div>
                      <Slider value={[dailyMaxPct]} onValueChange={([v]) => setDailyMaxPct(v)} min={5} max={80} step={5} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">每日累计交易额不超过总资金的 {dailyMaxPct}%（${formatNum(totalFund * dailyMaxPct / 100)}），控制换手率</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 杠杆 & 止损 */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-cyber-magenta" /> 杠杆与止损限制
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium">最大杠杆倍数</label>
                        <span className="font-mono text-sm font-bold text-cyber-magenta">{leverageMax}x</span>
                      </div>
                      <Slider value={[leverageMax]} onValueChange={([v]) => setLeverageMax(v)} min={1} max={20} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">AI使用杠杆不超过 {leverageMax}x，{leverageMax <= 3 ? "低风险" : leverageMax <= 10 ? "中等风险" : "高风险"}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium">全局止损线（总资金回撤）</label>
                        <span className="font-mono text-sm font-bold text-cyber-magenta">-{stopLossPct}%</span>
                      </div>
                      <Slider value={[stopLossPct]} onValueChange={([v]) => setStopLossPct(v)} min={2} max={30} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">当总资金回撤达到 {stopLossPct}%（亏损 ${formatNum(totalFund * stopLossPct / 100)}），AI自动暂停所有交易</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右列：板块限制 + 再平衡 */}
              <div className="space-y-4">
                {/* 板块资金上限 */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-cyber-amber" /> 板块资金上限
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-[10px] text-muted-foreground">限制AI在各板块的最大资金占比，避免过度集中于高风险板块</p>

                    {/* Meme币 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyber-magenta" /> Meme币板块
                          <Badge variant="outline" className="text-[9px] text-cyber-magenta border-cyber-magenta/30 ml-1">
                            {allCoins.filter(c => c.category === "Meme币").length}个币种
                          </Badge>
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-magenta">{memeMaxPct}%</span>
                      </div>
                      <Slider value={[memeMaxPct]} onValueChange={([v]) => setMemeMaxPct(v)} min={0} max={30} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">Meme币总持仓不超过 ${formatNum(totalFund * memeMaxPct / 100)}，{memeMaxPct <= 5 ? "极保守" : memeMaxPct <= 15 ? "适中" : "激进"}</p>
                    </div>

                    {/* 山寨币 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyber-amber" /> 山寨币板块
                          <Badge variant="outline" className="text-[9px] text-cyber-amber border-cyber-amber/30 ml-1">
                            {allCoins.filter(c => c.category === "山寨币").length}个币种
                          </Badge>
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-amber">{altMaxPct}%</span>
                      </div>
                      <Slider value={[altMaxPct]} onValueChange={([v]) => setAltMaxPct(v)} min={0} max={50} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">山寨币总持仓不超过 ${formatNum(totalFund * altMaxPct / 100)}</p>
                    </div>

                    {/* DeFi */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyber-blue" /> DeFi板块
                          <Badge variant="outline" className="text-[9px] text-cyber-blue border-cyber-blue/30 ml-1">
                            {allCoins.filter(c => c.category === "DeFi").length}个币种
                          </Badge>
                        </label>
                        <span className="font-mono text-sm font-bold text-cyber-blue">{defiMaxPct}%</span>
                      </div>
                      <Slider value={[defiMaxPct]} onValueChange={([v]) => setDefiMaxPct(v)} min={0} max={40} step={1} className="mb-1" />
                      <p className="text-[10px] text-muted-foreground">DeFi总持仓不超过 ${formatNum(totalFund * defiMaxPct / 100)}</p>
                    </div>

                    {/* 其他板块汇总 */}
                    <div className="p-2.5 rounded-md bg-secondary/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground mb-2">其他板块默认上限（可在高级设置中调整）</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          { name: "主流币", pct: 50, color: "text-cyber-green" },
                          { name: "基础设施", pct: 30, color: "text-cyber-blue" },
                          { name: "Layer2", pct: 25, color: "text-cyber-blue" },
                          { name: "AI概念", pct: 20, color: "text-cyber-amber" },
                          { name: "GameFi", pct: 15, color: "text-cyber-amber" },
                          { name: "RWA", pct: 15, color: "text-cyber-blue" },
                          { name: "隐私币", pct: 10, color: "text-cyber-magenta" },
                          { name: "预言机", pct: 15, color: "text-cyber-blue" },
                        ].map(s => (
                          <div key={s.name} className="flex items-center justify-between">
                            <span className="text-[10px]">{s.name}</span>
                            <span className={`font-mono text-[10px] font-bold ${s.color}`}>{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 自动再平衡 */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-cyber-blue" /> 自动再平衡
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">启用自动再平衡</p>
                        <p className="text-[10px] text-muted-foreground">当持仓偏离目标比例时自动调仓</p>
                      </div>
                      <Switch checked={autoRebalance} onCheckedChange={setAutoRebalance} />
                    </div>
                    {autoRebalance && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium">偏离触发阈值</label>
                          <span className="font-mono text-sm font-bold text-cyber-blue">{rebalanceThreshold}%</span>
                        </div>
                        <Slider value={[rebalanceThreshold]} onValueChange={([v]) => setRebalanceThreshold(v)} min={2} max={20} step={1} className="mb-1" />
                        <p className="text-[10px] text-muted-foreground">当任一持仓偏离目标比例超过 {rebalanceThreshold}% 时，AI自动执行再平衡</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 当前风控状态 */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyber-green" /> 当前风控状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { rule: "AI可用资金上限", status: `${globalMaxPct}% / $${formatNum(totalFund * globalMaxPct / 100)}`, ok: true },
                      { rule: "当前已用资金", status: `${(totalPositionValue / totalFund * 100).toFixed(1)}% / $${formatNum(totalPositionValue)}`, ok: (totalPositionValue / totalFund * 100) < globalMaxPct },
                      { rule: "保留现金", status: `${reserveCash}% 已锁定`, ok: true },
                      { rule: "单币种最大持仓", status: `${singleMaxPct}% / $${formatNum(totalFund * singleMaxPct / 100)}`, ok: true },
                      { rule: "最大单笔下单", status: `${singleOrderPct}% / $${formatNum(totalFund * singleOrderPct / 100)}`, ok: true },
                      { rule: "每日交易额上限", status: `${dailyMaxPct}%`, ok: true },
                      { rule: "杠杆限制", status: `≤${leverageMax}x`, ok: leverageMax <= 5 },
                      { rule: "全局止损线", status: `-${stopLossPct}%`, ok: true },
                      { rule: "Meme币上限", status: `${memeMaxPct}%`, ok: memeMaxPct <= 15 },
                      { rule: "山寨币上限", status: `${altMaxPct}%`, ok: altMaxPct <= 30 },
                    ].map(r => (
                      <div key={r.rule} className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                        <span className="text-[10px]">{r.rule}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold">{r.status}</span>
                          {r.ok ? (
                            <CheckCircle2 className="w-3 h-3 text-cyber-green" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-cyber-amber" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 底部操作栏 */}
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      setGlobalMaxPct(70); setSingleMaxPct(15); setSingleOrderPct(5); setDailyMaxPct(30);
                      setReserveCash(20); setMemeMaxPct(10); setAltMaxPct(25); setDefiMaxPct(20);
                      setLeverageMax(3); setStopLossPct(8); setPosEnabled(true); setAutoRebalance(true); setRebalanceThreshold(5);
                      toast.success("已恢复默认设置");
                    }}>
                      <RefreshCw className="w-3 h-3 mr-1" /> 恢复默认
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      setGlobalMaxPct(50); setSingleMaxPct(8); setSingleOrderPct(3); setDailyMaxPct(20);
                      setReserveCash(30); setMemeMaxPct(5); setAltMaxPct(15); setDefiMaxPct(15);
                      setLeverageMax(2); setStopLossPct(5);
                      toast.success("已切换为保守模式");
                    }}>
                      <ShieldCheck className="w-3 h-3 mr-1" /> 保守模式
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      setGlobalMaxPct(85); setSingleMaxPct(25); setSingleOrderPct(10); setDailyMaxPct(50);
                      setReserveCash(10); setMemeMaxPct(20); setAltMaxPct(40); setDefiMaxPct(30);
                      setLeverageMax(5); setStopLossPct(15);
                      toast.success("已切换为激进模式（风险较高）");
                    }}>
                      <Zap className="w-3 h-3 mr-1" /> 激进模式
                    </Button>
                  </div>
                  <Button size="sm" className="text-xs bg-cyber-green hover:bg-cyber-green/80 text-black" onClick={() => {
                    toast.success("仓位管理规则已保存并生效", { description: `AI可用 ${globalMaxPct}% | 单币种 ≤${singleMaxPct}% | 单笔 ≤${singleOrderPct}% | 保留现金 ${reserveCash}%` });
                  }}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> 保存设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Trade Analysis Tab */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Trade Performance by Strategy */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">策略交易表现</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategyNames.map((strategy, _i) => {
                  const stratTrades = mockTrades.filter(t => t.strategy === strategy);
                  const stratPnl = stratTrades.reduce((s, t) => s + t.pnl, 0);
                  const stratWinRate = stratTrades.length > 0 ? stratTrades.filter(t => t.pnl > 0).length / stratTrades.length * 100 : 0;
                  return (
                    <div key={strategy} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{strategy}</span>
                          <span className={`font-mono text-xs font-bold ${stratPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {stratPnl >= 0 ? "+" : ""}${formatNum(stratPnl)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>交易 {stratTrades.length}笔</span>
                          <span>胜率 <span className={stratWinRate > 55 ? "text-cyber-green" : "text-cyber-amber"}>{stratWinRate.toFixed(1)}%</span></span>
                        </div>
                        <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${stratPnl >= 0 ? "bg-cyber-green" : "bg-cyber-magenta"}`} style={{ width: `${stratWinRate}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Trade Performance by Coin */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">币种交易表现 Top 15</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const coinPnl = new Map<string, { pnl: number; count: number }>();
                  mockTrades.forEach(t => {
                    const cur = coinPnl.get(t.coin) || { pnl: 0, count: 0 };
                    cur.pnl += t.pnl;
                    cur.count += 1;
                    coinPnl.set(t.coin, cur);
                  });
                  return Array.from(coinPnl.entries())
                    .sort((a, b) => b[1].pnl - a[1].pnl)
                    .slice(0, 15)
                    .map(([coin, data]) => (
                      <div key={coin} className="flex items-center gap-3 p-1.5 rounded-md hover:bg-secondary/30 transition-colors">
                        <span className="font-mono font-bold text-xs w-12">{coin}</span>
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${data.pnl >= 0 ? "bg-cyber-green" : "bg-cyber-magenta"}`}
                            style={{ width: `${Math.min(Math.abs(data.pnl) / 500, 100)}%` }}
                          />
                        </div>
                        <span className={`font-mono text-xs font-bold w-20 text-right ${data.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                          {data.pnl >= 0 ? "+" : ""}${formatNum(data.pnl)}
                        </span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{data.count}笔</span>
                      </div>
                    ));
                })()}
              </CardContent>
            </Card>

            {/* AI Decision Explanation */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyber-amber" /> AI决策解释 - 最近交易
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockTrades.slice(0, 5).map((trade, i) => {
                  const factors = [
                    { name: "价格动量", weight: 15 + seededRandom(i * 7 + 1) * 25, impact: seededRandom(i * 7 + 2) > 0.4 ? "正向" : "负向" },
                    { name: "交易量异常", weight: 10 + seededRandom(i * 7 + 3) * 20, impact: seededRandom(i * 7 + 4) > 0.5 ? "正向" : "负向" },
                    { name: "链上活动", weight: 5 + seededRandom(i * 7 + 5) * 15, impact: seededRandom(i * 7 + 6) > 0.45 ? "正向" : "负向" },
                    { name: "市场情绪", weight: 8 + seededRandom(i * 7 + 7) * 18, impact: seededRandom(i * 7 + 8) > 0.5 ? "正向" : "负向" },
                    { name: "技术指标", weight: 12 + seededRandom(i * 7 + 9) * 22, impact: seededRandom(i * 7 + 10) > 0.4 ? "正向" : "负向" },
                    { name: "波动率预测", weight: 5 + seededRandom(i * 7 + 11) * 12, impact: seededRandom(i * 7 + 12) > 0.5 ? "正向" : "负向" },
                  ];
                  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
                  factors.forEach(f => { f.weight = (f.weight / totalWeight) * 100; });
                  factors.sort((a, b) => b.weight - a.weight);

                  return (
                    <div key={trade.id} className="p-3 rounded-md bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${trade.type === "买入" ? "text-cyber-green border-cyber-green/30" : "text-cyber-magenta border-cyber-magenta/30"}`}>
                            {trade.type} {trade.coin}
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">{trade.id}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{trade.time.slice(5)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-cyber-amber border-cyber-amber/30">
                          AI置信度 {trade.aiConfidence.toFixed(1)}%
                        </Badge>
                      </div>
                      {/* Factor weights bar */}
                      <div className="space-y-1">
                        {factors.map(f => (
                          <div key={f.name} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">{f.name}</span>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${f.impact === "正向" ? "bg-cyber-green/70" : "bg-cyber-magenta/70"}`}
                                style={{ width: `${f.weight}%` }}
                              />
                            </div>
                            <span className={`font-mono text-[10px] w-10 ${f.impact === "正向" ? "text-cyber-green" : "text-cyber-magenta"}`}>
                              {f.weight.toFixed(1)}%
                            </span>
                            <Badge variant="outline" className={`text-[9px] h-3.5 ${f.impact === "正向" ? "text-cyber-green border-cyber-green/20" : "text-cyber-magenta border-cyber-magenta/20"}`}>
                              {f.impact}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        AI推理: {trade.coin}在{trade.type === "买入" ? "多个正向因子共振" : "风险因子触发"}下，模型以{trade.aiConfidence.toFixed(1)}%置信度执行{trade.type}操作，
                        主要驱动因子为{factors[0].name}({factors[0].weight.toFixed(1)}%)和{factors[1].name}({factors[1].weight.toFixed(1)}%)。
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


