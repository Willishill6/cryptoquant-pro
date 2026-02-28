/**
 * 本地模拟交易服务
 * 提供完整的模拟交易功能，包括账户管理、订单执行、持仓管理等
 */

interface SimulatedAccount {
  userId: string;
  balances: Map<string, number>; // 资产余额
  orders: SimulatedOrder[];
  positions: SimulatedPosition[];
  totalUSDT: number;
}

interface SimulatedOrder {
  orderId: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  executedQty: number;
  status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED';
  timestamp: number;
  executedPrice?: number;
}

interface SimulatedPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

// 全局账户存储（生产环境应使用数据库）
const accounts = new Map<string, SimulatedAccount>();
let orderIdCounter = 1000;

/**
 * 获取或创建模拟账户
 */
export function getOrCreateAccount(userId: string = 'default'): SimulatedAccount {
  if (!accounts.has(userId)) {
    const account: SimulatedAccount = {
      userId,
      balances: new Map([['USDT', 10000]]), // 初始 10000 USDT
      orders: [],
      positions: [],
      totalUSDT: 10000,
    };
    accounts.set(userId, account);
  }
  return accounts.get(userId)!;
}

/**
 * 重置账户（用于测试）
 */
export function resetAccount(userId: string = 'default', initialBalance: number = 10000): void {
  const account: SimulatedAccount = {
    userId,
    balances: new Map([['USDT', initialBalance]]),
    orders: [],
    positions: [],
    totalUSDT: initialBalance,
  };
  accounts.set(userId, account);
}

/**
 * 获取当前市场价格（从实时行情获取）
 */
async function getCurrentPrice(symbol: string): Promise<number> {
  // 这里应该从 binanceWs 或其他行情源获取实时价格
  // 暂时使用模拟价格
  const mockPrices: Record<string, number> = {
    'BTCUSDT': 70500,
    'ETHUSDT': 2070,
    'BNBUSDT': 630,
    'SOLUSDT': 90,
    'XRPUSDT': 1.61,
  };
  return mockPrices[symbol] || 100;
}

/**
 * 执行市价买入
 */
export async function executeBuyMarket(
  symbol: string,
  quantity: number,
  userId: string = 'default'
): Promise<SimulatedOrder> {
  const account = getOrCreateAccount(userId);
  const currentPrice = await getCurrentPrice(symbol);
  const totalCost = currentPrice * quantity;
  const fee = totalCost * 0.001; // 0.1% 手续费
  const totalWithFee = totalCost + fee;

  // 检查余额
  const usdtBalance = account.balances.get('USDT') || 0;
  if (usdtBalance < totalWithFee) {
    throw new Error(`余额不足: 需要 ${totalWithFee.toFixed(2)} USDT, 当前余额 ${usdtBalance.toFixed(2)} USDT`);
  }

  // 扣除 USDT
  account.balances.set('USDT', usdtBalance - totalWithFee);

  // 增加资产
  const asset = symbol.replace('USDT', '');
  const assetBalance = account.balances.get(asset) || 0;
  account.balances.set(asset, assetBalance + quantity);

  // 创建订单记录
  const order: SimulatedOrder = {
    orderId: orderIdCounter++,
    symbol,
    side: 'BUY',
    type: 'MARKET',
    quantity,
    executedQty: quantity,
    status: 'FILLED',
    timestamp: Date.now(),
    executedPrice: currentPrice,
  };

  account.orders.push(order);

  // 更新或创建持仓
  updatePosition(account, symbol, quantity, currentPrice, 'BUY');

  console.log(`[模拟交易] 买入成功: ${quantity} ${asset} @ ${currentPrice} USDT, 手续费: ${fee.toFixed(2)} USDT`);

  return order;
}

/**
 * 执行市价卖出
 */
export async function executeSellMarket(
  symbol: string,
  quantity: number,
  userId: string = 'default'
): Promise<SimulatedOrder> {
  const account = getOrCreateAccount(userId);
  const currentPrice = await getCurrentPrice(symbol);
  const asset = symbol.replace('USDT', '');

  // 检查资产余额
  const assetBalance = account.balances.get(asset) || 0;
  if (assetBalance < quantity) {
    throw new Error(`${asset} 余额不足: 需要 ${quantity}, 当前余额 ${assetBalance}`);
  }

  const totalRevenue = currentPrice * quantity;
  const fee = totalRevenue * 0.001; // 0.1% 手续费
  const totalWithFee = totalRevenue - fee;

  // 扣除资产
  account.balances.set(asset, assetBalance - quantity);

  // 增加 USDT
  const usdtBalance = account.balances.get('USDT') || 0;
  account.balances.set('USDT', usdtBalance + totalWithFee);

  // 创建订单记录
  const order: SimulatedOrder = {
    orderId: orderIdCounter++,
    symbol,
    side: 'SELL',
    type: 'MARKET',
    quantity,
    executedQty: quantity,
    status: 'FILLED',
    timestamp: Date.now(),
    executedPrice: currentPrice,
  };

  account.orders.push(order);

  // 更新持仓
  updatePosition(account, symbol, quantity, currentPrice, 'SELL');

  console.log(`[模拟交易] 卖出成功: ${quantity} ${asset} @ ${currentPrice} USDT, 手续费: ${fee.toFixed(2)} USDT`);

  return order;
}

/**
 * 执行限价单
 */
