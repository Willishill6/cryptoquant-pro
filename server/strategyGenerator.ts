
import { invokeLLM } from './_core/llm';

export async function generateStrategyCode(prompt: string): Promise<string> {
  const systemPrompt = `你是一个专业的加密货币量化交易员。
请根据用户的描述，生成一段高质量的 TypeScript 策略代码。
代码应包含策略逻辑、指标计算和风险控制。
输出格式应为纯代码块。`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;
  if (typeof content === 'string') {
    return content;
  }
  return JSON.stringify(content);
}
