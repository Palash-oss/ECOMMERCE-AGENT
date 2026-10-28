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
  async getKpis(startDate?: string, endDate?: string, status: string = 'delivered'): Promise<OverviewKpis> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (status) params.append('status', status);
    const res = await fetch(`${BASE_URL}/overview/kpis?${params.toString()}`, {
      credentials: 'include'
    });
    return handleResponse<OverviewKpis>(res);
  },

  async getTimeseries(granularity = 'month', startDate?: string, endDate?: string, status: string = 'delivered'): Promise<TimeseriesPoint[]> {
    const params = new URLSearchParams({ granularity, status });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/overview/timeseries?${params.toString()}`, {
      credentials: 'include'
    });
    return handleResponse<TimeseriesPoint[]>(res);
  },

  async getCategories(limit = 10, startDate?: string, endDate?: string, status: string = 'delivered'): Promise<CategoryBreakdown[]> {
    const params = new URLSearchParams({ limit: limit.toString(), status });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/overview/categories?${params.toString()}`, {
      credentials: 'include'
    });
    return handleResponse<CategoryBreakdown[]>(res);
  },

  async getGeo(limit = 10, startDate?: string, endDate?: string, status: string = 'delivered'): Promise<GeoRegion[]> {
    const params = new URLSearchParams({ limit: limit.toString(), status });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/overview/geo?${params.toString()}`, {
      credentials: 'include'
    });
    return handleResponse<GeoRegion[]>(res);
  },

  // Products
  async getCategoryTiles(): Promise<Array<{
    category: string;
    category_pt: string;
    sku_count: number;
    units_sold: number;
    total_revenue: number;
    avg_price: number;
  }>> {
    const res = await fetch(`${BASE_URL}/products/categories/summary`, {
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async searchSuggestions(q: string): Promise<Array<{ product_id: string; title: string; category: string; price: number; total_sales: number; photos_qty: number }>> {
    const res = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include'
    });
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

    const res = await fetch(`${BASE_URL}/products?${q.toString()}`, {
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async getProductDetail(productId: string): Promise<ProductDetail> {
    const res = await fetch(`${BASE_URL}/products/${productId}`, {
      credentials: 'include'
    });
    return handleResponse<ProductDetail>(res);
  },

  async compareProducts(productIds: string[]): Promise<ProductDetail[]> {
    const res = await fetch(`${BASE_URL}/products/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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

    const res = await fetch(`${BASE_URL}/orders?${q.toString()}`, {
      credentials: 'include'
    });
    return handleResponse(res);
  },

  // Agent
  async getAiUsage(): Promise<AiUsageStats> {
    const res = await fetch(`${BASE_URL}/agent/usage`, {
      credentials: 'include'
    });
    return handleResponse<AiUsageStats>(res);
  },

  async getAiSummary(startDate?: string, endDate?: string): Promise<ExecutiveSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/agent/summary?${params.toString()}`, {
      credentials: 'include'
    });
    return handleResponse<ExecutiveSummary>(res);
  },

  async getAiSuggestions(): Promise<{ suggestions: string[] }> {
    const res = await fetch(`${BASE_URL}/agent/suggestions`, {
      credentials: 'include'
    });
    return handleResponse(res);
  },

  // Server-Side PDF Download with Robust Validation & Error Handling
  async downloadPdfReport(startDate?: string, endDate?: string, status: string = 'delivered'): Promise<void> {
    const res = await fetch(`${BASE_URL}/report/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ start_date: startDate, end_date: endDate, status })
    });

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After') || '60';
        throw new Error(`Rate limit exceeded for report generation. Retry in ${retryAfter}s.`);
      }
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.detail || err.error || `Server report error (HTTP ${res.status})`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      const errText = await res.text();
      throw new Error(`Unexpected non-PDF response from server: ${errText.slice(0, 100)}`);
    }

    // Extract filename from Content-Disposition or fallback to timestamped title
    let filename = `NexusCommerce_Executive_Dossier_${new Date().toISOString().split('T')[0]}.pdf`;
    const disposition = res.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename=["']?([^"';\n]+)["']?/i);
      if (match && match[1]) {
        filename = match[1].trim().replace(/['"]/g, '');
      }
    }
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }

    const rawBlob = await res.blob();
    const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(pdfBlob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();

    // Delay revocation so Chromium download manager completely initiates the download stream
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 10000);
  }
};
