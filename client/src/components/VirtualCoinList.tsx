/**
 * VirtualCoinList - 虚拟滚动币种列表
 * 使用react-window v2实现441个币种的高效渲染
 * 只渲染可视区域内的行，大幅减少DOM节点
 */
import { type CSSProperties } from "react";
import { List } from "react-window";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  category: string;
}

interface VirtualCoinListProps {
  coins: CoinData[];
  height: number;
  onCoinClick?: (coin: CoinData) => void;
}

interface CoinRowProps {
  coins: CoinData[];
  onCoinClick?: (coin: CoinData) => void;
}

const ROW_HEIGHT = 44;

/** Row renderer for react-window v2 */
function CoinRow({
  index,
  style,
  coins,
  onCoinClick,
}: {
  index: number;
  style: CSSProperties;
  ariaAttributes: Record<string, unknown>;
} & CoinRowProps) {
  const coin = coins[index];
  if (!coin) return null;

  const isPositive = coin.change24h >= 0;

  return (
    <div
      style={style}
      onClick={() => onCoinClick?.(coin)}
      className="flex items-center px-3 gap-3 border-b border-border/20
        hover:bg-muted/30 cursor-pointer transition-colors duration-100 group"
    >
      {/* Rank */}
      <span className="w-7 text-xs text-muted-foreground/50 tabular-nums text-right shrink-0">
        {index + 1}
      </span>

      {/* Symbol + Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground group-hover:text-cyber-blue transition-colors">
            {coin.symbol}
          </span>
          <span className="text-[10px] text-muted-foreground/50 truncate">{coin.name}</span>
        </div>
      </div>

      {/* Price */}
      <span className="text-sm tabular-nums text-foreground w-24 text-right shrink-0">
        ${coin.price < 1 ? coin.price.toFixed(6) : coin.price < 100 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>

      {/* 24h Change */}
      <div className={`flex items-center gap-0.5 w-20 justify-end shrink-0 ${isPositive ? "text-cyber-green" : "text-cyber-magenta"}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="text-sm tabular-nums font-medium">
          {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
        </span>
      </div>

      {/* Volume */}
      <span className="text-xs tabular-nums text-muted-foreground w-20 text-right shrink-0 hidden lg:block">
        {coin.volume24h >= 1e9
          ? `$${(coin.volume24h / 1e9).toFixed(1)}B`
          : coin.volume24h >= 1e6
          ? `$${(coin.volume24h / 1e6).toFixed(1)}M`
          : `$${(coin.volume24h / 1e3).toFixed(0)}K`}
      </span>

      {/* Category badge */}
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground/60 shrink-0 hidden xl:block">
        {coin.category}
      </span>
    </div>
  );
}

export default function VirtualCoinList({ coins, height, onCoinClick }: VirtualCoinListProps) {
  return (
    <List<CoinRowProps>
      rowComponent={CoinRow}
      rowCount={coins.length}
      rowHeight={ROW_HEIGHT}
      rowProps={{ coins, onCoinClick }}
      overscanCount={10}
      style={{ height, width: "100%" }}
    />
  );
}
