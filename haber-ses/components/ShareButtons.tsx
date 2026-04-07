'use client';

import { useEffect, useState } from 'react';

interface ShareButtonsProps {
  title: string;
  summary: string;
  content: string;
  date: string;
  link: string;
  audioBase64: string;
}

export default function ShareButtons({ title, summary, content, date, link, audioBase64 }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioBase64) return;
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBase64]);

  function getFullText(): string {
    return [
      `* BAŞLIK:\n${title}`,
      `* ÖZET:\n${summary}`,
      `* İÇERİK:\n${content}`,
      date ? `* TARİH:\n${date}` : '',
      `* LİNK:\n${link}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getFullText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = getFullText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleWhatsApp() {
    const text = `* BAŞLIK:\n${title}\n\n* ÖZET:\n${summary}\n\n* LİNK:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        onClick={handleCopy}
        className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 font-medium text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Kopyalandı!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Metni Kopyala
          </>
        )}
      </button>

      {blobUrl && (
        <a
          href={blobUrl}
          download="haber.mp3"
          className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 font-medium text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Sesi İndir
        </a>
      )}

      <button
        onClick={handleWhatsApp}
        className="w-full bg-green-700 hover:bg-green-600 active:bg-green-800 text-white font-medium text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.563 4.14 1.535 5.87L0 24l6.334-1.508A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.007-1.359l-.36-.213-3.76.896.955-3.653-.235-.375A9.895 9.895 0 012.1 12c0-5.47 4.43-9.894 9.9-9.894s9.9 4.424 9.9 9.894-4.43 9.894-9.9 9.894z" />
        </svg>
        {"WhatsApp'ta Paylaş"}
      </button>
    </div>
  );
}
