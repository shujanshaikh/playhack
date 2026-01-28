import { test, expect, beforeAll, afterAll } from "bun:test";
import { chromium, type Browser, type Page } from "playwright";
import { executePlaywrightCode } from "./executor";

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
});

afterAll(async () => {
  await browser.close();
});

test("executePlaywrightCode navigates to a URL", async () => {
  const result = await executePlaywrightCode(
    page,
    `await page.goto('https://example.com');`
  );

  expect(result.success).toBe(true);
  expect(page.url()).toBe("https://example.com/");
});

test("executePlaywrightCode returns error for invalid code", async () => {
  const result = await executePlaywrightCode(
    page,
    `await page.invalidMethod();`
  );

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});

test("executePlaywrightCode can get page title", async () => {
  await page.goto("https://example.com");

  const result = await executePlaywrightCode(
    page,
    `return await page.title();`
  );

  expect(result.success).toBe(true);
  expect(result.result).toContain("Example Domain");
});
