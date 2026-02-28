/**
 * TradingBrain — AI交易大脑核心面板
 * 展示投资人格、自我进化状态、因子生成、结构化决策输出
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Dna, Target, Sparkles, GitBranch, Layers, Cpu, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// ============ INVESTMENT PERSONALITY ============
interface PersonalityTrait {
  name: string;
  value: number;     // 0-100
  label: string;
  leftLabel: string;
  rightLabel: string;
  color: string;
}

const personalityTraits: PersonalityTrait[] = [
  { name: "风险偏好", value: 0, label: "未初始化", leftLabel: "极度保守", rightLabel: "极度激进", color: "#00d4ff" },
  { name: "持仓周期", value: 0, label: "未初始化", leftLabel: "超短线", rightLabel: "长期持有", color: "#00ff88" },
  { name: "趋势偏好", value: 0, label: "未初始化", leftLabel: "逆势交易", rightLabel: "顺势交易", color: "#ffaa00" },
  { name: "分散度", value: 0, label: "未初始化", leftLabel: "集中持仓", rightLabel: "极度分散", color: "#8b5cf6" },
  { name: "止损纪律", value: 0, label: "未初始化", leftLabel: "灵活止损", rightLabel: "鐵血止损", color: "#f43f5e" },
  { name: "情绪抗性", value: 0, label: "未初始化", leftLabel: "情绪驱动", rightLabel: "完全理性", color: "#06b6d4" },
];

// ============ SELF-PLAY TRAINING ============
interface TrainingRound {
  id: number;
  timestamp: number;
  opponent: string;
  result: "胜" | "负" | "平";
  winRate: number;
  improvement: number;
  lesson: string;
}

// ============ FACTOR GENERATION ============
interface GeneratedFactor {
  id: string;
  name: string;
  type: string;
  ic: number;          // Information Coefficient
  sharpe: number;
  status: "活跃" | "观察" | "淘汰";
  discoveredAt: number;
  source: string;
}

// ============ STRUCTURED DECISION ============
interface StructuredDecision {
  id: string;
  timestamp: number;
  coin: string;
  signal: "买入" | "卖出" | "持有";
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  currentPrice: number;
  riskRewardRatio: number;
  factors: string[];
  reasoning: string;
  model: string;
  executionPriority: "立即" | "等待确认" | "低优先";
}

// ============ DATA GENERATION ============
function generateTrainingRounds(): TrainingRound[] {
  // 暂无训练记录，返回空数组
  return [];
}

function generateFactors(): GeneratedFactor[] {
  // 暂无因子数据，返回空数组
  return [];
}

function generateDecisions(): StructuredDecision[] {
  // 暂无决策数据，返回空数组
  return [];
}

// ============ MAIN COMPONENT ============
export default function TradingBrain() {
  const [activeTab, setActiveTab] = useState<"personality" | "selfplay" | "factors" | "decisions">("personality");
  const [traits, setTraits] = useState(personalityTraits);
  const [trainingRounds] = useState(generateTrainingRounds);
  const [factors] = useState(generateFactors);
  const [decisions] = useState(generateDecisions);
  const [evolutionPulse, setEvolutionPulse] = useState(0);

  // 暂停假人格微进化模拟，等待真实AI训练数据
  // useEffect(() => { ... }, []);

  const formatPrice = (p: number) => p < 1 ? p.toPrecision(4) : p.toFixed(2);
  const formatTime = (ts: number) => {
    const ago = Math.floor((Date.now() - ts) / 1000);
    if (ago < 60) return `${ago}秒前`;
    if (ago < 3600) return `${Math.floor(ago / 60)}分钟前`;
    if (ago < 86400) return `${Math.floor(ago / 3600)}小时前`;
    return `${Math.floor(ago / 86400)}天前`;
  };

  const activeFactors = factors.filter(f => f.status === "活跃");
  const trainingWins = trainingRounds.filter(r => r.result === "胜").length;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyber-blue" />
            AI交易大脑
            <motion.span
              key={evolutionPulse}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-2 h-2 rounded-full bg-cyber-green"
            />
            <Badge variant="outline" className="text-[7px] py-0 text-cyber-green border-cyber-green/30">
              自我进化中
            </Badge>
          </CardTitle>
        </div>
        {/* Tab bar */}
        <div className="flex items-center gap-1 mt-2">
          {([
            { key: "personality" as const, label: "投资人格", icon: Sparkles },
            { key: "selfplay" as const, label: "自我对弈", icon: GitBranch },
            { key: "factors" as const, label: "因子生成", icon: Layers },
            { key: "decisions" as const, label: "决策输出", icon: Target },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2 py-1 rounded text-[9px] flex items-center gap-1 transition-colors ${
                activeTab === tab.key ? "bg-cyber-blue/20 text-cyber-blue" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3 h-3" />{tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {activeTab === "personality" && (
            <motion.div key="personality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Investment Philosophy */}
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-cyber-blue/5 to-cyber-green/5 border border-cyber-blue/10 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-4 h-4 text-cyber-blue" />
                  <span className="text-[10px] font-bold text-cyber-blue">当前投资哲学</span>
                  <Badge variant="outline" className="text-[7px] py-0 text-cyber-amber border-cyber-amber/30 ml-auto">
                    Gen-0 · 等待进化
                  </Badge>
                </div>
                <p className="text-[10px] text-foreground/70 leading-relaxed">
                  "在趋势明确时顺势而为，在震荡市场中保持耐心。严格控制单笔风险不超过总资金2%，
                  优先选择多因子共振的高置信度信号。对Meme币保持谨慎但不排斥，链上数据权重高于纯技术分析。
                  持续学习市场新模式，但不轻易改变核心原则。"
                </p>
              </div>

              {/* Personality Traits Radar */}
              <div className="space-y-2.5">
                {traits.map((trait, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium">{trait.name}</span>
                      <span className="text-[9px] font-mono" style={{ color: trait.color }}>{trait.label}</span>
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between text-[7px] text-muted-foreground/50 mb-0.5">
                        <span>{trait.leftLabel}</span>
                        <span>{trait.rightLabel}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/30 overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: trait.color, width: `${trait.value}%` }}
                          animate={{ width: `${trait.value}%` }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        />
                        {/* Center marker */}
                        <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personality evolution log */}
              <div className="mt-3 p-2 rounded-lg bg-secondary/10 border border-border/20">
                <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Dna className="w-3 h-3" />人格进化记录
                </div>
                {[
                  { time: "2小时前", event: "风险偏好从58→62: 检测到牛市趋势增强", impact: "+4" },
                  { time: "6小时前", event: "止损纪律从82→85: 连续止损成功避免大亏", impact: "+3" },
                  { time: "1天前", event: "情绪抗性从88→91: 在恐慌抛售中保持冷静获利", impact: "+3" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-[9px]">
                    <span className="text-muted-foreground/50 w-14 flex-shrink-0">{log.time}</span>
                    <span className="text-foreground/70 flex-1">{log.event}</span>
                    <Badge variant="outline" className="text-[7px] py-0 text-cyber-green border-cyber-green/30">{log.impact}</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "selfplay" && (
            <motion.div key="selfplay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Training stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-cyber-green/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-green">{trainingWins}/{trainingRounds.length}</div>
                  <div className="text-[8px] text-muted-foreground">对弈胜率</div>
                </div>
                <div className="p-2 rounded-lg bg-cyber-blue/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-blue">2,847</div>
                  <div className="text-[8px] text-muted-foreground">累计训练轮次</div>
                </div>
                <div className="p-2 rounded-lg bg-cyber-amber/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-amber">+12.3%</div>
                  <div className="text-[8px] text-muted-foreground">本周能力提升</div>
                </div>
              </div>

              {/* Training rounds */}
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {trainingRounds.map(round => (
                  <div key={round.id} className={`p-2 rounded-lg border transition-colors ${
                    round.result === "胜" ? "border-cyber-green/15 bg-cyber-green/3" :
                    round.result === "负" ? "border-cyber-magenta/15 bg-cyber-magenta/3" :
                    "border-border/20 bg-secondary/5"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[7px] py-0 border-0 ${
                        round.result === "胜" ? "bg-cyber-green/15 text-cyber-green" :
                        round.result === "负" ? "bg-cyber-magenta/15 text-cyber-magenta" :
                        "bg-secondary/20 text-muted-foreground"
                      }`}>{round.result}</Badge>
                      <span className="text-[9px] font-mono">vs {round.opponent}</span>
                      <span className="text-[8px] text-muted-foreground ml-auto">{formatTime(round.timestamp)}</span>
                    </div>
                    <p className="text-[9px] text-foreground/60 mb-1">
                      <Sparkles className="w-3 h-3 inline mr-1 text-cyber-amber" />
                      学到: {round.lesson}
                    </p>
                    <div className="flex items-center gap-3 text-[8px]">
                      <span className="text-muted-foreground">胜率 <span className="font-mono text-cyber-green">{round.winRate}%</span></span>
                      <span className="text-muted-foreground">能力变化 <span className={`font-mono ${round.improvement >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>{round.improvement >= 0 ? "+" : ""}{round.improvement}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "factors" && (
            <motion.div key="factors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Factor stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-cyber-green/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-green">{activeFactors.length}</div>
                  <div className="text-[8px] text-muted-foreground">活跃因子</div>
                </div>
                <div className="p-2 rounded-lg bg-cyber-blue/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-blue">{(activeFactors.reduce((s, f) => s + f.ic, 0) / activeFactors.length).toFixed(3)}</div>
                  <div className="text-[8px] text-muted-foreground">平均IC</div>
                </div>
                <div className="p-2 rounded-lg bg-cyber-amber/5 text-center">
                  <div className="text-lg font-bold font-mono text-cyber-amber">{(activeFactors.reduce((s, f) => s + f.sharpe, 0) / activeFactors.length).toFixed(2)}</div>
                  <div className="text-[8px] text-muted-foreground">平均夏普</div>
                </div>
              </div>

              {/* Factor list */}
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {factors.sort((a, b) => b.ic - a.ic).map(factor => (
                  <div key={factor.id} className={`p-2 rounded-lg border transition-colors ${
                    factor.status === "活跃" ? "border-cyber-green/15 bg-cyber-green/3" :
                    factor.status === "观察" ? "border-cyber-amber/15 bg-cyber-amber/3" :
                    "border-muted-foreground/15 bg-secondary/5 opacity-60"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[7px] py-0 ${
                        factor.status === "活跃" ? "border-cyber-green/30 text-cyber-green" :
                        factor.status === "观察" ? "border-cyber-amber/30 text-cyber-amber" :
                        "border-muted-foreground/30 text-muted-foreground"
                      }`}>{factor.status}</Badge>
                      <span className="text-[10px] font-bold">{factor.name}</span>
                      <Badge variant="outline" className="text-[7px] py-0 border-border/30 text-muted-foreground">{factor.type}</Badge>
                      <div className="ml-auto flex items-center gap-2 text-[8px]">
                        <span className="text-muted-foreground">IC <span className={`font-mono ${factor.ic > 0.3 ? "text-cyber-green" : factor.ic > 0.2 ? "text-cyber-amber" : "text-muted-foreground"}`}>{factor.ic.toFixed(3)}</span></span>
                        <span className="text-muted-foreground">夏普 <span className="font-mono text-cyber-blue">{factor.sharpe.toFixed(2)}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[8px]">
                      <span className="text-muted-foreground/50">来源: {factor.source}</span>
                      <span className="text-muted-foreground/50 ml-auto">发现于 {formatTime(factor.discoveredAt)}</span>
                    </div>
                    {/* IC bar */}
                    <div className="mt-1 h-1 rounded-full bg-secondary/20 overflow-hidden">
                      <div className={`h-full rounded-full ${factor.ic > 0.3 ? "bg-cyber-green" : factor.ic > 0.2 ? "bg-cyber-amber" : "bg-muted-foreground/30"}`} style={{ width: `${factor.ic * 200}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "decisions" && (
            <motion.div key="decisions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {decisions.map(dec => (
                  <div key={dec.id} className={`p-2.5 rounded-lg border ${
                    dec.signal === "买入" ? "border-cyber-green/20 bg-cyber-green/3" :
                    dec.signal === "卖出" ? "border-cyber-magenta/20 bg-cyber-magenta/3" :
                    "border-border/20 bg-secondary/5"
                  }`}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        dec.signal === "买入" ? "bg-cyber-green/15" : dec.signal === "卖出" ? "bg-cyber-magenta/15" : "bg-secondary/20"
                      }`}>
                        {dec.signal === "买入" ? <ArrowUpRight className="w-3.5 h-3.5 text-cyber-green" /> :
                         dec.signal === "卖出" ? <ArrowDownRight className="w-3.5 h-3.5 text-cyber-magenta" /> :
                         <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <span className="text-xs font-bold">{dec.coin}/USDT</span>
                      <Badge variant="outline" className={`text-[7px] py-0 ${
                        dec.signal === "买入" ? "border-cyber-green/30 text-cyber-green" :
                        dec.signal === "卖出" ? "border-cyber-magenta/30 text-cyber-magenta" :
                        "border-muted-foreground/30 text-muted-foreground"
                      }`}>{dec.signal}</Badge>
                      <Badge variant="outline" className={`text-[7px] py-0 ${
                        dec.executionPriority === "立即" ? "border-cyber-green/30 text-cyber-green" :
                        dec.executionPriority === "等待确认" ? "border-cyber-amber/30 text-cyber-amber" :
                        "border-muted-foreground/30 text-muted-foreground"
                      }`}>{dec.executionPriority}</Badge>
                      <span className="text-[8px] text-muted-foreground ml-auto flex items-center gap-0.5">
                        <Cpu className="w-2.5 h-2.5" />{dec.model}
                      </span>
                    </div>

                    {/* Reasoning */}
                    <p className="text-[9px] text-foreground/60 mb-2 leading-relaxed">{dec.reasoning}</p>

                    {/* Metrics */}
                    <div className="flex items-center gap-3 text-[8px] mb-1.5">
                      <span className="text-muted-foreground">现价 <span className="font-mono text-foreground">${formatPrice(dec.currentPrice)}</span></span>
                      <span className="text-muted-foreground">目标 <span className="font-mono text-cyber-green">${formatPrice(dec.targetPrice)}</span></span>
                      <span className="text-muted-foreground">止损 <span className="font-mono text-cyber-magenta">${formatPrice(dec.stopLoss)}</span></span>
                      <span className="text-muted-foreground">R:R <span className="font-mono text-cyber-blue">{dec.riskRewardRatio}</span></span>
                      <span className="text-muted-foreground">置信 <span className={`font-mono ${dec.confidence > 80 ? "text-cyber-green" : dec.confidence > 65 ? "text-cyber-amber" : "text-muted-foreground"}`}>{dec.confidence}%</span></span>
                    </div>

                    {/* Contributing factors */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Layers className="w-3 h-3 text-muted-foreground/50" />
                      {dec.factors.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[7px] py-0 border-cyber-blue/20 text-cyber-blue/70">{f}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
