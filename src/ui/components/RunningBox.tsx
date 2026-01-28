import React, { memo } from "react";
import { Box, Text } from "ink";
import { colors } from "../colors";

interface RunningBoxProps {
  task: string;
  indicatorPosition: number;
  indicatorWidth: number;
}

export const RunningBox: React.FC<RunningBoxProps> = memo(({
  task,
  indicatorPosition,
  indicatorWidth
}) => {
  const bar = Array.from({ length: indicatorWidth }, (_, i) =>
    i === indicatorPosition ? "●" : "·"
  ).join("");

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.muted}>› </Text>
        <Text color={colors.text}>{task}</Text>
      </Box>
      <Box marginTop={0}>
        <Text color={colors.muted}>  </Text>
        <Text color={colors.accent}>{bar}</Text>
      </Box>
    </Box>
  );
});

RunningBox.displayName = "RunningBox";
