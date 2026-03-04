// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';
import { SpreadBoard } from '../CardComponents';

export function SectionD() {
  const { spread, drawnCards, revealedIdx, allRevealed, handleReveal, handleRevealAll } = useTarot();
  if (drawnCards.length === 0) return null;

  return React.createElement(Section, { label: 'D', title: '牌阵展示' },
    React.createElement(SpreadBoard, { spread, drawnCards, revealedIdx, onReveal: handleReveal }),
    !allRevealed && React.createElement('div', { style: { textAlign: 'center', marginTop: 8 } },
      React.createElement('button', {
        onClick: handleRevealAll,
        style: { padding: '8px 22px', borderRadius: 20, border: '1px solid #d4af3750', background: 'transparent', color: '#d4af37', fontSize: 12, cursor: 'pointer', letterSpacing: 1 },
      }, '全部翻开')
    )
  );
}
