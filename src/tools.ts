import { tool } from "ai";
import { z } from "zod";
import { mkdir } from "node:fs/promises";
import { getPage } from "./browser";
import { executePlaywrightCode } from "./executor";

const SCREENSHOT_DIR = "./screenshots";

export const executeTool = tool({
  description: `Execute Playwright code to test web application functionality. Use this to navigate, interact with elements, fill forms, and verify behavior.

The \`page\` object is available. Write JavaScript code directly (async/await supported).

Common patterns:
- Navigate: await page.goto('http://localhost:3000')
- Click: await page.click('button') or await page.getByRole('button', {name: 'Submit'}).click()
- Fill input: await page.fill('input[name="email"]', 'test@test.com')
- Get text: await page.textContent('.message')
- Check visible: await page.isVisible('.element')
- Wait: await page.waitForSelector('.loaded') or await page.waitForURL('**/dashboard')
- Get URL: page.url()

Return a value to report test results.`,
  inputSchema: z.object({
    code: z
      .string()
      .describe("Playwright code to execute. Use `page` object. Return a value to report results."),
    action: z
      .string()
      .describe("What this test step does (e.g., 'Fill login form', 'Verify redirect to dashboard')"),
  }),
  execute: async ({ code, action }) => {
    const page = getPage();
    const startTime = Date.now();
    const result = await executePlaywrightCode(page, code);
    const duration = Date.now() - startTime;

    if (result.success) {
      return `[PASS] ${action} (${duration}ms)\nResult: ${result.result}`;
    } else {
      return `[FAIL] ${action} (${duration}ms)\nError: ${result.error}`;
    }
  },
});

export const screenshotTool = tool({
  description: `Capture the current browser UI state. Use this to:
- Verify visual state after actions
- Document test evidence
- Debug when tests fail
- Check element visibility`,
  inputSchema: z.object({
    name: z
      .string()
      .describe("Descriptive name for the screenshot (e.g., 'login-page', 'form-error', 'success-state')"),
    fullPage: z
      .boolean()
      .optional()
      .describe("Capture full scrollable page (default: false, captures viewport only)"),
  }),
  execute: async ({ name, fullPage }) => {
    const page = getPage();
    const timestamp = Date.now();
    const filename = `${SCREENSHOT_DIR}/${name}-${timestamp}.png`;

    try {
      await mkdir(SCREENSHOT_DIR, { recursive: true });

      const currentUrl = page.url();
      const title = await page.title();

      await page.screenshot({
        path: filename,
        fullPage: fullPage ?? false,
      });

      return `[SCREENSHOT] ${filename}\nPage: ${title}\nURL: ${currentUrl}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `[SCREENSHOT FAILED] ${errorMessage}`;
    }
  },
});

export const tools = {
  execute: executeTool,
  screenshot: screenshotTool,
};
