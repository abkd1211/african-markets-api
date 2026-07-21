import 'dotenv/config';
const mod = await import('got-scraping');
const gs = mod.gotScraping;
const apiKey = process.env.SCRAPER_API_KEY;
console.log('SCRAPER_API_KEY len', apiKey?.length ?? 0);
const build = (u) => `http://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(u)}`;
const urls = [
  'https://afx.kwayisi.org/ngx/',
  'https://afx.kwayisi.org/ngx/?page=2',
  'https://afx.kwayisi.org/chart/ngx',
  'https://dev.kwayisi.org/apis/gse/live'
];
for (const u of urls) {
  try {
    const r = await gs.get(build(u), { timeout: { request: 30000 }, responseType: 'text' });
    console.log('URL', u, 'status', r.statusCode, 'len', r.body.length);
    console.log('HEAD', r.body.slice(0,200).replace(/\n/g,' '));
  } catch (e) {
    console.error('ERROR', u, e.message, e.name, e.code || '');
  }
}
