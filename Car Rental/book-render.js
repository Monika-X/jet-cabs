const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://jet-cabs.onrender.com';
const USER_EMAIL = 'test@example.com';
const USER_PASS = 'Test@123';
const ADMIN_EMAIL = 'admin@carrental.com';
const ADMIN_PASS = 'Admin@123';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const formatDate = (d) => d.toISOString().split('T')[0];

(async () => {
  console.log('====================================================');
  console.log(' JET CABS — RENDER 3 CARS BOOKING & VERIFICATION');
  console.log(' Target Platform: Render (https://jet-cabs.onrender.com)');
  console.log(' Customer User:   test@example.com');
  console.log(' Admin User:      admin@carrental.com');
  console.log('====================================================');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Dynamic future dates for 3 separate bookings
  const now = new Date();
  const d1Pickup = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const d1Return = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const d2Pickup = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  const d2Return = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);

  const d3Pickup = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const d3Return = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000);

  console.log(`\nBooking 1 (Porsche)  Dates: ${formatDate(d1Pickup)} to ${formatDate(d1Return)}`);
  console.log(`Booking 2 (Mercedes) Dates: ${formatDate(d2Pickup)} to ${formatDate(d2Return)}`);
  console.log(`Booking 3 (BMW)      Dates: ${formatDate(d3Pickup)} to ${formatDate(d3Return)}`);

  console.log('\n[LAUNCH] Opening visible Chrome browser...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 150
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  // Seamlessly proxy any localhost:5000 API requests to Render backend
  await context.route('http://localhost:5000/**', async (route) => {
    const req = route.request();
    const opts = {
      url: req.url().replace('http://localhost:5000', BASE_URL),
      method: req.method(),
      headers: { ...req.headers() }
    };
    delete opts.headers['host'];
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      opts.postData = req.postDataBuffer();
    }
    try {
      const response = await route.fetch(opts);
      await route.fulfill({ response });
    } catch (err) {
      console.error('Route rewrite error:', err.message);
      await route.abort();
    }
  });

  const page = await context.newPage();

  async function revealAll() {
    await page.evaluate(() => {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal--left, .scroll-reveal--right, .scroll-reveal--scale')
        .forEach(el => el.classList.add('revealed'));
    }).catch(() => {});
  }

  // Pre-booking wizard submission
  async function completeBookingWizard(carName, pDate, pTime, rDate, rTime, locIndex) {
    console.log(`\n--> [Wizard Step 1] Setting Dates & Location for ${carName}...`);
    await page.waitForSelector('#step-1', { state: 'attached', timeout: 15000 });
    await revealAll();

    const dailyLabel = page.locator('label[for="daily"]');
    if (await dailyLabel.count()) {
      await dailyLabel.first().click();
    }

    await page.fill('#pickup-date', pDate);
    await page.fill('#pickup-time', pTime);
    await page.fill('#return-date', rDate);
    await page.fill('#return-time', rTime);

    await page.selectOption('#pickup-loc', { index: locIndex });
    await sleep(600);

    console.log('    Clicking Step 1 Continue...');
    await page.click('#step-1 button.btn-next');

    // Step 2: Contact Details
    console.log('--> [Wizard Step 2] Filling Customer Details...');
    await page.waitForSelector('#step-2-prebooking', { state: 'attached', timeout: 15000 });
    await revealAll();

    await page.fill('#pre-full-name', 'Test User');
    await page.fill('#pre-email', USER_EMAIL);
    await page.fill('#pre-phone', '+1 555-019-2834');
    await page.selectOption('#pre-contact-method', 'Email');
    await page.fill('#pre-additional-note', `Render automated booking for ${carName}`);
    await sleep(600);

    console.log('    Clicking Step 2 Next...');
    await page.click('#step-2-prebooking button.btn-next');

    // Step 3: Review & Submit
    console.log('--> [Wizard Step 3] Reviewing & Submitting Request...');
    await page.waitForSelector('#step-3-prebooking', { state: 'attached', timeout: 15000 });
    await revealAll();

    const consentLabel = page.locator('label[for="pre-consent-agree"]');
    if (await consentLabel.count()) {
      await consentLabel.first().click();
    } else {
      await page.locator('#pre-consent-agree').check({ force: true });
    }
    await sleep(800);

    const [bookingResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/bookings') && res.request().method() === 'POST', { timeout: 25000 }),
      page.click('#step-3-prebooking button.btn-next')
    ]);

    const resJson = await bookingResponse.json().catch(() => ({}));
    console.log('    Server Response Status:', bookingResponse.status(), '| Success:', resJson.success);
    if (!resJson.success) {
      throw new Error('Booking submission failed: ' + (resJson.message || 'Unknown server error'));
    }

    const bookingId = resJson.data?._id || 'N/A';
    const totalAmount = resJson.data?.totalAmount || 'N/A';
    console.log(`    [SUCCESS] Booking created! ID: ${bookingId} | Total: $${totalAmount}`);
    await sleep(2500);

    return { bookingId, totalAmount };
  }

  // Helper to book a car by searching keyword
  async function bookCarByKeyword(stepNum, keyword, pDate, rDate, locIndex) {
    console.log(`\n[STEP ${stepNum}] Navigating to Fleet Catalog and searching "${keyword}"...`);
    await page.goto(`${BASE_URL}/cars.html`, { waitUntil: 'networkidle' });
    await sleep(1500);
    await revealAll();

    const searchInput = page.locator('#search-keyword');
    await searchInput.fill(keyword);
    await searchInput.press('Enter');
    await sleep(2000);

    await page.waitForSelector('#vehicle-grid .v-card', { state: 'attached', timeout: 15000 });
    await revealAll();

    const cards = page.locator('#vehicle-grid .v-card');
    const count = await cards.count();
    console.log(`    Found ${count} matching car(s) for "${keyword}"`);

    const carName = await cards.nth(0).locator('.v-card__name').innerText();
    const carBrand = await cards.nth(0).locator('.v-card__brand').innerText();
    const fullName = `${carBrand} ${carName}`.trim();
    console.log(`    Selected Car: ${fullName}`);

    await cards.nth(0).locator('a.btn--outline').click();
    await page.waitForURL('**/car-details.html**', { timeout: 15000 });
    await revealAll();
    await sleep(1500);

    const rentBtn = page.locator('.showcase__actions a[href*="booking.html"], .booking-card a[href*="booking.html"]').first();
    await rentBtn.click();
    await page.waitForURL('**/booking.html**', { timeout: 15000 });
    await sleep(1500);

    const result = await completeBookingWizard(
      fullName,
      pDate,
      '10:00',
      rDate,
      '10:00',
      locIndex
    );

    return { fullName, ...result };
  }

  const bookings = [];

  try {
    // -------------------------------------------------------------
    // 1. LOGIN AS CUSTOMER
    // -------------------------------------------------------------
    console.log(`\n[STEP 1/6] Logging in as Customer (${USER_EMAIL}) on Render...`);
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await revealAll();

    await page.fill('#login-email', USER_EMAIL);
    await page.fill('#login-password', USER_PASS);
    await sleep(500);
    await page.click('#login-btn');

    await page.waitForURL('**/user-dashboard.html', { timeout: 15000 });
    console.log('    [OK] Customer logged in successfully.');
    await sleep(1500);

    // -------------------------------------------------------------
    // 2. BOOK CAR 1: PORSCHE
    // -------------------------------------------------------------
    const b1 = await bookCarByKeyword(
      '2/6 (Car 1)',
      'Porsche',
      formatDate(d1Pickup),
      formatDate(d1Return),
      1
    );
    bookings.push(b1);
    await page.screenshot({ path: path.join(screenshotsDir, 'render-car1-booked.png') });

    // -------------------------------------------------------------
    // 3. BOOK CAR 2: MERCEDES
    // -------------------------------------------------------------
    const b2 = await bookCarByKeyword(
      '3/6 (Car 2)',
      'Mercedes',
      formatDate(d2Pickup),
      formatDate(d2Return),
      2
    );
    bookings.push(b2);
    await page.screenshot({ path: path.join(screenshotsDir, 'render-car2-booked.png') });

    // -------------------------------------------------------------
    // 4. BOOK CAR 3: BMW
    // -------------------------------------------------------------
    const b3 = await bookCarByKeyword(
      '4/6 (Car 3)',
      'Bmw',
      formatDate(d3Pickup),
      formatDate(d3Return),
      3
    );
    bookings.push(b3);
    await page.screenshot({ path: path.join(screenshotsDir, 'render-car3-booked.png') });

    // -------------------------------------------------------------
    // 5. VERIFY USER DASHBOARD
    // -------------------------------------------------------------
    console.log('\n[STEP 5/6] Checking User Dashboard on Render (/user-dashboard.html)...');
    await page.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'networkidle' });
    await sleep(2000);
    await revealAll();

    console.log('    Opening "Pre-Bookings" tab in User Dashboard...');
    await page.click('button[data-module="prebookings"]');
    await sleep(3500);
    await revealAll();

    const userContent = await page.locator('#dashboard-content').innerText();
    const car1InUser = userContent.includes(b1.fullName) || userContent.includes('Porsche');
    const car2InUser = userContent.includes(b2.fullName) || userContent.includes('Mercedes');
    const car3InUser = userContent.includes(b3.fullName) || userContent.includes('Bmw') || userContent.includes('BMW');

    console.log(`    --> ${b1.fullName} in User Dashboard:`, car1InUser ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${b2.fullName} in User Dashboard:`, car2InUser ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${b3.fullName} in User Dashboard:`, car3InUser ? 'YES [FOUND]' : 'NO');

    await page.screenshot({ path: path.join(screenshotsDir, 'render-user-dashboard.png') });
    console.log('    [SAVED] Screenshot: screenshots/render-user-dashboard.png');

    // -------------------------------------------------------------
    // 6. VERIFY ADMIN DASHBOARD
    // -------------------------------------------------------------
    console.log('\n[STEP 6/6] Checking Admin Dashboard on Render (/admin-dashboard.html)...');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await revealAll();
    await page.fill('#login-email', ADMIN_EMAIL);
    await page.fill('#login-password', ADMIN_PASS);
    await sleep(500);
    await page.click('#login-btn');

    await page.waitForURL('**/admin-dashboard.html', { timeout: 15000 });
    console.log('    [OK] Admin logged in.');
    await sleep(2500);
    await revealAll();

    console.log('    Opening "Pre-bookings" tab in Admin Dashboard...');
    await page.click('button[data-module="prebookings"]');
    await sleep(3500);
    await revealAll();

    const adminContent = await page.locator('#dashboard-content').innerText();
    const car1InAdmin = adminContent.includes(b1.fullName) || adminContent.includes('Porsche');
    const car2InAdmin = adminContent.includes(b2.fullName) || adminContent.includes('Mercedes');
    const car3InAdmin = adminContent.includes(b3.fullName) || adminContent.includes('Bmw') || adminContent.includes('BMW');
    const userInAdmin = adminContent.includes(USER_EMAIL) || adminContent.includes('Test User');

    console.log(`    --> ${b1.fullName} in Admin Dashboard:`, car1InAdmin ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${b2.fullName} in Admin Dashboard:`, car2InAdmin ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${b3.fullName} in Admin Dashboard:`, car3InAdmin ? 'YES [FOUND]' : 'NO');
    console.log(`    --> Customer (${USER_EMAIL}) in Admin Dashboard:`, userInAdmin ? 'YES [FOUND]' : 'NO');

    await page.screenshot({ path: path.join(screenshotsDir, 'render-admin-dashboard.png') });
    console.log('    [SAVED] Screenshot: screenshots/render-admin-dashboard.png');

    // -------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log('       RENDER 3 CARS BOOKING & VERIFY RESULTS');
    console.log('====================================================');
    console.log(`Customer:              ${USER_EMAIL}`);
    bookings.forEach((b, idx) => {
      console.log(`Car ${idx + 1}:                ${b.fullName} | ID: ${b.bookingId} | Total: $${b.totalAmount}`);
    });
    console.log('----------------------------------------------------');
    console.log(`User Dashboard:        ${car1InUser && car2InUser && car3InUser ? 'PASSED (All 3 Bookings Visible)' : 'FAILED / PARTIAL'}`);
    console.log(`Admin Dashboard:       ${car1InAdmin && car2InAdmin && car3InAdmin ? 'PASSED (All 3 Bookings Visible)' : 'FAILED / PARTIAL'}`);
    console.log('====================================================');

    console.log('\nKeeping visible browser open for 6 seconds...');
    await sleep(6000);

  } catch (err) {
    console.error('\n[TEST ERROR]:', err.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'render-error.png') }).catch(() => {});
  } finally {
    await browser.close();
    console.log('\n[DONE] Execution completed.');
  }
})();
