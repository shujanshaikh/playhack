import { ToolLoopAgent, stepCountIs } from "ai";
import { tools } from "./tools";
import { systemPrompt } from "./prompt";
import { cerebras } from "@ai-sdk/cerebras";

const agent = new ToolLoopAgent({
  model: cerebras("gpt-oss-120b"),
  instructions: systemPrompt,
  tools,
  stopWhen: stepCountIs(20),
});

export async function runAgent(
  task: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const stream = await agent.stream({
    prompt: task,
  });

  let result = "";
  for await (const chunk of stream.textStream) {
    if (onChunk) {
      onChunk(chunk);
    }
    result += chunk;
  }

  return result;
}
