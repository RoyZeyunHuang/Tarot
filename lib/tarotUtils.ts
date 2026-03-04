import {
  MAJORS, SUITS, NUMBERS,
  TAG_FOCUS, PROFILE_KEY,
  defaultProfile,
} from './tarotData';

// ─── Storage ──────────────────────────────────────────────────────────────────
export async function loadStorage(key: string, fallback: unknown) {
  try {
    if (typeof window === 'undefined') return fallback;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

export async function saveStorage(key: string, val: unknown) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { console.error('storage err', e); }
}

// ─── Deck ─────────────────────────────────────────────────────────────────────
export function randomCard() {
  const m = Math.random() < 0.28;
  const n = m
    ? MAJORS[Math.floor(Math.random() * MAJORS.length)]
    : SUITS[Math.floor(Math.random() * SUITS.length)] +
      NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  return { name: n, orientation: Math.random() < 0.28 ? '逆位' : '正位' };
}

export function buildShuffledDeck() {
  const all: string[] = [];
  MAJORS.forEach((n) => all.push(n));
  SUITS.forEach((s) => NUMBERS.forEach((n) => all.push(s + n)));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map((name, idx) => ({
    name,
    orientation: Math.random() < 0.28 ? '逆位' : '正位',
    id: idx,
    picked: false,
  }));
}

// ─── Patterns ─────────────────────────────────────────────────────────────────
export function detectPatterns(newCards: any[], history: any[], profile: any) {
  const patterns: string[] = [];
  const newNames = newCards.map((c) => c.name);
  const recent5 = (history || []).slice(0, 5);
  const recentAll = recent5.reduce(
    (a: string[], r: any) => a.concat((r.cards || []).map((c: any) => c.name)),
    []
  );
  const seen: Record<string, boolean> = {};
  const repeated = newNames.filter((n) => {
    if (!seen[n] && recentAll.indexOf(n) >= 0) { seen[n] = true; return true; }
    return false;
  });
  if (repeated.length > 0) {
    repeated.slice(0, 3).forEach((card) => {
      const cnt = recentAll.filter((c: string) => c === card).length + 1;
      patterns.push(`「${card}」在近${Math.min(recent5.length + 1, 6)}次解读中出现了${cnt}次，这是一个强烈的重复信号`);
    });
  }
  const suitMap: Record<string, string> = { 权杖: '火', 圣杯: '水', 宝剑: '风', 星币: '土' };
  const elCounts: Record<string, number> = { 火: 0, 水: 0, 风: 0, 土: 0, 大阿卡纳: 0 };
  newCards.forEach((c) => {
    const s = SUITS.find((su) => c.name.indexOf(su) === 0);
    if (s) elCounts[suitMap[s]]++; else elCounts['大阿卡纳']++;
  });
  const dominant = Object.entries(elCounts).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]);
  if (dominant.length > 0 && dominant[0][1] >= 2 && newCards.length >= 3) {
    const elM: Record<string, string> = { 火: '行动力与热情', 水: '情感与直觉', 风: '思维与沟通', 土: '物质与现实', 大阿卡纳: '重大人生课题' };
    patterns.push(`本次牌面${dominant[0][0]}元素主导（${elM[dominant[0][0]] || ''}）`);
  }
  const revCount = newCards.filter((c) => c.orientation === '逆位').length;
  if (newCards.length >= 3) {
    if (revCount / newCards.length >= 0.6)
      patterns.push(`逆位牌比例偏高(${revCount}/${newCards.length})，暗示当前处于能量调整期`);
    else if (revCount === 0)
      patterns.push('全部正位，整体能量流畅通达');
  }
  if (profile && profile.topCategories) {
    const sorted = Object.entries(profile.topCategories as Record<string, number>).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] >= 3) {
      const cn2: Record<string, string> = { quick: '快速指引', trend: '趋势发展', love: '感情关系', career: '事业决策', self: '自我探索' };
      patterns.push(`问卜者近期持续关注「${cn2[sorted[0][0]] || sorted[0][0]}」领域`);
    }
  }
  return patterns;
}

