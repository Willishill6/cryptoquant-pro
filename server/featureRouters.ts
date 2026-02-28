/**
 * Feature Routers - 业务数据tRPC路由
 * 提供coins, strategies, trades, ai, alerts, portfolio, risk, config等API
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { BacktestEngine } from "./src/services/backtestEngine";
import { optimizeParams } from "./src/services/optimizationService";
import { AiStrategyEngine } from "./src/services/aiStrategyEngine";
// import { generateStrategyCode } from "./strategyGenerator"; // DeepSeek-V3 integration will go here

const aiStrategyEngine = new AiStrategyEngine();
import { getBinanceBalance, testBinanceConnection, getDefaultBalance } from "./binanceService";

// ─── Coins Router ──────────────────────────────────────────────────
export const coinsRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllCoins();
  }),
  getBySymbol: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      return db.getCoinBySymbol(input.symbol);
    }),
  upsert: publicProcedure
    .input(z.object({
      symbol: z.string(),
      name: z.string(),
      category: z.string().optional(),
      price: z.number().optional(),
      change24h: z.number().optional(),
      volume: z.number().optional(),
      marketCap: z.string().optional(),
      aiSignal: z.enum(["买入", "卖出", "持有", "强烈买入", "强烈卖出"]).optional(),
      aiConfidence: z.number().optional(),
      riskLevel: z.enum(["低", "中", "高"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertCoin(input);
      return { success: true };
    }),
});

// ─── Strategies Router ─────────────────────────────────────────────
export const strategiesRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllStrategies();
  }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getStrategyById(input.id);
    }),
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      type: z.string().optional(),
      status: z.enum(["运行中", "已暂停", "回测中", "已停止"]).optional(),
      coins: z.string().optional(),
      pnl: z.number().optional(),
      pnlPercent: z.number().optional(),
      winRate: z.number().optional(),
      sharpe: z.number().optional(),
      trades: z.number().optional(),
      riskLevel: z.enum(["低", "中", "高"]).optional(),
      description: z.string().optional(),
      params: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createStrategy(input);
      return { success: true };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        type: z.string().optional(),
        status: z.enum(["运行中", "已暂停", "回测中", "已停止"]).optional(),
        coins: z.string().optional(),
        pnl: z.number().optional(),
        pnlPercent: z.number().optional(),
        winRate: z.number().optional(),
        sharpe: z.number().optional(),
        trades: z.number().optional(),
        riskLevel: z.enum(["低", "中", "高"]).optional(),
        description: z.string().optional(),
        params: z.any().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateStrategy(input.id, input.data);
      return { success: true };
    }),

  // 运行回测
  runBacktest: publicProcedure
    .input(z.object({
      strategyId: z.string(),
      symbol: z.string(),
      candles: z.array(z.object({
        timestamp: z.number(),
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number(),
      })),
      initialCapital: z.number(),
    }))
    .mutation(async ({ input }) => {
      const backtestEngine = new BacktestEngine(input.candles, aiStrategyEngine);
      return backtestEngine.runBacktest(input.strategyId, input.initialCapital);
    }),

  // AI 参数优化
  optimizeParams: publicProcedure
    .input(z.object({
      strategyId: z.string(),
      historicalData: z.array(z.object({
        timestamp: z.number(),
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      return await optimizeParams(input.strategyId, input.historicalData);
    }),

  // AI 策略生成
  generateStrategy: publicProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Integrate DeepSeek-V3 for natural language to code strategy generation
      console.log(`Generating strategy for prompt: ${input.prompt}`);
      return { code: `// Generated strategy code for: ${input.prompt}\n// DeepSeek-V3 integration coming soon.` };
    }),
});

// ─── Trades Router ─────────────────────────────────────────────────
export const tradesRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getAllTrades(input?.limit ?? 100);
    }),
  create: publicProcedure
    .input(z.object({
      coin: z.string(),
      type: z.enum(["买入", "卖出"]),
      price: z.number(),
      amount: z.number(),
      total: z.number(),
      strategyId: z.number().optional(),
      strategyName: z.string().optional(),
      pnl: z.number().optional(),
      fee: z.number().optional(),
      exchange: z.string().optional(),
      aiConfidence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createTrade(input);
      return { success: true };
    }),
  byStrategy: publicProcedure
    .input(z.object({ strategyId: z.number() }))
    .query(async ({ input }) => {
      return db.getTradesByStrategy(input.strategyId);
    }),
});

// ─── AI Models Router ──────────────────────────────────────────────
export const aiRouter = router({
  models: publicProcedure.query(async () => {
    return db.getAllAIModels();
  }),
  upsertModel: publicProcedure
    .input(z.object({
      name: z.string(),
      type: z.string(),
      accuracy: z.number().optional(),
      winRate: z.number().optional(),
      sharpe: z.number().optional(),
      latency: z.number().optional(),
      pnl: z.number().optional(),
      tradesCount: z.number().optional(),
      weight: z.number().optional(),
      status: z.enum(["主力", "辅助", "备用", "降级", "观察"]).optional(),
      score: z.number().optional(),
      aiRank: z.number().optional(),
      streak: z.number().optional(),
      cooldown: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertAIModel(input);
      return { success: true };
    }),
  updateModel: publicProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        accuracy: z.number().optional(),
        winRate: z.number().optional(),
        sharpe: z.number().optional(),
        latency: z.number().optional(),
        pnl: z.number().optional(),
        weight: z.number().optional(),
        status: z.enum(["主力", "辅助", "备用", "降级", "观察"]).optional(),
        score: z.number().optional(),
        aiRank: z.number().optional(),
        streak: z.number().optional(),
        cooldown: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateAIModel(input.id, input.data);
      return { success: true };
    }),
  schedulerEvents: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getSchedulerEvents(input?.limit ?? 50);
    }),
  createSchedulerEvent: publicProcedure
    .input(z.object({
      eventType: z.enum(["promote", "demote", "rebalance", "alert", "cooldown", "emergency"]),
      fromModel: z.string(),
      toModel: z.string(),
      reason: z.string(),
      metricsAccuracy: z.number().optional(),
      metricsWinRate: z.number().optional(),
      metricsScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createSchedulerEvent(input);
      return { success: true };
    }),
});

// ─── Alerts Router ─────────────────────────────────────────────────
export const alertsRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getAllAlerts(input?.limit ?? 50);
    }),
  create: publicProcedure
    .input(z.object({
      severity: z.enum(["critical", "warning", "info", "success"]),
      category: z.string(),
      title: z.string(),
      message: z.string(),
      strategy: z.string().optional(),
      coin: z.string().optional(),
      value: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createAlert(input);
      return { success: true };
    }),
  acknowledge: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.acknowledgeAlert(input.id);
      return { success: true };
    }),
  acknowledgeAll: publicProcedure.mutation(async () => {
    await db.acknowledgeAllAlerts();
    return { success: true };
  }),
});

// ─── Portfolio Router ──────────────────────────────────────────────
export const portfolioRouter = router({
  get: publicProcedure.query(async () => {
    return db.getPortfolio();
  }),
  update: publicProcedure
    .input(z.object({
      totalValue: z.number().optional(),
      dailyPnl: z.number().optional(),
      dailyPnlPercent: z.number().optional(),
      totalPnl: z.number().optional(),
      totalPnlPercent: z.number().optional(),
      winRate: z.number().optional(),
      sharpe: z.number().optional(),
      maxDrawdown: z.number().optional(),
      totalTrades: z.number().optional(),
      activeSince: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertPortfolio(input);
      return { success: true };
    }),
});

// ─── Exchanges Router ──────────────────────────────────────────────
export const exchangesRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllExchanges();
  }),
  // 使用环境变量中配置的默认 API Key 查询余额（无需前端传递密钥）
  getDefaultBalance: publicProcedure.query(async () => {
    return await getDefaultBalance();
  }),
  // 使用指定的 API Key 查询余额
  getBalance: publicProcedure
    .input(z.object({
      exchange: z.string(),
      apiKey: z.string(),
      apiSecret: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (input.exchange.toLowerCase() === 'binance') {
        try {
          const balance = await getBinanceBalance(input.apiKey, input.apiSecret);
          return {
            success: true,
            totalUSDT: balance.spot.totalUSDT + (balance.futures?.totalUSDT || 0),
            spot: balance.spot,
            futures: balance.futures,
          };
        } catch (error: any) {
          return {
            success: false,
            totalUSDT: 0,
            error: error.message,
          };
        }
      }
      return { success: false, totalUSDT: 0, error: `Exchange ${input.exchange} not supported yet` };
    }),
  // 测试 API 连接
  testConnection: publicProcedure
    .input(z.object({
      exchange: z.string(),
      apiKey: z.string(),
      apiSecret: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (input.exchange.toLowerCase() === 'binance') {
        return await testBinanceConnection(input.apiKey, input.apiSecret);
      }
      return { success: false, latency: 0, error: `Exchange ${input.exchange} not supported yet` };
    }),
  // 使用默认 Key 测试连接
  testDefaultConnection: publicProcedure.query(async () => {
    return await testBinanceConnection();
  }),
});

// ─── Risk Router ───────────────────────────────────────────────────
export const riskRouter = router({
  get: publicProcedure.query(async () => {
    return db.getRiskMetrics();
  }),
  update: publicProcedure
    .input(z.object({
      portfolioVar: z.number().optional(),
      maxDrawdown: z.number().optional(),
      sharpeRatio: z.number().optional(),
      sortinoRatio: z.number().optional(),
      beta: z.number().optional(),
      alpha: z.number().optional(),
      correlation: z.number().optional(),
      leverage: z.number().optional(),
      marginUsage: z.number().optional(),
      liquidationRisk: z.string().optional(),
      riskScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertRiskMetrics(input);
      return { success: true };
    }),
});

// ─── Config Router ─────────────────────────────────────────────────
export const configRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllConfigs();
  }),
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      return db.getConfig(input.key);
    }),
  set: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.setConfig(input.key, input.value, input.description);
      return { success: true };
    }),
});

// ─── Alpha Factors Router ──────────────────────────────────────────
export const alphaFactorsRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllAlphaFactors();
  }),
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      category: z.string(),
      ic: z.number().optional(),
      sharpe: z.number().optional(),
      turnover: z.number().optional(),
      status: z.enum(["活跃", "测试中", "已停用"]).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createAlphaFactor(input);
      return { success: true };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        ic: z.number().optional(),
        sharpe: z.number().optional(),
        turnover: z.number().optional(),
        status: z.enum(["活跃", "测试中", "已停用"]).optional(),
        description: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateAlphaFactor(input.id, input.data);
      return { success: true };
    }),
});

// ─── Auto Order Router ───────────────────────────────────────────
export const autoOrderRouter = router({
  /** 获取引擎运行状态 */
  getStatus: publicProcedure.query(async () => {
    const { getEngineStatus } = await import('./autoOrderService');
    return getEngineStatus();
  }),

  /** 获取当前配置 */
  getConfig: publicProcedure.query(async () => {
    const { getConfig } = await import('./autoOrderService');
    return getConfig();
  }),

  /** 更新配置（含开关） */
  updateConfig: publicProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      mode: z.enum(['simulated', 'production']).optional(),
      capitalPct: z.number().min(1).max(100).optional(),
      takeProfitPct: z.number().min(0.1).max(100).optional(),
      stopLossPct: z.number().min(0.1).max(100).optional(),
      maxPositions: z.number().min(1).max(50).optional(),
      cooldownMs: z.number().min(0).optional(),
      minConfidence: z.number().min(0).max(100).optional(),
      watchSymbols: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { updateConfig } = await import('./autoOrderService');
      return updateConfig(input);
    }),

  /** 获取当前持仓 */
  getOpenPositions: publicProcedure.query(async () => {
    const { getOpenPositions } = await import('./autoOrderService');
    return getOpenPositions();
  }),

  /** 获取已平仓记录 */
  getClosedPositions: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { getClosedPositions } = await import('./autoOrderService');
      return getClosedPositions(input.limit ?? 50);
    }),

  /** 获取操作日志 */
  getOrderLogs: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { getOrderLogs } = await import('./autoOrderService');
      return getOrderLogs(input.limit ?? 100);
    }),

  /** 获取自我学习统计 */
  getLearningStats: publicProcedure.query(async () => {
    const { getLearningStats } = await import('./autoOrderService');
    return getLearningStats();
  }),

  /** 获取当前信号快照 */
  getSignals: publicProcedure.query(async () => {
    const { getSignalSnapshot } = await import('./autoOrderService');
    return getSignalSnapshot();
  }),

  /** 手动平仓 */
  manualClose: publicProcedure
    .input(z.object({ positionId: z.string() }))
    .mutation(async ({ input }) => {
      const { manualClose } = await import('./autoOrderService');
      return manualClose(input.positionId);
    }),

  /** 清空引擎所有数据并停止引擎 */
  resetAll: publicProcedure
    .mutation(async () => {
      const { resetAll } = await import('./autoOrderService');
      resetAll();
      return { success: true, message: '自动下单引擎数据已全部清空' };
    }),
});

