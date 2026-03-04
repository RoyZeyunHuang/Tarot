// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';

export function SectionC() {
  const { phase, canStart, spread, drawnCards, deckCards, handleShuffle, handlePickCard } = useTarot();
  let content = null;

  if (phase === 'idle') {
    content = React.createElement('div', { style: { textAlign: 'center', padding: '16px 0' } },
      React.createElement('button', {
        onClick: handleShuffle, disabled: !canStart,
        style: { padding: '13px 36px', borderRadius: 30, background: canStart ? 'linear-gradient(135deg,#d4af37,#b8960c)' : '#1a1a22', color: canStart ? '#0f0f14' : '#333', border: 'none', fontSize: 14, fontFamily: 'serif', cursor: canStart ? 'pointer' : 'not-allowed', letterSpacing: 2, boxShadow: canStart ? '0 4px 20px #d4af3740' : 'none' },
      }, canStart ? '✨ 开始洗牌' : '请先完成问题与牌阵选择')
    );
  } else if (phase === 'shuffling') {
    content = React.createElement('div', { style: { textAlign: 'center', padding: '24px 0' } },
      React.createElement('div', { style: { fontSize: 50, animation: 'spinshuffle 0.4s linear infinite', display: 'inline-block' } }, '🃏'),
      React.createElement('p', { style: { color: '#d4af37', fontFamily: 'serif', letterSpacing: 2, marginTop: 14, fontSize: 13 } }, '正在洗牌，请专注于你的问题...'),
      React.createElement('style', null, '@keyframes spinshuffle{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}')
    );
  } else if (phase === 'drawing') {
    content = React.createElement('div', { style: { padding: '12px 0' } },
      React.createElement('p', { style: { color: '#d4af37', fontSize: 13, fontFamily: 'serif', letterSpacing: 1, marginBottom: 4, textAlign: 'center' } }, `牌已洗好，请选择 ${spread.count} 张`),
      React.createElement('p', { style: { color: '#555', fontSize: 11, marginBottom: 14, textAlign: 'center' } }, `已选 ${drawnCards.length} / ${spread.count} 张 · 左右滑动浏览全部78张`),
      React.createElement('div', { style: { overflowX: 'auto', overflowY: 'visible', paddingBottom: 14, paddingTop: 22 } },
        React.createElement('div', { style: { display: 'flex', gap: 5, width: 'max-content', padding: '0 16px', alignItems: 'flex-end' } },
          deckCards.map((card, i) => {
            const wobble = ((i * 17 + 5) % 11) - 5;
            return React.createElement('div', {
              key: card.id,
              onClick: () => { if (!card.picked) handlePickCard(i); },
              style: { width: 50, height: 80, flexShrink: 0, borderRadius: 8, background: card.picked ? '#0f0f14' : 'linear-gradient(145deg,#1e1e30,#14142a)', border: `1px solid ${card.picked ? '#222' : '#d4af3745'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: card.picked ? 'default' : 'pointer', transform: card.picked ? 'scale(0.85) translateY(8px)' : `rotate(${wobble}deg)`, transition: 'all 0.25s', opacity: card.picked ? 0.2 : 1, boxShadow: card.picked ? 'none' : '0 4px 10px #00000070' },
            },
              !card.picked && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } },
                React.createElement('div', { style: { fontSize: 14 } }, '🔮'),
                React.createElement('div', { style: { fontSize: 9, color: '#d4af3790', fontFamily: 'serif' } }, i + 1)
              )
            );
          })
        )
      )
    );
  } else if (phase === 'placed' || phase === 'done') {
    content = React.createElement('div', { style: { background: '#1a1a22', borderRadius: 10, padding: '12px 14px', border: '1px solid #2a2a35', fontSize: 13 } },
      React.createElement('span', { style: { color: '#d4af37' } }, '✓'),
      React.createElement('span', { style: { color: '#666', marginLeft: 8 } }, `已抽取 ${drawnCards.length} 张牌 · ${spread.label}`)
    );
  }

  return React.createElement(Section, { label: 'C', title: '洗牌与抽牌' }, content);
}
