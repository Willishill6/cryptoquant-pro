/**
 * useDbData - 数据层中间件hooks
 * 优先从数据库API获取数据，数据库不可用时回退到本地mockData
 * 所有页面通过这些hooks获取数据，实现数据库与前端的解耦
 */
import { trpc } from "@/lib/trpc";
import {
  allCoins as mockCoins,
  strategies as mockStrategies,
  recentTrades as mockTrades,
  aiModels as mockAIModels,
  portfolio as mockPortfolio,
  exchanges as mockExchanges,
  riskMetrics as mockRiskMetrics,
  alphaFactors as mockAlphaFactors,
} from "@/lib/mockData";

/**
 * 获取币种列表 - 优先数据库，回退mockData
 */
export function useDbCoins() {
  const query = trpc.coins.list.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    data: query.data && query.data.length > 0 ? query.data : mockCoins,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取策略列表 - 优先数据库，回退mockData
 */
export function useDbStrategies() {
  const query = trpc.strategies.list.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    data: query.data && query.data.length > 0 ? query.data : mockStrategies,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取交易记录 - 优先数据库，回退mockData
 */
export function useDbTrades(limit?: number) {
  const query = trpc.trades.list.useQuery(
    limit ? { limit } : undefined,
    {
      retry: 1,
      staleTime: 15_000,
    }
  );

  return {
    data: query.data && query.data.length > 0 ? query.data : mockTrades,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取AI模型列表 - 优先数据库，回退mockData
 */
export function useDbAIModels() {
  const query = trpc.ai.models.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    data: query.data && query.data.length > 0 ? query.data : mockAIModels,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取投资组合 - 优先数据库，回退mockData
 */
export function useDbPortfolio() {
  const query = trpc.portfolio.get.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? mockPortfolio,
    isFromDb: !!query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取交易所列表 - 优先数据库，回退mockData
 */
export function useDbExchanges() {
  const query = trpc.exchanges.list.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  return {
    data: query.data && query.data.length > 0 ? query.data : mockExchanges,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取风险指标 - 优先数据库，回退mockData
 */
export function useDbRiskMetrics() {
  const query = trpc.risk.get.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? mockRiskMetrics,
    isFromDb: !!query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取告警列表 - 优先数据库，回退mockData
 */
export function useDbAlerts() {
  const query = trpc.alerts.list.useQuery(undefined, {
    retry: 1,
    staleTime: 15_000,
  });

  return {
    data: query.data ?? [],
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取Alpha因子列表 - 优先数据库，回退mockData
 */
export function useDbAlphaFactors() {
  const query = trpc.alphaFactors.list.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  return {
    data: query.data && query.data.length > 0 ? query.data : mockAlphaFactors,
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取AI调度器事件 - 优先数据库
 */
export function useDbSchedulerEvents() {
  const query = trpc.ai.schedulerEvents.useQuery(undefined, {
    retry: 1,
    staleTime: 15_000,
  });

  return {
    data: query.data ?? [],
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 获取系统配置
 */
export function useDbConfig() {
  const query = trpc.config.list.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  return {
    data: query.data ?? [],
    isFromDb: !!(query.data && query.data.length > 0),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ─── Mutation Hooks ─────────────────────────────────────────────────

/**
 * 创建交易记录
 */
export function useCreateTrade() {
  const utils = trpc.useUtils();
  return trpc.trades.create.useMutation({
    onSuccess: () => {
      utils.trades.list.invalidate();
    },
  });
}

/**
 * 更新策略
 */
export function useUpdateStrategy() {
  const utils = trpc.useUtils();
  return trpc.strategies.update.useMutation({
    onSuccess: () => {
      utils.strategies.list.invalidate();
    },
  });
}

/**
 * 创建告警
 */
export function useCreateAlert() {
  const utils = trpc.useUtils();
  return trpc.alerts.create.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
    },
  });
}

/**
 * 确认告警
 */
export function useAcknowledgeAlert() {
  const utils = trpc.useUtils();
  return trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
    },
  });
}

/**
 * 确认所有告警
 */
export function useAcknowledgeAllAlerts() {
  const utils = trpc.useUtils();
  return trpc.alerts.acknowledgeAll.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
    },
  });
}

/**
 * 更新AI模型
 */
export function useUpdateAIModel() {
  const utils = trpc.useUtils();
  return trpc.ai.updateModel.useMutation({
    onSuccess: () => {
      utils.ai.models.invalidate();
    },
  });
}

/**
 * 创建AI调度器事件
 */
export function useCreateSchedulerEvent() {
  const utils = trpc.useUtils();
  return trpc.ai.createSchedulerEvent.useMutation({
    onSuccess: () => {
      utils.ai.schedulerEvents.invalidate();
    },
  });
}

/**
 * 更新系统配置
 */
export function useSetConfig() {
  const utils = trpc.useUtils();
  return trpc.config.set.useMutation({
    onSuccess: () => {
      utils.config.list.invalidate();
    },
  });
}
