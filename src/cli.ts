import { initBrowser, closeBrowser } from "./browser";
import { runAgent } from "./agent";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: bun run src/cli.ts <task>");
    console.log('Example: bun run src/cli.ts "Go to google.com and search for Bun"');
    process.exit(1);
  }

  const task = args.join(" ");

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("Error: AI_GATEWAY_API_KEY environment variable is required");
    console.error("Set it in your .env file or export it in your shell");
    process.exit(1);
  }

  try {
    console.log("Initializing browser...");
    await initBrowser();

    const result = await runAgent(task);

    console.log("\nFinal Result:");
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
    //process.exit(1);
  } finally {
    console.log("\nClosing browser...");
    await closeBrowser();
  }
}

main();
