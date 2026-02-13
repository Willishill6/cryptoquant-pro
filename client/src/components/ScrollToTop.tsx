/**
 * ScrollToTop - 滚动到顶部按钮
 * 当页面滚动超过300px时显示，点击平滑滚动到顶部
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector("[data-main-scroll]");
    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > 300);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const container = document.querySelector("[data-main-scroll]");
    container?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full
            bg-cyber-blue/20 border border-cyber-blue/40 text-cyber-blue
            hover:bg-cyber-blue/30 hover:border-cyber-blue/60 hover:scale-110
            active:scale-95 transition-all duration-200
            flex items-center justify-center shadow-lg shadow-cyber-blue/10
            backdrop-blur-sm"
          aria-label="滚动到顶部"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
