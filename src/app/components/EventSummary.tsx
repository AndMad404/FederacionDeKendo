interface EventSummaryProps {
  summary: string;
  compact?: boolean;
}

type SummaryBlock =
  { type: "list"; items: string[] } | { type: "paragraph"; text: string };

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
        className={`list-disc pl-5 text-left text-sm text-site-muted ${compact ? "max-h-10 overflow-hidden leading-5" : "space-y-1 leading-relaxed"}`}
      >
        {blocks[0].items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    );
  }

  if (!compact && blocks.length > 1) {
    return (
      <div className="grid gap-3 text-sm text-site-muted">
        {blocks.map((block, blockIndex) =>
          block.type === "list" ? (
            <ul
              key={`list-${blockIndex}`}
              className="list-disc space-y-1 pl-5 text-left leading-relaxed"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p
              key={`paragraph-${blockIndex}`}
              className="whitespace-pre-line leading-relaxed"
            >
              {block.text}
            </p>
          ),
        )}
      </div>
    );
  }

  return (
    <p
      className={`${compact ? "line-clamp-2" : "whitespace-pre-line leading-relaxed"} text-sm text-site-muted`}
    >
      {blocks[0]?.type === "paragraph" ? blocks[0].text : summary}
    </p>
  );
}
