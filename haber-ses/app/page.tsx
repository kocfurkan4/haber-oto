'use client';

import { useState, useEffect, useRef } from 'react';
import LinkForm from '@/components/LinkForm';

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
  link: string;
  savedAt: string;
}

function formatText(r: NewsResult): string {
  return `* BAŞLIK:\n${r.title}\n\n* ÖZET:\n${r.summary}\n\n* İÇERİK:\n${r.content}\n\n* TARİH:\n${r.date}\n\n* LİNK:\n${r.link}`;
}

function Skeleton() {
  return (
    <div className="w-full flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-32 bg-gray-700 rounded" />
      <div className="h-64 bg-gray-800 rounded-xl" />
      <div className="h-12 bg-gray-800 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-11 flex-1 bg-gray-800 rounded-xl" />
        <div className="h-11 flex-1 bg-gray-800 rounded-xl" />
      </div>
    </div>
  );
}

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

  function fmt(s: number) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  if (!blobUrl) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
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
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded-full transition-colors"
      >
        {playing ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range" min={0} max={100} value={progress}
          onChange={e => {
            const a = audioRef.current;
            if (a) { a.currentTime = (Number(e.target.value) / 100) * a.duration; setProgress(Number(e.target.value)); }
          }}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-600 accent-purple-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{fmt((progress / 100) * duration)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      {blobUrl && (
        <a
          href={blobUrl}
          download="haber.mp3"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          title="Sesi İndir"
        >
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        </a>
      )}
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [audioBase64, setAudioBase64] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // localStorage'dan geçmişi yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem('haber-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Yeni haber gelince paneli doldur ve geçmişe kaydet
  useEffect(() => {
    if (!result) return;
    const formatted = formatText(result);
    setText(formatted);
    setAudioBase64(result.audioBase64 || '');

    const item: HistoryItem = {
      id: Date.now().toString(),
      title: result.title,
      text: formatted,
      audioBase64: result.audioBase64 || '',
      link: result.link,
      savedAt: new Date().toLocaleString('tr-TR'),
    };

    setHistory(prev => {
      const updated = [item, ...prev].slice(0, 20); // max 20
      try { localStorage.setItem('haber-history', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [result]);

  function loadFromHistory(item: HistoryItem) {
    setText(item.text);
    setAudioBase64(item.audioBase64);
    setShowHistory(false);
    setError(null);
  }

  function deleteFromHistory(id: string) {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id);
      try { localStorage.setItem('haber-history', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

  async function handleSubmit(url: string) {
    setLoading(true);
    setResult(null);
    setError(null);
    setText('');
    setAudioBase64('');
    setShowHistory(false);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Bir hata oluştu.'); return; }
      setResult(data);
    } catch {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Haber Ses</h1>
            <p className="text-xs text-gray-500 mt-0.5">Haberi seslendir, paylaş</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Geçmiş ({history.length})
            </button>
          )}
        </div>

        {/* Geçmiş panel */}
        {showHistory && (
          <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
            <p className="text-xs text-gray-500 px-1 mb-1">Son haberler (tıklayınca yüklenir)</p>
            {history.map(item => (
              <div key={item.id} className="flex items-start gap-2 group">
                <button
                  onClick={() => loadFromHistory(item)}
                  className="flex-1 text-left bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                >
                  <p className="text-xs text-gray-200 font-medium line-clamp-1">{item.title || '(Başlıksız)'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.savedAt}</p>
                </button>
                <button
                  onClick={() => deleteFromHistory(item.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all mt-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <LinkForm onSubmit={handleSubmit} loading={loading} />

        {/* Hata */}
        {error && (
          <div className="bg-red-900/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && <Skeleton />}

        {/* Sonuç */}
        {text && !loading && (
          <>
            {/* Düzenlenebilir tek panel */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 px-1">Düzenleyebilirsin</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={20}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-100 leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Ses oynatıcı */}
            {audioBase64 && <AudioPlayer audioBase64={audioBase64} />}

            {/* Butonlar */}
            <button
              onClick={handleCopy}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <><svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Kopyalandı!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>Metni Kopyala</>
              )}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
