/**
 * AlertStream - Real-time strategy alert feed with notification popups
 * Now reads from global AlertContext (single source of truth).
 * Design: Cyberpunk terminal dark theme with severity-based glow
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, TrendingDown, Brain, Zap, Bell, BellOff, X, ChevronDown, ChevronUp, Clock, Activity, Ban, Flame, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAlerts } from "@/contexts/AlertContext";

// ─── Types ─────────────────────────────────────────────────────────
type AlertSeverity = "critical" | "warning" | "info" | "success";
type AlertCategory = "stop_loss" | "drawdown" | "ai_signal" | "position" | "system" | "risk" | "defi";

// ─── Helpers ───────────────────────────────────────────────────────
const severityConfig: Record<AlertSeverity, { color: string; bg: string; border: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { color: "text-cyber-magenta", bg: "bg-cyber-magenta/10", border: "border-cyber-magenta/40", icon: ShieldAlert, label: "严重" },
  warning: { color: "text-cyber-amber", bg: "bg-cyber-amber/10", border: "border-cyber-amber/40", icon: AlertTriangle, label: "警告" },
  info: { color: "text-cyber-blue", bg: "bg-cyber-blue/10", border: "border-cyber-blue/40", icon: Activity, label: "信息" },
  success: { color: "text-cyber-green", bg: "bg-cyber-green/10", border: "border-cyber-green/40", icon: Zap, label: "成功" },
};

const categoryConfig: Record<AlertCategory, { icon: typeof AlertTriangle; label: string }> = {
  stop_loss: { icon: Ban, label: "止损" },
  drawdown: { icon: TrendingDown, label: "回撤" },
  ai_signal: { icon: Brain, label: "AI信号" },
  position: { icon: Flame, label: "仓位" },
  system: { icon: Activity, label: "系统" },
  risk: { icon: ShieldAlert, label: "风控" },
  defi: { icon: Zap, label: "DeFi" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "刚刚";
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
}

// ─── Component ─────────────────────────────────────────────────────
export default function AlertStream() {
  // Read from global context (single source of truth)
  const {
    alerts,
    summary,
    isLive,
    setIsLive,
    acknowledgeOne,
    acknowledgeAll,
    showPopup,
    popupAlert,
    dismissPopup,
  } = useAlerts();

  const [expanded, setExpanded] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<AlertCategory | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top on new alert
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    return true;
  });

  // Force re-render for timeAgo
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* ═══ Popup Notification (top-right overlay) ═══ */}
      <AnimatePresence>
        {showPopup && popupAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
          >
            <Card
              className={`${severityConfig[popupAlert.severity].bg} border ${severityConfig[popupAlert.severity].border} shadow-lg cursor-pointer`}
              style={{ boxShadow: `0 0 20px ${popupAlert.severity === "critical" ? "rgba(231,76,140,0.3)" : "rgba(245,166,35,0.2)"}` }}
              onClick={dismissPopup}
            >
              <CardContent className="pt-3 pb-2">
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${severityConfig[popupAlert.severity].bg}`}>
                    {(() => { const Icon = severityConfig[popupAlert.severity].icon; return <Icon className={`w-4 h-4 ${severityConfig[popupAlert.severity].color}`} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[8px] py-0 ${severityConfig[popupAlert.severity].border} ${severityConfig[popupAlert.severity].color}`}>
                        {severityConfig[popupAlert.severity].label}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-auto" onClick={(e) => { e.stopPropagation(); dismissPopup(); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <h4 className={`text-xs font-bold mt-1 ${severityConfig[popupAlert.severity].color}`}>{popupAlert.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{popupAlert.message}</p>
                    {popupAlert.value && (
                      <span className={`text-[10px] font-mono font-bold mt-1 inline-block ${severityConfig[popupAlert.severity].color}`}>{popupAlert.value}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Alert Stream Panel ═══ */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
              <Bell className={`w-4 h-4 ${summary.critical > 0 ? "text-cyber-magenta animate-pulse" : "text-cyber-amber"}`} />
              实时告警流
              {summary.unread > 0 && (
                <Badge className="bg-cyber-magenta/20 text-cyber-magenta border-cyber-magenta/30 text-[9px] py-0 px-1.5">
                  {summary.unread} 未读
                </Badge>
              )}
              {summary.critical > 0 && (
                <Badge className="bg-cyber-magenta/30 text-cyber-magenta border-cyber-magenta/50 text-[9px] py-0 px-1.5 animate-pulse">
                  {summary.critical} 严重
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Severity Filter */}
              <div className="flex gap-0.5">
                {(["all", "critical", "warning", "info", "success"] as const).map((sev) => (
                  <Button
                    key={sev}
                    variant="outline"
                    size="sm"
                    className={`h-5 text-[8px] px-1.5 ${filterSeverity === sev ? "bg-cyber-blue/15 border-cyber-blue/40 text-cyber-blue" : ""}`}
                    onClick={() => setFilterSeverity(sev)}
                  >
                    {sev === "all" ? "全部" : severityConfig[sev].label}
                  </Button>
                ))}
              </div>
              {/* Category Filter */}
              <div className="flex gap-0.5">
                {(["all", "stop_loss", "drawdown", "ai_signal", "risk", "defi"] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    className={`h-5 text-[8px] px-1.5 ${filterCategory === cat ? "bg-cyber-blue/15 border-cyber-blue/40 text-cyber-blue" : ""}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat === "all" ? "全部" : categoryConfig[cat].label}
                  </Button>
                ))}
              </div>
              {/* Controls */}
              <div className="flex items-center gap-1.5 ml-1">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-muted-foreground">实时</span>
                  <Switch checked={isLive} onCheckedChange={setIsLive} className="h-4 w-7" />
                  {isLive && <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />}
                </div>
                <Button variant="outline" size="sm" className="h-5 text-[8px] px-1.5" onClick={acknowledgeAll}>
                  <Eye className="w-3 h-3 mr-0.5" />全部已读
                </Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {/* Alert Stats Bar */}
                <div className="flex items-center gap-3 mb-2 py-1.5 px-2 rounded bg-secondary/30 text-[9px]">
                  <span className="text-muted-foreground">今日告警: <span className="font-mono text-foreground">{alerts.length}</span></span>
                  <span className="text-cyber-magenta">严重: <span className="font-mono">{alerts.filter(a => a.severity === "critical").length}</span></span>
                  <span className="text-cyber-amber">警告: <span className="font-mono">{alerts.filter(a => a.severity === "warning").length}</span></span>
                  <span className="text-cyber-blue">信息: <span className="font-mono">{alerts.filter(a => a.severity === "info").length}</span></span>
                  <span className="text-cyber-green">成功: <span className="font-mono">{alerts.filter(a => a.severity === "success").length}</span></span>
                  <span className="text-muted-foreground ml-auto">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    最新: {alerts.length > 0 ? timeAgo(alerts[0].timestamp) : "--"}
                  </span>
                </div>

                {/* Alert List */}
                <div ref={scrollRef} className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {filteredAlerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-[11px]">
                        <BellOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        暂无匹配的告警
                      </div>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const sev = severityConfig[alert.severity];
                        const cat = categoryConfig[alert.category];
                        const SevIcon = sev.icon;
                        const CatIcon = cat.icon;

                        return (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`rounded-md border p-2.5 transition-all ${
                              !alert.acknowledged
                                ? `${sev.bg} ${sev.border} ${alert.severity === "critical" ? "shadow-sm" : ""}`
                                : "bg-secondary/10 border-border/30 opacity-60"
                            }`}
                            style={
                              !alert.acknowledged && alert.severity === "critical"
                                ? { boxShadow: "0 0 8px rgba(231,76,140,0.15)" }
                                : undefined
                            }
                          >
                            <div className="flex items-start gap-2">
                              {/* Icon */}
                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${sev.bg}`}>
                                <SevIcon className={`w-3.5 h-3.5 ${sev.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className={`text-[7px] py-0 px-1 ${sev.border} ${sev.color}`}>
                                    {sev.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-[7px] py-0 px-1 border-border text-muted-foreground">
                                    <CatIcon className="w-2.5 h-2.5 mr-0.5" />{cat.label}
                                  </Badge>
                                  {alert.strategy && (
                                    <span className="text-[8px] text-cyber-blue">{alert.strategy}</span>
                                  )}
                                  {alert.coin && (
                                    <Badge variant="outline" className="text-[7px] py-0 px-1 border-cyber-amber/30 text-cyber-amber">
                                      {alert.coin}
                                    </Badge>
                                  )}
                                  <span className="text-[8px] text-muted-foreground ml-auto shrink-0">
                                    {timeAgo(alert.timestamp)}
                                  </span>
                                </div>
                                <h4 className={`text-[11px] font-medium mt-0.5 ${!alert.acknowledged ? sev.color : "text-muted-foreground"}`}>
                                  {alert.title}
                                  {alert.value && (
                                    <span className={`font-mono font-bold ml-2 ${!alert.acknowledged ? sev.color : ""}`}>
                                      {alert.value}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                              </div>

                              {/* Actions */}
                              {!alert.acknowledged && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 shrink-0 opacity-50 hover:opacity-100"
                                  onClick={() => acknowledgeOne(alert.id)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  );
}
