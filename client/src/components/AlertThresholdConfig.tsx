/**
 * AlertThresholdConfig - Alert threshold configuration panel
 * Allows users to customize stop-loss %, drawdown warning, position limits,
 * VaR thresholds, AI signal confidence, and DeFi protocol parameters.
 * Design: Cyberpunk terminal dark theme with interactive sliders and visual feedback.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, TrendingDown, Ban, Flame, Brain, Zap, RotateCcw, Save, ChevronDown, Gauge, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────
interface ThresholdItem {
  id: string;
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
}

interface ThresholdGroup {
  id: string;
  title: string;
  icon: typeof ShieldAlert;
  iconColor: string;
  description: string;
  items: ThresholdItem[];
}

// ─── Default Threshold Data ────────────────────────────────────────
const defaultGroups: ThresholdGroup[] = [
  {
    id: "stop_loss",
    title: "止损告警",
    icon: Ban,
    iconColor: "text-cyber-magenta",
    description: "当策略触发止损条件时发出告警",
    items: [
      { id: "sl_single", label: "单笔止损阈值", description: "单笔交易亏损达到此百分比时触发严重告警", value: 5, defaultValue: 5, min: 1, max: 20, step: 0.5, unit: "%", severity: "critical", enabled: true },
      { id: "sl_daily", label: "日止损上限", description: "当日累计亏损达到此百分比时触发严重告警并暂停交易", value: 8, defaultValue: 8, min: 2, max: 30, step: 0.5, unit: "%", severity: "critical", enabled: true },
      { id: "sl_weekly", label: "周止损上限", description: "本周累计亏损达到此百分比时触发警告", value: 12, defaultValue: 12, min: 5, max: 40, step: 1, unit: "%", severity: "warning", enabled: true },
      { id: "sl_trailing", label: "追踪止损距离", description: "追踪止损与最高点的距离百分比", value: 3, defaultValue: 3, min: 0.5, max: 15, step: 0.5, unit: "%", severity: "warning", enabled: true },
      { id: "sl_amount", label: "单笔最大亏损金额", description: "单笔交易亏损金额上限", value: 5000, defaultValue: 5000, min: 500, max: 50000, step: 500, unit: "$", severity: "critical", enabled: true },
    ],
  },
  {
    id: "drawdown",
    title: "回撤预警",
    icon: TrendingDown,
    iconColor: "text-cyber-amber",
    description: "当组合或策略回撤超过阈值时发出预警",
    items: [
      { id: "dd_portfolio", label: "组合最大回撤", description: "总组合从峰值回撤达到此百分比时触发严重告警", value: 15, defaultValue: 15, min: 5, max: 50, step: 1, unit: "%", severity: "critical", enabled: true },
      { id: "dd_strategy", label: "单策略最大回撤", description: "单个策略回撤达到此百分比时触发警告", value: 10, defaultValue: 10, min: 3, max: 30, step: 1, unit: "%", severity: "warning", enabled: true },
      { id: "dd_24h", label: "24h回撤预警线", description: "24小时内回撤达到此百分比时触发警告", value: 7, defaultValue: 7, min: 2, max: 20, step: 0.5, unit: "%", severity: "warning", enabled: true },
      { id: "dd_speed", label: "快速回撤检测", description: "1小时内回撤超过此百分比视为异常快速回撤", value: 4, defaultValue: 4, min: 1, max: 15, step: 0.5, unit: "%", severity: "critical", enabled: true },
      { id: "dd_consecutive", label: "连续亏损天数", description: "连续亏损达到此天数时触发警告", value: 5, defaultValue: 5, min: 2, max: 15, step: 1, unit: "天", severity: "warning", enabled: true },
    ],
  },
  {
    id: "position",
    title: "仓位风控",
    icon: Flame,
    iconColor: "text-orange-400",
    description: "仓位集中度、杠杆和资金分配相关告警",
    items: [
      { id: "pos_single_coin", label: "单币种仓位上限", description: "单个币种占总仓位的最大百分比", value: 30, defaultValue: 30, min: 10, max: 80, step: 5, unit: "%", severity: "warning", enabled: true },
      { id: "pos_single_strategy", label: "单策略资金上限", description: "单个策略占总资金的最大百分比", value: 25, defaultValue: 25, min: 10, max: 60, step: 5, unit: "%", severity: "warning", enabled: true },
      { id: "pos_leverage_max", label: "最大杠杆倍数", description: "任何策略的最大允许杠杆", value: 5, defaultValue: 5, min: 1, max: 20, step: 0.5, unit: "x", severity: "critical", enabled: true },
      { id: "pos_leverage_warn", label: "杠杆预警线", description: "杠杆达到此倍数时发出警告", value: 3, defaultValue: 3, min: 1, max: 15, step: 0.5, unit: "x", severity: "warning", enabled: true },
      { id: "pos_total_exposure", label: "总敞口上限", description: "总持仓市值占账户净值的最大百分比", value: 200, defaultValue: 200, min: 50, max: 500, step: 10, unit: "%", severity: "critical", enabled: true },
      { id: "pos_cash_reserve", label: "现金储备下限", description: "可用现金占总资产的最低百分比", value: 10, defaultValue: 10, min: 5, max: 50, step: 5, unit: "%", severity: "warning", enabled: true },
    ],
  },
  {
    id: "risk_metrics",
    title: "风险指标",
    icon: Gauge,
    iconColor: "text-cyber-blue",
    description: "VaR、波动率、相关性等风险度量指标告警",
    items: [
      { id: "risk_var_daily", label: "日VaR上限", description: "24小时在险价值(VaR 95%)的最大金额", value: 40000, defaultValue: 40000, min: 5000, max: 200000, step: 5000, unit: "$", severity: "critical", enabled: true },
      { id: "risk_var_weekly", label: "周VaR上限", description: "7天VaR的最大金额", value: 80000, defaultValue: 80000, min: 10000, max: 500000, step: 10000, unit: "$", severity: "warning", enabled: true },
      { id: "risk_volatility", label: "波动率预警", description: "组合年化波动率超过此百分比时告警", value: 60, defaultValue: 60, min: 20, max: 150, step: 5, unit: "%", severity: "warning", enabled: true },
      { id: "risk_correlation", label: "相关性预警", description: "持仓币种间平均相关性超过此值时告警", value: 0.8, defaultValue: 0.8, min: 0.3, max: 1.0, step: 0.05, unit: "", severity: "warning", enabled: true },
      { id: "risk_sharpe_min", label: "Sharpe比率下限", description: "策略Sharpe比率低于此值时发出警告", value: 0.5, defaultValue: 0.5, min: -1, max: 3, step: 0.1, unit: "", severity: "info", enabled: true },
    ],
  },
  {
    id: "ai_signal",
    title: "AI信号告警",
    icon: Brain,
    iconColor: "text-cyber-amber",
    description: "AI模型预测信号、置信度和模型分歧相关告警",
    items: [
      { id: "ai_confidence_min", label: "最低置信度阈值", description: "AI信号置信度低于此值时忽略信号", value: 65, defaultValue: 65, min: 30, max: 95, step: 5, unit: "%", severity: "info", enabled: true },
      { id: "ai_divergence", label: "模型分歧阈值", description: "多模型信号分歧度超过此值时告警", value: 30, defaultValue: 30, min: 10, max: 80, step: 5, unit: "%", severity: "warning", enabled: true },
      { id: "ai_accuracy_drop", label: "准确率下降告警", description: "模型准确率较基线下降超过此百分比时告警", value: 5, defaultValue: 5, min: 1, max: 20, step: 1, unit: "%", severity: "warning", enabled: true },
      { id: "ai_prediction_error", label: "预测误差上限", description: "价格预测误差超过此百分比时告警", value: 10, defaultValue: 10, min: 3, max: 30, step: 1, unit: "%", severity: "warning", enabled: true },
      { id: "ai_signal_flip", label: "信号翻转告警", description: "AI信号在短时间内翻转时是否告警", value: 1, defaultValue: 1, min: 0, max: 1, step: 1, unit: "开关", severity: "info", enabled: true },
    ],
  },
  {
    id: "defi",
    title: "DeFi协议告警",
    icon: Zap,
    iconColor: "text-cyber-green",
    description: "DeFi协议相关的滑点、APY变化和TVL异常告警",
    items: [
      { id: "defi_slippage", label: "滑点上限", description: "DEX交易滑点超过此百分比时告警", value: 1.5, defaultValue: 1.5, min: 0.1, max: 5, step: 0.1, unit: "%", severity: "warning", enabled: true },
      { id: "defi_apy_drop", label: "APY下降告警", description: "流动性池APY下降超过此百分比时告警", value: 50, defaultValue: 50, min: 10, max: 90, step: 5, unit: "%", severity: "warning", enabled: true },
      { id: "defi_tvl_drop", label: "TVL下降告警", description: "协议TVL 24h下降超过此百分比时告警", value: 20, defaultValue: 20, min: 5, max: 60, step: 5, unit: "%", severity: "critical", enabled: true },
      { id: "defi_il_warn", label: "无常损失预警", description: "无常损失超过此百分比时告警", value: 5, defaultValue: 5, min: 1, max: 20, step: 0.5, unit: "%", severity: "warning", enabled: true },
      { id: "defi_gas_limit", label: "Gas费用上限", description: "链上Gas费超过此金额时暂停DeFi操作", value: 50, defaultValue: 50, min: 5, max: 200, step: 5, unit: "$", severity: "info", enabled: true },
    ],
  },
];

// ─── Severity Colors ───────────────────────────────────────────────
const severityStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: "bg-cyber-magenta/10", border: "border-cyber-magenta/40", text: "text-cyber-magenta", label: "严重" },
  warning: { bg: "bg-cyber-amber/10", border: "border-cyber-amber/40", text: "text-cyber-amber", label: "警告" },
  info: { bg: "bg-cyber-blue/10", border: "border-cyber-blue/40", text: "text-cyber-blue", label: "信息" },
};


// ─── Component ─────────────────────────────────────────────────────
export default function AlertThresholdConfig() {
  const [groups, setGroups] = useState<ThresholdGroup[]>(defaultGroups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["stop_loss", "drawdown"]));
  const [hasChanges, setHasChanges] = useState(false);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const updateThreshold = useCallback((groupId: string, itemId: string, newValue: number) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, items: g.items.map(item => item.id === itemId ? { ...item, value: newValue } : item) }
        : g
    ));
    setHasChanges(true);
  }, []);

  const toggleEnabled = useCallback((groupId: string, itemId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, items: g.items.map(item => item.id === itemId ? { ...item, enabled: !item.enabled } : item) }
        : g
    ));
    setHasChanges(true);
  }, []);

  const resetToDefaults = useCallback(() => {
    setGroups(defaultGroups);
    setHasChanges(false);
    toast.info("已恢复所有告警阈值为默认值");
  }, []);

  const saveChanges = useCallback(() => {
    setHasChanges(false);
    toast.success("告警阈值配置已保存", {
      description: "新的阈值将立即生效，所有策略将按照新配置进行告警监控",
    });
  }, []);

  // Count modified items
  const modifiedCount = groups.reduce((acc, g) => {
    return acc + g.items.filter(item => item.value !== item.defaultValue || !item.enabled).length;
  }, 0);

  const totalRules = groups.reduce((acc, g) => acc + g.items.length, 0);
  const enabledRules = groups.reduce((acc, g) => acc + g.items.filter(i => i.enabled).length, 0);

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyber-blue" />
                <span className="text-xs font-heading tracking-wider text-muted-foreground">告警规则总览</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-muted-foreground">
                  总规则: <span className="font-mono text-foreground">{totalRules}</span>
                </span>
                <span className="text-cyber-green">
                  已启用: <span className="font-mono">{enabledRules}</span>
                </span>
                <span className="text-muted-foreground">
                  已禁用: <span className="font-mono">{totalRules - enabledRules}</span>
                </span>
                {modifiedCount > 0 && (
                  <Badge className="bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30 text-[8px] py-0 px-1.5">
                    {modifiedCount} 项已修改
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-3"
                onClick={resetToDefaults}
              >
                <RotateCcw className="w-3 h-3 mr-1" />恢复默认
              </Button>
              <Button
                size="sm"
                className={`h-7 text-[10px] px-3 ${hasChanges ? "bg-cyber-green hover:bg-cyber-green/80 text-background" : "bg-secondary text-muted-foreground"}`}
                disabled={!hasChanges}
                onClick={saveChanges}
              >
                <Save className="w-3 h-3 mr-1" />保存配置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Groups */}
      {groups.map((group, gi) => {
        const isExpanded = expandedGroups.has(group.id);
        const GroupIcon = group.icon;
        const groupEnabledCount = group.items.filter(i => i.enabled).length;
        const groupModifiedCount = group.items.filter(i => i.value !== i.defaultValue).length;

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
          >
            <Card className="bg-card border-border overflow-hidden">
              {/* Group Header (clickable) */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${severityStyles[group.items[0]?.severity || "info"].bg}`}>
                    <GroupIcon className={`w-4 h-4 ${group.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-heading font-bold tracking-wider">{group.title}</h3>
                      <Badge variant="outline" className="text-[8px] py-0 border-border">
                        {groupEnabledCount}/{group.items.length} 启用
                      </Badge>
                      {groupModifiedCount > 0 && (
                        <Badge className="bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30 text-[7px] py-0 px-1">
                          {groupModifiedCount} 修改
                        </Badge>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{group.description}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </div>

              {/* Group Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Separator />
                    <CardContent className="pt-3 pb-4 space-y-3">
                      {group.items.map((item) => {
                        const sev = severityStyles[item.severity];
                        const isModified = item.value !== item.defaultValue;
                        const isToggle = item.unit === "开关";

                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border p-3 transition-all ${
                              item.enabled
                                ? `${sev.bg} ${sev.border}`
                                : "bg-secondary/10 border-border/30 opacity-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Left: Label + Description */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-[11px] font-medium">{item.label}</h4>
                                  <Badge variant="outline" className={`text-[7px] py-0 px-1 ${sev.border} ${sev.text}`}>
                                    {sev.label}
                                  </Badge>
                                  {isModified && (
                                    <Badge className="bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30 text-[7px] py-0 px-1">
                                      已修改
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[9px] text-muted-foreground leading-relaxed">{item.description}</p>

                                {/* Slider or Toggle */}
                                {item.enabled && !isToggle && (
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-3">
                                      <Slider
                                        value={[item.value]}
                                        min={item.min}
                                        max={item.max}
                                        step={item.step}
                                        onValueChange={([v]) => updateThreshold(group.id, item.id, v)}
                                        className="flex-1"
                                      />
                                      <div className={`min-w-[70px] text-right font-mono text-sm font-bold ${
                                        isModified ? "text-cyber-amber" : sev.text
                                      }`}>
                                        {item.unit === "$" ? `$${item.value.toLocaleString()}` : `${item.value}${item.unit}`}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                                      <span>{item.unit === "$" ? `$${item.min.toLocaleString()}` : `${item.min}${item.unit}`}</span>
                                      {isModified && (
                                        <span className="text-cyber-amber">
                                          默认: {item.unit === "$" ? `$${item.defaultValue.toLocaleString()}` : `${item.defaultValue}${item.unit}`}
                                        </span>
                                      )}
                                      <span>{item.unit === "$" ? `$${item.max.toLocaleString()}` : `${item.max}${item.unit}`}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Toggle type (like signal flip) */}
                                {item.enabled && isToggle && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Switch
                                      checked={item.value === 1}
                                      onCheckedChange={(checked) => updateThreshold(group.id, item.id, checked ? 1 : 0)}
                                    />
                                    <span className="text-[10px] text-muted-foreground">
                                      {item.value === 1 ? "已开启" : "已关闭"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Right: Enable/Disable Toggle */}
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <Switch
                                  checked={item.enabled}
                                  onCheckedChange={() => toggleEnabled(group.id, item.id)}
                                  className="h-4 w-7"
                                />
                                <span className="text-[7px] text-muted-foreground">
                                  {item.enabled ? "启用" : "禁用"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}

      {/* Quick Preset Buttons */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-cyber-blue" />
            快速预设方案
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                name: "保守型",
                desc: "低风险、严格止损、低杠杆",
                color: "border-cyber-green/40 hover:bg-cyber-green/10",
                textColor: "text-cyber-green",
                preset: { sl_single: 3, sl_daily: 5, dd_portfolio: 10, pos_leverage_max: 2, risk_var_daily: 20000 },
              },
              {
                name: "均衡型",
                desc: "中等风险、标准参数",
                color: "border-cyber-blue/40 hover:bg-cyber-blue/10",
                textColor: "text-cyber-blue",
                preset: { sl_single: 5, sl_daily: 8, dd_portfolio: 15, pos_leverage_max: 5, risk_var_daily: 40000 },
              },
              {
                name: "激进型",
                desc: "高风险、宽松止损、高杠杆",
                color: "border-cyber-magenta/40 hover:bg-cyber-magenta/10",
                textColor: "text-cyber-magenta",
                preset: { sl_single: 10, sl_daily: 15, dd_portfolio: 25, pos_leverage_max: 10, risk_var_daily: 80000 },
              },
            ].map((p) => (
              <Button
                key={p.name}
                variant="outline"
                className={`h-auto py-3 px-4 flex flex-col items-start gap-1 ${p.color} transition-all`}
                onClick={() => {
                  setGroups(prev => prev.map(g => ({
                    ...g,
                    items: g.items.map(item => {
                      const presetVal = (p.preset as Record<string, number>)[item.id];
                      return presetVal !== undefined ? { ...item, value: presetVal } : item;
                    }),
                  })));
                  setHasChanges(true);
                  toast.success(`已应用「${p.name}」预设方案`, {
                    description: p.desc,
                  });
                }}
              >
                <span className={`text-xs font-heading font-bold ${p.textColor}`}>{p.name}</span>
                <span className="text-[9px] text-muted-foreground">{p.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
