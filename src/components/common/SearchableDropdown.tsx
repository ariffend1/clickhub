import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Plus } from 'lucide-react';

export interface SearchableDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  onAddNew?: (query: string) => void;
  addNewLabel?: string;
  className?: string;
  emptyLabel?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  disabled = false,
  onAddNew,
  addNewLabel = '＋ Tambah Baru',
  className = '',
  emptyLabel = '-- Tidak Ada --',
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sublabel || '').toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setFocusIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  function handleToggle() {
    if (disabled) return;
    setOpen(prev => !prev);
    setQuery('');
    setFocusIndex(-1);
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setQuery('');
    setFocusIndex(-1);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') setOpen(true);
      return;
    }

    const totalItems = filtered.length + (onAddNew ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIndex >= 0 && focusIndex < filtered.length) {
        handleSelect(filtered[focusIndex].value);
      } else if (focusIndex === filtered.length && onAddNew) {
        onAddNew(query);
        setOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setFocusIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs text-left transition-colors outline-none
          ${disabled
            ? 'border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed'
            : open
              ? 'border-violet-500 bg-gray-950 text-white'
              : 'border-gray-800 bg-gray-950 text-white hover:border-gray-600'
          }`}
      >
        <span className={`truncate ${!selected ? 'text-gray-500' : 'text-white'}`}>
          {selected ? (
            <span className="flex flex-col leading-tight">
              <span>{selected.label}</span>
              {selected.sublabel && (
                <span className="text-[9px] text-gray-500 font-normal">{selected.sublabel}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Hapus"
            >
              <X size={10} />
            </span>
          )}
          <ChevronDown
            size={12}
            className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] rounded-xl border border-gray-700 bg-[#1e222b] shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
            <Search size={11} className="text-gray-500 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setFocusIndex(-1); }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-400">
                <X size={10} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {/* Empty placeholder option */}
            {!value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-800/40 transition-colors"
              >
                {emptyLabel}
              </button>
            )}

            {filtered.length === 0 && !onAddNew && (
              <p className="px-3 py-4 text-center text-xs text-gray-600">Tidak ditemukan</p>
            )}

            {filtered.map((option, idx) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col leading-tight
                  ${value === option.value
                    ? 'bg-violet-600/20 text-violet-300'
                    : focusIndex === idx
                      ? 'bg-gray-800/70 text-white'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`}
              >
                <span>{option.label}</span>
                {option.sublabel && (
                  <span className="text-[9px] text-gray-500 mt-0.5">{option.sublabel}</span>
                )}
              </button>
            ))}

            {/* Add New Option */}
            {onAddNew && (
              <button
                type="button"
                onClick={() => { onAddNew(query); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 border-t border-gray-800/60 mt-1 transition-colors
                  ${focusIndex === filtered.length
                    ? 'bg-gray-800/70 text-violet-300'
                    : 'text-violet-400 hover:bg-gray-800/50 hover:text-violet-300'
                  }`}
              >
                <Plus size={11} />
                {query ? `${addNewLabel}: "${query}"` : addNewLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
