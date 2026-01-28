import React, { useMemo, memo } from "react";
import { Box, Text } from "ink";
import { marked, type Token, type Tokens } from "marked";
import { colors } from "../colors";

type InlineToken = Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Text | Tokens.Link | Tokens.Br;

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

interface MarkdownTextProps {
  children: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = memo(({ children }) => {
  const renderedTokens = useMemo(() => {
    const tokens = marked.lexer(children);
    return tokens.map(renderToken);
  }, [children]);

  return <Box flexDirection="column">{renderedTokens}</Box>;
});

MarkdownText.displayName = "MarkdownText";
