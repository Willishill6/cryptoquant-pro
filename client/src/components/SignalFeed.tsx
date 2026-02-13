/**
 * SignalFeed — AI交易信号实时推送面板 + 历史回测验证
 * 展示AI模型产生的实时交易信号，支持一键跟单
 * 追踪信号发出后1h/6h/24h的价格走势和盈亏结果
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, TrendingUp, Minus, Brain, Clock, ArrowUpRight, ArrowDownRight, Target, Radio, CheckCircle2, History, ChevronDown, ChevronUp, BarChart3, Eye, Timer, Trophy, XCircle } from "lucide-react";

// ============ TYPES ============
interface BacktestResult {
  timeframe: "1h" | "6h" | "24h";
  priceAtCheck: number;
  priceDelta: number;     // absolute
  priceDeltaPct: number;  // percentage
  hitTarget: boolean;
  hitStopLoss: boolean;
  pnl: number;            // dollar P&L if followed
  status: "盈利" | "亏损" | "持平" | "pending";
}

interface Signal {
  id: string;
  timestamp: number;
  coin: string;
  direction: "买入" | "卖出" | "观望";
  strength: "强" | "中" | "弱";
  confidence: number;
  model: string;
  reason: string;
  targetPrice: number;
  currentPrice: number;
  stopLoss: number;
  riskReward: number;
  followed: boolean;
  // Backtest fields
  backtest?: {
    "1h"?: BacktestResult;
    "6h"?: BacktestResult;
    "24h"?: BacktestResult;
  };
  verified: boolean;
}

// ============ CONSTANTS ============
const COINS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK", "MATIC", "UNI", "ATOM", "FIL", "NEAR", "APT", "ARB", "OP", "PEPE", "WIF"];
const MODELS = ["DeepSeek-V3", "TFT", "LSTM-Attention", "GPT-4o", "PatchTST", "XGBoost-Alpha"];
const REASONS = [
  "MACD金叉+成交量放大，短期看涨信号明确",
  "RSI超卖反弹+布林带下轨支撑，反转概率高",
  "链上大户净流入+资金费率转负，多头信号",
  "4H级别头肩顶形态确认，短期回调风险",
  "AI情绪指标转正+社交热度飙升，关注突破",
  "多因子Alpha信号共振，综合评分达阈值",
  "均线多头排列+LSTM趋势预测看涨",
  "订单簿买盘厚度增加+鲸鱼地址增持",
  "波动率收缩至极值，即将选择方向突破",
  "DeFi TVL回升+生态活跃度提升",
  "技术面三角形收敛末端，突破方向待确认",
  "资金费率极端偏高，空头挤压风险",
];

// ============ SIGNAL GENERATION ============
function generateSignal(ageMs?: number): Signal {
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const r = Math.random();
  const direction = r < 0.45 ? "买入" as const : r < 0.75 ? "卖出" as const : "观望" as const;
  const strength = Math.random() < 0.3 ? "强" as const : Math.random() < 0.6 ? "中" as const : "弱" as const;
  const confidence = +(60 + Math.random() * 35).toFixed(1);
  const currentPrice = coin === "BTC" ? 65000 + Math.random() * 5000 :
    coin === "ETH" ? 1800 + Math.random() * 400 :
    coin === "SOL" ? 70 + Math.random() * 30 :
    coin === "BNB" ? 580 + Math.random() * 60 :
    0.5 + Math.random() * 50;
  const targetMult = direction === "买入" ? 1 + Math.random() * 0.08 : direction === "卖出" ? 1 - Math.random() * 0.08 : 1;
  const slMult = direction === "买入" ? 1 - Math.random() * 0.03 : direction === "卖出" ? 1 + Math.random() * 0.03 : 1;
  const targetPrice = currentPrice * targetMult;
  const stopLoss = currentPrice * slMult;
  const reward = Math.abs(targetPrice - currentPrice);
  const risk = Math.abs(currentPrice - stopLoss);
  const riskReward = risk > 0 ? +(reward / risk).toFixed(1) : 0;

  const ts = ageMs ? Date.now() - ageMs : Date.now();

  return {
    id: `sig-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: ts,
    coin, direction, strength, confidence,
    model: MODELS[Math.floor(Math.random() * MODELS.length)],
    reason: REASONS[Math.floor(Math.random() * REASONS.length)],
    targetPrice, currentPrice, stopLoss, riskReward,
    followed: false,
    verified: false,
  };
}

// Generate backtest result for a signal
function generateBacktest(sig: Signal, tf: "1h" | "6h" | "24h"): BacktestResult {
  const volatility = tf === "1h" ? 0.015 : tf === "6h" ? 0.035 : 0.065;
  // Higher confidence = more likely to be correct
  const correctBias = (sig.confidence - 50) / 100;
  const baseMove = (Math.random() - 0.5 + correctBias * 0.3) * volatility;
  const priceDeltaPct = baseMove * 100;
  const priceAtCheck = sig.currentPrice * (1 + baseMove);
  const priceDelta = priceAtCheck - sig.currentPrice;

  const hitTarget = sig.direction === "买入"
    ? priceAtCheck >= sig.targetPrice
    : sig.direction === "卖出"
    ? priceAtCheck <= sig.targetPrice
    : false;

  const hitStopLoss = sig.direction === "买入"
    ? priceAtCheck <= sig.stopLoss
    : sig.direction === "卖出"
    ? priceAtCheck >= sig.stopLoss
    : false;

  // P&L calculation (assuming $1000 position)
  let pnl = 0;
  if (sig.direction === "买入") {
    pnl = (priceDelta / sig.currentPrice) * 1000;
  } else if (sig.direction === "卖出") {
    pnl = (-priceDelta / sig.currentPrice) * 1000;
  }

  const status = Math.abs(pnl) < 1 ? "持平" as const : pnl > 0 ? "盈利" as const : "亏损" as const;

  return { timeframe: tf, priceAtCheck, priceDelta, priceDeltaPct, hitTarget, hitStopLoss, pnl, status };
}

// Generate historical signals with backtest data already populated
function generateHistoricalSignals(count: number): Signal[] {
  const signals: Signal[] = [];
  for (let i = 0; i < count; i++) {
    const age = 3600000 * (1 + Math.random() * 72); // 1-72 hours ago
    const sig = generateSignal(age);
    sig.verified = true;
    sig.followed = Math.random() < 0.3;
    sig.backtest = {
      "1h": generateBacktest(sig, "1h"),
      "6h": generateBacktest(sig, "6h"),
      "24h": age > 6 * 3600000 ? generateBacktest(sig, "24h") : undefined,
    };
    signals.push(sig);
  }
  return signals.sort((a, b) => b.timestamp - a.timestamp);
}

// ============ BACKTEST BADGE COMPONENT ============
function BacktestBadge({ result }: { result?: BacktestResult }) {
  if (!result) return <span className="text-[8px] text-muted-foreground/50 font-mono">--</span>;
  const color = result.status === "盈利" ? "text-cyber-green" : result.status === "亏损" ? "text-cyber-magenta" : "text-muted-foreground";
  const bg = result.status === "盈利" ? "bg-cyber-green/10" : result.status === "亏损" ? "bg-cyber-magenta/10" : "bg-secondary/20";
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono ${bg} ${color}`}>
      {result.pnl >= 0 ? "+" : ""}{result.pnl.toFixed(1)}$
      <span className="text-[7px] opacity-70">({result.priceDeltaPct >= 0 ? "+" : ""}{result.priceDeltaPct.toFixed(2)}%)</span>
      {result.hitTarget && <Target className="w-2.5 h-2.5 text-cyber-green" />}
      {result.hitStopLoss && <XCircle className="w-2.5 h-2.5 text-cyber-magenta" />}
    </span>
  );
}

// ============ MAIN COMPONENT ============
export default function SignalFeed() {
  const [mode, setMode] = useState<"live" | "backtest">("live");
  const [signals, setSignals] = useState<Signal[]>(() =>
    Array.from({ length: 5 }, () => {
      const s = generateSignal(Math.random() * 600000);
      return s;
    }).sort((a, b) => b.timestamp - a.timestamp)
  );
  const [historicalSignals] = useState<Signal[]>(() => generateHistoricalSignals(40));
  const [filter, setFilter] = useState<"all" | "买入" | "卖出">("all");
  const [btFilter, setBtFilter] = useState<"all" | "盈利" | "亏损">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Push new signals every 8-15 seconds
  useEffect(() => {
    const push = () => {
      setSignals(prev => {
        const newSig = generateSignal();
        return [newSig, ...prev].slice(0, 20);
      });
    };
    const interval = setInterval(push, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, []);

  // Simulate backtest results appearing for older live signals
  useEffect(() => {
    const check = setInterval(() => {
      setSignals(prev => prev.map(sig => {
        if (sig.direction === "观望") return sig;
        const age = Date.now() - sig.timestamp;
        const bt: NonNullable<Signal["backtest"]> = sig.backtest ? { ...sig.backtest } : {};
        let changed = false;
        if (age > 15000 && !bt?.["1h"]) { // Simulate 1h check after 15s
          bt!["1h"] = generateBacktest(sig, "1h");
          changed = true;
        }
        if (age > 40000 && !bt?.["6h"]) { // Simulate 6h check after 40s
          bt!["6h"] = generateBacktest(sig, "6h");
          changed = true;
        }
        if (age > 80000 && !bt?.["24h"]) { // Simulate 24h check after 80s
          bt!["24h"] = generateBacktest(sig, "24h");
          changed = true;
        }
        if (changed) return { ...sig, backtest: bt, verified: !!(bt?.["1h"] && bt?.["6h"] && bt?.["24h"]) };
        return sig;
      }));
    }, 5000);
    return () => clearInterval(check);
  }, []);

  const handleFollow = (id: string) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, followed: true } : s));
    const sig = signals.find(s => s.id === id);
    if (sig) {
      toast.success(`已跟单: ${sig.direction} ${sig.coin}`, {
        description: `目标价 $${sig.targetPrice.toFixed(2)} | 止损 $${sig.stopLoss.toFixed(2)} | 模型: ${sig.model}`,
      });
    }
  };

  const filtered = filter === "all" ? signals : signals.filter(s => s.direction === filter);
  const buyCount = signals.filter(s => s.direction === "买入").length;
  const sellCount = signals.filter(s => s.direction === "卖出").length;

  // Backtest stats
  const btStats = useMemo(() => {
    const all = historicalSignals.filter(s => s.direction !== "观望" && s.backtest?.["24h"]);
    const wins = all.filter(s => s.backtest?.["24h"]?.status === "盈利");
    const totalPnl = all.reduce((sum, s) => sum + (s.backtest?.["24h"]?.pnl || 0), 0);
    const avgPnl = all.length > 0 ? totalPnl / all.length : 0;
    const hitTargetCount = all.filter(s => s.backtest?.["24h"]?.hitTarget).length;
    // Win rate by model
    const byModel: Record<string, { total: number; wins: number; pnl: number }> = {};
    all.forEach(s => {
      if (!byModel[s.model]) byModel[s.model] = { total: 0, wins: 0, pnl: 0 };
      byModel[s.model].total++;
      if (s.backtest?.["24h"]?.status === "盈利") byModel[s.model].wins++;
      byModel[s.model].pnl += s.backtest?.["24h"]?.pnl || 0;
    });
    // Win rate by timeframe
    const tf1h = historicalSignals.filter(s => s.backtest?.["1h"]);
    const tf6h = historicalSignals.filter(s => s.backtest?.["6h"]);
    const tf24h = all;
    const wr1h = tf1h.length > 0 ? tf1h.filter(s => s.backtest?.["1h"]?.status === "盈利").length / tf1h.length * 100 : 0;
    const wr6h = tf6h.length > 0 ? tf6h.filter(s => s.backtest?.["6h"]?.status === "盈利").length / tf6h.length * 100 : 0;
    const wr24h = all.length > 0 ? wins.length / all.length * 100 : 0;
    return {
      total: all.length, wins: wins.length, winRate: wr24h,
      totalPnl, avgPnl, hitTargetCount, hitTargetRate: all.length > 0 ? hitTargetCount / all.length * 100 : 0,
      byModel, wr1h, wr6h, wr24h,
      tf1hCount: tf1h.length, tf6hCount: tf6h.length, tf24hCount: tf24h.length,
    };
  }, [historicalSignals]);

  const filteredBt = useMemo(() => {
    let list = historicalSignals.filter(s => s.direction !== "观望");
    if (btFilter === "盈利") list = list.filter(s => s.backtest?.["24h"]?.status === "盈利");
    if (btFilter === "亏损") list = list.filter(s => s.backtest?.["24h"]?.status === "亏损");
    return list;
  }, [historicalSignals, btFilter]);

  const formatTime = (ts: number) => {
    const ago = Math.floor((Date.now() - ts) / 1000);
    if (ago < 60) return `${ago}秒前`;
    if (ago < 3600) return `${Math.floor(ago / 60)}分钟前`;
    if (ago < 86400) return `${Math.floor(ago / 3600)}小时前`;
    return `${Math.floor(ago / 86400)}天前`;
  };

  const formatPrice = (p: number) => p < 1 ? p.toPrecision(4) : p.toFixed(2);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyber-amber" />
            AI信号推送
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("live")}
              className={`px-2 py-0.5 rounded text-[9px] flex items-center gap-1 transition-colors ${mode === "live" ? "bg-cyber-blue/20 text-cyber-blue" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Zap className="w-3 h-3" />实时信号
            </button>
            <button
              onClick={() => setMode("backtest")}
              className={`px-2 py-0.5 rounded text-[9px] flex items-center gap-1 transition-colors ${mode === "backtest" ? "bg-cyber-amber/20 text-cyber-amber" : "text-muted-foreground hover:text-foreground"}`}
            >
              <History className="w-3 h-3" />回测验证
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "live" ? (
          <>
            {/* Live filter bar */}
            <div className="flex items-center gap-1 mb-2">
              {([
                { key: "all" as const, label: "全部", count: signals.length },
                { key: "买入" as const, label: "买入", count: buyCount },
                { key: "卖出" as const, label: "卖出", count: sellCount },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                    filter === f.key
                      ? f.key === "买入" ? "bg-cyber-green/20 text-cyber-green"
                        : f.key === "卖出" ? "bg-cyber-magenta/20 text-cyber-magenta"
                        : "bg-cyber-blue/20 text-cyber-blue"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
              <Badge variant="outline" className="text-[7px] py-0 ml-auto text-muted-foreground border-border/50">
                <Timer className="w-2.5 h-2.5 mr-0.5" />回测自动验证中
              </Badge>
            </div>

            {/* Live signals list */}
            <div ref={containerRef} className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              <AnimatePresence>
                {filtered.map((sig, i) => (
                  <motion.div
                    key={sig.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      sig.direction === "买入"
                        ? "border-cyber-green/20 bg-cyber-green/5 hover:bg-cyber-green/8"
                        : sig.direction === "卖出"
                        ? "border-cyber-magenta/20 bg-cyber-magenta/5 hover:bg-cyber-magenta/8"
                        : "border-border/30 bg-secondary/10 hover:bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                        sig.direction === "买入" ? "bg-cyber-green/15" :
                        sig.direction === "卖出" ? "bg-cyber-magenta/15" : "bg-secondary/30"
                      }`}>
                        {sig.direction === "买入" ? <ArrowUpRight className="w-3.5 h-3.5 text-cyber-green" /> :
                         sig.direction === "卖出" ? <ArrowDownRight className="w-3.5 h-3.5 text-cyber-magenta" /> :
                         <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs">{sig.coin}/USDT</span>
                          <Badge variant="outline" className={`text-[7px] py-0 ${
                            sig.direction === "买入" ? "border-cyber-green/30 text-cyber-green" :
                            sig.direction === "卖出" ? "border-cyber-magenta/30 text-cyber-magenta" :
                            "border-muted-foreground/30 text-muted-foreground"
                          }`}>{sig.direction}</Badge>
                          <Badge variant="outline" className={`text-[7px] py-0 ${
                            sig.strength === "强" ? "border-cyber-green/30 text-cyber-green" :
                            sig.strength === "中" ? "border-cyber-amber/30 text-cyber-amber" :
                            "border-muted-foreground/30 text-muted-foreground"
                          }`}>{sig.strength}信号</Badge>
                          <span className="text-[8px] text-muted-foreground font-mono ml-auto flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{formatTime(sig.timestamp)}
                          </span>
                        </div>

                        <p className="text-[10px] text-foreground/70 mb-1.5 leading-relaxed">{sig.reason}</p>

                        <div className="flex items-center gap-3 text-[9px] flex-wrap">
                          <span className="text-muted-foreground">现价 <span className="text-foreground font-mono">${formatPrice(sig.currentPrice)}</span></span>
                          <span className="text-muted-foreground">目标 <span className="text-cyber-green font-mono">${formatPrice(sig.targetPrice)}</span></span>
                          <span className="text-muted-foreground">止损 <span className="text-cyber-magenta font-mono">${formatPrice(sig.stopLoss)}</span></span>
                          <span className="text-muted-foreground">R:R <span className="text-cyber-blue font-mono">{sig.riskReward}</span></span>
                          <span className="text-muted-foreground flex items-center gap-0.5">
                            <Brain className="w-2.5 h-2.5" />{sig.model}
                          </span>
                          <span className="text-muted-foreground">置信 <span className={`font-mono ${sig.confidence > 80 ? "text-cyber-green" : sig.confidence > 65 ? "text-cyber-amber" : "text-muted-foreground"}`}>{sig.confidence}%</span></span>
                        </div>

                        {/* Inline backtest results */}
                        {sig.backtest && sig.direction !== "观望" && (
                          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/20">
                            <Eye className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                            <span className="text-[8px] text-muted-foreground">回测:</span>
                            <span className="text-[8px] text-muted-foreground">1h</span>
                            <BacktestBadge result={sig.backtest["1h"]} />
                            <span className="text-[8px] text-muted-foreground">6h</span>
                            <BacktestBadge result={sig.backtest["6h"]} />
                            <span className="text-[8px] text-muted-foreground">24h</span>
                            <BacktestBadge result={sig.backtest["24h"]} />
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {sig.followed ? (
                          <Badge className="text-[8px] py-0.5 bg-cyber-green/15 text-cyber-green border-0">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" />已跟单
                          </Badge>
                        ) : sig.direction !== "观望" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-6 text-[9px] px-2 ${
                              sig.direction === "买入"
                                ? "border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                                : "border-cyber-magenta/30 text-cyber-magenta hover:bg-cyber-magenta/10"
                            }`}
                            onClick={() => handleFollow(sig.id)}
                          >
                            <Zap className="w-3 h-3 mr-0.5" />跟单
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* ============ BACKTEST MODE ============ */
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "验证信号", value: btStats.total, icon: BarChart3, color: "text-cyber-blue" },
                { label: "24h胜率", value: `${btStats.winRate.toFixed(1)}%`, icon: Trophy, color: btStats.winRate > 55 ? "text-cyber-green" : "text-cyber-amber" },
                { label: "累计盈亏", value: `${btStats.totalPnl >= 0 ? "+" : ""}$${btStats.totalPnl.toFixed(0)}`, icon: TrendingUp, color: btStats.totalPnl >= 0 ? "text-cyber-green" : "text-cyber-magenta" },
                { label: "命中目标", value: `${btStats.hitTargetRate.toFixed(1)}%`, icon: Target, color: "text-cyber-amber" },
              ].map((s, i) => (
                <div key={i} className="p-2 rounded-lg bg-secondary/20 text-center">
                  <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
                  <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[8px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Timeframe win rate comparison */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-secondary/10 border border-border/20">
              <Timer className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[9px] text-muted-foreground">时间窗口胜率:</span>
              {[
                { tf: "1h", wr: btStats.wr1h, count: btStats.tf1hCount },
                { tf: "6h", wr: btStats.wr6h, count: btStats.tf6hCount },
                { tf: "24h", wr: btStats.wr24h, count: btStats.tf24hCount },
              ].map(t => (
                <div key={t.tf} className="flex items-center gap-1">
                  <span className="text-[9px] font-mono text-muted-foreground">{t.tf}</span>
                  <div className="w-16 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div className={`h-full rounded-full ${t.wr > 55 ? "bg-cyber-green" : t.wr > 45 ? "bg-cyber-amber" : "bg-cyber-magenta"}`} style={{ width: `${t.wr}%` }} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${t.wr > 55 ? "text-cyber-green" : t.wr > 45 ? "text-cyber-amber" : "text-cyber-magenta"}`}>{t.wr.toFixed(1)}%</span>
                  <span className="text-[7px] text-muted-foreground/50">({t.count})</span>
                </div>
              ))}
            </div>

            {/* Model performance breakdown */}
            <div className="mb-3 p-2 rounded-lg bg-secondary/10 border border-border/20">
              <div className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Brain className="w-3 h-3" />各模型24h回测表现
              </div>
              <div className="space-y-1">
                {Object.entries(btStats.byModel).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)).map(([model, data]) => {
                  const wr = data.total > 0 ? (data.wins / data.total * 100) : 0;
                  return (
                    <div key={model} className="flex items-center gap-2">
                      <span className="text-[9px] w-28 truncate font-mono">{model}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${wr > 60 ? "bg-cyber-green" : wr > 50 ? "bg-cyber-amber" : "bg-cyber-magenta"}`} style={{ width: `${wr}%` }} />
                      </div>
                      <span className={`text-[9px] font-mono w-12 text-right ${wr > 60 ? "text-cyber-green" : wr > 50 ? "text-cyber-amber" : "text-cyber-magenta"}`}>{wr.toFixed(0)}%</span>
                      <span className="text-[8px] text-muted-foreground w-16 text-right">{data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(0)}</span>
                      <span className="text-[7px] text-muted-foreground/50 w-6 text-right">{data.total}笔</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 mb-2">
              {([
                { key: "all" as const, label: "全部" },
                { key: "盈利" as const, label: "盈利" },
                { key: "亏损" as const, label: "亏损" },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setBtFilter(f.key)}
                  className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                    btFilter === f.key
                      ? f.key === "盈利" ? "bg-cyber-green/20 text-cyber-green"
                        : f.key === "亏损" ? "bg-cyber-magenta/20 text-cyber-magenta"
                        : "bg-cyber-blue/20 text-cyber-blue"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-[8px] text-muted-foreground ml-auto">{filteredBt.length}条记录</span>
            </div>

            {/* Historical signals with backtest */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
              {filteredBt.slice(0, 15).map(sig => {
                const bt24 = sig.backtest?.["24h"];
                const isExpanded = expandedId === sig.id;
                return (
                  <div key={sig.id} className={`rounded-lg border transition-colors cursor-pointer ${
                    bt24?.status === "盈利" ? "border-cyber-green/15 bg-cyber-green/3" :
                    bt24?.status === "亏损" ? "border-cyber-magenta/15 bg-cyber-magenta/3" :
                    "border-border/20 bg-secondary/5"
                  }`} onClick={() => setExpandedId(isExpanded ? null : sig.id)}>
                    <div className="flex items-center gap-2 p-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        sig.direction === "买入" ? "bg-cyber-green/15" : "bg-cyber-magenta/15"
                      }`}>
                        {sig.direction === "买入" ? <ArrowUpRight className="w-3 h-3 text-cyber-green" /> : <ArrowDownRight className="w-3 h-3 text-cyber-magenta" />}
                      </div>
                      <span className="text-[10px] font-bold w-16">{sig.coin}/USDT</span>
                      <span className="text-[8px] text-muted-foreground">{sig.model}</span>
                      <span className="text-[8px] text-muted-foreground">{formatTime(sig.timestamp)}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-[8px] text-muted-foreground">1h</span>
                        <BacktestBadge result={sig.backtest?.["1h"]} />
                        <span className="text-[8px] text-muted-foreground">6h</span>
                        <BacktestBadge result={sig.backtest?.["6h"]} />
                        <span className="text-[8px] text-muted-foreground">24h</span>
                        <BacktestBadge result={sig.backtest?.["24h"]} />
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-2 pb-2 border-t border-border/10 pt-1.5 space-y-1">
                        <p className="text-[9px] text-foreground/60">{sig.reason}</p>
                        <div className="flex items-center gap-3 text-[8px]">
                          <span className="text-muted-foreground">入场 <span className="font-mono">${formatPrice(sig.currentPrice)}</span></span>
                          <span className="text-muted-foreground">目标 <span className="text-cyber-green font-mono">${formatPrice(sig.targetPrice)}</span></span>
                          <span className="text-muted-foreground">止损 <span className="text-cyber-magenta font-mono">${formatPrice(sig.stopLoss)}</span></span>
                          <span className="text-muted-foreground">置信 <span className="font-mono">{sig.confidence}%</span></span>
                          <span className="text-muted-foreground">R:R <span className="font-mono">{sig.riskReward}</span></span>
                        </div>
                        {/* Price trajectory mini-chart */}
                        <div className="flex items-center gap-1 mt-1">
                          {(["1h", "6h", "24h"] as const).map(tf => {
                            const r = sig.backtest?.[tf];
                            if (!r) return null;
                            return (
                              <div key={tf} className={`flex-1 p-1.5 rounded text-center ${r.status === "盈利" ? "bg-cyber-green/8" : r.status === "亏损" ? "bg-cyber-magenta/8" : "bg-secondary/20"}`}>
                                <div className="text-[7px] text-muted-foreground mb-0.5">{tf}后</div>
                                <div className={`text-[10px] font-mono font-bold ${r.status === "盈利" ? "text-cyber-green" : r.status === "亏损" ? "text-cyber-magenta" : "text-muted-foreground"}`}>
                                  ${formatPrice(r.priceAtCheck)}
                                </div>
                                <div className={`text-[8px] font-mono ${r.priceDeltaPct >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                                  {r.priceDeltaPct >= 0 ? "+" : ""}{r.priceDeltaPct.toFixed(2)}%
                                </div>
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  {r.hitTarget && <Badge className="text-[6px] py-0 px-1 bg-cyber-green/15 text-cyber-green border-0">命中目标</Badge>}
                                  {r.hitStopLoss && <Badge className="text-[6px] py-0 px-1 bg-cyber-magenta/15 text-cyber-magenta border-0">触发止损</Badge>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
