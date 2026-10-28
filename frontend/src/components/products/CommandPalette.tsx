import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Package, ArrowRight, CornerDownLeft, X, Sparkles, 
  Tag, Compass, FileText, ShoppingCart, LayoutDashboard 
} from 'lucide-react';
import { api } from '../../api/client';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onAskAiPrompt?: (prompt: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onNavigateTab,
  onAskAiPrompt
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickNav = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Browse Catalog SKUs', icon: Package },
    { id: 'orders', label: 'View Customer Orders', icon: ShoppingCart },
  ];

  const quickAiPrompts = [
    'Analyze sales velocity across top 5 categories',
    'Which states have the highest freight overhead?',
    'Explain the 3.00% repeat buyer rate and customer retention'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div 
        className="w-full max-w-2xl bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-2xl border border-bento-border dark:border-bento-darkBorder overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-bento-border dark:border-bento-darkBorder flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-orange" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, categories, or ask AI (e.g. watches, repeat buyers)..."
            className="flex-1 bg-transparent text-sm text-bento-text dark:text-bento-darkText focus:outline-none placeholder:text-bento-muted"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          
          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-2 p-2">
              <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
              <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
            </div>
          )}

          {/* Database Items Results */}
          {!loading && results.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-bento-muted dark:text-bento-darkMuted px-2 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-orange" /> Catalog Items ({results.length})
              </p>
              <div className="space-y-1">
                {results.map((item) => {
                  const shortCode = item.product_id.slice(0, 6).toUpperCase();
                  return (
                    <div
                      key={item.product_id}
                      onClick={() => {
                        onSelectProduct(item.product_id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-bento-text dark:text-bento-darkText transition-bento group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-brand-orange font-bold">
                          [{shortCode}]
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate group-hover:text-brand-orange transition-bento">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-bento-muted dark:text-bento-darkMuted font-mono">
                            {item.category} · {item.total_sales} sold
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                        <span className="font-mono font-bold">R$ {item.price.toFixed(2)}</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand-orange" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zero results feedback */}
          {!loading && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-bento-muted dark:text-bento-darkMuted">
              No matching SKUs found for "{query}". You can ask the AI agent below:
            </div>
          )}

          {/* Ask AI Agent Section */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-bento-muted dark:text-bento-darkMuted px-2 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" /> Ask AI Agent
            </p>
            <div className="space-y-1">
              {(query ? [query] : quickAiPrompts).map((prompt, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (onAskAiPrompt) onAskAiPrompt(prompt);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-orange-500/10 hover:text-brand-orange transition-bento text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation Pages */}
          {!query && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-bento-muted dark:text-bento-darkMuted px-2 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-brand-orange" /> Quick Navigation
              </p>
              <div className="grid grid-cols-3 gap-2">
                {quickNav.map((nav) => {
                  const Icon = nav.icon;
                  return (
                    <button
                      key={nav.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab(nav.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-bento-border dark:border-bento-darkBorder hover:border-brand-orange/40 hover:text-brand-orange text-left text-xs font-semibold flex items-center gap-2 transition-bento"
                    >
                      <Icon className="w-3.5 h-3.5 text-brand-orange" />
                      <span className="truncate">{nav.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Keyboard helper footer */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-t border-bento-border dark:border-bento-darkBorder flex items-center justify-between text-[11px] text-bento-muted">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono">↓</kbd></span>
          <span>Open with <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono">Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};
