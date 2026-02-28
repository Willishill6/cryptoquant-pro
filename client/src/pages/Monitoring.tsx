/**
 * Monitoring - Fully real-time system monitoring
 * Live service health, live logs, live performance, live AI evolution tracking
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, AlertTriangle, Brain, Dna, Pause, Play, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { allCoins as staticCoins } from "@/lib/mockData";
import { useLiveCoins } from "@/hooks/useBinanceMarket";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";

/* ─── Live Services ─── */
function useLiveServices() {
  const [services, setServices] = useState(() => [
    { name: "交易引擎", desc: "全自动订单执行", version: "v3.2.1", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "策略引擎", desc: "策略并行运行", version: "v2.8.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "AI推理服务", desc: "DeepSeek-V3/TFT/LSTM", version: "v4.1.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "数据采集", desc: `${staticCoins.length}+币种实时`, version: "v2.5.3", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "风控引擎", desc: "全币种风险监控", version: "v3.0.2", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "API网关", desc: "10大交易所API", version: "v1.8.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "消息队列", desc: "Kafka集群", version: "v2.1.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "日志服务", desc: "ELK Stack", version: "v1.5.2", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "因子计算引擎", desc: `因子·${staticCoins.length}币种`, version: "v2.3.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "AI进化服务", desc: "自我进化", version: "v1.8.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "DeFi协议网关", desc: "Uniswap/Aave/Curve", version: "v1.2.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
    { name: "链上数据索引", desc: "多链数据索引", version: "v1.5.0", baseCpu: 0, baseMem: 0, baseLatency: 0 },
  ].map(s => ({
    ...s,
    cpu: s.baseCpu,
    memory: s.baseMem,
    latency: s.baseLatency,
    uptime: 0,
    requests: 0,
    errors: 0,
    status: "未启动" as string,
  })));
  // 暂停假数据自动增长，等待真实服务指标
  // useEffect(() => { ... }, []);

  return services;
}

/* ─── Live Logs ─── */
function useLiveLogs() {
  const [logs, setLogs] = useState<Array<{ time: string; level: string; service: string; message: string }>>([]);
  const [paused, setPaused] = useState(false);

  // 暂停假日志生成，等待真实服务日志
  // useEffect(() => { ... }, [paused]);

  return { logs, paused, setPaused };
}

/* ─── Live Performance Chart ─── */
function useLivePerformance() {
  const [data, setData] = useState<Array<{ time: string; cpu: number; memory: number; network: number; gpu: number }>>([]);

  useEffect(() => {
    const now = Date.now();
    const initial = Array.from({ length: 60 }, (_, i) => ({
      time: new Date(now - (59 - i) * 60000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      cpu: 0,
      memory: 0,
      network: 0,
      gpu: 0,
    }));
    setData(initial);
    // 暂停假数据自动增长，等待真实硬件指标
    // const iv = setInterval(() => { ... }, 5000);
    // return () => clearInterval(iv);
  }, []);

  return data;
}

/* ─── Live AI Evolution ─── */
function useLiveEvolution() {
  const [models, setModels] = useState([
    { name: "DeepSeek-V3 策略优化", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "TFT 价格预测", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "强化学习 PPO-Portfolio", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "因子权重 XGBoost-Alpha", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "异常检测 IsoForest-AE", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "LSTM-Attention 趋势记忆", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "FinBERT-Crypto 情绪分析", gen: 0, improvement: 0, gpu: "--", speed: 0 },
    { name: "GraphSAGE-Chain 链上分析", gen: 0, improvement: 0, gpu: "--", speed: 0 },
  ]);

  const [learningData, setLearningData] = useState([
    { data: "2021年K线数据", progress: 0, records: 0, status: "未学习" },
    { data: "2022年K线+链上", progress: 0, records: 0, status: "未学习" },
    { data: "2023年全量数据", progress: 0, records: 0, status: "未学习" },
    { data: "2024年全量数据", progress: 0, records: 0, status: "未学习" },
    { data: "2025年全量数据", progress: 0, records: 0, status: "未学习" },
    { data: "2026年实时数据", progress: 0, records: 0, status: "未学习" },
  ]);

  // 暂停假数据自动增长，等待真实训练指标
  // useEffect(() => { ... }, []);

  return { models, learningData };
}

/* ─── Main ─── */
export default function Monitoring() {
  const { coins: allCoins } = useLiveCoins();
  const sys = useSystemStatusCtx();
  const services = useLiveServices();
  const { logs, paused, setPaused } = useLiveLogs();
  const perfData = useLivePerformance();
  const { models, learningData } = useLiveEvolution();
  const [logFilter, setLogFilter] = useState("全部");
  const [logSearch, setLogSearch] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(l => {
    if (logFilter !== "全部" && l.level !== logFilter) return false;
    if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase()) && !l.service.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  const logStats = {
    total: logs.length,
    info: logs.filter(l => l.level === "INFO").length,
    warn: logs.filter(l => l.level === "WARN").length,
    error: logs.filter(l => l.level === "ERROR").length,
  };

  const avgCpu = services.reduce((s, sv) => s + sv.cpu, 0) / services.length;
  const avgMem = services.reduce((s, sv) => s + sv.memory, 0) / services.length;
  const totalReqs = services.reduce((s, sv) => s + sv.requests, 0);
  const totalErrors = services.reduce((s, sv) => s + sv.errors, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-cyber-green/20 flex items-center justify-center glow-green">
          <Monitor className="w-6 h-6 text-cyber-green" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-wider">监控运维中心</h1>
          <p className="text-sm text-muted-foreground">{services.length}个服务 · AI进化监控 · 全币种系统 · 实时日志 <span className="inline-flex items-center gap-1 ml-1"><span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" /><span className="text-cyber-green text-[10px]">全部实时</span></span></p>
        </div>
      </motion.div>

      {/* System Overview - all real-time */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
        {[
          { label: "系统状态", value: sys.systemState === "运行中" ? "正常" : sys.systemState, color: "green" },
          { label: "服务数量", value: `${services.filter(s => s.status === "运行中").length}/${services.length}`, color: "blue" },
          { label: "平均CPU", value: `${avgCpu.toFixed(1)}%`, color: avgCpu > 70 ? "amber" : "green" },
          { label: "平均内存", value: `${avgMem.toFixed(1)}%`, color: avgMem > 80 ? "amber" : "blue" },
          { label: "总请求数", value: totalReqs.toLocaleString(), color: "blue" },
          { label: "总错误数", value: totalErrors.toString(), color: totalErrors > 10 ? "magenta" : "green" },
          { label: "WS状态", value: sys.wsConnected ? "已连接" : "断连", color: sys.wsConnected ? "green" : "magenta" },
          { label: "监控币种", value: `${allCoins.length}+`, color: "green" },
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

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="services">服务状态</TabsTrigger>
          <TabsTrigger value="performance">性能监控</TabsTrigger>
          <TabsTrigger value="aimonitor">AI进化监控</TabsTrigger>
          <TabsTrigger value="logs">系统日志 <Badge variant="secondary" className="ml-1 text-[8px] py-0 px-1">{logStats.total}</Badge></TabsTrigger>
          <TabsTrigger value="alerts">告警管理</TabsTrigger>
        </TabsList>

        {/* Services - LIVE */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {services.map((svc, i) => (
              <motion.div key={svc.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-card border-border hover:border-cyber-blue/30 transition-colors">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                        <div>
                          <h3 className="text-xs font-medium">{svc.name}</h3>
                          <span className="text-[9px] text-muted-foreground">{svc.desc}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[8px] py-0 border-cyber-green/30 text-cyber-green">{svc.status}</Badge>
                        <p className="text-[8px] font-mono text-muted-foreground mt-0.5">{svc.version} · {svc.uptime.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-muted-foreground">CPU</span>
                          <span className={`font-mono ${svc.cpu > 80 ? "text-cyber-magenta" : svc.cpu > 60 ? "text-cyber-amber" : "text-cyber-blue"}`}>{svc.cpu.toFixed(1)}%</span>
                        </div>
                        <Progress value={svc.cpu} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-muted-foreground">内存</span>
                          <span className={`font-mono ${svc.memory > 85 ? "text-cyber-magenta" : svc.memory > 70 ? "text-cyber-amber" : "text-cyber-amber"}`}>{svc.memory.toFixed(1)}%</span>
                        </div>
                        <Progress value={svc.memory} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-muted-foreground">延迟</span>
                          <span className="font-mono text-cyber-green">{svc.latency.toFixed(1)}ms</span>
                        </div>
                        <Progress value={Math.min(100, svc.latency * 3)} className="h-1" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-muted-foreground font-mono">
                      <span>请求: {svc.requests.toLocaleString()}</span>
                      <span className={svc.errors > 3 ? "text-cyber-magenta" : ""}>错误: {svc.errors}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Performance - LIVE chart */}
        <TabsContent value="performance">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                系统资源使用率 (60分钟) <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" /><span className="text-[9px]">实时</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 min-h-[224px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#666" }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#666" }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="cpu" stroke="#00d4ff" strokeWidth={2} dot={false} name="CPU" isAnimationActive={false} />
                    <Line type="monotone" dataKey="memory" stroke="#ffaa00" strokeWidth={2} dot={false} name="内存" isAnimationActive={false} />
                    <Line type="monotone" dataKey="network" stroke="#00ff88" strokeWidth={2} dot={false} name="网络" isAnimationActive={false} />
                    <Line type="monotone" dataKey="gpu" stroke="#ff0066" strokeWidth={2} dot={false} name="GPU" isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {[
              { name: "GPU集群", total: "--", used: "--", usage: 0, temp: "--" },
              { name: "存储集群", total: "--", used: "--", usage: 0, temp: "--" },
              { name: "网络带宽", total: "--", used: "--", usage: 0, temp: "N/A" },
              { name: "CPU集群", total: "--", used: "--", usage: 0, temp: "--" },
            ].map((resource, i) => (
              <motion.div key={resource.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card border-border">
                  <CardContent className="pt-4 pb-3">
                    <h3 className="text-xs font-medium mb-2">{resource.name}</h3>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">总量</span><span className="font-mono">{resource.total}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">已用</span><span className="font-mono text-cyber-blue">{resource.used}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">温度</span><span className="font-mono">{resource.temp}</span></div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={resource.usage} className="h-1 flex-1" />
                      <span className="text-[9px] font-mono text-cyber-amber">{resource.usage.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* AI Evolution Monitor - LIVE */}
        <TabsContent value="aimonitor">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Dna className="w-4 h-4 text-cyber-amber" />AI自我进化状态
                  <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {models.map((model, i) => (
                  <motion.div key={model.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-3 rounded border border-border/50 bg-secondary/20">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-medium">{model.name}</h4>
                      <Badge variant="outline" className="text-[8px] py-0 border-cyber-green/30 text-cyber-green">进化中</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span>代数: <span className="text-cyber-blue font-mono">{model.gen.toLocaleString()}</span></span>
                      <span>提升: <span className="text-cyber-green font-mono">+{model.improvement}%</span></span>
                      <span>GPU: <span className="text-cyber-amber font-mono">{model.gpu}</span></span>
                      <span>速度: <span className="font-mono">{model.speed}代/h</span></span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyber-blue" />AI学习进度 · 5年数据
                  <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningData.map((item, i) => (
                  <motion.div key={item.data} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-2.5 rounded border border-border/50 bg-secondary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{item.data}</span>
                      <span className="text-[9px] text-cyber-blue font-mono">{item.records}亿</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="h-1.5 flex-1" />
                      <span className="text-[9px] font-mono text-cyber-green">{item.progress.toFixed(1)}%</span>
                      <Badge variant="outline" className={`text-[8px] py-0 ${item.progress >= 100 ? "border-cyber-green/30 text-cyber-green" : "border-cyber-amber/30 text-cyber-amber"}`}>
                        {item.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs - LIVE with filter/search */}
        <TabsContent value="logs">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                  实时系统日志 <span className={`w-2 h-2 rounded-full ${paused ? "bg-cyber-amber" : "bg-cyber-green animate-pulse"}`} />
                  <span className="text-[9px]">{paused ? "已暂停" : "实时推送中"}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Log level stats */}
                  <div className="flex gap-1 text-[9px] font-mono">
                    <span className="text-cyber-green">INFO:{logStats.info}</span>
                    <span className="text-cyber-amber">WARN:{logStats.warn}</span>
                    <span className="text-cyber-magenta">ERR:{logStats.error}</span>
                  </div>
                  {/* Filter */}
                  <div className="flex gap-1">
                    {["全部", "INFO", "WARN", "ERROR"].map(f => (
                      <button key={f} onClick={() => setLogFilter(f)} className={`px-2 py-0.5 rounded text-[9px] ${logFilter === f ? "bg-cyber-blue/20 text-cyber-blue" : "bg-secondary text-muted-foreground"}`}>{f}</button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="搜索日志..."
                      className="bg-secondary/50 border border-border rounded pl-7 pr-2 py-1 text-[10px] w-32 focus:border-cyber-blue outline-none" />
                  </div>
                  {/* Pause */}
                  <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setPaused(!paused)}>
                    {paused ? <><Play className="w-3 h-3 mr-1" />恢复</> : <><Pause className="w-3 h-3 mr-1" />暂停</>}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={logRef} className="rounded-md border border-border bg-[#0a0e15] p-3 font-mono text-[11px] space-y-0.5 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {filteredLogs.map((log, i) => (
                    <motion.div key={`${log.time}-${i}`} initial={{ opacity: 0, x: -10, backgroundColor: "rgba(0,212,255,0.08)" }} animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                      className="flex gap-2 py-1 border-b border-border/10">
                      <span className="text-muted-foreground shrink-0 text-[10px]">{log.time}</span>
                      <span className={`shrink-0 w-12 text-[10px] ${log.level === "ERROR" ? "text-cyber-magenta" : log.level === "WARN" ? "text-cyber-amber" : "text-cyber-green"}`}>
                        [{log.level}]
                      </span>
                      <span className="text-cyber-blue shrink-0 w-20 text-[10px]">[{log.service}]</span>
                      <span className="text-foreground/80 text-[10px]">{log.message}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-amber" />告警规则管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground">规则名称</th>
                      <th className="text-left py-2 text-muted-foreground">条件</th>
                      <th className="text-center py-2 text-muted-foreground">级别</th>
                      <th className="text-left py-2 text-muted-foreground">通知方式</th>
                      <th className="text-center py-2 text-muted-foreground">触发次数</th>
                      <th className="text-center py-2 text-muted-foreground">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "CPU使用率过高", condition: "CPU > 85% 持续5分钟", level: "严重", notify: "邮件+短信+Telegram", triggers: 3 },
                      { name: "GPU温度过高", condition: "温度 > 85°C", level: "严重", notify: "邮件+短信", triggers: 1 },
                      { name: "内存不足", condition: "内存 > 90%", level: "严重", notify: "邮件+短信", triggers: 2 },
                      { name: "API延迟过高", condition: "延迟 > 100ms", level: "警告", notify: "Telegram", triggers: 8 },
                      { name: "交易执行失败", condition: "失败率 > 1%", level: "严重", notify: "邮件+短信+Telegram", triggers: 0 },
                      { name: "数据源断连", condition: "断连 > 30秒", level: "警告", notify: "Telegram", triggers: 5 },
                      { name: "AI模型异常", condition: "预测偏差 > 20%", level: "警告", notify: "邮件+Telegram", triggers: 2 },
                      { name: "异常交易检测", condition: "AI异常分数 > 0.8", level: "警告", notify: "邮件+Telegram", triggers: 1 },
                      { name: "进化停滞", condition: "连续50代无提升", level: "警告", notify: "Telegram", triggers: 0 },
                      { name: "全币种数据缺失", condition: "缺失率 > 5%", level: "严重", notify: "邮件+短信", triggers: 0 },
                      { name: "爆仓风险预警", condition: "保证金率 < 120%", level: "严重", notify: "邮件+短信+Telegram", triggers: 0 },
                      { name: "单币种亏损过大", condition: "单币亏损 > $5000", level: "警告", notify: "邮件+Telegram", triggers: 4 },
                    ].map((rule) => (
                      <tr key={rule.name} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                        <td className="py-2 font-medium">{rule.name}</td>
                        <td className="py-2 font-mono text-muted-foreground text-[10px]">{rule.condition}</td>
                        <td className="py-2 text-center">
                          <Badge variant="outline" className={`text-[8px] py-0 ${rule.level === "严重" ? "border-cyber-magenta/30 text-cyber-magenta" : "border-cyber-amber/30 text-cyber-amber"}`}>{rule.level}</Badge>
                        </td>
                        <td className="py-2 text-[10px] text-muted-foreground">{rule.notify}</td>
                        <td className="py-2 text-center font-mono">
                          <span className={rule.triggers > 0 ? "text-cyber-amber" : "text-muted-foreground"}>{rule.triggers}</span>
                        </td>
                        <td className="py-2 text-center">
                          <Badge variant="outline" className="text-[8px] py-0 border-cyber-green/30 text-cyber-green">启用</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
