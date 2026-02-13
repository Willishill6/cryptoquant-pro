/**
 * useSystemStatus - 系统状态栏实时数据 Hook
 * 模拟真实量化交易系统的实时数据推送
 * 每秒更新API延迟、每2秒更新盈亏、每5秒更新策略/模型状态
 */
import { useState, useEffect, useRef } from "react";

// 伪随机数生成器（确保数据连续性）
function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

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

const aiModels = ["DeepSeek-V3", "DeepSeek-V3", "DeepSeek-V3", "TFT", "TFT", "LSTM-Attention", "LSTM-Attention", "GPT-4o", "GPT-4o", "XGBoost-Alpha", "PatchTST", "Claude 3.5"];
const tradeCoins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOGE", "DOT", "LINK", "UNI", "MATIC", "ATOM", "APT", "ARB"];

export function useSystemStatus(): SystemStatus {
  const tickRef = useRef(0);
  const basePnl = useRef(12845.30 + (Math.random() - 0.5) * 2000);
  const ordersRef = useRef(2458 + Math.floor(Math.random() * 50));

  const [status, setStatus] = useState<SystemStatus>({
    systemState: "运行中",
    systemColor: "green",
    apiLatency: 12,
    apiColor: "green",
    activeStrategies: 8,
    totalStrategies: 11,
    dailyPnl: basePnl.current,
    dailyPnlPct: 2.34,
    pnlColor: "green",
    aiModel: "DeepSeek-V3",
    aiModelVersion: "v4.2",
    aiInferenceMs: 180,
    wsConnected: true,
    wsReconnects: 0,
    ticksPerSecond: 1250,
    ordersToday: ordersRef.current,
    cpuUsage: 42,
    memUsage: 68,
    lastTradeTime: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    lastTradeCoin: "BTC",
    lastTradeType: "买入",
  });

  // 高频更新：API延迟 + ticks（每秒）
  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;

      setStatus(prev => {
        // API延迟波动
        let newLatency = jitter(prev.apiLatency, 3);
        newLatency = Math.max(3, Math.min(45, newLatency));
        // 偶尔出现延迟尖峰
        if (Math.random() < 0.02) newLatency = jitter(35, 10);
        newLatency = Math.round(newLatency);

        const apiColor: SystemStatus["apiColor"] =
          newLatency <= 15 ? "green" : newLatency <= 25 ? "blue" : newLatency <= 35 ? "amber" : "magenta";

        // Ticks per second 波动
        const newTicks = Math.round(jitter(1250, 200));

        // CPU/内存微波动
        const newCpu = Math.round(Math.max(20, Math.min(85, jitter(prev.cpuUsage, 3))));
        const newMem = Math.round(Math.max(50, Math.min(90, jitter(prev.memUsage, 1.5))));

        // WS偶尔断连重连
        let wsConnected = prev.wsConnected;
        let wsReconnects = prev.wsReconnects;
        if (Math.random() < 0.003) {
          wsConnected = false;
          wsReconnects += 1;
        } else if (!prev.wsConnected) {
          wsConnected = true; // 自动重连
        }

        // AI推理延迟波动
        const newInference = Math.round(jitter(180, 20));

        return {
          ...prev,
          apiLatency: newLatency,
          apiColor,
          ticksPerSecond: newTicks,
          cpuUsage: newCpu,
          memUsage: newMem,
          wsConnected,
          wsReconnects,
          aiInferenceMs: Math.max(80, Math.min(300, newInference)),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 中频更新：盈亏 + 订单数（每2秒）
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(prev => {
        // 盈亏随机游走
        const pnlDelta = (Math.random() - 0.45) * 150; // 略微偏多
        basePnl.current += pnlDelta;
        const newPnl = basePnl.current;
        const newPnlPct = (newPnl / 2458932.50) * 100;
        const pnlColor: SystemStatus["pnlColor"] = newPnl >= 0 ? "green" : "magenta";

        // 订单数递增
        if (Math.random() < 0.6) {
          ordersRef.current += Math.floor(Math.random() * 3) + 1;
        }

        // 最新交易
        const coin = tradeCoins[Math.floor(Math.random() * tradeCoins.length)];
        const type = Math.random() > 0.45 ? "买入" as const : "卖出" as const;

        return {
          ...prev,
          dailyPnl: newPnl,
          dailyPnlPct: newPnlPct,
          pnlColor,
          ordersToday: ordersRef.current,
          lastTradeTime: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          lastTradeCoin: coin,
          lastTradeType: type,
        };
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // 低频更新：策略/模型/系统状态（每10秒）
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(prev => {
        // 活跃策略偶尔变化
        let newActive = prev.activeStrategies;
        if (Math.random() < 0.1) {
          newActive = Math.max(6, Math.min(11, newActive + (Math.random() > 0.5 ? 1 : -1)));
        }

        // AI模型偶尔切换
        const newModel = Math.random() < 0.05
          ? aiModels[Math.floor(Math.random() * aiModels.length)]
          : prev.aiModel;

        // 系统状态极少变化
        let systemState = prev.systemState;
        let systemColor = prev.systemColor;
        if (Math.random() < 0.005) {
          systemState = "降级运行";
          systemColor = "amber";
        } else if (prev.systemState !== "运行中" && Math.random() < 0.3) {
          systemState = "运行中";
          systemColor = "green";
        }

        return {
          ...prev,
          activeStrategies: newActive,
          aiModel: newModel,
          systemState,
          systemColor: systemColor as SystemStatus["systemColor"],
        };
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return status;
}
