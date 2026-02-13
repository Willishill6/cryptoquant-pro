/**
 * OrderBookDepth - Visual order book depth chart
 * Cyberpunk terminal style with bid/ask depth visualization
 */
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface OrderBookDepthProps {
  symbol?: string;
}

export default function OrderBookDepth({ symbol = "BTC" }: OrderBookDepthProps) {
  const depthData = useMemo(() => {
    const basePrice = symbol === "BTC" ? 98540 : symbol === "ETH" ? 3840 : 187;
    const spread = basePrice * 0.001;
    const midPrice = basePrice;

    // Generate bid side (descending price, ascending cumulative)
    const bids: { price: number; bidDepth: number; askDepth: number }[] = [];
    let bidCum = 0;
    for (let i = 20; i >= 0; i--) {
      const price = midPrice - spread * (i + 1) * 0.5;
      const vol = (Math.random() * 5 + 2) * (1 + i * 0.15);
      bidCum += vol;
      bids.push({ price: Math.round(price * 100) / 100, bidDepth: Math.round(bidCum * 100) / 100, askDepth: 0 });
    }

    // Generate ask side (ascending price, ascending cumulative)
    const asks: { price: number; bidDepth: number; askDepth: number }[] = [];
    let askCum = 0;
    for (let i = 0; i <= 20; i++) {
      const price = midPrice + spread * (i + 1) * 0.5;
      const vol = (Math.random() * 5 + 2) * (1 + i * 0.15);
      askCum += vol;
      asks.push({ price: Math.round(price * 100) / 100, bidDepth: 0, askDepth: Math.round(askCum * 100) / 100 });
    }

    return [...bids, ...asks];
  }, [symbol]);

  // Order book table data
  const orderBookRows = useMemo(() => {
    const basePrice = symbol === "BTC" ? 98540 : symbol === "ETH" ? 3840 : 187;
    const rows = [];
    for (let i = 10; i >= 1; i--) {
      const price = basePrice + i * basePrice * 0.0005;
      const amount = (Math.random() * 3 + 0.5).toFixed(4);
      const total = (price * parseFloat(amount)).toFixed(2);
      rows.push({ side: "ask" as const, price: price.toFixed(2), amount, total, pct: Math.random() * 100 });
    }
    rows.push({ side: "mid" as const, price: basePrice.toFixed(2), amount: "---", total: "---", pct: 0 });
    for (let i = 1; i <= 10; i++) {
      const price = basePrice - i * basePrice * 0.0005;
      const amount = (Math.random() * 3 + 0.5).toFixed(4);
      const total = (price * parseFloat(amount)).toFixed(2);
      rows.push({ side: "bid" as const, price: price.toFixed(2), amount, total, pct: Math.random() * 100 });
    }
    return rows;
  }, [symbol]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Depth Chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-3 font-heading tracking-wider">
          {symbol}/USDT 深度图
        </h4>
        <div style={{ minHeight: 280 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={depthData}>
            <defs>
              <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff3388" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ff3388" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="price" tick={{ fontSize: 9, fill: "#666" }} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
            <YAxis tick={{ fontSize: 9, fill: "#666" }} />
            <Tooltip
              contentStyle={{ background: "#0f1219", border: "1px solid #1e2a3a", borderRadius: "8px", fontSize: "11px" }}
              formatter={(value: number, name: string) => [value.toFixed(2), name === "bidDepth" ? "买盘深度" : "卖盘深度"]}
              labelFormatter={(label) => `价格: $${Number(label).toLocaleString()}`}
            />
            <Area type="stepAfter" dataKey="bidDepth" stroke="#00ff88" fill="url(#bidGrad)" strokeWidth={1.5} />
            <Area type="stepAfter" dataKey="askDepth" stroke="#ff3388" fill="url(#askGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Order Book Table */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-xs font-bold text-foreground mb-3 font-heading tracking-wider">
          {symbol}/USDT 订单簿
        </h4>
        <div className="space-y-0 text-[10px] font-mono max-h-[280px] overflow-y-auto">
          <div className="grid grid-cols-4 text-muted-foreground pb-1 border-b border-border sticky top-0 bg-card">
            <span>价格(USDT)</span>
            <span className="text-right">数量({symbol})</span>
            <span className="text-right">总额(USDT)</span>
            <span className="text-right">深度</span>
          </div>
          {orderBookRows.map((row, i) => {
            if (row.side === "mid") {
              return (
                <div key={i} className="grid grid-cols-4 py-1.5 text-center border-y border-cyber-blue/30 bg-cyber-blue/5">
                  <span className="col-span-4 text-cyber-blue font-bold text-xs">
                    ≡ ${row.price} 当前价格
                  </span>
                </div>
              );
            }
            return (
              <div key={i} className="grid grid-cols-4 py-0.5 relative hover:bg-secondary/20 transition-colors">
                <div
                  className={`absolute inset-0 ${row.side === "bid" ? "bg-cyber-green/5" : "bg-cyber-magenta/5"}`}
                  style={{ width: `${row.pct}%`, [row.side === "bid" ? "right" : "left"]: 0 }}
                />
                <span className={`relative z-10 ${row.side === "bid" ? "text-cyber-green" : "text-cyber-magenta"}`}>
                  {row.price}
                </span>
                <span className="relative z-10 text-right text-foreground">{row.amount}</span>
                <span className="relative z-10 text-right text-muted-foreground">{row.total}</span>
                <span className="relative z-10 text-right">
                  <span className={`inline-block h-1 rounded-full ${row.side === "bid" ? "bg-cyber-green/50" : "bg-cyber-magenta/50"}`} style={{ width: `${row.pct}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
