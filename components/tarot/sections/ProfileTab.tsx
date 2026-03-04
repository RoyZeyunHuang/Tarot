// @ts-nocheck
'use client';
import React from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';
import { ProfilePanel } from '../ProfilePanel';

export function ProfileTab() {
  const { profile, handleClearAll } = useTarot();

  if (profile.totalReadings === 0) {
    return React.createElement(Section, { label: '✦', title: '你的塔罗档案' },
      React.createElement('div', { style: { textAlign: 'center', padding: '40px 20px', color: '#333' } },
        React.createElement('div', { style: { fontSize: 40, marginBottom: 12 } }, '🌟'),
        React.createElement('p', { style: { fontFamily: 'serif', fontSize: 14, color: '#555' } }, '档案尚未建立'),
        React.createElement('p', { style: { fontSize: 12, color: '#333' } }, '完成解读后，塔罗师将开始记住你的旅程')
      )
    );
  }

  return React.createElement(Section, { label: '✦', title: '你的塔罗档案' },
    React.createElement(ProfilePanel, { profile, onClear: handleClearAll })
  );
}
