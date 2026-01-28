import React, { memo } from "react";
import { Text, useStdout } from "ink";
import { colors } from "../colors";

export const HorizontalRule: React.FC = memo(() => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;
  return <Text color={colors.border}>{"─".repeat(Math.max(width - 2, 40))}</Text>;
});

HorizontalRule.displayName = "HorizontalRule";
