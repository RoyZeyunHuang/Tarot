// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';

export function Stars({ n }) {
  return React.createElement('span', { style: { fontSize: 9, letterSpacing: 1 } },
    [1, 2, 3].map((i) =>
      React.createElement('span', { key: i, style: { color: i <= n ? '#d4af37' : '#2a2a35' } }, '★')
    )
  );
}

export function Section({ label, title, extra = null, children }) {
  return React.createElement('div', { style: { marginTop: 28 } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } },
      React.createElement('div', {
        style: {
          width: 22, height: 22, borderRadius: 6,
          background: '#d4af3715', border: '1px solid #d4af3730',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#d4af37', fontFamily: 'serif', flexShrink: 0,
        },
      }, label),
      React.createElement('h2', { style: { margin: 0, fontSize: 14, fontFamily: 'serif', color: '#e0e0d8', letterSpacing: 2, fontWeight: 400 } }, title),
      extra && React.createElement('span', { style: { fontSize: 10, color: '#555', marginLeft: 4 } }, extra),
      React.createElement('div', { style: { flex: 1, height: '1px', background: '#1e1e28' } })
    ),
    children
  );
}

export function ActionBtn({ onClick, label, primary = false }) {
  return React.createElement('button', {
    onClick,
    style: {
      flex: '1 1 auto', padding: '10px 14px', borderRadius: 24,
      background: primary ? 'linear-gradient(135deg,#d4af37,#b8960c)' : 'transparent',
      color: primary ? '#0f0f14' : '#d4af37',
      border: `1px solid ${primary ? 'transparent' : '#d4af3750'}`,
      fontSize: 12, cursor: 'pointer', letterSpacing: 1,
    },
  }, label);
}

export function LoadingOracle() {
  const lines = [
    '星盘正在对齐，宇宙的信息正在汇聚……',
    '每一张牌都是你内心深处的镜子。',
    '塔罗不预测命运，它揭示你尚未看见的自己。',
    '牌面背后，是你灵魂想对你说的话。',
    '占卜的本质，是与自己最深处的对话。',
    '你已经知道答案了，牌只是帮你看清它。',
  ];
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx((i) => (i + 1) % lines.length); setFade(true); }, 500);
    }, 3000);
    return () => clearInterval(iv);
  }, []);
  return React.createElement('div', { style: { textAlign: 'center', padding: '36px 20px' } },
    React.createElement('div', { style: { fontSize: 32, marginBottom: 20, animation: 'slowspin 8s linear infinite', display: 'inline-block' } }, '🔮'),
    React.createElement('div', { style: { color: '#d4af37', fontFamily: 'serif', fontSize: 13, letterSpacing: 2, marginBottom: 20 } }, '塔罗师正在解读……'),
    React.createElement('div', { style: { minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' } },
      React.createElement('p', {
        style: {
          color: '#a09070', fontSize: 14, fontFamily: 'serif', lineHeight: 1.8,
          margin: 0, fontStyle: 'italic', letterSpacing: 1, maxWidth: 320, textAlign: 'center',
          opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease',
        },
      }, lines[idx])
    ),
    React.createElement('style', null, '@keyframes slowspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}')
  );
}
