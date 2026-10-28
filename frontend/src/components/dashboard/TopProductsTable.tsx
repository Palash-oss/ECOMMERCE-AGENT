import React, { useState } from 'react';
import { ArrowUpRight, Package, ExternalLink, Copy, Check } from 'lucide-react';
import { ProductItem } from '../../types';

interface TopProductsTableProps {
  products: ProductItem[];
  onSelectProduct: (productId: string) => void;
  onViewAll: () => void;
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({
  products,
  onSelectProduct,
  onViewAll
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Top Performing Catalog Items
          </h3>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">
            Ranked by gross merchandise volume (delivered order items)
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-bento"
        >
          View All Items <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-bento-muted dark:text-bento-darkMuted border-b border-neutral-100 dark:border-neutral-800">
              <th className="pb-3 font-semibold">Item & Code</th>
              <th className="pb-3 font-semibold">Category</th>
              <th className="pb-3 font-semibold">Avg Price</th>
              <th className="pb-3 font-semibold">Units Sold</th>
              <th className="pb-3 font-semibold text-right">Revenue</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100/70 dark:divide-neutral-800/40">
            {products.slice(0, 5).map((p) => {
              const shortCode = p.product_id.slice(0, 6).toUpperCase();
              return (
                <tr key={p.product_id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-bento">
                  <td className="py-3 font-medium text-bento-text dark:text-bento-darkText">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-brand-orange flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <button
                        onClick={(e) => copyToClipboard(p.product_id, e)}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-bento-muted hover:text-brand-orange flex items-center gap-1"
                        title="Click to copy full UUID"
                      >
                        [{shortCode}]
                        {copiedId === p.product_id ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2 h-2" />}
                      </button>
                      <span className="truncate max-w-[150px] font-semibold">{p.title}</span>
                    </div>
                  </td>
                  <td className="py-3 text-bento-muted dark:text-bento-darkMuted truncate max-w-[110px]">{p.category}</td>
                  <td className="py-3 font-mono font-medium">R$ {p.price.toFixed(2)}</td>
                  <td className="py-3 font-mono">{p.units_sold.toLocaleString()}</td>
                  <td className="py-3 font-mono font-bold text-right text-brand-orange dark:text-brand-neon">
                    R$ {p.total_revenue.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectProduct(p.product_id)}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-brand-orange transition-bento"
                      title="View live stats"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
