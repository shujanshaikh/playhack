import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { colors } from "./colors";
import { HorizontalRule, PromptInput, RunningBox, MarkdownText } from "./components";
import { useBouncingIndicator } from "./hooks";

type AppState = "input" | "running" | "complete" | "error";

interface AppProps {
  initialTask?: string;
  onSubmit?: (task: string, onChunk: (chunk: string) => void) => Promise<string>;
  onExit?: () => void;
}

const INDICATOR_WIDTH = 24;

export const App: React.FC<AppProps> = ({ initialTask, onSubmit, onExit }) => {
  const { exit } = useApp();

  const [state, setState] = useState<AppState>(initialTask ? "running" : "input");
  const [taskInput, setTaskInput] = useState("");
  const [currentTask, setCurrentTask] = useState(initialTask || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const isRunning = state === "running";
  const indicatorPosition = useBouncingIndicator(INDICATOR_WIDTH, 50, isRunning);

  const hasInitialized = useRef(false);

  const handleEscape = useCallback(() => {
    onExit?.();
    exit();
  }, [onExit, exit]);

  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim()) return;

    setCurrentTask(value);
    setState("running");
    setOutput("");
    setTaskInput("");

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
  }, [onSubmit]);

  useInput(useCallback((input: string, key: { escape: boolean; ctrl: boolean; return: boolean }) => {
    if (state === "input") return;

    if (key.escape || (key.ctrl && input === "c")) {
      handleEscape();
    }

    if ((state === "complete" || state === "error") && key.return) {
      setOutput("");
      setError("");
      setTaskInput("");
      setState("input");
    }
  }, [state, handleEscape]));

  // Handle initial task on mount
  useEffect(() => {
    if (initialTask && !hasInitialized.current) {
      hasInitialized.current = true;
      handleSubmit(initialTask);
    }
  }, [initialTask, handleSubmit]);

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
            <Box marginTop={1} paddingLeft={3}>
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
            <Box marginTop={1} paddingLeft={3}>
              <MarkdownText>{output}</MarkdownText>
            </Box>
          )}
          <Box marginTop={1} paddingLeft={3}>
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
          <Box marginTop={1} paddingLeft={3}>
            <Text color={colors.error}>{error}</Text>
          </Box>
          <Box marginTop={1} paddingLeft={3}>
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
