'use client';

import { useState } from 'react';

interface NewsCardProps {
  title: string;
  summary: string;
  content: string;
  date: string;
  link: string;
}

export default function NewsCard({ title, summary, content, date, link }: NewsCardProps) {
  const [contentOpen, setContentOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* BAŞLIK */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">Başlık</p>
        <h2 className="text-base font-bold text-gray-100 leading-snug">{title}</h2>
        {date && (
          <p className="text-xs text-gray-500 mt-2">{date}</p>
        )}
      </div>

      {/* ÖZET */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5">Özet</p>
        <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
      </div>

      {/* İÇERİK */}
      <div className="bg-gray-800 rounded-xl p-4">
        <button
          onClick={() => setContentOpen(v => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">İçerik</p>
          <span className="text-gray-500 text-xs">{contentOpen ? 'Gizle' : 'Göster'}</span>
        </button>
        {contentOpen && (
          <div className="mt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {content}
          </div>
        )}
      </div>

      {/* LİNK */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:text-blue-400 truncate block px-1"
      >
        {link}
      </a>
    </div>
  );
}
