/**
 * Sparkline - Lightweight SVG mini chart for inline PnL visualization
 * Design: Cyberpunk terminal aesthetic with gradient fill and glow
 */
import { useMemo } from "react";

interface SparklineProps {
  /** Array of numeric values representing the PnL over time */
  data: number[];
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Stroke color (auto-detected from trend if not provided) */
  color?: string;
  /** Whether to show the gradient fill area */
  showArea?: boolean;
  /** Whether to show the endpoint dot */
  showDot?: boolean;
  /** Stroke width */
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  width = 120,
  height = 32,
  color,
  showArea = true,
  showDot = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  const { path, areaPath, points, lineColor } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: "", areaPath: "", points: [], lineColor: "#666", isPositive: true };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const dotRadius = 2.5;
    const innerW = width - padding * 2 - dotRadius;
    const innerH = height - padding * 2;

    const pts = data.map((v, i) => ({
      x: padding + (i / (data.length - 1)) * innerW,
      y: padding + innerH - ((v - min) / range) * innerH,
    }));

    // Determine trend: compare last value to first
    const positive = data[data.length - 1] >= data[0];
    const autoColor = color || (positive ? "#00ff88" : "#e74c8c");

    // Build SVG path using smooth curves
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      d += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }

    // Area path (closed to bottom)
    const areaD = d + ` L${pts[pts.length - 1].x},${height - padding} L${pts[0].x},${height - padding} Z`;

    return {
      path: d,
      areaPath: areaD,
      points: pts,
      lineColor: autoColor,
      isPositive: positive,
    };
  }, [data, width, height, color, strokeWidth]);

  if (!data || data.length < 2) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center">
        <span className="text-[8px] text-muted-foreground">--</span>
      </div>
    );
  }

  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;
  const glowId = `spark-glow-${Math.random().toString(36).slice(2, 8)}`;
  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        {/* Gradient fill */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
        {/* Glow filter */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />

      {/* Endpoint dot */}
      {showDot && lastPoint && (
        <>
          {/* Outer glow ring */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill="none"
            stroke={lineColor}
            strokeWidth={0.5}
            opacity={0.4}
          />
          {/* Inner dot */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={2}
            fill={lineColor}
            filter={`url(#${glowId})`}
          />
        </>
      )}
    </svg>
  );
}
