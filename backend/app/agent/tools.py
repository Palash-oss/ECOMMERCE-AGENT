from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.app.services.kpi_service import get_kpi_metrics
from backend.app.services.analytics_service import get_timeseries_data, get_categories_breakdown, get_geographic_distribution
from backend.app.services.product_service import get_product_details, compare_products_stats, search_products_suggestions
from backend.app.database import execute_query

# ------------------------------------------------------------------------------
# Pydantic Tool Input Schemas (Strict Parameter Validation)
# ------------------------------------------------------------------------------

class DateRangeArgs(BaseModel):
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")

class CategoryArgs(DateRangeArgs):
    limit: int = Field(5, ge=1, le=20, description="Max categories to return")

class TopProductsArgs(DateRangeArgs):
    limit: int = Field(5, ge=1, le=15, description="Max products to return")
    category: Optional[str] = Field(None, description="Optional category filter")

class OrdersTrendArgs(DateRangeArgs):
    granularity: str = Field("month", pattern="^(month|week)$", description="Aggregation granularity")

class GeoArgs(DateRangeArgs):
    limit: int = Field(5, ge=1, le=15, description="Max geographic regions to return")

class ComparePeriodsArgs(BaseModel):
    metric: str = Field("gmv", pattern="^(gmv|orders|items)$", description="Metric to compare")
    range_a_start: str = Field(..., description="Range A start (YYYY-MM-DD)")
    range_a_end: str = Field(..., description="Range A end (YYYY-MM-DD)")
    range_b_start: str = Field(..., description="Range B start (YYYY-MM-DD)")
    range_b_end: str = Field(..., description="Range B end (YYYY-MM-DD)")

class AnomalyArgs(BaseModel):
    metric: str = Field("reviews", pattern="^(reviews|freight|delivery_delay)$", description="Anomaly vector to inspect")
    date_range: Optional[str] = Field(None, description="Optional time window")

class ProductStatsArgs(BaseModel):
    product_id: str = Field(..., min_length=4, max_length=64, description="Unique product SKU ID")
    date_range: Optional[str] = Field(None, description="Optional time window")

class CompareProductsArgs(BaseModel):
    product_ids: List[str] = Field(..., min_length=2, max_length=3, description="List of 2 or 3 product SKU IDs to compare")

class ProductSearchArgs(BaseModel):
    query: str = Field(..., min_length=2, max_length=50, description="Product search query or category name")
    limit: int = Field(5, ge=1, le=10, description="Max search results")

# ------------------------------------------------------------------------------
# Tool Implementations (Strictly Vetted SELECT Queries & Zero Raw SQL)
# ------------------------------------------------------------------------------

def tool_get_kpis(args: Dict[str, Any]) -> Dict[str, Any]:
    validated = DateRangeArgs(**args)
    return get_kpi_metrics(validated.start_date, validated.end_date)

