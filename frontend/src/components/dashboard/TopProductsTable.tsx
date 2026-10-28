import React from 'react';
import { ArrowUpRight, Package, ExternalLink } from 'lucide-react';
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
  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-white/70 dark:border-bento-darkBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Top Performing SKUs
          </h3>
          <p className="text-xs text-bento-muted mt-0.5">Highest commercial velocity products in catalog</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-indigo hover:text-brand-indigoDark flex items-center gap-1 transition-bento"
        >
          View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-bento-muted border-b border-slate-100 dark:border-slate-800">
              <th className="pb-3 font-semibold">SKU Title</th>
              <th className="pb-3 font-semibold">Category</th>
              <th className="pb-3 font-semibold">Price</th>
              <th className="pb-3 font-semibold">Units Sold</th>
              <th className="pb-3 font-semibold text-right">Revenue</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/40">
            {products.slice(0, 5).map((p) => (
              <tr key={p.product_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-bento">
                <td className="py-3 font-medium text-bento-text dark:text-bento-darkText">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-brand-indigo flex-shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate max-w-[140px]">{p.title}</span>
                  </div>
                </td>
                <td className="py-3 text-bento-muted truncate max-w-[110px]">{p.category}</td>
                <td className="py-3 font-mono font-medium">R$ {p.price.toFixed(2)}</td>
                <td className="py-3 font-mono">{p.units_sold.toLocaleString()}</td>
                <td className="py-3 font-mono font-bold text-right text-brand-indigo">
                  R$ {p.total_revenue.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onSelectProduct(p.product_id)}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-indigo transition-bento"
                    title="View live stats"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
