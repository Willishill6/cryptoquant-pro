/**
 * Database Seed Script
 * 初始化数据库种子数据：币种、策略、AI模型、交易记录、告警等
 * 运行方式: npx tsx server/seed.ts
 */
import * as db from "./db";

async function seed() {
  console.log("[Seed] Starting database seed...");

  // ─── Coins ──────────────────────────────────────────────────────
  const coinData = [
    { symbol: "BTC", name: "Bitcoin", category: "主流币", price: 97845.32, change24h: 2.34, volume: 28500000000, marketCap: "$1.92T", aiSignal: "强烈买入" as const, aiConfidence: 94.5, riskLevel: "低" as const },
    { symbol: "ETH", name: "Ethereum", category: "主流币", price: 3456.78, change24h: 1.56, volume: 15200000000, marketCap: "$415B", aiSignal: "买入" as const, aiConfidence: 88.2, riskLevel: "低" as const },
    { symbol: "SOL", name: "Solana", category: "基础设施", price: 198.45, change24h: 5.67, volume: 4800000000, marketCap: "$92B", aiSignal: "强烈买入" as const, aiConfidence: 91.3, riskLevel: "中" as const },
    { symbol: "BNB", name: "BNB", category: "基础设施", price: 645.23, change24h: 0.89, volume: 2100000000, marketCap: "$96B", aiSignal: "持有" as const, aiConfidence: 72.1, riskLevel: "低" as const },
    { symbol: "XRP", name: "Ripple", category: "跨链", price: 2.34, change24h: -1.23, volume: 3200000000, marketCap: "$134B", aiSignal: "持有" as const, aiConfidence: 65.8, riskLevel: "中" as const },
    { symbol: "ADA", name: "Cardano", category: "基础设施", price: 0.98, change24h: 3.45, volume: 1500000000, marketCap: "$34B", aiSignal: "买入" as const, aiConfidence: 78.5, riskLevel: "中" as const },
    { symbol: "AVAX", name: "Avalanche", category: "基础设施", price: 38.67, change24h: 4.12, volume: 890000000, marketCap: "$15B", aiSignal: "买入" as const, aiConfidence: 82.3, riskLevel: "中" as const },
    { symbol: "DOGE", name: "Dogecoin", category: "Meme币", price: 0.342, change24h: -2.56, volume: 2800000000, marketCap: "$49B", aiSignal: "卖出" as const, aiConfidence: 71.2, riskLevel: "高" as const },
    { symbol: "DOT", name: "Polkadot", category: "跨链", price: 7.89, change24h: 1.78, volume: 560000000, marketCap: "$10B", aiSignal: "持有" as const, aiConfidence: 68.9, riskLevel: "中" as const },
    { symbol: "LINK", name: "Chainlink", category: "预言机", price: 18.45, change24h: 2.89, volume: 780000000, marketCap: "$11B", aiSignal: "买入" as const, aiConfidence: 85.6, riskLevel: "中" as const },
    { symbol: "UNI", name: "Uniswap", category: "DeFi", price: 12.34, change24h: -0.67, volume: 340000000, marketCap: "$7.4B", aiSignal: "持有" as const, aiConfidence: 62.4, riskLevel: "中" as const },
    { symbol: "MATIC", name: "Polygon", category: "Layer2", price: 0.89, change24h: 1.23, volume: 450000000, marketCap: "$8.8B", aiSignal: "买入" as const, aiConfidence: 76.8, riskLevel: "中" as const },
    { symbol: "ATOM", name: "Cosmos", category: "跨链", price: 9.56, change24h: 0.45, volume: 320000000, marketCap: "$3.7B", aiSignal: "持有" as const, aiConfidence: 58.3, riskLevel: "中" as const },
    { symbol: "APT", name: "Aptos", category: "基础设施", price: 12.78, change24h: 6.78, volume: 280000000, marketCap: "$5.6B", aiSignal: "强烈买入" as const, aiConfidence: 89.1, riskLevel: "中" as const },
    { symbol: "ARB", name: "Arbitrum", category: "Layer2", price: 1.56, change24h: 3.21, volume: 520000000, marketCap: "$7.8B", aiSignal: "买入" as const, aiConfidence: 83.4, riskLevel: "中" as const },
    { symbol: "OP", name: "Optimism", category: "Layer2", price: 2.89, change24h: 2.34, volume: 380000000, marketCap: "$3.4B", aiSignal: "买入" as const, aiConfidence: 79.2, riskLevel: "中" as const },
    { symbol: "FIL", name: "Filecoin", category: "存储", price: 6.78, change24h: -1.89, volume: 290000000, marketCap: "$3.8B", aiSignal: "持有" as const, aiConfidence: 55.6, riskLevel: "中" as const },
    { symbol: "NEAR", name: "NEAR Protocol", category: "基础设施", price: 5.67, change24h: 4.56, volume: 410000000, marketCap: "$6.2B", aiSignal: "买入" as const, aiConfidence: 81.7, riskLevel: "中" as const },
    { symbol: "AAVE", name: "Aave", category: "DeFi", price: 289.45, change24h: 1.67, volume: 180000000, marketCap: "$4.3B", aiSignal: "买入" as const, aiConfidence: 77.3, riskLevel: "中" as const },
    { symbol: "INJ", name: "Injective", category: "DeFi", price: 34.56, change24h: 7.89, volume: 350000000, marketCap: "$3.2B", aiSignal: "强烈买入" as const, aiConfidence: 92.1, riskLevel: "高" as const },
  ];
  console.log("[Seed] Seeding coins...");
  await db.bulkUpsertCoins(coinData);

  // ─── Strategies ─────────────────────────────────────────────────
  const strategyData = [
    { name: "BTC网格交易策略", type: "网格交易", status: "运行中" as const, coins: "BTC", pnl: 12450.5, pnlPercent: 15.2, winRate: 73.5, sharpe: 2.45, trades: 1247, riskLevel: "低" as const, description: "在BTC价格区间内自动挂单，低买高卖" },
    { name: "ETH趋势跟随策略", type: "趋势跟踪", status: "运行中" as const, coins: "ETH", pnl: 8920.3, pnlPercent: 11.8, winRate: 68.2, sharpe: 2.12, trades: 856, riskLevel: "中" as const, description: "基于EMA/MACD的趋势跟随策略" },
    { name: "多因子Alpha策略", type: "因子选股", status: "运行中" as const, coins: "BTC,ETH,SOL,AVAX", pnl: 23560.8, pnlPercent: 28.4, winRate: 71.5, sharpe: 2.85, trades: 2134, riskLevel: "中" as const, description: "基于多因子模型的Alpha策略" },
    { name: "SOL-AVAX配对策略", type: "配对交易", status: "运行中" as const, coins: "SOL,AVAX", pnl: 5670.2, pnlPercent: 8.9, winRate: 65.8, sharpe: 1.98, trades: 567, riskLevel: "中" as const, description: "SOL与AVAX的统计套利策略" },
    { name: "DeFi流动性挖矿策略", type: "DeFi", status: "运行中" as const, coins: "ETH,UNI,AAVE", pnl: 4230.6, pnlPercent: 6.5, winRate: 82.3, sharpe: 1.75, trades: 345, riskLevel: "高" as const, description: "自动化DeFi流动性提供和收益聚合" },
    { name: "AI动量策略", type: "动量交易", status: "运行中" as const, coins: "BTC,ETH,SOL", pnl: 15890.4, pnlPercent: 19.2, winRate: 69.8, sharpe: 2.55, trades: 1890, riskLevel: "中" as const, description: "AI驱动的动量因子交易策略" },
    { name: "跨交易所套利", type: "套利", status: "运行中" as const, coins: "BTC,ETH", pnl: 3450.1, pnlPercent: 4.2, winRate: 91.2, sharpe: 3.12, trades: 4567, riskLevel: "低" as const, description: "跨交易所价差套利" },
    { name: "DOGE波段策略", type: "波段交易", status: "已暂停" as const, coins: "DOGE", pnl: -1230.5, pnlPercent: -3.4, winRate: 45.6, sharpe: 0.85, trades: 234, riskLevel: "高" as const, description: "DOGE短期波段交易（已暂停）" },
    { name: "Layer2生态策略", type: "主题投资", status: "运行中" as const, coins: "ARB,OP,MATIC", pnl: 6780.9, pnlPercent: 12.3, winRate: 67.4, sharpe: 2.08, trades: 678, riskLevel: "中" as const, description: "Layer2生态代币轮动策略" },
    { name: "高频做市策略", type: "做市", status: "回测中" as const, coins: "BTC,ETH", pnl: 0, pnlPercent: 0, winRate: 0, sharpe: 0, trades: 0, riskLevel: "高" as const, description: "高频做市策略（回测中）" },
    { name: "全天候对冲策略", type: "对冲", status: "运行中" as const, coins: "BTC,ETH,SOL,BNB", pnl: 9870.3, pnlPercent: 7.8, winRate: 76.5, sharpe: 2.32, trades: 1567, riskLevel: "低" as const, description: "多空对冲的全天候策略" },
  ];
  console.log("[Seed] Seeding strategies...");
  for (const s of strategyData) {
    await db.createStrategy(s);
  }

  // ─── AI Models ──────────────────────────────────────────────────
  const aiModelData = [
    { name: "DeepSeek-V3", type: "大语言模型", accuracy: 94.8, winRate: 74.2, sharpe: 2.55, latency: 95, pnl: 28450, tradesCount: 1247, weight: 0.30, status: "主力" as const, score: 94.5, aiRank: 1, streak: 5 },
    { name: "GPT-4o", type: "多模态模型", accuracy: 93.5, winRate: 71.5, sharpe: 2.42, latency: 180, pnl: 22100, tradesCount: 1102, weight: 0.22, status: "辅助" as const, score: 91.2, aiRank: 2, streak: 3 },
    { name: "TFT", type: "时序预测", accuracy: 93.2, winRate: 73.5, sharpe: 2.62, latency: 18, pnl: 25600, tradesCount: 2456, weight: 0.15, status: "主力" as const, score: 92.1, aiRank: 3, streak: 4 },
    { name: "LSTM-Attention", type: "序列记忆", accuracy: 92.5, winRate: 70.1, sharpe: 2.52, latency: 15, pnl: 19800, tradesCount: 980, weight: 0.08, status: "辅助" as const, score: 88.2, aiRank: 4, streak: 2 },
    { name: "PatchTST", type: "长序列预测", accuracy: 91.8, winRate: 72.8, sharpe: 2.48, latency: 12, pnl: 18200, tradesCount: 1856, weight: 0.05, status: "辅助" as const, score: 87.5, aiRank: 5, streak: 1 },
    { name: "XGBoost-Alpha", type: "因子优化", accuracy: 90.5, winRate: 69.8, sharpe: 2.35, latency: 8, pnl: 15400, tradesCount: 3245, weight: 0.10, status: "辅助" as const, score: 85.3, aiRank: 6, streak: 0 },
    { name: "PPO-Portfolio", type: "强化学习", accuracy: 89.8, winRate: 68.5, sharpe: 2.28, latency: 8, pnl: 12800, tradesCount: 890, weight: 0.05, status: "辅助" as const, score: 82.1, aiRank: 7, streak: -1 },
    { name: "FinBERT-Crypto", type: "金融NLP", accuracy: 87.5, winRate: 65.2, sharpe: 1.95, latency: 25, pnl: 8900, tradesCount: 1567, weight: 0.03, status: "备用" as const, score: 78.5, aiRank: 8, streak: -2 },
    { name: "Claude 3.5", type: "大语言模型", accuracy: 92.8, winRate: 70.8, sharpe: 2.38, latency: 95, pnl: 20500, tradesCount: 1185, weight: 0.02, status: "备用" as const, score: 86.8, aiRank: 9, streak: 1 },
  ];
  console.log("[Seed] Seeding AI models...");
  for (const m of aiModelData) {
    await db.upsertAIModel(m);
  }

  // ─── Portfolio ──────────────────────────────────────────────────
  console.log("[Seed] Seeding portfolio...");
  await db.upsertPortfolio({
    totalValue: 2458932.50,
    dailyPnl: 12845.30,
    dailyPnlPercent: 2.34,
    totalPnl: 458932.50,
    totalPnlPercent: 22.95,
    winRate: 73.5,
    sharpe: 2.45,
    maxDrawdown: 8.2,
    totalTrades: 15678,
    activeSince: "2024-01-15",
  });

  // ─── Exchanges ──────────────────────────────────────────────────
  const exchangeData = [
    { name: "Binance", status: "已连接" as const, apiLatency: 12, dailyVolume: 28500000000, pairs: 1245, fee: 0.1, isActive: true },
    { name: "OKX", status: "已连接" as const, apiLatency: 18, dailyVolume: 12300000000, pairs: 890, fee: 0.08, isActive: true },
    { name: "Bybit", status: "已连接" as const, apiLatency: 15, dailyVolume: 8900000000, pairs: 678, fee: 0.1, isActive: true },
    { name: "Coinbase", status: "连接中" as const, apiLatency: 45, dailyVolume: 5600000000, pairs: 456, fee: 0.15, isActive: false },
    { name: "Kraken", status: "未连接" as const, apiLatency: 0, dailyVolume: 3200000000, pairs: 345, fee: 0.12, isActive: false },
  ];
  console.log("[Seed] Seeding exchanges...");
  for (const e of exchangeData) {
    await db.upsertExchange(e);
  }

  // ─── Risk Metrics ───────────────────────────────────────────────
  console.log("[Seed] Seeding risk metrics...");
  await db.upsertRiskMetrics({
    portfolioVar: 45200,
    maxDrawdown: 8.2,
    sharpeRatio: 2.45,
    sortinoRatio: 3.12,
    beta: 0.85,
    alpha: 12.5,
    correlation: 0.72,
    leverage: 2.8,
    marginUsage: 45.6,
    liquidationRisk: "低",
    riskScore: 35,
  });

  // ─── Trades ─────────────────────────────────────────────────────
  const tradeCoins = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "DOGE", "DOT", "LINK"];
  const tradeStrategies = ["BTC网格交易策略", "ETH趋势跟随策略", "多因子Alpha策略", "AI动量策略", "跨交易所套利"];
  console.log("[Seed] Seeding trades...");
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const coin = tradeCoins[Math.floor(Math.random() * tradeCoins.length)];
    const strategy = tradeStrategies[Math.floor(Math.random() * tradeStrategies.length)];
    const type = Math.random() > 0.45 ? "买入" as const : "卖出" as const;
    const price = coin === "BTC" ? 95000 + Math.random() * 5000 : coin === "ETH" ? 3200 + Math.random() * 500 : Math.random() * 200;
    const amount = Math.random() * 10;
    const pnl = (Math.random() - 0.4) * 500;
    await db.createTrade({
      coin,
      type,
      price: Math.round(price * 100) / 100,
      amount: Math.round(amount * 10000) / 10000,
      total: Math.round(price * amount * 100) / 100,
      strategyName: strategy,
      pnl: Math.round(pnl * 100) / 100,
      fee: Math.round(price * amount * 0.001 * 100) / 100,
      exchange: "Binance",
      aiConfidence: 60 + Math.random() * 35,
      executedAt: new Date(now - i * 300000 - Math.random() * 60000),
    });
  }

  // ─── Alerts ─────────────────────────────────────────────────────
  const alertData = [
    { severity: "critical" as const, category: "risk", title: "保证金率预警", message: "BTC永续合约保证金率降至15%，低于安全阈值20%，请注意风险", coin: "BTC", value: "15%" },
    { severity: "critical" as const, category: "position", title: "仓位集中度过高", message: "BTC仓位占比达35%，超过单币种上限30%，请及时调整", coin: "BTC", value: "35% > 30%" },
    { severity: "warning" as const, category: "position", title: "杠杆预警", message: "ETH趋势跟随策略实际杠杆达4.2x，接近上限5x", strategy: "ETH趋势跟随策略", coin: "ETH", value: "4.2x" },
    { severity: "warning" as const, category: "risk", title: "VaR突破", message: "组合24h VaR达$45,200，超过预设阈值$40,000", value: "$45,200" },
    { severity: "warning" as const, category: "defi", title: "DeFi协议异常", message: "Uniswap V3 ETH/USDC池滑点异常增大，流动性提供策略暂停", strategy: "DeFi流动性挖矿策略", value: "滑点 2.3%" },
    { severity: "info" as const, category: "ai_signal", title: "AI模型更新", message: "DeepSeek-V3完成第2,148代自我进化，预测准确率提升至94.5%", value: "+0.3%" },
    { severity: "info" as const, category: "system", title: "策略参数优化", message: "贝叶斯优化器为BTC网格策略找到更优参数组合，Sharpe提升0.12", strategy: "BTC网格交易策略", value: "+0.12 Sharpe" },
    { severity: "success" as const, category: "system", title: "止盈执行", message: "多因子Alpha策略NEAR仓位达到目标收益+15%，已自动止盈", strategy: "多因子Alpha策略", coin: "NEAR", value: "+$4,230" },
    { severity: "success" as const, category: "ai_signal", title: "AI预测命中", message: "DeepSeek-V3准确预测BTC突破$100K关口，趋势策略获利$8,500", coin: "BTC", value: "+$8,500" },
    { severity: "success" as const, category: "defi", title: "DeFi收益到账", message: "Curve流动性挖矿奖励已自动复投，本周DeFi总收益$2,340", value: "+$2,340" },
  ];
  console.log("[Seed] Seeding alerts...");
  for (let i = 0; i < alertData.length; i++) {
    await db.createAlert({
      ...alertData[i],
      acknowledged: i >= 5,
    });
  }

  // ─── AI Scheduler Events ────────────────────────────────────────
  const schedulerEventData = [
    { eventType: "rebalance" as const, fromModel: "系统", toModel: "全部模型", reason: "系统启动，初始化权重分配", metricsAccuracy: 0, metricsWinRate: 0, metricsScore: 0 },
    { eventType: "promote" as const, fromModel: "TFT", toModel: "TFT", reason: "TFT夏普比率2.62领先，提升为时序预测主力", metricsAccuracy: 93.2, metricsWinRate: 73.5, metricsScore: 92.1 },
    { eventType: "rebalance" as const, fromModel: "DeepSeek-V3", toModel: "DeepSeek-V3", reason: "DeepSeek-V3准确率94.8%持续领先，权重+2%", metricsAccuracy: 94.8, metricsWinRate: 74.2, metricsScore: 94.5 },
    { eventType: "promote" as const, fromModel: "LSTM-Attention", toModel: "LSTM-Attention", reason: "LSTM-Attention延迟仅15ms且准确率92.5%，提升为辅助主力", metricsAccuracy: 92.5, metricsWinRate: 70.1, metricsScore: 88.2 },
    { eventType: "demote" as const, fromModel: "FinBERT-Crypto", toModel: "FinBERT-Crypto", reason: "FinBERT-Crypto胜率降至65.2%，降级为备用", metricsAccuracy: 87.5, metricsWinRate: 65.2, metricsScore: 78.5 },
    { eventType: "alert" as const, fromModel: "调度引擎", toModel: "全部模型", reason: "市场波动率上升，切换至保守调度模式", metricsAccuracy: 0, metricsWinRate: 0, metricsScore: 0 },
  ];
  console.log("[Seed] Seeding AI scheduler events...");
  for (const e of schedulerEventData) {
    await db.createSchedulerEvent(e);
  }

  // ─── Alpha Factors ──────────────────────────────────────────────
  const factorData = [
    { name: "价格动量因子", category: "技术面", ic: 0.085, sharpe: 2.34, turnover: 0.45, status: "活跃" as const, description: "基于多周期价格动量的复合因子" },
    { name: "波动率因子", category: "技术面", ic: 0.072, sharpe: 1.98, turnover: 0.32, status: "活跃" as const, description: "已实现波动率与隐含波动率的差值因子" },
    { name: "链上活跃度因子", category: "链上数据", ic: 0.091, sharpe: 2.56, turnover: 0.28, status: "活跃" as const, description: "基于链上交易活跃度的因子" },
    { name: "社交情绪因子", category: "另类数据", ic: 0.068, sharpe: 1.75, turnover: 0.55, status: "活跃" as const, description: "Twitter/Reddit情绪分析因子" },
    { name: "资金流向因子", category: "资金面", ic: 0.078, sharpe: 2.12, turnover: 0.38, status: "活跃" as const, description: "交易所净流入/流出资金因子" },
    { name: "巨鲸追踪因子", category: "链上数据", ic: 0.095, sharpe: 2.78, turnover: 0.22, status: "活跃" as const, description: "追踪大户钱包地址的持仓变化" },
    { name: "跨市场套利因子", category: "市场微观", ic: 0.062, sharpe: 1.65, turnover: 0.68, status: "测试中" as const, description: "跨交易所价差因子" },
    { name: "期限结构因子", category: "衍生品", ic: 0.082, sharpe: 2.25, turnover: 0.35, status: "活跃" as const, description: "期货期限结构斜率因子" },
  ];
  console.log("[Seed] Seeding alpha factors...");
  for (const f of factorData) {
    await db.createAlphaFactor(f);
  }

  // ─── System Config ──────────────────────────────────────────────
  console.log("[Seed] Seeding system config...");
  await db.setConfig("scheduler_mode", "balanced", "AI调度器模式: aggressive/balanced/conservative");
  await db.setConfig("max_leverage", "5", "最大杠杆倍数");
  await db.setConfig("risk_threshold", "40000", "VaR风险阈值(USD)");
  await db.setConfig("auto_trade", "true", "是否开启自动交易");
  await db.setConfig("binance_ws_enabled", "true", "是否启用Binance WebSocket");

  console.log("[Seed] ✅ Database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit(0));
