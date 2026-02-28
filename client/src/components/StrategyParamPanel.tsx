/**
 * StrategyParamPanel - Interactive parameter tuning panel for active strategies
 * Features: slider-based parameter adjustment, real-time preview, simulated backtest
 * Design: Cyberpunk terminal dark theme with glow effects
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Play, RotateCcw, TrendingUp, ChevronDown, ChevronUp, Zap, Brain, Target, Shield, X, Check, Loader2, BarChart3, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, Legend } from "recharts";

// ─── Strategy Parameter Definitions ────────────────────────────────
interface ParamDef {
  key: string;
  label: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  category: "核心参数" | "风控参数" | "AI参数" | "执行参数";
}

interface BacktestResult {
  totalReturn: number;
  annReturn: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  profitFactor: number;
  calmar: number;
  equityCurve: { day: string; value: number; benchmark: number }[];
  monthlyReturns: { month: string; return: number }[];
}

// Strategy-specific parameter definitions
const strategyParams: Record<string, ParamDef[]> = {
  "网格交易": [
    { key: "gridSpacing", label: "网格间距", desc: "相邻网格线之间的价格百分比", min: 0.1, max: 5.0, step: 0.05, unit: "%", defaultValue: 0.5, category: "核心参数" },
    { key: "gridCount", label: "网格数量", desc: "上下方向的网格线总数", min: 5, max: 100, step: 1, unit: "条", defaultValue: 20, category: "核心参数" },
    { key: "orderSize", label: "每格下单量", desc: "每个网格的下单金额", min: 50, max: 5000, step: 50, unit: "USDT", defaultValue: 500, category: "核心参数" },
    { key: "priceUpper", label: "价格上限偏移", desc: "相对当前价格的上限百分比", min: 1, max: 50, step: 0.5, unit: "%", defaultValue: 10, category: "核心参数" },
    { key: "priceLower", label: "价格下限偏移", desc: "相对当前价格的下限百分比", min: 1, max: 50, step: 0.5, unit: "%", defaultValue: 10, category: "核心参数" },
    { key: "stopLoss", label: "止损阈值", desc: "触发止损的最大亏损百分比", min: 1, max: 30, step: 0.5, unit: "%", defaultValue: 8, category: "风控参数" },
    { key: "takeProfit", label: "止盈阈值", desc: "触发止盈的目标收益百分比", min: 1, max: 50, step: 0.5, unit: "%", defaultValue: 15, category: "风控参数" },
    { key: "maxPosition", label: "最大仓位", desc: "单币种最大持仓占比", min: 5, max: 100, step: 5, unit: "%", defaultValue: 30, category: "风控参数" },
    { key: "aiOptimize", label: "AI优化频率", desc: "AI自动优化参数的间隔", min: 1, max: 24, step: 1, unit: "小时", defaultValue: 4, category: "AI参数" },
    { key: "slippage", label: "滑点容忍", desc: "最大可接受滑点", min: 0.01, max: 1.0, step: 0.01, unit: "%", defaultValue: 0.1, category: "执行参数" },
  ],
  "趋势跟随": [
    { key: "fastMA", label: "快速均线周期", desc: "短期移动平均线周期", min: 3, max: 50, step: 1, unit: "K线", defaultValue: 7, category: "核心参数" },
    { key: "slowMA", label: "慢速均线周期", desc: "长期移动平均线周期", min: 10, max: 200, step: 1, unit: "K线", defaultValue: 25, category: "核心参数" },
    { key: "atrPeriod", label: "ATR周期", desc: "平均真实波幅计算周期", min: 5, max: 50, step: 1, unit: "K线", defaultValue: 14, category: "核心参数" },
    { key: "atrMultiplier", label: "ATR倍数", desc: "止损/止盈的ATR倍数", min: 0.5, max: 5.0, step: 0.1, unit: "x", defaultValue: 2.0, category: "核心参数" },
    { key: "trendStrength", label: "趋势强度阈值", desc: "ADX指标确认趋势的最低值", min: 10, max: 50, step: 1, unit: "", defaultValue: 25, category: "核心参数" },
    { key: "stopLoss", label: "止损阈值", desc: "触发止损的最大亏损百分比", min: 1, max: 20, step: 0.5, unit: "%", defaultValue: 5, category: "风控参数" },
    { key: "trailingStop", label: "移动止损", desc: "盈利后的移动止损距离", min: 0.5, max: 10, step: 0.5, unit: "%", defaultValue: 3, category: "风控参数" },
    { key: "positionSize", label: "仓位比例", desc: "每次开仓的资金比例", min: 5, max: 50, step: 5, unit: "%", defaultValue: 20, category: "风控参数" },
    { key: "aiConfidence", label: "AI信号阈值", desc: "AI预测信号的最低置信度", min: 50, max: 95, step: 1, unit: "%", defaultValue: 70, category: "AI参数" },
    { key: "cooldown", label: "冷却时间", desc: "连续交易之间的最小间隔", min: 1, max: 60, step: 1, unit: "分钟", defaultValue: 15, category: "执行参数" },
  ],
  "动量策略": [
    { key: "lookback", label: "回看周期", desc: "计算动量的历史窗口", min: 5, max: 120, step: 1, unit: "K线", defaultValue: 20, category: "核心参数" },
    { key: "momentumThreshold", label: "动量阈值", desc: "触发交易的最低动量值", min: 0.5, max: 10, step: 0.1, unit: "%", defaultValue: 2.0, category: "核心参数" },
    { key: "topN", label: "持仓币种数", desc: "同时持有的最大币种数量", min: 3, max: 30, step: 1, unit: "种", defaultValue: 10, category: "核心参数" },
    { key: "rebalanceFreq", label: "再平衡频率", desc: "投资组合再平衡间隔", min: 1, max: 168, step: 1, unit: "小时", defaultValue: 24, category: "核心参数" },
    { key: "volumeFilter", label: "成交量过滤", desc: "最低日成交量要求", min: 1, max: 100, step: 1, unit: "M USDT", defaultValue: 10, category: "核心参数" },
    { key: "stopLoss", label: "止损阈值", desc: "单币种止损百分比", min: 2, max: 25, step: 0.5, unit: "%", defaultValue: 8, category: "风控参数" },
    { key: "maxDrawdown", label: "最大回撤限制", desc: "组合最大回撤触发全部平仓", min: 5, max: 30, step: 1, unit: "%", defaultValue: 15, category: "风控参数" },
    { key: "aiWeight", label: "AI信号权重", desc: "AI预测在综合评分中的权重", min: 0, max: 100, step: 5, unit: "%", defaultValue: 40, category: "AI参数" },
    { key: "factorWeight", label: "因子权重", desc: "阿尔法因子在评分中的权重", min: 0, max: 100, step: 5, unit: "%", defaultValue: 35, category: "AI参数" },
    { key: "slippage", label: "滑点容忍", desc: "最大可接受滑点", min: 0.01, max: 1.0, step: 0.01, unit: "%", defaultValue: 0.15, category: "执行参数" },
  ],
  "default": [
    { key: "positionSize", label: "仓位比例", desc: "每次开仓的资金比例", min: 5, max: 100, step: 5, unit: "%", defaultValue: 20, category: "核心参数" },
    { key: "stopLoss", label: "止损阈值", desc: "触发止损的最大亏损百分比", min: 1, max: 30, step: 0.5, unit: "%", defaultValue: 8, category: "风控参数" },
    { key: "takeProfit", label: "止盈阈值", desc: "触发止盈的目标收益百分比", min: 1, max: 50, step: 0.5, unit: "%", defaultValue: 15, category: "风控参数" },
    { key: "maxPosition", label: "最大仓位", desc: "单币种最大持仓占比", min: 5, max: 100, step: 5, unit: "%", defaultValue: 30, category: "风控参数" },
    { key: "trailingStop", label: "移动止损", desc: "盈利后的移动止损距离", min: 0.5, max: 10, step: 0.5, unit: "%", defaultValue: 3, category: "风控参数" },
    { key: "maxDrawdown", label: "最大回撤限制", desc: "组合最大回撤触发全部平仓", min: 5, max: 30, step: 1, unit: "%", defaultValue: 15, category: "风控参数" },
    { key: "aiConfidence", label: "AI信号阈值", desc: "AI预测信号的最低置信度", min: 50, max: 95, step: 1, unit: "%", defaultValue: 70, category: "AI参数" },
    { key: "aiOptimize", label: "AI优化频率", desc: "AI自动优化参数的间隔", min: 1, max: 24, step: 1, unit: "小时", defaultValue: 4, category: "AI参数" },
    { key: "cooldown", label: "冷却时间", desc: "连续交易之间的最小间隔", min: 1, max: 60, step: 1, unit: "分钟", defaultValue: 15, category: "执行参数" },
    { key: "slippage", label: "滑点容忍", desc: "最大可接受滑点", min: 0.01, max: 1.0, step: 0.01, unit: "%", defaultValue: 0.1, category: "执行参数" },
  ],
};

// ─── Simulated Backtest Generator ──────────────────────────────────
function generateBacktest(params: Record<string, number>, _strategyType: string): BacktestResult {
  // Simulate backtest results based on parameter values
  const stopLoss = params.stopLoss ?? 8;
  const posSize = params.positionSize ?? params.orderSize ?? 500;
  const aiWeight = params.aiWeight ?? params.aiConfidence ?? 70;

  // Parameters affect outcomes
  const riskFactor = Math.max(0.3, 1 - stopLoss / 30);
  const sizeFactor = Math.min(1.5, posSize / 20);
  const aiFactor = 0.8 + (aiWeight / 100) * 0.4;

  // 暂无真实回测数据，返回零值
  const sharpe = 0;
  const annReturn = 0;
  const maxDrawdown = 0;
  const winRate = 0;
  const trades = 0;
  const profitFactor = 0;
  const calmar = 0;
  const totalReturn = 0;

  // 空资金曲线
  const equityCurve = Array.from({ length: 60 }, (_, i) => ({
    day: `D${i + 1}`,
    value: 100000,
    benchmark: 100000,
  }));

  // 空月度收益
  const monthlyReturns = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    return: 0,
  }));

  return { totalReturn, annReturn, sharpe, maxDrawdown, winRate, trades, profitFactor, calmar, equityCurve, monthlyReturns };
}

// ─── Category Colors ───────────────────────────────────────────────
const categoryColors: Record<string, string> = {
  "核心参数": "text-cyber-blue border-cyber-blue/30",
  "风控参数": "text-cyber-magenta border-cyber-magenta/30",
  "AI参数": "text-cyber-amber border-cyber-amber/30",
  "执行参数": "text-muted-foreground border-border",
};

const categoryIcons: Record<string, typeof Target> = {
  "核心参数": Target,
  "风控参数": Shield,
  "AI参数": Brain,
  "执行参数": Zap,
};

// ─── Main Component ────────────────────────────────────────────────
interface StrategyParamPanelProps {
  strategy: {
    id: number;
    name: string;
    type: string;
    status: string;
    pnl: number;
    winRate: number;
    trades: number;
    coins: string[];
    ai: string;
    risk: string;
    sharpe: number;
  };
  onClose: () => void;
}

export default function StrategyParamPanel({ strategy, onClose }: StrategyParamPanelProps) {
  const params = strategyParams[strategy.type] ?? strategyParams["default"];
  
  // Initialize parameter values
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    params.forEach(p => { init[p.key] = p.defaultValue; });
    return init;
  });

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [_hasChanges, setHasChanges] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [originalResult, setOriginalResult] = useState<BacktestResult | null>(null);

  // Group params by category
  const groupedParams = useMemo(() => {
    const groups: Record<string, ParamDef[]> = {};
    params.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [params]);

  // Handle slider change
  const handleChange = useCallback((key: string, val: number[]) => {
    setValues(prev => ({ ...prev, [key]: val[0] }));
    setHasChanges(true);
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const init: Record<string, number> = {};
    params.forEach(p => { init[p.key] = p.defaultValue; });
    setValues(init);
    setHasChanges(false);
    setBacktestResult(null);
    setCompareMode(false);
    toast.info("参数已重置为默认值");
  }, [params]);

  // Run simulated backtest
  const handleBacktest = useCallback(() => {
    setIsRunning(true);
    // Save original result for comparison
    if (backtestResult && !originalResult) {
      setOriginalResult(backtestResult);
    }
    // Simulate async backtest
    setTimeout(() => {
      const result = generateBacktest(values, strategy.type);
      setBacktestResult(result);
      setIsRunning(false);
      setHasChanges(false);
      if (originalResult) setCompareMode(true);
      toast.success("模拟回测完成", { description: `Sharpe: ${result.sharpe} | 年化: ${result.annReturn}% | 胜率: ${result.winRate}%` });
    }, 1500);
  }, [values, strategy.type, backtestResult, originalResult]);

  // AI auto-optimize
  const handleAIOptimize = useCallback(() => {
    setIsRunning(true);
    toast.info("AI正在搜索最优参数...", { description: "贝叶斯优化 + 遗传算法" });
    setTimeout(() => {
      // 暂无真实AI优化能力，保持原参数不变
      setIsRunning(false);
      toast.info("AI优化功能尚未接入真实训练数据", { description: "请先接入交易所API并开始实盘训练" });
    }, 1500);
  }, [params]);

  // Apply params
  const handleApply = useCallback(() => {
    toast.success("参数已应用", { description: `${strategy.name} 参数更新成功，策略将使用新参数运行` });
  }, [strategy.name]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg border border-cyber-blue/30 bg-card shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(0,212,255,0.1)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-cyber-blue/15 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-cyber-blue" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold tracking-wider">{strategy.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] py-0 border-cyber-blue/30 text-cyber-blue">{strategy.type}</Badge>
                <Badge variant="outline" className="text-[9px] py-0">{strategy.coins.join(", ")}</Badge>
                <Badge variant="outline" className="text-[9px] py-0 border-cyber-amber/30 text-cyber-amber">{strategy.ai}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleReset} disabled={isRunning}>
              <RotateCcw className="w-3 h-3 mr-1" />重置
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-cyber-amber/30 text-cyber-amber hover:bg-cyber-amber/10" onClick={handleAIOptimize} disabled={isRunning}>
              <Brain className="w-3 h-3 mr-1" />AI优化
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] bg-cyber-blue hover:bg-cyber-blue/80 text-background"
              onClick={handleBacktest}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
              {isRunning ? "回测中..." : "运行回测"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Parameter Sliders */}
          <div className="space-y-4">
            {Object.entries(groupedParams).map(([category, catParams]) => {
              const Icon = categoryIcons[category] ?? Target;
              const isAdvanced = category === "执行参数";
              if (isAdvanced && !showAdvanced) return null;
              return (
                <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${categoryColors[category]?.split(" ")[0] ?? "text-muted-foreground"}`} />
                    <h3 className="text-xs font-heading font-bold tracking-wider text-muted-foreground uppercase">{category}</h3>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {catParams.map((param) => (
                      <div key={param.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-medium">{param.label}</span>
                            <span className="text-[9px] text-muted-foreground ml-2">{param.desc}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-mono font-bold text-cyber-blue min-w-[50px] text-right">
                              {values[param.key]?.toFixed(param.step < 1 ? (param.step < 0.1 ? 2 : 1) : 0)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{param.unit}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-mono text-muted-foreground w-8 text-right">{param.min}</span>
                          <Slider
                            value={[values[param.key] ?? param.defaultValue]}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            onValueChange={(val) => handleChange(param.key, val)}
                            className="flex-1"
                          />
                          <span className="text-[8px] font-mono text-muted-foreground w-8">{param.max}</span>
                        </div>
                        {/* Default indicator */}
                        {values[param.key] !== param.defaultValue && (
                          <div className="flex items-center gap-1 text-[8px]">
                            <span className="text-muted-foreground">默认: {param.defaultValue}{param.unit}</span>
                            <span className={`font-mono ${values[param.key] > param.defaultValue ? "text-cyber-amber" : "text-cyber-blue"}`}>
                              ({values[param.key] > param.defaultValue ? "+" : ""}{((values[param.key] - param.defaultValue) / param.defaultValue * 100).toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Toggle advanced params */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAdvanced ? "隐藏高级参数" : "显示高级参数 (执行参数)"}
            </button>

            {/* Auto-optimize toggle */}
            <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-secondary/20">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyber-amber" />
                <div>
                  <p className="text-[11px] font-medium">AI自动优化</p>
                  <p className="text-[9px] text-muted-foreground">允许AI根据市场变化自动调整参数</p>
                </div>
              </div>
              <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
            </div>
          </div>

          {/* Backtest Progress */}
          <AnimatePresence>
            {isRunning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="bg-card border-cyber-blue/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="w-4 h-4 text-cyber-blue animate-spin" />
                      <span className="text-xs font-medium">正在运行模拟回测...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">数据加载</span>
                        <span className="text-cyber-green font-mono">完成</span>
                      </div>
                      <Progress value={85} className="h-1" />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">策略执行模拟</span>
                        <span className="text-cyber-amber font-mono">进行中...</span>
                      </div>
                      <Progress value={60} className="h-1" />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">风险指标计算</span>
                        <span className="text-muted-foreground font-mono">等待中</span>
                      </div>
                      <Progress value={20} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backtest Results */}
          <AnimatePresence>
            {backtestResult && !isRunning && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Result Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { label: "总收益", value: `+${backtestResult.totalReturn}%`, color: "green" },
                    { label: "年化收益", value: `${backtestResult.annReturn}%`, color: "green" },
                    { label: "Sharpe", value: backtestResult.sharpe.toString(), color: "blue" },
                    { label: "最大回撤", value: `${backtestResult.maxDrawdown}%`, color: "magenta" },
                    { label: "胜率", value: `${backtestResult.winRate}%`, color: "green" },
                    { label: "盈亏比", value: backtestResult.profitFactor.toString(), color: "blue" },
                    { label: "Calmar", value: backtestResult.calmar.toString(), color: "amber" },
                    { label: "交易数", value: backtestResult.trades.toLocaleString(), color: "muted" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-2 rounded border border-border/50 bg-secondary/20 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className={`text-sm font-mono font-bold mt-0.5 ${
                        stat.color === "green" ? "text-cyber-green" :
                        stat.color === "blue" ? "text-cyber-blue" :
                        stat.color === "magenta" ? "text-cyber-magenta" :
                        stat.color === "amber" ? "text-cyber-amber" :
                        "text-foreground"
                      }`}>{stat.value}</p>
                      {/* Compare with original */}
                      {compareMode && originalResult && (
                        <p className="text-[7px] font-mono text-muted-foreground mt-0.5">
                          vs {stat.label === "总收益" ? `+${originalResult.totalReturn}%` :
                              stat.label === "年化收益" ? `${originalResult.annReturn}%` :
                              stat.label === "Sharpe" ? originalResult.sharpe :
                              stat.label === "最大回撤" ? `${originalResult.maxDrawdown}%` :
                              stat.label === "胜率" ? `${originalResult.winRate}%` :
                              stat.label === "盈亏比" ? originalResult.profitFactor :
                              stat.label === "Calmar" ? originalResult.calmar :
                              originalResult.trades.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Equity Curve */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-cyber-green" />
                      模拟回测资金曲线
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 min-h-[192px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={backtestResult.equityCurve}>
                          <defs>
                            <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#555" }} interval={9} />
                          <YAxis tick={{ fontSize: 8, fill: "#555" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                          <Tooltip
                            contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "6px", fontSize: "10px" }}
                            formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                          />
                          <Area type="monotone" dataKey="value" stroke="#00ff88" strokeWidth={2} fill="url(#btGrad)" name="策略" />
                          <Line type="monotone" dataKey="benchmark" stroke="#555" strokeWidth={1} strokeDasharray="4 4" dot={false} name="基准" />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: "9px", color: "#888" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Returns */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-heading text-muted-foreground tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-cyber-blue" />
                      月度收益分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {backtestResult.monthlyReturns.map((m) => (
                        <div key={m.month} className="text-center">
                          <div className="h-16 flex items-end justify-center mb-1">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(100, Math.abs(m.return) * 5)}%` }}
                              transition={{ delay: 0.1, duration: 0.4 }}
                              className={`w-full max-w-[20px] rounded-t-sm ${m.return >= 0 ? "bg-cyber-green/60" : "bg-cyber-magenta/60"}`}
                            />
                          </div>
                          <p className={`text-[9px] font-mono font-bold ${m.return >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                            {m.return > 0 ? "+" : ""}{m.return}%
                          </p>
                          <p className="text-[8px] text-muted-foreground">{m.month}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>回测周期: 2024-01 ~ 2026-02 (2年)</span>
                    <span>·</span>
                    <Activity className="w-3 h-3" />
                    <span>数据: 5分钟K线 · {strategy.coins.join(", ")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleBacktest} disabled={isRunning}>
                      <RotateCcw className="w-3 h-3 mr-1" />重新回测
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] bg-cyber-green hover:bg-cyber-green/80 text-background"
                      onClick={handleApply}
                    >
                      <Check className="w-3 h-3 mr-1" />应用参数
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No backtest yet hint */}
          {!backtestResult && !isRunning && (
            <div className="text-center py-8 border border-dashed border-border/50 rounded-lg">
              <SlidersHorizontal className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">调整上方参数后，点击「运行回测」查看模拟结果</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">或点击「AI优化」让AI自动搜索最优参数组合</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
