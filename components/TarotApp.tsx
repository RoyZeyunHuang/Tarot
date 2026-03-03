// @ts-nocheck
'use client';
import React, { useState, useRef, useEffect } from "react";

const PROFILE_KEY = "tarot-profile";
const READINGS_KEY = "tarot-readings";
const MAX_READINGS = 50;
const defaultProfile = { totalReadings:0, firstReadingDate:null, lastReadingDate:null, topCategories:{}, recurringThemes:[], frequentCards:{}, communicationStyle:"default" };

// Storage helpers — localStorage with SSR safety (never called server-side due to useEffect / event handlers)
async function loadStorage(key, fallback) {
  try {
    if (typeof window === 'undefined') return fallback;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}
async function saveStorage(key, val) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch(e) { console.error("storage err", e); }
}

const TAROT_DB={"愚者":{keywords:"自由/新开始/冒险",upright:"踏上未知旅程，以赤子之心面对世界。象征纯粹的潜力与无限可能，提示你放下顾虑，勇敢迈步。",reversed:"鲁莽冒进或逃避责任。需检视自己是否在逃避现实，或因过度谨慎而错失机会。"},"魔术师":{keywords:"意志/创造/行动",upright:"你拥有实现目标所需的一切资源。是行动的时刻，专注意志力，将想法化为现实。",reversed:"技能被滥用或缺乏方向。警惕欺骗包括自欺，重新审视动机是否真诚。"},"女祭司":{keywords:"直觉/神秘/潜意识",upright:"聆听内心深处的声音。答案已在你内在，需要静默与耐心，让潜意识的智慧浮现。",reversed:"忽视直觉或隐藏信息。你可能过度依赖理性而压制直觉，或有重要信息尚未揭露。"},"女皇":{keywords:"丰盛/滋养/创造力",upright:"生命力旺盛，创造与滋养的能量涌现。代表富饶、母性关怀与感官享受，万物欣欣向荣。",reversed:"创造力受阻或过度依赖。可能在关系中过度给予而耗尽自己，或自我价值感不足。"},"皇帝":{keywords:"权威/结构/稳定",upright:"建立秩序与稳定的时机。通过纪律与计划掌控局面，展现领导力，为目标奠定坚实基础。",reversed:"独裁或控制欲过强。检视是否在强迫他人或被权威压制，需在控制与灵活之间寻求平衡。"},"教皇":{keywords:"传统/智慧/指引",upright:"寻求精神或传统的指引。导师、机构或既有智慧将为你提供方向，遵循已验证的方法前行。",reversed:"教条或盲从权威。质疑所遵循的规则是否真正适合你，或正经历精神信仰的动荡。"},"恋人":{keywords:"选择/联结/价值观",upright:"面临重要选择，需遵循内心的价值观。代表深刻的情感连结与灵魂层面的契合，也象征对真实自我的承诺。",reversed:"价值观冲突或关系失衡。可能在做出违背内心的选择，或关系中存在不和谐需要正视。"},"战车":{keywords:"意志力/胜利/掌控",upright:"以坚定意志克服障碍，驾驭内外的冲突力量。胜利在望，保持专注与自律，不被分散注意力。",reversed:"失控或强行推进。冲动行事或用力过猛反而适得其反，需要重新找回内在的平衡与方向。"},"力量":{keywords:"勇气/耐心/内在力量",upright:"以柔克刚，用温柔与耐心驯服内在的恐惧与冲动。真正的力量来自内心，而非强硬的外力。",reversed:"自我怀疑或压抑情绪。内在力量暂时被遮蔽，可能因过度压抑情绪而导致能量内耗。"},"隐士":{keywords:"内省/孤独/智慧",upright:"独处与内省的时刻已到来。退入内心寻找答案，在宁静中连接深层智慧，不必急于向外寻求认可。",reversed:"过度隔离或拒绝内省。可能在逃避孤独带来的洞见，或因过度孤立而与现实脱节。"},"命运之轮":{keywords:"命运/循环/转机",upright:"命运的齿轮正在转动，变化即将到来。接受生命的循环规律，这可能是好运的开始或重要的转折点。",reversed:"抗拒改变或时机不佳。执着于掌控无法改变的事，或正处于下行周期，需要耐心等待。"},"正义":{keywords:"公平/真相/因果",upright:"事情将以公平客观的方式得到裁决。面对决定时保持诚实，因果法则正在运作，真相终将显现。",reversed:"不公或逃避后果。可能在逃避责任或面临不公正的对待，需诚实检视自己在其中扮演的角色。"},"倒吊人":{keywords:"暂停/放下/新视角",upright:"主动暂停，从不同角度审视处境。放下执念与控制，接受当下的等待期，内在的领悟正在酝酿。",reversed:"拖延或无谓牺牲。陷入僵局却不愿做出改变，或在不值得的事情上消耗自己。"},"死神":{keywords:"终结/转化/蜕变",upright:"一个阶段正在结束，为新生腾出空间。这不是字面意义的死亡，而是深刻的转化，放下旧有，迎接新生。",reversed:"抗拒改变或停滞不前。执着于已经结束的事物，拒绝放手只会延长痛苦，转化的时机已到。"},"节制":{keywords:"平衡/耐心/整合",upright:"寻求中道与平衡，将对立的力量和谐整合。耐心是关键，慢慢调和不同元素，一切正朝着正确方向流动。",reversed:"极端或缺乏耐心。在某个领域过度放纵或过度压抑，需要重新校准生活中的各项平衡。"},"恶魔":{keywords:"束缚/阴影/物质执念",upright:"审视那些束缚你的执念、恐惧或有害模式。这些锁链往往是自己套上的，意识到它们是解脱的第一步。",reversed:"挣脱束缚或面对阴影。正在从依赖与执念中觉醒，有勇气直视内心阴影并寻求解放。"},"塔":{keywords:"突变/崩塌/启示",upright:"突如其来的剧变将打破原有的格局。虽然过程震荡，但建立在虚假基础上的事物必须崩塌，真实才能显现。",reversed:"避免了灾难或拖延改变。可能在勉强维持一个早已不稳固的处境，内在的动荡需要被正视。"},"星星":{keywords:"希望/疗愈/指引",upright:"经历风雨后，希望与疗愈的光芒降临。相信宇宙的引导，保持开放与信任，内心的创伤正在愈合。",reversed:"失望或失去希望。可能暂时感到迷失或信心不足，提醒你重新连接内在的光，希望仍在。"},"月亮":{keywords:"幻象/直觉/潜意识",upright:"事情并不如表面所见。潜意识的恐惧与幻象可能扭曲现实，此时需要信任直觉，穿透迷雾寻找真相。",reversed:"幻象消散或压抑的恐惧浮现。长期隐藏的真相或情绪正在浮出水面，面对它是走向清晰的唯一路径。"},"太阳":{keywords:"活力/成功/喜悦",upright:"光明与成功照耀你的道路。充满活力与自信，事情进展顺利，值得庆祝与享受当下的美好。",reversed:"过度乐观或活力受阻。可能对现实过于乐观而忽视细节，或内心深处的喜悦被某些事遮蔽。"},"审判":{keywords:"觉醒/召唤/重生",upright:"内在的觉醒召唤你超越过去的限制。聆听更高层次的呼唤，对自己和他人做出公正的评估，接受蜕变的邀请。",reversed:"自我怀疑或逃避评判。害怕面对自己的行为后果，或对过去的事耿耿于怀而无法前进。"},"世界":{keywords:"完成/整合/成就",upright:"一个重要循环圆满完成。你整合了过去的所有经历，站在新的起点，充满成就感与完整感。",reversed:"未竟之事或拒绝完结。接近终点却在最后一步退缩，需要检视是什么阻止你真正完成这段旅程。"},"权杖王牌":{keywords:"灵感/新开始/创意火花",upright:"强大的创意与行动能量涌现。这是开启新项目或冒险的完美时机，抓住这股热情与灵感。",reversed:"能量受阻或创意枯竭。好的想法难以落实，或动力在起步阶段便消散，需重新点燃内在热情。"},"权杖二":{keywords:"规划/远见/等待",upright:"站在高处展望未来，制定长远计划。你有能力开创属于自己的道路，是时候做出勇敢的选择。",reversed:"犹豫不决或计划受阻。害怕踏出舒适圈，或感到前路茫然，需重新确认自己真正想要什么。"},"权杖三":{keywords:"扩展/成果/远航",upright:"努力开始结出果实，视野进一步扩展。是时候将计划推向更广阔的舞台，机会正在你的地平线上出现。",reversed:"延误或缺乏远见。计划遭遇意外阻碍，或因短视而错失扩展的时机。"},"权杖四":{keywords:"庆祝/稳定/家园",upright:"里程碑式的成就值得庆祝。家庭、社群与稳定的基础带来真实的幸福感，享受这段和谐美好的时光。",reversed:"不稳定或缺乏归属感。家庭或工作环境中存在紧张关系，对家的定义可能正在经历重新审视。"},"权杖五":{keywords:"竞争/冲突/挑战",upright:"面对竞争与分歧，将其视为激发潜能的动力。这种摩擦有助于磨砺你的想法与能力，接受挑战。",reversed:"内耗或逃避冲突。不必要的争论消耗能量，或刻意回避必要的对话，需要找到建设性的出口。"},"权杖六":{keywords:"胜利/认可/凯旋",upright:"努力获得认可，胜利属于你。此刻可以自信地展示成就，你的领导力与付出正受到肯定。",reversed:"自我怀疑或成功被延迟。担心他人评价而不敢展现自己，或即将到来的成功因故受阻。"},"权杖七":{keywords:"防守/坚守/挑战",upright:"面临来自四面八方的挑战，但你站在有利位置。坚守自己的立场，捍卫你所相信与珍视的事物。",reversed:"精疲力竭或放弃防守。长期处于防御状态令人身心俱疲，需评估这场坚守是否值得继续。"},"权杖八":{keywords:"速度/行动/快速推进",upright:"事情正以极快的速度推进。把握这股势头，迅速采取行动，一切正朝着目标高速移动。",reversed:"延误或能量分散。行动受到阻碍，或同时追逐太多方向导致效率低落。"},"权杖九":{keywords:"韧性/坚守/疲惫",upright:"历经重重考验，你仍坚守阵地。保留最后的力气，胜利近在眼前，不要在最后关头放弃。",reversed:"偏执或精力透支。长期的防御状态演变为不信任与偏执，是时候放下戒备，寻求支持。"},"权杖十":{keywords:"重担/责任/过载",upright:"承担了太多的责任与重担。审视哪些是真正属于你的，学会委派或放下不必要的负担。",reversed:"拒绝放手或崩溃边缘。明知不堪重负却仍死撑，需要诚实面对自己的极限并寻求帮助。"},"权杖侍从":{keywords:"热情/探索/消息",upright:"充满好奇与探索精神，带来新鲜能量或振奋消息。是开始学习新技能或追求创意项目的好时机。",reversed:"鲁莽或缺乏方向。热情有余而沉稳不足，想法还不成熟便急于行动，需要更好的规划。"},"权杖骑士":{keywords:"冒险/冲劲/勇往直前",upright:"充满活力与冒险精神，勇敢追逐目标。以大胆的行动冲破阻碍，但记得保持一定的方向感。",reversed:"冲动或不计后果。行动过于仓促，或沉迷于刺激而忽视了责任与后果。"},"权杖王后":{keywords:"热情/独立/魅力",upright:"充满自信与活力，以温暖的魅力感染周围的人。这是勇于表达自我、追求热情的最佳时机。",reversed:"嫉妒或能量失控。可能将热情演变为控制欲，或因缺乏安全感而做出破坏性的行为。"},"权杖国王":{keywords:"领导力/远见/魄力",upright:"以远见与魄力引领他人，是充满创造力的自然领袖。在你的领域里大胆开拓，激励周围的人共同前进。",reversed:"独断或滥用权力。领导风格过于强硬，可能因控制欲过强而压制他人的创造力。"},"圣杯王牌":{keywords:"情感/直觉/新的爱",upright:"情感与直觉的大门敞开，新的爱或深刻的情感连结即将到来。以开放的心接纳爱的流动。",reversed:"情绪压抑或情感受阻。内心渴望爱与连结，却因恐惧或过去的伤痛而关闭了心扉。"},"圣杯二":{keywords:"联合/伙伴/和谐",upright:"两人之间的深刻连结与相互吸引。代表平等、和谐的伙伴关系，无论是爱情还是合作，都充满美好潜力。",reversed:"关系失衡或分离。伴侣之间出现裂痕，价值观或目标的差异需要被正视与处理。"},"圣杯三":{keywords:"庆祝/友谊/丰收",upright:"与亲友共同庆祝，享受社群的温暖与支持。是感恩、聚会与共同创造美好时刻的时期。",reversed:"过度放纵或友谊中的摩擦。社交场合可能带来流言或表面的欢乐，需辨别真实与虚假的连结。"},"圣杯四":{keywords:"冥想/不满/错失机会",upright:"内省与对现状的重新评估。可能感到情感上的无聊或不满，有新机会正在眼前，但你可能还未注意到。",reversed:"走出麻木，重新投入生活。从消极退缩中醒来，开始重新对生活感到兴趣与动力。"},"圣杯五":{keywords:"失落/悲伤/遗憾",upright:"专注于失去的事物，为过去的失落而悲伤。然而身后仍有未被看见的希望，允许自己悲伤，然后转身向前。",reversed:"走出悲伤，接受失去。逐渐从情感的伤痛中复原，重新向他人敞开心扉，接受生命的馈赠。"},"圣杯六":{keywords:"怀旧/童年/纯真",upright:"与过去的美好时光、旧友或童年记忆相连。这段时期充满温暖的怀旧感，也可能迎来来自过去的人。",reversed:"执着于过去或逃入回忆。活在对过去的执念中，阻碍了成长与前进，是时候活在当下。"},"圣杯七":{keywords:"幻想/选择/迷失",upright:"面对众多选项，可能被幻想和不切实际的期待所迷惑。需要从梦境回到现实，辨别什么是真实可行的。",reversed:"从幻想中清醒，做出选择。终于看清现实，排除不切实际的选项，准备专注于真正重要的事。"},"圣杯八":{keywords:"离开/追寻/放手",upright:"离开那些不再滋养你的事物，勇敢踏上更深刻的内在旅程。这需要勇气，但继续追寻灵魂真正渴望的东西。",reversed:"害怕离开或停留在不满中。明知需要改变却不敢离开，或在离开与留下之间反复摇摆。"},"圣杯九":{keywords:"满足/心愿成真/感恩",upright:"愿望实现，情感上获得满足。你的努力带来了真实的幸福感，此刻值得庆祝与感恩，享受生命的丰盛。",reversed:"物质满足但内心空虚。外在看似拥有一切，内心却感到失落，需重新探索真正的满足来自何处。"},"圣杯十":{keywords:"圆满/家庭幸福/祝福",upright:"情感上的圆满与家庭的和谐幸福。这是爱与归属的最高表达，代表持久的喜悦、安全感与深厚的情感连结。",reversed:"家庭不和或理想破灭。家庭内部存在紧张或对幸福的期待与现实产生落差，需要真诚的沟通。"},"圣杯侍从":{keywords:"创意/感性/好奇",upright:"充满创意与感性的能量，直觉敏锐，开放地接收来自内心的信息。可能带来情感上令人惊喜的消息。",reversed:"情绪化或缺乏边界。过度沉浸在幻想或情绪中，难以区分现实与想象，需要接地气。"},"圣杯骑士":{keywords:"浪漫/理想主义/追求",upright:"以浪漫与热忱追逐心中的理想，是情感上的骑士。带来爱的提案或充满想象力的创意邀请。",reversed:"情绪化或不切实际。沉迷于爱情幻想而忽视现实，或情绪起伏波动，难以稳定地追求目标。"},"圣杯王后":{keywords:"同理心/关怀/情感智慧",upright:"以深刻的同理心与直觉理解他人，是情感上的滋养者。善于聆听与照顾，内心世界丰富而深邃。",reversed:"情绪边界不清或过度付出。可能因过度照顾他人而忽视自己的需求，或情绪变得难以捉摸。"},"圣杯国王":{keywords:"情感成熟/智慧/掌控",upright:"以成熟与智慧驾驭情绪，在情感与理性之间保持平衡。是值得信赖的情感引导者，沉稳而有深度。",reversed:"情绪压抑或操控。将情绪完全隐藏或以情绪操控他人，内在的情感世界需要诚实地被检视。"},"宝剑王牌":{keywords:"真相/清晰/突破",upright:"思维清晰，真相即将揭晓。以理性与智慧穿透迷雾，这是做出重要决定或开启新思维的有力时机。",reversed:"混乱或错误信息。思维混乱，难以看清真相，或正被错误的信息与想法所迷惑。"},"宝剑二":{keywords:"僵局/回避/决策",upright:"面临两难困境，暂时回避以保持平静。然而闭上眼睛并不能解决问题，终究需要面对并做出选择。",reversed:"信息超载或强迫决定。被过多信息淹没无法决断，或在毫无准备的情况下被迫做出选择。"},"宝剑三":{keywords:"心碎/悲伤/痛苦",upright:"经历情感上的伤痛与心碎。这种痛苦是真实的，允许自己充分感受与哀悼，这是愈合过程中必经的一步。",reversed:"走出悲伤或压抑痛苦。可能正在从心碎中慢慢康复，或将情感的痛苦深埋心底而非正视它。"},"宝剑四":{keywords:"休息/恢复/沉淀",upright:"身心需要休养与沉淀。这是战略性的暂停，在下一步行动之前，给自己时间恢复能量与清晰度。",reversed:"焦虑休息或被迫停止。难以真正放松，担忧不断涌现，或被迫停下脚步无法按计划推进。"},"宝剑五":{keywords:"冲突/失败/空洞的胜利",upright:"即便赢得了这场冲突，胜利也可能是空洞的，代价太大。审视这场争斗是否值得，有时退让是更明智的选择。",reversed:"和解或走出冲突。冲突正在平息，是时候寻求和解，从过去的错误中学习并向前迈进。"},"宝剑六":{keywords:"过渡/离开/平静",upright:"离开混乱，向更平静的水域前行。这是一段过渡期，虽然旅程不易，但终点是更安宁的处境。",reversed:"抗拒离开或情感包袱。明知需要离开，却被过去的牵绊留住，放下执念才能真正开始新的旅程。"},"宝剑七":{keywords:"欺骗/策略/偷偷行事",upright:"需要运用策略与机智，有时独自行动更有效率。但也须审视是否有欺骗包括自欺的成分存在。",reversed:"被揭穿或良心不安。隐瞒的事情即将曝光，或内心的罪恶感促使你重新面对诚实的价值。"},"宝剑八":{keywords:"束缚/受困/自我限制",upright:"感到受困，但这些限制往往是心理上的。你比自己以为的更有力量，突破的关键在于改变思维方式。",reversed:"解放或拒绝改变。正在挣脱思维的枷锁，或尽管看到了出路，仍选择留在自我设定的束缚中。"},"宝剑九":{keywords:"焦虑/噩梦/过度担忧",upright:"午夜的焦虑与过度担忧，往往比实际情况更为严重。寻求支持，与信任的人分享内心的恐惧，有助于减轻重压。",reversed:"面对恐惧或从焦虑中走出。开始正视内心的恐惧并寻求帮助，黎明正在黑暗之后悄然到来。"},"宝剑十":{keywords:"终结/背叛/触底",upright:"一段艰难的旅程走向终结，这是最低点，但也是转机的开始。接受这个结局，太阳终将再次升起。",reversed:"避免了最坏的结果或拒绝放手。曾经历了最糟糕的时刻，正在缓慢复原，或执着于痛苦不肯让它结束。"},"宝剑侍从":{keywords:"求知/好奇/警觉",upright:"以好奇与警觉的眼光观察世界，渴望学习与获取信息。注意收到的消息，以批判性思维辨别真伪。",reversed:"散漫或用言辞伤人。思维跳跃，难以专注，或无意间用尖锐的言辞伤害了他人。"},"宝剑骑士":{keywords:"行动/雄心/直接",upright:"迅速果决地行动，以明确的目标直冲向前。智识上的雄心驱动你快速推进，只需注意不要忽视他人的感受。",reversed:"冲动或攻击性。行动过于仓促导致错误，或言语行为带有攻击性，伤害了周围的关系。"},"宝剑王后":{keywords:"独立/敏锐/直接",upright:"以清晰的头脑与犀利的洞察力看透事物的本质。独立、直接、不受情绪左右，在需要客观判断的时刻最为强大。",reversed:"冷酷或伤人的批评。聪明的洞察力被用于防御或攻击，言辞过于尖锐，在关系中造成疏离。"},"宝剑国王":{keywords:"权威/理性/公正",upright:"以卓越的理性与客观性做出公正的判断。是法律、逻辑与道德权威的象征，以智慧引领决策。",reversed:"专制或滥用权力。理性演变为冷酷，或以智识上的优越感操控与压制他人。"},"星币王牌":{keywords:"繁荣/机会/物质新开始",upright:"物质与财务领域的新机会正在到来。稳固的基础即将建立，这是投资、事业或实际行动的绝佳时机。",reversed:"错失机会或财务不稳。物质上的机会被忽视或错过，需重新审视财务规划与实际目标。"},"星币二":{keywords:"平衡/适应/优先排序",upright:"在多个责任与优先事项之间灵活周转。保持弹性与幽默感，你有能力同时处理多件事，找到动态的平衡点。",reversed:"失衡或财务混乱。事情过于繁杂导致错误，需要重新排列优先级，专注于真正重要的事。"},"星币三":{keywords:"合作/技艺/学习",upright:"通过合作与精进技艺取得进展。团队合作带来丰厚成果，认真学习与实践是成功的基础。",reversed:"缺乏团队精神或工艺粗糙。独自行事或工作质量低落，需要重新审视合作方式与专业态度。"},"星币四":{keywords:"储蓄/安全感/控制",upright:"建立财务安全感与稳定基础。谨慎的储蓄与资源管理是明智的，但须注意是否因过度控制而阻碍了流动与成长。",reversed:"囤积或物质不安全感。因过度执着于物质安全而变得吝啬，或相反地在财务上过于散漫无节制。"},"星币五":{keywords:"困境/匮乏/被遗忘",upright:"正经历物质或情感上的困难与匮乏感。即便在困境中，援助可能就在不远处，鼓起勇气向外寻求支持。",reversed:"走出困境或接受帮助。财务或情感状况正在改善，学会接受他人的援助是走向复原的重要一步。"},"星币六":{keywords:"慷慨/给予/接受",upright:"慷慨地给予，同时也能优雅地接受。金钱与资源正在流动，善用此时的丰盛帮助他人，同时也照顾好自己。",reversed:"施与受失衡或附条件的慷慨。给予是为了获得回报，或在接受帮助时感到负债，需审视内心对丰盛的信念。"},"星币七":{keywords:"评估/耐心/长期投资",upright:"在长期目标上耐心地等待结果。停下来评估目前的进展，确认努力的方向是否与最终目标一致。",reversed:"缺乏耐心或投资回报不如预期。对结果感到不满或不耐烦，需要重新评估策略或调整预期。"},"星币八":{keywords:"技艺精进/专注/勤奋",upright:"全神贯注地精进技艺，以勤奋与专注投入工作。这是学习、实践与建立专业能力的最佳时机。",reversed:"缺乏专注或追求完美主义。精力分散无法专注，或为追求完美而陷入停滞，无法完成作品。"},"星币九":{keywords:"富足/独立/自我满足",upright:"通过自己的努力获得物质上的丰盛与独立。享受自给自足带来的满足感与安全感，这是你应得的成果。",reversed:"物质依赖或挥霍无度。过度依赖他人的财务支持，或缺乏自律导致辛苦积累的成果流失。"},"星币十":{keywords:"遗产/家族/长久繁荣",upright:"家族的富足与长久的物质稳定。这是关于遗产、根基与代代相传的牌，代表持久的繁荣与归属感。",reversed:"家族冲突或财务纠纷。家庭内部因金钱或遗产产生矛盾，或家族的传统与期望成为个人成长的束缚。"},"星币侍从":{keywords:"学习/机会/踏实",upright:"带着求知欲与踏实的态度迎接新机会。在物质或学习上迈出第一步，以谦逊的心态打好基础。",reversed:"缺乏远见或浪费机会。眼前有好的机会却未能把握，或太过专注于细节而忽视了宏观的方向。"},"星币骑士":{keywords:"努力/可靠/方法",upright:"以稳健而坚定的步伐朝目标前进。可靠、有责任感，以系统化的方法将计划一步步化为现实。",reversed:"固执或工作狂。过于固守方法而缺乏灵活性，或将工作与责任凌驾于一切之上而忽略了生活的其他面向。"},"星币王后":{keywords:"丰盛/实际/滋养",upright:"以实际与慷慨的方式照顾自己与周围的人。在物质与情感上创造稳定与丰盛，是踏实可靠的生命之锚。",reversed:"自我忽视或财务焦虑。过于专注于照顾他人而忽略了自身的需求，或对物质安全感到深深的焦虑。"},"星币国王":{keywords:"财富/成功/领导力",upright:"以成熟的财务智慧与领导力建立持久的成功。是物质领域中可靠的权威，以务实与慷慨的方式管理资源。",reversed:"固执或以财富来操控他人。对金钱与权力过度执着，或以物质手段控制周围的人与关系。"}};

