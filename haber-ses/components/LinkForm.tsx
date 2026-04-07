'use client';

import { useState } from 'react';

interface LinkFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function LinkForm({ onSubmit, loading }: LinkFormProps) {
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://gdh.digital/haber/..."
          disabled={loading}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            İşleniyor...
          </>
        ) : (
          'İşle'
        )}
      </button>
    </form>
  );
}
