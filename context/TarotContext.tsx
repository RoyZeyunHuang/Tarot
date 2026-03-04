// @ts-nocheck
'use client';
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import {
  PROFILE_KEY, READINGS_KEY, MAX_READINGS, defaultProfile,
  CATEGORIES, SPREADS,
} from '../lib/tarotData';
import {
  loadStorage, saveStorage,
  buildShuffledDeck, detectPatterns, updateProfile,
  getRelevantHistory, buildSmartPrompt,
  extractStreamingField, tryParseNextObj,
} from '../lib/tarotUtils';

// ─── Context shape ────────────────────────────────────────────────────────────
const TarotContext = createContext(null);

export function useTarot() {
  const ctx = useContext(TarotContext);
  if (!ctx) throw new Error('useTarot must be used inside TarotProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TarotProvider({ children }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion]               = useState('');
  const [category, setCategory]               = useState(null);
  const [spread, setSpread]                   = useState(null);
  const [phase, setPhase]                     = useState('idle');
  const [deckCards, setDeckCards]             = useState([]);
  const [drawnCards, setDrawnCards]           = useState([]);
  const [revealedIdx, setRevealedIdx]         = useState([]);
  const [summary, setSummary]                 = useState(null);
  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [summaryError, setSummaryError]       = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState([]);
  const [tab, setTab]                         = useState('reading');
  const [profile, setProfile]                 = useState(defaultProfile);
  const [readings, setReadings]               = useState([]);
  const [storageReady, setStorageReady]       = useState(false);
  const [recSuggestion, setRecSuggestion]     = useState(null);
  const [recLoading, setRecLoading]           = useState(false);
  const [loadingRest, setLoadingRest]         = useState(false);
  const [streamingText, setStreamingText]     = useState('');
  const [questionSubmitted, setQuestionSubmitted] = useState(false);

  const summaryRef       = useRef(null);
  const spreadSectionRef = useRef(null);
  // Prevents triggering generateSummary more than once per reading
  const triggeredGenRef  = useRef(false);

  // ── Load from storage ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const p = await loadStorage(PROFILE_KEY, defaultProfile);
      const r = await loadStorage(READINGS_KEY, []);
      setProfile(p);
      setReadings(r);
      setStorageReady(true);
    })();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const catLabel    = category ? (CATEGORIES.find((c) => c.id === category)?.label ?? '') : '';
  const fullQuestion = category ? `[${catLabel}] ${question}` : question;
  const canStart    = !!(question.trim() && spread);
  const allRevealed = !!(spread && revealedIdx.length > 0 && revealedIdx.length === spread.count);
  const catSpreads  = category ? SPREADS[category] : [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleConfirmQuestion(questionOverride?: string) {
    const q = (questionOverride ?? question).trim();
    if (recLoading || q.length < 1) return;
    setQuestionSubmitted(true);
    setRecLoading(true);
    try {
      const res  = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
      const data = await res.json();
      if (data.catId && data.spreadId) {
        const catSpreadsData = SPREADS[data.catId] || [];
        let sp = catSpreadsData.find((s) => s.id === data.spreadId);
        if (!sp) sp = catSpreadsData.find((s) => data.spreadId.includes(s.id) || s.id.includes(data.spreadId));
        if (!sp && catSpreadsData.length > 0) sp = catSpreadsData[0];
        setRecSuggestion(data);
        setCategory(data.catId);
        if (sp) setSpread(sp);
        setTimeout(() => { if (spreadSectionRef.current) spreadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
      }
    } catch (_) {}
    setRecLoading(false);
  }

  function handleShuffle() {
    if (!canStart) return;
    setPhase('shuffling');
    setTimeout(() => { setDeckCards(buildShuffledDeck()); setPhase('drawing'); }, 2000);
  }

  function handlePickCard(idx) {
    if (drawnCards.length >= spread.count) return;
    const card = deckCards[idx];
    setDeckCards((prev) => prev.map((c, i) => i === idx ? { ...c, picked: true } : c));
    const nd = drawnCards.concat([card]);
    setDrawnCards(nd);
    if (nd.length === spread.count) setTimeout(() => setPhase('placed'), 400);
  }

  // Use functional update so concurrent calls (handleRevealAll) never overwrite each other
  function handleReveal(i) {
    setRevealedIdx((prev) => {
      if (prev.indexOf(i) >= 0) return prev; // already revealed, no change
      return prev.concat([i]);
    });
  }

  // Trigger AI generation once when all cards are revealed
  useEffect(() => {
    if (!spread || revealedIdx.length !== spread.count || revealedIdx.length === 0) return;
    if (triggeredGenRef.current) return;
    triggeredGenRef.current = true;
    const pats = detectPatterns(drawnCards, readings, profile);
    setDetectedPatterns(pats);
    generateSummary(drawnCards, pats);
    setTimeout(() => { if (summaryRef.current) summaryRef.current.scrollIntoView({ behavior: 'smooth' }); }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedIdx.length]);

  function handleRevealAll() {
    drawnCards.forEach((_, i) => {
      setTimeout(() => handleReveal(i), i * 400);
    });
  }

  async function generateSummary(cards, pats) {
    setLoadingSummary(true); setLoadingRest(false); setSummaryError(false); setSummary(null); setStreamingText('');
    const cardsList    = cards.map((c, i) => `${spread.positions[i]}：${c.name}（${c.orientation}）`).join('，');
    const relevantHist = getRelevantHistory(readings, category);
    const smartPrompt  = buildSmartPrompt(category, profile, relevantHist, pats || detectedPatterns);
    const partial: any = {};
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 3500, stream: true, system: smartPrompt, messages: [{ role: 'user', content: `问卜者的问题：${fullQuestion}\n牌阵：${spread.label}\n抽到的牌：${cardsList}` }] }),
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = ''; let gotFirst = false; let gotSecond = false;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buf += dec.decode(chunk.value, { stream: true });
        if (gotFirst && !gotSecond) {
          const pt = extractStreamingField(buf, 'synthesis');
          if (pt) setStreamingText(pt);
        }
        let drained = true;
        while (drained) {
          drained = false;
          const result = tryParseNextObj(buf);
          if (result) {
            drained = true;
            Object.assign(partial, result.obj);
            buf = result.rest;
            if (!gotFirst) {
              gotFirst = true;
              setSummary({ ...partial });
              setLoadingSummary(false); setLoadingRest(true);
              setTimeout(() => { if (summaryRef.current) summaryRef.current.scrollIntoView({ behavior: 'smooth' }); }, 100);
            } else if (!gotSecond) {
              gotSecond = true;
              setStreamingText('');
              setSummary({ ...partial });
            } else {
              setSummary({ ...partial });
              setLoadingRest(false);
            }
          }
        }
      }
      let flush = true;
      while (flush) { flush = false; const fr = tryParseNextObj(buf); if (fr) { flush = true; Object.assign(partial, fr.obj); buf = fr.rest; } }
      setSummary({ ...partial });
      setLoadingSummary(false); setLoadingRest(false); setStreamingText('');
      const newReading = {
        id: Date.now(), date: new Date().toLocaleDateString('zh-CN'), question: fullQuestion,
        category, spread: spread.label, spreadId: spread.id,
        cards: cards.map((c, i) => ({ ...c, position: spread.positions[i] })),
        synthesis: partial.synthesis || '', patterns: pats || [],
      };
      const updatedReadings = [newReading, ...readings].slice(0, MAX_READINGS);
      setReadings(updatedReadings); await saveStorage(READINGS_KEY, updatedReadings);
      const updatedProfile = updateProfile(profile, newReading, partial.profileUpdate);
      setProfile(updatedProfile); await saveStorage(PROFILE_KEY, updatedProfile);
    } catch (e) {
      console.error('generateSummary failed:', e);
      setSummaryError(true); setLoadingSummary(false); setLoadingRest(false); setStreamingText('');
    }
  }

  function handleReset(prefillQuestion?: string) {
    triggeredGenRef.current = false;
    setQuestionSubmitted(false);
    setQuestion(prefillQuestion || '');
    setCategory(null); setSpread(null); setRecSuggestion(null); setPhase('idle');
    setDeckCards([]); setDrawnCards([]); setRevealedIdx([]);
    setSummary(null); setSummaryError(false); setDetectedPatterns([]); setLoadingRest(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  async function handleClearAll() {
    if (!confirm('确定要清除所有塔罗数据吗？')) return;
    setProfile(defaultProfile); setReadings([]);
    await saveStorage(PROFILE_KEY, defaultProfile);
    await saveStorage(READINGS_KEY, []);
  }

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    // state
    question, setQuestion,
    category, setCategory,
    spread, setSpread,
    phase,
    deckCards,
    drawnCards,
    revealedIdx,
    summary,
    loadingSummary,
    summaryError,
    detectedPatterns,
    tab, setTab,
    profile,
    readings,
    storageReady,
    recSuggestion, setRecSuggestion,
    recLoading,
    loadingRest,
    streamingText,
    questionSubmitted, setQuestionSubmitted,
    // refs
    summaryRef,
    spreadSectionRef,
    // derived
    catLabel, fullQuestion, canStart, allRevealed, catSpreads,
    // handlers
    handleConfirmQuestion,
    handleShuffle,
    handlePickCard,
    handleReveal,
    handleRevealAll,
    generateSummary,
    handleReset,
    handleClearAll,
  };

  return React.createElement(TarotContext.Provider, { value }, children);
}
