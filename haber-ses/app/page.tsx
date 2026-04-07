'use client';

import { useState } from 'react';
import LinkForm from '@/components/LinkForm';
import NewsCard from '@/components/NewsCard';
import AudioPlayer from '@/components/AudioPlayer';
import ShareButtons from '@/components/ShareButtons';

interface NewsResult {
  title: string;
  summary: string;
  content: string;
  date: string;
  link: string;
  audioBase64: string;
}

function Skeleton() {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="h-3 w-16 bg-gray-700 rounded mb-3" />
        <div className="h-5 bg-gray-700 rounded mb-2" />
        <div className="h-5 w-3/4 bg-gray-700 rounded" />
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="h-3 w-12 bg-gray-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded" />
          <div className="h-4 w-5/6 bg-gray-700 rounded" />
          <div className="h-4 bg-gray-700 rounded" />
          <div className="h-4 w-4/6 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="h-10 bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(url: string) {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu.');
        return;
      }

      setResult(data);
    } catch {
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100">Haber Ses</h1>
          <p className="text-sm text-gray-500 mt-1">Haberi seslendir, paylaş</p>
        </div>

        {/* Form */}
        <LinkForm onSubmit={handleSubmit} loading={loading} />

        {/* Hata */}
        {error && (
          <div className="bg-red-900/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <Skeleton />}

        {/* Sonuç */}
        {result && !loading && (
          <>
            <NewsCard
              title={result.title}
              summary={result.summary}
              content={result.content}
              date={result.date}
              link={result.link}
            />

            {result.audioBase64 && (
              <AudioPlayer audioBase64={result.audioBase64} />
            )}

            <ShareButtons
              title={result.title}
              summary={result.summary}
              content={result.content}
              date={result.date}
              link={result.link}
              audioBase64={result.audioBase64}
            />
          </>
        )}
      </div>
    </main>
  );
}
