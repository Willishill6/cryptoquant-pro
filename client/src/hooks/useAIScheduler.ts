/**
 * useAIScheduler — AI模型自动调度引擎
 * 根据实时胜率和准确率自动切换主力AI模型
 * 调度策略：综合评分 = 准确率×0.4 + 胜率×0.35 + 夏普比率×0.15 + (1/延迟)×0.10
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

export interface ModelPerformance {
  name: string;
  type: string;
  accuracy: number;
  winRate: number;
  sharpe: number;
  latency: number;
  pnl: number;
  trades: number;
  score: number;
  rank: number;
  prevRank: number;
  weight: number;
  prevWeight: number;
  status: "主力" | "辅助" | "备用" | "降级" | "观察";
  trend: "up" | "down" | "stable";
  streak: number; // consecutive wins/losses
  lastSwitch: number; // timestamp
  cooldown: boolean;
}

export interface SchedulerEvent {
  id: string;
  timestamp: number;
  type: "promote" | "demote" | "rebalance" | "alert" | "cooldown" | "emergency";
  from: string;
  to: string;
  reason: string;
  metrics: { accuracy: number; winRate: number; score: number };
}

export interface SchedulerConfig {
  enabled: boolean;
  mode: "aggressive" | "balanced" | "conservative";
  evalInterval: number; // seconds
  minTradesForEval: number;
  cooldownPeriod: number; // seconds after switch before next switch
  accuracyWeight: number;
  winRateWeight: number;
  sharpeWeight: number;
  latencyWeight: number;
  autoRebalance: boolean;
  maxWeightShift: number; // max weight change per rebalance
  emergencyThreshold: number; // accuracy below this triggers emergency
}

const DEFAULT_CONFIGS: Record<string, SchedulerConfig> = {
  aggressive: {
    enabled: true, mode: "aggressive", evalInterval: 30,
    minTradesForEval: 10, cooldownPeriod: 60,
    accuracyWeight: 0.35, winRateWeight: 0.40, sharpeWeight: 0.15, latencyWeight: 0.10,
    autoRebalance: true, maxWeightShift: 0.08, emergencyThreshold: 75,
  },
  balanced: {
    enabled: true, mode: "balanced", evalInterval: 60,
    minTradesForEval: 20, cooldownPeriod: 120,
    accuracyWeight: 0.40, winRateWeight: 0.35, sharpeWeight: 0.15, latencyWeight: 0.10,
    autoRebalance: true, maxWeightShift: 0.05, emergencyThreshold: 70,
  },
  conservative: {
    enabled: true, mode: "conservative", evalInterval: 120,
    minTradesForEval: 50, cooldownPeriod: 300,
    accuracyWeight: 0.45, winRateWeight: 0.30, sharpeWeight: 0.15, latencyWeight: 0.10,
    autoRebalance: true, maxWeightShift: 0.03, emergencyThreshold: 65,
  },
};

const INITIAL_MODELS: Omit<ModelPerformance, "score" | "rank" | "prevRank" | "trend">[] = [
  { name: "DeepSeek-V3", type: "大语言模型", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.30, prevWeight: 0.30, status: "主力", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "GPT-4o", type: "多模态模型", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.22, prevWeight: 0.22, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "LSTM-Attention", type: "序列记忆", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.08, prevWeight: 0.08, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "TFT", type: "时序预测", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.15, prevWeight: 0.15, status: "主力", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "PatchTST", type: "长序列预测", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.05, prevWeight: 0.05, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "XGBoost-Alpha", type: "因子优化", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.10, prevWeight: 0.10, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "PPO-Portfolio", type: "强化学习", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.05, prevWeight: 0.05, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "FinBERT-Crypto", type: "金融NLP", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.03, prevWeight: 0.03, status: "备用", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "Claude 3.5", type: "大语言模型", accuracy: 0, winRate: 0, sharpe: 0, latency: 0, pnl: 0, trades: 0, weight: 0.02, prevWeight: 0.02, status: "备用", streak: 0, lastSwitch: 0, cooldown: false },
];

function calcScore(m: { accuracy: number; winRate: number; sharpe: number; latency: number }, cfg: SchedulerConfig): number {
  const latencyScore = Math.max(0, 100 - m.latency * 0.5); // normalize latency to 0-100
  return m.accuracy * cfg.accuracyWeight + m.winRate * cfg.winRateWeight + m.sharpe * 10 * cfg.sharpeWeight + latencyScore * cfg.latencyWeight;
}

export function useAIScheduler() {
  const [config, setConfig] = useState<SchedulerConfig>(DEFAULT_CONFIGS.balanced);
  const [models, setModels] = useState<ModelPerformance[]>([]);
  const [events, setEvents] = useState<SchedulerEvent[]>([]);
  const [primaryModel, setPrimaryModel] = useState("DeepSeek-V3");
  const [totalSwitches, setTotalSwitches] = useState(0);
  const [schedulerUptime, setSchedulerUptime] = useState(0);
  const tickRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Initialize models with scores
  useEffect(() => {
    const scored = INITIAL_MODELS.map((m, i) => {
      const score = calcScore(m, config);
      return { ...m, score, rank: i + 1, prevRank: i + 1, trend: "stable" as const };
    });
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((m, i) => { m.rank = i + 1; m.prevRank = i + 1; });
    setModels(scored);

    // 暂无历史调度事件，初始化为空
    setEvents([]);
    setTotalSwitches(0);
  }, []);

  // Main scheduling loop
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      tickRef.current++;
      const now = Date.now();
      setSchedulerUptime(Math.floor((now - startTimeRef.current) / 1000));

      setModels(prev => {
        const updated = prev.map(m => {
          // 暂停假性能波动，等待真实AI训练数据
          const score = calcScore({ accuracy: m.accuracy, winRate: m.winRate, sharpe: m.sharpe, latency: m.latency }, config);
          return {
            ...m,
            prevRank: m.rank,
            prevWeight: m.weight,
            score,
            cooldown: m.lastSwitch > 0 && (now - m.lastSwitch) < config.cooldownPeriod * 1000,
          };
        });

        // Sort by score and assign ranks
        updated.sort((a, b) => b.score - a.score);
        updated.forEach((m, i) => {
          const newRank = i + 1;
          m.trend = newRank < m.prevRank ? "up" : newRank > m.prevRank ? "down" : "stable";
          m.rank = newRank;
        });

        // Auto-scheduling logic (every evalInterval ticks)
        if (tickRef.current % Math.max(1, Math.floor(config.evalInterval / 2)) === 0) {
          const top = updated[0];
          const currentPrimary = updated.find(m => m.name === primaryModel);

          // Check for emergency: any model below threshold
          const emergencyModel = updated.find(m => m.accuracy < config.emergencyThreshold && m.status !== "备用" && m.status !== "降级");
          if (emergencyModel) {
            emergencyModel.status = "降级";
            emergencyModel.weight = Math.max(0.01, emergencyModel.weight - config.maxWeightShift);
            const evt: SchedulerEvent = {
              id: `evt-${now}`, timestamp: now, type: "emergency",
              from: emergencyModel.name, to: emergencyModel.name,
              reason: `${emergencyModel.name}准确率降至${emergencyModel.accuracy.toFixed(1)}%，低于紧急阈值${config.emergencyThreshold}%，已紧急降级`,
              metrics: { accuracy: emergencyModel.accuracy, winRate: emergencyModel.winRate, score: emergencyModel.score },
            };
            setEvents(prev => [evt, ...prev].slice(0, 50));
          }

          // Promote top model if it outperforms current primary significantly
          if (top && currentPrimary && top.name !== primaryModel && !top.cooldown) {
            const scoreDiff = top.score - currentPrimary.score;
            const threshold = config.mode === "aggressive" ? 0.5 : config.mode === "balanced" ? 1.0 : 2.0;

            if (scoreDiff > threshold) {
              const oldPrimary = primaryModel;
              setPrimaryModel(top.name);
              setTotalSwitches(prev => prev + 1);

              top.status = "主力";
              top.lastSwitch = now;
              if (currentPrimary) currentPrimary.status = "辅助";

              const evt: SchedulerEvent = {
                id: `evt-${now}`, timestamp: now, type: "promote",
                from: oldPrimary, to: top.name,
                reason: `${top.name}综合评分${top.score.toFixed(1)}超过${oldPrimary}(${currentPrimary.score.toFixed(1)})，差距${scoreDiff.toFixed(1)}分，自动提升为主力`,
                metrics: { accuracy: top.accuracy, winRate: top.winRate, score: top.score },
              };
              setEvents(prev => [evt, ...prev].slice(0, 50));
            }
          }

          // Auto-rebalance weights
          if (config.autoRebalance && tickRef.current % (Math.max(1, Math.floor(config.evalInterval / 2)) * 3) === 0) {
            const totalScore = updated.reduce((s, m) => s + m.score, 0);
            updated.forEach(m => {
              const idealWeight = m.score / totalScore;
              const diff = idealWeight - m.weight;
              const shift = Math.max(-config.maxWeightShift, Math.min(config.maxWeightShift, diff * 0.3));
              m.weight = Math.max(0.01, Math.min(0.50, m.weight + shift));
            });
            // Normalize weights to sum to 1
            const totalWeight = updated.reduce((s, m) => s + m.weight, 0);
            updated.forEach(m => { m.weight = m.weight / totalWeight; });

            const evt: SchedulerEvent = {
              id: `evt-rb-${now}`, timestamp: now, type: "rebalance",
              from: "调度引擎", to: "全部模型",
              reason: `自动再平衡：基于综合评分重新分配权重，最大调整幅度${(config.maxWeightShift * 100).toFixed(0)}%`,
              metrics: { accuracy: 0, winRate: 0, score: 0 },
            };
            setEvents(prev => [evt, ...prev].slice(0, 50));
          }

          // Update statuses
          updated.forEach((m, i) => {
            if (m.name === primaryModel) m.status = "主力";
            else if (m.status !== "降级") {
              if (i < 3) m.status = "主力";
              else if (i < 6) m.status = "辅助";
              else m.status = "备用";
            }
          });
        }

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [config, primaryModel]);

  const setMode = useCallback((mode: "aggressive" | "balanced" | "conservative") => {
    setConfig(DEFAULT_CONFIGS[mode]);
  }, []);

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const forceSwitch = useCallback((modelName: string) => {
    setPrimaryModel(modelName);
    setTotalSwitches(prev => prev + 1);
    const now = Date.now();
    const evt: SchedulerEvent = {
      id: `evt-manual-${now}`, timestamp: now, type: "promote",
      from: primaryModel, to: modelName,
      reason: `手动切换：管理员将主力模型从${primaryModel}切换至${modelName}`,
      metrics: { accuracy: 0, winRate: 0, score: 0 },
    };
    setEvents(prev => [evt, ...prev].slice(0, 50));
  }, [primaryModel]);

  // 暂无真实集成信号，返回中性状态
  const ensembleSignal = useMemo(() => {
    return { direction: "中性", confidence: 0, contributors: [] as { name: string; signal: string; weight: number }[] };
  }, []);

  return {
    models,
    events,
    config,
    primaryModel,
    totalSwitches,
    schedulerUptime,
    ensembleSignal,
    setMode,
    toggleEnabled,
    forceSwitch,
    setConfig,
  };
}
