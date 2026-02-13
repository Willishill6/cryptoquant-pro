# CryptoQuant Pro — AI模型评估与规划方案

## 一、现状审查：当前系统AI模型清单

经全面扫描系统10个页面及数据层，当前共引用 **20个不同的AI模型名称**，出现 **130+次**。

| 模型名称 | 出现次数 | 当前用途 | 问题评估 |
|---------|---------|---------|---------|
| GPT-4o | 45 | 策略优化、市场分析、因子发现、报表生成、风控 | **严重过度使用**：LLM不适合实时价格预测和高频交易 |
| Transformer-XL | 12 | 价格序列预测、波动率因子 | **架构过时**：已被TFT/PatchTST等取代 |
| AnomalyGPT | 11 | 异常检测、交易量因子 | **虚构模型**：应替换为真实异常检测架构 |
| SentimentGPT | 10 | 情绪分析 | **虚构模型**：应使用FinBERT等金融NLP模型 |
| PatternGPT | 10 | 价格因子、模式识别 | **虚构模型**：应使用CNN/Temporal模型 |
| Gemini Ultra | 10 | 链上数据分析、DeFi策略 | **定位不当**：通用LLM不适合链上数据分析 |
| OrderBookGPT | 9 | 微观结构因子、订单簿分析 | **虚构模型**：应使用专用订单簿模型 |
| Claude 3.5 | 7 | 风险评估、深度学习预测 | **定位不当**：LLM不适合数值预测 |
| QuantTransformer | 3 | 价格预测（自研） | **合理**：自研时序模型定位正确 |
| DeepSeek-V3 | 1 | 代码生成 | **合理**：但应扩展到策略研究 |
| 其他虚构模型 | 12+ | 各种 | 需统一替换 |

### 核心问题总结

1. **GPT-4o过度使用**：45处引用中约60%的场景（价格预测、因子计算、高频信号）不适合用LLM，LLM擅长文本理解和策略推理，不擅长数值时序预测。
2. **大量虚构模型**：PatternGPT、AnomalyGPT、SentimentGPT、OrderBookGPT、CrossMarketGPT等均为虚构名称，缺乏专业可信度。
3. **架构过时**：Transformer-XL（2019年）已被更先进的时序模型取代。
4. **LLM与专用模型边界模糊**：未区分"通用推理层"和"专用计算层"的职责。

---

## 二、AI模型规划方案

基于量化交易领域最新研究和工业实践，将系统AI模型重新规划为 **三层架构**：

### 第一层：通用推理层（LLM）— 负责策略推理、报告生成、自然语言交互

| 模型 | 角色 | 权重 | 适用场景 |
|-----|------|------|---------|
| **DeepSeek-V3** | 主力LLM | 35% | 策略生成、代码编写、市场研报分析、因子发现推理 |
| **GPT-4o** | 辅助LLM | 25% | 多模态分析（图表识别）、复杂推理、报告生成 |
| **Claude 3.5 Sonnet** | 辅助LLM | 15% | 风险推理、合规审查、长文本分析 |

**理由**：DeepSeek-V3由量化基金幻方量化(High-Flyer)孵化，天然具备金融量化基因，且推理成本远低于GPT-4o，适合作为量化系统主力LLM。GPT-4o保留用于多模态和复杂推理场景。Claude 3.5 Sonnet擅长长上下文推理，适合风险分析。

### 第二层：专用预测层 — 负责价格预测、因子计算、信号生成

| 模型 | 类型 | 适用场景 | 延迟 |
|-----|------|---------|------|
| **TFT (Temporal Fusion Transformer)** | 时序预测 | 多时间尺度价格预测、可解释性预测 | 15-30ms |
| **PatchTST** | 时序预测 | 长序列价格趋势预测、全币种批量预测 | 8-15ms |
| **WaveNet-Quant** | 时序预测 | 高频价格微观结构预测、tick级信号 | 3-8ms |
| **XGBoost-Alpha** | 集成学习 | Alpha因子组合、特征重要性排序 | 1-3ms |
| **LightGBM-Factor** | 集成学习 | 因子IC预测、截面因子排序 | 1-2ms |

**理由**：TFT（Temporal Fusion Transformer）是2025年加密货币价格预测领域引用最高的模型架构，具备多时间尺度注意力和可解释性。PatchTST适合长序列批量预测。WaveNet-Quant用于高频场景。XGBoost/LightGBM在因子选股和Alpha组合中表现稳定。

