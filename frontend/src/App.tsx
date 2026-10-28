import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { KpiCard } from './components/dashboard/KpiCard';
import { CustomerHabitsChart } from './components/dashboard/CustomerHabitsChart';
import { CategoryDonutChart } from './components/dashboard/CategoryDonutChart';
import { GeoGrowthChart } from './components/dashboard/GeoGrowthChart';
import { TopProductsTable } from './components/dashboard/TopProductsTable';
import { RecentOrdersTable } from './components/dashboard/RecentOrdersTable';
import { ExecutiveSummaryCard } from './components/dashboard/ExecutiveSummaryCard';
import { AiQuickBox } from './components/agent/AiQuickBox';
import { AiChatPanel } from './components/agent/AiChatPanel';
import { UsageDrawer } from './components/agent/UsageDrawer';
import { CommandPalette } from './components/products/CommandPalette';
import { ProductList } from './components/products/ProductList';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { ProductCompareModal } from './components/products/ProductCompareModal';
import { api } from './api/client';
import { 
  OverviewKpis, TimeseriesPoint, CategoryBreakdown, GeoRegion, 
  ProductItem, OrderItem, AiUsageStats, ExecutiveSummary 
} from './types';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Data states
  const [kpis, setKpis] = useState<OverviewKpis | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [geo, setGeo] = useState<GeoRegion[]>([]);
  const [topProducts, setTopProducts] = useState<ProductItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageStats | null>(null);
  const [aiSummary, setAiSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUsageDrawerOpen, setIsUsageDrawerOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Global dark mode class sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [kpiRes, tsRes, catRes, geoRes, prodRes, ordRes, sumRes, usageRes] = await Promise.all([
          api.getKpis(),
          api.getTimeseries('month'),
          api.getCategories(6),
          api.getGeo(5),
          api.getProducts({ sort_by: 'revenue', page: 1, page_size: 5 }),
          api.getOrders({ page: 1, page_size: 5 }),
          api.getAiSummary(),
          api.getAiUsage()
        ]);
        setKpis(kpiRes);
        setTimeseries(tsRes);
        setCategories(catRes);
        setGeo(geoRes);
        setTopProducts(prodRes.items);
        setRecentOrders(ordRes.items);
        setAiSummary(sumRes);
        setAiUsage(usageRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Poll AI usage every 15 seconds
    const interval = setInterval(async () => {
      try {
        const u = await api.getAiUsage();
        setAiUsage(u);
      } catch {
        // Silent poll error catch
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenAiWithPrompt = (prompt: string) => {
    setChatInitialPrompt(prompt);
    setIsChatOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bento-bg dark:bg-bento-darkBg text-bento-text dark:text-bento-darkText font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenChat={() => {
          setChatInitialPrompt(undefined);
          setIsChatOpen(true);
        }} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Topbar */}
        <Topbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenChat={() => {
            setChatInitialPrompt(undefined);
            setIsChatOpen(true);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-6 pb-12 space-y-6">
          
          {loading && !kpis ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-bento-muted text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-brand-indigo" />
              <span>Connecting to CockroachDB and computing real-time metrics...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* AI Executive Summary Card */}
                  <ExecutiveSummaryCard 
                    summary={aiSummary} 
                    onAskAi={handleOpenAiWithPrompt} 
                  />

                  {/* Row 1: 4 KPI Cards */}
                  {kpis && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KpiCard data={kpis.gmv} iconType="gmv" />
                      <KpiCard data={kpis.orders} iconType="orders" />
                      <KpiCard data={kpis.customers} iconType="customers" />
                      <KpiCard data={kpis.products_sold} iconType="products" />
                    </div>
                  )}

                  {/* Row 2: Customer Habits Bar Chart & Product Donut Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <CustomerHabitsChart data={timeseries} />
                    </div>
                    <div>
                      <CategoryDonutChart data={categories} />
                    </div>
                  </div>

                  {/* Row 3: Geo Growth Map & AI Quick Box */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <GeoGrowthChart data={geo} />
                    </div>
                    <div>
                      <AiQuickBox 
                        usage={aiUsage} 
                        onExpand={() => setIsUsageDrawerOpen(true)} 
                      />
                    </div>
                  </div>

                  {/* Row 4: Top Performing SKUs & Recent Orders */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TopProductsTable
                      products={topProducts}
                      onSelectProduct={(pid) => setSelectedProductId(pid)}
                      onViewAll={() => setActiveTab('products')}
                    />
                    <RecentOrdersTable
                      orders={recentOrders}
                      onViewAll={() => setActiveTab('orders')}
                    />
                  </div>

                </div>
              )}

              {/* TAB 2: LIVE PRODUCT EXPLORER */}
              {activeTab === 'products' && (
                <div className="animate-in fade-in duration-200">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-bento-text dark:text-bento-darkText">
                      Live Product Explorer
                    </h2>
                    <p className="text-xs text-bento-muted mt-0.5">
                      Explore 32,951 catalog SKUs with live margins, sales velocity, and category rankings
                    </p>
                  </div>
                  <ProductList
                    onSelectProduct={(pid) => setSelectedProductId(pid)}
                    onCompareProducts={(pids) => setCompareProductIds(pids)}
                  />
                </div>
              )}

              {/* TAB 3: ORDERS LEDGER */}
              {activeTab === 'orders' && (
                <div className="animate-in fade-in duration-200">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-bento-text dark:text-bento-darkText">
                      Enterprise Order Ledger
                    </h2>
                    <p className="text-xs text-bento-muted mt-0.5">
                      99,441 verified order fulfillment states across Brazil
                    </p>
                  </div>
                  <RecentOrdersTable
                    orders={recentOrders}
                    onViewAll={() => {}}
                  />
                </div>
              )}

              {/* TAB 4: PDF REPORT OVERVIEW */}
              {activeTab === 'report' && (
                <div className="bg-bento-card dark:bg-bento-darkCard rounded-bento p-8 shadow-bento border border-white/70 dark:border-bento-darkBorder text-center max-w-2xl mx-auto my-12 animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo flex items-center justify-center mx-auto mb-4 shadow-bento-hero">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-bento-text dark:text-bento-darkText">
                    Download Enterprise PDF Dossier
                  </h3>
                  <p className="text-xs text-bento-muted mt-2 max-w-md mx-auto">
                    Generates a multi-page publication-grade PDF report compiled server-side via ReportLab, containing macro KPI scorecards, category splits, top SKUs, and strategic AI insights.
                  </p>
                  <button
                    onClick={() => api.downloadPdfReport()}
                    className="mt-6 px-6 py-3 rounded-xl bg-brand-indigo hover:bg-brand-indigoDark text-white text-xs font-bold shadow-bento-hero transition-bento"
                  >
                    Generate & Download PDF Dossier
                  </button>
                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectProduct={(pid) => setSelectedProductId(pid)}
      />

      {/* AI Chat Slide-Over Panel */}
      <AiChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialPrompt={chatInitialPrompt}
      />

      {/* AI Usage & Budget Drawer */}
      <UsageDrawer
        isOpen={isUsageDrawerOpen}
        onClose={() => setIsUsageDrawerOpen(false)}
        usage={aiUsage}
      />

      {/* Live Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAskAi={handleOpenAiWithPrompt}
      />

      {/* Product Compare Modal */}
      <ProductCompareModal
        productIds={compareProductIds}
        onClose={() => setCompareProductIds([])}
        onSelectProduct={(pid) => setSelectedProductId(pid)}
      />

    </div>
  );
};
