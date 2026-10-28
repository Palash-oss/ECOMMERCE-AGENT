import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ArrowRight, CornerDownLeft, X } from 'lucide-react';
import { api } from '../../api/client';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search (250ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.searchSuggestions(query);
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectProduct(results[selectedIndex].product_id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div 
        className="w-full max-w-2xl bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-2xl border border-white/60 dark:border-bento-darkBorder overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-indigo" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU ID, category (e.g. watches, health, beauty)..."
            className="flex-1 bg-transparent text-sm text-bento-text dark:text-bento-darkText focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="p-6 text-center text-xs text-bento-muted">
              Querying live CockroachDB catalog...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-bento-muted">
              No matching SKUs found in database for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-xs text-bento-muted">
              Type at least 2 characters to trigger live database suggestions.
            </div>
          )}

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.product_id}
                onClick={() => {
                  onSelectProduct(item.product_id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-bento text-xs ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-bento-text dark:text-bento-darkText'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-indigo flex-shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
                    <p className="text-[11px] text-bento-muted font-mono">
                      Category: {item.category} • {item.total_sales} sold
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono font-bold">R$ {item.price.toFixed(2)}</span>
                  {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-brand-indigo" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Keyboard helper footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-bento-muted">
          <span>Navigate with <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">↑</kbd> <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">↓</kbd></span>
          <span>Select with <kbd className="px-1 bg-white dark:bg-slate-800 rounded border">Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};
