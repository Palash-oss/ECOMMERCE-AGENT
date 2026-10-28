from typing import Dict, Any, List, Optional
from backend.app.database import execute_query
from backend.app.cache import cache

def get_timeseries_data(
    granularity: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = "anon"
) -> List[Dict[str, Any]]:
    """
    Computes sales velocity across time using DATE_TRUNC in SQL.
    Returns merchandise sales, freight revenue, and orders count.
    """
    cache_key = cache._generate_key("timeseries", user_id, {"gran": granularity, "start": start_date, "end": end_date})
    cached = cache.get(cache_key)
    if cached:
        return cached

    trunc_unit = "month" if granularity == "month" else "week"
    sql = f"""
        SELECT 
            TO_CHAR(DATE_TRUNC('{trunc_unit}', o.purchased_at), 'YYYY-MM-DD') AS period,
            TO_CHAR(DATE_TRUNC('{trunc_unit}', o.purchased_at), 'Mon YY') AS display_name,
            ROUND(SUM(oi.price), 2) AS sales,
            ROUND(SUM(oi.freight_value), 2) AS freight,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS total_gmv,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(oi.order_item_id) AS items
        FROM olist.orders o
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        WHERE o.order_status = 'delivered'
        GROUP BY DATE_TRUNC('{trunc_unit}', o.purchased_at)
        ORDER BY DATE_TRUNC('{trunc_unit}', o.purchased_at) ASC;
    """
    rows = execute_query(sql)
    cache.set(cache_key, rows, ttl=300)  # 5 min TTL
    return rows

def get_categories_breakdown(limit: int = 10, user_id: str = "anon") -> List[Dict[str, Any]]:
    """Fetches top product categories ranked by total GMV revenue."""
    cache_key = cache._generate_key("categories", user_id, {"limit": limit})
    cached = cache.get(cache_key)
    if cached:
        return cached

    sql = """
        SELECT 
            COALESCE(c.category_name_en, 'Other') AS category,
            COALESCE(c.category_name_pt, 'Outros') AS category_pt,
            COUNT(oi.order_item_id) AS units_sold,
            ROUND(SUM(oi.price), 2) AS revenue,
            ROUND(AVG(oi.price), 2) AS avg_price,
            ROUND(SUM(oi.price) * 100.0 / NULLIF((SELECT SUM(price) FROM olist.order_items), 0), 2) AS share_pct
        FROM olist.order_items oi
        JOIN olist.products p ON oi.product_id = p.product_id
        LEFT JOIN olist.product_categories c ON p.category_id = c.category_id
        GROUP BY c.category_name_en, c.category_name_pt
        ORDER BY revenue DESC
        LIMIT %s;
    """
    rows = execute_query(sql, (limit,))
    cache.set(cache_key, rows, ttl=300)
    return rows

def get_geographic_distribution(limit: int = 10, user_id: str = "anon") -> List[Dict[str, Any]]:
    """Computes customer hubs and order concentration across Brazilian states."""
    cache_key = cache._generate_key("geo", user_id, {"limit": limit})
    cached = cache.get(cache_key)
    if cached:
        return cached

    STATE_NAMES = {
        "SP": "São Paulo", "RJ": "Rio de Janeiro", "MG": "Minas Gerais",
        "RS": "Rio Grande do Sul", "PR": "Paraná", "SC": "Santa Catarina",
        "BA": "Bahia", "DF": "Distrito Federal", "GO": "Goiás", "PE": "Pernambuco",
        "ES": "Espírito Santo", "CE": "Ceará", "PA": "Pará", "MT": "Mato Grosso"
    }

    sql = """
        SELECT 
            c.state,
            COUNT(DISTINCT c.customer_unique_id) AS customers,
            COUNT(DISTINCT o.order_id) AS orders,
            ROUND(SUM(oi.price + oi.freight_value), 2) AS total_revenue,
            ROUND(AVG(oi.freight_value), 2) AS avg_freight
        FROM olist.customers c
        JOIN olist.orders o ON c.customer_id = o.customer_id
        JOIN olist.order_items oi ON o.order_id = oi.order_id
        WHERE o.order_status = 'delivered'
        GROUP BY c.state
        ORDER BY total_revenue DESC
        LIMIT %s;
    """
    rows = execute_query(sql, (limit,))
    enriched = []
    for r in rows:
        st = r["state"]
        enriched.append({
            "state_code": st,
            "state_name": STATE_NAMES.get(st, st),
            "country": "Brazil",
            "country_code": "BR",
            "customers": int(r["customers"]),
            "orders": int(r["orders"]),
            "total_revenue": float(r["total_revenue"] or 0),
            "avg_freight": float(r["avg_freight"] or 0)
        })

    cache.set(cache_key, enriched, ttl=300)
    return enriched
