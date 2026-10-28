import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react';
import { OrderItem } from '../../types';

interface RecentOrdersTableProps {
  orders: OrderItem[];
  onViewAll: () => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders, onViewAll }) => {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-2.5 h-2.5" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-brand-orange">
            <Truck className="w-2.5 h-2.5" /> Shipped
          </span>
        );
      case 'canceled':
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
            <XCircle className="w-2.5 h-2.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-400">
            <Clock className="w-2.5 h-2.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-6 shadow-bento border border-bento-border dark:border-bento-darkBorder">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Recent Order Velocity
          </h3>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">Live CockroachDB order ledger with PII masking</p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-bento"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-bento-muted dark:text-bento-darkMuted border-b border-neutral-100 dark:border-neutral-800">
              <th className="pb-3 font-semibold">Order ID</th>
              <th className="pb-3 font-semibold">Destination</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Items</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100/70 dark:divide-neutral-800/40">
            {orders.slice(0, 5).map((o) => (
              <tr key={o.order_id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-bento">
                <td className="py-3 font-mono text-bento-muted font-medium">{o.order_id}</td>
                <td className="py-3 font-medium text-bento-text dark:text-bento-darkText">
                  {o.city}, {o.state}
                </td>
                <td className="py-3 text-bento-muted font-mono">{o.purchased_at.slice(0, 10)}</td>
                <td className="py-3 font-mono">{o.items_count}</td>
                <td className="py-3">{getStatusBadge(o.status)}</td>
                <td className="py-3 font-mono font-bold text-right text-bento-text dark:text-bento-darkText">
                  R$ {o.total_value.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
