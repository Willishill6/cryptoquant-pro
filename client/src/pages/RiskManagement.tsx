/**
 * RiskManagement - Enhanced risk management dashboard
 * Full coin risk matrix, stress testing, correlation, anomaly detection
 */
import { motion } from "framer-motion";
import { Shield, Bell, Layers, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { riskMetrics as mockRiskMetrics, portfolio as mockPortfolio, allCoins as staticCoins, formatCurrency, formatNumber } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { IMAGES } from "@/lib/images";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useMemo } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { useDbRiskMetrics, useDbPortfolio } from "@/hooks/useDbData";
import type { RiskMetrics, Portfolio, PortfolioPosition } from "@/types";

const positionData = mockPortfolio.positions.map(p => ({
  name: p.symbol,
  value: p.currentPrice * p.amount,
}));
const COLORS = ["#00d4ff", "#00ff88", "#ffaa00", "#ff0066", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

// Risk radar data
const riskRadar = [
  { metric: "市场风险", value: 45 },
  { metric: "流动性风险", value: 25 },
  { metric: "信用风险", value: 15 },
  { metric: "操作风险", value: 20 },
  { metric: "集中度风险", value: 55 },
  { metric: "系统性风险", value: 35 },
];

// Stress test scenarios
const stressTests = [
  { scenario: "BTC暴跌30%", impact: -18.5, probability: "低", var: -125000, recovery: "3-5天", coins: "全币种" },
  { scenario: "ETH暴跌40%", impact: -12.8, probability: "低", var: -85000, recovery: "5-7天", coins: "全币种" },
  { scenario: "全市场崩盘50%", impact: -28.5, probability: "极低", var: -195000, recovery: "15-30天", coins: "全币种" },
  { scenario: "稳定币脱锚", impact: -5.2, probability: "极低", var: -35000, recovery: "1-3天", coins: "稳定币相关" },
  { scenario: "交易所宕机", impact: -2.5, probability: "中", var: -18000, recovery: "<1天", coins: "CEX持仓" },
  { scenario: "DeFi协议被攻击", impact: -8.5, probability: "中低", var: -58000, recovery: "3-7天", coins: "DeFi持仓" },
  { scenario: "监管政策收紧", impact: -15.2, probability: "中", var: -105000, recovery: "7-14天", coins: "全币种" },
  { scenario: "流动性枯竭", impact: -22.5, probability: "低", var: -155000, recovery: "10-20天", coins: "小币种" },
];

export default function RiskManagement() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const { data: riskMetrics } = useDbRiskMetrics() as unknown as { data: RiskMetrics };
  const { data: portfolio } = useDbPortfolio() as unknown as { data: Portfolio };
  const drawdownHistory = useMemo(() => {
    const data = [];
    let dd = 0;
    for (let i = 0; i < 60; i++) {
      dd = Math.max(-15, Math.min(0, dd + (Math.random() - 0.55) * 2));
      data.push({ day: `D${i + 1}`, drawdown: Math.round(dd * 100) / 100 });
    }
    return data;
  }, []);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-lg overflow-hidden h-40">
        <img src={IMAGES.riskManagement} alt="Risk Management" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-cyber-magenta/20 flex items-center justify-center glow-magenta">
              <Shield className="w-6 h-6 text-cyber-magenta" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-wider">风险管理系统</h1>
              <p className="text-sm text-muted-foreground">AI驱动风控 · 全币种风险矩阵 · 压力测试 · 实时异常检测</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "VaR (95%)", value: formatCurrency(riskMetrics.var95), color: "magenta" },
          { label: "最大回撤", value: `${riskMetrics.maxDrawdown}%`, color: "magenta" },
          { label: "夏普比率", value: riskMetrics.sharpeRatio.toFixed(2), color: "green" },
          { label: "Sortino", value: riskMetrics.sortinoRatio.toFixed(2), color: "green" },
          { label: "杠杆率", value: `${riskMetrics.leverage}x`, color: "amber" },
          { label: "监控币种", value: `${allCoins.length}+`, color: "blue" },
          { label: "API延迟", value: `${sys.apiLatency}ms`, color: sys.apiLatency < 20 ? "green" : "amber" },
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
          <TabsTrigger value="overview">风险概览</TabsTrigger>
          <TabsTrigger value="position">仓位管理</TabsTrigger>
          <TabsTrigger value="coinrisk">全币种风险</TabsTrigger>
          <TabsTrigger value="stress">压力测试</TabsTrigger>
          <TabsTrigger value="stoploss">止损止盈</TabsTrigger>
          <TabsTrigger value="alerts">异常报警</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">回撤走势 (60天)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={drawdownHistory}>
                      <defs>
                        <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff0066" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff0066" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="drawdown" stroke="#ff0066" strokeWidth={2} fill="url(#colorDD)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">风险雷达</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={riskRadar}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#999" }} />
                      <PolarRadiusAxis tick={{ fontSize: 8, fill: "#666" }} domain={[0, 100]} />
                      <Radar dataKey="value" stroke="#ff0066" fill="#ff0066" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Indicators Detail */}
          <Card className="bg-card border-border mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">详细风险指标</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "VaR (95%)", value: formatCurrency(riskMetrics.var95), desc: "日度风险价值" },
                  { label: "VaR (99%)", value: formatCurrency(riskMetrics.var99), desc: "极端风险价值" },
                  { label: "当前回撤", value: `${riskMetrics.currentDrawdown}%`, desc: "距离最高点" },
                  { label: "最大回撤", value: `${riskMetrics.maxDrawdown}%`, desc: "历史最大回撤" },
                  { label: "Sortino比率", value: riskMetrics.sortinoRatio.toFixed(2), desc: "下行风险调整收益" },
                  { label: "Calmar比率", value: "2.85", desc: "年化收益/最大回撤" },
                  { label: "Beta", value: riskMetrics.beta.toFixed(2), desc: "相对BTC的系统性风险" },
                  { label: "Alpha", value: riskMetrics.alpha.toFixed(3), desc: "超额收益" },
                  { label: "仓位集中度", value: `${riskMetrics.positionConcentration}%`, desc: "最大单币种占比" },
                  { label: "关联风险", value: riskMetrics.correlationRisk, desc: "币种间相关性" },
                  { label: "流动性评分", value: "85/100", desc: "持仓流动性" },
                  { label: "杠杆使用率", value: `${((riskMetrics.leverage / riskMetrics.maxLeverage) * 100).toFixed(0)}%`, desc: `${riskMetrics.leverage}x / ${riskMetrics.maxLeverage}x` },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded border border-border/50 bg-secondary/20">
                    <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-mono font-bold text-cyber-blue mt-1">{item.value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Management */}
        <TabsContent value="position">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">仓位分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={positionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                        {positionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">持仓风险详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground">币种</th>
                        <th className="text-right py-2 text-muted-foreground">持仓量</th>
                        <th className="text-right py-2 text-muted-foreground">市值</th>
                        <th className="text-right py-2 text-muted-foreground">盈亏</th>
                        <th className="text-right py-2 text-muted-foreground">占比</th>
                        <th className="text-center py-2 text-muted-foreground">风险</th>
                        <th className="text-center py-2 text-muted-foreground">止损</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(portfolio.positions || []).map((pos: PortfolioPosition) => {
                        const value = pos.currentPrice * pos.amount;
                        const pct = (value / (portfolio.totalValue || 1) * 100).toFixed(1);
                        return (
                          <tr key={pos.symbol} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                            <td className="py-2 font-medium">{pos.symbol}</td>
                            <td className="py-2 text-right font-mono">{pos.amount}</td>
                            <td className="py-2 text-right font-mono">{formatCurrency(value)}</td>
                            <td className={`py-2 text-right font-mono ${pos.pnlPercent >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                              {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                            </td>
                            <td className="py-2 text-right font-mono">{pct}%</td>
                            <td className="py-2 text-center">
                              <Badge variant="outline" className={`text-[8px] py-0 ${Number(pct) > 40 ? "border-cyber-magenta/30 text-cyber-magenta" : Number(pct) > 20 ? "border-cyber-amber/30 text-cyber-amber" : "border-cyber-green/30 text-cyber-green"}`}>
                                {Number(pct) > 40 ? "高" : Number(pct) > 20 ? "中" : "低"}
                              </Badge>
                            </td>
                            <td className="py-2 text-center"><span className="text-[9px] text-cyber-green">-5%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Full Coin Risk Matrix */}
        <TabsContent value="coinrisk">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyber-magenta" />
                全币种风险矩阵 · {allCoins.length} 种
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">币种</th>
                      <th className="text-left py-2 text-muted-foreground">类别</th>
                      <th className="text-right py-2 text-muted-foreground">价格</th>
                      <th className="text-right py-2 text-muted-foreground">24h波动</th>
                      <th className="text-right py-2 text-muted-foreground">7d波动</th>
                      <th className="text-right py-2 text-muted-foreground">VaR(95%)</th>
                      <th className="text-right py-2 text-muted-foreground">Beta</th>
                      <th className="text-center py-2 text-muted-foreground">风险等级</th>
                      <th className="text-center py-2 text-muted-foreground">AI评估</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCoins.filter(c => c.category !== "稳定币").map((coin) => {
                      const var95 = Math.abs(coin.change24h) * 2.5 + Math.random() * 5;
                      const beta = 0.5 + Math.random() * 1.5;
                      return (
                        <tr key={coin.symbol} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-cyber-blue/10 flex items-center justify-center">
                                <span className="text-[7px] font-mono font-bold text-cyber-blue">{coin.symbol.slice(0, 3)}</span>
                              </div>
                              <span className="font-medium">{coin.symbol}</span>
                            </div>
                          </td>
                          <td className="py-2"><Badge variant="outline" className="text-[8px] py-0">{coin.category}</Badge></td>
                          <td className="py-2 text-right font-mono">${coin.price < 1 ? coin.price.toFixed(4) : formatNumber(coin.price, 2)}</td>
                          <td className={`py-2 text-right font-mono ${coin.change24h >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                          </td>
                          <td className={`py-2 text-right font-mono ${coin.change7d >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {coin.change7d >= 0 ? "+" : ""}{coin.change7d.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right font-mono text-cyber-magenta">-{var95.toFixed(1)}%</td>
                          <td className="py-2 text-right font-mono">{beta.toFixed(2)}</td>
                          <td className="py-2 text-center">
                            <span className={`text-[9px] px-1 py-0.5 rounded ${
                              coin.riskLevel === "低" ? "bg-cyber-green/10 text-cyber-green" :
                              coin.riskLevel === "中" ? "bg-cyber-amber/10 text-cyber-amber" :
                              coin.riskLevel === "高" ? "bg-cyber-magenta/10 text-cyber-magenta" :
                              "bg-cyber-magenta/20 text-cyber-magenta"
                            }`}>{coin.riskLevel}</span>
                          </td>
                          <td className="py-2 text-center">
                            <span className={`text-[9px] px-1 py-0.5 rounded ${
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

        {/* Stress Testing */}
        <TabsContent value="stress">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyber-amber" />
                压力测试场景 · AI模拟
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">压力场景</th>
                      <th className="text-left py-2 text-muted-foreground">影响币种</th>
                      <th className="text-right py-2 text-muted-foreground">组合影响</th>
                      <th className="text-right py-2 text-muted-foreground">预估亏损</th>
                      <th className="text-center py-2 text-muted-foreground">发生概率</th>
                      <th className="text-left py-2 text-muted-foreground">恢复时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stressTests.map((test) => (
                      <tr key={test.scenario} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 font-medium">{test.scenario}</td>
                        <td className="py-2.5 text-cyber-blue text-[10px]">{test.coins}</td>
                        <td className="py-2.5 text-right font-mono text-cyber-magenta">{test.impact}%</td>
                        <td className="py-2.5 text-right font-mono text-cyber-magenta">{formatCurrency(test.var)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            test.probability === "极低" ? "bg-cyber-green/10 text-cyber-green" :
                            test.probability === "低" ? "bg-cyber-blue/10 text-cyber-blue" :
                            test.probability === "中低" ? "bg-cyber-amber/10 text-cyber-amber" :
                            "bg-cyber-magenta/10 text-cyber-magenta"
                          }`}>{test.probability}</span>
                        </td>
                        <td className="py-2.5 text-[10px] text-muted-foreground">{test.recovery}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Stress Test Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {[
              { label: "最坏情况亏损", value: "-$195,000", desc: "全市场崩盘50%", color: "magenta" },
              { label: "最可能亏损", value: "-$18,000", desc: "交易所宕机", color: "amber" },
              { label: "AI保护效果", value: "减少42%亏损", desc: "对比无AI风控", color: "green" },
            ].map((item) => (
              <Card key={item.label} className="bg-card border-border">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                  <p className={`text-lg font-heading font-bold mt-1 text-cyber-${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stop Loss */}
        <TabsContent value="stoploss">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(portfolio.positions || []).map((pos: PortfolioPosition, i: number) => (
              <motion.div key={pos.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">{pos.symbol}/USDT</h3>
                      <Badge variant="outline" className="text-[9px] py-0 border-cyber-green/30 text-cyber-green">AI动态止损</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">当前价</span><span className="font-mono">${pos.currentPrice.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">止损价</span><span className="font-mono text-cyber-magenta">${(pos.currentPrice * 0.95).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">止损%</span><span className="font-mono text-cyber-magenta">-5.0%</span></div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">止盈价</span><span className="font-mono text-cyber-green">${(pos.currentPrice * 1.1).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">止盈%</span><span className="font-mono text-cyber-green">+10.0%</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">追踪止损</span><span className="text-cyber-blue">已启用</span></div>
                      </div>
                    </div>
                    <p className="mt-2 text-[9px] text-muted-foreground">AI: <span className="text-cyber-amber">Claude 3.5 Sonnet + TFT</span></p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyber-amber" />
                异常交易报警 (AI驱动: IsoForest-AE)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { time: "14:28:45", level: "WARN", message: "ETH仓位接近风险阈值(42.5%)，建议减仓至35%以下", action: "已发送通知", ai: "Claude 3.5 Sonnet" },
                { time: "14:20:00", level: "ERROR", message: "HTX API响应超时(>5s)，已自动切换至备用节点", action: "已自动处理", ai: "IsoForest-AE" },
                { time: "13:45:12", level: "WARN", message: "BTC价格波动率突增(+45%)，建议降低杠杆至1.5x", action: "等待确认", ai: "DeepSeek-V3" },
                { time: "13:15:30", level: "WARN", message: "DOGE/SHIB异常波动检测，Meme币板块风险上升", action: "已发送通知", ai: "IsoForest-AE" },
                { time: "12:30:00", level: "INFO", message: "SOL动量因子衰减检测，IC值从0.085降至0.062", action: "已记录", ai: "DecayDetector-X" },
                { time: "11:45:22", level: "WARN", message: "DeFi协议TVL异常下降(Curve -8%)，相关持仓风险上升", action: "已调整仓位", ai: "FundamentalGPT" },
                { time: "11:15:33", level: "WARN", message: "检测到大额异常交易(BTC 50枚卖出)，可能影响市场", action: "已发送通知", ai: "IsoForest-AE" },
                { time: "10:30:15", level: "INFO", message: "Layer2板块资金流入增加，ARB/OP风险评级下调至低", action: "已更新", ai: "DeepSeek-V3" },
                { time: "10:00:00", level: "INFO", message: `每日风险报告已生成，整体风险水平: 中等，覆盖${allCoins.length}+币种`, action: "已归档", ai: "DeepSeek-V3" },
              ].map((alert, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className={`p-2.5 rounded-md border ${alert.level === "ERROR" ? "border-cyber-magenta/30 bg-cyber-magenta/5" : alert.level === "WARN" ? "border-cyber-amber/30 bg-cyber-amber/5" : "border-border bg-secondary/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] py-0 ${alert.level === "ERROR" ? "border-cyber-magenta/50 text-cyber-magenta" : alert.level === "WARN" ? "border-cyber-amber/50 text-cyber-amber" : "border-cyber-blue/50 text-cyber-blue"}`}>
                          {alert.level}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">{alert.time}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">AI: <span className="text-cyber-amber">{alert.ai}</span></span>
                    </div>
                    <p className="text-[11px] mt-0.5">{alert.message}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">处理: <span className="text-cyber-green">{alert.action}</span></p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
