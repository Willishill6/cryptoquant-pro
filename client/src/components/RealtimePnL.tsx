/**
 * RealtimePnL - 实时盈亏追踪面板
 * Shows live PnL by strategy and by coin with animated updates
 * Design: Cyberpunk terminal aesthetic
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Zap, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface PnLEntry {
  name: string;
  pnl: number;
  pnlPercent: number;
  volume24h: number;
  trades: number;
  color: string;
}

const strategyPnL: PnLEntry[] = [
  { name: "网格交易-BTC", pnl: 12580, pnlPercent: 2.35, volume24h: 534000, trades: 847, color: "#00d4ff" },
  { name: "趋势跟随-ETH", pnl: 8920, pnlPercent: 4.12, volume24h: 216800, trades: 124, color: "#00ff88" },
  { name: "AI预测-SOL", pnl: -3240, pnlPercent: -1.87, volume24h: 173200, trades: 56, color: "#ffaa00" },
  { name: "DeFi流动性", pnl: 5670, pnlPercent: 1.92, volume24h: 295000, trades: 312, color: "#8b5cf6" },
  { name: "动量策略-AVAX", pnl: 4150, pnlPercent: 3.28, volume24h: 89400, trades: 78, color: "#f43f5e" },
  { name: "资金费率", pnl: 2890, pnlPercent: 0.95, volume24h: 304500, trades: 1024, color: "#06b6d4" },
  { name: "多因子Alpha", pnl: 7340, pnlPercent: 2.78, volume24h: 264100, trades: 203, color: "#84cc16" },
  { name: "均值回归-LINK", pnl: -1560, pnlPercent: -0.82, volume24h: 45600, trades: 34, color: "#f97316" },
];

const coinPnL: PnLEntry[] = [
  { name: "BTC", pnl: 18420, pnlPercent: 1.85, volume24h: 892000, trades: 1245, color: "#f7931a" },
  { name: "ETH", pnl: 12350, pnlPercent: 2.41, volume24h: 567000, trades: 987, color: "#627eea" },
  { name: "SOL", pnl: 5680, pnlPercent: 3.72, volume24h: 234000, trades: 456, color: "#00d4aa" },
  { name: "BNB", pnl: 3240, pnlPercent: 1.12, volume24h: 178000, trades: 312, color: "#f3ba2f" },
  { name: "AVAX", pnl: -2180, pnlPercent: -1.34, volume24h: 89000, trades: 178, color: "#e84142" },
  { name: "DOGE", pnl: 1890, pnlPercent: 4.56, volume24h: 67000, trades: 234, color: "#c2a633" },
  { name: "LINK", pnl: -890, pnlPercent: -0.67, volume24h: 45000, trades: 89, color: "#2a5ada" },
  { name: "UNI", pnl: 2340, pnlPercent: 2.89, volume24h: 34000, trades: 67, color: "#ff007a" },
];

export default function RealtimePnL() {
  const [view, setView] = useState<"strategy" | "coin">("strategy");
  const [data, setData] = useState(view === "strategy" ? strategyPnL : coinPnL);
  const [totalPnL, setTotalPnL] = useState(0);
  const tickRef = useRef(0);

  useEffect(() => {
    setData(view === "strategy" ? strategyPnL : coinPnL);
  }, [view]);

  // Simulate real-time PnL updates
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      setData(prev => prev.map((entry, i) => {
        const delta = (seededRandom(tickRef.current * 13 + i * 7) - 0.48) * 200;
        const newPnl = entry.pnl + delta;
        const newPercent = entry.pnlPercent + (delta / 10000) * 100;
        return { ...entry, pnl: newPnl, pnlPercent: newPercent };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    setTotalPnL(data.reduce((s, d) => s + d.pnl, 0));
  }, [data]);

  const maxAbsPnl = Math.max(...data.map(d => Math.abs(d.pnl)));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyber-green" /> 实时盈亏追踪
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("strategy")}
              className={`px-2 py-0.5 text-[10px] rounded-l-md border transition-all ${
                view === "strategy" ? "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue" : "bg-secondary/50 border-border text-muted-foreground"
              }`}
            >
              <Zap className="w-3 h-3 inline mr-0.5" />按策略
            </button>
            <button
              onClick={() => setView("coin")}
              className={`px-2 py-0.5 text-[10px] rounded-r-md border transition-all ${
                view === "coin" ? "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue" : "bg-secondary/50 border-border text-muted-foreground"
              }`}
            >
              <Coins className="w-3 h-3 inline mr-0.5" />按币种
            </button>
          </div>
        </div>
        {/* Total PnL */}
        <div className={`text-lg font-mono font-bold ${totalPnL >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
          {totalPnL >= 0 ? "+" : ""}{totalPnL.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          <span className="text-[10px] text-muted-foreground ml-2">24h总盈亏</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-1.5"
          >
            {data.sort((a, b) => b.pnl - a.pnl).map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 p-1.5 rounded-md bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] font-medium w-28 truncate">{entry.name}</span>
                
                {/* PnL bar */}
                <div className="flex-1 h-4 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-secondary/30 rounded-full relative">
                      <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/20" />
                      <motion.div
                        className={`absolute top-0 h-full rounded-full ${entry.pnl >= 0 ? "left-1/2" : "right-1/2"}`}
                        style={{
                          backgroundColor: entry.pnl >= 0 ? "#00ff88" : "#ff0080",
                          width: `${(Math.abs(entry.pnl) / maxAbsPnl) * 50}%`,
                          opacity: 0.6,
                        }}
                        animate={{ width: `${(Math.abs(entry.pnl) / maxAbsPnl) * 50}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* PnL value */}
                <div className="text-right w-20">
                  <span className={`text-[11px] font-mono font-bold ${entry.pnl >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {entry.pnl >= 0 ? "+" : ""}{(entry.pnl / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="text-right w-14">
                  <span className={`text-[10px] font-mono ${entry.pnlPercent >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                    {entry.pnlPercent >= 0 ? "+" : ""}{entry.pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-right w-12">
                  <span className="text-[9px] text-muted-foreground font-mono">{entry.trades}笔</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
