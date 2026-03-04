// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';

export function HistoryTab() {
  const { readings } = useTarot();

  if (readings.length === 0) {
    return React.createElement(Section, { label: '📜', title: '历史解读' },
      React.createElement('div', { style: { textAlign: 'center', padding: '40px 20px', color: '#333' } },
        React.createElement('div', { style: { fontSize: 40, marginBottom: 12 } }, '🌑'),
        React.createElement('p', { style: { fontFamily: 'serif', fontSize: 14, color: '#555' } }, '还没有解读记录'),
        React.createElement('p', { style: { fontSize: 12, color: '#333' } }, '完成你的第一次塔罗解读吧')
      )
    );
  }

  return React.createElement(Section, { label: '📜', title: '历史解读', extra: `${readings.length}条` },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: '#1a1a22', border: '1px solid #2a2a35' } },
      React.createElement('span', { style: { fontSize: 11 } }, '🔒'),
      React.createElement('span', { style: { color: '#555', fontSize: 11, lineHeight: 1.5 } }, '解读记录仅保存在你自己的设备上，不上传服务器，其他人看不到。')
    ),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      readings.map((r) =>
        React.createElement('div', { key: r.id, style: { background: '#1a1a22', borderRadius: 12, padding: '16px', border: '1px solid #2a2a35' } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
            React.createElement('span', { style: { color: '#d4af37', fontSize: 12, fontFamily: 'serif' } }, r.spread),
            React.createElement('span', { style: { color: '#444', fontSize: 10 } }, r.date)
          ),
          React.createElement('div', { style: { color: '#bbb', fontSize: 13, marginBottom: 10, lineHeight: 1.6 } }, r.question),
          React.createElement('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 } },
            (r.cards || []).map((c, i) =>
              React.createElement('span', {
                key: i,
                style: { fontSize: 10, padding: '3px 8px', borderRadius: 10, background: c.orientation === '逆位' ? '#c0784a15' : '#d4af3710', color: c.orientation === '逆位' ? '#c0784a' : '#d4af37', border: `1px solid ${c.orientation === '逆位' ? '#c0784a25' : '#d4af3725'}` },
              }, `${c.position}：${c.name}${c.orientation === '逆位' ? ' ↓' : ''}`)
            )
          ),
          r.synthesis &&
            React.createElement('div', { style: { borderTop: '1px solid #1e1e28', paddingTop: 10 } },
              React.createElement('p', { style: { color: '#888', fontSize: 12, lineHeight: 1.6, margin: 0, fontStyle: 'italic' } },
                r.synthesis.length > 150 ? r.synthesis.substring(0, 150) + '…' : r.synthesis
              )
            )
        )
      )
    )
  );
}
