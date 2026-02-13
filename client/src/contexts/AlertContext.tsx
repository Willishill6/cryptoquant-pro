/**
 * AlertContext - Global alert state management
 * Single source of truth for all alert state across the app.
 * Both the top bar counter and AlertStream component read from this context.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

type AlertSeverity = "critical" | "warning" | "info" | "success";
type AlertCategory = "stop_loss" | "drawdown" | "ai_signal" | "position" | "system" | "risk" | "defi";

export interface AlertItem {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  strategy?: string;
  coin?: string;
  value?: string;
  acknowledged: boolean;
}

interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
  success: number;
  latestMessage: string;
  latestSeverity: AlertSeverity;
  latestTime: Date | null;
}

interface AlertContextType {
  alerts: AlertItem[];
  summary: AlertSummary;
  isLive: boolean;
  setIsLive: (v: boolean) => void;
  acknowledgeOne: (id: string) => void;
  acknowledgeAll: () => void;
  showPopup: boolean;
  popupAlert: AlertItem | null;
  dismissPopup: () => void;
}

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  summary: {
    total: 0, unread: 0, critical: 0, warning: 0, info: 0, success: 0,
    latestMessage: "", latestSeverity: "info", latestTime: null,
  },
  isLive: true,
  setIsLive: () => {},
  acknowledgeOne: () => {},
  acknowledgeAll: () => {},
  showPopup: false,
  popupAlert: null,
  dismissPopup: () => {},
});

// ─── Alert Templates ───────────────────────────────────────────────
const alertTemplates: Omit<AlertItem, "id" | "timestamp" | "acknowledged">[] = [
  { severity: "critical", category: "stop_loss", title: "止损触发", message: "BTC网格交易策略触发硬止损，已平仓全部BTC多头仓位", strategy: "BTC网格交易策略", coin: "BTC", value: "-$2,340" },
  { severity: "critical", category: "stop_loss", title: "止损触发", message: "ETH趋势跟随策略触发追踪止损，ETH空头仓位已平仓", strategy: "ETH趋势跟随策略", coin: "ETH", value: "-$1,120" },
  { severity: "critical", category: "stop_loss", title: "紧急止损", message: "全币种动量策略SOL仓位触发最大亏损止损线", strategy: "全币种动量策略", coin: "SOL", value: "-$3,560" },
  { severity: "critical", category: "drawdown", title: "异常回撤", message: "全币种动量策略24h回撤达-8.5%，超过阈值-7%，已自动降低仓位50%", strategy: "全币种动量策略", value: "-8.5%" },
  { severity: "critical", category: "drawdown", title: "最大回撤预警", message: "AI深度学习预测策略回撤接近历史最大值-12.3%，当前-11.8%", strategy: "AI深度学习预测", value: "-11.8%" },
  { severity: "warning", category: "ai_signal", title: "AI信号翻转", message: "DeepSeek-V3模型对BTC发出看空信号，置信度82%，建议减仓", strategy: "BTC网格交易策略", coin: "BTC", value: "看空 82%" },
  { severity: "warning", category: "ai_signal", title: "AI模型分歧", message: "DeepSeek-V3看多ETH(75%)，但TFT看空(68%)，信号冲突", coin: "ETH", value: "模型分歧" },
  { severity: "warning", category: "ai_signal", title: "AI预测偏差", message: "Claude 3.5对SOL的24h预测误差达15.2%，超过正常范围", coin: "SOL", value: "误差 15.2%" },
  { severity: "warning", category: "ai_signal", title: "因子信号变化", message: "链上大户因子检测到BTC巨鲸异常转出，可能引发抛压", coin: "BTC", value: "巨鲸异动" },
  { severity: "warning", category: "position", title: "仓位超限", message: "BTC总仓位占比达35%，超过单币种上限30%，请及时调整", coin: "BTC", value: "35% > 30%" },
  { severity: "warning", category: "position", title: "杠杆预警", message: "ETH趋势跟随策略实际杠杆达4.2x，接近上限5x", strategy: "ETH趋势跟随策略", coin: "ETH", value: "4.2x" },
  { severity: "warning", category: "risk", title: "VaR突破", message: "组合24h VaR达$45,200，超过预设阈值$40,000", value: "$45,200" },
  { severity: "warning", category: "risk", title: "相关性异常", message: "BTC-ETH相关性突升至0.95，分散化效果降低，建议调整仓位", value: "相关性 0.95" },
  { severity: "warning", category: "defi", title: "DeFi协议异常", message: "Uniswap V3 ETH/USDC池滑点异常增大，流动性提供策略暂停", strategy: "DeFi流动性挖矿策略", value: "滑点 2.3%" },
  { severity: "warning", category: "defi", title: "APY大幅下降", message: "Aave V3 USDC存款APY从5.2%降至1.8%，收益聚合器正在重新分配", strategy: "DeFi流动性挖矿策略", value: "APY -65%" },
  { severity: "info", category: "ai_signal", title: "AI模型更新", message: "DeepSeek-V3完成第2,148代自我进化，预测准确率提升至94.5%", value: "+0.3%" },
  { severity: "info", category: "system", title: "策略参数优化", message: "贝叶斯优化器为BTC网格策略找到更优参数组合，Sharpe提升0.12", strategy: "BTC网格交易策略", value: "+0.12 Sharpe" },
  { severity: "info", category: "system", title: "新策略上线", message: "AI自动生成的SOL-AVAX配对策略通过回测验证，已加入策略池", value: "新策略" },
  { severity: "success", category: "system", title: "止盈执行", message: "多因子Alpha策略NEAR仓位达到目标收益+15%，已自动止盈", strategy: "多因子Alpha策略", coin: "NEAR", value: "+$4,230" },
  { severity: "success", category: "ai_signal", title: "AI预测命中", message: "DeepSeek-V3准确预测BTC突破$100K关口，趋势策略获利$8,500", coin: "BTC", value: "+$8,500" },
  { severity: "success", category: "defi", title: "DeFi收益到账", message: "Curve流动性挖矿奖励已自动复投，本周DeFi总收益$2,340", value: "+$2,340" },
];

function computeSummary(alerts: AlertItem[]): AlertSummary {
  const unread = alerts.filter(a => !a.acknowledged);
  return {
    total: alerts.length,
    unread: unread.length,
    critical: unread.filter(a => a.severity === "critical").length,
    warning: unread.filter(a => a.severity === "warning").length,
    info: unread.filter(a => a.severity === "info").length,
    success: unread.filter(a => a.severity === "success").length,
    latestMessage: alerts.length > 0 ? alerts[0].message : "",
    latestSeverity: alerts.length > 0 ? alerts[0].severity : "info",
    latestTime: alerts.length > 0 ? alerts[0].timestamp : null,
  };
}

export function AlertProvider({ children }: { children: ReactNode }) {
  // Single source of truth for all alerts
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const initial: AlertItem[] = [];
    const now = Date.now();
    for (let i = 0; i < 8; i++) {
      const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      initial.push({
        ...template,
        id: `init-${i}`,
        timestamp: new Date(now - (8 - i) * 45000 - Math.random() * 30000),
        acknowledged: i < 4, // first 4 are already read
      });
    }
    return initial.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  const [isLive, setIsLive] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAlert, setPopupAlert] = useState<AlertItem | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const summary = computeSummary(alerts);

  // Simulate real-time alerts (single timer for the whole app)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const newAlert: AlertItem = {
        ...template,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        acknowledged: false,
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 50));

      // Show popup for critical/warning
      if (newAlert.severity === "critical" || newAlert.severity === "warning") {
        setPopupAlert(newAlert);
        setShowPopup(true);
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        popupTimerRef.current = setTimeout(() => setShowPopup(false), 5000);
      }
    }, 8000 + Math.random() * 12000);

    return () => clearInterval(interval);
  }, [isLive]);

  const acknowledgeOne = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  }, []);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    setPopupAlert(null);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        summary,
        isLive,
        setIsLive,
        acknowledgeOne,
        acknowledgeAll,
        showPopup,
        popupAlert,
        dismissPopup,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertContext);
}
