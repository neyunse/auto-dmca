import axios from 'axios';
import * as cheerio from 'cheerio';
import { Config } from 'database';

export const scrapeGrayMarket = async (gameName, domain, queryParam = 'q') => {
  try {
    const results = [];
    let uaConfig = await Config.findOne({ key: 'userAgent' });
    const userAgent = uaConfig ? uaConfig.value : 'KagariSoft-DMCABot/1.0 (+https://kagarisoft.com)';

    console.log(`[Scraper] Scanning ${domain} for ${gameName} (Identity: ${userAgent})`);

    // Use customized query parameter if provided
    const searchUrl = `https://${domain}/search?${queryParam}=${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': userAgent
      }
    });
    const $ = cheerio.load(response.data);

    // Look for generic product links that match the game name
    $('a').each((i, el) => {
       const href = $(el).attr('href');
       const text = $(el).text().toLowerCase();
       if (href && text.includes(gameName.toLowerCase())) {
          const fullUrl = href.startsWith('http') ? href : `https://${domain}${href}`;
          // Avoid duplicates
          if (!results.includes(fullUrl)) {
             results.push(fullUrl);
          }
       }
    });

    console.log(`[Scraper] Found ${results.length} potential listings on ${domain}`);
    return results;
  } catch (err) {
    console.error(`[Scraper] Error scanning ${domain}:`, err.message);
    return [];
  }
};
