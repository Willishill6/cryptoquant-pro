/**
 * Skeleton - 骨架屏加载组件
 * 为数据加载提供视觉反馈，避免空白闪烁
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-muted/40 ${className}`} style={style} />
  );
}

/** 卡片骨架屏 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** 表格行骨架屏 */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-20" : i === 1 ? "w-32" : "w-16"}`} />
      ))}
    </div>
  );
}

/** 图表骨架屏 */
export function ChartSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={`rounded-lg border border-border/50 bg-card p-4 ${height} flex flex-col justify-end`}>
      <div className="flex items-end gap-1 h-full">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** 页面级骨架屏 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      {/* Chart */}
      <ChartSkeleton height="h-64" />
      {/* Table */}
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-5 w-32" />
        </div>
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </div>
    </div>
  );
}
