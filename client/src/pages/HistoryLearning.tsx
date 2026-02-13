/**
 * HistoryLearning - 历史数据学习中心
 * 5年+全币种历史数据采集、学习进度、数据质量、训练数据集管理
 * 所有数据实时自动更新：价格、币种、学习事件、数据质量
 * Design: Cyberpunk terminal dark theme with electric blue accents
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IMAGES } from "@/lib/images";
import { allCoins, historicalDataStats, generate5YearHistory, formatNumber } from "@/lib/mockData";
import { AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, PieChart, Pie } from "recharts";
import { Database, Clock, TrendingUp, CheckCircle2, AlertTriangle, RefreshCw, Layers, Globe, Zap, BarChart3, Activity, Brain, Sparkles, ArrowUpRight, Shield, Radio } from "lucide-react";

// ============ TYPES ============
interface LiveCoinData {
  symbol: string;
  name: string;
  category: string;
  price: number;
  priceChange: number;
  dataCompleteness: number;
  learningProgress: number;
  modelAccuracy: number;
  epochs: number;
  dataPoints: number;
  lastUpdated: string;
  isUpdating: boolean;
}

interface LearningEvent {
  id: string;
  time: string;
  type: "price_update" | "model_train" | "data_sync" | "factor_discover" | "accuracy_up" | "new_coin" | "anomaly";
  coin: string;
  message: string;
  detail: string;
  impact: "high" | "medium" | "low";
}

interface LiveDatasetStats {
  name: string;
  type: string;
  coins: number;
  timeRange: string;
  records: number;
  size: number;
  status: string;
  updateFreq: string;
  quality: number;
  recordsPerSec: number;
}

// ============ DATA COVERAGE MATRIX ============
const dataTypes = [
  "K线数据", "Tick数据", "订单簿", "成交明细", "资金费率",
  "链上数据", "社交情绪", "新闻事件", "基本面", "DeFi协议",
];

function generateCoverageMatrix() {
  const categories = ["主流币", "二线币", "Layer2", "DeFi", "稳定币", "Meme币", "AI概念", "GameFi", "隐私币", "RWA"];
  return categories.map((cat) => ({
    category: cat,
    coverage: dataTypes.map((dt) => {
      const base = cat === "主流币" ? 95 : cat === "二线币" ? 85 : cat === "Layer2" ? 78 : 65;
      const typeBonus = dt === "K线数据" ? 5 : dt === "Tick数据" ? -5 : dt === "链上数据" ? -10 : 0;
      return Math.min(100, Math.max(20, base + typeBonus + Math.floor(Math.random() * 15 - 7)));
    }),
  }));
}

// ============ LEARNING EVENT TEMPLATES ============
const eventTemplates: Array<{ type: LearningEvent["type"]; msgFn: (coin: string) => string; detailFn: (coin: string, val: number) => string; impact: LearningEvent["impact"] }> = [
  { type: "price_update", msgFn: (c) => `${c} 价格数据实时同步`, detailFn: (_c, v) => `最新价格 $${v.toFixed(2)}，已写入时序数据库，触发增量学习`, impact: "low" },
  { type: "model_train", msgFn: (c) => `${c} 模型增量训练完成`, detailFn: (_c, v) => `LSTM-Attention 完成第${Math.floor(v)}轮训练，准确率 ${(85 + Math.random() * 10).toFixed(1)}%`, impact: "medium" },
  { type: "data_sync", msgFn: (c) => `${c} 链上数据同步`, detailFn: (_c, v) => `新增 ${Math.floor(v)} 条链上交易记录，大户地址活跃度 ${Math.random() > 0.5 ? "上升" : "下降"}`, impact: "low" },
  { type: "factor_discover", msgFn: (c) => `${c} 发现新Alpha因子`, detailFn: (_c, v) => `因子IC值=${(v / 100).toFixed(3)}，通过显著性检验，已加入因子库`, impact: "high" },
  { type: "accuracy_up", msgFn: (c) => `${c} 预测准确率提升`, detailFn: (_c, _v) => `24h预测准确率从 ${(88 + Math.random() * 5).toFixed(1)}% 提升至 ${(90 + Math.random() * 6).toFixed(1)}%`, impact: "high" },
  { type: "new_coin", msgFn: (c) => `${c} 新数据源接入`, detailFn: (c, v) => `成功接入${c}的订单簿深度数据，覆盖L2/L3级别，延迟 <${Math.floor(v)}ms`, impact: "medium" },
  { type: "anomaly", msgFn: (c) => `${c} 异常数据检测`, detailFn: (_c, v) => `检测到${Math.floor(v)}条异常Tick数据，已自动清洗并标记，不影响模型训练`, impact: "medium" },
];

// ============ INITIAL LIVE COIN DATA ============
function initLiveCoinData(): LiveCoinData[] {
  const tradableCoins = allCoins.filter(c => c.category !== "稳定币");
  return tradableCoins.slice(0, 50).map((coin) => {
    const base = coin.category === "主流币" ? 95 : coin.category === "二线币" ? 88 : coin.category === "Layer2" ? 82 : 75;
    const price = coin.symbol === "BTC" ? 66450 : coin.symbol === "ETH" ? 1950 :
      coin.symbol === "SOL" ? 79 : coin.symbol === "BNB" ? 608 :
      coin.symbol === "XRP" ? 1.36 : coin.symbol === "ADA" ? 0.26 :
      coin.symbol === "DOGE" ? 0.082 : coin.symbol === "DOT" ? 4.2 :
      Math.random() * 50 + 0.1;
    return {
      symbol: coin.symbol,
      name: coin.name,
      category: coin.category,
      price,
      priceChange: (Math.random() - 0.5) * 4,
      dataCompleteness: Math.min(100, base + Math.floor(Math.random() * 8)),
      learningProgress: Math.min(100, base - 3 + Math.floor(Math.random() * 10)),
      modelAccuracy: Math.min(99, base - 8 + Math.floor(Math.random() * 12)),
      lastUpdated: "刚刚",
      epochs: Math.floor(Math.random() * 500) + 200,
      dataPoints: Math.floor(Math.random() * 50000000) + 10000000,
      isUpdating: false,
    };
  });
}

// ============ INITIAL LIVE DATASETS ============
function initLiveDatasets(): LiveDatasetStats[] {
  return [
    { name: "价格时序数据集", type: "K线+Tick", coins: 441, timeRange: "2021-01 ~ 2026-02", records: 4_280_000_000, size: 9.8, status: "活跃", updateFreq: "实时", quality: 98.5, recordsPerSec: 12500 },
    { name: "订单簿快照数据集", type: "L2/L3", coins: 180, timeRange: "2022-06 ~ 2026-02", records: 1_850_000_000, size: 6.2, status: "活跃", updateFreq: "100ms", quality: 96.2, recordsPerSec: 8200 },
    { name: "链上交易数据集", type: "链上", coins: 320, timeRange: "2021-01 ~ 2026-02", records: 1_520_000_000, size: 4.5, status: "活跃", updateFreq: "每区块", quality: 99.1, recordsPerSec: 3500 },
    { name: "社交情绪数据集", type: "NLP", coins: 441, timeRange: "2021-06 ~ 2026-02", records: 850_000_000, size: 2.1, status: "活跃", updateFreq: "5分钟", quality: 87.3, recordsPerSec: 1800 },
    { name: "新闻事件数据集", type: "NLP", coins: 441, timeRange: "2021-01 ~ 2026-02", records: 320_000_000, size: 0.8, status: "活跃", updateFreq: "1分钟", quality: 91.5, recordsPerSec: 950 },
    { name: "DeFi协议数据集", type: "DeFi", coins: 120, timeRange: "2022-01 ~ 2026-02", records: 580_000_000, size: 1.5, status: "活跃", updateFreq: "每区块", quality: 94.8, recordsPerSec: 2200 },
    { name: "基本面因子数据集", type: "基本面", coins: 380, timeRange: "2021-01 ~ 2026-02", records: 210_000_000, size: 0.5, status: "活跃", updateFreq: "每日", quality: 93.2, recordsPerSec: 120 },
    { name: "宏观经济数据集", type: "宏观", coins: 0, timeRange: "2020-01 ~ 2026-02", records: 30_000_000, size: 0.1, status: "活跃", updateFreq: "每日", quality: 97.8, recordsPerSec: 45 },
  ];
}

// ============ DATA COLLECTION TIMELINE ============
const collectionTimeline = [
  { date: "2021-01", event: "系统初始化", detail: "开始采集BTC/ETH等15种主流币的K线和Tick数据", milestone: true },
  { date: "2021-06", event: "扩展二线币", detail: "新增25种二线币覆盖，接入社交情绪数据源", milestone: false },
  { date: "2021-12", event: "链上数据集成", detail: "接入Ethereum/BSC/Solana链上数据，覆盖60+币种", milestone: true },
  { date: "2022-03", event: "订单簿深度数据", detail: "开始采集L2/L3订单簿快照，覆盖主流交易所", milestone: false },
  { date: "2022-06", event: "DeFi协议数据", detail: "接入Uniswap/Aave/Curve等DeFi协议数据", milestone: true },
  { date: "2022-12", event: "全球新闻源", detail: "接入50+新闻源，支持多语言情绪分析", milestone: false },
  { date: "2023-03", event: "AI模型训练V1", detail: "首次使用完整历史数据训练DeepSeek-V3模型", milestone: true },
  { date: "2023-09", event: "Layer2生态数据", detail: "新增Arbitrum/Optimism/zkSync等L2数据", milestone: false },
  { date: "2024-01", event: "全币种覆盖", detail: "数据覆盖扩展至180+币种，实现全品类覆盖", milestone: true },
  { date: "2024-06", event: "高频Tick数据", detail: "升级至毫秒级Tick数据采集，覆盖250+币种", milestone: false },
  { date: "2024-12", event: "RWA/AI概念币", detail: "新增RWA和AI概念币种数据，覆盖380+币种", milestone: true },
  { date: "2025-06", event: "LSTM-Attention集成", detail: "引入LSTM-Attention模型，时序预测准确率提升12%", milestone: false },
  { date: "2025-12", event: "Meme币全覆盖", detail: "实现Meme币实时追踪，覆盖420+币种", milestone: true },
  { date: "2026-02", event: "当前状态", detail: "币安全币种441+覆盖，97.3亿条历史记录，28TB+数据", milestone: true },
];

// ============ MAIN COMPONENT ============
export default function HistoryLearning() {
  const sys = useSystemStatusCtx();
  const [activeTab, setActiveTab] = useState("overview");
  const coverageMatrix = useMemo(() => generateCoverageMatrix(), []);
  const fiveYearHistory = useMemo(() => generate5YearHistory(), []);
  const [selectedCategory, setSelectedCategory] = useState("全部");

  // ===== LIVE STATE =====
  const [liveRecords, setLiveRecords] = useState(97_300_000_000);
  const [liveCoinData, setLiveCoinData] = useState<LiveCoinData[]>(() => initLiveCoinData());
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);
  const [liveDatasets, setLiveDatasets] = useState<LiveDatasetStats[]>(() => initLiveDatasets());
  const [liveQuality, setLiveQuality] = useState({
    overall: 96.8, completeness: 98.2, continuity: 99.5, anomalyRate: 0.03,
  });
  const [dataTypeQualities, setDataTypeQualities] = useState<Array<{ type: string; completeness: number; accuracy: number; freshness: number }>>(() =>
    dataTypes.map(dt => ({
      type: dt,
      completeness: 92 + Math.floor(Math.random() * 8),
      accuracy: 90 + Math.floor(Math.random() * 10),
      freshness: 85 + Math.floor(Math.random() * 15),
    }))
  );
  const [totalLiveSize, setTotalLiveSize] = useState(25.5);
  const [updatingCoins, setUpdatingCoins] = useState<Set<string>>(new Set());
  const eventIdRef = useRef(0);

  // ===== LIVE RECORDS COUNTER (1s) =====
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveRecords(prev => prev + Math.floor(Math.random() * 5000) + 2000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ===== LIVE PRICE UPDATES (2s) - Update 3-5 random coins =====
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCoinData(prev => {
        const updated = [...prev];
        const numToUpdate = 3 + Math.floor(Math.random() * 3);
        const indices = new Set<number>();
        while (indices.size < numToUpdate) {
          indices.add(Math.floor(Math.random() * updated.length));
        }
        const newUpdating = new Set<string>();
        indices.forEach(idx => {
          const coin = updated[idx];
          const volatility = coin.category === "Meme币" ? 0.03 : coin.category === "主流币" ? 0.005 : 0.015;
          const change = (Math.random() - 0.48) * volatility;
          coin.price = Math.max(0.001, coin.price * (1 + change));
          coin.priceChange = change * 100;
          coin.lastUpdated = "刚刚";
          coin.isUpdating = true;
          newUpdating.add(coin.symbol);
          // Occasionally bump learning stats
          if (Math.random() > 0.7) {
            coin.dataPoints += Math.floor(Math.random() * 50000) + 10000;
            coin.epochs += Math.random() > 0.8 ? 1 : 0;
          }
          if (Math.random() > 0.9) {
            coin.modelAccuracy = Math.min(99.5, coin.modelAccuracy + Math.random() * 0.2);
            coin.learningProgress = Math.min(100, coin.learningProgress + Math.random() * 0.1);
          }
        });
        setUpdatingCoins(newUpdating);
        return updated;
      });
      // Clear updating flag after animation
      setTimeout(() => setUpdatingCoins(new Set()), 800);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // ===== LEARNING EVENT STREAM (3-6s) =====
  useEffect(() => {
    const pushEvent = () => {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const tradable = allCoins.filter(c => c.category !== "稳定币");
      const coin = tradable[Math.floor(Math.random() * tradable.length)];
      const val = Math.random() * 200 + 10;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      const newEvent: LearningEvent = {
        id: `evt-${++eventIdRef.current}`,
        time: timeStr,
        type: template.type,
        coin: coin.symbol,
        message: template.msgFn(coin.symbol),
        detail: template.detailFn(coin.symbol, val),
        impact: template.impact,
      };
      setLearningEvents(prev => [newEvent, ...prev].slice(0, 50));
    };
    // Push initial events
    for (let i = 0; i < 8; i++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const tradable = allCoins.filter(c => c.category !== "稳定币");
      const coin = tradable[Math.floor(Math.random() * tradable.length)];
      const val = Math.random() * 200 + 10;
      const mins = i * 2 + 1;
      learningEvents.push({
        id: `evt-init-${i}`,
        time: `${new Date(Date.now() - mins * 60000).getHours().toString().padStart(2, "0")}:${new Date(Date.now() - mins * 60000).getMinutes().toString().padStart(2, "0")}:${new Date(Date.now() - mins * 60000).getSeconds().toString().padStart(2, "0")}`,
        type: template.type,
        coin: coin.symbol,
        message: template.msgFn(coin.symbol),
        detail: template.detailFn(coin.symbol, val),
        impact: template.impact,
      });
    }
    setLearningEvents([...learningEvents]);
    const timer = setInterval(pushEvent, 3000 + Math.random() * 3000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== LIVE DATASET STATS (5s) =====
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDatasets(prev => prev.map(ds => ({
        ...ds,
        records: ds.records + ds.recordsPerSec * 5,
        size: ds.size + ds.recordsPerSec * 5 * 0.0000000002,
        quality: Math.min(99.9, Math.max(85, ds.quality + (Math.random() - 0.45) * 0.1)),
      })));
      setTotalLiveSize(prev => prev + Math.random() * 0.001);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ===== LIVE QUALITY METRICS (8s) =====
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveQuality(prev => ({
        overall: Math.min(99.9, Math.max(94, prev.overall + (Math.random() - 0.45) * 0.1)),
        completeness: Math.min(99.9, Math.max(96, prev.completeness + (Math.random() - 0.45) * 0.05)),
        continuity: Math.min(99.99, Math.max(98, prev.continuity + (Math.random() - 0.45) * 0.02)),
        anomalyRate: Math.max(0.01, Math.min(0.1, prev.anomalyRate + (Math.random() - 0.55) * 0.005)),
      }));
      setDataTypeQualities(prev => prev.map(dtq => ({
        ...dtq,
        completeness: Math.min(100, Math.max(88, dtq.completeness + (Math.random() - 0.45) * 0.3)),
        accuracy: Math.min(100, Math.max(86, dtq.accuracy + (Math.random() - 0.45) * 0.3)),
        freshness: Math.min(100, Math.max(80, dtq.freshness + (Math.random() - 0.45) * 0.5)),
      })));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredCoinData = selectedCategory === "全部"
    ? liveCoinData
    : liveCoinData.filter(c => c.category === selectedCategory);


  const eventTypeConfig: Record<LearningEvent["type"], { icon: typeof Database; color: string; label: string }> = {
    price_update: { icon: TrendingUp, color: "text-cyber-blue", label: "价格同步" },
    model_train: { icon: Brain, color: "text-cyber-green", label: "模型训练" },
    data_sync: { icon: RefreshCw, color: "text-cyan-400", label: "数据同步" },
    factor_discover: { icon: Sparkles, color: "text-cyber-amber", label: "因子发现" },
    accuracy_up: { icon: ArrowUpRight, color: "text-emerald-400", label: "准确率提升" },
    new_coin: { icon: Globe, color: "text-violet-400", label: "新数据源" },
    anomaly: { icon: AlertTriangle, color: "text-orange-400", label: "异常检测" },
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-48">
        <img src={IMAGES.dataAnalytics} alt="Data Learning" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold text-cyber-blue text-glow-blue tracking-wider">
              历史数据学习中心
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-green/15 border border-cyber-green/30 text-cyber-green text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              实时学习中
            </span>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            5年+全币种历史数据采集与AI深度学习 · 覆盖{allCoins.length}+币种（币安全量） · {(liveRecords / 1e8).toFixed(1)}亿条记录实时增长 · {totalLiveSize.toFixed(1)}TB数据存储
          </p>
          <div className="flex gap-4 mt-4">
            {[
              { label: "数据时间跨度", value: "5年2个月", icon: Clock },
              { label: "全币种覆盖", value: `${allCoins.length}+`, icon: Globe },
              { label: "实时记录数", value: `${(liveRecords / 1e8).toFixed(1)}亿`, icon: Database, live: true },
              { label: "AI模型", value: sys.aiModel, icon: Shield },
              { label: "数据入库速率", value: `${(liveDatasets.reduce((s, d) => s + d.recordsPerSec, 0) / 1000).toFixed(1)}K/s`, icon: Zap, live: true },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-md px-3 py-1.5">
                <stat.icon className="w-3.5 h-3.5 text-cyber-blue" />
                <div>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                  <p className={`text-xs font-mono font-bold text-foreground ${stat.live ? "tabular-nums" : ""}`}>{stat.value}</p>
                </div>
                {stat.live && <span className="w-1 h-1 rounded-full bg-cyber-green animate-pulse" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== LIVE LEARNING EVENT STREAM ===== */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyber-green animate-pulse" />
            实时学习事件流
            <span className="text-[10px] font-mono text-muted-foreground ml-2">
              已捕获 {learningEvents.length} 条事件
            </span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyber-amber" /> 高影响</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyber-blue" /> 中影响</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> 低影响</span>
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
          <AnimatePresence initial={false}>
            {learningEvents.slice(0, 20).map((evt) => {
              const cfg = eventTypeConfig[evt.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 px-3 py-2 rounded-md border transition-colors ${
                    evt.impact === "high" ? "bg-cyber-amber/5 border-cyber-amber/20" :
                    evt.impact === "medium" ? "bg-cyber-blue/5 border-cyber-blue/10" :
                    "bg-secondary/30 border-border/30"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{evt.time}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${cfg.color} bg-current/10`} style={{ backgroundColor: "transparent" }}>
                        <span className={cfg.color}>{cfg.label}</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-cyber-blue">{evt.coin}</span>
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{evt.message}</p>
                    <p className="text-[10px] text-muted-foreground">{evt.detail}</p>
                  </div>
                  {evt.impact === "high" && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-cyber-amber animate-pulse mt-1.5" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">数据总览</TabsTrigger>
          <TabsTrigger value="coverage">覆盖矩阵</TabsTrigger>
          <TabsTrigger value="learning">学习进度</TabsTrigger>
          <TabsTrigger value="datasets">训练数据集</TabsTrigger>
          <TabsTrigger value="timeline">采集时间线</TabsTrigger>
          <TabsTrigger value="quality">数据质量</TabsTrigger>
        </TabsList>

        {/* ============ TAB: 数据总览 ============ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Year-by-year stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {historicalDataStats.map((stat) => (
              <motion.div
                key={stat.period}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-lg p-4 ${
                  stat.status === "实时更新"
                    ? "border-cyber-blue/40 glow-blue"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{stat.period}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${
                    stat.status === "实时更新"
                      ? "bg-cyber-blue/20 text-cyber-blue"
                      : "bg-cyber-green/20 text-cyber-green"
                  }`}>
                    {stat.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">币种</span>
                    <span className="font-mono text-foreground">{stat.coins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">记录数</span>
                    <span className="font-mono text-foreground">{stat.records}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">数据量</span>
                    <span className="font-mono text-foreground">{stat.dataSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">准确率</span>
                    <span className="font-mono text-cyber-green">{stat.accuracy}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.accuracy}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-cyber-blue to-cyber-green rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 5-Year Learning Curve */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyber-blue" />
              5年AI学习曲线 · 准确率 & Sharpe比率 & 币种覆盖
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={fiveYearHistory}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sharpeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} interval={5} />
                <YAxis yAxisId="left" tick={{ fill: "#888", fontSize: 10 }} domain={[50, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#888", fontSize: 10 }} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#00d4ff" }}
                />
                <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="#00d4ff" fill="url(#accGrad)" strokeWidth={2} name="准确率(%)" />
                <Area yAxisId="right" type="monotone" dataKey="sharpe" stroke="#00ff88" fill="url(#sharpeGrad)" strokeWidth={2} name="Sharpe比率" />
                <Line yAxisId="left" type="monotone" dataKey="coins" stroke="#ffc107" strokeWidth={1.5} dot={false} name="币种覆盖" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly PnL from historical learning */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyber-green" />
              月度学习收益贡献 · 历史数据驱动的策略收益
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fiveYearHistory.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                  formatter={(value: number) => [`$${formatNumber(value)}`, "月度收益"]}
                />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {fiveYearHistory.slice(-24).map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#00ff88" : "#e74c8c"} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Live coin price ticker */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-blue" />
              实时币种价格监控
              <span className="text-[10px] font-mono text-muted-foreground ml-2">每2秒自动更新</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {liveCoinData.slice(0, 20).map(coin => (
                <div
                  key={coin.symbol}
                  className={`flex items-center justify-between px-3 py-2 rounded-md border transition-all duration-500 ${
                    updatingCoins.has(coin.symbol)
                      ? "border-cyber-blue/50 bg-cyber-blue/5"
                      : "border-border/30 bg-secondary/20"
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-foreground">{coin.symbol}</span>
                    <p className="text-[9px] text-muted-foreground">{coin.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-xs font-bold tabular-nums ${
                      updatingCoins.has(coin.symbol) ? "text-cyber-blue" : "text-foreground"
                    }`}>
                      ${coin.price < 1 ? coin.price.toFixed(4) : coin.price < 100 ? coin.price.toFixed(2) : formatNumber(Math.round(coin.price))}
                    </p>
                    <p className={`font-mono text-[10px] tabular-nums ${
                      coin.priceChange >= 0 ? "text-cyber-green" : "text-red-400"
                    }`}>
                      {coin.priceChange >= 0 ? "+" : ""}{coin.priceChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: 覆盖矩阵 ============ */}
        <TabsContent value="coverage" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-blue" />
              全币种 × 数据类型 覆盖热力图
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium sticky left-0 bg-card z-10">类别</th>
                    {dataTypes.map((dt) => (
                      <th key={dt} className="py-2 px-2 text-muted-foreground font-medium text-center whitespace-nowrap">{dt}</th>
                    ))}
                    <th className="py-2 px-3 text-muted-foreground font-medium text-center">平均</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageMatrix.map((row) => {
                    const avg = Math.round(row.coverage.reduce((a, b) => a + b, 0) / row.coverage.length);
                    return (
                      <tr key={row.category} className="border-t border-border/30">
                        <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10">{row.category}</td>
                        {row.coverage.map((val, i) => {
                          const hue = val > 90 ? "bg-cyber-green/30 text-cyber-green" :
                            val > 75 ? "bg-cyber-blue/30 text-cyber-blue" :
                            val > 60 ? "bg-cyber-amber/30 text-cyber-amber" :
                            "bg-cyber-magenta/30 text-cyber-magenta";
                          return (
                            <td key={i} className="py-2 px-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] ${hue}`}>
                                {val}%
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center">
                          <span className="font-mono font-bold text-cyber-blue">{avg}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyber-green/30" /> 90%+</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyber-blue/30" /> 75-90%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyber-amber/30" /> 60-75%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyber-magenta/30" /> &lt;60%</span>
            </div>
          </div>

          {/* Per-coin coverage radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {["主流币", "DeFi"].map((cat) => {
              const catCoins = allCoins.filter((c) => c.category === cat).slice(0, 5);
              const radarData = dataTypes.map((dt) => {
                const entry: Record<string, string | number> = { type: dt };
                catCoins.forEach((coin) => {
                  entry[coin.symbol] = 70 + Math.floor(Math.random() * 30);
                });
                return entry;
              });
              const colors = ["#00d4ff", "#00ff88", "#ffc107", "#e74c8c", "#a855f7"];
              return (
                <div key={cat} className="bg-card border border-border rounded-lg p-5">
                  <h4 className="text-xs font-bold text-foreground mb-3">{cat} 数据覆盖雷达图</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="type" tick={{ fill: "#888", fontSize: 9 }} />
                      <PolarRadiusAxis tick={{ fill: "#666", fontSize: 8 }} domain={[0, 100]} />
                      {catCoins.map((coin, i) => (
                        <Radar key={coin.symbol} name={coin.symbol} dataKey={coin.symbol}
                          stroke={colors[i]} fill={colors[i]} fillOpacity={0.1} strokeWidth={1.5} />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ============ TAB: 学习进度 (LIVE) ============ */}
        <TabsContent value="learning" className="space-y-6">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap items-center">
            {["全部", "主流币", "二线币", "Layer2", "DeFi", "Meme币", "AI概念", "GameFi"].map((cat) => {
              const count = cat === "全部" ? liveCoinData.length : liveCoinData.filter(c => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat} <span className="font-mono text-[10px] ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
            <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              价格 & 学习进度每2秒自动更新
            </span>
          </div>

          {/* Coin learning progress cards - LIVE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCoinData.map((coin, i) => (
              <motion.div
                key={coin.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`bg-card border rounded-lg p-4 transition-all duration-500 ${
                  updatingCoins.has(coin.symbol)
                    ? "border-cyber-blue/40 shadow-[0_0_12px_rgba(0,212,255,0.1)]"
                    : "border-border hover:border-cyber-blue/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">{coin.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold tabular-nums ${
                      coin.priceChange >= 0 ? "text-cyber-green" : "text-red-400"
                    }`}>
                      ${coin.price < 1 ? coin.price.toFixed(4) : coin.price < 100 ? coin.price.toFixed(2) : formatNumber(Math.round(coin.price))}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-cyber-blue/10 text-cyber-blue">{coin.category}</span>
                  </div>
                </div>

                {/* Progress bars */}
                {[
                  { label: "数据完整度", value: coin.dataCompleteness, color: "cyber-blue" },
                  { label: "学习进度", value: coin.learningProgress, color: "cyber-green" },
                  { label: "模型准确率", value: coin.modelAccuracy, color: "cyber-amber" },
                ].map((bar) => (
                  <div key={bar.label} className="mb-2">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className={`font-mono tabular-nums text-${bar.color}`}>{bar.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          bar.color === "cyber-blue" ? "bg-cyber-blue" :
                          bar.color === "cyber-green" ? "bg-cyber-green" : "bg-cyber-amber"
                        }`}
                        style={{ width: `${bar.value}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>训练轮次: <span className="font-mono tabular-nums text-foreground">{coin.epochs}</span></span>
                  <span>数据点: <span className="font-mono tabular-nums text-foreground">{formatNumber(coin.dataPoints)}</span></span>
                  <span className="flex items-center gap-1">
                    {updatingCoins.has(coin.symbol) ? (
                      <><span className="w-1 h-1 rounded-full bg-cyber-green animate-pulse" /> 更新中</>
                    ) : (
                      <>更新: {coin.lastUpdated}</>
                    )}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ============ TAB: 训练数据集 (LIVE) ============ */}
        <TabsContent value="datasets" className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-cyber-blue" />
                训练数据集实时状态
              </h3>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                记录数每5秒自动更新
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">数据集名称</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium">类型</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">币种数</th>
                  <th className="text-left py-3 px-3 text-muted-foreground font-medium">时间范围</th>
                  <th className="text-right py-3 px-3 text-muted-foreground font-medium">记录数</th>
                  <th className="text-right py-3 px-3 text-muted-foreground font-medium">数据量</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">入库速率</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">质量分</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {liveDatasets.map((ds, i) => (
                  <motion.tr
                    key={ds.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{ds.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded-sm bg-cyber-blue/10 text-cyber-blue text-[10px]">{ds.type}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-foreground">{ds.coins || "N/A"}</td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">{ds.timeRange}</td>
                    <td className="py-3 px-3 text-right font-mono text-foreground tabular-nums">
                      {(ds.records / 1e8).toFixed(1)}亿
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-foreground tabular-nums">
                      {ds.size.toFixed(1)}TB
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded-sm bg-cyber-green/10 text-cyber-green text-[10px] font-mono tabular-nums">
                        {formatNumber(ds.recordsPerSec)}/s
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono font-bold tabular-nums ${
                        ds.quality >= 95 ? "text-cyber-green" : ds.quality >= 90 ? "text-cyber-blue" : "text-cyber-amber"
                      }`}>
                        {ds.quality.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-cyber-green">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                        {ds.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {/* Totals row */}
            <div className="px-4 py-3 bg-secondary/20 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">合计 {liveDatasets.length} 个数据集</span>
              <div className="flex gap-6">
                <span className="text-muted-foreground">总记录: <span className="font-mono font-bold text-foreground tabular-nums">{(liveDatasets.reduce((s, d) => s + d.records, 0) / 1e8).toFixed(1)}亿</span></span>
                <span className="text-muted-foreground">总容量: <span className="font-mono font-bold text-foreground tabular-nums">{liveDatasets.reduce((s, d) => s + d.size, 0).toFixed(1)}TB</span></span>
                <span className="text-muted-foreground">总入库: <span className="font-mono font-bold text-cyber-green tabular-nums">{formatNumber(liveDatasets.reduce((s, d) => s + d.recordsPerSec, 0))}/s</span></span>
              </div>
            </div>
          </div>

          {/* Dataset size distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs font-bold text-foreground mb-3">数据集容量分布</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={liveDatasets.map((ds) => ({
                      name: ds.name.replace("数据集", ""),
                      value: parseFloat(ds.size.toFixed(1)),
                    }))}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {liveDatasets.map((_, i) => {
                      const colors = ["#00d4ff", "#00ff88", "#ffc107", "#e74c8c", "#a855f7", "#06b6d4", "#84cc16", "#f97316"];
                      return <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.7} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number) => [`${value}TB`, "容量"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs font-bold text-foreground mb-3">数据质量评分分布 <span className="text-[10px] font-normal text-muted-foreground ml-1">实时更新</span></h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={liveDatasets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[80, 100]} tick={{ fill: "#888", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 9 }} width={120}
                    tickFormatter={(v: string) => v.replace("数据集", "")} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="quality" radius={[0, 3, 3, 0]} name="质量分">
                    {liveDatasets.map((ds, i) => (
                      <Cell key={i} fill={ds.quality >= 95 ? "#00ff88" : ds.quality >= 90 ? "#00d4ff" : "#ffc107"} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: 采集时间线 ============ */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyber-blue" />
              数据采集里程碑时间线 · 2021年1月 — 2026年2月
            </h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-blue via-cyber-green to-cyber-amber" />
              <div className="space-y-6">
                {collectionTimeline.map((item, i) => (
                  <motion.div
                    key={item.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative flex items-start gap-6 pl-2"
                  >
                    <div className={`relative z-10 w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                      item.milestone
                        ? "bg-cyber-blue ring-4 ring-cyber-blue/20"
                        : "bg-muted-foreground/50 ring-2 ring-border"
                    }`} />
                    <div className={`flex-1 bg-secondary/20 border rounded-lg p-4 ${
                      item.milestone ? "border-cyber-blue/30" : "border-border/50"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-cyber-blue">{item.date}</span>
                        {item.milestone && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-cyber-blue/10 text-cyber-blue">里程碑</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{item.event}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: 数据质量 (LIVE) ============ */}
        <TabsContent value="quality" className="space-y-6">
          {/* Quality overview cards - LIVE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "整体质量评分", value: liveQuality.overall.toFixed(1), unit: "/100", icon: Shield, color: "cyber-green" },
              { label: "数据完整性", value: liveQuality.completeness.toFixed(1), unit: "%", icon: CheckCircle2, color: "cyber-blue" },
              { label: "时间连续性", value: liveQuality.continuity.toFixed(2), unit: "%", icon: Clock, color: "cyber-blue" },
              { label: "异常数据率", value: liveQuality.anomalyRate.toFixed(3), unit: "%", icon: AlertTriangle, color: "cyber-green" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`w-4 h-4 text-${card.color}`} />
                  <span className="text-[10px] text-muted-foreground">{card.label}</span>
                  <span className="w-1 h-1 rounded-full bg-cyber-green animate-pulse ml-auto" />
                </div>
                <p className="text-2xl font-mono font-bold text-foreground tabular-nums">
                  {card.value}<span className="text-sm text-muted-foreground">{card.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Quality by data type - LIVE */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-foreground">各数据类型质量指标</h4>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                每8秒自动更新
              </span>
            </div>
            <div className="space-y-3">
              {dataTypeQualities.map((dtq) => (
                <div key={dtq.type} className="flex items-center gap-4">
                  <span className="text-xs text-foreground w-24 shrink-0">{dtq.type}</span>
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {[
                      { label: "完整性", val: dtq.completeness },
                      { label: "准确性", val: dtq.accuracy },
                      { label: "时效性", val: dtq.freshness },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                          <span>{metric.label}</span>
                          <span className="font-mono tabular-nums">{metric.val.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              metric.val >= 95 ? "bg-cyber-green" : metric.val >= 90 ? "bg-cyber-blue" : "bg-cyber-amber"
                            }`}
                            style={{ width: `${metric.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
