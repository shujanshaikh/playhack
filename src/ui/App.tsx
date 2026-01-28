import React, { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { marked, type Token, type Tokens } from "marked";

type InlineToken = Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Text | Tokens.Link | Tokens.Br;

const MarkdownText: React.FC<{ children: string }> = ({ children }) => {
  const tokens = marked.lexer(children);

  const renderInline = (inlineTokens: InlineToken[] | undefined, keyPrefix: string): React.ReactNode[] => {
    if (!inlineTokens) return [];
    return inlineTokens.map((t, i) => {
      const key = `${keyPrefix}-${i}`;
      switch (t.type) {
        case "strong":
          return <Text key={key} bold>{t.text}</Text>;
        case "em":
          return <Text key={key} italic>{t.text}</Text>;
        case "codespan":
          return <Text key={key} color="#00ff9f">`{t.text}`</Text>;
        case "link":
          return <Text key={key} color="#00b8ff" underline>{t.text}</Text>;
        case "br":
          return <Text key={key}>{"\n"}</Text>;
        default:
          return <Text key={key}>{t.raw}</Text>;
      }
    });
  };

  const renderToken = (token: Token, index: number): React.ReactNode => {
    switch (token.type) {
      case "heading":
        return (
          <Box key={index} marginTop={1}>
            <Text bold color="#00b8ff">{renderInline(token.tokens as InlineToken[], `h-${index}`)}</Text>
          </Box>
        );
      case "paragraph":
        return (
          <Box key={index} marginTop={1}>
            <Text>{renderInline(token.tokens as InlineToken[], `p-${index}`)}</Text>
          </Box>
        );
      case "code":
        return (
          <Box key={index} marginTop={1} flexDirection="column">
            <Text color="#4a5568">```{token.lang || ""}</Text>
            <Text color="#00ff9f">{token.text}</Text>
            <Text color="#4a5568">```</Text>
          </Box>
        );
      case "list":
        return (
          <Box key={index} flexDirection="column" marginTop={1}>
            {token.items.map((item: Tokens.ListItem, i: number) => (
              <Text key={i}>  • {renderInline(item.tokens as InlineToken[], `li-${index}-${i}`)}</Text>
            ))}
          </Box>
        );
      case "blockquote":
        return (
          <Box key={index} marginTop={1}>
            <Text color="#4a5568">│ {renderInline(token.tokens as InlineToken[], `bq-${index}`)}</Text>
          </Box>
        );
      case "space":
        return null;
      default:
        if ("text" in token) {
          return <Text key={index}>{(token as { text: string }).text}</Text>;
        }
        return null;
    }
  };

  return <Box flexDirection="column">{tokens.map(renderToken)}</Box>;
};

type AppState = "input" | "running" | "complete" | "error";

interface AppProps {
  initialTask?: string;
  onSubmit?: (task: string, onChunk: (chunk: string) => void) => Promise<string>;
  onExit?: () => void;
}

export const App: React.FC<AppProps> = ({ initialTask, onSubmit, onExit }: AppProps) => {
  const { exit } = useApp();

  const [state, setState] = useState<AppState>(initialTask ? "running" : "input");
  const [taskInput, setTaskInput] = useState("");
  const [currentTask, setCurrentTask] = useState(initialTask || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      if (onExit) onExit();
      exit();
    }

    if ((state === "complete" || state === "error") && key.return) {
      setOutput("");
      setError("");
      setTaskInput("");
      setState("input");
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    setCurrentTask(value);
    setState("running");
    setOutput("");

    try {
      if (onSubmit) {
        const result = await onSubmit(value, (chunk: string) => {
          setOutput((prev) => prev + chunk);
        });
        setOutput(result);
      } else {
        const words = "This is a demo response. The browser agent would execute your task and stream the results here.".split(" ");
        for (const word of words) {
          await new Promise((r) => setTimeout(r, 100));
          setOutput((prev) => prev + (prev ? " " : "") + word);
        }
      }
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  };
  
  React.useEffect(() => {
    if (initialTask && state === "running" && !output) {
      handleSubmit(initialTask);
    }
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      {state === "input" && (
        <Box>
          <Text color="#00ff9f">❯ </Text>
          <TextInput
            value={taskInput}
            onChange={setTaskInput}
            onSubmit={handleSubmit}
            placeholder="Enter task..."
          />
        </Box>
      )}

      {state === "running" && (
        <Box flexDirection="column">
          <Box>
            <Text color="#00b8ff">
              <Spinner type="dots" />
            </Text>
            <Text color="#4a5568"> {currentTask}</Text>
          </Box>
          {output && (
            <Box marginTop={1}>
              <MarkdownText>{output}</MarkdownText>
            </Box>
          )}
        </Box>
      )}

      {state === "complete" && (
        <Box flexDirection="column">
          <Box>
            <Text color="#00ff9f">✓ </Text>
            <Text color="#4a5568">{currentTask}</Text>
          </Box>
          {output && (
            <Box marginTop={1}>
              <MarkdownText>{output}</MarkdownText>
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>[Enter] New task  [Esc] Exit</Text>
          </Box>
        </Box>
      )}

      {state === "error" && (
        <Box flexDirection="column">
          <Box>
            <Text color="#ff3366">✗ </Text>
            <Text color="#4a5568">{currentTask}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#ff3366">{error}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>[Enter] Retry  [Esc] Exit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default App;