function getCardData(n){if(TAROT_DB[n])return TAROT_DB[n];for(const k of Object.keys(TAROT_DB)){if(n.includes(k)||k.includes(n))return TAROT_DB[k];}return{keywords:"神秘/洞察/指引",upright:"此牌携带深刻能量。",reversed:"能量受阻。"};}
const CARD_IMG_BASE="https://raw.githubusercontent.com/krates98/tarotcardapi/main/images/";
const CARD_IMG_MAP={"愚者":"thefool.jpeg","魔术师":"themagician.jpeg","女祭司":"thehighpriestess.jpeg","女皇":"theempress.jpeg","皇帝":"theemperor.jpeg","教皇":"thehierophant.jpeg","恋人":"TheLovers.jpg","战车":"thechariot.jpeg","力量":"thestrength.jpeg","隐士":"thehermit.jpeg","命运之轮":"wheeloffortune.jpeg","正义":"justice.jpeg","倒吊人":"thehangedman.jpeg","死神":"death.jpeg","节制":"temperance.jpeg","恶魔":"thedevil.jpeg","塔":"thetower.jpeg","星星":"thestar.jpeg","月亮":"themoon.jpeg","太阳":"thesun.jpeg","审判":"judgement.jpeg","世界":"theworld.jpeg","权杖王牌":"aceofwands.jpeg","权杖二":"twoofwands.jpeg","权杖三":"threeofwands.jpeg","权杖四":"fourofwands.jpeg","权杖五":"fiveofwands.jpeg","权杖六":"sixofwands.jpeg","权杖七":"sevenofwands.jpeg","权杖八":"eightofwands.jpeg","权杖九":"nineofwands.jpeg","权杖十":"tenofwands.jpeg","权杖侍从":"pageofwands.jpeg","权杖骑士":"knightofwands.jpeg","权杖王后":"queenofwands.jpeg","权杖国王":"kingofwands.jpeg","圣杯王牌":"aceofcups.jpeg","圣杯二":"twoofcups.jpeg","圣杯三":"threeofcups.jpeg","圣杯四":"fourofcups.jpeg","圣杯五":"fiveofcups.jpeg","圣杯六":"sixofcups.jpeg","圣杯七":"sevenofcups.jpeg","圣杯八":"eightofcups.jpeg","圣杯九":"nineofcups.jpeg","圣杯十":"tenofcups.jpeg","圣杯侍从":"pageofcups.jpeg","圣杯骑士":"knightofcups.jpeg","圣杯王后":"queenofcups.jpeg","圣杯国王":"kingofcups.jpeg","宝剑王牌":"aceofswords.jpeg","宝剑二":"twoofswords.jpeg","宝剑三":"threeofswords.jpeg","宝剑四":"fourofswords.jpeg","宝剑五":"fiveofswords.jpeg","宝剑六":"sixofswords.jpeg","宝剑七":"sevenofswords.jpeg","宝剑八":"eightofswords.jpeg","宝剑九":"nineofswords.jpeg","宝剑十":"tenofswords.jpeg","宝剑侍从":"pageofswords.jpeg","宝剑骑士":"knightofswords.jpeg","宝剑王后":"queenofswords.jpeg","宝剑国王":"kingofswords.jpeg","星币王牌":"aceofpentacles.jpeg","星币二":"twoofpentacles.jpeg","星币三":"threeofpentacles.jpeg","星币四":"fourofpentacles.jpeg","星币五":"fiveofpentacles.jpeg","星币六":"sixofpentacles.jpeg","星币七":"sevenofpentacles.jpeg","星币八":"eightofpentacles.jpeg","星币九":"nineofpentacles.jpeg","星币十":"tenofpentacles.jpeg","星币侍从":"pageofpentacles.jpeg","星币骑士":"knightofpentacles.jpeg","星币王后":"queenofpentacles.jpeg","星币国王":"kingofpentacles.jpeg"};
function getCardImg(name){var f=CARD_IMG_MAP[name];return f?CARD_IMG_BASE+f:null;}

