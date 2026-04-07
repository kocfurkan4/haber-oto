export async function textToSpeechBase64(text: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY ayarlanmamış.');

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-E' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google TTS hatası: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.audioContent as string; // Google zaten base64 döndürüyor
}
