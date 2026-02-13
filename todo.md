# 性能优化和用户交互改进 TODO

## Phase 1: 分析当前瓶颈 ✅
- [x] TypeScript零编译错误（标准+严格模式）

## Phase 2: React性能优化
- [ ] 为重型子组件添加React.memo（仪表盘卡片、币种行、图表等）
- [ ] 为441币种列表实现虚拟滚动（react-window）
- [ ] 为搜索/筛选添加防抖（useDebouncedValue）
- [ ] 实现页面级路由懒加载（React.lazy + Suspense）
- [ ] 优化SystemStatusContext避免全局重渲染
- [ ] 为大数据集计算添加useMemo缓存

## Phase 3: 用户交互改进
- [ ] 添加全局命令面板（Ctrl+K 快速搜索/导航）
- [ ] 添加页面切换过渡动画
- [ ] 为按钮/卡片添加hover微交互效果
- [ ] 添加数据加载骨架屏（Skeleton）
- [ ] 添加滚动到顶部按钮
- [ ] 为表格添加行悬浮高亮和点击展开
- [ ] 添加全局键盘快捷键提示

## Phase 4: 图表和布局修复
- [ ] 修复Recharts图表容器宽高0警告
- [ ] 为所有图表容器添加最小高度
- [ ] 改进移动端侧边栏折叠交互
- [ ] 优化仪表盘网格在不同屏幕尺寸的适配

## Binance WebSocket 实时行情集成
- [ ] 解决升级全栈项目后的合并冲突
- [ ] 安装ws和jose依赖
- [ ] 创建后端Binance WebSocket代理服务
- [ ] 创建后端WebSocket服务器转发行情到前端
- [ ] 创建前端WebSocket hook消费实时行情
- [ ] 改造mockData为可变响应式数据源
- [ ] 更新Dashboard和TradingEngine使用真实行情
- [ ] 验证端到端实时数据流
- [ ] 编写vitest测试
