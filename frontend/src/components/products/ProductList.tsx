import React, { useState, useEffect } from 'react';
import { 
  Search, LayoutGrid, List, Package, ChevronLeft, ChevronRight, 
  Scale, Check, Copy, Info, Tag, ArrowUpDown, Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { ProductItem } from '../../types';

interface ProductListProps {
  onSelectProduct: (productId: string) => void;
  onCompareProducts: (productIds: string[]) => void;
}

interface CategoryTile {
  category: string;
  category_pt: string;
  sku_count: number;
  units_sold: number;
  total_revenue: number;
  avg_price: number;
}

export const ProductList: React.FC<ProductListProps> = ({
  onSelectProduct,
  onCompareProducts
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryTiles, setCategoryTiles] = useState<CategoryTile[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load category tiles once
  useEffect(() => {
    const fetchCategoryTiles = async () => {
      try {
        setLoadingCategories(true);
        const tiles = await api.getCategoryTiles();
        setCategoryTiles(tiles);
      } catch (err) {
        console.error('Failed to load category tiles:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategoryTiles();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        sort_by: sortBy,
        page,
        page_size: 12
      });
      setProducts(res.items);
      setTotalItems(res.total_items);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load product catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [page, category, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCatalog();
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCompare = (pid: string) => {
    if (selectedForCompare.includes(pid)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== pid));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare a maximum of 3 products at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, pid]);
    }
  };

  const formatDimensions = (p: ProductItem) => {
    if (p.length_cm && p.width_cm && p.height_cm) {
      return `${p.length_cm}×${p.width_cm}×${p.height_cm} cm`;
    }
    return 'Specs unrecorded';
  };

  return (
    <div className="space-y-6">
      {/* Quiet Header Notice */}
      <div className="bg-orange-500/10 border border-brand-orange/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-brand-orange dark:text-brand-neon">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Honest Catalog Standard:</strong> Source dataset contains no merchant product names. Items are labeled as <em>&lt;Category&gt; Item</em> with a unique short code chip. Click any code chip to copy its full UUID.
          </span>
        </div>
      </div>

      {/* Category-First Browsing Tiles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-bento-muted dark:text-bento-darkMuted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-orange" /> Browse by Top Categories
          </h3>
          {category !== 'all' && (
            <button
              onClick={() => { setCategory('all'); setPage(1); }}
              className="text-xs font-semibold text-brand-orange hover:text-brand-orangeDark transition-bento"
            >
              Reset to All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categoryTiles.slice(0, 6).map((c) => {
            const isSelected = category.toLowerCase() === c.category.toLowerCase() || category === c.category_pt;
            return (
              <button
                key={c.category}
                onClick={() => {
                  setCategory(isSelected ? 'all' : c.category);
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-bento flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-orange text-white border-brand-orange shadow-bento-hero'
                    : 'bg-bento-card dark:bg-bento-darkCard border-bento-border dark:border-bento-darkBorder hover:border-brand-orange/50 hover:shadow-bento-hover'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${isSelected ? 'text-white/80' : 'text-bento-muted dark:text-bento-darkMuted'}`}>
                    {c.sku_count.toLocaleString()} SKUs
                  </span>
                  <h4 className={`text-xs font-bold mt-0.5 truncate ${isSelected ? 'text-white' : 'text-bento-text dark:text-bento-darkText'}`}>
                    {c.category}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span className={isSelected ? 'text-white/90 font-semibold' : 'text-brand-orange dark:text-brand-neon font-bold'}>
                    R$ {(c.total_revenue / 1000).toFixed(0)}k
                  </span>
                  <span className={isSelected ? 'text-white/70' : 'text-bento-muted'}>
                    {c.units_sold.toLocaleString()} units
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-muted dark:text-bento-darkMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category, short code [E0D64F] or UUID..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 text-bento-text dark:text-bento-darkText focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          />
        </form>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-bento-text dark:text-bento-darkText focus:outline-none"
          >
            <option value="all">All Categories (73)</option>
            {categoryTiles.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.sku_count})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-bento-text dark:text-bento-darkText focus:outline-none"
          >
            <option value="revenue">Highest Revenue</option>
            <option value="best_selling">Most Units Sold</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
          </select>

          {/* Grid / Table toggle */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-bento ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 text-brand-orange shadow-sm' : 'text-neutral-400'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-bento ${viewMode === 'table' ? 'bg-white dark:bg-neutral-800 text-brand-orange shadow-sm' : 'text-neutral-400'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Compare Action Bar */}
      {selectedForCompare.length > 0 && (
        <div className="sticky top-20 z-20 bg-neutral-950 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-neutral-800 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-brand-orange" />
            <span>{selectedForCompare.length} of 3 SKUs selected for comparison</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => onCompareProducts(selectedForCompare)}
              className="text-xs font-semibold px-3 py-1.5 bg-brand-orange hover:bg-brand-orangeDark rounded-xl shadow transition-bento"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Copied Feedback Toast */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-brand-orange/40 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Copied full UUID to clipboard!</span>
        </div>
      )}

      {/* Zero results state */}
      {!loading && products.length === 0 && (
        <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-12 text-center border border-bento-border dark:border-bento-darkBorder space-y-3">
          <Package className="w-10 h-10 text-bento-muted mx-auto" />
          <h4 className="text-sm font-bold text-bento-text dark:text-bento-darkText">No items match your filter criteria</h4>
          <p className="text-xs text-bento-muted max-w-md mx-auto">
            Try clearing the search or category filter. You can search by short code (e.g. <code>e0d64f</code>) or browse top categories.
          </p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); setPage(1); }}
            className="px-4 py-2 bg-brand-orange hover:bg-brand-orangeDark text-white text-xs font-semibold rounded-xl shadow transition-bento"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isCompared = selectedForCompare.includes(p.product_id);
            const shortCode = p.product_id.slice(0, 6).toUpperCase();
            return (
              <div
                key={p.product_id}
                className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-bento-border dark:border-bento-darkBorder flex flex-col justify-between transition-bento hover:shadow-bento-hover hover:-translate-y-1 relative group"
              >
                {/* Compare Checkbox pill */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(p.product_id);
                  }}
                  className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-bento text-[10px] ${
                    isCompared
                      ? 'bg-brand-orange text-white shadow'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100'
                  }`}
                  title="Select to compare"
                >
                  {isCompared ? <Check className="w-3.5 h-3.5" /> : '+'}
                </button>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 text-brand-orange dark:text-brand-neon flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    {/* Short Code Chip with Copy Action */}
                    <button
                      onClick={(e) => copyToClipboard(p.product_id, e)}
                      className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-bento-muted dark:text-bento-darkMuted hover:text-brand-orange hover:bg-orange-500/10 transition-bento border border-neutral-200 dark:border-neutral-700"
                      title="Click to copy full UUID"
                    >
                      <span>[{shortCode}]</span>
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-bento-muted dark:text-bento-darkMuted">
                    {p.category}
                  </span>

                  <h4 
                    onClick={() => onSelectProduct(p.product_id)}
                    className="font-bold text-sm text-bento-text dark:text-bento-darkText mt-2 cursor-pointer hover:text-brand-orange transition-bento line-clamp-1"
                    title={p.title}
                  >
                    {p.title}
                  </h4>

                  {/* Physical Specs Subtitle */}
                  <p className="text-[11px] text-bento-muted dark:text-bento-darkMuted mt-1">
                    {p.weight_g ? `${(p.weight_g / 1000).toFixed(1)}kg` : 'Wt n/a'} · {formatDimensions(p)} · {p.photos_qty || 1} photo{p.photos_qty === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-bento-muted dark:text-bento-darkMuted block">Avg Unit Price</span>
                    <span className="text-sm font-bold font-mono text-bento-text dark:text-bento-darkText">
                      R$ {p.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectProduct(p.product_id)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-orange hover:text-white text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-bento"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-bento-border dark:border-bento-darkBorder overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-bento-muted dark:text-bento-darkMuted border-b border-neutral-100 dark:border-neutral-800">
                <th className="pb-3 font-semibold">Item & Short Code</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Physical Specs</th>
                <th className="pb-3 font-semibold">Avg Price</th>
                <th className="pb-3 font-semibold">Units Sold</th>
                <th className="pb-3 font-semibold">Revenue</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {products.map((p) => {
                const shortCode = p.product_id.slice(0, 6).toUpperCase();
                return (
                  <tr key={p.product_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 font-medium text-bento-text dark:text-bento-darkText">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => copyToClipboard(p.product_id, e)}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-bento-muted hover:text-brand-orange"
                          title="Click to copy full UUID"
                        >
                          [{shortCode}]
                        </button>
                        <span>{p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-bento-muted dark:text-bento-darkMuted">{p.category}</td>
                    <td className="py-3 text-bento-muted font-mono text-[11px]">{formatDimensions(p)}</td>
                    <td className="py-3 font-mono">R$ {p.price.toFixed(2)}</td>
                    <td className="py-3 font-mono">{p.units_sold.toLocaleString()}</td>
                    <td className="py-3 font-mono font-bold text-brand-orange dark:text-brand-neon">
                      R$ {p.total_revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectProduct(p.product_id)}
                        className="text-brand-orange dark:text-brand-neon hover:underline font-semibold"
                      >
                        View Live Stats
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-bento-muted dark:text-bento-darkMuted px-2">
        <span>
          Showing <b>{products.length}</b> of <b>{totalItems.toLocaleString()}</b> catalog items
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-bento-card dark:bg-bento-darkCard border border-bento-border dark:border-bento-darkBorder disabled:opacity-30 hover:bg-neutral-50 transition-bento"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-bento-card dark:bg-bento-darkCard border border-bento-border dark:border-bento-darkBorder disabled:opacity-30 hover:bg-neutral-50 transition-bento"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
