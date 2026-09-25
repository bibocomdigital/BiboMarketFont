import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return <strong key={index} className="font-semibold">{bold[1]}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function previewMessage(content: string, maxLength = 72): string {
  const plain = content
    .replace(/\*\*/g, "")
    .replace(/[_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function MessageBody({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 ? "\n" : null}
          {line.length ? renderInline(line) : " "}
        </React.Fragment>
      ))}
    </div>
  );
}
