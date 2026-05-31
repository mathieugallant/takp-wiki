import { useState } from 'react';

interface RelatedListProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
  defaultOpen?: boolean;
}

export function RelatedList<T>({
  title,
  items,
  renderItem,
  emptyText = 'None',
  defaultOpen = true,
}: RelatedListProps<T>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-eq-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center px-4 py-2 bg-eq-panel text-left text-eq-gold font-semibold text-sm hover:bg-eq-border/40 transition-colors"
      >
        <span>
          {title}
          <span className="ml-2 text-eq-muted font-normal">({items.length})</span>
        </span>
        <span className="text-eq-muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-3">
          {items.length === 0 ? (
            <p className="text-eq-muted text-sm">{emptyText}</p>
          ) : (
            <ul className="space-y-1">{items.map((item, i) => renderItem(item, i))}</ul>
          )}
        </div>
      )}
    </section>
  );
}
