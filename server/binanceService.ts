/**
 * Binance API Service
 * 提供 Binance 账户余额查询、连接测试功能
 * 支持通过环境变量或参数传入 API Key
 */
import BinanceModule from 'binance-api-node';
// binance-api-node 的导出方式在不同环境下不同
const Binance = (BinanceModule as any).default || BinanceModule;

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
  usdtValue?: number;
}

export interface AccountBalanceResult {
  spot: {
    totalUSDT: number;
    assets: BinanceBalance[];
  };
  futures?: {
    totalUSDT: number;
    positions: any[];
  };
}

// 从环境变量获取默认 API Key
function getDefaultKeys() {
  return {
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
  };
}

/**
 * 查询 Binance 账户余额
 * 如果不传参数，使用环境变量中的 API Key
 */
export async function getBinanceBalance(
  apiKey?: string,
  apiSecret?: string
): Promise<AccountBalanceResult> {
  const keys = apiKey && apiSecret ? { apiKey, apiSecret } : getDefaultKeys();
  
  if (!keys.apiKey || !keys.apiSecret) {
    throw new Error('Binance API Key not configured. Set BINANCE_API_KEY and BINANCE_API_SECRET environment variables.');
  }

  try {
    const client = Binance({
      apiKey: keys.apiKey,
      apiSecret: keys.apiSecret,
    });

    // 查询现货账户余额
    const accountInfo = await client.accountInfo();
    
    // 过滤出有余额的资产
    const spotAssets = accountInfo.balances.filter(
      (balance) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    );

    // 获取所有交易对价格（用于计算USDT总值）
    const prices = await client.prices();

    // 计算现货账户USDT总值，并为每个资产附加 usdtValue
    let spotTotalUSDT = 0;
    const enrichedAssets: BinanceBalance[] = [];

    for (const asset of spotAssets) {
      const assetName = asset.asset;
      const totalAmount = parseFloat(asset.free) + parseFloat(asset.locked);
      let usdtValue = 0;

      if (assetName === 'USDT' || assetName === 'BUSD' || assetName === 'USDC') {
        usdtValue = totalAmount;
      } else {
        const pairSymbol = `${assetName}USDT`;
        if (prices[pairSymbol]) {
          usdtValue = totalAmount * parseFloat(prices[pairSymbol]);
        }
      }

      spotTotalUSDT += usdtValue;
      enrichedAssets.push({
        asset: assetName,
        free: asset.free,
        locked: asset.locked,
        usdtValue,
      });
    }

    const result: AccountBalanceResult = {
      spot: {
        totalUSDT: Math.round(spotTotalUSDT * 100) / 100,
        assets: enrichedAssets,
      },
    };

    // 尝试查询合约账户余额（如果有权限）
    try {
      const futuresAccount = await client.futuresAccountBalance();
      const futuresPositions = await client.futuresPositionRisk();
      
      let futuresTotalUSDT = 0;
      for (const balance of futuresAccount) {
        if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
          futuresTotalUSDT += parseFloat(balance.balance);
        }
      }

      result.futures = {
        totalUSDT: Math.round(futuresTotalUSDT * 100) / 100,
        positions: futuresPositions.filter(p => parseFloat(p.positionAmt) !== 0),
      };
    } catch (futuresError: any) {
      console.log('[BinanceService] No futures permission or error:', futuresError.message);
    }

    return result;
  } catch (error: any) {
    console.error('[BinanceService] API Error:', error.message);
    throw new Error(`Failed to fetch Binance balance: ${error.message}`);
  }
}

/**
 * 测试 Binance API 连接
 * 如果不传参数，使用环境变量中的 API Key
 */
export async function testBinanceConnection(
  apiKey?: string,
  apiSecret?: string
): Promise<{ success: boolean; latency: number; error?: string; canTrade?: boolean; accountType?: string }> {
  const keys = apiKey && apiSecret ? { apiKey, apiSecret } : getDefaultKeys();
  
  if (!keys.apiKey || !keys.apiSecret) {
    return { success: false, latency: 0, error: 'API Key not configured' };
  }

  const startTime = Date.now();
  
  try {
    const client = Binance({
      apiKey: keys.apiKey,
      apiSecret: keys.apiSecret,
    });

    const accountInfo = await client.accountInfo();
    const latency = Date.now() - startTime;
    
    return { 
      success: true, 
      latency,
      canTrade: accountInfo.canTrade,
      accountType: accountInfo.accountType,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { 
      success: false, 
      latency,
      error: error.message,
    };
  }
}

/**
 * 使用环境变量中的默认 API Key 查询余额（简化接口）
 */
export async function getDefaultBalance(): Promise<{
  success: boolean;
  totalUSDT: number;
  spot?: AccountBalanceResult['spot'];
  futures?: AccountBalanceResult['futures'];
  error?: string;
}> {
  try {
    const balance = await getBinanceBalance();
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
// 获取币安真实账户余额（包括现货和合约）
export async function getRealBinanceBalance(): Promise<{
  total: number;
  spot: number;
  futures: number;
  funding: number;
}> {
  try {
    const client = createBinanceClient();
    
    // 获取现货账户余额
    let spotBalance = 0;
    try {
      const spotAccount = await client.accountInfo();
      spotBalance = spotAccount.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .reduce((sum: number, b: any) => {
          const free = parseFloat(b.free);
          const locked = parseFloat(b.locked);
          // 简化处理：假设所有资产都是 USDT 或等值
          if (b.asset === 'USDT') {
            return sum + free + locked;
          }
          return sum;
        }, 0);
    } catch (error) {
      console.error('Failed to fetch spot balance:', error);
    }

    // 获取合约账户余额
    let futuresBalance = 0;
    try {
      const futuresAccount = await client.futuresAccountBalance();
      futuresBalance = futuresAccount
        .filter((b: any) => b.asset === 'USDT')
        .reduce((sum: number, b: any) => sum + parseFloat(b.balance), 0);
    } catch (error) {
      console.error('Failed to fetch futures balance:', error);
    }

    const total = spotBalance + futuresBalance;

    return {
      total,
      spot: spotBalance,
      futures: futuresBalance,
      funding: 0 // 资金账户暂时设为 0
    };
  } catch (error) {
    console.error('Error fetching real Binance balance:', error);
    throw new Error('Failed to fetch Binance balance');
  }
}

// 获取模拟账户余额
export async function getSimulatedBalance(): Promise<{
  total: number;
  spot: number;
  futures: number;
}> {
  const stats = simulatedTradingService.getAccountStats();
  const balance = stats.balance;
  const equity = stats.equity;
  
  // 假设 60% 在现货，40% 在合约
  const spot = balance * 0.6;
  const futures = (equity - balance) + (balance * 0.4);
  
  return {
    total: equity,
    spot,
    futures
  };
}
