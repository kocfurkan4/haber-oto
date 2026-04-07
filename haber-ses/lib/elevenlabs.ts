import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function textToSpeechBase64(text: string): Promise<string> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'Q2IX97JeHBY3vNGzgM5s';
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5';

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId,
    outputFormat: 'mp3_44100_128',
  });

  const chunks: Uint8Array[] = [];
  const reader = (audioStream as unknown as ReadableStream<Uint8Array>).getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(merged).toString('base64');
}