const SUITS=["权杖","圣杯","宝剑","星币"],MAJORS=["愚者","魔术师","女祭司","女皇","皇帝","教皇","恋人","战车","力量","隐士","命运之轮","正义","倒吊人","死神","节制","恶魔","塔","星星","月亮","太阳","审判","世界"],NUMBERS=["王牌","二","三","四","五","六","七","八","九","十","侍从","骑士","王后","国王"];
function randomCard(){const m=Math.random()<0.28;const n=m?MAJORS[Math.floor(Math.random()*MAJORS.length)]:SUITS[Math.floor(Math.random()*SUITS.length)]+NUMBERS[Math.floor(Math.random()*NUMBERS.length)];return{name:n,orientation:Math.random()<0.28?"逆位":"正位"};}

const CATEGORIES=[{id:"quick",label:"快速指引",emoji:"⚡",desc:"快速得到一个提示"},{id:"trend",label:"趋势发展",emoji:"🌊",desc:"看事情怎么走"},{id:"love",label:"感情关系",emoji:"💕",desc:"我想看我和TA"},{id:"career",label:"决策事业",emoji:"⚖️",desc:"我要做选择"},{id:"self",label:"自我探索",emoji:"🔭",desc:"了解自己"}];
const SPREADS={quick:[{id:"single",label:"单张牌",desc:"最简单直接的指引",stars:1,count:1,positions:["当下指引"]},{id:"today",label:"今日能量",desc:"了解今天的能量频率",stars:1,count:1,positions:["今日能量"]},{id:"now",label:"现状提示",desc:"看清此刻的处境",stars:1,count:1,positions:["现状提示"]}],trend:[{id:"three",label:"过去·现在·未来",desc:"经典三张趋势牌阵",stars:1,count:3,positions:["过去","现在","未来"]},{id:"nextstep",label:"未来三步",desc:"接下来三步怎么走",stars:2,count:3,positions:["第一步","第二步","第三步"]},{id:"sixmonth",label:"六个月时间流",desc:"未来半年逐月能量",stars:3,count:6,positions:["第一个月","第二个月","第三个月","第四个月","第五个月","第六个月"]}],love:[{id:"relation",label:"关系基础阵",desc:"了解关系的核心动态",stars:1,count:3,positions:["你","对方","关系核心"]},{id:"love4",label:"关系进阶阵",desc:"更深入的双向分析",stars:2,count:4,positions:["我对TA的感受","TA对我的感受","关系障碍","未来走向"]},{id:"lovefull",label:"爱情专项",desc:"全面的感情解读",stars:2,count:4,positions:["我对TA的想法","TA对我的想法","关系阻碍","未来发展"]},{id:"reunion",label:"复合分析",desc:"复合可能性全面评估",stars:3,count:5,positions:["你的现状","对方的现状","分开的原因","复合的障碍","最终走向"]}],career:[{id:"choice",label:"二选一",desc:"两个选项快速对比",stars:1,count:3,positions:["选项A走势","选项B走势","最优建议"]},{id:"swot",label:"优劣势分析",desc:"看清机会与风险",stars:2,count:4,positions:["优势","劣势","机会","风险"]},{id:"path",label:"行动路径",desc:"五步走向目标",stars:2,count:5,positions:["现状","阻碍","资源","行动","结果"]},{id:"celtic",label:"凯尔特十字",desc:"最完整的复杂问题解读",stars:3,count:10,positions:["当前处境","障碍","潜意识","过去基础","未来趋势","外界环境","自我认知","希望与恐惧","外部影响","最终结果"]}],self:[{id:"triconsciousness",label:"表意识·潜意识·行动",desc:"三层自我透视",stars:1,count:3,positions:["表意识","潜意识","行动建议"]},{id:"elements",label:"四元素扫描",desc:"火水土风能量诊断",stars:2,count:4,positions:["火·行动力","水·情感","土·物质现实","风·思维"]},{id:"johari",label:"乔哈里视窗",desc:"四维自我认知",stars:2,count:4,positions:["自己知道的你","别人眼中的你","潜意识里的你","谁都不知道的盲点"]},{id:"shadow",label:"阴影工作",desc:"挖掘压抑情绪与恐惧",stars:3,count:6,positions:["表层情绪","压抑的根源","童年阴影","防御机制","需要整合的部分","走向疗愈的钥匙"]},{id:"chakra",label:"脉轮诊断",desc:"七大能量中心全扫描",stars:3,count:7,positions:["海底轮·根基","脐轮·创造","太阳神经丛·力量","心轮·爱","喉轮·表达","眉心轮·直觉","顶轮·灵性"]}]};
const TAG_FOCUS={quick:"请从当下能量与直觉指引的角度简洁解读",trend:"请从时间轴上的能量变化与整体趋势的角度解读",love:"请从情感连结、吸引力、双方感受的角度解读",career:"请从职场发展、机遇挑战、行动策略的角度解读",self:"请从心理深度与自我认知的角度解读，结合荣格心理学视角"};

