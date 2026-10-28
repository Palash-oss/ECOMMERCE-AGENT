import React, { useState, useEffect } from 'react';
import { X, Scale, Package, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { ProductDetail } from '../../types';

interface ProductCompareModalProps {
  productIds: string[];
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  productIds,
  onClose,
  onSelectProduct
}) => {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length < 2) return;
    const fetchCompare = async () => {
      try {
        setLoading(true);
        const data = await api.compareProducts(productIds);
        setProducts(data);
      } catch (err) {
        console.error('Failed to compare products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, [productIds]);

  if (productIds.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-6 md:p-12 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-2xl border border-bento-border dark:border-bento-darkBorder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-bento-border dark:border-bento-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
                Side-by-Side SKU Comparison
              </h3>
              <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">Comparing {productIds.length} catalog items across sales velocity and margins</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-16 text-center text-xs text-bento-muted flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-indigo" />
            <span>Calculating comparative metrics...</span>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div 
                  key={p.product_id}
                  className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-indigo/10 text-brand-indigo">
                      {p.category}
                    </span>
                    <h4 className="font-bold text-sm text-bento-text dark:text-bento-darkText mt-2 line-clamp-2">
                      {p.title}
                    </h4>
                    <p className="text-[11px] font-mono text-bento-muted mt-1">
                      SKU #{p.product_id.slice(0, 8)}
                    </p>

                    {/* Metric Spec Rows */}
                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Total Revenue:</span>
                        <span className="font-mono font-bold text-brand-indigo">
                          R$ {p.total_revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Units Sold:</span>
                        <span className="font-mono font-bold text-bento-text dark:text-bento-darkText">
                          {p.units_sold.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Average Price:</span>
                        <span className="font-mono font-bold">R$ {p.avg_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Category Rank:</span>
                        <span className="font-mono font-bold text-amber-500">#{p.category_rank}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Demand Tier:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {p.velocity_tier}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-bento-muted">Dimensions:</span>
                        <span className="font-mono text-[11px]">{p.dimensions}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onSelectProduct(p.product_id);
                    }}
                    className="w-full mt-5 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-brand-indigo hover:text-white border border-slate-200 dark:border-slate-600 text-xs font-semibold transition-bento"
                  >
                    View Deep Telemetry
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