// ─── Profile update ───────────────────────────────────────────────────────────
export function updateProfile(profile: any, newReading: any, aiUpdate: any) {
  const p = { ...profile };
  p.totalReadings = (p.totalReadings || 0) + 1;
  if (!p.firstReadingDate) p.firstReadingDate = newReading.date;
  p.lastReadingDate = newReading.date;
  const cats = { ...(p.topCategories || {}) };
  if (newReading.category) cats[newReading.category] = (cats[newReading.category] || 0) + 1;
  p.topCategories = cats;
  const fc = { ...(p.frequentCards || {}) };
  (newReading.cards || []).forEach((c: any) => { fc[c.name] = (fc[c.name] || 0) + 1; });
  p.frequentCards = fc;
  if (aiUpdate && aiUpdate.themes) {
    const existing = (p.recurringThemes || []).slice();
    aiUpdate.themes.forEach((t: string) => {
      if (t && t.trim() && existing.indexOf(t.trim()) < 0) existing.push(t.trim());
    });
    p.recurringThemes = existing.slice(-15);
  }
  return p;
}

// ─── History filter ───────────────────────────────────────────────────────────
export function getRelevantHistory(all: any[], category: string | null) {
  if (!all || all.length === 0) return [];
  const sameCat = all.filter((r) => r.category === category).slice(0, 2);
  const ids = sameCat.map((r) => r.id);
  const recent = all.filter((r) => ids.indexOf(r.id) < 0).slice(0, 1);
  return sameCat.concat(recent).slice(0, 3);
}

