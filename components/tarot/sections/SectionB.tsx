// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section, Stars } from '../../ui/TarotUI';
import { CATEGORIES, SPREADS } from '../../../lib/tarotData';

export function SectionB() {
  const { phase, category, setCategory, spread, setSpread, recLoading, recSuggestion, catSpreads, spreadSectionRef } = useTarot();

  const recCatLabel    = recSuggestion ? (CATEGORIES.find((c) => c.id === recSuggestion.catId) || {}).label : '';
  const recSpreadLabel = recSuggestion ? ((SPREADS[recSuggestion.catId] || []).find((s) => s.id === recSuggestion.spreadId) || {}).label : '';

  return React.createElement('div', { ref: spreadSectionRef },
    React.createElement(Section, { label: 'B', title: '选择牌阵' },
      React.createElement('style', null, '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes recFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}'),

      recLoading && React.createElement('div', { style: { marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#1a1a22', border: '1px solid #2a2a35' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, color: '#d4af3760', fontSize: 12 } },
          React.createElement('span', { style: { animation: 'spin 1.2s linear infinite', display: 'inline-block', lineHeight: 1 } }, '◌'),
          React.createElement('span', { style: { letterSpacing: 1 } }, '正在分析问题类型…')
        )
      ),

      !recLoading && recSuggestion && React.createElement('div', { style: { marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#d4af3710', border: '1px solid #d4af3730', animation: 'recFadeIn 0.3s ease' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } },
          React.createElement('span', { style: { fontSize: 11, color: '#d4af37', letterSpacing: 1 } }, '✦ 星星的指引'),
          React.createElement('span', { style: { fontSize: 10, color: '#555', marginLeft: 'auto' } }, '为你感应到的牌阵')
        ),
        React.createElement('div', { style: { marginBottom: 4 } },
          React.createElement('span', { style: { color: '#d4af37', fontSize: 13, fontFamily: 'serif' } }, recCatLabel),
          React.createElement('span', { style: { color: '#555', fontSize: 12, margin: '0 6px' } }, '·'),
          React.createElement('span', { style: { color: '#ccc', fontSize: 13, fontFamily: 'serif' } }, recSpreadLabel)
        ),
        recSuggestion.reason && React.createElement('div', { style: { color: '#6a6a80', fontSize: 11, lineHeight: 1.5 } }, recSuggestion.reason)
      ),

      React.createElement('div', { style: { marginBottom: 16 } },
        React.createElement('div', { style: { color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 10 } }, '第一步 · 你想探索什么？'),
        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          CATEGORIES.map((cat) => {
            const sel = category === cat.id;
            return React.createElement('button', {
              key: cat.id,
              onClick: () => { if (phase !== 'idle') return; setCategory(cat.id); setSpread(null); },
              style: { flex: '1 1 120px', padding: '12px 10px', borderRadius: 12, border: `1px solid ${sel ? '#d4af37' : '#2a2a35'}`, background: sel ? '#d4af3715' : '#1a1a22', color: sel ? '#d4af37' : '#888', cursor: phase === 'idle' ? 'pointer' : 'default', textAlign: 'left', transition: 'all 0.2s' },
            },
              React.createElement('div', { style: { fontSize: 18, marginBottom: 4 } }, cat.emoji),
              React.createElement('div', { style: { fontFamily: 'serif', fontSize: 12, marginBottom: 2 } }, cat.label),
              React.createElement('div', { style: { fontSize: 10, color: sel ? '#d4af3799' : '#444' } }, cat.desc)
            );
          })
        )
      ),

      category && React.createElement('div', null,
        React.createElement('div', { style: { color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 10 } }, '第二步 · 选择牌阵'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          catSpreads.map((s) => {
            const sel = spread && spread.id === s.id;
            return React.createElement('button', {
              key: s.id,
              onClick: () => { if (phase === 'idle') setSpread(s); },
              style: { padding: '12px 14px', borderRadius: 12, border: `1px solid ${sel ? '#d4af37' : '#2a2a35'}`, background: sel ? '#d4af3715' : '#1a1a22', color: sel ? '#d4af37' : '#ccc', cursor: phase === 'idle' ? 'pointer' : 'default', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', boxShadow: sel ? '0 0 12px #d4af3720' : 'none' },
            },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 } },
                  React.createElement('span', { style: { fontFamily: 'serif', fontSize: 13 } }, s.label),
                  React.createElement(Stars, { n: s.stars }),
                  React.createElement('span', { style: { fontSize: 10, color: '#555', marginLeft: 'auto' } }, `${s.count}张`)
                ),
                React.createElement('div', { style: { fontSize: 11, color: sel ? '#d4af3799' : '#555' } }, s.desc)
              ),
              sel && React.createElement('div', { style: { color: '#d4af37', fontSize: 18, flexShrink: 0 } }, '✓')
            );
          })
        )
      )
    )
  );
}
