/**
 * KeyboardShortcuts - 全局键盘快捷键管理器
 * 数字键1-9切换页面，?显示快捷键帮助
 */
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { key: "1", label: "仪表盘", path: "/" },
  { key: "2", label: "交易引擎", path: "/trading" },
  { key: "3", label: "策略系统", path: "/strategies" },
  { key: "4", label: "AI系统", path: "/ai" },
  { key: "5", label: "风险管理", path: "/risk" },
  { key: "6", label: "数据分析", path: "/data" },
  { key: "7", label: "系统监控", path: "/monitoring" },
  { key: "8", label: "系统设置", path: "/settings" },
];

const globalShortcuts = [
  { keys: "Ctrl+K", label: "命令面板" },
  { keys: "1-8", label: "快速切换页面" },
  { keys: "?", label: "显示快捷键帮助" },
  { keys: "Esc", label: "关闭弹窗/面板" },
];

export default function KeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    // ? key to show help
    if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowHelp(prev => !prev);
      return;
    }

    // Number keys for page navigation
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const shortcut = shortcuts.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        setLocation(shortcut.path);
      }
    }
  }, [setLocation]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {showHelp && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[91]
              w-[90vw] max-w-[420px] rounded-xl
              bg-card border border-border/60 shadow-2xl shadow-black/40 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyber-blue" />
                <h3 className="text-base font-semibold text-foreground">键盘快捷键</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">全局</h4>
                <div className="space-y-1.5">
                  {globalShortcuts.map(s => (
                    <div key={s.keys} className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <kbd className="px-2 py-0.5 rounded bg-muted/50 text-xs font-mono text-foreground border border-border/40">
                        {s.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">页面导航</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {shortcuts.map(s => (
                    <div key={s.key} className="flex items-center gap-2 py-1">
                      <kbd className="w-6 h-6 flex items-center justify-center rounded bg-muted/50 text-xs font-mono text-foreground border border-border/40">
                        {s.key}
                      </kbd>
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
