// @ts-nocheck
'use client';
import React from 'react';
import { getCardImg } from '../../lib/tarotData';

export const CARD_BACK = React.createElement('div', {
  style: {
    width: '100%', height: '100%', borderRadius: 10,
    background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
    border: '1px solid #d4af3750',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
}, '🔮');

export function CardFace({ card }) {
  const rev = card.orientation === '逆位';
  const img = getCardImg(card.name);
  return React.createElement('div', {
    style: {
      width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden',
      position: 'relative',
      border: `1px solid ${rev ? '#c0784a80' : '#d4af3780'}`,
      transform: rev ? 'rotate(180deg)' : 'none',
      background: '#0f0f14',
    },
  },
    img
      ? React.createElement('img', { src: img, alt: card.name, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } })
      : React.createElement('div', {
          style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 6px', background: 'linear-gradient(160deg,#1a1a22,#12121a)' },
        },
          React.createElement('div', { style: { fontSize: 20, marginBottom: 4 } }, '🃏'),
          React.createElement('div', { style: { color: '#d4af37', fontSize: 9, fontFamily: 'serif', textAlign: 'center', lineHeight: 1.3 } }, card.name)
        )
  );
}

export function FlipCard({ i, w = 70, h = 110, spread, drawnCards, revealedIdx, onReveal, glow }) {
  const card = drawnCards[i];
  const rev = revealedIdx.indexOf(i) >= 0;
  const glowStyle = rev && glow
    ? { borderRadius: 10, boxShadow: '0 0 18px #d4af3770, 0 0 36px #d4af3730, 0 0 60px #d4af3715', transition: 'box-shadow 0.8s ease' }
    : { borderRadius: 10, transition: 'box-shadow 0.8s ease' };
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } },
    React.createElement('div', { style: { color: '#d4af3778', fontSize: 9, fontFamily: 'serif', textAlign: 'center', lineHeight: 1.3, maxWidth: w + 10 } }, spread.positions[i]),
    React.createElement('div', {
      onClick: () => { if (!rev) onReveal(i); },
      style: Object.assign({ width: w, height: h, cursor: rev ? 'default' : 'pointer', perspective: 600 }, glowStyle),
    },
      React.createElement('div', { style: { width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: rev ? 'rotateY(180deg)' : 'rotateY(0deg)' } },
        React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' } }, CARD_BACK),
        React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' } },
          card && React.createElement(CardFace, { card })
        )
      )
    ),
    !rev && React.createElement('div', { style: { color: '#333', fontSize: 8 } }, '点击翻牌')
  );
}

export function SpreadBoard({ spread, drawnCards, revealedIdx, onReveal }) {
  const fp = { spread, drawnCards, revealedIdx, onReveal };

  if (spread.id === 'celtic') {
    const pos = [
      { i: 0, x: 115, y: 145 }, { i: 1, x: 115, y: 145, rot: true },
      { i: 2, x: 115, y: 235 }, { i: 3, x: 115, y: 55 },
      { i: 4, x: 25, y: 145 },  { i: 5, x: 205, y: 145 },
      { i: 6, x: 250, y: 235 }, { i: 7, x: 250, y: 155 },
      { i: 8, x: 250, y: 75 },  { i: 9, x: 250, y: 0 },
    ];
    return React.createElement('div', { style: { position: 'relative', width: 320, height: 390, margin: '16px auto' } },
      pos.map((p) => {
        if (!drawnCards[p.i]) return null;
        const isRev = revealedIdx.indexOf(p.i) >= 0;
        return React.createElement('div', { key: p.i, style: { position: 'absolute', left: p.x, top: p.y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } },
          React.createElement('div', { style: { color: '#d4af3760', fontSize: 8, whiteSpace: 'nowrap', maxWidth: 80, textAlign: 'center' } }, spread.positions[p.i]),
          React.createElement('div', {
            onClick: () => { if (!isRev) onReveal(p.i); },
            style: { width: 75, height: 116, cursor: isRev ? 'default' : 'pointer', perspective: 600, transform: p.rot ? 'rotate(90deg)' : 'none' },
          },
            React.createElement('div', { style: { width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: isRev ? 'rotateY(180deg)' : 'rotateY(0deg)' } },
              React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' } }, CARD_BACK),
              React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' } },
                drawnCards[p.i] && React.createElement(CardFace, { card: drawnCards[p.i] })
              )
            )
          )
        );
      })
    );
  }

  if (spread.id === 'chakra') {
    const cols = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#9b59b6'];
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0' } },
      drawnCards.map((_, idx2) => {
        const ri = drawnCards.length - 1 - idx2;
        const c = drawnCards[ri]; const col = cols[ri]; const isRev = revealedIdx.indexOf(ri) >= 0;
        if (!c) return null;
        return React.createElement('div', { key: ri, style: { display: 'flex', alignItems: 'center', gap: 14 } },
          React.createElement('div', { style: { width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}`, flexShrink: 0 } }),
          React.createElement('div', { style: { color: col, fontSize: 10, fontFamily: 'serif', width: 120, textAlign: 'right', lineHeight: 1.3 } }, spread.positions[ri]),
          React.createElement('div', {
            onClick: () => { if (!isRev) onReveal(ri); },
            style: { width: 80, height: 124, cursor: isRev ? 'default' : 'pointer', perspective: 600, flexShrink: 0 },
          },
            React.createElement('div', { style: { width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: isRev ? 'rotateY(180deg)' : 'rotateY(0deg)' } },
              React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 8, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: `1px solid ${col}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, '🔮'),
              React.createElement('div', { style: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' } },
                c && React.createElement(CardFace, { card: c })
              )
            )
          )
        );
      })
    );
  }

  if (['johari', 'elements', 'swot', 'love4', 'lovefull'].indexOf(spread.id) >= 0) {
    return React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 360, margin: '16px auto', padding: '0 8px' } },
      drawnCards.map((_, i) => React.createElement(FlipCard, Object.assign({ key: i, i, w: 130, h: 202 }, fp)))
    );
  }

  if (spread.id === 'shadow') {
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', padding: '16px 0' } },
      [0, 1].map((row) =>
        React.createElement('div', { key: row, style: { display: 'flex', gap: 10 } },
          [0, 1, 2].map((col) => {
            const i = row * 3 + col;
            return drawnCards[i] ? React.createElement(FlipCard, Object.assign({ key: i, i, w: 106, h: 164 }, fp)) : null;
          })
        )
      )
    );
  }

  const cardW = drawnCards.length === 1 ? 160 : drawnCards.length === 3 ? 118 : 100;
  const cardH = Math.round(cardW * 1.57);
  return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '16px 8px', width: '100%' } },
    drawnCards.map((_, i) => React.createElement(FlipCard, Object.assign({ key: i, i, w: cardW, h: cardH, glow: true }, fp)))
  );
}
