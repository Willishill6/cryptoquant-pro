import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface AccountDetailCardsProps {
  totalBalance?: number;
  apis?: any[];
}

export function AccountDetailCards({ totalBalance, apis }: AccountDetailCardsProps) {
  // 使用 React Query 的 useQuery hook
  const { data: realBalance, isLoading, error, refetch } = trpc.exchanges.getDefaultBalance.useQuery(undefined, {
  });

  // 格式化金额显示 - 统一为2位小数
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // 格式化详细金额 - 保留更多小数位用于小额资产
  const formatDetailAmount = (amount: number) => {
    if (amount < 0.01) {
      return amount.toFixed(8);
    } else if (amount < 1) {
      return amount.toFixed(4);
    } else {
      return amount.toFixed(2);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">加载账户数据中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !realBalance) {
    return (
      <div className="mt-6">
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">无法获取账户数据</p>
            <p className="text-center text-xs text-muted-foreground mt-2">{error?.message || '请检查网络连接或 API 配置'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayTotal = realBalance.totalUSDT || 0;
  const spotBalance = realBalance.spot?.totalUSDT || 0;
  const futuresBalance = realBalance.futures?.totalUSDT || 0;
  const fundingBalance = 0;
  
  // 计算可用余额和冻结资金
  const availableBalance = spotBalance + futuresBalance * 0.95;
  const frozenBalance = futuresBalance * 0.05;

  return (
    <div className="mt-6 space-y-4">
      {/* 资金总览 - 单独一行 */}
      <Card className="bg-gradient-to-br from-card/80 to-card/50 border-border/50 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyber-blue/10">
              <DollarSign className="w-4 h-4 text-cyber-blue" />
            </div>
            <span>资金总览</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">总资产</p>
              <p className="text-2xl font-bold font-mono text-cyber-blue">
                ${formatAmount(displayTotal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">可用余额</p>
              <p className="text-2xl font-bold font-mono text-green-500">
                ${formatAmount(availableBalance)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">冻结资金</p>
              <p className="text-xl font-semibold font-mono text-yellow-500">
                ${formatAmount(frozenBalance)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">未实现盈亏</p>
              <p className="text-xl font-semibold font-mono text-gray-400">
                $0.00
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 现货和合约账户 - 并排两列 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 现货账户 */}
        <Card className="bg-gradient-to-br from-green-500/5 to-card/50 border-green-500/20 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              <span>现货账户</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 总资产 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">总资产</p>
              <p className="text-2xl font-bold font-mono text-green-500">
                ${formatAmount(spotBalance)}
              </p>
            </div>
            
            {/* 资产列表 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">资产列表</p>
              {spotBalance > 0 ? (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-500">U</span>
                      </div>
                      <span className="font-medium text-sm">USDT</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">${formatDetailAmount(spotBalance)}</div>
                      <div className="text-[10px] text-muted-foreground">100%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">暂无资产</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 合约账户 */}
        <Card className="bg-gradient-to-br from-orange-500/5 to-card/50 border-orange-500/20 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <span>合约账户</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 总资产 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">总资产</p>
              <p className="text-2xl font-bold font-mono text-orange-500">
                ${formatAmount(futuresBalance)}
              </p>
            </div>
            
            {/* 账户详情 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">可用余额</p>
                <p className="font-mono text-sm font-semibold">${formatDetailAmount(futuresBalance)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">持仓保证金</p>
                <p className="font-mono text-sm font-semibold">$0.00</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">未实现盈亏</p>
                <p className="font-mono text-sm font-semibold text-gray-400">$0.00</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-1">持仓数量</p>
                <p className="font-mono text-sm font-semibold">0</p>
              </div>
            </div>

            {/* 持仓列表 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">持仓列表</p>
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">暂无持仓</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
