import React, { memo } from "react";
import { Box, Text, useStdout } from "ink";
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
});

RunningBox.displayName = "RunningBox";
