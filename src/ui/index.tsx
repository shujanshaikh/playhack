#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { App } from "./App.js";
import { initBrowser, closeBrowser } from "../browser.js";
import { runAgent } from "../agent.js";

async function main() {
  const args = process.argv.slice(2);
  const initialTask = args.length > 0 ? args.join(" ") : undefined;

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("Error: AI_GATEWAY_API_KEY environment variable is required");
    process.exit(1);
  }

  let browserInitialized = false;

  const handleSubmit = async (task: string, onChunk: (chunk: string) => void): Promise<string> => {
    if (!browserInitialized) {
      await initBrowser();
      browserInitialized = true;
    }
    return await runAgent(task, onChunk);
  };

  const handleExit = async () => {
    if (browserInitialized) {
      await closeBrowser();
    }
    process.exit(0);
  };

  const { waitUntilExit } = render(
    <App
      initialTask={initialTask}
      onSubmit={handleSubmit}
      onExit={handleExit}
    />
  );

  await waitUntilExit();

  if (browserInitialized) {
    await closeBrowser();
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
