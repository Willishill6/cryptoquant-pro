/**
 * MarketStatusBadge - Shows real-time market data connection status
 * Displays connection state, number of live tickers, and data freshness
 */
import { memo } from "react";
import { useBinanceMarket } from "@/hooks/useBinanceMarket";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

const statusConfig = {
  connected: {
    icon: Wifi,
    label: "实时行情",
    className: "text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  connecting: {
    icon: Loader2,
    label: "连接中",
    className: "text-yellow-400",
    dotClass: "bg-yellow-400",
  },
  disconnected: {
    icon: WifiOff,
    label: "已断开",
    className: "text-red-400",
    dotClass: "bg-red-400",
  },
  error: {
    icon: WifiOff,
    label: "连接错误",
    className: "text-red-400",
    dotClass: "bg-red-400",
  },
};

function MarketStatusBadgeInner() {
  const { status, tickerCount } = useBinanceMarket();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.className}`}>
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`}
        />
      </span>
      <Icon
        size={12}
        className={status === "connecting" ? "animate-spin" : ""}
      />
      <span>{config.label}</span>
      {status === "connected" && tickerCount > 0 && (
        <span className="text-gray-500 ml-0.5">
          {tickerCount}币种
        </span>
      )}
    </div>
  );
}

export const MarketStatusBadge = memo(MarketStatusBadgeInner);
