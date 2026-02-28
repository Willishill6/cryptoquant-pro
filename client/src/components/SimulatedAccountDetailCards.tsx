import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface SimulatedAccountData {
  totalAssets: number;
  availableBalance: number;
  frozenFunds: number;
  unrealizedPnL: number;
  spotAssets: number;
  futuresAssets: number;
  spotAvailable: number;
  futuresAvailable: number;
  futuresMargin: number;
  futuresPositions: number;
}

export function SimulatedAccountDetailCards() {
  const [accountData, setAccountData] = useState<SimulatedAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 trpc 查询模拟账户余额
  const { data: balanceData, isLoading, error: queryError, refetch } = trpc.exchanges.getSimulatedBalance.useQuery();

  useEffect(() => {
    if (balanceData) {
      // 模拟账户数据结构
      const totalAssets = balanceData.balance || 10000;
      const spotAssets = totalAssets * 0.6; // 60% 现货
      const futuresAssets = totalAssets * 0.4; // 40% 合约
      
      setAccountData({
        totalAssets,
        availableBalance: totalAssets * 0.95,
        frozenFunds: totalAssets * 0.05,
        unrealizedPnL: 0,
        spotAssets,
        futuresAssets,
        spotAvailable: spotAssets,
        futuresAvailable: futuresAssets * 0.8,
        futuresMargin: futuresAssets * 0.2,
        futuresPositions: 0,
      });
      setLoading(false);
      setError(null);
    } else if (queryError) {
      setError('无法获取模拟账户数据');
      setLoading(false);
    }
  }, [balanceData, queryError]);

  // 格式化金额
  const formatAmount = (amount: number): string => {
    if (amount < 0.01) return amount.toFixed(8);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error || !accountData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-400">{error || '无法获取账户数据'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* 资金总览 */}
      <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-cyan-400">资金总览</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">总资产</div>
            <div className="text-2xl font-bold text-cyan-400">${formatAmount(accountData.totalAssets)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">可用余额</div>
            <div className="text-2xl font-bold text-green-400">${formatAmount(accountData.availableBalance)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">冻结资金</div>
            <div className="text-2xl font-bold text-yellow-400">${formatAmount(accountData.frozenFunds)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">未实现盈亏</div>
            <div className="text-2xl font-bold text-gray-400">${formatAmount(accountData.unrealizedPnL)}</div>
          </div>
        </div>
      </div>

      {/* 现货账户和合约账户 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 现货账户 */}
        <div className="rounded-lg border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">💵</span>
            </div>
            <h3 className="text-lg font-semibold text-green-400">现货账户</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">总资产</div>
              <div className="text-2xl font-bold text-green-400">${formatAmount(accountData.spotAssets)}</div>
            </div>
            
            <div className="pt-3 border-t border-green-500/20">
              <div className="text-xs text-gray-400 mb-2">资产列表</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs">
                      💵
                    </div>
                    <span className="text-sm font-medium text-gray-300">USDT</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">${formatAmount(accountData.spotAssets)}</div>
                    <div className="text-xs text-gray-400">100%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 合约账户 */}
        <div className="rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-orange-400">合约账户</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">总资产</div>
              <div className="text-2xl font-bold text-orange-400">${formatAmount(accountData.futuresAssets)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-orange-500/20">
              <div>
                <div className="text-xs text-gray-400 mb-1">可用余额</div>
                <div className="text-sm font-semibold text-orange-300">${formatAmount(accountData.futuresAvailable)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">持仓保证金</div>
                <div className="text-sm font-semibold text-orange-300">${formatAmount(accountData.futuresMargin)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">未实现盈亏</div>
                <div className="text-sm font-semibold text-gray-400">${formatAmount(accountData.unrealizedPnL)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">持仓数量</div>
                <div className="text-sm font-semibold text-gray-400">{accountData.futuresPositions}</div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-orange-500/20">
              <div className="text-xs text-gray-400 mb-2">持仓列表</div>
              <div className="text-center py-4 text-sm text-gray-500">
                暂无持仓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
