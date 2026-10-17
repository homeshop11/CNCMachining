import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const pages = [
  { path: '/', name: 'home' },
  { path: '/products/cnc-machining', name: 'cnc-machining' },
  { path: '/products/sheet-metal', name: 'sheet-metal' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/missing-page', name: '404' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const failures = [];

function record(pass, message) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${message}`);
  if (!pass) failures.push(message);
}

await mkdir('test-results', { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  for (const target of pages) {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const response = await page.goto(`${baseUrl}${target.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    const status = response?.status() ?? 0;
    const expectedStatus = target.name === '404' ? 404 : 200;
    record(
      status === expectedStatus,
      `${viewport.name} ${target.name} responds with ${status}`,
    );

    await page.waitForTimeout(450);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(450);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const images = Array.from(document.images).map((image) => ({
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        alt: image.alt,
      }));

      const visibleImages = images.filter((image) => image.complete);

      return {
        viewportWidth: window.innerWidth,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        h1Count: document.querySelectorAll('h1').length,
        brokenImages: visibleImages.filter((image) => image.naturalWidth === 0).length,
        totalImages: images.length,
      };
    });

    const overflow = layout.scrollWidth - layout.clientWidth;
    record(
      layout.h1Count === 1,
      `${viewport.name} ${target.name} has exactly one h1 (${layout.h1Count})`,
    );
    record(
      overflow <= 1,
      `${viewport.name} ${target.name} has no horizontal overflow (${overflow}px)`,
    );
    record(
      layout.brokenImages === 0,
      `${viewport.name} ${target.name} has no broken visible images`,
    );
    const meaningfulConsoleErrors = target.name === '404' ? [] : consoleErrors;
    record(
      meaningfulConsoleErrors.length === 0,
      `${viewport.name} ${target.name} has no console errors`,
    );
    if (meaningfulConsoleErrors.length > 0) {
      console.log(`  console errors: ${meaningfulConsoleErrors.join(' | ')}`);
    }

    if (target.name === 'home') {
      await page.screenshot({
        path: `test-results/home-${viewport.name}.png`,
        fullPage: true,
      });
    }

    if (target.name === 'cnc-machining') {
      await page.screenshot({
        path: `test-results/product-${viewport.name}.png`,
        fullPage: true,
      });
    }
  }

  await context.close();
}

const apiContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const validInquiry = {
  name: 'Test Buyer',
  email: 'buyer@example.com',
  company: 'Example Industries',
  country: 'United States',
  productLine: 'cnc-machining',
  message: 'Please quote 250 aluminum brackets with clear anodize and a target date.',
  consent: true,
  website: '',
  attachments: [],
};

const apiResponse = await apiContext.request.post(`${baseUrl}/api/inquiry`, {
  data: validInquiry,
});
const apiBody = await apiResponse.json();
record(
  apiResponse.status() === 200 && apiBody.status === 'accepted' && apiBody.id,
  `inquiry API accepts valid payload with ${apiResponse.status()}`,
);

const invalidResponse = await apiContext.request.post(`${baseUrl}/api/inquiry`, {
  data: {
    ...validInquiry,
    email: 'not-an-email',
  },
});
record(
  invalidResponse.status() === 400,
  `inquiry API rejects invalid payload with ${invalidResponse.status()}`,
);

const formPage = await apiContext.newPage();
await formPage.goto(`${baseUrl}/contact`, { waitUntil: 'domcontentloaded' });
await formPage.fill('#inquiry-name', 'Local Test Buyer');
await formPage.fill('#inquiry-email', 'buyer@example.com');
await formPage.fill('#inquiry-company', 'Example Industries');
await formPage.selectOption('#inquiry-product', 'cnc-machining');
await formPage.fill(
  '#inquiry-message',
  'Please provide a quotation for 500 aluminum enclosures with powder coating.',
);
await formPage.check('#inquiry-consent');
await formPage.click('#inquiry-submit');
await formPage.waitForSelector('#inquiry-success:not(.hidden)', { timeout: 10_000 });
record(true, 'contact form submits and displays success state');
await apiContext.close();

await browser.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} local test check(s) failed.`);
  process.exit(1);
}

console.log('\nAll local tests passed.');
