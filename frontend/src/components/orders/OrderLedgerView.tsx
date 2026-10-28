import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Truck, XCircle, Clock, AlertTriangle, 
  Search, Copy, Check, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Loader2, RotateCcw, PackageCheck 
} from 'lucide-react';
import { OrderItem } from '../../types';
import { api } from '../../api/client';

export const OrderLedgerView: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalItems, setTotalItems] = useState<number>(99441);
  const [totalPages, setTotalPages] = useState<number>(6630);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 99441,
    delivered: 96478,
    shipped: 1107,
    canceled: 625,
    unavailable: 609,
    invoiced: 314,
    processing: 301
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        page,
        page_size: pageSize
      });

      setOrders(res.items);
      setTotalItems(res.total_items);
      setTotalPages(res.total_pages || Math.ceil(res.total_items / pageSize));

      if (res.status_counts) {
        setStatusCounts(res.status_counts);
      }
    } catch (err) {
      console.error('Failed to load orders ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, debouncedSearch, page, pageSize]);

  const handleCopy = (id: string, rawId: string) => {
    navigator.clipboard.writeText(rawId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-brand-orange dark:text-orange-400 border border-orange-500/20">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Canceled
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Unavailable
          </span>
        );
      case 'invoiced':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-500/10 text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Orders', count: statusCounts.all || 99441 },
    { id: 'delivered', label: 'Delivered', count: statusCounts.delivered || 96478 },
    { id: 'shipped', label: 'Shipped', count: statusCounts.shipped || 1107 },
    { id: 'canceled', label: 'Canceled', count: statusCounts.canceled || 625 },
    { id: 'unavailable', label: 'Unavailable', count: statusCounts.unavailable || 609 },
    { id: 'invoiced', label: 'Invoiced', count: statusCounts.invoiced || 314 },
    { id: 'processing', label: 'Processing', count: statusCounts.processing || 301 },
  ];

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-bento-text dark:text-bento-darkText flex items-center gap-2">
            Enterprise Order Ledger
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Audited 99,441 Orders
            </span>
          </h2>
          <p className="text-xs text-bento-muted dark:text-bento-darkMuted mt-0.5">
            Complete lifecycle reconciliation across Brazilian federative states with customer payment integrity
          </p>
        </div>

        <button
          onClick={() => {
            setStatusFilter('all');
            setSearchTerm('');
            setPage(1);
          }}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bento-card dark:bg-bento-darkCard border border-bento-border dark:border-bento-darkBorder text-xs font-semibold text-bento-muted hover:text-brand-orange transition-bento shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-bento-card dark:bg-bento-darkCard rounded-2xl p-4 shadow-bento border border-bento-border dark:border-bento-darkBorder">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bento-muted block">Total Orders</span>
          <span className="text-lg font-bold font-mono text-bento-text dark:text-bento-darkText mt-0.5 block">
            {(statusCounts.all || 99441).toLocaleString()}
          </span>
          <span className="text-[10px] text-bento-muted">100% Brazilian volume</span>
        </div>

        <div className="bg-bento-card dark:bg-bento-darkCard rounded-2xl p-4 shadow-bento border border-bento-border dark:border-bento-darkBorder">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Delivered Orders</span>
          <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {(statusCounts.delivered || 96478).toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">97.02% fulfillment rate</span>
        </div>

        <div className="bg-bento-card dark:bg-bento-darkCard rounded-2xl p-4 shadow-bento border border-bento-border dark:border-bento-darkBorder">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange block">In-Transit / Shipped</span>
          <span className="text-lg font-bold font-mono text-brand-orange mt-0.5 block">
            {(statusCounts.shipped || 1107).toLocaleString()}
          </span>
          <span className="text-[10px] text-orange-500/80 font-medium">1.11% carrier turnaround</span>
        </div>

        <div className="bg-bento-card dark:bg-bento-darkCard rounded-2xl p-4 shadow-bento border border-bento-border dark:border-bento-darkBorder">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">Canceled Orders</span>
          <span className="text-lg font-bold font-mono text-rose-500 mt-0.5 block">
            {(statusCounts.canceled || 625).toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-500/80 font-medium">0.63% cancellation friction</span>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento shadow-bento border border-bento-border dark:border-bento-darkBorder p-5 sm:p-6 space-y-4">
        
        {/* Status Filter Tabs & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Scrollable Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-bento font-semibold text-xs border ${
                    isActive
                      ? 'bg-brand-orange text-white border-brand-orange shadow-bento-hero'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 text-bento-muted hover:text-bento-text border-neutral-200 dark:border-neutral-700/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {tab.count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Page Size Selector */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search Order ID, City, State..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-bento-text dark:text-bento-darkText placeholder-neutral-400 focus:outline-none focus:border-brand-orange transition-bento"
              />
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 text-bento-text dark:text-bento-darkText focus:outline-none focus:border-brand-orange transition-bento font-medium"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto min-h-[360px] relative rounded-xl border border-neutral-100 dark:border-neutral-800">
          {loading && (
            <div className="absolute inset-0 bg-bento-card/70 dark:bg-bento-darkCard/70 backdrop-blur-xs flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-brand-orange font-bold text-xs bg-white dark:bg-neutral-800 px-4 py-2.5 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Querying verified orders...</span>
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800 text-bento-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Destination City / State</th>
                <th className="py-3 px-4 font-semibold">Purchased Date</th>
                <th className="py-3 px-4 font-semibold text-center">Items</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/70 dark:divide-neutral-800/40">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-bento-muted">
                    <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-brand-orange" />
                    <p className="font-semibold text-sm">No orders found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search query or selecting a different status tab.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isCopied = copiedId === o.order_id;
                  return (
                    <tr 
                      key={o.raw_order_id} 
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-bento-text dark:text-bento-darkText">
                            {o.order_id}
                          </span>
                          <button
                            onClick={() => handleCopy(o.order_id, o.raw_order_id)}
                            className="p-1 rounded text-neutral-400 hover:text-brand-orange transition-colors"
                            title="Copy full UUID"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-bento-text dark:text-bento-darkText">
                          {o.city || 'Unknown City'}
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {o.state || 'BR'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                        {o.purchased_at ? o.purchased_at.slice(0, 10) : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {o.items_count}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(o.status)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-bento-text dark:text-bento-darkText">
                        R$ {o.total_value.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-bento-muted">
          <div>
            Showing <b className="text-bento-text dark:text-bento-darkText">{startIndex.toLocaleString()}</b> to{' '}
            <b className="text-bento-text dark:text-bento-darkText">{endIndex.toLocaleString()}</b> of{' '}
            <b className="text-bento-text dark:text-bento-darkText">{totalItems.toLocaleString()}</b> orders
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-bento"
              title="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-bento flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-mono text-[11px] font-semibold text-bento-text dark:text-bento-darkText">
              Page {page.toLocaleString()} of {totalPages.toLocaleString()}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-bento flex items-center gap-1 font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-bento"
              title="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
