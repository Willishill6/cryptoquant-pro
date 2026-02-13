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
  { name: "DeepSeek-V3", type: "大语言模型", accuracy: 94.8, winRate: 74.2, sharpe: 2.55, latency: 95, pnl: 28450, trades: 1247, weight: 0.30, prevWeight: 0.30, status: "主力", streak: 5, lastSwitch: 0, cooldown: false },
  { name: "GPT-4o", type: "多模态模型", accuracy: 93.5, winRate: 71.5, sharpe: 2.42, latency: 180, pnl: 22100, trades: 1102, weight: 0.22, prevWeight: 0.22, status: "辅助", streak: 3, lastSwitch: 0, cooldown: false },
  { name: "LSTM-Attention", type: "序列记忆", accuracy: 92.5, winRate: 70.1, sharpe: 2.52, latency: 15, pnl: 19800, trades: 980, weight: 0.08, prevWeight: 0.08, status: "辅助", streak: 2, lastSwitch: 0, cooldown: false },
  { name: "TFT", type: "时序预测", accuracy: 93.2, winRate: 73.5, sharpe: 2.62, latency: 18, pnl: 25600, trades: 2456, weight: 0.15, prevWeight: 0.15, status: "主力", streak: 4, lastSwitch: 0, cooldown: false },
  { name: "PatchTST", type: "长序列预测", accuracy: 91.8, winRate: 72.8, sharpe: 2.48, latency: 12, pnl: 18200, trades: 1856, weight: 0.05, prevWeight: 0.05, status: "辅助", streak: 1, lastSwitch: 0, cooldown: false },
  { name: "XGBoost-Alpha", type: "因子优化", accuracy: 90.5, winRate: 69.8, sharpe: 2.35, latency: 8, pnl: 15400, trades: 3245, weight: 0.10, prevWeight: 0.10, status: "辅助", streak: 0, lastSwitch: 0, cooldown: false },
  { name: "PPO-Portfolio", type: "强化学习", accuracy: 89.8, winRate: 68.5, sharpe: 2.28, latency: 8, pnl: 12800, trades: 890, weight: 0.05, prevWeight: 0.05, status: "辅助", streak: -1, lastSwitch: 0, cooldown: false },
  { name: "FinBERT-Crypto", type: "金融NLP", accuracy: 87.5, winRate: 65.2, sharpe: 1.95, latency: 25, pnl: 8900, trades: 1567, weight: 0.03, prevWeight: 0.03, status: "备用", streak: -2, lastSwitch: 0, cooldown: false },
  { name: "Claude 3.5", type: "大语言模型", accuracy: 92.8, winRate: 70.8, sharpe: 2.38, latency: 95, pnl: 20500, trades: 1185, weight: 0.02, prevWeight: 0.02, status: "备用", streak: 1, lastSwitch: 0, cooldown: false },
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

    // Generate initial historical events
    const now = Date.now();
    const initialEvents: SchedulerEvent[] = [
      { id: "init-1", timestamp: now - 3600000 * 5, type: "rebalance", from: "系统", to: "全部模型", reason: "系统启动，初始化权重分配", metrics: { accuracy: 0, winRate: 0, score: 0 } },
      { id: "init-2", timestamp: now - 3600000 * 4, type: "promote", from: "TFT", to: "TFT", reason: "TFT夏普比率2.62领先，提升为时序预测主力", metrics: { accuracy: 93.2, winRate: 73.5, score: 92.1 } },
      { id: "init-3", timestamp: now - 3600000 * 3, type: "rebalance", from: "DeepSeek-V3", to: "DeepSeek-V3", reason: "DeepSeek-V3准确率94.8%持续领先，权重+2%", metrics: { accuracy: 94.8, winRate: 74.2, score: 94.5 } },
      { id: "init-4", timestamp: now - 3600000 * 2, type: "promote", from: "LSTM-Attention", to: "LSTM-Attention", reason: "LSTM-Attention延迟仅15ms且准确率92.5%，提升为辅助主力", metrics: { accuracy: 92.5, winRate: 70.1, score: 88.2 } },
      { id: "init-5", timestamp: now - 3600000 * 1, type: "demote", from: "FinBERT-Crypto", to: "FinBERT-Crypto", reason: "FinBERT-Crypto胜率降至65.2%，降级为备用", metrics: { accuracy: 87.5, winRate: 65.2, score: 78.5 } },
      { id: "init-6", timestamp: now - 1800000, type: "alert", from: "调度引擎", to: "全部模型", reason: "市场波动率上升，切换至保守调度模式", metrics: { accuracy: 0, winRate: 0, score: 0 } },
    ];
    setEvents(initialEvents);
    setTotalSwitches(3);
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
          // Simulate real-time performance fluctuations
          const accDelta = (Math.random() - 0.48) * 0.15;
          const wrDelta = (Math.random() - 0.48) * 0.2;
          const sharpeDelta = (Math.random() - 0.48) * 0.02;
          const pnlDelta = (Math.random() - 0.4) * 200;
          const tradeDelta = Math.floor(Math.random() * 3);

          const newAcc = Math.max(70, Math.min(99, m.accuracy + accDelta));
          const newWr = Math.max(50, Math.min(90, m.winRate + wrDelta));
          const newSharpe = Math.max(0.5, Math.min(4, m.sharpe + sharpeDelta));
          const newPnl = m.pnl + pnlDelta;
          const newTrades = m.trades + tradeDelta;
          const newStreak = pnlDelta > 0 ? (m.streak > 0 ? m.streak + 1 : 1) : (m.streak < 0 ? m.streak - 1 : -1);

          const score = calcScore({ accuracy: newAcc, winRate: newWr, sharpe: newSharpe, latency: m.latency }, config);

          return {
            ...m,
            accuracy: newAcc,
            winRate: newWr,
            sharpe: newSharpe,
            pnl: newPnl,
            trades: newTrades,
            streak: newStreak,
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

  // Ensemble signal from top models
  const ensembleSignal = useMemo(() => {
    if (models.length === 0) return { direction: "中性", confidence: 0, contributors: [] as { name: string; signal: string; weight: number }[] };
    const top5 = models.slice(0, 5);
    let bullScore = 0, bearScore = 0, totalW = 0;
    const contributors = top5.map(m => {
      const r = Math.random();
      const signal = r < 0.45 ? "看涨" : r < 0.75 ? "中性" : "看跌";
      const w = m.weight;
      totalW += w;
      if (signal === "看涨") bullScore += w;
      else if (signal === "看跌") bearScore += w;
      return { name: m.name, signal, weight: w };
    });
    const direction = bullScore > bearScore * 1.2 ? "看涨" : bearScore > bullScore * 1.2 ? "看跌" : "中性";
    const confidence = Math.abs(bullScore - bearScore) / totalW * 100;
    return { direction, confidence: Math.min(95, confidence + 40), contributors };
  }, [models]);

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