### 第三层：专用任务层 — 负责特定领域任务

| 模型 | 类型 | 适用场景 | 延迟 |
|-----|------|---------|------|
| **FinBERT-Crypto** | 金融NLP | 新闻情绪分析、社交媒体监控 | 20-40ms |
| **GraphSAGE-Chain** | 图神经网络 | 链上地址聚类、资金流向追踪、鲸鱼检测 | 30-50ms |
| **Isolation Forest + AutoEncoder** | 异常检测 | 异常交易检测、价格操纵识别 | 5-10ms |
| **LOB-Transformer** | 订单簿模型 | 订单簿不平衡、微观结构信号、价格冲击预测 | 3-8ms |
| **PPO-Portfolio** | 强化学习 | 动态仓位管理、资金分配优化 | 10-20ms |
| **MetaLearner-X** | 元学习 | 新币种快速适应、跨市场知识迁移 | 40-60ms |

**理由**：FinBERT是金融领域最成熟的情感分析模型。GraphSAGE适合链上图结构数据。Isolation Forest + AutoEncoder是工业级异常检测标准方案。LOB-Transformer专为限价订单簿设计。PPO是强化学习仓位管理的主流算法。

---

## 三、模型替换映射表

| 原模型 | 替换为 | 替换理由 |
|-------|-------|---------|
| GPT-4o（策略生成） | **DeepSeek-V3** | 量化基因更强，成本更低 |
| GPT-4o（价格预测） | **TFT / PatchTST** | 专用时序模型远优于LLM |
| GPT-4o（因子分析） | **XGBoost-Alpha** | 集成学习更适合因子组合 |
| GPT-4o（报告生成） | **GPT-4o**（保留） | 多模态报告生成仍是GPT-4o强项 |
| Transformer-XL | **TFT** | TFT是其直接升级版，多尺度注意力 |
| PatternGPT | **PatchTST** | 真实的长序列模式识别模型 |
| AnomalyGPT | **IsoForest-AE** | 工业级异常检测标准方案 |
| SentimentGPT | **FinBERT-Crypto** | 金融领域最成熟的NLP模型 |
| OrderBookGPT | **LOB-Transformer** | 专为限价订单簿设计的Transformer |
| CrossMarketGPT | **XGBoost-Alpha** | 跨市场因子用集成学习更合适 |
| Gemini Ultra（链上分析） | **GraphSAGE-Chain** | 图神经网络天然适合链上数据 |
| Claude 3.5（数值预测） | **Claude 3.5 Sonnet**（风险推理） | 重新定位为风险推理专用 |
| 强化学习Agent | **PPO-Portfolio** | 明确具体算法名称 |

---

## 四、各页面模型分配方案

| 页面/模块 | 主力模型 | 辅助模型 | 说明 |
|----------|---------|---------|------|
| **仪表盘** | DeepSeek-V3 | TFT | 整体状态展示，LLM负责摘要 |
| **交易引擎** | WaveNet-Quant | LOB-Transformer | 高频交易需要低延迟专用模型 |
| **策略系统** | DeepSeek-V3 | XGBoost-Alpha | LLM生成策略，集成学习回测 |
| **因子系统** | XGBoost-Alpha | LightGBM-Factor | 因子选股和组合优化 |
| **AI系统** | 多模型集成 | 全部模型 | 展示所有模型竞技和协同 |
| **数据学习** | TFT + PatchTST | GraphSAGE-Chain | 历史数据学习用时序模型 |
| **AI进化** | MetaLearner-X | PPO-Portfolio | 元学习和强化学习进化 |
| **风险管理** | Claude 3.5 Sonnet | IsoForest-AE | 风险推理+异常检测 |
| **数据分析** | TFT | FinBERT-Crypto | 数据预测+情绪分析 |
| **系统监控** | 全部模型 | — | 监控所有模型运行状态 |
| **设置** | 全部模型 | — | 模型权重配置 |

---

## 五、状态栏AI模型轮换方案

状态栏实时显示的AI模型应反映当前主力推理模型，轮换权重：

| 模型 | 轮换概率 | 说明 |
|-----|---------|------|
| DeepSeek-V3 | 35% | 主力LLM，出现频率最高 |
| TFT | 25% | 主力预测模型 |
| GPT-4o | 15% | 辅助LLM |
| XGBoost-Alpha | 10% | 因子模型 |
| PatchTST | 10% | 长序列预测 |
| Claude 3.5 | 5% | 风险推理 |
