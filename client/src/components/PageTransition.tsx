/**
 * PageTransition - 页面切换过渡动画包装器
 * 为每个页面提供淡入+上移的进入动画
 */
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.25,
};

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