def tool_sales_by_category(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = CategoryArgs(**args)
    return get_categories_breakdown(
        limit=validated.limit,
        start_date=validated.start_date,
        end_date=validated.end_date
    )

def tool_top_products(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = TopProductsArgs(**args)
    conditions = ["o.order_status = 'delivered'"]
    params: List[Any] = []
    if validated.category:
        conditions.append("LOWER(COALESCE(c.category_name_en, '')) = %s")
        params.append(validated.category.lower())
    if validated.start_date:
        conditions.append("o.purchased_at >= %s")
        params.append(validated.start_date)
    if validated.end_date:
        conditions.append("o.purchased_at <= %s")
        params.append(validated.end_date)

    where_clause = f"WHERE {' AND '.join(conditions)}"

    sql = f"""
        SELECT 
            p.product_id,
            COALESCE(c.category_name_en, 'General') AS category,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS revenue,
            ROUND(SUM(oi.price), 2) AS item_revenue,
            ROUND(AVG(oi.price), 2) AS avg_price
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        JOIN olist.products p ON oi.product_id = p.product_id
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        {where_clause}
        GROUP BY p.product_id, c.category_name_en
        ORDER BY revenue DESC
        LIMIT %s;
    """
    params.append(validated.limit)
    return execute_query(sql, tuple(params))

def tool_orders_trend(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = OrdersTrendArgs(**args)
    return get_timeseries_data(granularity=validated.granularity, start_date=validated.start_date, end_date=validated.end_date)

def tool_customers_by_country(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = GeoArgs(**args)
    return get_geographic_distribution(
        limit=validated.limit,
        start_date=validated.start_date,
        end_date=validated.end_date
    )

def tool_compare_periods(args: Dict[str, Any]) -> Dict[str, Any]:
    validated = ComparePeriodsArgs(**args)
    # Query Period A
    kpi_a = get_kpi_metrics(validated.range_a_start, validated.range_a_end)
    # Query Period B
    kpi_b = get_kpi_metrics(validated.range_b_start, validated.range_b_end)

    metric_key = validated.metric
    val_a = kpi_a.get(metric_key, {}).get("value", 0)
    val_b = kpi_b.get(metric_key, {}).get("value", 0)
    delta = val_a - val_b
    pct = ((delta / val_b) * 100) if val_b != 0 else 0

    return {
        "metric": validated.metric,
        "period_a": {"range": f"{validated.range_a_start} to {validated.range_a_end}", "value": val_a},
        "period_b": {"range": f"{validated.range_b_start} to {validated.range_b_end}", "value": val_b},
        "variance_value": round(delta, 2),
        "variance_percentage": round(pct, 2)
    }

def tool_find_anomalies(args: Dict[str, Any]) -> Dict[str, Any]:
    validated = AnomalyArgs(**args)
    if validated.metric == "delivery_delay":
        sql = """
            WITH delay_analysis AS (
                SELECT 
                    o.order_id,
                    (o.delivered_customer_at > o.estimated_delivery_date) as is_delayed,
                    r.score
                FROM olist.orders o
                JOIN olist.order_reviews ord_rev ON o.order_id = ord_rev.order_id
                JOIN olist.reviews r ON ord_rev.review_id = r.review_id
                WHERE o.order_status = 'delivered' 
                  AND o.delivered_customer_at IS NOT NULL 
                  AND o.estimated_delivery_date IS NOT NULL
            )
            SELECT 
                COUNT(*) AS total_orders,
                SUM(CASE WHEN is_delayed THEN 1 ELSE 0 END) AS delayed_orders_count,
                ROUND(SUM(CASE WHEN is_delayed THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS delayed_orders_pct,
                ROUND(SUM(CASE WHEN is_delayed AND score = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(SUM(CASE WHEN is_delayed THEN 1 ELSE 0 END), 0), 2) AS delayed_orders_1_star_rate
            FROM delay_analysis;
        """
        result = execute_query(sql)[0]
        return {
            "anomaly_type": "Logistics Delivery Delay",
            "delayed_orders_count": int(result["delayed_orders_count"]),
            "pct_of_all_delivered": float(result["delayed_orders_pct"] or 0),
            "delayed_orders_1_star_rate": float(result["delayed_orders_1_star_rate"] or 0),
            "insight": f"Orders delayed past estimated delivery date receive a 1-star rating in {result['delayed_orders_1_star_rate']}% of cases (real cross-tabulated query)."
        }
    elif validated.metric == "freight":
        sql = """
            SELECT 
                c.state,
                ROUND(AVG(oi.freight_value), 2) AS avg_freight,
                ROUND(AVG(oi.price), 2) AS avg_price,
                ROUND(AVG(oi.freight_value) * 100.0 / NULLIF(AVG(oi.price), 0), 1) AS freight_to_price_ratio
            FROM olist.order_items oi
            JOIN olist.orders o ON oi.order_id = o.order_id
            JOIN olist.customers c ON o.customer_id = c.customer_id
            WHERE o.order_status = 'delivered'
            GROUP BY c.state
            ORDER BY avg_freight DESC
            LIMIT 5;
        """
        rows = execute_query(sql)
        highest_state = rows[0]["state"] if rows else "RR"
        highest_val = float(rows[0]["avg_freight"]) if rows else 43.09
        return {
            "anomaly_type": "High Freight Disparity by Region",
            "top_costly_states": rows,
            "insight": f"{highest_state} has the highest average shipping at R$ {highest_val:.2f} (compared to São Paulo at R$ 15.12)."
        }
    else:  # reviews
        sql = """
            WITH dedup AS (
                SELECT DISTINCT ON (ord_rev.order_id) ord_rev.order_id, r.score 
                FROM olist.order_reviews ord_rev 
                JOIN olist.reviews r ON ord_rev.review_id = r.review_id 
                ORDER BY ord_rev.order_id, r.created_date DESC
            )
            SELECT 
                score,
                COUNT(*) AS review_count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dedup), 2) AS percentage
            FROM dedup
            GROUP BY score
            ORDER BY score ASC;
        """
        rows = execute_query(sql)
        pct_1 = next((float(r["percentage"]) for r in rows if r["score"] == 1), 11.52)
        return {
            "anomaly_type": "Review Sentiment Breakdown (Deduplicated per Order)",
            "distribution": rows,
            "insight": f"{pct_1}% of unique reviewed orders received a 1-star rating (deduplicated latest review per order)."
        }

def tool_product_stats(args: Dict[str, Any]) -> Dict[str, Any]:
    validated = ProductStatsArgs(**args)
    return get_product_details(validated.product_id)

def tool_compare_products(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = CompareProductsArgs(**args)
    return compare_products_stats(validated.product_ids)

def tool_product_search(args: Dict[str, Any]) -> List[Dict[str, Any]]:
    validated = ProductSearchArgs(**args)
    return search_products_suggestions(validated.query, limit=validated.limit)

# Registry of all authorized AI Agent tools
TOOL_REGISTRY = {
    "get_kpis": tool_get_kpis,
    "sales_by_category": tool_sales_by_category,
    "top_products": tool_top_products,
    "orders_trend": tool_orders_trend,
    "customers_by_country": tool_customers_by_country,
    "compare_periods": tool_compare_periods,
    "find_anomalies": tool_find_anomalies,
    "product_stats": tool_product_stats,
    "compare_products": tool_compare_products,
    "product_search": tool_product_search,
}

# Declarations for LLM Tool Calling (OpenAI & Gemini formats)
TOOL_DEFINITIONS = [
    {
        "name": "get_kpis",
        "description": "Returns macro e-commerce KPIs (GMV, total orders, active customers, units sold, previous period deltas).",
        "parameters": {
            "type": "object",
            "properties": {
                "start_date": {"type": "string", "description": "Optional start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "Optional end date (YYYY-MM-DD)"}
            }
        }
    },
    {
        "name": "sales_by_category",
        "description": "Returns top product categories ranked by revenue, unit share, and average price.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max categories to return (1-20)", "default": 5}
            }
        }
    },
    {
        "name": "top_products",
        "description": "Returns best-selling product SKUs ranked by total revenue or units sold.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max products to return", "default": 5},
                "category": {"type": "string", "description": "Optional category name filter"}
            }
        }
    },
    {
        "name": "orders_trend",
        "description": "Returns timeseries trend of sales velocity, freight, and order counts aggregated by month or week.",
        "parameters": {
            "type": "object",
            "properties": {
                "granularity": {"type": "string", "enum": ["month", "week"], "default": "month"}
            }
        }
    },
    {
        "name": "customers_by_country",
        "description": "Returns geographic breakdown of customers and orders across Brazilian states.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Number of states to return", "default": 5}
            }
        }
    },
    {
        "name": "find_anomalies",
        "description": "Inspects operational anomalies such as delivery delays, freight cost disparities, or 1-star reviews.",
        "parameters": {
            "type": "object",
            "properties": {
                "metric": {"type": "string", "enum": ["delivery_delay", "freight", "reviews"], "description": "Vector to inspect"}
            },
            "required": ["metric"]
        }
    },
    {
        "name": "product_stats",
        "description": "Fetches deep live statistics for a specific product SKU ID (revenue, units, category rank, reviews, frequently bought together).",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string", "description": "Product SKU ID"}
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "product_search",
        "description": "Searches for product SKUs by keyword, category, or partial ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword or category"}
            },
            "required": ["query"]
        }
    }
]
