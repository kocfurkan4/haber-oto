import OpenAI from 'openai';
import { ScrapedArticle } from './scraper';

export interface FormattedArticle {
  title: string;
  summary: string;
  content: string;
  date: string;
  link: string;
}

const client = new OpenAI({
  baseURL: 'https://api.z.ai/api/paas/v4',
  apiKey: process.env.ZAI_API_KEY,
});

const SYSTEM_PROMPT = `Sen bir haber editörüsün. Verilen haber metnini belirtilen formatta düzenleyeceksin.`;

function buildUserPrompt(article: ScrapedArticle): string {
  return `Aşağıdaki haber metnini şu formatta düzenle:

* BAŞLIK:
[Haberin başlığı]

* ÖZET:
[Haberin 800 karakterlik özeti. Türkçe, akıcı, haber dili. Kısaltma kullanma, rakamları yaz. Madde işareti, tire, parantez kullanma.]

* İÇERİK:
[Haberin tam içeriği, paragraflar halinde, haber dili]

* TARİH:
[Yayın tarihi]

* LİNK:
[Kaynak URL]

ÖNEMLİ: ÖZET sesli okunacak. Bu yüzden:
- Kısaltmaları aç (mm → milimetre, km → kilometre)
- Rakamları harf olarak yaz (300 → üç yüz)
- Liste/madde kullanma, akıcı cümle kur
- Parantez, tire kullanma

---

BAŞLIK: ${article.title}

TARİH: ${article.date || 'Belirtilmemiş'}

URL: ${article.url}

İÇERİK:
${article.content}`;
}

function parseSection(text: string, sectionName: string, nextSectionName?: string): string {
  const startMarker = `* ${sectionName}:`;
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return '';

  const contentStart = startIdx + startMarker.length;

  let endIdx = text.length;
  if (nextSectionName) {
    const nextMarker = `* ${nextSectionName}:`;
    const nextIdx = text.indexOf(nextMarker, contentStart);
    if (nextIdx !== -1) endIdx = nextIdx;
  }

  return text.slice(contentStart, endIdx).trim();
}

export async function formatArticle(article: ScrapedArticle): Promise<FormattedArticle> {
  const response = await client.chat.completions.create({
    model: 'glm-4-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(article) },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content || '';

  const title = parseSection(text, 'BAŞLIK', 'ÖZET');
  const summary = parseSection(text, 'ÖZET', 'İÇERİK');
  const content = parseSection(text, 'İÇERİK', 'TARİH');
  const date = parseSection(text, 'TARİH', 'LİNK');
  const link = parseSection(text, 'LİNK');

  return {
    title: title || article.title,
    summary: summary || '',
    content: content || article.content,
    date: date || article.date,
    link: link || article.url,
  };
}
