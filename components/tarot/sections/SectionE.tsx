// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';
import { getCardData, getCardImg } from '../../../lib/tarotData';

export function SectionE() {
  const { revealedIdx, drawnCards, spread } = useTarot();
  if (revealedIdx.length === 0) return null;
  const sorted = revealedIdx.slice().sort((a, b) => a - b);

  return React.createElement(Section, { label: 'E', title: '牌义手册' },
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
      sorted.map((i) => {
        const card = drawnCards[i]; const db = getCardData(card.name); const rev = card.orientation === '逆位';
        return React.createElement('div', { key: i, style: { background: '#1a1a22', borderRadius: 12, padding: '16px', border: `1px solid ${rev ? '#c0784a30' : '#2a2a35'}` } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } },
            React.createElement('div', { style: { width: 62, height: 96, borderRadius: 8, flexShrink: 0, border: `1px solid ${rev ? '#c0784a60' : '#d4af3760'}`, overflow: 'hidden', background: '#0f0f14', transform: rev ? 'rotate(180deg)' : 'none' } },
              getCardImg(card.name)
                ? React.createElement('img', { src: getCardImg(card.name), alt: card.name, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } })
                : React.createElement('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, '🃏')
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { color: '#d4af37', fontFamily: 'serif', fontSize: 15, marginBottom: 2 } }, card.name),
              React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                React.createElement('span', { style: { color: '#555', fontSize: 11 } }, spread.positions[i]),
                React.createElement('span', { style: { padding: '1px 8px', borderRadius: 10, background: rev ? '#c0784a20' : '#d4af3715', color: rev ? '#c0784a' : '#d4af37', fontSize: 10 } }, card.orientation)
              ),
              React.createElement('div', { style: { color: '#666', fontSize: 11, marginTop: 4 } }, db.keywords)
            )
          ),
          React.createElement('div', { style: { borderTop: '1px solid #2a2a35', paddingTop: 12 } },
            React.createElement('div', { style: { color: '#888', fontSize: 11, marginBottom: 6, letterSpacing: 1 } }, rev ? '▼ 逆位释义' : '▲ 正位释义'),
            React.createElement('p', { style: { color: '#ccc', fontSize: 13, lineHeight: 1.8, margin: 0 } }, rev ? db.reversed : db.upright)
          )
        );
      })
    )
  );
}
