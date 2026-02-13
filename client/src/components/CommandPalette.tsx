/**
 * CommandPalette - 全局命令面板
 * Ctrl+K 打开，支持快速搜索页面、币种、功能
 * 键盘导航：↑↓选择，Enter确认，Esc关闭
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, Zap, TrendingUp, BarChart3, Brain,
  BookOpen, Dna, FileText, Shield, Database, Activity, Settings,
  ArrowRight, Command, Hash,
} from "lucide-react";
import { allCoins } from "@/lib/mockData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  category: "page" | "coin" | "action";
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const debouncedQuery = useDebouncedValue(query, 150);

  // Page navigation items
  const pageItems: CommandItem[] = useMemo(() => [
    { id: "p-dashboard", label: "仪表盘", description: "实时收益监控", icon: LayoutDashboard, category: "page", action: () => setLocation("/") },
    { id: "p-trading", label: "交易引擎", description: "全自动交易", icon: Zap, category: "page", action: () => setLocation("/trading") },
    { id: "p-strategies", label: "策略系统", description: "策略管理与回测", icon: TrendingUp, category: "page", action: () => setLocation("/strategies") },
    { id: "p-factors", label: "因子系统", description: "阿尔法因子", icon: BarChart3, category: "page", action: () => setLocation("/factors") },
    { id: "p-ai", label: "AI系统", description: "智能预测与学习", icon: Brain, category: "page", action: () => setLocation("/ai") },
    { id: "p-learning", label: "数据学习", description: "5年+历史数据学习", icon: BookOpen, category: "page", action: () => setLocation("/history-learning") },
    { id: "p-evolution", label: "AI进化", description: "自我进化实验室", icon: Dna, category: "page", action: () => setLocation("/ai-evolution") },
    { id: "p-trades", label: "交易管理", description: "交易历史与持仓", icon: FileText, category: "page", action: () => setLocation("/trades") },
    { id: "p-risk", label: "风险管理", description: "风控与监控", icon: Shield, category: "page", action: () => setLocation("/risk") },
    { id: "p-data", label: "数据分析", description: "数据与指标", icon: Database, category: "page", action: () => setLocation("/data") },
    { id: "p-monitoring", label: "系统监控", description: "运维与日志", icon: Activity, category: "page", action: () => setLocation("/monitoring") },
    { id: "p-settings", label: "系统设置", description: "配置管理", icon: Settings, category: "page", action: () => setLocation("/settings") },
  ], [setLocation]);

  // Coin items (top 30 by volume for quick access)
  const coinItems: CommandItem[] = useMemo(() => {
    return allCoins
      .slice(0, 30)
      .map(coin => ({
        id: `c-${coin.symbol}`,
        label: `${coin.symbol}/USDT`,
        description: `$${coin.price.toLocaleString()} · ${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`,
        icon: Hash,
        category: "coin" as const,
        action: () => setLocation("/trading"),
      }));
  }, [setLocation]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!debouncedQuery) {
      return [...pageItems, ...coinItems.slice(0, 5)];
    }
    const q = debouncedQuery.toLowerCase();
    const matchedPages = pageItems.filter(
      item => item.label.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q))
    );
    const matchedCoins = coinItems.filter(
      item => item.label.toLowerCase().includes(q)
    );
    return [...matchedPages, ...matchedCoins].slice(0, 15);
  }, [debouncedQuery, pageItems, coinItems]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation within palette
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      setOpen(false);
    }
  }, [filteredItems, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: typeof filteredItems }[] = [];
    const pages = filteredItems.filter(i => i.category === "page");
    const coins = filteredItems.filter(i => i.category === "coin");
    if (pages.length > 0) groups.push({ label: "页面导航", items: pages });
    if (coins.length > 0) groups.push({ label: "币种", items: coins });
    return groups;
  }, [filteredItems]);

  // Flat index mapping for keyboard navigation
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101]
              w-[90vw] max-w-[560px] rounded-xl
              bg-card/95 border border-border/60 shadow-2xl shadow-black/40
              backdrop-blur-xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索页面、币种、功能..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60
                  outline-none border-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                bg-muted/50 text-[10px] text-muted-foreground font-mono border border-border/40">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  未找到匹配结果
                </div>
              ) : (
                groupedItems.map(group => (
                  <div key={group.label}>
                    <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.items.map(item => {
                      flatIndex++;
                      const idx = flatIndex;
                      const isSelected = idx === selectedIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { item.action(); setOpen(false); }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                            transition-colors duration-100
                            ${isSelected
                              ? "bg-cyber-blue/10 text-foreground"
                              : "text-muted-foreground hover:bg-muted/30"
                            }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-cyber-blue" : ""}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground/60 truncate">{item.description}</div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-3.5 h-3.5 text-cyber-blue shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 text-[10px] text-muted-foreground/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono">↑↓</kbd>
                  导航
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono">↵</kbd>
                  确认
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono">esc</kbd>
                  关闭
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Command className="w-3 h-3" />
                <span>K 打开</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
