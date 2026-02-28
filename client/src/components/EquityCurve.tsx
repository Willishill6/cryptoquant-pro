/**
 * EquityCurve — 30天权益曲线 + 最大回撤 + BTC基准对比 (Performance Optimized)
 * 实时更新，每3秒追加新数据点
 *
 * Optimizations:
 * - Track peak via useRef instead of Math.max(...prev.map()) every 3s (O(n) spread avoided)
 * - Stable interval reference
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Target, Activity, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function generateEquityData() {
  // 暂无真实权益数据，返回空数组
  return { data: [] as { day: string; equity: number; btc: number; drawdown: number; signal?: string }[], peak: 100000 };
}

export default function EquityCurve() {
  const initial = useMemo(() => generateEquityData(), []);
  const [data, setData] = useState(initial.data);
  const peakRef = useRef(initial.peak);
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("30d");

  // 暂停假权益曲线实时更新，等待真实交易数据接入
  // useEffect(() => { ... }, []);

  const filtered = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    return data.slice(-days - 1);
  }, [data, timeRange]);

  const stats = useMemo(() => {
    if (filtered.length < 2) return { totalReturn: 0, btcReturn: 0, alpha: 0, maxDD: 0, sharpe: 0 };
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    const totalReturn = ((last.equity - first.equity) / first.equity) * 100;
    const btcReturn = ((last.btc - first.btc) / first.btc) * 100;
    const alpha = totalReturn - btcReturn;
    const maxDD = Math.min(...filtered.map(d => d.drawdown));
    const returns = filtered.slice(1).map((d, i) => (d.equity - filtered[i].equity) / filtered[i].equity);
    const avgR = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdR = Math.sqrt(returns.reduce((a, b) => a + (b - avgR) ** 2, 0) / returns.length);
    const sharpe = stdR > 0 ? (avgR / stdR) * Math.sqrt(365) : 0;
    return { totalReturn, btcReturn, alpha, maxDD, sharpe };
  }, [filtered]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-green" />
            权益曲线 · 策略 vs BTC基准
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          </CardTitle>
          <div className="flex items-center gap-1">
            {(["7d", "14d", "30d"] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  timeRange === r ? "bg-cyber-blue/20 text-cyber-blue" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {[
            { label: "策略收益", value: `${stats.totalReturn >= 0 ? "+" : ""}${stats.totalReturn.toFixed(2)}%`, color: stats.totalReturn >= 0 ? "text-cyber-green" : "text-cyber-magenta", icon: TrendingUp },
            { label: "BTC基准", value: `${stats.btcReturn >= 0 ? "+" : ""}${stats.btcReturn.toFixed(2)}%`, color: stats.btcReturn >= 0 ? "text-cyber-green" : "text-cyber-magenta", icon: BarChart3 },
            { label: "Alpha超额", value: `${stats.alpha >= 0 ? "+" : ""}${stats.alpha.toFixed(2)}%`, color: stats.alpha >= 0 ? "text-cyber-green" : "text-cyber-magenta", icon: Target },
            { label: "最大回撤", value: `${stats.maxDD.toFixed(2)}%`, color: "text-cyber-magenta", icon: AlertTriangle },
            { label: "夏普比率", value: stats.sharpe.toFixed(2), color: stats.sharpe > 2 ? "text-cyber-green" : stats.sharpe > 1 ? "text-cyber-amber" : "text-cyber-magenta", icon: Activity },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <s.icon className={`w-3 h-3 ${s.color}`} />
                <span className="text-[8px] text-muted-foreground">{s.label}</span>
              </div>
              <p className={`font-mono font-bold text-xs ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-52 min-h-[208px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filtered}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#666" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "#666" }} domain={["auto", "auto"]} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "equity" ? "策略权益" : name === "btc" ? "BTC基准" : name,
                ]}
              />
              <Area type="monotone" dataKey="equity" stroke="#00ff88" fill="url(#equityGrad)" strokeWidth={2} name="equity" />
              <Line type="monotone" dataKey="btc" stroke="#ffaa00" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="btc" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyber-green rounded" />
            <span className="text-muted-foreground">策略权益</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyber-amber rounded" style={{ borderTop: "1px dashed #ffaa00" }} />
            <span className="text-muted-foreground">BTC基准</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
