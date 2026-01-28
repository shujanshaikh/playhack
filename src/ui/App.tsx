import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { marked, type Token, type Tokens } from "marked";

type InlineToken = Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Text | Tokens.Link | Tokens.Br;

// Muted color palette for refined terminal aesthetic
const colors = {
  prompt: "#6b7280",      // Soft gray for prompt
  text: "#e5e7eb",        // Light gray for text
  muted: "#4b5563",       // Muted for secondary elements
  border: "#374151",      // Subtle border color
  accent: "#9ca3af",      // Gentle accent
  success: "#6ee7b7",     // Soft green
  error: "#fca5a5",       // Soft red
  code: "#a5b4fc",        // Soft indigo for code
  link: "#93c5fd",        // Soft blue for links
};

const HorizontalRule: React.FC = () => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;
  return (
    <Text color={colors.border}>{"─".repeat(Math.max(width - 2, 40))}</Text>
  );
};

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onEscape: () => void;
  isActive: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onSubmit, onEscape, isActive }) => {
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (value.length === 0) {
      setCursorPosition(0);
    }
  }, [value]);

  useInput((input, key) => {
    if (!isActive) return;

    if (key.escape || (key.ctrl && input === "c")) {
      onEscape();
      return;
    }

    if (key.return) {
      onSubmit(value);
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue);
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }

    if (key.leftArrow) {
      setCursorPosition(Math.max(0, cursorPosition - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition(Math.min(value.length, cursorPosition + 1));
      return;
    }

    // Handle regular input and paste (paste comes as multiple chars)
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition + input.length);
    }
  });

  const beforeCursor = value.slice(0, cursorPosition);
  const afterCursor = value.slice(cursorPosition);
  const cursorChar = isActive && showCursor ? "█" : " ";

  return (
    <Text>
      <Text color={colors.text}>{beforeCursor}</Text>
      <Text color={colors.accent}>{cursorChar}</Text>
      <Text color={colors.text}>{afterCursor}</Text>
    </Text>
  );
};

const RunningBox: React.FC<{ task: string; indicatorPosition: number; indicatorWidth: number }> = ({
  task,
  indicatorPosition,
  indicatorWidth
}) => {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  const boxWidth = Math.max(termWidth - 4, 40);

  const topBorder = "╭" + "─".repeat(boxWidth) + "╮";
  const bottomBorder = "╰" + "─".repeat(boxWidth) + "╯";

  const taskText = task.length > boxWidth - 4 ? task.slice(0, boxWidth - 7) + "..." : task;
  const taskPadding = boxWidth - taskText.length - 2;

  const trackChar = "·";
  const indicatorChar = "●";
  const track = trackChar.repeat(indicatorWidth);
  const before = track.slice(0, indicatorPosition);
  const after = track.slice(indicatorPosition + 1);

  return (
    <Box flexDirection="column">
      <Text color={colors.border}>{topBorder}</Text>
      <Text>
        <Text color={colors.border}>│</Text>
        <Text color={colors.prompt}> {">"} </Text>
        <Text color={colors.text}>{taskText}</Text>
        <Text>{" ".repeat(Math.max(taskPadding, 0))}</Text>
        <Text color={colors.border}>│</Text>
      </Text>
      <Text color={colors.border}>{bottomBorder}</Text>
      <Box paddingLeft={1}>
        <Text color={colors.border}>{before}</Text>
        <Text color={colors.accent}>{indicatorChar}</Text>
        <Text color={colors.border}>{after}</Text>
      </Box>
    </Box>
  );
};

const useBouncingIndicator = (width: number = 20, speed: number = 50) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        const next = prev + direction;
        if (next >= width - 1) {
          setDirection(-1);
          return width - 1;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [direction, width, speed]);

  return position;
};

