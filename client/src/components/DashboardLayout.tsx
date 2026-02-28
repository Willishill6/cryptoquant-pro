/**
 * DashboardLayout - Cyberpunk Terminal aesthetic
 * Left sidebar navigation + top status bar + main content area
 * Design: Deep dark background, electric blue accents, glowing borders
 * Status bar: ALL data updates in real-time via useSystemStatus hook
 */
import { ReactNode, useState, useEffect, useRef, useMemo, memo } from "react";
import { useAlerts } from "@/contexts/AlertContext";
import { useSystemStatusCtx } from "@/contexts/SystemStatusContext";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Zap, Brain, BarChart3, Shield, Database, Activity, Settings, ChevronLeft, ChevronRight, TrendingUp, Cpu, Menu, X, Bell, BookOpen, Dna, FileText, Wifi, WifiOff, AlertTriangle, XCircle, Search, Command } from "lucide-react";

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard, description: "实时收益监控" },
  { path: "/trading", label: "交易引擎", icon: Zap, description: "全自动交易" },
  { path: "/strategies", label: "策略系统", icon: TrendingUp, description: "策略管理与回测" },
  { path: "/factors", label: "因子系统", icon: BarChart3, description: "阿尔法因子" },
  { path: "/ai", label: "AI系统", icon: Brain, description: "智能预测与学习" },
  { path: "/history-learning", label: "数据学习", icon: BookOpen, description: "5年+历史数据学习" },
  { path: "/ai-evolution", label: "AI进化", icon: Dna, description: "自我进化实验室" },
  { path: "/trades", label: "交易管理", icon: FileText, description: "交易历史与持仓" },
  { path: "/risk", label: "风险管理", icon: Shield, description: "风控与监控" },
  { path: "/data", label: "数据分析", icon: Database, description: "数据与指标" },
  { path: "/monitoring", label: "系统监控", icon: Activity, description: "运维与日志" },
  { path: "/settings", label: "系统设置", icon: Settings, description: "配置管理" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { summary } = useAlerts();
  const sys = useSystemStatusCtx();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}
          ${mobileOpen ? "translate-x-0 w-[260px]" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded-md bg-cyber-blue/20 flex items-center justify-center glow-blue shrink-0">
            <Cpu className="w-5 h-5 text-cyber-blue" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="overflow-hidden"
            >
              <h1 className="font-heading text-sm font-bold text-cyber-blue text-glow-blue tracking-wider">
                CRYPTOQUANT
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest">PRO TERMINAL</p>
            </motion.div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-all duration-200 group relative
                    ${isActive
                      ? "bg-cyber-blue/10 text-cyber-blue glow-blue"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-cyber-blue rounded-r-full"
                    />
                  )}
                  <div className="relative">
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-cyber-blue" : ""}`} />
                    {collapsed && item.path === "/strategies" && summary.unread > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full flex items-center justify-center text-[7px] font-bold leading-none px-0.5 ${summary.critical > 0 ? "bg-cyber-magenta text-white" : "bg-cyber-amber text-background"}`}>
                        {summary.unread > 9 ? "9+" : summary.unread}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isActive ? "text-cyber-blue" : ""}`}>
                          {item.label}
                        </p>
                        {item.path === "/strategies" && summary.unread > 0 && (
                          <span className={`min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold leading-none px-1 ${summary.critical > 0 ? "bg-cyber-magenta text-white animate-pulse" : "bg-cyber-amber text-background"}`}>
                            {summary.unread > 99 ? "99+" : summary.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Quick search hint */}
        {!collapsed && (
          <div className="mx-3 mb-2">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md
                bg-secondary/30 border border-border/40 text-muted-foreground/60
                hover:bg-secondary/50 hover:text-muted-foreground hover:border-border/60
                transition-all duration-200 group"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs flex-1 text-left">快速搜索...</span>
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/40 text-[9px] font-mono border border-border/30
                group-hover:bg-muted/60 transition-colors">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-md
              text-muted-foreground hover:text-foreground hover:bg-secondary
              transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top status bar - ALL REAL-TIME */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Status indicators - ALL REAL-TIME */}
          <div className="flex items-center gap-4 text-xs font-mono flex-1 overflow-x-auto">
            {/* 系统状态 */}
            <StatusPill
              label="系统状态"
              value={sys.systemState}
              color={sys.systemColor}
              pulse
            />

            {/* API延迟 - 每秒更新 */}
            <StatusPill
              label="API延迟"
              value={`${sys.apiLatency}ms`}
              color={sys.apiColor}
              animate
            />

            {/* 活跃策略 */}
            <StatusPill
              label="活跃策略"
              value={`${sys.activeStrategies}`}
              color="amber"
              suffix={`/${sys.totalStrategies}`}
            />

            {/* 今日盈亏 - 每2秒更新 */}
            <StatusPill
              label="今日盈亏"
              value={`${sys.dailyPnl >= 0 ? "+" : ""}$${Math.abs(sys.dailyPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color={sys.pnlColor}
              animate
              suffix={`${sys.dailyPnlPct >= 0 ? "+" : ""}${sys.dailyPnlPct.toFixed(2)}%`}
            />

            {/* AI模型 */}
            <StatusPill
              label="AI模型"
              value={sys.aiModel}
              color="blue"
            />

            {/* WebSocket连接 */}
            <div className="flex items-center gap-1.5 shrink-0 hidden xl:flex">
              {sys.wsConnected ? (
                <Wifi className="w-3 h-3 text-cyber-green" />
              ) : (
                <WifiOff className="w-3 h-3 text-cyber-magenta animate-pulse" />
              )}
              <span className={`text-[10px] ${sys.wsConnected ? "text-cyber-green" : "text-cyber-magenta"}`}>
                {sys.wsConnected ? "WS" : "断连"}
              </span>
            </div>

            {/* 最新交易 */}
            <div className="items-center gap-1.5 shrink-0 hidden 2xl:flex">
              <span className="text-muted-foreground text-[10px]">最新</span>
              <span className={`text-[10px] font-bold ${sys.lastTradeType === "买入" ? "text-cyber-green" : "text-cyber-magenta"}`}>
                {sys.lastTradeType} {sys.lastTradeCoin}
              </span>
            </div>
          </div>

          {/* Alert Counter */}
          <AlertCounter
            unread={summary.unread}
            critical={summary.critical}
            latestMessage={summary.latestMessage}
            onClick={() => setLocation("/strategies?tab=alerts")}
          />

          {/* Time */}
          <LiveClock />
        </header>

        {/* Global Risk Alert Banner */}
        <RiskAlertBanner sys={sys} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto" data-main-scroll>
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StatusPill({
  label,
  value,
  color,
  pulse,
  animate,
  suffix,
}: {
  label: string;
  value: string;
  color: "green" | "blue" | "amber" | "magenta";
  pulse?: boolean;
  animate?: boolean;
  suffix?: string;
}) {
  const colorMap = {
    green: "text-cyber-green bg-cyber-green/10",
    blue: "text-cyber-blue bg-cyber-blue/10",
    amber: "text-cyber-amber bg-cyber-amber/10",
    magenta: "text-cyber-magenta bg-cyber-magenta/10",
  };
  const dotMap = {
    green: "bg-cyber-green",
    blue: "bg-cyber-blue",
    amber: "bg-cyber-amber",
    magenta: "bg-cyber-magenta",
  };

  // Flash effect on value change
  const prevValue = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (animate && prevValue.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value, animate]);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-muted-foreground hidden sm:inline text-[10px]">{label}</span>
      <span
        className={`
          px-2 py-0.5 rounded-sm text-xs font-medium flex items-center gap-1.5
          transition-all duration-200
          ${colorMap[color]}
          ${flash ? "ring-1 ring-current scale-105" : ""}
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotMap[color]} ${pulse ? "animate-pulse" : ""}`} />
        <span className="tabular-nums">{value}</span>
        {suffix && <span className="text-muted-foreground text-[10px]">{suffix}</span>}
      </span>
    </div>
  );
}

function AlertCounter({
  unread,
  critical,
  latestMessage,
  onClick,
}: {
  unread: number;
  critical: number;
  latestMessage: string;
  onClick: () => void;
}) {
  const hasCritical = critical > 0;
  const hasUnread = unread > 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-md
        transition-all duration-300 shrink-0 group
        ${hasCritical
          ? "bg-cyber-magenta/10 border border-cyber-magenta/30 hover:bg-cyber-magenta/20"
          : hasUnread
            ? "bg-cyber-amber/10 border border-cyber-amber/30 hover:bg-cyber-amber/20"
            : "bg-secondary/30 border border-border hover:bg-secondary/50"
        }
      `}
      style={
        hasCritical
          ? { boxShadow: "0 0 12px rgba(231,76,140,0.15)" }
          : undefined
      }
    >
      {/* Bell icon with pulse */}
      <div className="relative">
        <Bell
          className={`w-4 h-4 ${
            hasCritical
              ? "text-cyber-magenta"
              : hasUnread
                ? "text-cyber-amber"
                : "text-muted-foreground"
          } ${hasCritical ? "animate-pulse" : ""}`}
        />
        {/* Badge */}
        {hasUnread && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full
              flex items-center justify-center text-[8px] font-bold leading-none px-0.5
              ${hasCritical
                ? "bg-cyber-magenta text-white"
                : "bg-cyber-amber text-background"
              }`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>

      {/* Text info (hidden on small screens) */}
      <div className="hidden sm:flex flex-col items-start">
        <span
          className={`text-[9px] font-medium ${
            hasCritical
              ? "text-cyber-magenta"
              : hasUnread
                ? "text-cyber-amber"
                : "text-muted-foreground"
          }`}
        >
          {hasCritical
            ? `${critical} 严重告警`
            : hasUnread
              ? `${unread} 未读告警`
              : "无新告警"}
        </span>
        {latestMessage && hasUnread && (
          <span className="text-[8px] text-muted-foreground max-w-[120px] truncate">
            {latestMessage}
          </span>
        )}
      </div>

      {/* Critical indicator bar */}
      {hasCritical && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyber-magenta rounded-full animate-pulse" />
      )}
    </button>
  );
}

function RiskAlertBanner({ sys }: { sys: ReturnType<typeof useSystemStatusCtx> }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Determine active risk alerts
  const alerts: { id: string; level: "critical" | "warning"; message: string; detail: string }[] = [];

  if (sys.apiLatency > 50) {
    alerts.push({
      id: "high-latency",
      level: sys.apiLatency > 100 ? "critical" : "warning",
      message: `API延迟异常: ${sys.apiLatency}ms`,
      detail: sys.apiLatency > 100 ? "延迟超过100ms，交易引擎已自动降级为保守模式" : "延迟偏高，可能影响高频策略执行",
    });
  }
  if (!sys.wsConnected) {
    alerts.push({
      id: "ws-disconnect",
      level: "critical",
      message: "WebSocket连接断开",
      detail: "实时行情推送中断，正在尝试重连...交易信号可能延迟",
    });
  }
  if (sys.dailyPnl < -10000) {
    alerts.push({
      id: "drawdown",
      level: sys.dailyPnl < -25000 ? "critical" : "warning",
      message: `今日回撤警报: $${Math.abs(sys.dailyPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      detail: sys.dailyPnl < -25000 ? "回撤超过$25,000，风控系统已触发自动减仓" : "回撤偏大，建议检查持仓风险",
    });
  }
  if (sys.cpuUsage > 90) {
    alerts.push({
      id: "cpu-high",
      level: "warning",
      message: `CPU负载过高: ${sys.cpuUsage.toFixed(0)}%`,
      detail: "系统资源紧张，AI推理延迟可能增加",
    });
  }

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  if (visibleAlerts.length === 0) return null;

  const hasCritical = visibleAlerts.some(a => a.level === "critical");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`border-b ${
          hasCritical
            ? "bg-cyber-magenta/8 border-cyber-magenta/30"
            : "bg-cyber-amber/8 border-cyber-amber/30"
        }`}
      >
        <div className="px-4 py-2 flex items-center gap-3">
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
            hasCritical ? "text-cyber-magenta animate-pulse" : "text-cyber-amber"
          }`} />
          <div className="flex-1 flex items-center gap-4 overflow-x-auto">
            {visibleAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold ${
                  alert.level === "critical" ? "text-cyber-magenta" : "text-cyber-amber"
                }`}>
                  {alert.level === "critical" ? "• 严重" : "• 警告"}
                </span>
                <span className="text-[10px] text-foreground/80">{alert.message}</span>
                <span className="text-[9px] text-muted-foreground hidden sm:inline">— {alert.detail}</span>
                <button
                  onClick={() => setDismissed(prev => [...prev, alert.id])}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-xs font-mono text-muted-foreground shrink-0 hidden md:block">
      <span className="text-cyber-blue tabular-nums">{time.toLocaleTimeString("zh-CN", { hour12: false })}</span>
      <span className="ml-2">{time.toLocaleDateString("zh-CN")}</span>
    </div>
  );
}