export async function executeLimitOrder(
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  userId: string = 'default'
): Promise<SimulatedOrder> {
  const account = getOrCreateAccount(userId);
  const currentPrice = await getCurrentPrice(symbol);

  // 简化处理：如果限价单价格合理，立即成交
  let canExecute = false;
  if (side === 'BUY' && price >= currentPrice) {
    canExecute = true;
  } else if (side === 'SELL' && price <= currentPrice) {
    canExecute = true;
  }

  if (canExecute) {
    // 立即成交
    if (side === 'BUY') {
      return executeBuyMarket(symbol, quantity, userId);
    } else {
      return executeSellMarket(symbol, quantity, userId);
    }
  } else {
    // 挂单（暂不实现自动成交逻辑）
    const order: SimulatedOrder = {
      orderId: orderIdCounter++,
      symbol,
      side,
      type: 'LIMIT',
      quantity,
      price,
      executedQty: 0,
      status: 'NEW',
      timestamp: Date.now(),
    };

    account.orders.push(order);
    console.log(`[模拟交易] 限价单已挂单: ${side} ${quantity} ${symbol} @ ${price} USDT`);

    return order;
  }
}

/**
 * 取消订单
 */
export function cancelOrder(
  orderId: number,
  userId: string = 'default'
): { success: boolean; message: string } {
  const account = getOrCreateAccount(userId);
  const order = account.orders.find(o => o.orderId === orderId);

  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status === 'FILLED') {
    return { success: false, message: '订单已成交，无法取消' };
  }

  if (order.status === 'CANCELED') {
    return { success: false, message: '订单已取消' };
  }

  order.status = 'CANCELED';
  console.log(`[模拟交易] 订单已取消: ${orderId}`);

  return { success: true, message: '订单已取消' };
}

/**
 * 查询订单状态
 */
export function getOrderStatus(
  orderId: number,
  userId: string = 'default'
): SimulatedOrder | null {
  const account = getOrCreateAccount(userId);
  return account.orders.find(o => o.orderId === orderId) || null;
}

/**
 * 获取所有订单
 */
export function getAllOrders(userId: string = 'default'): SimulatedOrder[] {
  const account = getOrCreateAccount(userId);
  return [...account.orders].reverse(); // 最新的在前
}

/**
 * 获取账户余额
 */
export async function getAccountBalance(userId: string = 'default'): Promise<{
  balances: Array<{ asset: string; free: string; locked: string; usdtValue: number }>;
  totalUSDT: number;
}> {
  const account = getOrCreateAccount(userId);
  const balances: Array<{ asset: string; free: string; locked: string; usdtValue: number }> = [];
  let totalUSDT = 0;

  for (const [asset, amount] of account.balances.entries()) {
    if (amount > 0) {
      let usdtValue = 0;
      if (asset === 'USDT') {
        usdtValue = amount;
      } else {
        const symbol = `${asset}USDT`;
        const price = await getCurrentPrice(symbol);
        usdtValue = amount * price;
      }

      balances.push({
        asset,
        free: amount.toFixed(8),
        locked: '0',
        usdtValue,
      });

      totalUSDT += usdtValue;
    }
  }

  return {
    balances,
    totalUSDT: Math.round(totalUSDT * 100) / 100,
  };
}

/**
 * 获取持仓信息
 */
export async function getPositions(userId: string = 'default'): Promise<SimulatedPosition[]> {
  const account = getOrCreateAccount(userId);
  const positions: SimulatedPosition[] = [];

  for (const [asset, quantity] of account.balances.entries()) {
    if (asset !== 'USDT' && quantity > 0) {
      const symbol = `${asset}USDT`;
      const currentPrice = await getCurrentPrice(symbol);
      
      // 计算平均成本（简化处理）
      const buyOrders = account.orders.filter(
        o => o.symbol === symbol && o.side === 'BUY' && o.status === 'FILLED'
      );
      
      let totalCost = 0;
      let totalQty = 0;
      for (const order of buyOrders) {
        if (order.executedPrice) {
          totalCost += order.executedPrice * order.executedQty;
          totalQty += order.executedQty;
        }
      }
      
      const avgPrice = totalQty > 0 ? totalCost / totalQty : currentPrice;
      const pnl = (currentPrice - avgPrice) * quantity;
      const pnlPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

      positions.push({
        symbol,
        quantity,
        avgPrice,
        currentPrice,
        pnl,
        pnlPercent,
      });
    }
  }

  return positions;
}

/**
 * 更新持仓信息
 */
function updatePosition(
  account: SimulatedAccount,
  symbol: string,
  quantity: number,
  price: number,
  side: 'BUY' | 'SELL'
): void {
  // 持仓信息通过余额计算，这里只做日志记录
  console.log(`[模拟交易] 持仓更新: ${side} ${quantity} ${symbol} @ ${price}`);
}

/**
 * 获取交易历史
 */
export function getTradeHistory(
  userId: string = 'default',
  limit: number = 100
): SimulatedOrder[] {
  const account = getOrCreateAccount(userId);
  return account.orders
    .filter(o => o.status === 'FILLED')
    .slice(-limit)
    .reverse();
}

/**
 * 获取账户统计信息
 */
export async function getAccountStats(userId: string = 'default'): Promise<{
  totalUSDT: number;
  initialBalance: number;
  pnl: number;
  pnlPercent: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
}> {
  const account = getOrCreateAccount(userId);
  const balance = await getAccountBalance(userId);
  const initialBalance = 10000; // 应该从数据库读取

  const totalTrades = account.orders.filter(o => o.status === 'FILLED').length;
  const positions = await getPositions(userId);
  
  let winTrades = 0;
  let lossTrades = 0;
  for (const pos of positions) {
    if (pos.pnl > 0) winTrades++;
    if (pos.pnl < 0) lossTrades++;
  }

  const pnl = balance.totalUSDT - initialBalance;
  const pnlPercent = (pnl / initialBalance) * 100;
  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  return {
    totalUSDT: balance.totalUSDT,
    initialBalance,
    pnl,
    pnlPercent,
    totalTrades,
    winTrades,
    lossTrades,
    winRate,
  };
}