const MarkdownText: React.FC<{ children: string }> = ({ children }) => {
  const tokens = marked.lexer(children);

  const renderInline = (inlineTokens: InlineToken[] | undefined, keyPrefix: string): React.ReactNode[] => {
    if (!inlineTokens) return [];
    return inlineTokens.map((t, i) => {
      const key = `${keyPrefix}-${i}`;
      switch (t.type) {
        case "strong":
          return <Text key={key} bold color={colors.text}>{t.text}</Text>;
        case "em":
          return <Text key={key} italic color={colors.accent}>{t.text}</Text>;
        case "codespan":
          return <Text key={key} color={colors.code}>{t.text}</Text>;
        case "link":
          return <Text key={key} color={colors.link} underline>{t.text}</Text>;
        case "br":
          return <Text key={key}>{"\n"}</Text>;
        default:
          return <Text key={key} color={colors.text}>{t.raw}</Text>;
      }
    });
  };

  const renderToken = (token: Token, index: number): React.ReactNode => {
    switch (token.type) {
      case "heading":
        return (
          <Box key={index} marginTop={1}>
            <Text bold color={colors.text}>{renderInline(token.tokens as InlineToken[], `h-${index}`)}</Text>
          </Box>
        );
      case "paragraph":
        return (
          <Box key={index} marginTop={1}>
            <Text color={colors.text}>{renderInline(token.tokens as InlineToken[], `p-${index}`)}</Text>
          </Box>
        );
      case "code":
        return (
          <Box key={index} marginTop={1} flexDirection="column">
            <Text color={colors.muted}> {token.lang || "code"}</Text>
            <Text color={colors.code}>{token.text}</Text>
          </Box>
        );
      case "list":
        return (
          <Box key={index} flexDirection="column" marginTop={1}>
            {token.items.map((item: Tokens.ListItem, i: number) => (
              <Text key={i} color={colors.text}>  · {renderInline(item.tokens as InlineToken[], `li-${index}-${i}`)}</Text>
            ))}
          </Box>
        );
      case "blockquote":
        return (
          <Box key={index} marginTop={1}>
            <Text color={colors.muted}>  │ {renderInline(token.tokens as InlineToken[], `bq-${index}`)}</Text>
          </Box>
        );
      case "space":
        return null;
      default:
        if ("text" in token) {
          return <Text key={index} color={colors.text}>{(token as { text: string }).text}</Text>;
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

const INDICATOR_WIDTH = 24;

export const App: React.FC<AppProps> = ({ initialTask, onSubmit, onExit }: AppProps) => {
  const { exit } = useApp();

  const [state, setState] = useState<AppState>(initialTask ? "running" : "input");
  const [taskInput, setTaskInput] = useState("");
  const [currentTask, setCurrentTask] = useState(initialTask || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const indicatorPosition = useBouncingIndicator(INDICATOR_WIDTH, 50);

  const handleEscape = () => {
    if (onExit) onExit();
    exit();
  };

  useInput((input, key) => {
    if (state === "input") return; // PromptInput handles input state

    if (key.escape || (key.ctrl && input === "c")) {
      handleEscape();
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
        throw new Error("No submit handler provided");
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
    <Box flexDirection="column">
      {state === "input" && (
        <Box flexDirection="column">
          <HorizontalRule />
          <Box paddingY={0}>
            <Text color={colors.prompt}> {">"} </Text>
            <PromptInput
              value={taskInput}
              onChange={setTaskInput}
              onSubmit={handleSubmit}
              onEscape={handleEscape}
              isActive={state === "input"}
            />
          </Box>
          <HorizontalRule />
        </Box>
      )}

      {state === "running" && (
        <Box flexDirection="column">
          <RunningBox
            task={currentTask}
            indicatorPosition={indicatorPosition}
            indicatorWidth={INDICATOR_WIDTH}
          />
          {output && (
            <Box marginTop={1} paddingX={1}>
              <MarkdownText>{output}</MarkdownText>
            </Box>
          )}
        </Box>
      )}

      {state === "complete" && (
        <Box flexDirection="column">
          <HorizontalRule />
          <Box paddingY={0}>
            <Text color={colors.success}> ✓ </Text>
            <Text color={colors.muted}>{currentTask}</Text>
          </Box>
          <HorizontalRule />
          {output && (
            <Box marginTop={1} paddingX={1}>
              <MarkdownText>{output}</MarkdownText>
            </Box>
          )}
          <Box marginTop={1} paddingX={1}>
            <Text color={colors.muted}>enter </Text>
            <Text color={colors.accent}>new task</Text>
            <Text color={colors.muted}>  esc </Text>
            <Text color={colors.accent}>exit</Text>
          </Box>
        </Box>
      )}

      {state === "error" && (
        <Box flexDirection="column">
          <HorizontalRule />
          <Box paddingY={0}>
            <Text color={colors.error}> ✗ </Text>
            <Text color={colors.muted}>{currentTask}</Text>
          </Box>
          <HorizontalRule />
          <Box marginTop={1} paddingX={1}>
            <Text color={colors.error}>{error}</Text>
          </Box>
          <Box marginTop={1} paddingX={1}>
            <Text color={colors.muted}>enter </Text>
            <Text color={colors.accent}>retry</Text>
            <Text color={colors.muted}>  esc </Text>
            <Text color={colors.accent}>exit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default App;
