import { NextRequest, NextResponse } from 'next/server';
import { scrapeArticle } from '@/lib/scraper';
import { formatArticle } from '@/lib/zai';

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

  // 2. Groq ile formatla
  let formatted;
  try {
    formatted = await formatArticle(scraped);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Metin formatlanamadı.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    title: formatted.title,
    summary: formatted.summary,
    content: formatted.content,
    date: formatted.date,
    link: formatted.link,
    audioBase64: '',
  });
}
