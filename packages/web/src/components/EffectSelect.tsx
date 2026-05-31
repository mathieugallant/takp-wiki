import { useState, useRef, useEffect } from 'react';
import { EFFECT_OPTIONS, EFFECT_LABELS } from '../effectLabels.js';

interface Props {
  value: string;        // effect ID as string, or '' for none
  onChange: (id: string) => void;
}

export function EffectSelect({ value, onChange }: Props) {
  const [inputText, setInputText] = useState(() =>
    value ? (EFFECT_LABELS[Number(value)] ?? '') : ''
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep input text in sync when external value changes (e.g. clearing filters)
  useEffect(() => {
    setInputText(value ? (EFFECT_LABELS[Number(value)] ?? '') : '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = EFFECT_OPTIONS.filter(([, name]) =>
    name.toLowerCase().includes(inputText.toLowerCase())
  );

  function select(id: number, name: string) {
    setInputText(name);
    onChange(String(id));
    setOpen(false);
  }

  function handleInput(text: string) {
    setInputText(text);
    onChange('');   // clear selection when typing
    setOpen(true);
  }

  function handleClear() {
    setInputText('');
    onChange('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={inputText}
          placeholder="Any effect…"
          onFocus={() => setOpen(true)}
          onChange={(e) => handleInput(e.target.value)}
          className="bg-eq-dark border border-eq-border rounded px-2 py-0.5 text-eq-text text-sm w-44"
        />
        {(inputText || value) && (
          <button
            onClick={handleClear}
            className="text-eq-muted hover:text-eq-text text-xs leading-none"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-56 overflow-y-auto bg-eq-dark border border-eq-border rounded shadow-lg text-sm">
          {filtered.slice(0, 50).map(([id, name]) => (
            <li
              key={id}
              onMouseDown={() => select(id, name)}
              className={`px-3 py-1 cursor-pointer hover:bg-eq-panel/60 ${String(id) === value ? 'text-eq-gold' : 'text-eq-text'}`}
            >
              {name}
            </li>
          ))}
          {filtered.length > 50 && (
            <li className="px-3 py-1 text-eq-muted text-xs">
              {filtered.length - 50} more — keep typing to narrow
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
