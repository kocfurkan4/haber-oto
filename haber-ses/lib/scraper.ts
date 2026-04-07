import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedArticle {
  title: string;
  content: string;
  date: string;
  url: string;
}

const SITE_CONFIGS: Record<string, {
  title: string[];
  content: string[];
  date: string[];
}> = {
  'gdh.digital': {
    title: ['h1.entry-title', 'h1.post-title', 'h1'],
    content: ['.entry-content p', '.post-content p', 'article p'],
    date: ['.entry-date', '.post-date', 'time', '.date'],
  },
  'defenceturk.net': {
    title: ['h1.post-title', 'h1.entry-title', 'h1'],
    content: ['.post-content p', '.entry-content p', 'article p'],
    date: ['.post-date', '.entry-date', 'time', '.date'],
  },
  'savunmasanayist.com': {
    title: ['h1.single-title', 'h1'],
    content: ['.single-content p', 'article p', '.post-body p'],
    date: ['time', '.post-meta time', '.date', '.entry-date'],
  },
  'm5dergi.com': {
    title: ['h1.entry-title', 'h1'],
    content: ['.entry-content p', '.content p', 'article p'],
    date: ['.entry-date', '.date', 'time'],
  },
};

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function extractWithSelectors($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const el = $(selector);
    if (el.length > 0) {
      if (selector.includes(' p')) {
        const texts = el.map((_, e) => $(e).text().trim()).get().filter(t => t.length > 20);
        if (texts.length > 0) return texts.join('\n\n');
      } else {
        const text = el.first().text().trim();
        if (text) return text;
      }
    }
  }
  return '';
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);

  // Script, style, nav, footer gibi gereksiz elementleri temizle
  $('script, style, nav, footer, header, aside, .advertisement, .ads, iframe, noscript').remove();

  const hostname = getHostname(url);
  const config = SITE_CONFIGS[hostname];

  let title = '';
  let content = '';
  let date = '';

  if (config) {
    title = extractWithSelectors($, config.title);
    content = extractWithSelectors($, config.content);
    date = extractWithSelectors($, config.date);
  }

  // Fallback: genel seçiciler
  if (!title) {
    title = $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim() ||
            '';
  }

  if (!content) {
    const candidates = ['article p', 'main p', '.content p', '.post p', '.article-body p', 'p'];
    for (const selector of candidates) {
      const texts = $(selector).map((_, e) => $(e).text().trim()).get().filter(t => t.length > 30);
      if (texts.length >= 2) {
        content = texts.join('\n\n');
        break;
      }
    }
  }

  if (!date) {
    date = $('time').first().attr('datetime') ||
           $('time').first().text().trim() ||
           $('meta[property="article:published_time"]').attr('content') ||
           '';
  }

  if (!title && !content) {
    throw new Error('Haber içeriği çekilemedi. Lütfen farklı bir URL deneyin.');
  }

  return {
    title: title.trim(),
    content: content.trim(),
    date: date.trim(),
    url,
  };
}