function buildSmartPrompt(catId,profile,history,patterns){
  const focus=catId?TAG_FOCUS[catId]+"。":"";
  // JSONL schema: two JSON objects on separate lines, parsed progressively while streaming
  const schema=`以JSONL格式输出两行（每行一个完整JSON对象，对象内所有字符串不含真正的换行符）：
第1行只含cardReadings：{"cardReadings":[{"position":"牌位","card":"牌名","core":"从牌面图像出发解读：描述你在这张牌里看到的画面与符号，它们如何呼应问卜者的处境（3-4句，有画面感）","symbol":"点出一个最关键的视觉符号及其隐喻（1-2句，具体而诗意）"}]}
第2行含其余字段：{"synthesis":"综合推演不少于200字：深度剖析问卜者当下的心理结构，说出那些藏在问题背后的真实心理，像一面镜子，以「关于你问的」开头","energy":"当前核心能量（2句）","trend":"未来趋势（2句）","action":"具体可操作的行动建议（2-3句）","timeWindow":"时间窗口（1句）","closing":"温暖收尾（1句）","nextQuestion":"作为塔罗师，你在这次解读中最想继续深挖的一个问题——不是重复原问题，而是指向他们尚未触碰的内层（1句话，以问句形式，中文）","profileUpdate":{"themes":["1-2个核心主题关键词"],"emotionalTone":"情绪基调一词"}}
严格要求：只输出这两行JSON，无其他文字，每行必须是合法且完整的JSON对象。`;
  let sys="你是一位拥有20年经验的资深塔罗占卜师，擅长结合透特塔罗与韦特塔罗的精髓，同时具备荣格心理学与深层叙事治疗的视角。你用牌面的图像说话：每一张牌都是一幅画，你从画中读出问卜者的处境与内心。你的语言有画面感、有智慧、温暖而深刻，能触及人最不愿正视却最需要听到的部分。"+focus+"牌面解析时：请描述牌面的意象与符号（人物姿态、颜色、场景细节），说明这个画面如何照应问卜者的问题，让人感受到与牌的真实连接。综合解读时（synthesis字段）：这是整个解读最重要的部分，必须不少于200字。要像一位真正了解对方的人在说话——不是泛泛而谈，而是针对这个人、这个问题、这些牌，说出那些埋在问题背后的真实心理：他们真正在意什么、什么在内心深处拉扯他们、他们用什么方式保护自己、这背后藏着什么更深的恐惧或渴望。把所有牌的意象编织成一个有力的整体叙事，让人读完有被看见、被触动的感觉。";
  if(profile&&profile.totalReadings>0){
    sys+="\n\n【问卜者档案】这位问卜者已进行过"+profile.totalReadings+"次占卜，首次占卜于"+(profile.firstReadingDate||"近期")+"。";
    const topCats=Object.entries(profile.topCategories||{}).sort((a,b)=>b[1]-a[1]).slice(0,3);
    if(topCats.length>0){const cn={quick:"快速指引",trend:"趋势发展",love:"感情关系",career:"事业决策",self:"自我探索"};sys+="最常关注的领域："+topCats.map(function(e){return(cn[e[0]]||e[0])+"("+e[1]+"次)"}).join("、")+"。";}
    if(profile.recurringThemes&&profile.recurringThemes.length>0){sys+="长期关注的主题："+profile.recurringThemes.slice(0,5).join("、")+"。";}
    sys+="请结合背景做更有针对性的解读，但不要让历史偏见影响对当前牌面的客观分析。";
  }
  if(history&&history.length>0){
    sys+="\n\n【近期相关占卜记录】";
    history.forEach(function(r){
      var cs=(r.cards||[]).map(function(c){return c.name+"("+c.orientation+")"}).join("、");
      sys+="\n- "+r.date+"：问「"+r.question+"」，牌面："+cs;
      if(r.synthesis)sys+="。核心："+r.synthesis.substring(0,100);
    });
    sys+="\n请在解读中自然关联历史脉络，帮助问卜者看到变化趋势。";
  }
  if(patterns&&patterns.length>0){sys+="\n\n【洞察线索】\n"+patterns.map(function(p){return"- "+p}).join("\n");}
  sys+="\n\n输出格式要求：\n"+schema;
  return sys;
}

function detectPatterns(newCards,history,profile){
  var patterns=[];
  var newNames=newCards.map(function(c){return c.name});
  var recent5=(history||[]).slice(0,5);
  var recentAll=recent5.reduce(function(a,r){return a.concat((r.cards||[]).map(function(c){return c.name}))},[]);
  var seen={};
  var repeated=newNames.filter(function(n){if(!seen[n]&&recentAll.indexOf(n)>=0){seen[n]=true;return true;}return false;});
  if(repeated.length>0){
    repeated.slice(0,3).forEach(function(card){
      var cnt=recentAll.filter(function(c){return c===card}).length+1;
      patterns.push("「"+card+"」在近"+Math.min(recent5.length+1,6)+"次解读中出现了"+cnt+"次，这是一个强烈的重复信号");
    });
  }
  var suitMap={"权杖":"火","圣杯":"水","宝剑":"风","星币":"土"};
  var elCounts={"火":0,"水":0,"风":0,"土":0,"大阿卡纳":0};
  newCards.forEach(function(c){var s=SUITS.find(function(su){return c.name.indexOf(su)===0});if(s)elCounts[suitMap[s]]++;else elCounts["大阿卡纳"]++;});
  var dominant=Object.entries(elCounts).filter(function(e){return e[1]>0}).sort(function(a,b){return b[1]-a[1]});
  if(dominant.length>0&&dominant[0][1]>=2&&newCards.length>=3){
    var elM={"火":"行动力与热情","水":"情感与直觉","风":"思维与沟通","土":"物质与现实","大阿卡纳":"重大人生课题"};
    patterns.push("本次牌面"+dominant[0][0]+"元素主导（"+(elM[dominant[0][0]]||"")+"）");
  }
  var revCount=newCards.filter(function(c){return c.orientation==="逆位"}).length;
  if(newCards.length>=3){
    if(revCount/newCards.length>=0.6)patterns.push("逆位牌比例偏高("+revCount+"/"+newCards.length+")，暗示当前处于能量调整期");
    else if(revCount===0)patterns.push("全部正位，整体能量流畅通达");
  }
  if(profile&&profile.topCategories){
    var sorted=Object.entries(profile.topCategories).sort(function(a,b){return b[1]-a[1]});
    if(sorted.length>0&&sorted[0][1]>=3){
      var cn2={quick:"快速指引",trend:"趋势发展",love:"感情关系",career:"事业决策",self:"自我探索"};
      patterns.push("问卜者近期持续关注「"+(cn2[sorted[0][0]]||sorted[0][0])+"」领域");
    }
  }
  return patterns;
}

function updateProfile(profile,newReading,aiUpdate){
  var p=Object.assign({},profile);
  p.totalReadings=(p.totalReadings||0)+1;
  if(!p.firstReadingDate)p.firstReadingDate=newReading.date;
  p.lastReadingDate=newReading.date;
  var cats=Object.assign({},p.topCategories||{});
  if(newReading.category)cats[newReading.category]=(cats[newReading.category]||0)+1;
  p.topCategories=cats;
  var fc=Object.assign({},p.frequentCards||{});
  (newReading.cards||[]).forEach(function(c){fc[c.name]=(fc[c.name]||0)+1;});
  p.frequentCards=fc;
  if(aiUpdate&&aiUpdate.themes){
    var existing=(p.recurringThemes||[]).slice();
    aiUpdate.themes.forEach(function(t){if(t&&t.trim()&&existing.indexOf(t.trim())<0)existing.push(t.trim());});
    p.recurringThemes=existing.slice(-15);
  }
  return p;
}

function getRelevantHistory(all,category){
  if(!all||all.length===0)return[];
  var sameCat=all.filter(function(r){return r.category===category}).slice(0,2);
  var ids=sameCat.map(function(r){return r.id});
  var recent=all.filter(function(r){return ids.indexOf(r.id)<0}).slice(0,1);
  return sameCat.concat(recent).slice(0,3);
}

