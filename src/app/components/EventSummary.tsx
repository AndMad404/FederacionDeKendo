interface EventSummaryProps {
  summary: string;
  compact?: boolean;
}

function getHyphenListItems(summary: string) {
  const lines = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || lines.some((line) => !/^-\s+\S/.test(line))) {
    return undefined;
  }

  return lines.map((line) => line.replace(/^-\s+/, ""));
}

export function EventSummary({ summary, compact = false }: EventSummaryProps) {
  const listItems = getHyphenListItems(summary);

  if (listItems) {
    return (
      <ul
        className={`list-disc pl-5 text-left text-sm text-site-muted ${compact ? "max-h-10 overflow-hidden leading-5" : "space-y-1 leading-relaxed"}`}
      >
        {listItems.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={`${compact ? "line-clamp-2" : "whitespace-pre-line leading-relaxed"} text-sm text-site-muted`}
    >
      {summary}
    </p>
  );
}
