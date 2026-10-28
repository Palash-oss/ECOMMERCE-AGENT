export interface KpiMetric {
  title: string;
  value: number;
  formatted: string;
  compact?: string;
  item_revenue?: number;
  freight_value?: number;
  previous_value: number | null;
  delta: {
    percentage: number;
    direction: 'positive' | 'negative' | 'neutral';
    has_data?: boolean;
  } | null;
  sparkline: number[];
  is_hero: boolean;
  note?: string;
  repeat_buyers?: number;
  repeat_buyer_rate?: number;
  all_statuses_total?: number;
  reconciliation_subtitle?: string;
  aov?: number;
  aov_formatted?: string;
  avg_item_price?: number;
}

export interface OverviewKpis {
  reporting_window?: {
    start_date: string;
    end_date: string;
    status_filter: string;
    has_valid_prior: boolean;
    prior_start: string | null;
    prior_end: string | null;
    all_orders_count: number;
  };
  gmv: KpiMetric;
  orders: KpiMetric;
  customers: KpiMetric;
  products_sold: KpiMetric;
}

export interface TimeseriesPoint {
  period: string;
  display_name: string;
  sales: number;
  freight: number;
  total_gmv: number;
  orders: number;
  items: number;
}

export interface CategoryBreakdown {
  category: string;
  category_pt: string;
  units_sold: number;
  revenue: number;
  avg_price: number;
  share_pct: number;
}

export interface GeoRegion {
  state_code: string;
  state_name: string;
  country: string;
  country_code: string;
  customers: number;
  orders: number;
  total_revenue: number;
  avg_freight: number;
}

export interface ProductItem {
  product_id: string;
  title: string;
  category: string;
  category_pt?: string;
  price: number;
  total_revenue: number;
  units_sold: number;
  velocity_tier: string;
  photos_qty: number;
  weight_g: number;
  dimensions_cm?: string;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
}

export interface ProductDetail extends ProductItem {
  avg_price: number;
  avg_freight: number;
  category_rank: number;
  dimensions: string;
  monthly_trend: Array<{ month_label: string; units: number; revenue: number }>;
  frequently_bought_together: Array<{
    product_id: string;
    title: string;
    co_occurrence_count: number;
    price: number;
  }>;
  recent_reviews: Array<{
    score: number;
    title: string;
    comment: string;
    date: string;
  }>;
}

export interface OrderItem {
  order_id: string;
  raw_order_id: string;
  customer_id: string;
  status: string;
  purchased_at: string;
  delivered_at: string | null;
  city: string;
  state: string;
  items_count: number;
  total_value: number;
}

export interface AiUsageStats {
  user_id: string;
  requests_today: number;
  tokens_used_today: number;
  daily_budget_tokens: number;
  budget_used_pct: number;
  estimated_cost_today_usd: number;
  estimated_cost_month_usd: number;
  monthly_spend_cap_usd: number;
  rate_limit_per_minute: number;
  provider_in_use: string;
}

export interface ExecutiveSummary {
  headline: string;
  date_range: string;
  insights: string[];
  risks: string[];
  actions: string[];
}
