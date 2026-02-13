import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Coins ──────────────────────────────────────────────────────────
export const coins = mysqlTable("coins", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  category: varchar("category", { length: 32 }).notNull().default("主流币"),
  price: float("price").notNull().default(0),
  change24h: float("change24h").notNull().default(0),
  volume: float("volume").notNull().default(0),
  marketCap: varchar("marketCap", { length: 32 }).default(""),
  aiSignal: mysqlEnum("aiSignal", ["买入", "卖出", "持有", "强烈买入", "强烈卖出"]).default("持有").notNull(),
  aiConfidence: float("aiConfidence").notNull().default(50),
  riskLevel: mysqlEnum("riskLevel", ["低", "中", "高"]).default("中").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Coin = typeof coins.$inferSelect;
export type InsertCoin = typeof coins.$inferInsert;

// ─── Strategies ─────────────────────────────────────────────────────
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: varchar("type", { length: 64 }).notNull().default("网格交易"),
  status: mysqlEnum("status", ["运行中", "已暂停", "回测中", "已停止"]).default("已暂停").notNull(),
  coins: varchar("coins", { length: 256 }).notNull().default("BTC"),
  pnl: float("pnl").notNull().default(0),
  pnlPercent: float("pnlPercent").notNull().default(0),
  winRate: float("winRate").notNull().default(0),
  sharpe: float("sharpe").notNull().default(0),
  trades: int("trades").notNull().default(0),
  riskLevel: mysqlEnum("riskLevel", ["低", "中", "高"]).default("中").notNull(),
  description: text("description"),
  params: json("params"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

// ─── Trades ─────────────────────────────────────────────────────────
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  coin: varchar("coin", { length: 32 }).notNull(),
  type: mysqlEnum("type", ["买入", "卖出"]).notNull(),
  price: float("price").notNull(),
  amount: float("amount").notNull(),
  total: float("total").notNull(),
  strategyId: int("strategyId"),
  strategyName: varchar("strategyName", { length: 128 }),
  status: mysqlEnum("tradeStatus", ["已完成", "待执行", "已取消", "执行中"]).default("已完成").notNull(),
  pnl: float("pnl").default(0),
  fee: float("fee").default(0),
  exchange: varchar("exchange", { length: 64 }).default("Binance"),
  aiConfidence: float("aiConfidence"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// ─── AI Models ──────────────────────────────────────────────────────
export const aiModels = mysqlTable("ai_models", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 64 }).notNull(),
  accuracy: float("accuracy").notNull().default(0),
  winRate: float("winRate").notNull().default(0),
  sharpe: float("sharpe").notNull().default(0),
  latency: float("latency").notNull().default(0),
  pnl: float("pnl").notNull().default(0),
  tradesCount: int("tradesCount").notNull().default(0),
  weight: float("weight").notNull().default(0),
  status: mysqlEnum("modelStatus", ["主力", "辅助", "备用", "降级", "观察"]).default("备用").notNull(),
  score: float("score").notNull().default(0),
  aiRank: int("aiRank").notNull().default(0),
  streak: int("streak").notNull().default(0),
  cooldown: boolean("cooldown").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AIModel = typeof aiModels.$inferSelect;
export type InsertAIModel = typeof aiModels.$inferInsert;

// ─── AI Scheduler Events ────────────────────────────────────────────
export const aiSchedulerEvents = mysqlTable("ai_scheduler_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["promote", "demote", "rebalance", "alert", "cooldown", "emergency"]).notNull(),
  fromModel: varchar("fromModel", { length: 64 }).notNull(),
  toModel: varchar("toModel", { length: 64 }).notNull(),
  reason: text("reason").notNull(),
  metricsAccuracy: float("metricsAccuracy").default(0),
  metricsWinRate: float("metricsWinRate").default(0),
  metricsScore: float("metricsScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AISchedulerEvent = typeof aiSchedulerEvents.$inferSelect;
export type InsertAISchedulerEvent = typeof aiSchedulerEvents.$inferInsert;

// ─── Alerts ─────────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  severity: mysqlEnum("severity", ["critical", "warning", "info", "success"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  strategy: varchar("strategy", { length: 128 }),
  coin: varchar("coin", { length: 32 }),
  value: varchar("value", { length: 128 }),
  acknowledged: boolean("acknowledged").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ─── Portfolio ──────────────────────────────────────────────────────
export const portfolio = mysqlTable("portfolio", {
  id: int("id").autoincrement().primaryKey(),
  totalValue: float("totalValue").notNull().default(0),
  dailyPnl: float("dailyPnl").notNull().default(0),
  dailyPnlPercent: float("dailyPnlPercent").notNull().default(0),
  totalPnl: float("totalPnl").notNull().default(0),
  totalPnlPercent: float("totalPnlPercent").notNull().default(0),
  winRate: float("winRate").notNull().default(0),
  sharpe: float("sharpe").notNull().default(0),
  maxDrawdown: float("maxDrawdown").notNull().default(0),
  totalTrades: int("totalTrades").notNull().default(0),
  activeSince: varchar("activeSince", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = typeof portfolio.$inferInsert;

// ─── Exchanges ──────────────────────────────────────────────────────
export const exchanges = mysqlTable("exchanges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  status: mysqlEnum("exchangeStatus", ["已连接", "连接中", "未连接", "错误"]).default("未连接").notNull(),
  apiLatency: float("apiLatency").default(0),
  dailyVolume: float("dailyVolume").default(0),
  pairs: int("pairs").default(0),
  fee: float("fee").default(0),
  isActive: boolean("isActive").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Exchange = typeof exchanges.$inferSelect;
export type InsertExchange = typeof exchanges.$inferInsert;

// ─── Risk Metrics ───────────────────────────────────────────────────
export const riskMetrics = mysqlTable("risk_metrics", {
  id: int("id").autoincrement().primaryKey(),
  portfolioVar: float("portfolioVar").notNull().default(0),
  maxDrawdown: float("maxDrawdown").notNull().default(0),
  sharpeRatio: float("sharpeRatio").notNull().default(0),
  sortinoRatio: float("sortinoRatio").notNull().default(0),
  beta: float("beta").notNull().default(0),
  alpha: float("alpha").notNull().default(0),
  correlation: float("correlation").notNull().default(0),
  leverage: float("leverage").notNull().default(0),
  marginUsage: float("marginUsage").notNull().default(0),
  liquidationRisk: varchar("liquidationRisk", { length: 16 }).default("低"),
  riskScore: float("riskScore").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RiskMetric = typeof riskMetrics.$inferSelect;
export type InsertRiskMetric = typeof riskMetrics.$inferInsert;

// ─── System Config ──────────────────────────────────────────────────
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 128 }).notNull().unique(),
  configValue: text("configValue").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// ─── Alpha Factors ──────────────────────────────────────────────────
export const alphaFactors = mysqlTable("alpha_factors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  ic: float("ic").notNull().default(0),
  sharpe: float("sharpe").notNull().default(0),
  turnover: float("turnover").notNull().default(0),
  status: mysqlEnum("factorStatus", ["活跃", "测试中", "已停用"]).default("活跃").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AlphaFactor = typeof alphaFactors.$inferSelect;
export type InsertAlphaFactor = typeof alphaFactors.$inferInsert;