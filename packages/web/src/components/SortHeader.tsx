interface Props {
  col: string;
  label: string;
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  className?: string;
}

export function SortHeader({ col, label, sortCol, sortDir, onSort, className }: Props) {
  const active = sortCol === col;
  return (
    <th
      className={`py-2 pr-4 cursor-pointer select-none hover:text-eq-text whitespace-nowrap ${active ? 'text-eq-gold' : ''} ${className ?? ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="ml-1 text-[10px] opacity-60">
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );
}
