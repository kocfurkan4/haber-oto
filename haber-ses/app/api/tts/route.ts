import { NextRequest, NextResponse } from 'next/server';
import { textToSpeechBase64 } from '@/lib/tts';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let text: string;
  try {
    const body = await request.json();
    text = body?.text?.trim();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: 'Metin gerekli.' }, { status: 400 });
  }

  try {
    const audioBase64 = await textToSpeechBase64(text);
    return NextResponse.json({ audioBase64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ses oluşturulamadı.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