export const tradingRouter = router({
  // 模拟账户管理
  resetSimulatedAccount: publicProcedure
    .input(z.object({ balance: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { resetAccount } = await import('./simulatedTradingService');
      const balance = input.balance !== undefined ? input.balance : 10000;
      resetAccount('default', balance);
      return { success: true, message: `模拟账户已重置为 ${balance} USDT` };
    }),
  
  getSimulatedBalance: publicProcedure
    .query(async () => {
      const { getAccountBalance } = await import('./simulatedTradingService');
      return await getAccountBalance('default');
    }),
  
  getSimulatedStats: publicProcedure
    .query(async () => {
      const { getAccountStats } = await import('./simulatedTradingService');
      return await getAccountStats('default');
    }),
});

// ─── Full Auto Engine Router ───────────────────────────────────────────────
export const fullAutoRouter = router({
  /** 获取引擎状态 */
  getStatus: publicProcedure
    .query(async () => {
      const { getFullAutoStatus } = await import('./fullAutoEngine');
      return getFullAutoStatus();
    }),
  /** 获取配置 */
  getConfig: publicProcedure
    .query(async () => {
      const { getFullAutoConfig } = await import('./fullAutoEngine');
      return getFullAutoConfig();
    }),
  /** 更新配置（含启停） */
  updateConfig: publicProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      capitalPctPerTrade: z.number().optional(),
      maxPositions: z.number().optional(),
      takeProfitPct: z.number().optional(),
      stopLossPct: z.number().optional(),
      trailingStop: z.boolean().optional(),
      trailingStopPct: z.number().optional(),
      cooldownMs: z.number().optional(),
      minAiConfidence: z.number().optional(),
      enabledStrategies: z.array(z.string()).optional(),
      watchSymbols: z.array(z.string()).optional(),
      regimeAdaptive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { updateFullAutoConfig } = await import('./fullAutoEngine');
      return updateFullAutoConfig(input as any);
    }),
  /** 获取当前持仓 */
  getPositions: publicProcedure
    .query(async () => {
      const { getFullAutoPositions } = await import('./fullAutoEngine');
      return getFullAutoPositions();
    }),
  /** 获取已平仓记录 */
  getClosedPositions: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { getFullAutoClosedPositions } = await import('./fullAutoEngine');
      return getFullAutoClosedPositions(input.limit ?? 100);
    }),
  /** 获取操作日志 */
  getLogs: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { getFullAutoLogs } = await import('./fullAutoEngine');
      return getFullAutoLogs(input.limit ?? 200);
    }),
  /** 获取策略权重（自我学习结果） */
  getStrategyWeights: publicProcedure
    .query(async () => {
      const { getStrategyWeights } = await import('./fullAutoEngine');
      return getStrategyWeights();
    }),
  /** 获取因子快照 */
  getFactorSnapshots: publicProcedure
    .query(async () => {
      const { getAllFactorSnapshots } = await import('./fullAutoEngine');
      return getAllFactorSnapshots();
    }),
  /** 手动平仓 */
  manualClose: publicProcedure
    .input(z.object({ positionId: z.string() }))
    .mutation(async ({ input }) => {
      const { manualClosePosition } = await import('./fullAutoEngine');
      return manualClosePosition(input.positionId);
    }),
  /** 重置引擎 */
  reset: publicProcedure
    .mutation(async () => {
      const { resetFullAutoEngine } = await import('./fullAutoEngine');
      resetFullAutoEngine();
      return { success: true, message: '全自动引擎已重置' };
    }),
});
