import React, { useState, useEffect } from 'react';
import { 
  Search, LayoutGrid, List, Filter, ArrowUpDown, 
  Package, ChevronLeft, ChevronRight, Scale, Check 
} from 'lucide-react';
import { api } from '../../api/client';
import { ProductItem } from '../../types';

interface ProductListProps {
  onSelectProduct: (productId: string) => void;
  onCompareProducts: (productIds: string[]) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onSelectProduct,
  onCompareProducts
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

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

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-white/70 dark:border-bento-darkBorder flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-bento-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKUs or categories..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 text-bento-text dark:text-bento-darkText focus:outline-none focus:ring-2 focus:ring-brand-indigo/30"
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
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-2.5 text-bento-text dark:text-bento-darkText focus:outline-none"
          >
            <option value="all">All Categories (73)</option>
            <option value="health_beauty">Health & Beauty</option>
            <option value="watches_gifts">Watches & Gifts</option>
            <option value="bed_bath_table">Bed Bath & Table</option>
            <option value="sports_leisure">Sports & Leisure</option>
            <option value="computers_accessories">Computers & Accessories</option>
            <option value="furniture_decor">Furniture & Decor</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-2.5 text-bento-text dark:text-bento-darkText focus:outline-none"
          >
            <option value="revenue">Highest Revenue</option>
            <option value="best_selling">Most Units Sold</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
          </select>

          {/* Grid / Table toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-bento ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-brand-indigo shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-bento ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-brand-indigo shadow-sm' : 'text-slate-400'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Compare Action Bar if selected */}
      {selectedForCompare.length > 0 && (
        <div className="sticky top-20 z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-brand-indigo" />
            <span>{selectedForCompare.length} of 3 SKUs selected for comparison</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => onCompareProducts(selectedForCompare)}
              className="text-xs font-semibold px-3 py-1.5 bg-brand-indigo hover:bg-brand-indigoDark rounded-xl shadow transition-bento"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isCompared = selectedForCompare.includes(p.product_id);
            return (
              <div
                key={p.product_id}
                className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-white/70 dark:border-bento-darkBorder flex flex-col justify-between transition-bento hover:shadow-bento-hover hover:-translate-y-1 relative group"
              >
                {/* Compare Checkbox pill */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(p.product_id);
                  }}
                  className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-bento text-[10px] ${
                    isCompared
                      ? 'bg-brand-indigo text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100'
                  }`}
                  title="Select to compare"
                >
                  {isCompared ? <Check className="w-3.5 h-3.5" /> : '+'}
                </button>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo flex items-center justify-center mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-bento-muted">
                    {p.category}
                  </span>
                  <h4 
                    onClick={() => onSelectProduct(p.product_id)}
                    className="font-bold text-sm text-bento-text dark:text-bento-darkText mt-2 cursor-pointer hover:text-brand-indigo transition-bento line-clamp-2"
                  >
                    {p.title}
                  </h4>
                  <p className="text-[11px] font-mono text-bento-muted mt-1">
                    SKU #{p.product_id.slice(0, 8)} • {p.weight_g}g
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-bento-muted block">Avg Price</span>
                    <span className="text-sm font-bold font-mono text-bento-text dark:text-bento-darkText">
                      R$ {p.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectProduct(p.product_id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-indigo hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-bento"
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
        <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-5 shadow-bento border border-white/70 dark:border-bento-darkBorder overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-bento-muted border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Units Sold</th>
                <th className="pb-3 font-semibold">Revenue</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => (
                <tr key={p.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 font-medium text-bento-text dark:text-bento-darkText">
                    {p.title}
                  </td>
                  <td className="py-3 text-bento-muted">{p.category}</td>
                  <td className="py-3 font-mono">R$ {p.price.toFixed(2)}</td>
                  <td className="py-3 font-mono">{p.units_sold.toLocaleString()}</td>
                  <td className="py-3 font-mono font-bold text-brand-indigo">
                    R$ {p.total_revenue.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectProduct(p.product_id)}
                      className="text-brand-indigo hover:underline font-semibold"
                    >
                      View Live Stats
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-bento-muted px-2">
        <span>
          Showing <b>{products.length}</b> of <b>{totalItems.toLocaleString()}</b> catalog SKUs
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-bento-card dark:bg-bento-darkCard border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-bento"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-bento-card dark:bg-bento-darkCard border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-bento"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
