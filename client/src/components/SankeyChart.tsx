/**
 * SankeyChart - Custom SVG-based Sankey diagram for fund flow visualization
 * Shows capital flow: 资金来源 → 策略类型 → 目标币种
 * Design: Cyberpunk terminal dark theme with glow effects
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────
interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color: string;
  column: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

interface SankeyChartProps {
  width?: number;
  height?: number;
}

// ─── Fund Flow Data ────────────────────────────────────────────────
const nodes: SankeyNode[] = [
  // Column 0: 资金来源
  { id: "initial", label: "初始本金", value: 1500000, color: "#00d4ff", column: 0 },
  { id: "reinvest", label: "利润再投资", value: 650000, color: "#00d4ff", column: 0 },
  { id: "defi_yield", label: "DeFi收益", value: 280000, color: "#00d4ff", column: 0 },
  { id: "funding_income", label: "资金费率收入", value: 120000, color: "#00d4ff", column: 0 },

  // Column 1: 策略类型
  { id: "grid", label: "网格交易", value: 520000, color: "#00ff88", column: 1 },
  { id: "trend", label: "趋势跟随", value: 380000, color: "#00ff88", column: 1 },
  { id: "defi_lp", label: "DeFi流动性", value: 450000, color: "#f5a623", column: 1 },
  { id: "ai_predict", label: "AI预测", value: 350000, color: "#9b59b6", column: 1 },
  { id: "momentum", label: "动量策略", value: 280000, color: "#00ff88", column: 1 },
  { id: "funding_rate", label: "资金费率", value: 220000, color: "#f5a623", column: 1 },
  { id: "alpha", label: "多因子Alpha", value: 350000, color: "#e74c8c", column: 1 },

  // Column 2: 目标币种/资产
  { id: "btc", label: "BTC", value: 680000, color: "#f7931a", column: 2 },
  { id: "eth", label: "ETH", value: 520000, color: "#627eea", column: 2 },
  { id: "sol", label: "SOL", value: 320000, color: "#14f195", column: 2 },
  { id: "defi_tokens", label: "DeFi代币", value: 380000, color: "#f5a623", column: 2 },
  { id: "stablecoins", label: "稳定币池", value: 250000, color: "#26a17b", column: 2 },
  { id: "altcoins", label: "其他山寨币", value: 220000, color: "#e74c8c", column: 2 },
  { id: "reserve", label: "风控储备金", value: 180000, color: "#888888", column: 2 },
];

const links: SankeyLink[] = [
  // 资金来源 → 策略类型
  { source: "initial", target: "grid", value: 350000 },
  { source: "initial", target: "trend", value: 280000 },
  { source: "initial", target: "defi_lp", value: 250000 },
  { source: "initial", target: "ai_predict", value: 200000 },
  { source: "initial", target: "momentum", value: 180000 },
  { source: "initial", target: "alpha", value: 240000 },

  { source: "reinvest", target: "grid", value: 120000 },
  { source: "reinvest", target: "ai_predict", value: 150000 },
  { source: "reinvest", target: "momentum", value: 100000 },
  { source: "reinvest", target: "trend", value: 100000 },
  { source: "reinvest", target: "alpha", value: 110000 },
  { source: "reinvest", target: "funding_rate", value: 70000 },

  { source: "defi_yield", target: "defi_lp", value: 180000 },
  { source: "defi_yield", target: "funding_rate", value: 100000 },

  { source: "funding_income", target: "grid", value: 50000 },
  { source: "funding_income", target: "funding_rate", value: 50000 },
  { source: "funding_income", target: "defi_lp", value: 20000 },

  // 策略类型 → 目标币种
  { source: "grid", target: "btc", value: 260000 },
  { source: "grid", target: "eth", value: 160000 },
  { source: "grid", target: "sol", value: 100000 },

  { source: "trend", target: "btc", value: 150000 },
  { source: "trend", target: "eth", value: 120000 },
  { source: "trend", target: "sol", value: 60000 },
  { source: "trend", target: "altcoins", value: 50000 },

  { source: "defi_lp", target: "defi_tokens", value: 200000 },
  { source: "defi_lp", target: "stablecoins", value: 150000 },
  { source: "defi_lp", target: "eth", value: 100000 },

  { source: "ai_predict", target: "btc", value: 150000 },
  { source: "ai_predict", target: "sol", value: 100000 },
  { source: "ai_predict", target: "eth", value: 50000 },
  { source: "ai_predict", target: "altcoins", value: 50000 },

  { source: "momentum", target: "sol", value: 60000 },
  { source: "momentum", target: "altcoins", value: 80000 },
  { source: "momentum", target: "btc", value: 80000 },
  { source: "momentum", target: "defi_tokens", value: 60000 },

  { source: "funding_rate", target: "stablecoins", value: 100000 },
  { source: "funding_rate", target: "btc", value: 40000 },
  { source: "funding_rate", target: "eth", value: 40000 },
  { source: "funding_rate", target: "reserve", value: 40000 },

  { source: "alpha", target: "defi_tokens", value: 120000 },
  { source: "alpha", target: "eth", value: 50000 },
  { source: "alpha", target: "altcoins", value: 40000 },
  { source: "alpha", target: "reserve", value: 140000 },
];

// ─── Layout Computation ────────────────────────────────────────────
function computeLayout(
  nodes: SankeyNode[],
  links: SankeyLink[],
  width: number,
  height: number,
) {
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const nodeWidth = 16;
  const nodePadding = 10;
  const columnCount = 3;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const columnSpacing = (innerW - nodeWidth * columnCount) / (columnCount - 1);

  // Group nodes by column
  const columns: SankeyNode[][] = [[], [], []];
  nodes.forEach((n) => columns[n.column].push(n));

  // Compute node positions
  const nodePositions: Record<string, { x: number; y: number; h: number; color: string; label: string; value: number }> = {};

  columns.forEach((col, ci) => {
    const totalValue = col.reduce((s, n) => s + n.value, 0);
    const totalPadding = (col.length - 1) * nodePadding;
    const availableH = innerH - totalPadding;
    let yOffset = padding.top;

    col.forEach((n) => {
      const h = Math.max(8, (n.value / totalValue) * availableH);
      nodePositions[n.id] = {
        x: padding.left + ci * (columnSpacing + nodeWidth),
        y: yOffset,
        h,
        color: n.color,
        label: n.label,
        value: n.value,
      };
      yOffset += h + nodePadding;
    });
  });

  // Compute link paths
  // Track cumulative offsets for source/target
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};
  nodes.forEach((n) => {
    sourceOffsets[n.id] = 0;
    targetOffsets[n.id] = 0;
  });

  const linkPaths = links.map((link) => {
    const src = nodePositions[link.source];
    const tgt = nodePositions[link.target];
    if (!src || !tgt) return null;

    // Calculate proportional thickness
    const srcTotal = links.filter((l) => l.source === link.source).reduce((s, l) => s + l.value, 0);
    const tgtTotal = links.filter((l) => l.target === link.target).reduce((s, l) => s + l.value, 0);
    const thickness = Math.max(2, (link.value / Math.max(srcTotal, tgtTotal)) * Math.min(src.h, tgt.h));

    const sy = src.y + sourceOffsets[link.source];
    const ty = tgt.y + targetOffsets[link.target];
    sourceOffsets[link.source] += thickness;
    targetOffsets[link.target] += thickness;

    const sx = src.x + nodeWidth;
    const tx = tgt.x;
    const midX = (sx + tx) / 2;

    const path = `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty} L${tx},${ty + thickness} C${midX},${ty + thickness} ${midX},${sy + thickness} ${sx},${sy + thickness} Z`;

    return {
      path,
      color: src.color,
      value: link.value,
      sourceLabel: src.label,
      targetLabel: tgt.label,
      opacity: 0.35,
    };
  }).filter(Boolean);

  return { nodePositions, linkPaths };
}

// ─── Format Currency ───────────────────────────────────────────────
function fmtVal(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

// ─── Component ─────────────────────────────────────────────────────
export default function SankeyChart({ width = 820, height = 480 }: SankeyChartProps) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodePositions, linkPaths } = useMemo(
    () => computeLayout(nodes, links, width, height),
    [width, height],
  );

  // Column labels
  const columnLabels = [
    { x: 28, label: "资金来源" },
    { x: width / 2 - 20, label: "策略类型" },
    { x: width - 60, label: "目标资产" },
  ];

  return (
    <div className="relative w-full overflow-x-auto">
      {/* Column Headers */}
      <div className="flex justify-between px-5 mb-1">
        {columnLabels.map((col) => (
          <span key={col.label} className="text-[10px] font-heading font-bold tracking-wider text-muted-foreground uppercase">
            {col.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: 600, maxHeight: 480 }}
      >
        {/* Links */}
        {linkPaths.map((link, i) => link && (
          <motion.path
            key={i}
            d={link.path}
            fill={link.color}
            opacity={
              hoveredLink === i ? 0.7 :
              hoveredNode ? (link.sourceLabel === nodePositions[hoveredNode]?.label || link.targetLabel === nodePositions[hoveredNode]?.label ? 0.6 : 0.08) :
              hoveredLink !== null ? 0.08 :
              link.opacity
            }
            initial={{ opacity: 0 }}
            animate={{
              opacity: hoveredLink === i ? 0.7 :
                hoveredNode ? (
                  Object.entries(nodePositions).find(([, v]) => v.label === link.sourceLabel)?.[0] === hoveredNode ||
                  Object.entries(nodePositions).find(([, v]) => v.label === link.targetLabel)?.[0] === hoveredNode
                    ? 0.6 : 0.08
                ) :
                hoveredLink !== null ? 0.08 :
                link.opacity,
            }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredLink(i)}
            onMouseLeave={() => setHoveredLink(null)}
            className="cursor-pointer"
            style={{ filter: hoveredLink === i ? `drop-shadow(0 0 6px ${link.color})` : "none" }}
          />
        ))}

        {/* Nodes */}
        {Object.entries(nodePositions).map(([id, node]) => (
          <g
            key={id}
            onMouseEnter={() => setHoveredNode(id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
          >
            <motion.rect
              x={node.x}
              y={node.y}
              width={16}
              height={node.h}
              rx={3}
              fill={node.color}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: hoveredNode === id ? 1 : 0.85, scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                transformOrigin: `${node.x + 8}px ${node.y}px`,
                filter: hoveredNode === id ? `drop-shadow(0 0 8px ${node.color})` : `drop-shadow(0 0 3px ${node.color}40)`,
              }}
            />
            {/* Label */}
            <text
              x={nodes.find(n => n.id === id)!.column === 2 ? node.x + 22 : node.x - 6}
              y={node.y + node.h / 2}
              textAnchor={nodes.find(n => n.id === id)!.column === 2 ? "start" : "end"}
              dominantBaseline="middle"
              className="fill-foreground"
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={hoveredNode === id ? 700 : 400}
            >
              {node.label}
            </text>
            {/* Value */}
            <text
              x={nodes.find(n => n.id === id)!.column === 2 ? node.x + 22 : node.x - 6}
              y={node.y + node.h / 2 + 13}
              textAnchor={nodes.find(n => n.id === id)!.column === 2 ? "start" : "end"}
              dominantBaseline="middle"
              fontSize={8}
              fontFamily="'Space Mono', monospace"
              className="fill-muted-foreground"
            >
              {fmtVal(node.value)}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredLink !== null && linkPaths[hoveredLink] && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-3 py-2 shadow-lg pointer-events-none z-10"
          style={{ boxShadow: `0 0 12px ${linkPaths[hoveredLink]!.color}30` }}
        >
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-medium">{linkPaths[hoveredLink]!.sourceLabel}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{linkPaths[hoveredLink]!.targetLabel}</span>
            <span className="font-mono font-bold text-cyber-blue ml-1">{fmtVal(linkPaths[hoveredLink]!.value)}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
        {[
          { color: "#00d4ff", label: "资金来源" },
          { color: "#00ff88", label: "量化策略" },
          { color: "#f5a623", label: "DeFi策略" },
          { color: "#9b59b6", label: "AI策略" },
          { color: "#e74c8c", label: "Alpha策略" },
          { color: "#888888", label: "风控储备" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}60` }} />
            {item.label}
          </span>
        ))}
        <span className="text-[8px] text-muted-foreground/50 ml-auto">悬停查看详细资金流向</span>
      </div>
    </div>
  );
}