function CardFace(props){
  var card=props.card;var rev=card.orientation==="逆位";var img=getCardImg(card.name);
  return React.createElement("div",{style:{width:"100%",height:"100%",borderRadius:10,overflow:"hidden",position:"relative",border:"1px solid "+(rev?"#c0784a80":"#d4af3780"),transform:rev?"rotate(180deg)":"none",background:"#0f0f14"}},
    img
      ?React.createElement("img",{src:img,alt:card.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})
      :React.createElement("div",{style:{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 6px",background:"linear-gradient(160deg,#1a1a22,#12121a)"}},
          React.createElement("div",{style:{fontSize:20,marginBottom:4}},"🃏"),
          React.createElement("div",{style:{color:"#d4af37",fontSize:9,fontFamily:"serif",textAlign:"center",lineHeight:1.3}},card.name)
        )
  );
}

function Stars(props){return React.createElement("span",{style:{fontSize:9,letterSpacing:1}},[1,2,3].map(function(i){return React.createElement("span",{key:i,style:{color:i<=props.n?"#d4af37":"#2a2a35"}},"★")}));}

function Section(props){
  return React.createElement("div",{style:{marginTop:28}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},
      React.createElement("div",{style:{width:22,height:22,borderRadius:6,background:"#d4af3715",border:"1px solid #d4af3730",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#d4af37",fontFamily:"serif",flexShrink:0}},props.label),
      React.createElement("h2",{style:{margin:0,fontSize:14,fontFamily:"serif",color:"#e0e0d8",letterSpacing:2,fontWeight:400}},props.title),
      props.extra&&React.createElement("span",{style:{fontSize:10,color:"#555",marginLeft:4}},props.extra),
      React.createElement("div",{style:{flex:1,height:"1px",background:"#1e1e28"}})
    ),
    props.children
  );
}

function ActionBtn(props){
  return React.createElement("button",{onClick:props.onClick,style:{flex:"1 1 auto",padding:"10px 14px",borderRadius:24,background:props.primary?"linear-gradient(135deg,#d4af37,#b8960c)":"transparent",color:props.primary?"#0f0f14":"#d4af37",border:"1px solid "+(props.primary?"transparent":"#d4af3750"),fontSize:12,cursor:"pointer",letterSpacing:1}},props.label);
}

function LoadingOracle(){
  var lines=["星盘正在对齐，宇宙的信息正在汇聚……","每一张牌都是你内心深处的镜子。","塔罗不预测命运，它揭示你尚未看见的自己。","牌面背后，是你灵魂想对你说的话。","占卜的本质，是与自己最深处的对话。","你已经知道答案了，牌只是帮你看清它。"];
  var ref=useState(0),idx=ref[0],setIdx=ref[1];
  var ref2=useState(true),fade=ref2[0],setFade=ref2[1];
  useEffect(function(){var iv=setInterval(function(){setFade(false);setTimeout(function(){setIdx(function(i){return(i+1)%lines.length});setFade(true);},500);},3000);return function(){clearInterval(iv)};},[]);
  return React.createElement("div",{style:{textAlign:"center",padding:"36px 20px"}},
    React.createElement("div",{style:{fontSize:32,marginBottom:20,animation:"slowspin 8s linear infinite",display:"inline-block"}},"🔮"),
    React.createElement("div",{style:{color:"#d4af37",fontFamily:"serif",fontSize:13,letterSpacing:2,marginBottom:20}},"塔罗师正在解读……"),
    React.createElement("div",{style:{minHeight:60,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px"}},
      React.createElement("p",{style:{color:"#a09070",fontSize:14,fontFamily:"serif",lineHeight:1.8,margin:0,fontStyle:"italic",letterSpacing:1,maxWidth:320,textAlign:"center",opacity:fade?1:0,transition:"opacity 0.5s ease"}},lines[idx])
    ),
    React.createElement("style",null,"@keyframes slowspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}")
  );
}

var CARD_BACK=React.createElement("div",{style:{width:"100%",height:"100%",borderRadius:10,background:"linear-gradient(135deg,#1a1a2e,#16213e)",border:"1px solid #d4af3750",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}},"🔮");

function FlipCard(props){
  var i=props.i,w=props.w||70,h=props.h||110,spread=props.spread,drawnCards=props.drawnCards,revealedIdx=props.revealedIdx,onReveal=props.onReveal;
  var card=drawnCards[i];var rev=revealedIdx.indexOf(i)>=0;
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:4}},
    React.createElement("div",{style:{color:"#d4af3778",fontSize:9,fontFamily:"serif",textAlign:"center",lineHeight:1.3,maxWidth:w+10}},spread.positions[i]),
    React.createElement("div",{onClick:function(){if(!rev)onReveal(i)},style:{width:w,height:h,cursor:rev?"default":"pointer",perspective:600}},
      React.createElement("div",{style:{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform 0.5s",transform:rev?"rotateY(180deg)":"rotateY(0deg)"}},
        React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden"}},CARD_BACK),
        React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)"}},card&&React.createElement(CardFace,{card:card}))
      )
    ),
    !rev&&React.createElement("div",{style:{color:"#333",fontSize:8}},"点击翻牌")
  );
}

function SpreadBoard(props){
  var spread=props.spread,drawnCards=props.drawnCards,revealedIdx=props.revealedIdx,onReveal=props.onReveal;
  var fp={spread:spread,drawnCards:drawnCards,revealedIdx:revealedIdx,onReveal:onReveal};

  if(spread.id==="celtic"){
    var pos=[{i:0,x:115,y:145},{i:1,x:115,y:145,rot:true},{i:2,x:115,y:235},{i:3,x:115,y:55},{i:4,x:25,y:145},{i:5,x:205,y:145},{i:6,x:250,y:235},{i:7,x:250,y:155},{i:8,x:250,y:75},{i:9,x:250,y:0}];
    return React.createElement("div",{style:{position:"relative",width:320,height:390,margin:"16px auto"}},
      pos.map(function(p){
        if(!drawnCards[p.i])return null;
        var isRev=revealedIdx.indexOf(p.i)>=0;
        return React.createElement("div",{key:p.i,style:{position:"absolute",left:p.x,top:p.y,display:"flex",flexDirection:"column",alignItems:"center",gap:2}},
          React.createElement("div",{style:{color:"#d4af3760",fontSize:8,whiteSpace:"nowrap",maxWidth:80,textAlign:"center"}},spread.positions[p.i]),
          React.createElement("div",{onClick:function(){if(!isRev)onReveal(p.i)},style:{width:75,height:116,cursor:isRev?"default":"pointer",perspective:600,transform:p.rot?"rotate(90deg)":"none"}},
            React.createElement("div",{style:{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform 0.5s",transform:isRev?"rotateY(180deg)":"rotateY(0deg)"}},
              React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden"}},CARD_BACK),
              React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)"}},drawnCards[p.i]&&React.createElement(CardFace,{card:drawnCards[p.i]}))
            )
          )
        );
      })
    );
  }

  if(spread.id==="chakra"){
    var cols=["#c0392b","#e67e22","#f1c40f","#27ae60","#2980b9","#8e44ad","#9b59b6"];
    return React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"16px 0"}},
      drawnCards.map(function(_,idx2){
        var ri=drawnCards.length-1-idx2;var c=drawnCards[ri];var col=cols[ri];var isRev=revealedIdx.indexOf(ri)>=0;
        if(!c)return null;
        return React.createElement("div",{key:ri,style:{display:"flex",alignItems:"center",gap:14}},
          React.createElement("div",{style:{width:8,height:8,borderRadius:"50%",background:col,boxShadow:"0 0 8px "+col,flexShrink:0}}),
          React.createElement("div",{style:{color:col,fontSize:10,fontFamily:"serif",width:120,textAlign:"right",lineHeight:1.3}},spread.positions[ri]),
          React.createElement("div",{onClick:function(){if(!isRev)onReveal(ri)},style:{width:80,height:124,cursor:isRev?"default":"pointer",perspective:600,flexShrink:0}},
            React.createElement("div",{style:{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform 0.5s",transform:isRev?"rotateY(180deg)":"rotateY(0deg)"}},
              React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",borderRadius:8,background:"linear-gradient(135deg,#1a1a2e,#16213e)",border:"1px solid "+col+"60",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}},"🔮"),
              React.createElement("div",{style:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)"}},c&&React.createElement(CardFace,{card:c}))
            )
          )
        );
      })
    );
  }

  if(["johari","elements","swot","love4","lovefull"].indexOf(spread.id)>=0){
    return React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,maxWidth:340,margin:"16px auto"}},
      drawnCards.map(function(_,i){return React.createElement(FlipCard,Object.assign({key:i,i:i,w:110,h:170},fp))})
    );
  }

  if(spread.id==="shadow"){
    return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:14,alignItems:"center",padding:"16px 0"}},
      [0,1].map(function(row){return React.createElement("div",{key:row,style:{display:"flex",gap:12}},
        [0,1,2].map(function(col){var i=row*3+col;return drawnCards[i]?React.createElement(FlipCard,Object.assign({key:i,i:i,w:90,h:140},fp)):null;})
      )})
    );
  }

  return React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap",padding:"16px 0"}},
    drawnCards.map(function(_,i){return React.createElement(FlipCard,Object.assign({key:i,i:i,w:95,h:148},fp))})
  );
}

function ProfilePanel(props){
  var profile=props.profile,onClear=props.onClear;
  if(!profile||profile.totalReadings===0)return null;
  var topCards=Object.entries(profile.frequentCards||{}).sort(function(a,b){return b[1]-a[1]}).slice(0,5);
  var catNames={quick:"快速指引",trend:"趋势发展",love:"感情关系",career:"事业决策",self:"自我探索"};
  var topCats=Object.entries(profile.topCategories||{}).sort(function(a,b){return b[1]-a[1]});
  return React.createElement("div",{style:{background:"linear-gradient(160deg,#1a1a2e,#12121c)",borderRadius:14,padding:"20px",border:"1px solid #d4af3730",position:"relative",overflow:"hidden"}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
      React.createElement("div",{style:{color:"#d4af37",fontSize:13,fontFamily:"serif",letterSpacing:2}},"✦ 你的塔罗档案"),
      React.createElement("div",{style:{color:"#444",fontSize:10}},profile.totalReadings+" 次解读")
    ),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}},
      React.createElement("div",{style:{background:"#0f0f1480",borderRadius:10,padding:"12px"}},
        React.createElement("div",{style:{color:"#555",fontSize:10,marginBottom:6}},"常抽到的牌"),
        topCards.length>0?topCards.map(function(e,i){return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",marginBottom:3}},React.createElement("span",{style:{color:"#ccc",fontSize:11}},e[0]),React.createElement("span",{style:{color:"#d4af37",fontSize:10}},e[1]+"次"))}):React.createElement("div",{style:{color:"#333",fontSize:11}},"暂无数据")
      ),
      React.createElement("div",{style:{background:"#0f0f1480",borderRadius:10,padding:"12px"}},
        React.createElement("div",{style:{color:"#555",fontSize:10,marginBottom:6}},"关注领域"),
        topCats.map(function(e,i){return React.createElement("div",{key:i,style:{display:"flex",justifyContent:"space-between",marginBottom:3}},React.createElement("span",{style:{color:"#ccc",fontSize:11}},catNames[e[0]]||e[0]),React.createElement("span",{style:{color:"#d4af37",fontSize:10}},e[1]+"次"))})
      )
    ),
    profile.recurringThemes&&profile.recurringThemes.length>0&&React.createElement("div",{style:{marginBottom:14}},
      React.createElement("div",{style:{color:"#555",fontSize:10,marginBottom:8}},"反复出现的生命主题"),
      React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
        profile.recurringThemes.slice(-8).map(function(t,i){return React.createElement("span",{key:i,style:{fontSize:10,padding:"3px 10px",borderRadius:12,background:"#d4af3712",color:"#d4af37",border:"1px solid #d4af3725"}},t)})
      )
    ),
    React.createElement("button",{onClick:onClear,style:{padding:"6px 16px",borderRadius:16,border:"1px solid #33202050",background:"transparent",color:"#44333380",fontSize:10,cursor:"pointer",marginTop:4}},"清除所有数据")
  );
}

