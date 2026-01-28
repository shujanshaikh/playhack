import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

export async function initBrowser(): Promise<Page> {
  if (page) return page;

  browser = await chromium.launch({
    headless: true,
  });

  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  page = await context.newPage();

  return page;
}

export function getPage(): Page {
  if (!page) {
    throw new Error("Browser not initialized. Call initBrowser() first.");
  }
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (page) {
    await page.close();
    page = null;
  }
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});
