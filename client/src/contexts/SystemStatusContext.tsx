/**
 * SystemStatusContext - 全局系统状态数据共享
 * 将 useSystemStatus 的实时数据通过 Context 提供给全站所有页面
 * 所有页面通过 useSystemStatusCtx() 获取统一的实时数据
 */
import { createContext, useContext, type ReactNode } from "react";
import { useSystemStatus, type SystemStatus } from "@/hooks/useSystemStatus";

const SystemStatusContext = createContext<SystemStatus | null>(null);

export function SystemStatusProvider({ children }: { children: ReactNode }) {
  const status = useSystemStatus();
  return (
    <SystemStatusContext.Provider value={status}>
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatusCtx(): SystemStatus {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) throw new Error("useSystemStatusCtx must be used within SystemStatusProvider");
  return ctx;
}
