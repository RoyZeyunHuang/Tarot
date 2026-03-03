import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// Real tarot-reader decision-tree recommender.
// Returns catId + spreadId matching the CATEGORIES/SPREADS constants in TarotApp.tsx.

const SYSTEM_PROMPT = `你是一位有二十年经验的塔罗师，按照真实塔罗师的决策逻辑为来访者选择最合适的牌阵。

可用牌阵（catId/spreadId/张数）：
- quick/single/1张    - quick/today/1张   - quick/now/1张
- trend/three/3张     - trend/nextstep/3张  - trend/sixmonth/6张
- love/relation/3张   - love/love4/4张   - love/lovefull/4张  - love/reunion/5张
- career/choice/3张   - career/swot/4张  - career/path/5张   - career/celtic/10张
- self/triconsciousness/3张  - self/elements/4张  - self/johari/4张  - self/shadow/6张  - self/chakra/7张

决策规则（首次始终用最小有效结构，不滥用大牌阵）：

第一步：判断问题类型
- 情绪型：含"焦虑/难受/困惑/心情/感觉/不知道怎么了/迷茫"
- 选择型：含"选/哪个/还是/A还是B/该不该/要不要"
- 关系型：含"他/她/TA/对方/我们/感情/关系/男友/女友/喜欢"
- 趋势型：含"会不会/能不能/未来/结果/成功/失败/会怎样"
- 根源型：含"为什么总是/反复/一直/困住/模式/原因/为什么我"

第二步：匹配牌阵（最小原则）
- 情绪型，简单 → self/triconsciousness（先看三层自我）
- 情绪型，很模糊 → quick/single（先抽一张对焦）
- 选择型 → career/choice（二选一最直接）
- 关系型，基础问题 → love/relation（关系基础阵）
- 关系型，复合/复杂 → love/love4
- 趋势型 → trend/three（过去现在未来最经典）
- 根源型，首次 → self/triconsciousness
- 根源型，反复模式长期困扰 → self/shadow
- 非常简单/不清楚问什么 → quick/single

只输出JSON，不含任何其他文字：
{"catId":"类别id","spreadId":"牌阵id","reason":"一句话说明为什么选这个"}`;

interface RecommendResult {
  catId: string;
  spreadId: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const question = (body.question ?? '').trim();
  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    return NextResponse.json({ error: 'Upstream error' }, { status: upstreamRes.status });
  }

  const data = await upstreamRes.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = (data.choices?.[0]?.message?.content ?? '').trim().replace(/```json|```/g, '');

  let result: RecommendResult;
  try {
    result = JSON.parse(raw) as RecommendResult;
  } catch {
    result = { catId: 'trend', spreadId: 'three', reason: '默认三张牌阵' };
  }

  return NextResponse.json(result);
}
