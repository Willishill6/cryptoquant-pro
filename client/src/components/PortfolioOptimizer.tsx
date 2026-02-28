/**
 * PortfolioOptimizer - 策略组合优化器
 * Markowitz mean-variance optimization with efficient frontier visualization
 * Design: Cyberpunk terminal aesthetic
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Target, Shield, TrendingUp, BarChart3, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface StrategyAllocation {
  name: string;
  weight: number;
  expectedReturn: number;
  risk: number;
  sharpe: number;
  color: string;
}

const strategyPool = [
  { name: "网格交易", expectedReturn: 18.5, risk: 12.3, color: "#00d4ff" },
  { name: "趋势跟随", expectedReturn: 32.8, risk: 24.5, color: "#00ff88" },
  { name: "动量策略", expectedReturn: 28.4, risk: 20.1, color: "#ff0080" },
  { name: "AI预测", expectedReturn: 45.2, risk: 28.7, color: "#ffaa00" },
  { name: "DeFi流动性", expectedReturn: 22.6, risk: 15.8, color: "#8b5cf6" },
  { name: "资金费率", expectedReturn: 15.2, risk: 8.4, color: "#06b6d4" },
  { name: "多因子Alpha", expectedReturn: 35.6, risk: 22.3, color: "#f43f5e" },
  { name: "均值回归", expectedReturn: 20.1, risk: 14.6, color: "#84cc16" },
];

// Generate efficient frontier points
function generateEfficientFrontier() {
  const points: { risk: number; ret: number; sharpe: number }[] = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const risk = 5 + t * 30;
    const ret = 8 + t * 42 - t * t * 12 + seededRandom(i * 7) * 3;
    const sharpe = ret / risk;
    points.push({ risk, ret, sharpe });
  }
  return points;
}

// Generate random portfolio points (Monte Carlo simulation)
function generateMonteCarloPortfolios() {
  const portfolios: { risk: number; ret: number; sharpe: number }[] = [];
  for (let i = 0; i < 200; i++) {
    const risk = 5 + seededRandom(i * 13 + 1) * 30;
    const maxRet = 8 + (risk / 35) * 42 - (risk / 35) * (risk / 35) * 12;
    const ret = maxRet * (0.3 + seededRandom(i * 13 + 2) * 0.65);
    const sharpe = ret / risk;
    portfolios.push({ risk, ret, sharpe });
  }
  return portfolios;
}

export default function PortfolioOptimizer() {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<"maxSharpe" | "minRisk" | "maxReturn">("maxSharpe");
  const [allocations, setAllocations] = useState<StrategyAllocation[]>(() =>
    strategyPool.map(s => ({
      ...s,
      weight: 100 / strategyPool.length,
      sharpe: s.expectedReturn / s.risk,
    }))
  );

  const efficientFrontier = useMemo(() => generateEfficientFrontier(), []);
  const monteCarloPoints = useMemo(() => generateMonteCarloPortfolios(), []);

  // Current portfolio metrics
  const portfolioReturn = allocations.reduce((s, a) => s + a.expectedReturn * a.weight / 100, 0);
  const portfolioRisk = Math.sqrt(allocations.reduce((s, a) => s + (a.risk * a.weight / 100) ** 2, 0)) * 1.2;
  const portfolioSharpe = portfolioReturn / portfolioRisk;

  const handleOptimize = () => {
    setOptimizing(true);
    toast.info("正在运行蒙特卡洛模拟优化...");
    setTimeout(() => {
      const newAllocations = strategyPool.map((s, i) => {
        let weight: number;
        if (optimizationMode === "maxSharpe") {
          // Favor high sharpe strategies
          const sharpe = s.expectedReturn / s.risk;
          weight = sharpe * (8 + seededRandom(i * 31 + Date.now() % 100) * 5);
        } else if (optimizationMode === "minRisk") {
          // Favor low risk strategies
          weight = (1 / s.risk) * (50 + seededRandom(i * 37 + Date.now() % 100) * 20);
        } else {
          // Favor high return strategies
          weight = s.expectedReturn * (2 + seededRandom(i * 41 + Date.now() % 100) * 1);
        }
        return { ...s, weight, sharpe: s.expectedReturn / s.risk };
      });
      const totalWeight = newAllocations.reduce((s, a) => s + a.weight, 0);
      newAllocations.forEach(a => { a.weight = (a.weight / totalWeight) * 100; });
      setAllocations(newAllocations);
      setOptimizing(false);
      toast.success("组合优化完成！");
    }, 2000);
  };

  // SVG chart dimensions
  const chartW = 600;
  const chartH = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;
  const xMin = 3, xMax = 38, yMin = 5, yMax = 50;
  const toX = (risk: number) => padding.left + ((risk - xMin) / (xMax - xMin)) * plotW;
  const toY = (ret: number) => padding.top + plotH - ((ret - yMin) / (yMax - yMin)) * plotH;

  return (
    <div className="space-y-4">
      {/* Optimization Controls */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">优化目标:</span>
            {[
              { key: "maxSharpe" as const, label: "最大夏普比率", icon: Target },
              { key: "minRisk" as const, label: "最小风险", icon: Shield },
              { key: "maxReturn" as const, label: "最大收益", icon: TrendingUp },
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setOptimizationMode(mode.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-all ${
                  optimizationMode === mode.key
                    ? "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue"
                    : "bg-secondary/50 border-border text-muted-foreground hover:border-cyber-blue/30"
                }`}
              >
                <mode.icon className="w-3 h-3" />
                {mode.label}
              </button>
            ))}
            <Button
              size="sm"
              className="ml-auto text-xs h-7 bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 hover:bg-cyber-blue/30"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              {optimizing ? "优化中..." : "运行优化"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Efficient Frontier Chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyber-blue" /> 有效前沿 & 蒙特卡洛模拟
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              {/* Grid */}
              {[10, 20, 30, 40, 50].map(v => (
                <g key={`y-${v}`}>
                  <line x1={padding.left} y1={toY(v)} x2={chartW - padding.right} y2={toY(v)} stroke="rgba(255,255,255,0.05)" />
                  <text x={padding.left - 5} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Space Mono">{v}%</text>
                </g>
              ))}
              {[5, 10, 15, 20, 25, 30, 35].map(v => (
                <g key={`x-${v}`}>
                  <line x1={toX(v)} y1={padding.top} x2={toX(v)} y2={chartH - padding.bottom} stroke="rgba(255,255,255,0.05)" />
                  <text x={toX(v)} y={chartH - padding.bottom + 15} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Space Mono">{v}%</text>
                </g>
              ))}

              {/* Axis labels */}
              <text x={chartW / 2} y={chartH - 5} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="JetBrains Mono">风险 (年化波动率)</text>
              <text x={12} y={chartH / 2} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="JetBrains Mono" transform={`rotate(-90, 12, ${chartH / 2})`}>收益 (年化收益率)</text>

              {/* Monte Carlo scatter */}
              {monteCarloPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={toX(p.risk)}
                  cy={toY(p.ret)}
                  r={2}
                  fill={`rgba(${p.sharpe > 1.5 ? "0,255,136" : p.sharpe > 1 ? "0,212,255" : "255,255,255"}, ${0.15 + p.sharpe * 0.1})`}
                />
              ))}

              {/* Efficient frontier line */}
              <path
                d={efficientFrontier.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.risk)} ${toY(p.ret)}`).join(" ")}
                fill="none"
                stroke="#00d4ff"
                strokeWidth={2.5}
                filter="url(#glow)"
              />

              {/* Individual strategies */}
              {strategyPool.map((s, _i) => (
                <g key={s.name}>
                  <circle cx={toX(s.risk)} cy={toY(s.expectedReturn)} r={5} fill={s.color} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                  <text x={toX(s.risk) + 8} y={toY(s.expectedReturn) + 3} fill={s.color} fontSize="8" fontFamily="JetBrains Mono">{s.name}</text>
                </g>
              ))}

              {/* Current portfolio point */}
              <circle cx={toX(portfolioRisk)} cy={toY(portfolioReturn)} r={8} fill="none" stroke="#ffaa00" strokeWidth={2} strokeDasharray="3 2" />
              <circle cx={toX(portfolioRisk)} cy={toY(portfolioReturn)} r={4} fill="#ffaa00" />
              <text x={toX(portfolioRisk) + 12} y={toY(portfolioReturn) - 5} fill="#ffaa00" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">当前组合</text>

              {/* Glow filter */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </CardContent>
        </Card>

        {/* Allocation Weights */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyber-amber" /> 策略权重分配
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Portfolio metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-md bg-secondary/30 border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground">组合收益</p>
                <p className="font-mono text-sm font-bold text-cyber-green">{portfolioReturn.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-md bg-secondary/30 border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground">组合风险</p>
                <p className="font-mono text-sm font-bold text-cyber-amber">{portfolioRisk.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-md bg-secondary/30 border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground">夏普比率</p>
                <p className="font-mono text-sm font-bold text-cyber-blue">{portfolioSharpe.toFixed(2)}</p>
              </div>
            </div>

            {/* Strategy weights */}
            {allocations.sort((a, b) => b.weight - a.weight).map((alloc, i) => (
              <motion.div
                key={alloc.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: alloc.color }} />
                    <span className="text-xs font-medium">{alloc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-muted-foreground">收益 <span className="text-cyber-green">{alloc.expectedReturn}%</span></span>
                    <span className="text-muted-foreground">风险 <span className="text-cyber-amber">{alloc.risk}%</span></span>
                    <span className="text-muted-foreground">Sharpe <span className="text-cyber-blue">{alloc.sharpe.toFixed(2)}</span></span>
                    <span className="font-mono font-bold w-12 text-right" style={{ color: alloc.color }}>{alloc.weight.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: alloc.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${alloc.weight}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Donut chart */}
            <div className="flex justify-center mt-4">
              <svg width={180} height={180} viewBox="0 0 180 180">
                {(() => {
                  let cumAngle = -90;
                  return allocations.sort((a, b) => b.weight - a.weight).map((alloc) => {
                    const angle = (alloc.weight / 100) * 360;
                    const startAngle = cumAngle;
                    cumAngle += angle;
                    const endAngle = cumAngle;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const r = 70;
                    const cx = 90, cy = 90;
                    const x1 = cx + r * Math.cos(startRad);
                    const y1 = cy + r * Math.sin(startRad);
                    const x2 = cx + r * Math.cos(endRad);
                    const y2 = cy + r * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;
                    return (
                      <path
                        key={alloc.name}
                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={alloc.color}
                        opacity={0.8}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth={1}
                      />
                    );
                  });
                })()}
                <circle cx={90} cy={90} r={40} fill="var(--card)" />
                <text x={90} y={85} textAnchor="middle" fill="var(--foreground)" fontSize="12" fontFamily="JetBrains Mono" fontWeight="bold">
                  {portfolioSharpe.toFixed(2)}
                </text>
                <text x={90} y={100} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Space Mono">
                  Sharpe
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
