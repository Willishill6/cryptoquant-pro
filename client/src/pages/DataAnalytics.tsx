/**
 * DataAnalytics - Enhanced data system with 5-year history, full coin coverage
 * Historical data learning, real-time collection, AI-enhanced analytics
 */
import { motion } from "framer-motion";
import { Database, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allCoins as staticCoins, formatNumber, coinCategories } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { IMAGES } from "@/lib/images";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { useMemo, useState } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";



// 5-year data collection timeline
const dataTimeline = [
  { year: "2021", records: "8.5亿", coins: 85, sources: 4, events: "牛市数据采集启动", status: "完成" },
  { year: "2022", records: "15.2亿", coins: 120, sources: 6, events: "熊市数据+链上数据接入", status: "完成" },
  { year: "2023", records: "28.8亿", coins: 180, sources: 8, events: "DeFi数据+社交数据接入", status: "完成" },
  { year: "2024", records: "52.5亿", coins: 220, sources: 10, events: "Layer2+Meme币数据接入", status: "完成" },
  { year: "2025", records: "85.2亿", coins: 280, sources: 12, events: "全币种覆盖+AI数据增强", status: "完成" },
  { year: "2026", records: "97.3亿", coins: `${staticCoins.length}+`, sources: 15, events: "实时全量数据+预测数据", status: "进行中" },
];

// Historical data growth curve
const dataGrowth = Array.from({ length: 60 }, (_, i) => ({
  month: `${2021 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`,
  records: Math.round(1e8 * Math.pow(1.06, i)),
  coins: Math.round(80 + i * 3.5),
}));

