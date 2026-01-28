#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { App } from "./App.js";

process.env.AI_GATEWAY_API_KEY = "demo-mode";

async function main() {
  const handleExit = () => {
    process.exit(0);
  };

  const { waitUntilExit } = render(
    <App onExit={handleExit} />
  );

  await waitUntilExit();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
