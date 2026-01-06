import * as cheerio from 'cheerio';

const SIGNS = {
  koc: { name: 'Koç', elle: 'koc', mahmure: 'koc' },
  boga: { name: 'Boğa', elle: 'boga', mahmure: 'boga' },
  ikizler: { name: 'İkizler', elle: 'ikizler', mahmure: 'ikizler' },
  yengec: { name: 'Yengeç', elle: 'yengec', mahmure: 'yengec' },
  aslan: { name: 'Aslan', elle: 'aslan', mahmure: 'aslan' },
  basak: { name: 'Başak', elle: 'basak', mahmure: 'basak' },
  terazi: { name: 'Terazi', elle: 'terazi', mahmure: 'terazi' },
  akrep: { name: 'Akrep', elle: 'akrep', mahmure: 'akrep' },
  yay: { name: 'Yay', elle: 'yay', mahmure: 'yay' },
  oglak: { name: 'Oğlak', elle: 'oglak', mahmure: 'oglak' },
  kova: { name: 'Kova', elle: 'kova', mahmure: 'kova' },
  balik: { name: 'Balık', elle: 'balik', mahmure: 'balik' },
};

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function scrapeElleHoroscope(signKey: string) {
  try {
    const url = `https://www.elle.com.tr/astroloji/${signKey}-gunluk-burc-yorumu`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Elle fetch failed: ${res.status}`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Elle structure usually puts text in a specific container
    // Trying common selectors based on typical publishing layouts
    let text = $('.article-body').text().trim() || 
               $('.standard-article-body').text().trim() ||
               $('article p').first().text().trim();
               
    if (text) return text;
    throw new Error('Content not found in Elle selectors');
  } catch (error) {
    console.error(`Elle scraper error for ${signKey}:`, error);
    return null;
  }
}

export async function scrapeMahmureHoroscope(signKey: string) {
  try {
    const url = `https://www.mahmure.com/astroloji/burclar/${signKey}/gunluk-yorum`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Mahmure fetch failed: ${res.status}`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Mahmure selects typical content areas
    let text = $('.hurriyet-detail-content').text().trim() || 
               $('.horoscope-detail-content').text().trim() ||
               $('.adv-text-content').text().trim();
    
    // Clean up
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text) return text;
    throw new Error('Content not found in Mahmure selectors');
  } catch (error) {
    console.error(`Mahmure scraper error for ${signKey}:`, error);
    return null;
  }
}

export async function getDailyHoroscope(signKey: string) {
  // Try Elle first, then Mahmure
  const elleText = await scrapeElleHoroscope(signKey);
  if (elleText && elleText.length > 50) return elleText;
  
  const mahmureText = await scrapeMahmureHoroscope(signKey);
  if (mahmureText && mahmureText.length > 50) return mahmureText;
  
  return "Bugün için yorum bulunamadı. Lütfen daha sonra tekrar deneyiniz.";
}

export const HOROSCOPE_SIGNS = Object.keys(SIGNS);
