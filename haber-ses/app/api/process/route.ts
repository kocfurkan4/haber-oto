import { NextRequest, NextResponse } from 'next/server';
import { scrapeArticle } from '@/lib/scraper';
import { formatArticle } from '@/lib/zai';
import { textToSpeechBase64 } from '@/lib/elevenlabs';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let url: string;

  try {
    const body = await request.json();
    url = body?.url?.trim();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli.' }, { status: 400 });
  }

  if (!/^https?:\/\/.+/.test(url)) {
    return NextResponse.json({ error: 'Geçerli bir URL girin.' }, { status: 400 });
  }

  // 1. Haber içeriğini çek
  let scraped;
  try {
    scraped = await scrapeArticle(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Haber çekilemedi.';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // 2. Z.ai ile formatla
  let formatted;
  try {
    formatted = await formatArticle(scraped);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Metin formatlanamadı.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 3. ElevenLabs ile seslendir (sadece ÖZET)
  let audioBase64 = '';
  if (formatted.summary && process.env.ELEVENLABS_API_KEY) {
    try {
      audioBase64 = await textToSpeechBase64(formatted.summary);
    } catch (err) {
      console.error('ElevenLabs hatası:', err);
      // Ses üretilemese de metin döndür
    }
  }

  return NextResponse.json({
    title: formatted.title,
    summary: formatted.summary,
    content: formatted.content,
    date: formatted.date,
    link: formatted.link,
    audioBase64,
  });
}