export default function DataAnalytics() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const [catFilter, setCatFilter] = useState("全部");
  const throughputData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    records: Math.round(800000 + Math.random() * 400000),
    latency: Math.round(5 + Math.random() * 15),
  })), []);

  const volumeData = useMemo(() => allCoins.slice(0, 15).map(c => ({
    name: c.symbol,
    volume: c.volume / 1e9,
  })), []);

  const filteredCoins = catFilter === "全部" ? allCoins : allCoins.filter(c => c.category === catFilter);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-lg overflow-hidden h-40">
        <img src={IMAGES.dataAnalytics} alt="Data Analytics" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-cyber-blue/20 flex items-center justify-center glow-blue">
              <Database className="w-6 h-6 text-cyber-blue" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-wider">数据分析系统</h1>
              <p className="text-sm text-muted-foreground">5年+历史数据 · 全币种采集 · 97.3亿条记录 · AI增强分析</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "数据源", value: "15", color: "green" },
          { label: "实时延迟", value: `${sys.apiLatency}ms`, color: sys.apiLatency < 20 ? "blue" : "amber" },
          { label: "日处理量", value: "2.8亿", color: "amber" },
          { label: "总记录数", value: "97.3亿", color: "blue" },
          { label: "历史跨度", value: "5年+", color: "green" },
          { label: "覆盖币种", value: `${allCoins.length}+`, color: "amber" },
          { label: "存储容量", value: "5.2TB", color: "blue" },
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

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="history">5年历史数据</TabsTrigger>
          <TabsTrigger value="realtime">实时数据</TabsTrigger>
          <TabsTrigger value="allcoins">全币种数据</TabsTrigger>
          <TabsTrigger value="storage">数据存储</TabsTrigger>
          <TabsTrigger value="indicators">技术指标</TabsTrigger>
          <TabsTrigger value="reports">分析报表</TabsTrigger>
          <TabsTrigger value="correlation">币种相关性</TabsTrigger>
        </TabsList>

        {/* 5-Year History */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* Data Growth Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">5年数据增长曲线 · 2021-2026</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dataGrowth}>
                      <defs>
                        <linearGradient id="dataGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#666" }} interval={5} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} tickFormatter={v => `${(v / 1e9).toFixed(1)}B`} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${(v / 1e9).toFixed(2)}B 条`, "记录数"]} />
                      <Area type="monotone" dataKey="records" stroke="#00d4ff" strokeWidth={2} fill="url(#dataGrowthGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">数据采集时间线</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dataTimeline.map((item, i) => (
                    <motion.div
                      key={item.year}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4 p-3 rounded border border-border/50 bg-secondary/20"
                    >
                      <div className="w-14 h-14 rounded-md bg-cyber-blue/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-heading font-bold text-cyber-blue">{item.year}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium">{item.events}</h4>
                          <Badge variant="outline" className={`text-[9px] py-0 ${item.status === "完成" ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>{item.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span>记录: <span className="text-cyber-blue font-mono">{item.records}</span></span>
                          <span>币种: <span className="text-cyber-green font-mono">{item.coins}</span></span>
                          <span>数据源: <span className="text-cyber-amber font-mono">{item.sources}</span></span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Historical Data Types */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">历史数据类型 · 全量采集</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {[
                    { type: "K线数据", period: "1m/5m/15m/1h/4h/1d", coins: "全币种", records: "32.5亿", from: "2021-01" },
                    { type: "逐笔成交", period: "Tick级别", coins: "主流币+二线币", records: "28.2亿", from: "2021-06" },
                    { type: "订单簿快照", period: "100ms", coins: "主流币", records: "15.8亿", from: "2022-01" },
                    { type: "链上交易", period: "区块级别", coins: "全链", records: "8.5亿", from: "2022-06" },
                    { type: "社交媒体", period: "实时", coins: "全币种", records: "5.2亿", from: "2023-01" },
                    { type: "新闻/公告", period: "实时", coins: "全币种", records: "1.8亿", from: "2023-01" },
                    { type: "DeFi TVL", period: "1h", coins: "DeFi币", records: "2.1亿", from: "2023-06" },
                    { type: "资金费率", period: "8h", coins: "合约币种", records: "1.2亿", from: "2021-01" },
                    { type: "清算数据", period: "实时", coins: "合约币种", records: "0.8亿", from: "2022-01" },
                    { type: "鲸鱼地址", period: "区块级别", coins: "全链", records: "0.5亿", from: "2023-01" },
                    { type: "矿工数据", period: "1h", coins: "PoW币", records: "0.3亿", from: "2021-01" },
                    { type: "宏观经济", period: "1d", coins: "全局", records: "0.2亿", from: "2021-01" },
                  ].map((dt) => (
                    <div key={dt.type} className="p-2.5 rounded border border-border/50 bg-secondary/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{dt.type}</span>
                        <span className="text-[8px] font-mono text-cyber-blue">{dt.records}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground space-y-0.5">
                        <p>周期: {dt.period}</p>
                        <p>覆盖: {dt.coins} · 起始: {dt.from}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Realtime */}
        <TabsContent value="realtime">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">数据吞吐量 (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={throughputData}>
                      <defs>
                        <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#666" }} />
                      <YAxis tick={{ fontSize: 9, fill: "#666" }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="records" stroke="#00d4ff" strokeWidth={2} fill="url(#colorRecords)" name="记录数" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">交易量Top 15</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 min-h-[224px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#666" }} tickFormatter={(v) => `$${v}B`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#888" }} width={40} />
                      <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`$${v.toFixed(2)}B`, "24h交易量"]} />
                      <Bar dataKey="volume" fill="#00ff88" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Sources */}
          <Card className="bg-card border-border mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">数据源状态 · 15个实时源</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {[
                  { name: "Binance WS", type: "实时行情", status: "在线", latency: 8, records: "1.2M/h" },
                  { name: "OKX WS", type: "实时行情", status: "在线", latency: 12, records: "890K/h" },
                  { name: "Coinbase WS", type: "实时行情", status: "在线", latency: 15, records: "650K/h" },
                  { name: "Bybit WS", type: "实时行情", status: "在线", latency: 10, records: "780K/h" },
                  { name: "Gate.io WS", type: "实时行情", status: "在线", latency: 18, records: "420K/h" },
                  { name: "HTX WS", type: "实时行情", status: "在线", latency: 22, records: "350K/h" },
                  { name: "CoinGecko", type: "市场数据", status: "在线", latency: 250, records: "50K/h" },
                  { name: "Etherscan", type: "链上数据", status: "在线", latency: 180, records: "120K/h" },
                  { name: "Twitter/X", type: "社交数据", status: "在线", latency: 350, records: "200K/h" },
                  { name: "DeFi Llama", type: "DeFi数据", status: "在线", latency: 200, records: "30K/h" },
                  { name: "Glassnode", type: "链上分析", status: "在线", latency: 300, records: "25K/h" },
                  { name: "Santiment", type: "情绪数据", status: "在线", latency: 280, records: "40K/h" },
                  { name: "CryptoQuant", type: "链上指标", status: "在线", latency: 220, records: "35K/h" },
                  { name: "Dune Analytics", type: "链上查询", status: "在线", latency: 500, records: "15K/h" },
                  { name: "宏观数据API", type: "宏观经济", status: "在线", latency: 1000, records: "5K/h" },
                ].map((source) => (
                  <div key={source.name} className="p-2.5 rounded-md border border-border bg-secondary/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium">{source.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span>{source.type}</span>
                      <span className="font-mono text-cyber-blue">{source.latency}ms</span>
                      <span className="font-mono">{source.records}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Coins Data */}
        <TabsContent value="allcoins">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">全币种数据采集 · {allCoins.length} 种</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {["全部", ...coinCategories].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCatFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[9px] transition-colors ${catFilter === cat ? "bg-cyber-blue text-background" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
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
                      <th className="text-right py-2 text-muted-foreground">价格</th>
                      <th className="text-right py-2 text-muted-foreground">24h量</th>
                      <th className="text-right py-2 text-muted-foreground">市值</th>
                      <th className="text-center py-2 text-muted-foreground">数据完整度</th>
                      <th className="text-center py-2 text-muted-foreground">历史深度</th>
                      <th className="text-center py-2 text-muted-foreground">AI信号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoins.map((coin) => {
                      const completeness = coin.category === "主流币" ? 99 : coin.category === "二线币" ? 95 : 85 + Math.random() * 10;
                      const histDepth = coin.category === "主流币" ? "5年+" : coin.category === "二线币" ? "4年+" : "2-3年";
                      return (
                        <tr key={coin.symbol} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-cyber-blue/10 flex items-center justify-center">
                                <span className="text-[7px] font-mono font-bold text-cyber-blue">{coin.symbol.slice(0, 3)}</span>
                              </div>
                              <div>
                                <span className="font-medium">{coin.symbol}</span>
                                <span className="text-[9px] text-muted-foreground ml-1">{coin.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-1.5"><Badge variant="outline" className="text-[8px] py-0">{coin.category}</Badge></td>
                          <td className="py-1.5 text-right font-mono">${coin.price < 1 ? coin.price.toFixed(4) : formatNumber(coin.price, 2)}</td>
                          <td className="py-1.5 text-right font-mono text-[10px]">${formatNumber(coin.volume / 1e9, 2)}B</td>
                          <td className="py-1.5 text-right font-mono text-[10px]">${formatNumber(coin.marketCap / 1e9, 1)}B</td>
                          <td className="py-1.5 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full bg-cyber-green rounded-full" style={{ width: `${completeness}%` }} />
                              </div>
                              <span className="text-[9px] font-mono text-cyber-green">{completeness.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-1.5 text-center text-[10px] text-cyber-blue">{histDepth}</td>
                          <td className="py-1.5 text-center">
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

        {/* Storage */}
        <TabsContent value="storage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "InfluxDB", type: "时序数据库", size: "2.8TB", records: "45.2亿", status: "运行中", usage: 68, desc: "K线/Tick数据存储" },
              { name: "TimescaleDB", type: "时序数据库", size: "1.5TB", records: "28.5亿", status: "运行中", usage: 52, desc: "订单簿/资金费率" },
              { name: "MongoDB", type: "文档数据库", size: "850GB", records: "12.8亿", status: "运行中", usage: 45, desc: "新闻/社交/链上数据" },
              { name: "Redis", type: "缓存", size: "64GB", records: "实时缓存", status: "运行中", usage: 78, desc: "实时行情/信号缓存" },
              { name: "ClickHouse", type: "分析数据库", size: "1.2TB", records: "8.5亿", status: "运行中", usage: 55, desc: "因子计算/回测数据" },
              { name: "S3 Archive", type: "冷存储", size: "12.5TB", records: "全量归档", status: "运行中", usage: 35, desc: "历史数据归档" },
            ].map((db, i) => (
              <motion.div key={db.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium">{db.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{db.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0 border-cyber-green/30 text-cyber-green">{db.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[10px] mb-2">
                      <div><p className="text-muted-foreground">存储</p><p className="font-mono font-bold text-cyber-blue">{db.size}</p></div>
                      <div><p className="text-muted-foreground">记录</p><p className="font-mono font-bold">{db.records}</p></div>
                      <div><p className="text-muted-foreground">使用率</p><p className="font-mono font-bold text-cyber-amber">{db.usage}%</p></div>
                    </div>
                    <Progress value={db.usage} className="h-1" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Indicators */}
        <TabsContent value="indicators">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">技术指标引擎 · 全币种实时计算</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {[
                  { name: "MA (移动平均)", values: ["MA5: $98,120", "MA20: $96,850", "MA60: $94,200"], signal: "看涨", coins: "全币种" },
                  { name: "MACD", values: ["DIF: 245.8", "DEA: 198.2", "MACD: 47.6"], signal: "看涨", coins: "全币种" },
                  { name: "RSI", values: ["RSI6: 62.5", "RSI12: 58.3", "RSI24: 55.1"], signal: "中性", coins: "全币种" },
                  { name: "布林带", values: ["上轨: $101,200", "中轨: $97,500", "下轨: $93,800"], signal: "中性偏多", coins: "全币种" },
                  { name: "KDJ", values: ["K: 72.5", "D: 65.8", "J: 86.0"], signal: "看涨", coins: "全币种" },
                  { name: "OBV", values: ["OBV: 2.85M", "趋势: 上升", "信号: 强"], signal: "看涨", coins: "全币种" },
                  { name: "ATR (波动率)", values: ["ATR14: 2,850", "ATR28: 2,420", "波动: 偏高"], signal: "中性", coins: "全币种" },
                  { name: "Ichimoku", values: ["转换: $97,800", "基准: $96,200", "云层: 看涨"], signal: "看涨", coins: "主流币" },
                ].map((indicator) => (
                  <div key={indicator.name} className="p-3 rounded-md border border-border bg-secondary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium">{indicator.name}</h4>
                      <Badge variant="outline" className={`text-[8px] py-0 ${indicator.signal.includes("涨") ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                        {indicator.signal}
                      </Badge>
                    </div>
                    <div className="space-y-0.5">
                      {indicator.values.map((v) => (
                        <p key={v} className="text-[10px] font-mono text-muted-foreground">{v}</p>
                      ))}
                    </div>
                    <p className="text-[8px] text-cyber-blue mt-1">{indicator.coins}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider">自动报表 (AI生成: DeepSeek-V3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "每日全币种交易报告", time: "2026-02-13 00:00", status: "已生成", type: "日报", coins: `${allCoins.length}+币种` },
                { name: "周度策略绩效分析", time: "2026-02-10 00:00", status: "已生成", type: "周报", coins: "12个策略" },
                { name: "月度风险评估报告", time: "2026-02-01 00:00", status: "已生成", type: "月报", coins: "全组合" },
                { name: "5年历史数据分析", time: "2026-02-12 00:00", status: "已生成", type: "特别报告", coins: "全币种" },
                { name: "AI模型性能报告", time: "2026-02-12 00:00", status: "已生成", type: "日报", coins: "8个模型" },
                { name: "因子表现衰减报告", time: "2026-02-13 08:00", status: "已生成", type: "日报", coins: "47个因子" },
                { name: "全币种异常检测报告", time: "2026-02-13 06:00", status: "已生成", type: "日报", coins: `${allCoins.length}+币种` },
                { name: "DeFi生态监控报告", time: "2026-02-13 04:00", status: "已生成", type: "日报", coins: "DeFi板块" },
              ].map((report) => (
                <div key={report.name} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-cyber-blue shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{report.name}</p>
                      <p className="text-[9px] text-muted-foreground">{report.time} · {report.coins}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] py-0">{report.type}</Badge>
                    <Badge variant="outline" className="text-[9px] py-0 border-cyber-green/30 text-cyber-green">{report.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Correlation Matrix */}
        <TabsContent value="correlation">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyber-blue" /> 全币种价格相关性矩阵
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">基于5年历史数据计算的币种间价格相关系数，用于识别联动关系和分散化投资机会</p>
            </CardHeader>
            <CardContent>
              <CorrelationMatrix maxCoins={20} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
