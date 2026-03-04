// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section, ActionBtn, LoadingOracle } from '../../ui/TarotUI';
import { getCardImg } from '../../../lib/tarotData';

export function SectionF() {
  const {
    allRevealed, loadingSummary, summaryError, summary, summaryRef,
    loadingRest, streamingText, drawnCards, spread, fullQuestion,
    generateSummary, detectedPatterns, handleReset,
  } = useTarot();

  if (!allRevealed) return null;

  let content = null;

  if (loadingSummary) {
    content = React.createElement(LoadingOracle);
  } else if (summaryError) {
    content = React.createElement('div', { style: { textAlign: 'center', padding: '32px 20px', background: '#1a1a22', borderRadius: 14, border: '1px solid #2a2a35' } },
      React.createElement('div', { style: { fontSize: 28, marginBottom: 12 } }, '🌙'),
      React.createElement('p', { style: { color: '#888', fontFamily: 'serif', fontSize: 14, lineHeight: 1.8, margin: '0 0 20px' } }, '星盘连接暂时中断，请稍候再试'),
      React.createElement('button', { onClick: () => generateSummary(drawnCards, detectedPatterns), style: { padding: '10px 28px', borderRadius: 24, background: 'linear-gradient(135deg,#d4af37,#b8960c)', color: '#0f0f14', border: 'none', fontSize: 13, fontFamily: 'serif', cursor: 'pointer', letterSpacing: 1 } }, '✨ 重新解读')
    );
  } else if (summary) {
    content = React.createElement('div', { ref: summaryRef, style: { display: 'flex', flexDirection: 'column', gap: 12 } },

      // ① Card readings
      summary.cardReadings && summary.cardReadings.length > 0 &&
        React.createElement('div', { style: { background: '#1a1a22', borderRadius: 12, padding: '18px', border: '1px solid #2a2a35' } },
          React.createElement('div', { style: { color: '#d4af37', fontSize: 11, letterSpacing: 2, marginBottom: 14, fontFamily: 'serif' } }, '① 牌面解析 · 图像连接'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
            summary.cardReadings.map((r, i) => {
              const actualCard = drawnCards[i] || drawnCards.find((c) => c.name === r.card);
              const isRev = actualCard && actualCard.orientation === '逆位';
              const img = getCardImg(actualCard ? actualCard.name : r.card);
              return React.createElement('div', { key: i, style: { display: 'flex', gap: 14, alignItems: 'flex-start' } },
                React.createElement('div', { style: { flexShrink: 0, width: 72, height: 112, borderRadius: 9, overflow: 'hidden', border: `1px solid ${isRev ? '#c0784a60' : '#d4af3760'}`, background: '#0f0f14', transform: isRev ? 'rotate(180deg)' : 'none' } },
                  img ? React.createElement('img', { src: img, alt: r.card, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } })
                      : React.createElement('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 } }, '🃏')
                ),
                React.createElement('div', { style: { flex: 1, borderLeft: '2px solid #d4af3740', paddingLeft: 12 } },
                  React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 } },
                    React.createElement('span', { style: { color: '#d4af37', fontSize: 13, fontFamily: 'serif' } }, r.card),
                    React.createElement('span', { style: { color: '#444', fontSize: 10 } }, '·'),
                    React.createElement('span', { style: { color: '#666', fontSize: 10 } }, r.position),
                    isRev && React.createElement('span', { style: { color: '#c0784a', fontSize: 10, marginLeft: 4 } }, '逆位')
                  ),
                  React.createElement('p', { style: { color: '#ccc', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' } }, r.core),
                  React.createElement('p', { style: { color: '#888', fontSize: 12, lineHeight: 1.6, margin: 0, fontStyle: 'italic' } }, '🔑 ' + r.symbol)
                )
              );
            })
          )
        ),

      // ② Synthesis with streaming cursor
      React.createElement('style', null,
        '@keyframes oraclePulse{0%,100%{opacity:0.4}50%{opacity:1}}' +
        '@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}'
      ),
      (!summary.synthesis && loadingRest && !streamingText)
        ? React.createElement('div', { style: { background: 'linear-gradient(160deg,#1e1a2e,#12121c)', borderRadius: 14, padding: '20px', border: '1px solid #d4af3730', display: 'flex', alignItems: 'center', gap: 12 } },
            React.createElement('span', { style: { fontSize: 20, animation: 'oraclePulse 1.8s ease-in-out infinite' } }, '🔮'),
            React.createElement('span', { style: { color: '#d4af3780', fontFamily: 'serif', fontSize: 13, letterSpacing: 1 } }, '占卜师正在书写综合解读……')
          )
        : (streamingText || summary.synthesis) &&
            React.createElement('div', { style: { background: 'linear-gradient(160deg,#1e1a2e,#12121c)', borderRadius: 14, padding: '20px', border: '1px solid #d4af3750' } },
              React.createElement('div', { style: { color: '#d4af37', fontSize: 11, letterSpacing: 2, marginBottom: 10, fontFamily: 'serif' } }, '② 综合推演 · 占卜师解答'),
              React.createElement('p', { style: { color: '#e0ddd5', fontSize: 14, lineHeight: 1.9, fontFamily: 'serif', margin: 0, borderLeft: '2px solid #d4af3760', paddingLeft: 14 } },
                summary.synthesis || streamingText,
                !summary.synthesis && streamingText &&
                  React.createElement('span', { style: { display: 'inline-block', width: 2, height: '1em', background: '#d4af37', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'cursorBlink 0.8s ease-in-out infinite' } })
              )
            ),

      // Spinner for ③ while loading
      summary.synthesis && loadingRest &&
        React.createElement('div', { style: { background: '#1a1a22', borderRadius: 12, padding: '18px', border: '1px solid #d4af3720', display: 'flex', alignItems: 'center', gap: 12 } },
          React.createElement('span', { style: { fontSize: 16, animation: 'oraclePulse 1.8s ease-in-out infinite' } }, '✦'),
          React.createElement('span', { style: { color: '#d4af3760', fontFamily: 'serif', fontSize: 12, letterSpacing: 1 } }, '正在推演能量走势……')
        ),

      // Deep questions
      summary.deepQuestions && Array.isArray(summary.deepQuestions) && summary.deepQuestions.length > 0 &&
        React.createElement('div', { style: { marginTop: 4 } },
          React.createElement('style', null, '@keyframes deepQFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes deepQHover{0%,100%{box-shadow:0 0 0 #d4af3700}50%{box-shadow:0 2px 18px #d4af3722}}'),
          React.createElement('p', { style: { color: '#888', fontSize: 12, fontFamily: 'serif', letterSpacing: 1, margin: '0 0 12px', textAlign: 'center', fontStyle: 'italic' } }, '✦ 牌面留下了更深的入口，你想继续探索哪一层？'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 } },
            summary.deepQuestions.map((q, i) =>
              React.createElement('button', {
                key: i,
                onClick: () => handleReset(q),
                style: { background: 'linear-gradient(160deg,#1c1a2e,#13121e)', border: '1px solid #d4af3730', borderRadius: 12, padding: '14px 12px', color: '#d0cce8', fontSize: 12, fontFamily: 'serif', lineHeight: 1.6, letterSpacing: 0.5, cursor: 'pointer', textAlign: 'left', animation: `deepQFadeIn 0.5s ease both, deepQHover 3s ease-in-out ${i * 0.8}s infinite`, transition: 'border-color 0.2s, background 0.2s' },
              },
                React.createElement('span', { style: { display: 'block', color: '#d4af3770', fontSize: 10, marginBottom: 6, letterSpacing: 2 } }, [' ❶ 内心深处', ' ❷ 外部处境', ' ❸ 深层模式'][i]),
                q
              )
            )
          )
        ),

      // ④ Action
      summary.action &&
        React.createElement('div', { style: { background: 'linear-gradient(160deg,#1c1e14,#13160f)', borderRadius: 12, padding: '18px', border: '1px solid #6a8a3040' } },
          React.createElement('div', { style: { color: '#a8c060', fontSize: 11, letterSpacing: 2, marginBottom: 10, fontFamily: 'serif' } }, '③ 具体行动建议'),
          React.createElement('p', { style: { color: '#d4e8a8', fontSize: 14, lineHeight: 1.8, fontFamily: 'serif', margin: 0 } }, summary.action),
          summary.timeWindow &&
            React.createElement('div', { style: { borderTop: '1px solid #6a8a3020', marginTop: 12, paddingTop: 10, color: '#6a8a3080', fontSize: 11, fontStyle: 'italic' } }, '⏳ ' + summary.timeWindow)
        ),

      // ⑤ Energy + Trend
      summary.energy &&
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
          React.createElement('div', { style: { background: '#1a1a22', borderRadius: 12, padding: '16px', border: '1px solid #2a2a35' } },
            React.createElement('div', { style: { color: '#d4af9090', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: 'serif' } }, '🌟 核心能量'),
            React.createElement('p', { style: { color: '#bbb', fontSize: 13, lineHeight: 1.7, fontFamily: 'serif', margin: 0 } }, summary.energy)
          ),
          summary.trend &&
            React.createElement('div', { style: { background: '#1a1a22', borderRadius: 12, padding: '16px', border: '1px solid #2a2a35' } },
              React.createElement('div', { style: { color: '#7ec8e380', fontSize: 11, letterSpacing: 2, marginBottom: 8, fontFamily: 'serif' } }, '🌙 未来趋势'),
              React.createElement('p', { style: { color: '#bbb', fontSize: 13, lineHeight: 1.7, fontFamily: 'serif', margin: 0 } }, summary.trend)
            )
        ),

      summary.closing &&
        React.createElement('div', { style: { textAlign: 'center', padding: '10px', color: '#d4af3780', fontSize: 13, fontFamily: 'serif', fontStyle: 'italic', letterSpacing: 1 } }, summary.closing),

      !loadingRest && summary.synthesis &&
        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 } },
          React.createElement(ActionBtn, { onClick: () => handleReset(), label: '🔄 重新抽牌', primary: true }),
          React.createElement(ActionBtn, {
            onClick: () => {
              const t = `塔罗解读\n问题：${fullQuestion}\n牌阵：${spread.label}\n${drawnCards.map((c, i) => `${spread.positions[i]}：${c.name}（${c.orientation}）`).join('\n')}\n\n${summary.synthesis}\n\n行动建议：${summary.action}`;
              navigator.clipboard.writeText(t).then(() => alert('已复制'));
            },
            label: '📋 复制结果',
          })
        )
    );
  }

  return React.createElement(Section, { label: 'F', title: '塔罗师综合解读' }, content);
}
