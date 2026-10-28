import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Truck, Loader2 } from 'lucide-react';
import { OrderItem } from '../../types';
import { api } from '../../api/client';

interface RecentOrdersTableProps {
  orders: OrderItem[];
  onViewAll: () => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders: initialOrders, onViewAll }) => {
  const [statusFilter, setStatusFilter] = useState<'delivered' | 'all' | 'shipped' | 'canceled'>('delivered');
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  // Sync initial orders if delivered
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0 && statusFilter === 'delivered') {
      const hasDelivered = initialOrders.some((o) => o.status.toLowerCase() === 'delivered');
      if (hasDelivered) {
        setOrders(initialOrders.filter((o) => o.status.toLowerCase() === 'delivered'));
      } else {
        // Fetch delivered orders
        fetchOrders('delivered');
      }
    }
  }, [initialOrders]);

  const fetchOrders = async (status: 'delivered' | 'all' | 'shipped' | 'canceled') => {
    try {
      setLoading(true);
      const res = await api.getOrders({ 
        status: status === 'all' ? undefined : status, 
        page: 1, 
        page_size: 6 
      });
      setOrders(res.items);
    } catch (err) {
      console.error('Failed to filter orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newStatus: 'delivered' | 'all' | 'shipped' | 'canceled') => {
    setStatusFilter(newStatus);
    fetchOrders(newStatus);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-base text-bento-text dark:text-bento-darkText">
            Recent Order Velocity
          </h3>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">Live order ledger with PII masking</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg text-[11px] font-medium border border-neutral-200 dark:border-neutral-700/60">
            {(['delivered', 'all', 'shipped', 'canceled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className={`px-2 py-1 rounded-md transition-bento capitalize ${
                  statusFilter === s
                    ? 'bg-brand-orange text-white font-semibold shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-brand-orange hover:text-brand-orangeDark flex items-center gap-1 transition-bento ml-1"
          >
            Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[220px] relative">
        {loading ? (
          <div className="absolute inset-0 bg-bento-card/60 dark:bg-bento-darkCard/60 backdrop-blur-xs flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
          </div>
        ) : null}

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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-bento-muted text-xs">
                  No orders found for '{statusFilter}' status.
                </td>
              </tr>
            ) : (
              orders.slice(0, 6).map((o) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
