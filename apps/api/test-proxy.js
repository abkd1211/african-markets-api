const cheerio = require('cheerio');
import('got-scraping').then(m => m.gotScraping.get('https://afx-kwayisi-org.translate.goog/ngx/?_x_tr_sl=en&_x_tr_tl=en&_x_tr_hl=en-US&_x_tr_pto=wapp')).then(res => {
  const $ = cheerio.load(res.body);
  console.log('Has iframe:', $('iframe').length > 0);
  console.log('Length of table:', $('div.t table tbody tr').length);
}).catch(console.error);
