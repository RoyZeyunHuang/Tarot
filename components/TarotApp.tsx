// @ts-nocheck
'use client';
import React, { useState, useCallback } from 'react';
import { TarotProvider, useTarot } from '../context/TarotContext';
import { SectionA } from './tarot/sections/SectionA';
import { SectionB } from './tarot/sections/SectionB';
import { SectionC } from './tarot/sections/SectionC';
import { SectionD } from './tarot/sections/SectionD';
import { SectionE } from './tarot/sections/SectionE';
import { SectionF } from './tarot/sections/SectionF';
import { HistoryTab } from './tarot/sections/HistoryTab';
import { ProfileTab } from './tarot/sections/ProfileTab';

function CrystalBall() {
  const [touched, setTouched] = useState(false);

  const handleTouch = useCallback(() => {
    if (touched) return;
    setTouched(true);
    setTimeout(() => setTouched(false), 1200);
  }, [touched]);

  return React.createElement('div', { style: { position: 'relative', display: 'inline-block', marginBottom: 6 } },
    React.createElement('style', null, `
      @keyframes crystalFloat {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-8px); }
      }
      @keyframes crystalGlow {
        0%,100% { filter: drop-shadow(0 0 6px #7ec8e360) drop-shadow(0 0 14px #a78bfa30); }
        50%      { filter: drop-shadow(0 0 14px #7ec8e390) drop-shadow(0 0 28px #a78bfa60); }
      }
      @keyframes crystalCool {
        0%   { filter: drop-shadow(0 0 0px #7ec8e300); transform: translateY(0px) scale(1); }
        15%  { filter: drop-shadow(0 0 22px #7ec8e3cc) drop-shadow(0 0 40px #bfdbfe99); transform: translateY(-4px) scale(1.18); }
        40%  { filter: drop-shadow(0 0 30px #38bdf8bb) drop-shadow(0 0 55px #e0f2fe80); transform: translateY(-6px) scale(1.22); }
        70%  { filter: drop-shadow(0 0 16px #7ec8e380) drop-shadow(0 0 28px #bae6fd50); transform: translateY(-3px) scale(1.1); }
        100% { filter: drop-shadow(0 0 6px #7ec8e360); transform: translateY(0px) scale(1); }
      }
      @keyframes rippleCool {
        0%   { opacity: 0.7; transform: scale(0.6); }
        100% { opacity: 0;   transform: scale(2.4); }
      }
    `),
    // Ripple ring on touch
    touched && React.createElement('div', {
      style: {
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid #7ec8e370',
        animation: 'rippleCool 1.1s ease-out forwards',
        pointerEvents: 'none',
      },
    }),
    React.createElement('div', {
      onClick: handleTouch,
      onTouchStart: handleTouch,
      style: {
        fontSize: 48,
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-block',
        animation: touched
          ? 'crystalCool 1.2s ease-out forwards'
          : 'crystalFloat 4s ease-in-out infinite, crystalGlow 3s ease-in-out infinite',
        transition: 'animation 0.1s',
        WebkitTapHighlightColor: 'transparent',
      },
    }, '🔮')
  );
}

function Header() {
  const { profile } = useTarot();
  return React.createElement('div', { style: { textAlign: 'center', padding: '36px 20px 16px', borderBottom: '1px solid #d4af3720' } },
    React.createElement(CrystalBall),
    React.createElement('h1', { style: { fontFamily: 'Georgia,serif', fontSize: 24, color: '#d4af37', margin: 0, letterSpacing: 4, fontWeight: 400 } }, '塔罗解读'),
    React.createElement('p', { style: { color: '#444', fontSize: 11, margin: '6px 0 0', letterSpacing: 2 } }, 'TAROT READING · MEMORY ENABLED'),
    profile.totalReadings > 0 &&
      React.createElement('p', { style: { color: '#d4af3760', fontSize: 10, margin: '8px 0 0' } }, `✦ 已为你积累 ${profile.totalReadings} 次解读记忆`)
  );
}

function Tabs() {
  const { tab, setTab } = useTarot();
  return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 0, borderBottom: '1px solid #1a1a22', background: '#0f0f14', position: 'sticky', top: 0, zIndex: 10 } },
    [{ id: 'reading', label: '🔮 解读' }, { id: 'history', label: '📜 历史' }, { id: 'profile', label: '✦ 档案' }].map((t) =>
      React.createElement('button', {
        key: t.id, onClick: () => setTab(t.id),
        style: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #d4af37' : '2px solid transparent', color: tab === t.id ? '#d4af37' : '#555', fontSize: 12, cursor: 'pointer', letterSpacing: 1 },
      }, t.label)
    )
  );
}

function FadeIn({ children, show }) {
  if (!show) return null;
  return React.createElement('div', {
    style: { animation: 'sectionFadeIn 0.5s ease both' },
  }, children);
}

function AppBody() {
  const { tab, questionSubmitted, spread, drawnCards, revealedIdx, allRevealed } = useTarot();
  return React.createElement('div', { style: { maxWidth: 700, margin: '0 auto', padding: '0 20px' } },
    React.createElement('style', null,
      '@keyframes sectionFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}'
    ),
    tab === 'reading' && React.createElement('div', null,
      // Section A — always visible
      React.createElement(SectionA),
      // Section B — appears after user clicks 问卜
      React.createElement(FadeIn, { show: questionSubmitted }, React.createElement(SectionB)),
      // Section C — appears after spread is selected
      React.createElement(FadeIn, { show: !!(questionSubmitted && spread) }, React.createElement(SectionC)),
      // Section D — appears after cards are drawn
      React.createElement(FadeIn, { show: drawnCards.length > 0 }, React.createElement(SectionD)),
      // Section E — appears after first card is revealed
      React.createElement(FadeIn, { show: revealedIdx.length > 0 }, React.createElement(SectionE)),
      // Section F — appears after all cards revealed
      React.createElement(FadeIn, { show: allRevealed }, React.createElement(SectionF)),
    ),
    tab === 'history' && React.createElement(HistoryTab),
    tab === 'profile' && React.createElement(ProfileTab),
  );
}

export default function TarotApp() {
  return React.createElement(TarotProvider, null,
    React.createElement('div', { style: { minHeight: '100vh', background: '#0f0f14', color: '#e8e8e0', fontFamily: "'Segoe UI',sans-serif", padding: '0 0 60px' } },
      React.createElement(Header),
      React.createElement(Tabs),
      React.createElement(AppBody),
    )
  );
}
