import React from 'react';

type StatValue = string | number | boolean | null | undefined | React.ReactElement;

interface StatBlockProps {
  rows: Array<{ label: string; value: StatValue } | null>;
}

function renderValue(v: StatValue): React.ReactNode {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (React.isValidElement(v)) return v;
  return String(v);
}

export function StatBlock({ rows }: StatBlockProps) {
  const filtered = rows.filter((r): r is { label: string; value: StatValue } => r !== null);
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
      {filtered.map((r, i) => (
        <div key={i} className="flex gap-2">
          <dt className="text-eq-muted min-w-[7rem] shrink-0">{r.label}:</dt>
          <dd className="text-eq-text">{renderValue(r.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
