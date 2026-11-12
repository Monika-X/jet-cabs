const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const USER_EMAIL = 'test@example.com';
const USER_PASS = 'Test@123';
const ADMIN_EMAIL = 'admin@carrental.com';
const ADMIN_PASS = 'Admin@123';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const formatDate = (d) => d.toISOString().split('T')[0];

(async () => {
  console.log('====================================================');
  console.log(' JET CABS — PLAYWRIGHT AUTOMATED BOOKING & VERIFY');
  console.log('====================================================');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Dynamic future dates
  const now = new Date();
  const d1Pickup = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const d1Return = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const d2Pickup = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
  const d2Return = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000);

  console.log(`Rental 1 (Porsche)  Dates: ${formatDate(d1Pickup)} to ${formatDate(d1Return)}`);
  console.log(`Rental 2 (Mercedes) Dates: ${formatDate(d2Pickup)} to ${formatDate(d2Return)}`);

  console.log('\n[LAUNCH] Opening visible Chrome browser...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  async function revealAll() {
    await page.evaluate(() => {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal--left, .scroll-reveal--right, .scroll-reveal--scale')
        .forEach(el => el.classList.add('revealed'));
    });
  }

  // Complete pre-booking wizard
  async function completeBookingWizard(carName, pDate, pTime, rDate, rTime, locIndex) {
    console.log(`\n--> [Wizard Step 1] Setting Dates & Location for ${carName}...`);
    await page.waitForSelector('#step-1', { state: 'attached', timeout: 10000 });
    await revealAll();

    // Select daily rental by clicking its label
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
    await page.waitForSelector('#step-2-prebooking', { state: 'attached', timeout: 10000 });
    await revealAll();

    await page.fill('#pre-full-name', 'Test User');
    await page.fill('#pre-email', USER_EMAIL);
    await page.fill('#pre-phone', '+1 555-019-2834');
    await page.selectOption('#pre-contact-method', 'Email');
    await page.fill('#pre-additional-note', `Automated booking for ${carName}`);
    await sleep(600);

    console.log('    Clicking Step 2 Next...');
    await page.click('#step-2-prebooking button.btn-next');

    // Step 3: Review & Submit
    console.log('--> [Wizard Step 3] Reviewing & Submitting Request...');
    await page.waitForSelector('#step-3-prebooking', { state: 'attached', timeout: 10000 });
    await revealAll();

    // Check consent checkbox via label click
    const consentLabel = page.locator('label[for="pre-consent-agree"]');
    if (await consentLabel.count()) {
      await consentLabel.first().click();
    } else {
      await page.locator('#pre-consent-agree').check({ force: true });
    }
    await sleep(800);

    const [bookingResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/bookings') && res.request().method() === 'POST', { timeout: 15000 }),
      page.click('#step-3-prebooking button.btn-next')
    ]);

    const resJson = await bookingResponse.json().catch(() => ({}));
    console.log('    Server Response Status:', bookingResponse.status(), '| Success:', resJson.success);
    if (!resJson.success) {
      throw new Error('Booking submission failed: ' + (resJson.message || 'Unknown server error'));
    }

    console.log(`    [SUCCESS] Booking created with ID: ${resJson.data?._id}`);
    await sleep(2500);
  }

  let car1FullName = 'Porsche';
  let car2FullName = 'Mercedes';

  try {
    // -------------------------------------------------------------
    // 1. LOGIN AS CUSTOMER
    // -------------------------------------------------------------
    console.log(`\n[STEP 1/5] Logging in as Customer (${USER_EMAIL})...`);
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await revealAll();

    await page.fill('#login-email', USER_EMAIL);
    await page.fill('#login-password', USER_PASS);
    await sleep(500);
    await page.click('#login-btn');

    await page.waitForURL('**/user-dashboard.html', { timeout: 10000 });
    console.log('    [OK] Customer logged in successfully.');
    await sleep(1500);

    // -------------------------------------------------------------
    // 2. BOOK CAR 1: PORSCHE
    // -------------------------------------------------------------
    console.log('\n[STEP 2/5] Navigating to Fleet Catalog (/cars.html) and searching Porsche...');
    await page.goto(`${BASE_URL}/cars.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#vehicle-grid', { state: 'attached', timeout: 10000 });
    await revealAll();

    // Search for Porsche
    const searchInput = page.locator('#search-keyword');
    await searchInput.fill('Porsche');
    await searchInput.press('Enter');
    await sleep(1200);

    await page.waitForSelector('#vehicle-grid .v-card', { state: 'attached', timeout: 10000 });
    await revealAll();

    const porscheCards = page.locator('#vehicle-grid .v-card');
    const porscheName = await porscheCards.nth(0).locator('.v-card__name').innerText();
    const porscheBrand = await porscheCards.nth(0).locator('.v-card__brand').innerText();
    car1FullName = `${porscheBrand} ${porscheName}`.trim();
    console.log(`    Selected Car 1: ${car1FullName}`);

    // Click Details -> Rent Now
    await porscheCards.nth(0).locator('a.btn--outline').click();
    await page.waitForURL('**/car-details.html**', { timeout: 10000 });
    await revealAll();
    await sleep(1000);

    const rentNow1 = page.locator('.showcase__actions a[href*="booking.html"], .booking-card a[href*="booking.html"]').first();
    await rentNow1.click();
    await page.waitForURL('**/booking.html**', { timeout: 10000 });
    await sleep(1200);

    await completeBookingWizard(
      car1FullName,
      formatDate(d1Pickup),
      '10:00',
      formatDate(d1Return),
      '10:00',
      1
    );
    await page.screenshot({ path: path.join(screenshotsDir, 'car1-booked.png') });

    // -------------------------------------------------------------
    // 3. BOOK CAR 2: MERCEDES
    // -------------------------------------------------------------
    console.log('\n[STEP 3/5] Navigating to Fleet Catalog (/cars.html) and searching Mercedes...');
    await page.goto(`${BASE_URL}/cars.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#vehicle-grid', { state: 'attached', timeout: 10000 });
    await revealAll();

    const searchInput2 = page.locator('#search-keyword');
    await searchInput2.fill('Mercedes');
    await searchInput2.press('Enter');
    await sleep(1200);

    await page.waitForSelector('#vehicle-grid .v-card', { state: 'attached', timeout: 10000 });
    await revealAll();

    const mercCards = page.locator('#vehicle-grid .v-card');
    const mercName = await mercCards.nth(0).locator('.v-card__name').innerText();
    const mercBrand = await mercCards.nth(0).locator('.v-card__brand').innerText();
    car2FullName = `${mercBrand} ${mercName}`.trim();
    console.log(`    Selected Car 2: ${car2FullName}`);

    await mercCards.nth(0).locator('a.btn--outline').click();
    await page.waitForURL('**/car-details.html**', { timeout: 10000 });
    await revealAll();
    await sleep(1000);

    const rentNow2 = page.locator('.showcase__actions a[href*="booking.html"], .booking-card a[href*="booking.html"]').first();
    await rentNow2.click();
    await page.waitForURL('**/booking.html**', { timeout: 10000 });
    await sleep(1200);

    await completeBookingWizard(
      car2FullName,
      formatDate(d2Pickup),
      '11:00',
      formatDate(d2Return),
      '11:00',
      2
    );
    await page.screenshot({ path: path.join(screenshotsDir, 'car2-booked.png') });

    // -------------------------------------------------------------
    // 4. VERIFY USER DASHBOARD
    // -------------------------------------------------------------
    console.log('\n[STEP 4/5] Checking User Dashboard (/user-dashboard.html)...');
    await page.goto(`${BASE_URL}/user-dashboard.html`, { waitUntil: 'networkidle' });
    await sleep(1500);
    await revealAll();

    // Click Pre-Bookings tab
    console.log('    Opening "Pre-Bookings" tab in User Dashboard...');
    await page.click('button[data-module="prebookings"]');
    await sleep(2500);
    await revealAll();

    const userContent = await page.locator('#dashboard-content').innerText();
    const car1InUser = userContent.includes(car1FullName) || userContent.includes('Porsche');
    const car2InUser = userContent.includes(car2FullName) || userContent.includes('Mercedes');

    console.log(`    --> ${car1FullName} in User Dashboard:`, car1InUser ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${car2FullName} in User Dashboard:`, car2InUser ? 'YES [FOUND]' : 'NO');

    await page.screenshot({ path: path.join(screenshotsDir, 'user-dashboard-verified.png') });
    console.log('    [SAVED] Screenshot: screenshots/user-dashboard-verified.png');

    // -------------------------------------------------------------
    // 5. VERIFY ADMIN DASHBOARD
    // -------------------------------------------------------------
    console.log('\n[STEP 5/5] Checking Admin Dashboard (/admin-dashboard.html)...');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
    await revealAll();
    await page.fill('#login-email', ADMIN_EMAIL);
    await page.fill('#login-password', ADMIN_PASS);
    await sleep(500);
    await page.click('#login-btn');

    await page.waitForURL('**/admin-dashboard.html', { timeout: 10000 });
    console.log('    [OK] Admin logged in.');
    await sleep(2000);
    await revealAll();

    // Click Pre-bookings tab in Admin Dashboard
    console.log('    Opening "Pre-bookings" tab in Admin Dashboard...');
    await page.click('button[data-module="prebookings"]');
    await sleep(3000);
    await revealAll();

    const adminContent = await page.locator('#dashboard-content').innerText();
    const car1InAdmin = adminContent.includes(car1FullName) || adminContent.includes('Porsche');
    const car2InAdmin = adminContent.includes(car2FullName) || adminContent.includes('Mercedes');
    const userInAdmin = adminContent.includes(USER_EMAIL) || adminContent.includes('Test User');

    console.log(`    --> ${car1FullName} in Admin Dashboard:`, car1InAdmin ? 'YES [FOUND]' : 'NO');
    console.log(`    --> ${car2FullName} in Admin Dashboard:`, car2InAdmin ? 'YES [FOUND]' : 'NO');
    console.log(`    --> Customer (${USER_EMAIL}) in Admin Dashboard:`, userInAdmin ? 'YES [FOUND]' : 'NO');

    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard-verified.png') });
    console.log('    [SAVED] Screenshot: screenshots/admin-dashboard-verified.png');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log('               VERIFICATION RESULTS');
    console.log('====================================================');
    console.log(`Customer:           ${USER_EMAIL}`);
    console.log(`Car 1:              ${car1FullName}`);
    console.log(`Car 2:              ${car2FullName}`);
    console.log(`User Dashboard:     ${car1InUser && car2InUser ? 'PASSED (Both Bookings Visible)' : 'CHECK'}`);
    console.log(`Admin Dashboard:    ${car1InAdmin && car2InAdmin ? 'PASSED (Both Bookings Visible)' : 'CHECK'}`);
    console.log('====================================================');

    console.log('\nKeeping visible browser open for 6 seconds so you can see...');
    await sleep(6000);

  } catch (err) {
    console.error('\n[TEST ERROR]:', err.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'test-error.png') }).catch(() => {});
  } finally {
    await browser.close();
    console.log('[DONE] Test script complete.');
  }
})();
