import type { ReactNode } from "react";
import { focusRingClass } from "../styles/shared";

interface EventSummaryProps {
  summary: string;
  compact?: boolean;
}

type SummaryBlock =
  { type: "list"; items: string[] } | { type: "paragraph"; text: string };

function SummaryText({ text, compact }: { text: string; compact: boolean }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(
    /\[([^\]\r\n]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*\r\n]+)\*\*/gu,
  )) {
    parts.push(text.slice(cursor, match.index));
    const boldLabel = match[1]?.match(/^\*\*([^*]+)\*\*$/u)?.[1];
    const label = boldLabel ? (
      <strong key={match.index}>{boldLabel}</strong>
    ) : (
      match[1]
    );
    // Archive summaries live inside the card link, so they must stay text only.
    parts.push(
      match[3] ? (
        <strong key={match.index}>{match[3]}</strong>
      ) : compact ? (
        label
      ) : (
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={`[overflow-wrap:anywhere] text-blue-700 underline underline-offset-4 visited:text-purple-700 hover:text-blue-800 ${focusRingClass}`}
        >
          {label}
        </a>
      ),
    );
    cursor = match.index + match[0].length;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function getSummaryBlocks(summary: string): SummaryBlock[] {
  return summary
    .trim()
    .split(/(?:\r?\n){2,}/)
    .map((block) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim());
      const isList =
        lines.length >= 2 && lines.every((line) => /^[-*]\s+\S/.test(line));

      if (isList) {
        return {
          type: "list" as const,
          items: lines.map((line) => line.replace(/^[-*]\s+/, "")),
        };
      }

      return { type: "paragraph" as const, text: block };
    });
}

export function EventSummary({ summary, compact = false }: EventSummaryProps) {
  const blocks = getSummaryBlocks(summary);

  if (blocks.length === 1 && blocks[0].type === "list") {
    return (
      <ul
        className={`list-disc pl-5 text-left text-sm text-black ${compact ? "max-h-10 overflow-hidden leading-5" : "space-y-1 leading-relaxed"}`}
      >
        {blocks[0].items.map((item, index) => (
          <li key={`${index}-${item}`}>
            <SummaryText text={item} compact={compact} />
          </li>
        ))}
      </ul>
    );
  }

  if (!compact && blocks.length > 1) {
    return (
      <div className="grid gap-3 text-sm text-black">
        {blocks.map((block, blockIndex) =>
          block.type === "list" ? (
            <ul
              key={`list-${blockIndex}`}
              className="list-disc space-y-1 pl-5 text-left leading-relaxed"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>
                  <SummaryText text={item} compact={false} />
                </li>
              ))}
            </ul>
          ) : (
            <p
              key={`paragraph-${blockIndex}`}
              className="whitespace-pre-line leading-relaxed"
            >
              <SummaryText text={block.text} compact={false} />
            </p>
          ),
        )}
      </div>
    );
  }

  return (
    <p
      className={`${compact ? "line-clamp-2" : "whitespace-pre-line leading-relaxed"} text-sm text-black`}
    >
      <SummaryText
        text={blocks[0]?.type === "paragraph" ? blocks[0].text : summary}
        compact={compact}
      />
    </p>
  );
}
