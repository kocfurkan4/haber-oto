'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NewsResult {
  title: string;
  summary: string;
  content: string;
  date: string;
  link: string;
  audioBase64: string;
}

interface HistoryItem {
  id: string;
  title: string;
  text: string;
  audioBase64: string;
  savedAt: string;
}

function formatText(r: NewsResult): string {
  return `* BAŞLIK:\n${r.title}\n\n* ÖZET:\n${r.summary}\n\n* İÇERİK:\n${r.content}\n\n* TARİH:\n${r.date}\n\n* LİNK:\n${r.link}`;
}

// ─── Ses oynatıcı ────────────────────────────────────────────────────────────
function AudioPlayer({ audioBase64 }: { audioBase64: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioBase64) return;
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setPlaying(false);
    setProgress(0);
    return () => URL.revokeObjectURL(url);
  }, [audioBase64]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  }
  function stop() {
    const a = audioRef.current;
    if (!a) return;
    a.pause(); a.currentTime = 0; setPlaying(false); setProgress(0);
  }
  function fmt(s: number) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  if (!blobUrl) return (
    <div className="flex items-center gap-3 text-gray-500 text-sm py-2 px-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      Audio Player
      <span className="ml-auto">0:00 / 0:00</span>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audioRef}
        src={blobUrl}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a) setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center bg-green-500 hover:bg-green-400 rounded-full transition-colors flex-shrink-0">
        {playing
          ? <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          : <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
        }
      </button>
      <button onClick={stop} className="w-8 h-8 flex items-center justify-center bg-red-500/30 hover:bg-red-500/50 rounded-full transition-colors flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-red-300" fill="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
      </button>
      <div className="flex-1">
        <input
          type="range" min={0} max={100} value={progress}
          onChange={e => {
            const a = audioRef.current;
            if (a) { a.currentTime = (Number(e.target.value) / 100) * a.duration; setProgress(Number(e.target.value)); }
          }}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-600 accent-green-500 cursor-pointer"
        />
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
        {fmt((progress / 100) * duration)} / {fmt(duration)}
      </span>
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metin geçmişi (undo/redo)
  const [textHistory, setTextHistory] = useState<string[]>(['']);
  const [histIdx, setHistIdx] = useState(0);
  const text = textHistory[histIdx] ?? '';

  // Ses
  const [audioBase64, setAudioBase64] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Geçmiş
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('haber-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch { /**/ }
  }, []);

  // AudioBase64 → blob URL
  useEffect(() => {
    if (!audioBase64) { setAudioBlobUrl(null); return; }
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    setAudioBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBase64]);

  function setText(val: string) {
    setTextHistory(prev => {
      const cut = prev.slice(0, histIdx + 1);
      return [...cut, val].slice(-50); // max 50 undo
    });
    setHistIdx(prev => Math.min(prev + 1, 49));
  }
  function undo() { if (histIdx > 0) setHistIdx(h => h - 1); }
  function redo() { if (histIdx < textHistory.length - 1) setHistIdx(h => h + 1); }

  const saveToHistory = useCallback((title: string, t: string, audio: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      title,
      text: t,
      audioBase64: audio,
      savedAt: new Date().toLocaleString('tr-TR'),
    };
    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 20);
      try { localStorage.setItem('haber-history', JSON.stringify(updated)); } catch { /**/ }
      return updated;
    });
  }, []);

  async function handleProcess(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setAudioBase64('');
    setAudioError('');
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Bir hata oluştu.'); return; }
      const result = data as NewsResult;
      const formatted = formatText(result);
      setTextHistory([formatted]);
      setHistIdx(0);
      if (result.audioBase64) setAudioBase64(result.audioBase64);
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAudio() {
    // ÖZET bölümünü bul, yoksa tüm metni kullan
    const match = text.match(/\* ÖZET:\s*\n([\s\S]*?)(?=\n\*|$)/);
    const ttsText = match ? match[1].trim() : text.trim();
    if (!ttsText) return;

    setAudioLoading(true);
    setAudioError('');
    setAudioBase64('');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText }),
      });
      const data = await res.json();
      if (!res.ok) { setAudioError(data.error || 'Ses oluşturulamadı.'); return; }
      setAudioBase64(data.audioBase64);
    } catch {
      setAudioError('Ses servisi bağlanamadı.');
    } finally {
      setAudioLoading(false);
    }
  }

  function handleSave() {
    const titleMatch = text.match(/\* BAŞLIK:\s*\n(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : '(Başlıksız)';
    saveToHistory(title, text, audioBase64);
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadFromHistory(item: HistoryItem) {
    setTextHistory([item.text]);
    setHistIdx(0);
    setAudioBase64(item.audioBase64 || '');
    setShowHistory(false);
    setError(null);
  }

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasText = text.trim().length > 0;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-4 flex-1">

        {/* Header + URL formu */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Haber Ses</h1>
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-200 bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Geçmiş ({history.length})
              </button>
            )}
          </div>

          {showHistory && (
            <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-1.5 max-h-52 overflow-y-auto">
              {history.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button onClick={() => loadFromHistory(item)} className="flex-1 text-left bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors">
                    <p className="text-xs text-gray-200 font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.savedAt}</p>
                  </button>
                  <button onClick={() => setHistory(prev => { const u = prev.filter(h => h.id !== item.id); try { localStorage.setItem('haber-history', JSON.stringify(u)); } catch { /**/ } return u; })}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleProcess} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://gdh.digital/haber/..."
              disabled={loading}
              required
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />İşleniyor</>
                : 'İşle'
              }
            </button>
          </form>
        </div>

        {error && <div className="bg-red-900/40 border border-red-800 rounded-xl p-3 text-sm text-red-300">{error}</div>}

        {loading && (
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-96 bg-gray-800 rounded-xl" />
            <div className="h-10 bg-gray-800 rounded-xl" />
          </div>
        )}

        {hasText && !loading && (
          <>
            {/* Metin paneli */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={18}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-100 leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              spellCheck={false}
            />

            {/* İstatistikler */}
            <div className="flex justify-center gap-8 py-1">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{charCount.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-gray-500">Toplam Karakter</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{wordCount.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-gray-500">Toplam Kelime</p>
              </div>
            </div>

            {/* Aksiyon butonları */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={undo} disabled={histIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-600/80 hover:bg-yellow-500/80 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                Geri Al
              </button>
              <button onClick={redo} disabled={histIdx >= textHistory.length - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-500/80 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                İleri Al
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Kaydet
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-colors">
                {copied
                  ? <><svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Kopyalandı!</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Kopyala</>
                }
              </button>
              <button onClick={handleGenerateAudio} disabled={audioLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {audioLoading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Oluşturuluyor...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 9.5v5m0 0a3 3 0 100-6 3 3 0 000 6zm6.364-8.364a9 9 0 010 12.728" /></svg>Ses Oluştur</>
                }
              </button>
              {audioBlobUrl && (
                <a href={audioBlobUrl} download="haber.mp3"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                  Ses Kopyala/İndir
                </a>
              )}
            </div>

            {audioError && <p className="text-xs text-red-400 text-center">{audioError}</p>}

            {/* Audio player */}
            <div className="border-t border-gray-800 pt-3">
              <AudioPlayer audioBase64={audioBase64} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
