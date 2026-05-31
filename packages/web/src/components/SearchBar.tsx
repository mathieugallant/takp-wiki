import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBar({ initialValue = '', autoFocus, placeholder = 'Search NPCs, items, spells, zones…' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-eq-panel border border-eq-border rounded px-3 py-2 text-eq-text placeholder:text-eq-muted focus:outline-none focus:border-eq-accent text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-eq-accent/20 border border-eq-accent text-eq-accent rounded text-sm hover:bg-eq-accent/30 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
