import { tool } from "ai";
import { z } from "zod";
import { mkdir } from "node:fs/promises";
import { getPage } from "./browser";
import { executePlaywrightCode } from "./executor";

const SCREENSHOT_DIR = "./screenshots";

export const executeTool = tool({
  description: `Execute Playwright code to interact with and test web applications. The \`page\` object (Playwright Page instance) is pre-configured and available globally.

## Navigation
- \`await page.goto('https://example.com')\` - Navigate to URL
- \`await page.goBack()\` / \`await page.goForward()\` - Browser history
- \`await page.reload()\` - Refresh the page
- \`page.url()\` - Get current URL (sync)

## Clicking & Interaction
- \`await page.click('button')\` - Click by CSS selector
- \`await page.getByRole('button', {name: 'Submit'}).click()\` - Click by accessible role
- \`await page.getByText('Sign in').click()\` - Click by visible text
- \`await page.dblclick('.item')\` - Double click
- \`await page.hover('.menu')\` - Hover over element

## Form Input
- \`await page.fill('input[name="email"]', 'user@test.com')\` - Fill text input
- \`await page.type('#search', 'query', {delay: 100})\` - Type with delay (simulates real typing)
- \`await page.selectOption('select#country', 'US')\` - Select dropdown option
- \`await page.check('input[type="checkbox"]')\` - Check checkbox
- \`await page.setInputFiles('input[type="file"]', '/path/to/file.pdf')\` - Upload file

## Reading Content
- \`await page.textContent('.message')\` - Get element text
- \`await page.innerHTML('.container')\` - Get inner HTML
- \`await page.getAttribute('a', 'href')\` - Get attribute value
- \`await page.inputValue('input')\` - Get input field value
- \`await page.title()\` - Get page title

## Assertions & Visibility
- \`await page.isVisible('.element')\` - Check if visible (returns boolean)
- \`await page.isEnabled('button')\` - Check if enabled
- \`await page.isChecked('input[type="checkbox"]')\` - Check if checked
- \`await page.locator('.items').count()\` - Count matching elements

## Waiting
- \`await page.waitForSelector('.loaded')\` - Wait for element to appear
- \`await page.waitForURL('**/dashboard')\` - Wait for URL pattern
- \`await page.waitForLoadState('networkidle')\` - Wait for network to settle
- \`await page.waitForTimeout(1000)\` - Wait fixed time (use sparingly)
- \`await page.waitForResponse(r => r.url().includes('/api'))\` - Wait for specific network response

## Keyboard & Mouse
- \`await page.keyboard.press('Enter')\` - Press key
- \`await page.keyboard.type('Hello')\` - Type text
- \`await page.mouse.click(100, 200)\` - Click at coordinates

## Frames & Popups
- \`page.frame('frame-name')\` - Access iframe by name
- \`page.frameLocator('iframe').locator('button').click()\` - Interact inside iframe

Return any value to report results. Errors are automatically caught and reported.`,
  inputSchema: z.object({
    code: z
      .string()
      .describe(
        "JavaScript code using Playwright's `page` API. Supports async/await. Return a value to include in the result output. Example: `await page.fill('#email', 'test@example.com'); return await page.inputValue('#email');`"
      ),
    action: z
      .string()
      .describe(
        "Human-readable description of what this step accomplishes. Used in test output for clarity. Examples: 'Navigate to login page', 'Submit registration form', 'Verify error message appears', 'Extract product prices from table'"
      ),
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
  description: `Capture a screenshot of the current browser state for visual verification and debugging.

## When to Use
- **After key actions**: Verify UI changed as expected (form submitted, modal opened, navigation completed)
- **On test failure**: Capture the error state to understand what went wrong
- **Before/after comparisons**: Document state changes during a workflow
- **Visual regression**: Record expected appearance for future comparison

## Screenshot Modes
- **Viewport (default)**: Captures only the visible browser window - faster, smaller files
- **Full page**: Captures entire scrollable content - useful for long pages, complete documentation

## Naming Conventions
Use descriptive, hyphenated names that indicate the test context:
- \`login-form-empty\` - Initial state
- \`login-form-filled\` - After entering credentials
- \`login-error-invalid-password\` - Error state
- \`dashboard-after-login\` - Success state
- \`checkout-step-2-shipping\` - Multi-step workflow

Screenshots are saved to \`./screenshots/\` with automatic timestamps to prevent overwrites.`,
  inputSchema: z.object({
    name: z
      .string()
      .describe(
        "Descriptive kebab-case identifier for the screenshot. Should indicate context and state. Examples: 'homepage-initial', 'login-form-validation-error', 'cart-with-3-items', 'checkout-payment-step'. Timestamp is auto-appended."
      ),
    fullPage: z
      .boolean()
      .optional()
      .describe(
        "When true, captures the entire scrollable page content. When false (default), captures only the visible viewport. Use fullPage for documentation, content-heavy pages, or when elements may be below the fold."
      ),
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
