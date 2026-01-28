import React, { useState, useCallback, memo } from "react";
import { Text, useInput } from "ink";
import { colors } from "../colors";
import { useCursorBlink } from "../hooks/useCursorBlink";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onEscape: () => void;
  isActive: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = memo(({
  value,
  onChange,
  onSubmit,
  onEscape,
  isActive
}) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const showCursor = useCursorBlink(530, isActive);

  const handleInput = useCallback((input: string, key: {
    escape: boolean;
    ctrl: boolean;
    meta: boolean;
    return: boolean;
    backspace: boolean;
    delete: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
  }) => {
    if (!isActive) return;

    if (key.escape || (key.ctrl && input === "c")) {
      onEscape();
      return;
    }

    if (key.return) {
      onSubmit(value);
      setCursorPosition(0);
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
      setCursorPosition((pos) => Math.max(0, pos - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition((pos) => Math.min(value.length, pos + 1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition + input.length);
    }
  }, [isActive, value, cursorPosition, onChange, onSubmit, onEscape]);

  useInput(handleInput);

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
});

PromptInput.displayName = "PromptInput";
