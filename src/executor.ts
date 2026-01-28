import type { Page } from "playwright";

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  screenshots?: string[];
}

export async function executePlaywrightCode(
  page: Page,
  code: string
): Promise<ExecutionResult> {
  const screenshots: string[] = [];

  const originalScreenshot = page.screenshot.bind(page);
  page.screenshot = async (options?: Parameters<typeof originalScreenshot>[0]) => {
    const result = await originalScreenshot(options);
    if (options && typeof options === "object" && "path" in options && options.path) {
      screenshots.push(options.path as string);
    }
    return result;
  };

  try {
    const asyncFunction = new Function(
      "page",
      `return (async () => { ${code} })();`
    );

    const result = await asyncFunction(page);

    return {
      success: true,
      result: result !== undefined
        ? (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result))
        : "Code executed successfully",
      screenshots,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      screenshots,
    };
  }
}
