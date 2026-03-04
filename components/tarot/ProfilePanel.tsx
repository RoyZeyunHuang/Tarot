// @ts-nocheck
'use client';
import React from 'react';

export function ProfilePanel({ profile, onClear }) {
  if (!profile || profile.totalReadings === 0) return null;
  const topCards = Object.entries(profile.frequentCards || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  const catNames: Record<string, string> = { quick: '快速指引', trend: '趋势发展', love: '感情关系', career: '事业决策', self: '自我探索' };
  const topCats = Object.entries(profile.topCategories || {}).sort((a: any, b: any) => b[1] - a[1]);

  return React.createElement('div', {
    style: { background: 'linear-gradient(160deg,#1a1a2e,#12121c)', borderRadius: 14, padding: '20px', border: '1px solid #d4af3730', position: 'relative', overflow: 'hidden' },
  },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
      React.createElement('div', { style: { color: '#d4af37', fontSize: 13, fontFamily: 'serif', letterSpacing: 2 } }, '✦ 你的塔罗档案'),
      React.createElement('div', { style: { color: '#444', fontSize: 10 } }, `${profile.totalReadings} 次解读`)
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 } },
      React.createElement('div', { style: { background: '#0f0f1480', borderRadius: 10, padding: '12px' } },
        React.createElement('div', { style: { color: '#555', fontSize: 10, marginBottom: 6 } }, '常抽到的牌'),
        topCards.length > 0
          ? topCards.map((e: any, i) =>
              React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 } },
                React.createElement('span', { style: { color: '#ccc', fontSize: 11 } }, e[0]),
                React.createElement('span', { style: { color: '#d4af37', fontSize: 10 } }, `${e[1]}次`)
              )
            )
          : React.createElement('div', { style: { color: '#333', fontSize: 11 } }, '暂无数据')
      ),
      React.createElement('div', { style: { background: '#0f0f1480', borderRadius: 10, padding: '12px' } },
        React.createElement('div', { style: { color: '#555', fontSize: 10, marginBottom: 6 } }, '关注领域'),
        topCats.map((e: any, i) =>
          React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 } },
            React.createElement('span', { style: { color: '#ccc', fontSize: 11 } }, catNames[e[0]] || e[0]),
            React.createElement('span', { style: { color: '#d4af37', fontSize: 10 } }, `${e[1]}次`)
          )
        )
      )
    ),
    profile.recurringThemes && profile.recurringThemes.length > 0 &&
      React.createElement('div', { style: { marginBottom: 14 } },
        React.createElement('div', { style: { color: '#555', fontSize: 10, marginBottom: 8 } }, '反复出现的生命主题'),
        React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
          profile.recurringThemes.slice(-8).map((t: string, i: number) =>
            React.createElement('span', {
              key: i,
              style: { fontSize: 10, padding: '3px 10px', borderRadius: 12, background: '#d4af3712', color: '#d4af37', border: '1px solid #d4af3725' },
            }, t)
          )
        )
      ),
    React.createElement('button', {
      onClick: onClear,
      style: { padding: '6px 16px', borderRadius: 16, border: '1px solid #33202050', background: 'transparent', color: '#44333380', fontSize: 10, cursor: 'pointer', marginTop: 4 },
    }, '清除所有数据')
  );
}
