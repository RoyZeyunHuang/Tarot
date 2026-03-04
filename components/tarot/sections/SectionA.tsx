// @ts-nocheck
'use client';
import React, { useRef, useEffect } from 'react';
import { useTarot } from '../../../context/TarotContext';
import { Section } from '../../ui/TarotUI';

export function SectionA() {
  const ctx = useTarot();
  const textareaRef = useRef(null);

  // Sync DOM when question is reset externally (e.g. deep-question prefill)
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== ctx.question) {
      textareaRef.current.value = ctx.question;
    }
  }, [ctx.question]);

  function handleClick() {
    const val = (textareaRef.current ? textareaRef.current.value : '').trim() || '占卜今日能量';
    ctx.setQuestion(val);
    ctx.handleConfirmQuestion(val);
  }

  const spinning = ctx.recLoading;

  return React.createElement(Section, { label: 'A', title: '设定你的问题' },
    React.createElement('style', null, `
      @keyframes breatheActive {
        0%,100% { box-shadow: 0 0 10px #d4af3750, 0 0 24px #d4af3730; border-color: #d4af37aa; }
        50%      { box-shadow: 0 0 20px #d4af3790, 0 0 40px #d4af3760; border-color: #d4af37; }
      }
      @keyframes spin1 { to { transform: rotate(360deg); } }
    `),
    React.createElement('textarea', {
      ref: textareaRef,
      defaultValue: ctx.question,
      onInput: function(e) { ctx.setQuestion(e.target.value); },
      placeholder: '占卜今日能量',
      'data-gramm': 'false',
      'data-gramm_editor': 'false',
      'data-enable-grammarly': 'false',
      spellCheck: false,
      style: {
        width: '100%', minHeight: 80, background: '#1a1a22',
        border: '1px solid #2a2a35', borderRadius: 10,
        color: '#e8e8e0', padding: '12px', fontSize: 14,
        resize: 'vertical', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
      },
    }),
    React.createElement('div', { style: { textAlign: 'right', marginTop: 12 } },
      React.createElement('button', {
        type: 'button',
        onClick: handleClick,
        style: {
          padding: '9px 26px',
          borderRadius: 22,
          border: '1px solid #d4af3799',
          background: 'transparent',
          color: '#d4af37',
          fontSize: 13,
          fontFamily: 'serif',
          letterSpacing: 2,
          cursor: 'pointer',
          animation: spinning ? 'none' : 'breatheActive 2s ease-in-out infinite',
          opacity: spinning ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        },
      },
        spinning
          ? React.createElement('span', { style: { display: 'inline-block', animation: 'spin1 1s linear infinite' } }, '◌')
          : null,
        spinning ? '感应中…' : '问卜 ✦'
      )
    )
  );
}
