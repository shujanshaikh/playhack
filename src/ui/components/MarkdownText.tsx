import React, { useMemo, memo } from "react";
import { Box, Text } from "ink";
import { marked, type Token, type Tokens } from "marked";
import { colors } from "../colors";

type InlineToken = Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Text | Tokens.Link | Tokens.Br;

const renderInlineTokens = (tokens: Token[] | undefined, keyPrefix: string): React.ReactNode[] => {
  if (!tokens) return [];

  return tokens.flatMap((t, i) => {
    const key = `${keyPrefix}-${i}`;

    switch (t.type) {
      case "strong":
        return <Text key={key} bold color={colors.text}>{(t as Tokens.Strong).text}</Text>;
      case "em":
        return <Text key={key} italic color={colors.muted}>{(t as Tokens.Em).text}</Text>;
      case "codespan":
        return <Text key={key} color={colors.accent}>{(t as Tokens.Codespan).text}</Text>;
      case "link":
        return <Text key={key} color={colors.accent} underline>{(t as Tokens.Link).text}</Text>;
      case "br":
        return <Text key={key}>{"\n"}</Text>;
      case "text": {
        const textToken = t as Tokens.Text;
        // Text tokens can have nested tokens for inline formatting
        if (textToken.tokens && textToken.tokens.length > 0) {
          return renderInlineTokens(textToken.tokens, key);
        }
        return <Text key={key} color={colors.text}>{textToken.text}</Text>;
      }
      default:
        if ("text" in t) {
          return <Text key={key} color={colors.text}>{(t as { text: string }).text}</Text>;
        }
        if ("raw" in t) {
          return <Text key={key} color={colors.text}>{(t as { raw: string }).raw}</Text>;
        }
        return null;
    }
  }).filter(Boolean);
};

const renderListItemContent = (item: Tokens.ListItem, keyPrefix: string): React.ReactNode[] => {
  // List items contain tokens that need to be flattened
  const results: React.ReactNode[] = [];

  item.tokens.forEach((token, i) => {
    const key = `${keyPrefix}-${i}`;

    if (token.type === "text") {
      const textToken = token as Tokens.Text;
      if (textToken.tokens && textToken.tokens.length > 0) {
        results.push(...renderInlineTokens(textToken.tokens, key));
      } else {
        results.push(<Text key={key} color={colors.text}>{textToken.text}</Text>);
      }
    } else if (token.type === "paragraph") {
      const paraToken = token as Tokens.Paragraph;
      if (paraToken.tokens) {
        results.push(...renderInlineTokens(paraToken.tokens, key));
      }
    } else {
      results.push(...renderInlineTokens([token], key));
    }
  });

  return results;
};

const renderToken = (token: Token, index: number): React.ReactNode => {
  switch (token.type) {
    case "heading": {
      const headingToken = token as Tokens.Heading;
      return (
        <Box key={index} marginTop={1}>
          <Text bold color={colors.text}>
            {renderInlineTokens(headingToken.tokens, `h-${index}`)}
          </Text>
        </Box>
      );
    }
    case "paragraph": {
      const paraToken = token as Tokens.Paragraph;
      return (
        <Box key={index} marginTop={1}>
          <Text color={colors.text}>
            {renderInlineTokens(paraToken.tokens, `p-${index}`)}
          </Text>
        </Box>
      );
    }
    case "code": {
      const codeToken = token as Tokens.Code;
      return (
        <Box key={index} marginTop={1} flexDirection="column">
          {codeToken.lang && <Text color={colors.muted}>{codeToken.lang}</Text>}
          <Text color={colors.accent}>{codeToken.text}</Text>
        </Box>
      );
    }
    case "list": {
      const listToken = token as Tokens.List;
      return (
        <Box key={index} flexDirection="column" marginTop={1}>
          {listToken.items.map((item, i) => (
            <Box key={i}>
              <Text color={colors.muted}>  · </Text>
              <Text color={colors.text}>
                {renderListItemContent(item, `li-${index}-${i}`)}
              </Text>
            </Box>
          ))}
        </Box>
      );
    }
    case "blockquote": {
      const bqToken = token as Tokens.Blockquote;
      return (
        <Box key={index} marginTop={1}>
          <Text color={colors.muted}>  │ </Text>
          <Text color={colors.muted}>
            {renderInlineTokens(bqToken.tokens, `bq-${index}`)}
          </Text>
        </Box>
      );
    }
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
