import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  coins, InsertCoin,
  strategies, InsertStrategy,
  trades, InsertTrade,
  aiModels, InsertAIModel,
  aiSchedulerEvents, InsertAISchedulerEvent,
  alerts, InsertAlert,
  portfolio, InsertPortfolio,
  exchanges, InsertExchange,
  riskMetrics, InsertRiskMetric,
  systemConfig, InsertSystemConfig,
  alphaFactors, InsertAlphaFactor,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Coins ──────────────────────────────────────────────────────────
export async function getAllCoins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coins).where(eq(coins.isActive, true)).orderBy(asc(coins.id));
}

export async function getCoinBySymbol(symbol: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coins).where(eq(coins.symbol, symbol)).limit(1);
  return result[0];
}

export async function upsertCoin(coin: InsertCoin) {
  const db = await getDb();
  if (!db) return;
  await db.insert(coins).values(coin).onDuplicateKeyUpdate({
    set: { ...coin, symbol: undefined } as any,
  });
}

export async function bulkUpsertCoins(coinList: InsertCoin[]) {
  const db = await getDb();
  if (!db) return;
  for (const coin of coinList) {
    await upsertCoin(coin);
  }
}

// ─── Strategies ─────────────────────────────────────────────────────
export async function getAllStrategies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategies).orderBy(desc(strategies.updatedAt));
}

export async function getStrategyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(strategies).where(eq(strategies.id, id)).limit(1);
  return result[0];
}

export async function createStrategy(strategy: InsertStrategy) {
  const db = await getDb();
  if (!db) return;
  await db.insert(strategies).values(strategy);
}

export async function updateStrategy(id: number, data: Partial<InsertStrategy>) {
  const db = await getDb();
  if (!db) return;
  await db.update(strategies).set(data).where(eq(strategies.id, id));
}

// ─── Trades ─────────────────────────────────────────────────────────
export async function getAllTrades(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trades).orderBy(desc(trades.executedAt)).limit(limit);
}

export async function createTrade(trade: InsertTrade) {
  const db = await getDb();
  if (!db) return;
  await db.insert(trades).values(trade);
}

export async function getTradesByStrategy(strategyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trades).where(eq(trades.strategyId, strategyId)).orderBy(desc(trades.executedAt));
}

// ─── AI Models ──────────────────────────────────────────────────────
export async function getAllAIModels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiModels).where(eq(aiModels.isActive, true)).orderBy(desc(aiModels.score));
}

export async function upsertAIModel(model: InsertAIModel) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiModels).values(model).onDuplicateKeyUpdate({
    set: { ...model, name: undefined } as any,
  });
}

export async function updateAIModel(id: number, data: Partial<InsertAIModel>) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiModels).set(data).where(eq(aiModels.id, id));
}

// ─── AI Scheduler Events ────────────────────────────────────────────
export async function getSchedulerEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiSchedulerEvents).orderBy(desc(aiSchedulerEvents.createdAt)).limit(limit);
}

export async function createSchedulerEvent(event: InsertAISchedulerEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiSchedulerEvents).values(event);
}

// ─── Alerts ─────────────────────────────────────────────────────────
export async function getAllAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(limit);
}

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alerts).values(alert);
}

export async function acknowledgeAlert(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ acknowledged: true }).where(eq(alerts.id, id));
}

export async function acknowledgeAllAlerts() {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ acknowledged: true });
}

// ─── Portfolio ──────────────────────────────────────────────────────
export async function getPortfolio() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolio).limit(1);
  return result[0];
}

export async function upsertPortfolio(data: InsertPortfolio) {
  const db = await getDb();
  if (!db) return;
  const existing = await getPortfolio();
  if (existing) {
    await db.update(portfolio).set(data).where(eq(portfolio.id, existing.id));
  } else {
    await db.insert(portfolio).values(data);
  }
}

// ─── Exchanges ──────────────────────────────────────────────────────
export async function getAllExchanges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exchanges).orderBy(asc(exchanges.id));
}

export async function upsertExchange(data: InsertExchange) {
  const db = await getDb();
  if (!db) return;
  await db.insert(exchanges).values(data).onDuplicateKeyUpdate({
    set: data as any,
  });
}

// ─── Risk Metrics ───────────────────────────────────────────────────
export async function getRiskMetrics() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(riskMetrics).limit(1);
  return result[0];
}

export async function upsertRiskMetrics(data: InsertRiskMetric) {
  const db = await getDb();
  if (!db) return;
  const existing = await getRiskMetrics();
  if (existing) {
    await db.update(riskMetrics).set(data).where(eq(riskMetrics.id, existing.id));
  } else {
    await db.insert(riskMetrics).values(data);
  }
}

// ─── System Config ──────────────────────────────────────────────────
export async function getConfig(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(systemConfig).where(eq(systemConfig.configKey, key)).limit(1);
  return result[0];
}

export async function setConfig(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemConfig).values({ configKey: key, configValue: value, description }).onDuplicateKeyUpdate({
    set: { configValue: value, description },
  });
}

export async function getAllConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemConfig).orderBy(asc(systemConfig.configKey));
}

// ─── Alpha Factors ──────────────────────────────────────────────────
export async function getAllAlphaFactors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alphaFactors).orderBy(desc(alphaFactors.updatedAt));
}

export async function createAlphaFactor(factor: InsertAlphaFactor) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alphaFactors).values(factor);
}

export async function updateAlphaFactor(id: number, data: Partial<InsertAlphaFactor>) {
  const db = await getDb();
  if (!db) return;
  await db.update(alphaFactors).set(data).where(eq(alphaFactors.id, id));
}
