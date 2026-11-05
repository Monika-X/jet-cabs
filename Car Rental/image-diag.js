// Image diagnostic v2: scrolls pages to trigger lazy-loaded images, then
// reports genuinely broken images + any 4xx/5xx responses.
const { chromium } = require('playwright');

const BASE = 'http://localhost:5000';
const PAGES = ['index.html', 'cars.html', 'booking.html', 'admin-dashboard.html', 'about.html', 'services.html'];

(async () => {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const badResponses = [];
  page.on('response', res => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });
  page.on('requestfailed', req => badResponses.push(`FAILED ${req.url()} -> ${req.failure()?.errorText}`));

  for (const p of PAGES) {
    badResponses.length = 0;
    try {
      await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle', timeout: 30000 });

      // Scroll through the whole page so lazy images start loading
      await page.evaluate(async () => {
        const step = 600;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 80));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(2500);

      const info = await page.evaluate(() => {
        const imgs = Array.from(document.images);
        const broken = imgs.filter(i => !i.complete || i.naturalWidth === 0);
        return {
          total: imgs.length,
          broken: broken.map(i => ({
            src: (i.currentSrc || i.src || '').slice(0, 120),
            loading: i.getAttribute('loading'),
            complete: i.complete,
            w: i.naturalWidth
          }))
        };
      });

      console.log(`\n### ${p} — ${info.total} imgs, ${info.broken.length} broken`);
      info.broken.slice(0, 10).forEach(b => console.log(`  BROKEN (complete=${b.complete}, w=${b.w}, loading=${b.loading}): ${b.src}`));
      badResponses.slice(0, 10).forEach(f => console.log('  ' + f));
    } catch (e) {
      console.log(`\n### ${p} — NAV FAIL: ${e.message.split('\n')[0]}`);
    }
  }

  await browser.close();
})();
