# 深度审查报告 V2 - 缺失功能与改进点

## 一、核心缺失功能（优先级P0）

### 1. TradingEngine页面过于薄弱（仅322行）
- 缺少实时行情滚动条（Ticker Tape）
- 交易所连接Tab缺少实时WebSocket状态
- 订单管理缺少挂单/撤单/修改功能
- 买入/卖出按钮仍是"功能开发中"占位符
- 缺少快速下单面板（限价/市价/止损单）

### 2. 跨交易所套利模块完全缺失
- 系统支持10个交易所但无套利功能
- 需要：跨所价差监控、三角套利、资金费率套利

### 3. 爆仓/清算风险监控缺失
- 仅1处提及清算，无完整爆仓预警系统
- 需要：杠杆仓位清算价格计算、爆仓风险预警

### 4. 多页面缺少实时数据更新
- AlphaFactors: 无setInterval（静态数据）
- DataAnalytics: 无setInterval
- Monitoring: 无setInterval（监控页面居然不实时！）
- RiskManagement: 无setInterval
- Strategies: 无setInterval
- TradeHistory: 无setInterval
- TradingEngine: 无setInterval

## 二、需要改进的功能（优先级P1）

### 5. Monitoring页面（368行）需要实时化
- 服务状态应实时更新
- 性能指标应有实时图表
- 系统日志应自动滚动推送

### 6. RiskManagement页面（473行）缺少实时风控
- 风险指标应实时更新
- 压力测试应支持自定义场景
- 止损止盈应与AutoTrader联动

### 7. TradingEngine需要快速下单面板
- 当前买入/卖出按钮是占位符
- 需要完整的下单表单（币种/方向/类型/数量/价格）

## 三、开发计划

### 第一批（核心增强）
1. **TradingEngine快速下单面板** - 替换占位符，添加完整下单功能
2. **跨交易所套利监控面板** - 新增到TradingEngine
3. **Monitoring实时化** - 添加实时数据更新

### 第二批（体验增强）  
4. **RiskManagement实时风控** - 实时更新风险指标
5. **全局实时行情滚动条** - 在状态栏下方添加
6. **爆仓风险预警** - 添加到RiskManagement
