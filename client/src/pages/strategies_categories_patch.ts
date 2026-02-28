// 此文件仅用于暂存策略分类数据，不直接使用
export const newStrategyCategories = [
  {
    name: "趋势跟踪策略库", count: 8, icon: "📈", desc: "来自合约策略大全，经典趋势跟踪策略体系",
    items: [
      { name: "双均线交叉策略(EMA12/26)", coins: "全币种", risk: "中", sharpe: 2.12, desc: "EMA12/EMA26金叉死叉，山寨币合约特殊调整" },
      { name: "SuperTrend超级趋势策略", coins: "全币种", risk: "中", sharpe: 2.35, desc: "ATR动态止损，高波动币种适用性强" },
      { name: "海龟交易法则(Donchian通道突破)", coins: "全币种", risk: "中", sharpe: 2.25, desc: "N日高低点通道突破，自动止损跟踪" },
      { name: "MACD趋势确认策略", coins: "全币种", risk: "中", sharpe: 2.18, desc: "MACD柱状图加速度+信号线交叉确认趋势" },
      { name: "ADX趋势强度过滤策略", coins: "全币种", risk: "中", sharpe: 2.42, desc: "ADX>25才开仓，过滤震荡市场假信号" },
      { name: "网格交易策略", coins: "全币种", risk: "低", sharpe: 1.85, desc: "在价格区间内自动挂单买卖" },
      { name: "趋势跟随策略(经典)", coins: "全币种", risk: "中", sharpe: 2.05, desc: "跟随市场趋势方向，动态止损跟踪" },
      { name: "TWAP/VWAP执行", coins: "全币种", risk: "低", sharpe: 1.65, desc: "大额订单时间/成交量加权执行" },
    ],
  },
  {
    name: "均值回归策略库", count: 5, icon: "🔄", desc: "来自合约策略大全，统计均值回归策略体系",
    items: [
      { name: "布林带回归策略(BB均值回归)", coins: "全币种", risk: "中", sharpe: 1.95, desc: "价格触及布林带上下轨时反向交易" },
      { name: "RSI超买超卖策略", coins: "全币种", risk: "中", sharpe: 2.05, desc: "RSI>70做空，RSI<30做多，山寨币适用性强" },
      { name: "Z-Score统计偏离策略", coins: "全币种", risk: "中", sharpe: 2.15, desc: "价格偏离均值超过Z分数阈值时入场" },
      { name: "协整配对交易策略", coins: "相关币种对", risk: "中", sharpe: 2.45, desc: "协整币种对价差回归，市场中性" },
      { name: "Ornstein-Uhlenbeck模型策略", coins: "相关币种对", risk: "中", sharpe: 2.35, desc: "OU过程均值回归建模，动态入场出场" },
    ],
  },
  {
    name: "资金费率套利策略库", count: 3, icon: "💰", desc: "来自合约策略大全，合约资金费率套利与预测策略",
    items: [
      { name: "资金费率套利策略(期现对冲)", coins: "全币种", risk: "低", sharpe: 3.15, desc: "资金费率正时做空现货，对冲合约，Delta中性" },
      { name: "资金费率预测策略", coins: "全币种", risk: "中", sharpe: 2.85, desc: "预测下一期资金费率方向，提前布局" },
      { name: "极端资金费率反转策略", coins: "全币种", risk: "中", sharpe: 2.65, desc: "资金费率极端值出现时反向交易，均值回归" },
    ],
  },
  {
    name: "链上数据策略库", count: 5, icon: "⛓️", desc: "来自合约策略大全，基于链上指标的交易策略",
    items: [
      { name: "鲸鱼异动追踪策略(Whale Alert)", coins: "主流币", risk: "中", sharpe: 2.75, desc: "监控鲸鱼地址大额转移，跟随鲸鱼操作" },
      { name: "交易所净流入流出策略", coins: "主流币", risk: "中", sharpe: 2.55, desc: "交易所净流入增加做空，净流出做多" },
      { name: "NVT信号策略", coins: "主流币", risk: "中", sharpe: 2.35, desc: "NVT高低判断价格高低估，均值回归交易" },
      { name: "活跃地址增长策略", coins: "主流币", risk: "中", sharpe: 2.25, desc: "活跃地址数快速增长时做多，预示需求上升" },
      { name: "矿工投降策略(Hash Ribbon)", coins: "BTC", risk: "高", sharpe: 2.95, desc: "Hash Ribbon矿工投降信号自底部入场" },
    ],
  },
  {
    name: "DeFi策略库", count: 12, icon: "🔗", desc: "去中心化金融全链路策略，覆盖流动性、借贷、衍生品等",
    items: [
      { name: "流动性提供策略", coins: "DeFi全币种", risk: "中", sharpe: 2.35, desc: "Uniswap/Curve等DEX LP仓位管理，自动调整价格区间" },
      { name: "集中流动性优化", coins: "DeFi全币种", risk: "中", sharpe: 2.65, desc: "Uni V3集中流动性区间动态调整，最大化手续费收入" },
      { name: "借贷利率策略", coins: "稳定币+主流币", risk: "低", sharpe: 1.95, desc: "Aave/Compound跨协议利率差收益，自动搬砖" },
      { name: "杠杆循环借贷", coins: "ETH/stETH", risk: "高", sharpe: 2.85, desc: "利用stETH/ETH低利差循环借贷放大收益" },
      { name: "收益聚合策略", coins: "全DeFi", risk: "低", sharpe: 2.15, desc: "Yearn风格多协议收益自动聚合，最优路径选择" },
      { name: "稳定币收益策略", coins: "稳定币", risk: "低", sharpe: 1.85, desc: "USDT/USDC/DAI跨协议稳定收益，年化8-15%" },
      { name: "永续合约资金费率", coins: "全币种", risk: "中", sharpe: 3.15, desc: "dYdX/GMX资金费率收割，Delta中性对冲" },
      { name: "期权策略(DeFi)", coins: "BTC/ETH", risk: "高", sharpe: 2.45, desc: "Lyra/Dopex链上期权策略，波动率交易" },
      { name: "MEV保护策略", coins: "全币种", risk: "中", sharpe: 2.25, desc: "Flashbots集成，防三明治攻击，优化Gas" },
      { name: "跨链桥收益策略", coins: "多链资产", risk: "中", sharpe: 2.05, desc: "利用跨链桥流动性差异获取收益" },
      { name: "LSD收益策略", coins: "ETH/SOL", risk: "低", sharpe: 2.55, desc: "Lido/Rocket Pool质押衍生品收益优化" },
      { name: "RWA收益策略", coins: "RWA代币", risk: "低", sharpe: 1.75, desc: "真实世界资产代币化收益，国债/房产/商品" },
    ],
  },
  {
    name: "阿尔法策略库", count: 8, icon: "🎯", desc: "基于阿尔法因子的超额收益策略",
    items: [
      { name: "多因子动量策略", coins: "全币种", risk: "中", sharpe: 2.85, desc: "融合价格/成交量/波动率多因子" },
      { name: "价值因子策略", coins: "全币种", risk: "中", sharpe: 2.35, desc: "基于基本面价值因子选币" },
      { name: "质量因子策略", coins: "全币种", risk: "低", sharpe: 2.15, desc: "选择高质量项目长期持有" },
      { name: "技术因子策略", coins: "全币种", risk: "中", sharpe: 2.55, desc: "技术指标组合信号交易" },
      { name: "事件驱动策略", coins: "全币种", risk: "高", sharpe: 3.15, desc: "基于新闻/公告事件快速交易" },
      { name: "DeFi收益因子", coins: "DeFi币", risk: "中", sharpe: 2.75, desc: "DeFi协议TVL/收益率因子驱动" },
      { name: "链上因子策略", coins: "全币种", risk: "中", sharpe: 2.45, desc: "基于链上数据因子交易" },
      { name: "情绪因子策略", coins: "全币种", risk: "高", sharpe: 2.65, desc: "社交媒体情绪驱动交易" },
    ],
  },
  {
    name: "AI高级策略库", count: 10, icon: "🧠", desc: "AI驱动的自适应策略，自我学习进化",
    items: [
      { name: "深度学习预测策略", coins: "全币种", risk: "中", sharpe: 3.12, desc: "TFT/PatchTST价格预测" },
      { name: "强化学习自适应(DRL-PPO/SAC)", coins: "全币种", risk: "中", sharpe: 2.89, desc: "RL Agent自动学习最优策略" },
      { name: "DeepSeek-V3策略生成", coins: "全币种", risk: "中", sharpe: 2.95, desc: "自然语言描述自动生成策略" },
      { name: "情绪分析NLP策略(FinBERT)", coins: "全币种", risk: "中", sharpe: 2.72, desc: "FinBERT情绪分析，新闻/社交信号驱动" },
      { name: "多因子机器学习选币(XGBoost/LightGBM)", coins: "全币种", risk: "中", sharpe: 3.05, desc: "XGBoost/LightGBM多因子选币模型" },
      { name: "GNN图神经网络跨币种关联策略", coins: "全币种", risk: "中", sharpe: 2.92, desc: "币种关联图谱分析，跨币种信号传播" },
      { name: "Transformer时序预测策略", coins: "全币种", risk: "中", sharpe: 3.08, desc: "Transformer架构长短期价格预测" },
      { name: "多模态融合策略", coins: "全币种", risk: "高", sharpe: 3.35, desc: "融合文本/图表/数据多模态" },
      { name: "GAN对抗训练策略", coins: "全币种", risk: "高", sharpe: 2.65, desc: "生成对抗网络优化策略" },
      { name: "元学习自适应策略", coins: "全币种", risk: "中", sharpe: 2.78, desc: "快速适应新市场环境，少样本学习" },
    ],
  },
];
