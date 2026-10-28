import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, TrendingUp, Package, Star, 
  Layers, ShoppingBag, Truck, Loader2, Copy, Check 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';
import { api } from '../../api/client';
import { ProductDetail } from '../../types';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
  onAskAi: (prompt: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
  onAskAi
}) => {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!productId) {
      setDetail(null);
      return;
    }
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await api.getProductDetail(productId);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  if (!productId) return null;

  const shortCode = productId.slice(0, 6).toUpperCase();

  const copyFullUuid = () => {
    navigator.clipboard.writeText(productId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-6 md:p-12 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-2xl border border-bento-border dark:border-bento-darkBorder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-orange dark:text-brand-neon flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-brand-orange dark:text-brand-neon">
                  {detail?.category || 'Catalog SKU'}
                </span>
                <button
                  onClick={copyFullUuid}
                  className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-bento-muted hover:text-brand-orange border border-neutral-200 dark:border-neutral-700"
                  title="Click to copy full UUID"
                >
                  <span>[{shortCode}]</span>
                  {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                  {detail?.velocity_tier}
                </span>
              </div>
              <h3 className="font-bold text-lg text-bento-text dark:text-bento-darkText mt-1">
                {detail?.title || `${detail?.category || 'Catalog'} Item [${shortCode}]`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAskAi(`Analyze sales velocity, review sentiment, and recommendations for product SKU ${productId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orangeDark text-white text-xs font-semibold shadow-bento-hero transition-bento"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI About This SKU</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading || !detail ? (
          <div className="p-12 text-center text-xs text-bento-muted flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
            <span>Querying live CockroachDB order items and review logs...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-bold uppercase tracking-wider block">Total Revenue</span>
                <span className="text-lg font-bold font-mono text-brand-orange dark:text-brand-neon mt-0.5 block">
                  R$ {detail.total_revenue.toLocaleString()}
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-bold uppercase tracking-wider block">Units Fulfilled</span>
                <span className="text-lg font-bold font-mono text-bento-text dark:text-bento-darkText mt-0.5 block">
                  {detail.units_sold.toLocaleString()}
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-bold uppercase tracking-wider block">Average Price</span>
                <span className="text-lg font-bold font-mono text-bento-text dark:text-bento-darkText mt-0.5 block">
                  R$ {detail.avg_price.toFixed(2)}
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-bold uppercase tracking-wider block">Category Rank</span>
                <span className="text-lg font-bold font-mono text-amber-500 mt-0.5 block">
                  #{detail.category_rank}
                </span>
              </div>
            </div>

            {/* Sales Velocity Monthly Trend */}
            <div>
              <h4 className="text-xs font-bold text-bento-muted dark:text-bento-darkMuted uppercase tracking-wider mb-2">
                Sales Velocity History (Monthly Orders)
              </h4>
              <div className="w-full h-44 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detail.monthly_trend}>
                    <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(v) => [`${v} units`, 'Sold']}
                      contentStyle={{ backgroundColor: '#121214', borderRadius: '12px', border: '1px solid #26262B', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="units" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Frequently Bought Together & Real Customer Reviews in 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Frequently Bought Together */}
              <div className="bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-bento-text dark:text-bento-darkText mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-orange" /> Frequently Bought Together
                </h4>
                {detail.frequently_bought_together.length === 0 ? (
                  <p className="text-xs text-bento-muted">No co-occurring items in multi-item baskets.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.frequently_bought_together.map((fbt) => (
                      <div key={fbt.product_id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[170px] text-neutral-700 dark:text-neutral-300 font-medium">
                          {fbt.title}
                        </span>
                        <span className="font-mono text-bento-muted text-[11px]">
                          {fbt.co_occurrence_count} bundles
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Customer Reviews */}
              <div className="bg-neutral-50 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-bold text-bento-text dark:text-bento-darkText mb-2.5 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Verified Customer Reviews
                </h4>
                {detail.recent_reviews.length === 0 ? (
                  <p className="text-xs text-bento-muted">No textual review comments logged for this SKU.</p>
                ) : (
                  <div className="space-y-2.5">
                    {detail.recent_reviews.slice(0, 3).map((rev, i) => (
                      <div key={i} className="text-xs border-b border-neutral-200/50 dark:border-neutral-800/60 pb-2 last:border-none">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-amber-500">{'★'.repeat(rev.score)}</span>
                          <span className="text-[10px] text-bento-muted font-mono">{rev.date}</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 text-[11px] mt-0.5 line-clamp-2">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
