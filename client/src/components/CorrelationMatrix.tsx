/**
 * CorrelationMatrix - 全币种价格相关性矩阵热力图
 * Design: Cyberpunk terminal aesthetic with interactive hover
 * Shows correlation between all tracked coins using color-coded heatmap
 */
import { useState, useMemo } from "react";
import { allCoins } from "@/lib/mockData";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate correlation matrix for tracked coins
function generateCorrelationMatrix(symbols: string[]) {
  const n = symbols.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0; // Self-correlation
    for (let j = i + 1; j < n; j++) {
      const seed = (i * 100 + j) * 7 + 13;
      // Generate realistic correlations:
      // BTC correlates highly with most coins
      // Same-category coins correlate more
      const catI = allCoins.find(c => c.symbol === symbols[i])?.category || "";
      const catJ = allCoins.find(c => c.symbol === symbols[j])?.category || "";
      const isBTC = symbols[i] === "BTC" || symbols[j] === "BTC";
      const isETH = symbols[i] === "ETH" || symbols[j] === "ETH";
      const sameCategory = catI === catJ;
      const isStable = catI === "稳定币" || catJ === "稳定币";
      
      let base: number;
      if (isStable) {
        base = -0.1 + seededRandom(seed) * 0.3; // Low correlation with stablecoins
      } else if (isBTC) {
        base = 0.55 + seededRandom(seed) * 0.35; // BTC correlates with most
      } else if (isETH) {
        base = 0.45 + seededRandom(seed) * 0.4;
      } else if (sameCategory) {
        base = 0.4 + seededRandom(seed) * 0.45; // Same category = higher correlation
      } else {
        base = 0.1 + seededRandom(seed) * 0.55; // Cross-category
      }
      
      const corr = Math.max(-1, Math.min(1, base));
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }
  return matrix;
}

function getCorrelationColor(value: number): string {
  // Cyberpunk color scheme: magenta (negative) -> dark (zero) -> green (positive)
  if (value >= 0.8) return "rgba(0, 255, 136, 0.85)";
  if (value >= 0.6) return "rgba(0, 255, 136, 0.6)";
  if (value >= 0.4) return "rgba(0, 255, 136, 0.4)";
  if (value >= 0.2) return "rgba(0, 255, 136, 0.2)";
  if (value >= 0) return "rgba(0, 255, 136, 0.08)";
  if (value >= -0.2) return "rgba(255, 0, 128, 0.08)";
  if (value >= -0.4) return "rgba(255, 0, 128, 0.2)";
  if (value >= -0.6) return "rgba(255, 0, 128, 0.4)";
  if (value >= -0.8) return "rgba(255, 0, 128, 0.6)";
  return "rgba(255, 0, 128, 0.85)";
}

interface Props {
  maxCoins?: number;
}

export default function CorrelationMatrix({ maxCoins = 20 }: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set(allCoins.filter(c => c.category !== "稳定币").map(c => c.category));
    return ["all", ...Array.from(cats)];
  }, []);

  const filteredCoins = useMemo(() => {
    let coins = allCoins.filter(c => c.category !== "稳定币");
    if (selectedCategory !== "all") {
      coins = coins.filter(c => c.category === selectedCategory);
    }
    return coins.slice(0, maxCoins);
  }, [selectedCategory, maxCoins]);

  const symbols = filteredCoins.map(c => c.symbol);
  const matrix = useMemo(() => generateCorrelationMatrix(symbols), [symbols.join(",")]);

  const cellSize = symbols.length > 15 ? 28 : 34;
  const labelWidth = 50;
  const totalWidth = labelWidth + symbols.length * cellSize;
  const totalHeight = labelWidth + symbols.length * cellSize;

  return (
    <div className="space-y-3">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-[10px] rounded-md border transition-all ${
              selectedCategory === cat
                ? "bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue"
                : "bg-secondary/50 border-border text-muted-foreground hover:border-cyber-blue/30"
            }`}
          >
            {cat === "all" ? "全部币种" : cat}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>负相关</span>
        <div className="flex h-3">
          {[-0.9, -0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} className="w-5 h-full" style={{ backgroundColor: getCorrelationColor(v) }} />
          ))}
        </div>
        <span>正相关</span>
      </div>

      {/* Matrix */}
      <div className="overflow-auto max-h-[600px] rounded-md border border-border">
        <svg width={totalWidth} height={totalHeight} className="block">
          {/* Column labels */}
          {symbols.map((sym, j) => (
            <text
              key={`col-${j}`}
              x={labelWidth + j * cellSize + cellSize / 2}
              y={labelWidth - 6}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace" }}
              transform={`rotate(-45, ${labelWidth + j * cellSize + cellSize / 2}, ${labelWidth - 6})`}
            >
              {sym}
            </text>
          ))}

          {/* Row labels + cells */}
          {symbols.map((sym, i) => (
            <g key={`row-${i}`}>
              <text
                x={labelWidth - 4}
                y={labelWidth + i * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: "9px", fontFamily: "JetBrains Mono, monospace" }}
              >
                {sym}
              </text>
              {symbols.map((_, j) => {
                const value = matrix[i][j];
                const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                const isHighlighted = hoveredCell?.row === i || hoveredCell?.col === j;
                return (
                  <g key={`cell-${i}-${j}`}>
                    <rect
                      x={labelWidth + j * cellSize}
                      y={labelWidth + i * cellSize}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      fill={getCorrelationColor(value)}
                      stroke={isHovered ? "#00d4ff" : isHighlighted ? "rgba(0, 212, 255, 0.3)" : "transparent"}
                      strokeWidth={isHovered ? 2 : 1}
                      rx={2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                    {cellSize >= 30 && (
                      <text
                        x={labelWidth + j * cellSize + cellSize / 2 - 0.5}
                        y={labelWidth + i * cellSize + cellSize / 2 + 3}
                        textAnchor="middle"
                        className={`pointer-events-none ${Math.abs(value) > 0.5 ? "fill-foreground" : "fill-muted-foreground"}`}
                        style={{ fontSize: "8px", fontFamily: "Space Mono, monospace" }}
                      >
                        {value.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 border border-cyber-blue/30 text-xs">
          <span className="font-mono font-bold text-cyber-blue">{symbols[hoveredCell.row]}</span>
          <span className="text-muted-foreground">↔</span>
          <span className="font-mono font-bold text-cyber-blue">{symbols[hoveredCell.col]}</span>
          <span className="text-muted-foreground">相关系数:</span>
          <span className={`font-mono font-bold ${matrix[hoveredCell.row][hoveredCell.col] >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
            {matrix[hoveredCell.row][hoveredCell.col].toFixed(4)}
          </span>
          <span className="text-muted-foreground">
            {Math.abs(matrix[hoveredCell.row][hoveredCell.col]) > 0.7 ? "| 强相关" :
             Math.abs(matrix[hoveredCell.row][hoveredCell.col]) > 0.4 ? "| 中等相关" : "| 弱相关"}
          </span>
        </div>
      )}
    </div>
  );
}
