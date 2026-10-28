import {
  OverviewKpis, TimeseriesPoint, CategoryBreakdown, GeoRegion,
  ProductItem, ProductDetail, OrderItem, AiUsageStats, ExecutiveSummary
} from '../types';

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '60';
      throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.detail || err.error || 'Network error occurred');
  }
  return res.json();
}

export const api = {
  // Overview
  async getKpis(startDate?: string, endDate?: string): Promise<OverviewKpis> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/overview/kpis?${params.toString()}`);
    return handleResponse<OverviewKpis>(res);
  },

  async getTimeseries(granularity = 'month'): Promise<TimeseriesPoint[]> {
    const res = await fetch(`${BASE_URL}/overview/timeseries?granularity=${granularity}`);
    return handleResponse<TimeseriesPoint[]>(res);
  },

  async getCategories(limit = 10): Promise<CategoryBreakdown[]> {
    const res = await fetch(`${BASE_URL}/overview/categories?limit=${limit}`);
    return handleResponse<CategoryBreakdown[]>(res);
  },

  async getGeo(limit = 10): Promise<GeoRegion[]> {
    const res = await fetch(`${BASE_URL}/overview/geo?limit=${limit}`);
    return handleResponse<GeoRegion[]>(res);
  },

  // Products
  async searchSuggestions(q: string): Promise<Array<{ product_id: string; title: string; category: string; price: number; total_sales: number; photos_qty: number }>> {
    const res = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(q)}`);
    return handleResponse(res);
  },

  async getProducts(params: {
    search?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: ProductItem[]; page: number; page_size: number; total_items: number; total_pages: number }> {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category && params.category !== 'all') q.append('category', params.category);
    if (params.min_price !== undefined) q.append('min_price', params.min_price.toString());
    if (params.max_price !== undefined) q.append('max_price', params.max_price.toString());
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());

    const res = await fetch(`${BASE_URL}/products?${q.toString()}`);
    return handleResponse(res);
  },

  async getProductDetail(productId: string): Promise<ProductDetail> {
    const res = await fetch(`${BASE_URL}/products/${productId}`);
    return handleResponse<ProductDetail>(res);
  },

  async compareProducts(productIds: string[]): Promise<ProductDetail[]> {
    const res = await fetch(`${BASE_URL}/products/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds })
    });
    return handleResponse<ProductDetail[]>(res);
  },

  // Orders
  async getOrders(params: { status?: string; page?: number; page_size?: number }): Promise<{ items: OrderItem[]; total_items: number; page: number; total_pages: number }> {
    const q = new URLSearchParams();
    if (params.status && params.status !== 'all') q.append('status', params.status);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());

    const res = await fetch(`${BASE_URL}/orders?${q.toString()}`);
    return handleResponse(res);
  },

  // Agent
  async getAiUsage(): Promise<AiUsageStats> {
    const res = await fetch(`${BASE_URL}/agent/usage`);
    return handleResponse<AiUsageStats>(res);
  },

  async getAiSummary(): Promise<ExecutiveSummary> {
    const res = await fetch(`${BASE_URL}/agent/summary`);
    return handleResponse<ExecutiveSummary>(res);
  },

  async getAiSuggestions(): Promise<{ suggestions: string[] }> {
    const res = await fetch(`${BASE_URL}/agent/suggestions`);
    return handleResponse(res);
  },

  // Server-Side PDF Download
  async downloadPdfReport(startDate?: string, endDate?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/report/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
    if (!res.ok) throw new Error('PDF generation failed on server');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexusCommerce_Executive_Dossier_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
