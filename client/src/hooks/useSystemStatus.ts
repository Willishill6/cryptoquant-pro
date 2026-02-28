/**
 * useSystemStatus - 系统状态栏实时数据 Hook
 * wsConnected 与 useBinanceMarket 的真实连接状态同步
 */
import { useState, useEffect } from "react";
import { useBinanceMarket } from "./useBinanceMarket";

export interface SystemStatus {
  // 系统运行状态
  systemState: "运行中" | "维护中" | "降级运行";
  systemColor: "green" | "amber" | "magenta";
  // API延迟（ms）
  apiLatency: number;
  apiColor: "green" | "blue" | "amber" | "magenta";
  // 活跃策略数
  activeStrategies: number;
  totalStrategies: number;
  // 今日盈亏
  dailyPnl: number;
  dailyPnlPct: number;
  pnlColor: "green" | "magenta";
  // AI模型
  aiModel: string;
  aiModelVersion: string;
  aiInferenceMs: number;
  // 网络状态
  wsConnected: boolean;
  wsReconnects: number;
  // 数据流
  ticksPerSecond: number;
  ordersToday: number;
  // CPU/内存
  cpuUsage: number;
  memUsage: number;
  // 最新交易
  lastTradeTime: string;
  lastTradeCoin: string;
  lastTradeType: "买入" | "卖出";
}

export function useSystemStatus(): SystemStatus {
  const { status: wsStatus, tickerCount } = useBinanceMarket();

  const [reconnects, setReconnects] = useState(0);
  const [prevStatus, setPrevStatus] = useState(wsStatus);

  // 统计重连次数
  useEffect(() => {
    if (prevStatus === "connected" && wsStatus === "disconnected") {
      setReconnects(n => n + 1);
    }
    setPrevStatus(wsStatus);
  }, [wsStatus, prevStatus]);

  const wsConnected = wsStatus === "connected";

  return {
    systemState: "运行中",
    systemColor: "green",
    apiLatency: 0,
    apiColor: "green",
    activeStrategies: 0,
    totalStrategies: 0,
    dailyPnl: 0,
    dailyPnlPct: 0,
    pnlColor: "green",
    aiModel: "DeepSeek-V3",
    aiModelVersion: "v4.2",
    aiInferenceMs: 0,
    wsConnected,
    wsReconnects: reconnects,
    ticksPerSecond: tickerCount > 0 ? tickerCount : 0,
    ordersToday: 0,
    cpuUsage: 0,
    memUsage: 0,
    lastTradeTime: "--:--:--",
    lastTradeCoin: "--",
    lastTradeType: "买入",
  };
}