// ─── AI Prompt ────────────────────────────────────────────────────────────────
export function buildSmartPrompt(catId: string | null, profile: any, history: any[], patterns: string[]) {
  const focus = catId ? TAG_FOCUS[catId] + '。' : '';
  const schema = `以JSONL格式输出两行（每行一个完整JSON对象，对象内所有字符串不含真正的换行符）：
第1行只含cardReadings：{"cardReadings":[{"position":"牌位","card":"牌名","core":"把牌面意象锚定到问卜者的具体问题上：先用1句描述牌面最核心的画面，然后直接说出这张牌在这个问题语境下意味着什么具体处境或心理状态——不是牌义解释，而是一个具体的场景，让人读完觉得「这说的就是我此刻的情况」。禁止出现能套在任何人身上的泛泛句子（3-4句）","symbol":"点出一个最关键的视觉符号及其隐喻（1-2句，具体而诗意）"}]}
第2行只含synthesis：{"synthesis":"综合推演不少于200字：以「关于你问的」开头。每一句话都必须对得上问卜者的具体问题，禁止出现可以套在任何人任何问题上的泛泛表达。要做到：①点出这个人在这个问题上最可能的具体处境或行为模式，②说出他们自己可能没意识到但牌面揭示的内在矛盾，③把多张牌的意象串联成一个针对这个问题的完整叙事。像一个真正了解对方处境的人在说话，而不是在背牌义"}
第3行含其余字段：{"energy":"当前核心能量（2句）","trend":"未来趋势（2句）","action":"具体可操作的行动建议（2-3句）","timeWindow":"时间窗口（1句）","closing":"温暖收尾（1句）","deepQuestions":["基于这次牌阵，从内心情感角度提一个深挖问题（1句，问句，中文）","基于这次牌阵，从外部处境或关系角度提一个深挖问题（1句，问句，中文）","基于这次牌阵，从深层模式或根源角度提一个深挖问题（1句，问句，中文）"],"profileUpdate":{"themes":["1-2个核心主题关键词"],"emotionalTone":"情绪基调一词"}}
严格要求：只输出这三行JSON，无其他文字，每行必须是合法且完整的JSON对象。`;
  let sys = '你是一位拥有20年经验的资深塔罗占卜师，擅长结合透特塔罗与韦特塔罗的精髓，同时具备荣格心理学与深层叙事治疗的视角。你用牌面的图像说话：每一张牌都是一幅画，你从画中读出问卜者的处境与内心。你的语言有画面感、有智慧、温暖而深刻，能触及人最不愿正视却最需要听到的部分。' + focus + '牌面解析时：请描述牌面的意象与符号（人物姿态、颜色、场景细节），说明这个画面如何照应问卜者的问题，让人感受到与牌的真实连接。综合解读时（synthesis字段）：这是整个解读最重要的部分，必须不少于200字。要像一位真正了解对方的人在说话——不是泛泛而谈，而是针对这个人、这个问题、这些牌，说出那些埋在问题背后的真实心理：他们真正在意什么、什么在内心深处拉扯他们、他们用什么方式保护自己、这背后藏着什么更深的恐惧或渴望。把所有牌的意象编织成一个有力的整体叙事，让人读完有被看见、被触动的感觉。每次解读都必须让人觉得是专门为他们这个问题写的，而不是换个名字也能用的模板回答。';
  if (profile && profile.totalReadings > 0) {
    sys += `\n\n【问卜者档案】这位问卜者已进行过${profile.totalReadings}次占卜，首次占卜于${profile.firstReadingDate || '近期'}。`;
    const topCats = Object.entries(profile.topCategories || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
    if (topCats.length > 0) {
      const cn: Record<string, string> = { quick: '快速指引', trend: '趋势发展', love: '感情关系', career: '事业决策', self: '自我探索' };
      sys += '最常关注的领域：' + topCats.map((e: any) => `${cn[e[0]] || e[0]}(${e[1]}次)`).join('、') + '。';
    }
    if (profile.recurringThemes && profile.recurringThemes.length > 0)
      sys += '长期关注的主题：' + profile.recurringThemes.slice(0, 5).join('、') + '。';
    sys += '请结合背景做更有针对性的解读，但不要让历史偏见影响对当前牌面的客观分析。';
  }
  if (history && history.length > 0) {
    sys += '\n\n【近期相关占卜记录】';
    history.forEach((r: any) => {
      const cs = (r.cards || []).map((c: any) => `${c.name}(${c.orientation})`).join('、');
      sys += `\n- ${r.date}：问「${r.question}」，牌面：${cs}`;
      if (r.synthesis) sys += '。核心：' + r.synthesis.substring(0, 100);
    });
    sys += '\n请在解读中自然关联历史脉络，帮助问卜者看到变化趋势。';
  }
  if (patterns && patterns.length > 0)
    sys += '\n\n【洞察线索】\n' + patterns.map((p) => `- ${p}`).join('\n');
  sys += '\n\n输出格式要求：\n' + schema;
  return sys;
}

// ─── Stream helpers ───────────────────────────────────────────────────────────
export function extractStreamingField(buf: string, fieldName: string): string {
  const key = `"${fieldName}":"`;
  const start = buf.indexOf(key);
  if (start === -1) return '';
  let pos = start + key.length;
  let result = '';
  while (pos < buf.length) {
    const c = buf[pos];
    if (c === '\\' && pos + 1 < buf.length) {
      pos++;
      const e = buf[pos];
      if (e === 'n') result += '\n';
      else if (e === 't') result += '\t';
      else if (e === '"') result += '"';
      else if (e === '\\') result += '\\';
      else result += e;
    } else if (c === '"') { break; }
    else { result += c; }
    pos++;
  }
  return result;
}

export function tryParseNextObj(text: string): { obj: any; rest: string } | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try {
          const obj = JSON.parse(text.slice(start, i + 1));
          return { obj, rest: text.slice(i + 1) };
        } catch { return null; }
      }
    }
  }
  return null;
}
