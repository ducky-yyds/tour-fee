import React from "react";
import { ArrowUpRight } from "lucide-react";
import "./source-references.css";

// These are editorial reading sources; price verification remains separate.
export default function SourceReferences({ references, excludeUrls = [] }) {
  const seen = new Set(excludeUrls.filter(Boolean));
  const sources = (Array.isArray(references) ? references : []).flatMap((source) => {
    try {
      const url = new URL(source?.url);
      if (!["https:", "http:"].includes(url.protocol) || seen.has(source.url)) return [];
      seen.add(source.url);
      return [{ ...source, name: source.name || url.hostname.replace(/^www\./, "") }];
    } catch {
      return [];
    }
  });
  if (!sources.length) return null;
  return (
    <div className="ch-reference-links">
      <span className="ch-reference-label">参考资料</span>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer"
              title={/^\d{4}-\d{2}-\d{2}/.test(source.checkedAt || "") ? `查阅于 ${source.checkedAt.slice(0, 10)}` : undefined}>
              <span>{source.name}</span><ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