export default function TarotApp(){
  var s1=useState(""),question=s1[0],setQuestion=s1[1];
  var s2=useState(null),category=s2[0],setCategory=s2[1];
  var s3=useState(null),spread=s3[0],setSpread=s3[1];
  var s4=useState("idle"),phase=s4[0],setPhase=s4[1];
  var s5=useState([]),deckCards=s5[0],setDeckCards=s5[1];
  var s6=useState([]),drawnCards=s6[0],setDrawnCards=s6[1];
  var s7=useState([]),revealedIdx=s7[0],setRevealedIdx=s7[1];
  var s8=useState(null),summary=s8[0],setSummary=s8[1];
  var s9=useState(false),loadingSummary=s9[0],setLoadingSummary=s9[1];
  var s10=useState(false),summaryError=s10[0],setSummaryError=s10[1];
  var s11=useState([]),detectedPatterns=s11[0],setDetectedPatterns=s11[1];
  var s12=useState("reading"),tab=s12[0],setTab=s12[1];
  var summaryRef=useRef(null);
  var s13=useState(defaultProfile),profile=s13[0],setProfile=s13[1];
  var s14=useState([]),readings=s14[0],setReadings=s14[1];
  var s15=useState(false),storageReady=s15[0],setStorageReady=s15[1];
  var s16=useState(null),recSuggestion=s16[0],setRecSuggestion=s16[1];
  var s17=useState(false),recLoading=s17[0],setRecLoading=s17[1];
  var s18=useState(false),loadingRest=s18[0],setLoadingRest=s18[1];
  var spreadSectionRef=useRef(null);

  useEffect(function(){
    (async function(){
      var p=await loadStorage(PROFILE_KEY,defaultProfile);
      var r=await loadStorage(READINGS_KEY,[]);
      setProfile(p);setReadings(r);setStorageReady(true);
    })();
  },[]);

  async function handleConfirmQuestion(){
    if(recLoading||question.trim().length<1)return;
    setRecLoading(true);
    try{
      var res=await fetch("/api/recommend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:question.trim()})});
      var data=await res.json();
      if(data.catId&&data.spreadId){
        // Find spread: first try exact id match, then try matching by id substring
        var catSpreadsData=SPREADS[data.catId]||[];
        var sp=catSpreadsData.find(function(s){return s.id===data.spreadId;});
        if(!sp)sp=catSpreadsData.find(function(s){return data.spreadId.includes(s.id)||s.id.includes(data.spreadId);});
        if(!sp&&catSpreadsData.length>0)sp=catSpreadsData[0]; // fallback to first spread in category
        setRecSuggestion(data);
        setCategory(data.catId);
        if(sp)setSpread(sp);
        // Scroll to spread section after a brief delay for render
        setTimeout(function(){if(spreadSectionRef.current)spreadSectionRef.current.scrollIntoView({behavior:"smooth",block:"start"});},200);
      }
    }catch(e){}
    setRecLoading(false);
  }

  var catLabel=category?CATEGORIES.find(function(c){return c.id===category})?.label:"";
  var fullQuestion=category?"["+catLabel+"] "+question:question;
  var canStart=question.trim()&&spread;
  var allRevealed=revealedIdx.length===(spread?spread.count:0);
  var catSpreads=category?SPREADS[category]:[];

  function handleShuffle(){
    if(!canStart)return;
    setPhase("shuffling");
    setTimeout(function(){
      setDeckCards(Array.from({length:78},function(_,i){var c=randomCard();return{name:c.name,orientation:c.orientation,id:i,picked:false}}));
      setPhase("drawing");
    },2000);
  }

  function handlePickCard(idx){
    if(drawnCards.length>=spread.count)return;
    var card=deckCards[idx];
    setDeckCards(function(prev){return prev.map(function(c,i){return i===idx?Object.assign({},c,{picked:true}):c})});
    var nd=drawnCards.concat([card]);
    setDrawnCards(nd);
    if(nd.length===spread.count)setTimeout(function(){setPhase("placed")},400);
  }

  function handleReveal(i){
    if(revealedIdx.indexOf(i)>=0)return;
    var nr=revealedIdx.concat([i]);
    setRevealedIdx(nr);
    if(nr.length===spread.count){
      var pats=detectPatterns(drawnCards,readings,profile);
      setDetectedPatterns(pats);
      generateSummary(drawnCards,pats);
      setTimeout(function(){if(summaryRef.current)summaryRef.current.scrollIntoView({behavior:"smooth"})},300);
    }
  }

  function handleRevealAll(){drawnCards.forEach(function(_,i){if(revealedIdx.indexOf(i)<0)setTimeout(function(){handleReveal(i)},i*500)});}

  // Extract the next complete JSON object from accumulated stream text.
  // Returns {obj, rest} where rest is the text after the parsed object, or null if incomplete.
  function tryParseNextObj(text){
    var start=text.indexOf("{");
    if(start===-1)return null;
    var depth=0,inStr=false,esc=false;
    for(var i=start;i<text.length;i++){
      var c=text[i];
      if(esc){esc=false;continue;}
      if(c==="\\"&&inStr){esc=true;continue;}
      if(c==='"'){inStr=!inStr;continue;}
      if(inStr)continue;
      if(c==="{")depth++;
      else if(c==="}"){depth--;if(depth===0){try{var obj=JSON.parse(text.slice(start,i+1));return{obj:obj,rest:text.slice(i+1)};}catch(e){return null;}}}
    }
    return null;
  }

  async function generateSummary(cards,pats){
    setLoadingSummary(true);setLoadingRest(false);setSummaryError(false);setSummary(null);
    var cardsList=cards.map(function(c,i){return spread.positions[i]+"："+c.name+"（"+c.orientation+"）"}).join("，");
    var relevantHist=getRelevantHistory(readings,category);
    var smartPrompt=buildSmartPrompt(category,profile,relevantHist,pats||detectedPatterns);
    var partial={};
    try{
      var res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o",max_tokens:3500,stream:true,system:smartPrompt,messages:[{role:"user",content:"问卜者的问题："+fullQuestion+"\n牌阵："+spread.label+"\n抽到的牌："+cardsList}]})});
      if(!res.ok)throw new Error("API error "+res.status);
      var reader=res.body.getReader();
      var dec=new TextDecoder();
      var buf="";
      var gotFirst=false;
      while(true){
        var chunk=await reader.read();
        if(chunk.done)break;
        buf+=dec.decode(chunk.value,{stream:true});
        // Try to extract complete JSON objects from buffer
        var result=tryParseNextObj(buf);
        if(result){
          Object.assign(partial,result.obj);
          buf=result.rest;
          if(!gotFirst){
            // First object (cardReadings) ready — show it immediately
            gotFirst=true;
            setSummary(Object.assign({},partial));
            setLoadingSummary(false);
            setLoadingRest(true);
            setTimeout(function(){if(summaryRef.current)summaryRef.current.scrollIntoView({behavior:"smooth"})},100);
          }
          // Try second object if available immediately
          var result2=tryParseNextObj(buf);
          if(result2){Object.assign(partial,result2.obj);buf=result2.rest;setSummary(Object.assign({},partial));setLoadingRest(false);}
        }
      }
      // Flush any remaining buffer
      var r1=tryParseNextObj(buf);
      if(r1){Object.assign(partial,r1.obj);var r2=tryParseNextObj(r1.rest);if(r2)Object.assign(partial,r2.obj);}
      setSummary(Object.assign({},partial));
      setLoadingSummary(false);setLoadingRest(false);
      // Persist reading
      var finalSummary=partial;
      var newReading={id:Date.now(),date:new Date().toLocaleDateString("zh-CN"),question:fullQuestion,category:category,spread:spread.label,spreadId:spread.id,cards:cards.map(function(c,i){return Object.assign({},c,{position:spread.positions[i]})}),synthesis:finalSummary.synthesis||"",patterns:pats||[]};
      var updatedReadings=[newReading].concat(readings).slice(0,MAX_READINGS);
      setReadings(updatedReadings);await saveStorage(READINGS_KEY,updatedReadings);
      var updatedProfile=updateProfile(profile,newReading,finalSummary.profileUpdate);
      setProfile(updatedProfile);await saveStorage(PROFILE_KEY,updatedProfile);
    }catch(e){console.error("generateSummary failed:",e);setSummaryError(true);setLoadingSummary(false);setLoadingRest(false);}
  }

  function handleReset(prefillQuestion){setQuestion(prefillQuestion||"");setCategory(null);setSpread(null);setRecSuggestion(null);setPhase("idle");setDeckCards([]);setDrawnCards([]);setRevealedIdx([]);setSummary(null);setSummaryError(false);setDetectedPatterns([]);setLoadingRest(false);setTimeout(function(){window.scrollTo({top:0,behavior:"smooth"})},50);}

  async function handleClearAll(){
    if(!confirm("确定要清除所有塔罗数据吗？"))return;
    setProfile(defaultProfile);setReadings([]);
    await saveStorage(PROFILE_KEY,defaultProfile);
    await saveStorage(READINGS_KEY,[]);
  }

  // ── Render helpers ──
  function renderHeader(){
    return React.createElement("div",{style:{textAlign:"center",padding:"36px 20px 16px",borderBottom:"1px solid #d4af3720"}},
      React.createElement("div",{style:{fontSize:34,marginBottom:6}},"🔮"),
      React.createElement("h1",{style:{fontFamily:"Georgia,serif",fontSize:24,color:"#d4af37",margin:0,letterSpacing:4,fontWeight:400}},"塔罗解读"),
      React.createElement("p",{style:{color:"#444",fontSize:11,margin:"6px 0 0",letterSpacing:2}},"TAROT READING · MEMORY ENABLED"),
      profile.totalReadings>0&&React.createElement("p",{style:{color:"#d4af3760",fontSize:10,margin:"8px 0 0"}},"✦ 已为你积累 "+profile.totalReadings+" 次解读记忆")
    );
  }

  function renderTabs(){
    return React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:0,borderBottom:"1px solid #1a1a22",background:"#0f0f14",position:"sticky",top:0,zIndex:10}},
      [{id:"reading",label:"🔮 解读"},{id:"history",label:"📜 历史"},{id:"profile",label:"✦ 档案"}].map(function(t){
        return React.createElement("button",{key:t.id,onClick:function(){setTab(t.id)},style:{padding:"12px 24px",background:"transparent",border:"none",borderBottom:tab===t.id?"2px solid #d4af37":"2px solid transparent",color:tab===t.id?"#d4af37":"#555",fontSize:12,cursor:"pointer",letterSpacing:1}},t.label);
      })
    );
  }

  function renderSectionA(){
    var canConfirm=phase==="idle"&&question.trim().length>=1&&!recLoading&&!recSuggestion;
    return React.createElement(Section,{label:"A",title:"设定你的问题"},
      React.createElement("textarea",{value:question,onChange:function(e){setQuestion(e.target.value);if(recSuggestion){setRecSuggestion(null);setCategory(null);setSpread(null);}},placeholder:"把心里的话写在这里……",disabled:phase!=="idle",style:{width:"100%",minHeight:80,background:"#1a1a22",border:"1px solid #2a2a35",borderRadius:10,color:"#e8e8e0",padding:"12px",fontSize:14,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6}}),
      React.createElement("style",null,"@keyframes confirmGlow{0%,100%{box-shadow:0 0 8px #d4af3720}50%{box-shadow:0 0 18px #d4af3745}}"),
      phase==="idle"&&question.trim().length>=1&&React.createElement("div",{style:{textAlign:"right",marginTop:10}},
        React.createElement("button",{
          onClick:handleConfirmQuestion,
          disabled:!canConfirm,
          style:{
            padding:"8px 22px",borderRadius:20,border:"1px solid #d4af3760",
            background:canConfirm?"transparent":"transparent",
            color:canConfirm?"#d4af37":"#d4af3740",
            fontSize:12,fontFamily:"serif",letterSpacing:2,cursor:canConfirm?"pointer":"default",
            animation:canConfirm?"confirmGlow 2.5s ease-in-out infinite":"none",
            transition:"all 0.3s"
          }
        },recLoading?"感应中…":"问卜 ✦")
      )
    );
  }

  function renderSectionB(){
    var recCatLabel=recSuggestion?(CATEGORIES.find(function(c){return c.id===recSuggestion.catId;})||{}).label:"";
    var recSpreadLabel=recSuggestion?((SPREADS[recSuggestion.catId]||[]).find(function(s){return s.id===recSuggestion.spreadId;})||{}).label:"";
    return React.createElement("div",{ref:spreadSectionRef},React.createElement(Section,{label:"B",title:"选择牌阵"},
      // ── AI Recommendation Banner ──────────────────────────────────────────
      React.createElement("style",null,"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes recFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}"),
      recLoading&&React.createElement("div",{style:{
        marginBottom:16,padding:"12px 14px",borderRadius:12,
        background:"#1a1a22",border:"1px solid #2a2a35"
      }},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,color:"#d4af3760",fontSize:12}},
          React.createElement("span",{style:{animation:"spin 1.2s linear infinite",display:"inline-block",lineHeight:1}},"◌"),
          React.createElement("span",{style:{letterSpacing:1}},"正在分析问题类型…")
        )
      ),
      !recLoading&&recSuggestion&&React.createElement("div",{style:{
        marginBottom:16,padding:"12px 14px",borderRadius:12,
        background:"#d4af3710",border:"1px solid #d4af3730",
        animation:"recFadeIn 0.3s ease"
      }},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
          React.createElement("span",{style:{fontSize:11,color:"#d4af37",letterSpacing:1}},"✦ 星星的指引"),
          React.createElement("span",{style:{fontSize:10,color:"#555",marginLeft:"auto"}},"为你感应到的牌阵")
        ),
        React.createElement("div",{style:{marginBottom:4}},
          React.createElement("span",{style:{color:"#d4af37",fontSize:13,fontFamily:"serif"}},recCatLabel),
          React.createElement("span",{style:{color:"#555",fontSize:12,margin:"0 6px"}},"·"),
          React.createElement("span",{style:{color:"#ccc",fontSize:13,fontFamily:"serif"}},recSpreadLabel)
        ),
        recSuggestion.reason&&React.createElement("div",{style:{color:"#6a6a80",fontSize:11,lineHeight:1.5}},recSuggestion.reason)
      ),
      React.createElement("div",{style:{marginBottom:16}},
        React.createElement("div",{style:{color:"#555",fontSize:11,letterSpacing:1,marginBottom:10}},"第一步 · 你想探索什么？"),
        React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
          CATEGORIES.map(function(cat){var sel=category===cat.id;return React.createElement("button",{key:cat.id,onClick:function(){if(phase!=="idle")return;setCategory(cat.id);setSpread(null);},style:{flex:"1 1 120px",padding:"12px 10px",borderRadius:12,border:"1px solid "+(sel?"#d4af37":"#2a2a35"),background:sel?"#d4af3715":"#1a1a22",color:sel?"#d4af37":"#888",cursor:phase==="idle"?"pointer":"default",textAlign:"left",transition:"all 0.2s"}},
            React.createElement("div",{style:{fontSize:18,marginBottom:4}},cat.emoji),
            React.createElement("div",{style:{fontFamily:"serif",fontSize:12,marginBottom:2}},cat.label),
            React.createElement("div",{style:{fontSize:10,color:sel?"#d4af3799":"#444"}},cat.desc)
          )})
        )
      ),
      category&&React.createElement("div",null,
        React.createElement("div",{style:{color:"#555",fontSize:11,letterSpacing:1,marginBottom:10}},"第二步 · 选择牌阵"),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          catSpreads.map(function(s){var sel=spread&&spread.id===s.id;return React.createElement("button",{key:s.id,onClick:function(){if(phase==="idle")setSpread(s)},style:{padding:"12px 14px",borderRadius:12,border:"1px solid "+(sel?"#d4af37":"#2a2a35"),background:sel?"#d4af3715":"#1a1a22",color:sel?"#d4af37":"#ccc",cursor:phase==="idle"?"pointer":"default",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all 0.2s",boxShadow:sel?"0 0 12px #d4af3720":"none"}},
            React.createElement("div",{style:{flex:1}},
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:3}},React.createElement("span",{style:{fontFamily:"serif",fontSize:13}},s.label),React.createElement(Stars,{n:s.stars}),React.createElement("span",{style:{fontSize:10,color:"#555",marginLeft:"auto"}},s.count+"张")),
              React.createElement("div",{style:{fontSize:11,color:sel?"#d4af3799":"#555"}},s.desc)
            ),
            sel&&React.createElement("div",{style:{color:"#d4af37",fontSize:18,flexShrink:0}},"✓")
          )})
        )
      )
    ));
  }

  function renderSectionC(){
    var content=null;
    if(phase==="idle"){
      content=React.createElement("div",{style:{textAlign:"center",padding:"16px 0"}},
        React.createElement("button",{onClick:handleShuffle,disabled:!canStart,style:{padding:"13px 36px",borderRadius:30,background:canStart?"linear-gradient(135deg,#d4af37,#b8960c)":"#1a1a22",color:canStart?"#0f0f14":"#333",border:"none",fontSize:14,fontFamily:"serif",cursor:canStart?"pointer":"not-allowed",letterSpacing:2,boxShadow:canStart?"0 4px 20px #d4af3740":"none"}},canStart?"✨ 开始洗牌":"请先完成问题与牌阵选择")
      );
    }else if(phase==="shuffling"){
      content=React.createElement("div",{style:{textAlign:"center",padding:"24px 0"}},
        React.createElement("div",{style:{fontSize:50,animation:"spinshuffle 0.4s linear infinite",display:"inline-block"}},"🃏"),
        React.createElement("p",{style:{color:"#d4af37",fontFamily:"serif",letterSpacing:2,marginTop:14,fontSize:13}},"正在洗牌，请专注于你的问题..."),
        React.createElement("style",null,"@keyframes spinshuffle{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}")
      );
    }else if(phase==="drawing"){
      content=React.createElement("div",{style:{padding:"12px 0"}},
        React.createElement("p",{style:{color:"#d4af37",fontSize:13,fontFamily:"serif",letterSpacing:1,marginBottom:4,textAlign:"center"}},"牌已洗好，请选择 "+spread.count+" 张"),
        React.createElement("p",{style:{color:"#555",fontSize:11,marginBottom:14,textAlign:"center"}},"已选 "+drawnCards.length+" / "+spread.count+" 张 · 左右滑动浏览全部78张"),
        React.createElement("div",{style:{overflowX:"auto",overflowY:"visible",paddingBottom:14,paddingTop:22}},
          React.createElement("div",{style:{display:"flex",gap:5,width:"max-content",padding:"0 16px",alignItems:"flex-end"}},
            deckCards.map(function(card,i){
              var wobble=((i*17+5)%11)-5;
              return React.createElement("div",{key:card.id,onClick:function(){if(!card.picked)handlePickCard(i)},style:{width:50,height:80,flexShrink:0,borderRadius:8,background:card.picked?"#0f0f14":"linear-gradient(145deg,#1e1e30,#14142a)",border:"1px solid "+(card.picked?"#222":"#d4af3745"),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,cursor:card.picked?"default":"pointer",transform:card.picked?"scale(0.85) translateY(8px)":"rotate("+wobble+"deg)",transition:"all 0.25s",opacity:card.picked?0.2:1,boxShadow:card.picked?"none":"0 4px 10px #00000070"}},
                !card.picked&&React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:3}},
                  React.createElement("div",{style:{fontSize:14}},"🔮"),
                  React.createElement("div",{style:{fontSize:9,color:"#d4af3790",fontFamily:"serif"}},i+1)
                )
              );
            })
          )
        )
      );
    }else if(phase==="placed"||phase==="done"){
      content=React.createElement("div",{style:{background:"#1a1a22",borderRadius:10,padding:"12px 14px",border:"1px solid #2a2a35",fontSize:13}},
        React.createElement("span",{style:{color:"#d4af37"}},"✓"),
        React.createElement("span",{style:{color:"#666",marginLeft:8}},"已抽取 "+drawnCards.length+" 张牌 · "+spread.label)
      );
    }
    return React.createElement(Section,{label:"C",title:"洗牌与抽牌"},content);
  }

  function renderSectionD(){
    if(drawnCards.length===0)return null;
    return React.createElement(Section,{label:"D",title:"牌阵展示"},
      React.createElement(SpreadBoard,{spread:spread,drawnCards:drawnCards,revealedIdx:revealedIdx,onReveal:handleReveal}),
      !allRevealed&&React.createElement("div",{style:{textAlign:"center",marginTop:8}},
        React.createElement("button",{onClick:handleRevealAll,style:{padding:"8px 22px",borderRadius:20,border:"1px solid #d4af3750",background:"transparent",color:"#d4af37",fontSize:12,cursor:"pointer",letterSpacing:1}},"全部翻开")
      )
    );
  }

  function renderSectionE(){
    if(revealedIdx.length===0)return null;
    var sorted=revealedIdx.slice().sort(function(a,b){return a-b});
    return React.createElement(Section,{label:"E",title:"牌义手册"},
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:14}},
        sorted.map(function(i){
          var card=drawnCards[i];var db=getCardData(card.name);var rev=card.orientation==="逆位";
          return React.createElement("div",{key:i,style:{background:"#1a1a22",borderRadius:12,padding:"16px",border:"1px solid "+(rev?"#c0784a30":"#2a2a35")}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:12}},
              React.createElement("div",{style:{width:62,height:96,borderRadius:8,flexShrink:0,border:"1px solid "+(rev?"#c0784a60":"#d4af3760"),overflow:"hidden",background:"#0f0f14",transform:rev?"rotate(180deg)":"none"}},
                getCardImg(card.name)?React.createElement("img",{src:getCardImg(card.name),alt:card.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}):React.createElement("div",{style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}},"🃏")
              ),
              React.createElement("div",null,
                React.createElement("div",{style:{color:"#d4af37",fontFamily:"serif",fontSize:15,marginBottom:2}},card.name),
                React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
                  React.createElement("span",{style:{color:"#555",fontSize:11}},spread.positions[i]),
                  React.createElement("span",{style:{padding:"1px 8px",borderRadius:10,background:rev?"#c0784a20":"#d4af3715",color:rev?"#c0784a":"#d4af37",fontSize:10}},card.orientation)
                ),
                React.createElement("div",{style:{color:"#666",fontSize:11,marginTop:4}},db.keywords)
              )
            ),
            React.createElement("div",{style:{borderTop:"1px solid #2a2a35",paddingTop:12}},
              React.createElement("div",{style:{color:"#888",fontSize:11,marginBottom:6,letterSpacing:1}},rev?"▼ 逆位释义":"▲ 正位释义"),
              React.createElement("p",{style:{color:"#ccc",fontSize:13,lineHeight:1.8,margin:0}},rev?db.reversed:db.upright)
            )
          );
        })
      )
    );
  }

  function renderPatterns(){
    if(detectedPatterns.length===0||!allRevealed)return null;
    return React.createElement(Section,{label:"💡",title:"塔罗师洞察"},
      React.createElement("div",{style:{background:"linear-gradient(160deg,#1e1a28,#14121c)",borderRadius:12,padding:"16px",border:"1px solid #8e44ad40"}},
        React.createElement("div",{style:{color:"#8e44ad",fontSize:11,letterSpacing:1,marginBottom:10,fontFamily:"serif"}},"基于你的历史解读，系统发现以下模式："),
        detectedPatterns.map(function(p,i){return React.createElement("div",{key:i,style:{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}},
          React.createElement("span",{style:{color:"#8e44ad",fontSize:12,flexShrink:0}},"◈"),
          React.createElement("span",{style:{color:"#bbb",fontSize:12,lineHeight:1.6}},p)
        )})
      )
    );
  }

  function renderSectionF(){
    if(!allRevealed)return null;
    var content=null;
    if(loadingSummary){content=React.createElement(LoadingOracle);}
    else if(summaryError){
      content=React.createElement("div",{style:{textAlign:"center",padding:"32px 20px",background:"#1a1a22",borderRadius:14,border:"1px solid #2a2a35"}},
        React.createElement("div",{style:{fontSize:28,marginBottom:12}},"🌙"),
        React.createElement("p",{style:{color:"#888",fontFamily:"serif",fontSize:14,lineHeight:1.8,margin:"0 0 20px"}},"星盘连接暂时中断，请稍候再试"),
        React.createElement("button",{onClick:function(){generateSummary(drawnCards,detectedPatterns)},style:{padding:"10px 28px",borderRadius:24,background:"linear-gradient(135deg,#d4af37,#b8960c)",color:"#0f0f14",border:"none",fontSize:13,fontFamily:"serif",cursor:"pointer",letterSpacing:1}},"✨ 重新解读")
      );
    }else if(summary){
      content=React.createElement("div",{ref:summaryRef,style:{display:"flex",flexDirection:"column",gap:12}},
        // ① Card readings — available first
        summary.cardReadings&&summary.cardReadings.length>0&&React.createElement("div",{style:{background:"#1a1a22",borderRadius:12,padding:"18px",border:"1px solid #2a2a35"}},
          React.createElement("div",{style:{color:"#d4af37",fontSize:11,letterSpacing:2,marginBottom:14,fontFamily:"serif"}},"① 牌面解析 · 图像连接"),
          React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:20}},
            summary.cardReadings.map(function(r,i){
              var actualCard=drawnCards[i]||drawnCards.find(function(c){return c.name===r.card;});
              var isRev=actualCard&&actualCard.orientation==="逆位";
              var imgName=actualCard?actualCard.name:r.card;
              var img=getCardImg(imgName);
              return React.createElement("div",{key:i,style:{display:"flex",gap:14,alignItems:"flex-start"}},
                React.createElement("div",{style:{flexShrink:0,width:72,height:112,borderRadius:9,overflow:"hidden",border:"1px solid "+(isRev?"#c0784a60":"#d4af3760"),background:"#0f0f14",transform:isRev?"rotate(180deg)":"none"}},
                  img?React.createElement("img",{src:img,alt:r.card,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}):React.createElement("div",{style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}},"🃏")
                ),
                React.createElement("div",{style:{flex:1,borderLeft:"2px solid #d4af3740",paddingLeft:12}},
                  React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center",marginBottom:6}},React.createElement("span",{style:{color:"#d4af37",fontSize:13,fontFamily:"serif"}},r.card),React.createElement("span",{style:{color:"#444",fontSize:10}},"·"),React.createElement("span",{style:{color:"#666",fontSize:10}},r.position),isRev&&React.createElement("span",{style:{color:"#c0784a",fontSize:10,marginLeft:4}},"逆位")),
                  React.createElement("p",{style:{color:"#ccc",fontSize:13,lineHeight:1.7,margin:"0 0 8px"}},r.core),
                  React.createElement("p",{style:{color:"#888",fontSize:12,lineHeight:1.6,margin:0,fontStyle:"italic"}},"🔑 "+r.symbol)
                )
              );
            })
          )
        ),
        // ② Synthesis — loading indicator while waiting, then content
        loadingRest
          ?React.createElement("div",{style:{background:"linear-gradient(160deg,#1e1a2e,#12121c)",borderRadius:14,padding:"20px",border:"1px solid #d4af3730",display:"flex",alignItems:"center",gap:12}},
              React.createElement("style",null,"@keyframes oraclePulse{0%,100%{opacity:0.4}50%{opacity:1}}"),
              React.createElement("span",{style:{fontSize:20,animation:"oraclePulse 1.8s ease-in-out infinite"}},"🔮"),
              React.createElement("span",{style:{color:"#d4af3780",fontFamily:"serif",fontSize:13,letterSpacing:1}},"占卜师正在书写综合解读……")
            )
          :summary.synthesis&&React.createElement("div",{style:{background:"linear-gradient(160deg,#1e1a2e,#12121c)",borderRadius:14,padding:"20px",border:"1px solid #d4af3750"}},
              React.createElement("div",{style:{color:"#d4af37",fontSize:11,letterSpacing:2,marginBottom:10,fontFamily:"serif"}},"② 综合推演 · 占卜师解答"),
              React.createElement("p",{style:{color:"#e0ddd5",fontSize:14,lineHeight:1.9,fontFamily:"serif",margin:0,borderLeft:"2px solid #d4af3760",paddingLeft:14}},summary.synthesis)
            ),
        // ③ Energy / trend / action — arrives with synthesis in same object
        summary.energy&&React.createElement("div",{style:{background:"#1a1a22",borderRadius:12,padding:"18px",border:"1px solid #2a2a35"}},
          React.createElement("div",{style:{color:"#d4af37",fontSize:11,letterSpacing:2,marginBottom:14,fontFamily:"serif"}},"③ 能量趋势 · 行动建议"),
          React.createElement("div",{style:{marginBottom:14}},React.createElement("div",{style:{color:"#d4af9080",fontSize:11,marginBottom:6}},"🌟 当前核心能量"),React.createElement("p",{style:{color:"#bbb",fontSize:13,lineHeight:1.7,margin:0}},summary.energy)),
          React.createElement("div",{style:{marginBottom:14}},React.createElement("div",{style:{color:"#d4af9080",fontSize:11,marginBottom:6}},"🌙 未来趋势"),React.createElement("p",{style:{color:"#bbb",fontSize:13,lineHeight:1.7,margin:0}},summary.trend)),
          React.createElement("div",{style:{marginBottom:10,background:"#d4af3710",borderRadius:10,padding:"12px 14px",border:"1px solid #d4af3730"}},React.createElement("div",{style:{color:"#d4af37",fontSize:11,marginBottom:6}},"⚡ 具体行动建议"),React.createElement("p",{style:{color:"#ddd",fontSize:13,lineHeight:1.7,margin:0}},summary.action)),
          summary.timeWindow&&React.createElement("div",{style:{borderTop:"1px solid #2a2a35",paddingTop:10,color:"#555",fontSize:11,fontStyle:"italic"}},"⏳ "+summary.timeWindow)
        ),
        summary.closing&&React.createElement("div",{style:{textAlign:"center",padding:"10px",color:"#d4af3780",fontSize:13,fontFamily:"serif",fontStyle:"italic",letterSpacing:1}},summary.closing),
        // ✦ Next question suggestion
        !loadingRest&&summary.nextQuestion&&React.createElement("div",{style:{background:"linear-gradient(160deg,#1a1428,#0f0f18)",borderRadius:14,padding:"20px",border:"1px solid #8e44ad40",position:"relative",overflow:"hidden"}},
          React.createElement("style",null,"@keyframes nextQGlow{0%,100%{box-shadow:0 0 0 #8e44ad00}50%{box-shadow:0 0 20px #8e44ad22}}"),
          React.createElement("div",{style:{color:"#8e44ad",fontSize:11,letterSpacing:2,marginBottom:10,fontFamily:"serif"}},"✦ 塔罗师还想问你"),
          React.createElement("p",{style:{color:"#d0c8e8",fontSize:15,fontFamily:"serif",lineHeight:1.8,margin:"0 0 16px",fontStyle:"italic"}},summary.nextQuestion),
          React.createElement("button",{
            onClick:function(){handleReset(summary.nextQuestion);},
            style:{
              width:"100%",padding:"12px",borderRadius:10,
              background:"linear-gradient(135deg,#6c3483,#8e44ad)",
              border:"none",color:"#f0e6ff",
              fontSize:13,fontFamily:"serif",letterSpacing:1,cursor:"pointer",
              boxShadow:"0 2px 16px #8e44ad40",
              animation:"nextQGlow 3s ease-in-out infinite",
              transition:"all 0.2s"
            }
          },"以这个问题继续问卜 →")
        ),
        !loadingRest&&summary.synthesis&&React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}},
          React.createElement(ActionBtn,{onClick:function(){handleReset();},label:"🔄 重新抽牌",primary:true}),
          React.createElement(ActionBtn,{onClick:function(){var t="塔罗解读\n问题："+fullQuestion+"\n牌阵："+spread.label+"\n"+drawnCards.map(function(c,i){return spread.positions[i]+"："+c.name+"（"+c.orientation+"）"}).join("\n")+"\n\n"+summary.synthesis+"\n\n行动建议："+summary.action;navigator.clipboard.writeText(t).then(function(){alert("已复制")})},label:"📋 复制结果"})
        )
      );
    }
    return React.createElement(Section,{label:"F",title:"塔罗师综合解读"},content);
  }

  function renderHistory(){
    if(readings.length===0){
      return React.createElement(Section,{label:"📜",title:"历史解读"},
        React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",color:"#333"}},
          React.createElement("div",{style:{fontSize:40,marginBottom:12}},"🌑"),
          React.createElement("p",{style:{fontFamily:"serif",fontSize:14,color:"#555"}},"还没有解读记录"),
          React.createElement("p",{style:{fontSize:12,color:"#333"}},"完成你的第一次塔罗解读吧")
        )
      );
    }
    return React.createElement(Section,{label:"📜",title:"历史解读",extra:readings.length+"条"},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"8px 12px",borderRadius:8,background:"#1a1a22",border:"1px solid #2a2a35"}},
        React.createElement("span",{style:{fontSize:11}},"🔒"),
        React.createElement("span",{style:{color:"#555",fontSize:11,lineHeight:1.5}},"解读记录仅保存在你自己的设备上，不上传服务器，其他人看不到。")
      ),
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
        readings.map(function(r){
          return React.createElement("div",{key:r.id,style:{background:"#1a1a22",borderRadius:12,padding:"16px",border:"1px solid #2a2a35"}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
              React.createElement("span",{style:{color:"#d4af37",fontSize:12,fontFamily:"serif"}},r.spread),
              React.createElement("span",{style:{color:"#444",fontSize:10}},r.date)
            ),
            React.createElement("div",{style:{color:"#bbb",fontSize:13,marginBottom:10,lineHeight:1.6}},r.question),
            React.createElement("div",{style:{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}},
              (r.cards||[]).map(function(c,i){return React.createElement("span",{key:i,style:{fontSize:10,padding:"3px 8px",borderRadius:10,background:c.orientation==="逆位"?"#c0784a15":"#d4af3710",color:c.orientation==="逆位"?"#c0784a":"#d4af37",border:"1px solid "+(c.orientation==="逆位"?"#c0784a25":"#d4af3725")}},c.position+"："+c.name+(c.orientation==="逆位"?" ↓":""))})
            ),
            r.synthesis&&React.createElement("div",{style:{borderTop:"1px solid #1e1e28",paddingTop:10}},
              React.createElement("p",{style:{color:"#888",fontSize:12,lineHeight:1.6,margin:0,fontStyle:"italic"}},r.synthesis.length>150?r.synthesis.substring(0,150)+"…":r.synthesis)
            )
          );
        })
      )
    );
  }

  function renderProfileTab(){
    if(profile.totalReadings===0){
      return React.createElement(Section,{label:"✦",title:"你的塔罗档案"},
        React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",color:"#333"}},
          React.createElement("div",{style:{fontSize:40,marginBottom:12}},"🌟"),
          React.createElement("p",{style:{fontFamily:"serif",fontSize:14,color:"#555"}},"档案尚未建立"),
          React.createElement("p",{style:{fontSize:12,color:"#333"}},"完成解读后，塔罗师将开始记住你的旅程")
        )
      );
    }
    return React.createElement(Section,{label:"✦",title:"你的塔罗档案"},
      React.createElement(ProfilePanel,{profile:profile,onClear:handleClearAll})
    );
  }

  return React.createElement("div",{style:{minHeight:"100vh",background:"#0f0f14",color:"#e8e8e0",fontFamily:"'Segoe UI',sans-serif",padding:"0 0 60px"}},
    renderHeader(),
    renderTabs(),
    React.createElement("div",{style:{maxWidth:700,margin:"0 auto",padding:"0 20px"}},
      tab==="reading"&&React.createElement("div",null,renderSectionA(),renderSectionB(),renderSectionC(),renderSectionD(),renderSectionE(),renderPatterns(),renderSectionF()),
      tab==="history"&&renderHistory(),
      tab==="profile"&&renderProfileTab()
    )
  );
}
