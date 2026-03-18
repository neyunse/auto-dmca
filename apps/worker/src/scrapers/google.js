import axios from 'axios';
import * as cheerio from 'cheerio';
import { Config } from 'database';
import { getJson } from "serpapi";

export const scrapeGoogleDork = async (query) => {
  try {
    const results = [];
    const uaConfig = await Config.findOne({ key: 'userAgent' });
    const userAgent = uaConfig ? uaConfig.value : 'KagariSoft-DMCABot/1.0 (+https://kagarisoft.com)';

    let apiKeyConfig = await Config.findOne({ key: 'serpapiKey' });

    // User provided a specific key in their message, let's ensure it's used if none exists
    if (!apiKeyConfig || !apiKeyConfig.value) {
      apiKeyConfig = await Config.findOneAndUpdate(
        { key: 'serpapiKey' },
        { value: providedKey },
        { upsert: true, new: true }
      );
    }
    const serpapiKey = apiKeyConfig ? apiKeyConfig.value : null;

    if (serpapiKey) {
      // 1. Check Limits
      const hourHits = await Config.findOne({ key: 'serpapiHitsHour' });
      const monthHits = await Config.findOne({ key: 'serpapiHitsMonth' });

      const currentHour = parseInt(hourHits?.value || "0", 10);
      const currentMonth = parseInt(monthHits?.value || "0", 10);

      const HOUR_LIMIT = 45;
      const MONTH_LIMIT = 240;

      if (currentHour < HOUR_LIMIT && currentMonth < MONTH_LIMIT) {
        console.log(`[Scraper] [SerpApi] Capacity: ${currentHour}/${HOUR_LIMIT} (hr). Executing Global Scan...`);

        try {
          const hlConfig = await Config.findOne({ key: 'hl' });
          const glConfig = await Config.findOne({ key: 'gl' });
          const locConfig = await Config.findOne({ key: 'location' });

          const hl = hlConfig?.value || "";
          const gl = glConfig?.value || "";
          const location = locConfig?.value || "";

          const json = await getJson({
            engine: "google_light",
            q: query,
            google_domain: "google.com",
            location: location || undefined,
            hl: hl || undefined,
            gl: gl || undefined,
            api_key: serpapiKey,
            nfpr: 1
          });

          // 2. Increment Counters
          await Config.findOneAndUpdate({ key: 'serpapiHitsHour' }, { value: (currentHour + 1).toString() }, { upsert: true });
          await Config.findOneAndUpdate({ key: 'serpapiHitsMonth' }, { value: (currentMonth + 1).toString() }, { upsert: true });

          // 3. Focused Extraction (Organic results only)
          if (json.organic_results) {
            json.organic_results.forEach(res => {
              if (res.link) results.push(res.link);
            });
          }

          console.log(`[Scraper] SerpApi SDK Global Scan: Captured ${results.length} organic vectors.`);
          return results;
        } catch (apiErr) {
          console.error(`[Scraper] SerpApi Global Scan error: ${apiErr.message}. Falling back...`);
        }
      } else {
        console.log(`[Scraper] Global Quota Threshold Reached. Shifting to ZeroTrace Fallback.`);
      }
    } else {
      console.log(`[Scraper] Quota Threshold Reached. Shifting to ZeroTrace Fallback.`);
    }

    // Fallback via DuckDuckGo
    console.log(`[Scraper] Executing Generic Scrape Strategy for: ${query}`);
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': userAgent }
    });
    const $ = cheerio.load(response.data);

    $('.result__url').each((i, el) => {
      const url = $(el).attr('href');
      if (url && !url.includes('duckduckgo.com')) {
        const cleanUrl = url.split('uddg=')[1]?.split('&')[0];
        results.push(cleanUrl ? decodeURIComponent(cleanUrl) : url);
      }
    });

    return results;
  } catch (err) {
    console.error(`[Scraper] Error scraping Dork for ${query}:`, err.message);
    return [];
  }
};
