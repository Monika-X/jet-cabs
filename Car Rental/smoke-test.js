const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3456;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not Found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PAGES = [
  'index.html', 'about.html', 'cars.html', 'car-details.html', 'booking.html',
  'services.html', 'contact.html', 'login.html', 'register.html', 'forgot-password.html',
  'user-dashboard.html', 'admin-dashboard.html', 'faq.html', 'privacy-policy.html',
  'terms-and-conditions.html', '404.html'
];

(async () => {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const failures = [];
  page.on('console', msg => {
    if (msg.type() === 'error') failures.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => failures.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => failures.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));

  for (const p of PAGES) {
    const url = `http://localhost:${PORT}/${p}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600);
      const title = await page.title();
      const links = await page.locator('a').count();
      const imgs = await page.locator('img').count();
      let brokenImgs = 0;
      for (let i = 0; i < imgs; i++) {
        const img = page.locator('img').nth(i);
        const ok = await img.evaluate(el => el.complete && el.naturalWidth > 0).catch(() => false);
        if (!ok) brokenImgs++;
      }
      const status = brokenImgs ? `  !! ${brokenImgs} broken image(s)` : '';
      console.log(`OK   ${p}  | title="${title}" | ${links} links${status}`);
      await page.screenshot({ path: path.join(ROOT, 'screenshots', p.replace('.html', '.png')), fullPage: false });
    } catch (e) {
      failures.push(`[navigation] ${p}: ${e.message}`);
      console.log(`FAIL ${p}: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\n=== Interactions ===');
  try {
    await page.goto('http://localhost:3456/index.html', { waitUntil: 'networkidle' });
    await page.click('a[href="cars.html"].btn--primary, .home-hero a[href="cars.html"]');
    await page.waitForTimeout(1500);
    console.log('OK   "Browse Cars" click navigated');
  } catch (e) {
    failures.push(`[interaction] Browse Cars: ${e.message}`);
    console.log('FAIL "Browse Cars" click: ' + e.message.split('\n')[0]);
  }

  try {
    await page.goto('http://localhost:3456/cars.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const firstCar = page.locator('article, .car-card, .car, [class*="car"] a[href*="car-details"], a[href*="car-details"]').first();
    if (await firstCar.count()) {
      await firstCar.click();
      await page.waitForTimeout(1500);
      console.log('OK   Car card -> details navigation');
    } else {
      console.log('WARN No car cards found to click');
    }
  } catch (e) {
    failures.push(`[interaction] car card: ${e.message}`);
    console.log('FAIL car card click: ' + e.message.split('\n')[0]);
  }

  try {
    await page.goto('http://localhost:3456/login.html', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'test@jetcabs.com');
    await page.fill('input[type="password"], input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('OK   Login form filled + submitted (page:', (await page.url()).split('/').pop() + ')');
  } catch (e) {
    failures.push(`[interaction] login: ${e.message}`);
    console.log('FAIL login form: ' + e.message.split('\n')[0]);
  }

  await page.screenshot({ path: path.join(ROOT, 'screenshots', 'final.png') });
  await browser.close();
  server.close();

  console.log('\n=== RESULTS ===');
  if (failures.length) {
    console.log(`${failures.length} issue(s) found:`);
    const unique = [...new Set(failures)];
    unique.forEach(f => console.log(' - ' + f));
  } else {
    console.log('All pages loaded clean. No console/page errors.');
  }
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error('Fatal:', e); process.exit(1); });
